// GMR CRM - RAG Document Ingestion & Storage Service
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const BUCKET_NAME = 'rag-documents';

// UUID validation regex (RFC 4122)
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (val) => {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
};

export const DOCUMENT_TYPES = [
  { value: 'syllabus', label: 'Curriculum & Syllabus' },
  { value: 'pyq', label: 'Previous Year Questions (PYQ)' },
  { value: 'notes', label: 'Faculty Lecture Notes' },
  { value: 'textbook', label: 'Reference Textbook' },
  { value: 'reference', label: 'Quick Reference Guide' },
  { value: 'other', label: 'Other Academic Material' }
];

class RagDocumentService {
  /**
   * Validate uploaded file constraints (PDF only, <= 50MB, non-empty)
   */
  validatePdfFile(file) {
    if (!file) {
      return { valid: false, error: 'Please select a document file to upload.' };
    }

    // 1. Check file size
    if (file.size <= 0) {
      return { valid: false, error: 'The selected file is empty (0 bytes).' };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 50 MB.`
      };
    }

    // 2. Check MIME type and extension
    const fileName = file.name || '';
    const isPdfExtension = fileName.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === '';

    if (!isPdfExtension || (!isPdfMime && file.type)) {
      return {
        valid: false,
        error: 'Only PDF documents (.pdf) are supported for RAG ingestion.'
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Generate deterministic, safe storage path:
   * Format: {department_code}/{subject_id}/{document_type}/{uuid}.pdf
   */
  generateStoragePath(departmentCode, subjectId, documentType, originalFileName) {
    const cleanDept = (departmentCode || 'GENERAL').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
    const cleanSubj = (subjectId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanType = (documentType || 'other').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    // Generate secure random UUID suffix
    let randomUuid;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      randomUuid = crypto.randomUUID();
    } else {
      randomUuid = 'doc_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    }

    return `${cleanDept}/${cleanSubj}/${cleanType}/${randomUuid}.pdf`;
  }

  /**
   * Primary RAG Document Upload Pipeline
   * 1. Validates PDF constraints
   * 2. Validates Department UUID and Subject UUID (No mock IDs permitted)
   * 3. Verifies active authenticated Supabase session
   * 4. Uploads to private Storage bucket 'rag-documents'
   * 5. Inserts record into public.rag_documents
   * 6. Creates initial tracking job in public.rag_ingestion_jobs
   * 7. Performs cleanup/rollback on failure
   */
  async uploadDocument({
    file,
    title,
    description = '',
    documentType = 'syllabus',
    departmentId = null,
    departmentCode = 'CSE',
    subjectId = null,
    semester = 'Semester 4',
    academicYear = '2025-2026'
  }) {
    // 1. Validate File
    const fileValidation = this.validatePdfFile(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.error);
    }

    // 2. Validate Title
    if (!title || !title.trim()) {
      throw new Error('Validation Error: Please provide a descriptive document title.');
    }
    const cleanTitle = title.trim();

    // 3. Validate Document Type
    const validDocTypes = DOCUMENT_TYPES.map(t => t.value);
    if (!validDocTypes.includes(documentType)) {
      throw new Error(`Validation Error: Invalid document type "${documentType}". Permitted types: ${validDocTypes.join(', ')}.`);
    }

    // 4. Validate Department ID (Must be real UUID, not mock string)
    if (!departmentId || !isValidUuid(departmentId)) {
      throw new Error(`Validation Error: Invalid Department ID "${departmentId}". A valid UUID from the Supabase departments table is required. Mock IDs (e.g. 'dept_cse') are not permitted.`);
    }

    // 5. Validate Subject ID (If provided, must be real UUID)
    if (subjectId && !isValidUuid(subjectId)) {
      throw new Error(`Validation Error: Invalid Subject ID "${subjectId}". A valid UUID from the Supabase subjects table is required. Mock IDs (e.g. 'sub_ml_101') are not permitted.`);
    }

    // 6. Verify Supabase Configuration
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
    }

    // 7. Verify Authenticated Session
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (authErr || !authUser) {
      throw new Error('Authentication Required: No active Supabase session found. Please log in with your verified Administrator account.');
    }

    const uploadedBy = authUser.id;
    if (!isValidUuid(uploadedBy)) {
      throw new Error(`Authentication Error: Authenticated user ID "${uploadedBy}" is not a valid UUID.`);
    }

    const sanitizedFileName = (file.name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = this.generateStoragePath(departmentCode, subjectId, documentType, sanitizedFileName);

    // Safe Development Logging (Never logging secrets, tokens, or passwords)
    console.log('[RAG Upload] Starting document ingestion pipeline:', {
      fileName: file.name,
      fileSize: file.size,
      documentType,
      departmentId,
      departmentCode,
      subjectId: subjectId || 'null',
      authenticatedUserId: uploadedBy,
      selectedBucket: BUCKET_NAME,
      storagePath
    });

    let uploadedStoragePath = null;

    try {
      // 8. Storage Upload to private bucket 'rag-documents'
      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (storageError) {
        console.error('[RAG Upload] Storage upload failed:', {
          bucket: BUCKET_NAME,
          storagePath,
          error: storageError.message || storageError
        });
        if (storageError.message?.includes('row-level security') || storageError.message?.includes('violates row-level security')) {
          throw new Error('Storage Upload Denied by RLS: You must be authenticated as an Admin or Faculty user in Supabase Auth to upload RAG documents.');
        }
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      uploadedStoragePath = storageData?.path || storagePath;
      console.log('[RAG Upload] Storage upload SUCCEEDED:', {
        bucket: BUCKET_NAME,
        path: uploadedStoragePath
      });

      // 9. Create record in public.rag_documents
      const docPayload = {
        title: cleanTitle,
        description: description?.trim() || null,
        file_name: sanitizedFileName,
        storage_path: uploadedStoragePath,
        document_type: documentType,
        department_id: departmentId,
        subject_id: subjectId || null,
        semester: semester || 'Semester 4',
        academic_year: academicYear || '2025-2026',
        uploaded_by: uploadedBy,
        status: 'uploaded',
        metadata: {
          original_name: file.name,
          mime_type: 'application/pdf',
          file_size: file.size,
          upload_timestamp: new Date().toISOString()
        }
      };

      console.log('[RAG Upload] Inserting record into public.rag_documents:', {
        title: docPayload.title,
        storage_path: docPayload.storage_path,
        document_type: docPayload.document_type,
        department_id: docPayload.department_id,
        subject_id: docPayload.subject_id,
        uploaded_by: docPayload.uploaded_by
      });

      const { data: docRecord, error: docError } = await supabase
        .from('rag_documents')
        .insert([docPayload])
        .select('*')
        .single();

      if (docError) {
        console.error('[RAG Upload] rag_documents insert failed. Initiating storage rollback:', {
          storagePath: uploadedStoragePath,
          error: docError.message || docError
        });
        // Rollback storage file on database failure
        try {
          await supabase.storage.from(BUCKET_NAME).remove([uploadedStoragePath]);
        } catch (rollbackErr) {
          console.warn('[RAG Upload] Storage rollback notice:', rollbackErr);
        }
        throw new Error(`Database record creation failed: ${docError.message}`);
      }

      console.log('[RAG Upload] rag_documents record created successfully with ID:', docRecord.id);

      // 10. Create tracking job in public.rag_ingestion_jobs
      const jobPayload = {
        document_id: docRecord.id,
        status: 'pending',
        chunks_created: 0,
        started_at: null,
        completed_at: null
      };

      console.log('[RAG Upload] Inserting tracking job into public.rag_ingestion_jobs:', {
        document_id: jobPayload.document_id,
        status: jobPayload.status
      });

      const { data: jobRecord, error: jobError } = await supabase
        .from('rag_ingestion_jobs')
        .insert([jobPayload])
        .select('*')
        .single();

      if (jobError) {
        console.warn('[RAG Upload] Ingestion job creation notice:', {
          error: jobError.message || jobError
        });
        try {
          await supabase
            .from('rag_documents')
            .update({ status: 'failed', metadata: { ...docRecord.metadata, job_error: jobError.message } })
            .eq('id', docRecord.id);
        } catch (updateErr) {
          console.warn('[RAG Upload] Status update notice:', updateErr);
        }
      } else {
        console.log('[RAG Upload] Ingestion job created successfully with ID:', jobRecord?.id);
      }

      return {
        success: true,
        document: docRecord,
        job: jobRecord || null,
        storagePath: uploadedStoragePath,
        source: 'supabase'
      };

    } catch (err) {
      console.error('[RAG Upload] Pipeline failed with error:', err.message);
      // Clean up storage object if created
      if (uploadedStoragePath) {
        try {
          await supabase.storage.from(BUCKET_NAME).remove([uploadedStoragePath]);
        } catch (cleanupErr) {
          console.warn('[RAG Upload] Storage rollback error:', cleanupErr);
        }
      }
      throw err;
    }
  }

  /**
   * Fetch all RAG documents from Supabase rag_documents
   */
  async getDocuments() {
    if (!isSupabaseConfigured()) {
      return {
        data: [],
        source: 'local_cache',
        error: 'Supabase client is not configured'
      };
    }

    try {
      const { data, error } = await supabase
        .from('rag_documents')
        .select(`
          *,
          departments:department_id (id, name, code),
          subjects:subject_id (id, name, code),
          rag_ingestion_jobs (id, status, chunks_created, started_at, completed_at, error_message)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[RagDocumentService] Error fetching rag_documents:', error.message);
        return {
          data: [],
          source: 'supabase',
          error: error.message
        };
      }

      if (!data || data.length === 0) {
        return {
          data: [],
          source: 'supabase',
          error: null
        };
      }

      // Format records for UI consumption
      const formatted = data.map(item => {
        const latestJob = Array.isArray(item.rag_ingestion_jobs) && item.rag_ingestion_jobs.length > 0
          ? item.rag_ingestion_jobs[0]
          : null;

        const chunksCount = latestJob?.chunks_created || item.metadata?.chunks_count || 0;

        let statusType = 'info';
        let statusLabel = 'Uploaded';
        const st = (item.status || 'uploaded').toLowerCase();

        if (st === 'indexed') {
          statusType = 'success';
          statusLabel = 'Indexed';
        } else if (st === 'processing') {
          statusType = 'warning';
          statusLabel = 'Processing';
        } else if (st === 'failed') {
          statusType = 'danger';
          statusLabel = 'Failed';
        } else {
          statusType = 'info';
          statusLabel = 'Uploaded';
        }

        return {
          id: item.id,
          document: item.title || item.file_name,
          title: item.title,
          description: item.description,
          fileName: item.file_name,
          storagePath: item.storage_path,
          category: DOCUMENT_TYPES.find(t => t.value === item.document_type)?.label || item.document_type || 'Academic Material',
          documentType: item.document_type || 'syllabus',
          department: item.departments?.code || item.departments?.name || 'General',
          departmentId: item.department_id,
          subject: item.subjects?.name || item.subjects?.code || 'General Curriculum',
          subjectId: item.subject_id,
          semester: item.semester || 'Semester 4',
          academicYear: item.academic_year || '2025-2026',
          chunks: chunksCount,
          embeddingModel: 'intfloat/multilingual-e5-small (384 dim)',
          status: statusLabel,
          rawStatus: item.status,
          statusType,
          fileSizeFormatted: item.metadata?.file_size 
            ? `${(item.metadata.file_size / (1024 * 1024)).toFixed(2)} MB`
            : 'PDF Document',
          metadata: item.metadata || {},
          lastUpdated: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          createdAt: item.created_at
        };
      });

      return {
        data: formatted,
        source: 'supabase',
        error: null
      };

    } catch (err) {
      console.warn('[RagDocumentService] Fetch exception:', err);
      return {
        data: [],
        source: 'supabase',
        error: err.message
      };
    }
  }

  /**
   * Delete document: purges Storage file and removes row from rag_documents
   * (cascades to rag_chunks and rag_ingestion_jobs)
   */
  async deleteDocument(documentId, storagePath) {
    if (!isSupabaseConfigured()) {
      return { success: true, source: 'local_cache' };
    }

    try {
      // 1. Remove file from Supabase Storage if path exists
      if (storagePath) {
        const { error: storageErr } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([storagePath]);

        if (storageErr) {
          console.warn('[RagDocumentService] Notice removing file from storage:', storageErr.message);
        }
      }

      // 2. Delete database row in rag_documents (cascades to chunks & jobs)
      const { error: dbErr } = await supabase
        .from('rag_documents')
        .delete()
        .eq('id', documentId);

      if (dbErr) {
        throw new Error(`Failed to delete document from database: ${dbErr.message}`);
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Generate secure signed download URL for authorized viewing
   */
  async getDocumentDownloadUrl(storagePath) {
    if (!storagePath) return null;
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 3600); // 1 hour validity

      if (error || !data?.signedUrl) {
        console.warn('[RagDocumentService] Failed to create signed URL:', error?.message);
        return null;
      }

      return data.signedUrl;
    } catch (e) {
      console.warn('[RagDocumentService] Signed URL exception:', e);
      return null;
    }
  }

  /**
   * Fetch all stored vector chunks for a specific document
   */
  async getChunks(documentId) {
    if (!isSupabaseConfigured() || !documentId) {
      return { data: [], error: 'Invalid document ID or Supabase unconfigured' };
    }

    try {
      const { data, error } = await supabase
        .from('rag_chunks')
        .select('id, document_id, chunk_index, content, metadata, created_at')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });

      if (error) {
        console.warn('[RagDocumentService] Error fetching chunks:', error.message);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('[RagDocumentService] getChunks exception:', err);
      return { data: [], error: err.message };
    }
  }

  /**
   * Trigger document re-indexing into vector store
   */
  async reindexDocument(documentId) {
    const { ragIngestionService } = await import('./ragIngestionService.js');
    return await ragIngestionService.ingestDocument(documentId);
  }

  /**
   * Perform vector search using multilingual-e5-small embeddings
   */
  async searchSimilarChunks(params) {
    const { ragIngestionService } = await import('./ragIngestionService.js');
    return await ragIngestionService.searchSimilarChunks(params);
  }
}

export const ragDocumentService = new RagDocumentService();
export default ragDocumentService;
