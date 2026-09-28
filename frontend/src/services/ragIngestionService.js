// GMR CRM - Stage 2 RAG Ingestion & Vector Pipeline Service
// Embedding Model: intfloat/multilingual-e5-small (Dimension: 384)
// Prefix convention: 'passage: ' for document chunks, 'query: ' for search queries

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pipeline, env } from '@xenova/transformers';

// Configure transformers environment for browser and Node compatibility
env.allowLocalModels = false;
if (typeof window !== 'undefined' && typeof window.caches !== 'undefined') {
  env.useBrowserCache = true;
} else {
  env.useBrowserCache = false;
}

const BUCKET_NAME = 'rag-documents';
const MODEL_NAME = 'Xenova/multilingual-e5-small';
const EMBEDDING_DIMENSION = 384;

// Default chunking configuration
const CHUNK_CONFIG = {
  targetChunkSize: 800,  // target characters per chunk
  maxChunkSize: 1200,    // hard ceiling
  minChunkSize: 100,     // minimum meaningful length
  overlapSize: 120       // character overlap between sequential chunks
};

class RagIngestionService {
  constructor() {
    this.extractorPipeline = null;
    this.modelLoadingPromise = null;
  }

  /**
   * Lazily load and cache the embedding model pipeline
   */
  async getEmbeddingPipeline() {
    if (this.extractorPipeline) {
      return this.extractorPipeline;
    }

    if (this.modelLoadingPromise) {
      return await this.modelLoadingPromise;
    }

    this.modelLoadingPromise = (async () => {
      console.log(`[RAG Ingestion] Loading embedding model: ${MODEL_NAME}...`);
      const extractor = await pipeline('feature-extraction', MODEL_NAME, {
        quantized: true
      });
      this.extractorPipeline = extractor;
      console.log(`[RAG Ingestion] Embedding model loaded successfully (${EMBEDDING_DIMENSION} dim).`);
      return extractor;
    })();

    return await this.modelLoadingPromise;
  }

  /**
   * Generate 384-dimensional vector embedding for text
   * Uses E5 prefix conventions ('passage: ' for indexing, 'query: ' for searching)
   */
  async generateEmbedding(text, isQuery = false) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Embedding Error: Cannot generate embedding for empty text.');
    }

    const extractor = await this.getEmbeddingPipeline();
    const prefix = isQuery ? 'query: ' : 'passage: ';
    const formattedInput = `${prefix}${text.trim()}`;

    const output = await extractor(formattedInput, {
      pooling: 'mean',
      normalize: true
    });

    const vector = Array.from(output.data);
    if (vector.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Embedding Error: Expected ${EMBEDDING_DIMENSION} dimensions, got ${vector.length}.`);
    }

    return vector;
  }

  /**
   * Download binary PDF data from private Supabase Storage bucket
   */
  async downloadPdfBuffer(storagePath) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured.');
    }

    if (!storagePath) {
      throw new Error('Storage Error: Invalid or missing storagePath.');
    }

    console.log(`[RAG Ingestion] Downloading PDF from bucket "${BUCKET_NAME}" at: ${storagePath}...`);
    const { data: blob, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !blob) {
      throw new Error(`Storage Download Error: Failed to fetch PDF from ${storagePath}. ${error?.message || ''}`);
    }

    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Extract text from PDF page-by-page preserving page numbers
   */
  async extractTextByPages(pdfData) {
    console.log('[RAG Ingestion] Extracting text page-by-page with pdfjs-dist...');
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    console.log(`[RAG Ingestion] Document loaded. Total pages: ${numPages}`);

    const extractedPages = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with whitespace awareness
      let pageText = '';
      let lastY = null;

      for (const item of textContent.items) {
        if (!item.str) continue;
        
        // Check vertical line shifts
        const currentY = item.transform ? item.transform[5] : null;
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 6) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }

        pageText += item.str;
        lastY = currentY;
      }

      const cleanedPageText = this.cleanExtractedText(pageText);
      if (cleanedPageText.length > 0) {
        extractedPages.push({
          pageNumber: pageNum,
          text: cleanedPageText
        });
      }
    }

    console.log(`[RAG Ingestion] Text extracted from ${extractedPages.length} non-empty pages.`);
    return extractedPages;
  }

  /**
   * Clean and normalize raw extracted text without destroying meaningful headings/content
   */
  cleanExtractedText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    return rawText
      // Remove null bytes and binary artifacts
      .replace(/\0/g, '')
      // Normalize Unicode non-breaking and special spaces to standard space
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
      // Fix broken line hyphenations (e.g. "communi-\ncation" -> "communication")
      .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
      // Collapse redundant carriage returns
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Normalize multiple consecutive spaces within a line
      .replace(/[ \t]+/g, ' ')
      // Normalize multiple blank lines into double newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim surrounding whitespace
      .trim();
  }

  /**
   * Semantic & recursive chunking strategy
   * Splits across paragraphs, headings, and sentences while maintaining target chunk size and overlap
   */
  chunkDocument(pages, docMetadata = {}) {
    console.log('[RAG Ingestion] Chunking document text with semantic boundaries...');
    const chunks = [];
    let globalChunkIndex = 0;

    for (const page of pages) {
      const pageText = page.text;
      const pageNumber = page.pageNumber;

      if (!pageText || pageText.length < CHUNK_CONFIG.minChunkSize) {
        if (pageText && pageText.trim().length > 0) {
          chunks.push({
            chunkIndex: globalChunkIndex++,
            content: pageText.trim(),
            metadata: {
              ...docMetadata,
              page_number: pageNumber,
              chunk_index: globalChunkIndex - 1,
              char_count: pageText.trim().length,
              word_count: pageText.trim().split(/\s+/).length
            }
          });
        }
        continue;
      }

      // Split page text by paragraph breaks first
      const paragraphs = pageText.split(/\n\n+/);
      let currentChunkText = '';

      for (const para of paragraphs) {
        const cleanPara = para.trim();
        if (!cleanPara) continue;

        // If paragraph alone is larger than maxChunkSize, split by sentences
        if (cleanPara.length > CHUNK_CONFIG.maxChunkSize) {
          // Flush current chunk if accumulated
          if (currentChunkText.length >= CHUNK_CONFIG.minChunkSize) {
            chunks.push({
              chunkIndex: globalChunkIndex++,
              content: currentChunkText.trim(),
              metadata: {
                ...docMetadata,
                page_number: pageNumber,
                chunk_index: globalChunkIndex - 1,
                char_count: currentChunkText.trim().length,
                word_count: currentChunkText.trim().split(/\s+/).length
              }
            });
            // Overlap carry-over
            currentChunkText = currentChunkText.slice(-CHUNK_CONFIG.overlapSize);
          }

          // Sentence splitting
          const sentences = cleanPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [cleanPara];
          for (const sentence of sentences) {
            const cleanSent = sentence.trim();
            if (!cleanSent) continue;

            if ((currentChunkText + ' ' + cleanSent).length > CHUNK_CONFIG.targetChunkSize && currentChunkText.length >= CHUNK_CONFIG.minChunkSize) {
              chunks.push({
                chunkIndex: globalChunkIndex++,
                content: currentChunkText.trim(),
                metadata: {
                  ...docMetadata,
                  page_number: pageNumber,
                  chunk_index: globalChunkIndex - 1,
                  char_count: currentChunkText.trim().length,
                  word_count: currentChunkText.trim().split(/\s+/).length
                }
              });
              currentChunkText = currentChunkText.slice(-CHUNK_CONFIG.overlapSize) + ' ' + cleanSent;
            } else {
              currentChunkText = currentChunkText ? `${currentChunkText} ${cleanSent}` : cleanSent;
            }
          }
        } else if ((currentChunkText + '\n\n' + cleanPara).length > CHUNK_CONFIG.targetChunkSize && currentChunkText.length >= CHUNK_CONFIG.minChunkSize) {
          // Flush current chunk
          chunks.push({
            chunkIndex: globalChunkIndex++,
            content: currentChunkText.trim(),
            metadata: {
              ...docMetadata,
              page_number: pageNumber,
              chunk_index: globalChunkIndex - 1,
              char_count: currentChunkText.trim().length,
              word_count: currentChunkText.trim().split(/\s+/).length
            }
          });

          // Begin new chunk with overlap
          const overlap = currentChunkText.slice(-CHUNK_CONFIG.overlapSize).trim();
          currentChunkText = overlap ? `${overlap}\n\n${cleanPara}` : cleanPara;
        } else {
          currentChunkText = currentChunkText ? `${currentChunkText}\n\n${cleanPara}` : cleanPara;
        }
      }

      // Flush remaining text on page
      if (currentChunkText.trim().length >= CHUNK_CONFIG.minChunkSize) {
        chunks.push({
          chunkIndex: globalChunkIndex++,
          content: currentChunkText.trim(),
          metadata: {
            ...docMetadata,
            page_number: pageNumber,
            chunk_index: globalChunkIndex - 1,
            char_count: currentChunkText.trim().length,
            word_count: currentChunkText.trim().split(/\s+/).length
          }
        });
      }
    }

    console.log(`[RAG Ingestion] Generated ${chunks.length} semantic chunks.`);
    return chunks;
  }

  /**
   * Complete End-to-End Ingestion Pipeline for a document:
   * 1. Retrieve document metadata
   * 2. Set job status: 'processing', document status: 'processing'
   * 3. Download PDF from storage
   * 4. Extract text page-by-page
   * 5. Clean & chunk text
   * 6. Generate 384-dim embeddings with 'passage: ' prefix
   * 7. Idempotently clear prior chunks & insert new chunks into public.rag_chunks
   * 8. Set job status: 'completed' & document status: 'indexed'
   */
  async ingestDocument(documentId) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured.');
    }

    if (!documentId) {
      throw new Error('Ingestion Error: documentId is required.');
    }

    console.log(`===============================================================`);
    console.log(`  [RAG Ingestion] Starting Ingestion for Document: ${documentId}`);
    console.log(`===============================================================`);

    // 1. Fetch document record
    const { data: doc, error: docErr } = await supabase
      .from('rag_documents')
      .select('id, title, file_name, storage_path, document_type, department_id, subject_id, semester, academic_year, metadata, status')
      .eq('id', documentId)
      .single();

    if (docErr || !doc) {
      throw new Error(`Ingestion Error: Document ${documentId} not found in database. ${docErr?.message || ''}`);
    }

    if (!doc.storage_path) {
      throw new Error(`Ingestion Error: Document ${documentId} does not have a storage_path.`);
    }

    // 2. Find or create tracking job in public.rag_ingestion_jobs
    let jobId = null;
    const { data: existingJobs } = await supabase
      .from('rag_ingestion_jobs')
      .select('id, status')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingJobs && existingJobs.length > 0) {
      jobId = existingJobs[0].id;
    } else {
      const { data: newJob } = await supabase
        .from('rag_ingestion_jobs')
        .insert([{
          document_id: documentId,
          status: 'pending',
          chunks_created: 0
        }])
        .select('id')
        .single();
      jobId = newJob?.id;
    }

    // Mark job & document as 'processing'
    const startTime = new Date().toISOString();
    if (jobId) {
      await supabase
        .from('rag_ingestion_jobs')
        .update({
          status: 'processing',
          started_at: startTime,
          error_message: null
        })
        .eq('id', jobId);
    }

    await supabase
      .from('rag_documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    try {
      // 3. Download PDF binary
      const pdfBuffer = await this.downloadPdfBuffer(doc.storage_path);

      // 4. Extract text page by page
      const pages = await this.extractTextByPages(pdfBuffer);
      if (pages.length === 0) {
        throw new Error('Extraction Error: No readable text extracted from PDF document.');
      }

      // 5. Chunk text
      const docMetadata = {
        document_id: doc.id,
        document_title: doc.title,
        file_name: doc.file_name,
        subject_id: doc.subject_id,
        department_id: doc.department_id,
        document_type: doc.document_type || 'syllabus',
        semester: doc.semester,
        academic_year: doc.academic_year
      };

      const chunks = this.chunkDocument(pages, docMetadata);
      if (chunks.length === 0) {
        throw new Error('Chunking Error: Unable to generate meaningful text chunks.');
      }

      // 6. Generate embeddings for all chunks with 'passage: ' prefix
      console.log(`[RAG Ingestion] Generating ${EMBEDDING_DIMENSION}-dim embeddings for ${chunks.length} chunks...`);
      const chunksWithEmbeddings = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk.content, false);
        
        chunksWithEmbeddings.push({
          document_id: doc.id,
          chunk_index: chunk.chunkIndex,
          content: chunk.content,
          embedding: embedding,
          metadata: chunk.metadata
        });
      }

      // 7. Idempotent Database Insertion: Delete existing chunks first
      console.log(`[RAG Ingestion] Clearing previous chunks for document ${doc.id} (Idempotency check)...`);
      await supabase
        .from('rag_chunks')
        .delete()
        .eq('document_id', doc.id);

      // Batch insert new chunks
      console.log(`[RAG Ingestion] Inserting ${chunksWithEmbeddings.length} vectorized chunks into public.rag_chunks...`);
      const { error: insertErr } = await supabase
        .from('rag_chunks')
        .insert(chunksWithEmbeddings);

      if (insertErr) {
        throw new Error(`Database Error: Failed to insert rag_chunks. ${insertErr.message}`);
      }

      // 8. Update tracking job and document status: 'completed' & 'indexed'
      const completedTime = new Date().toISOString();
      if (jobId) {
        await supabase
          .from('rag_ingestion_jobs')
          .update({
            status: 'completed',
            chunks_created: chunksWithEmbeddings.length,
            completed_at: completedTime,
            error_message: null
          })
          .eq('id', jobId);
      }

      await supabase
        .from('rag_documents')
        .update({
          status: 'indexed',
          metadata: {
            ...doc.metadata,
            chunks_count: chunksWithEmbeddings.length,
            indexed_at: completedTime,
            embedding_model: MODEL_NAME,
            embedding_dim: EMBEDDING_DIMENSION
          }
        })
        .eq('id', doc.id);

      console.log(`✅ [RAG Ingestion] Ingestion completed successfully for "${doc.title}": ${chunksWithEmbeddings.length} chunks indexed.`);

      return {
        success: true,
        documentId: doc.id,
        documentTitle: doc.title,
        chunksCreated: chunksWithEmbeddings.length,
        status: 'indexed'
      };

    } catch (pipelineErr) {
      console.error(`❌ [RAG Ingestion] Ingestion failed:`, pipelineErr.message);

      const failTime = new Date().toISOString();
      if (jobId) {
        await supabase
          .from('rag_ingestion_jobs')
          .update({
            status: 'failed',
            error_message: pipelineErr.message,
            completed_at: failTime
          })
          .eq('id', jobId);
      }

      await supabase
        .from('rag_documents')
        .update({
          status: 'failed',
          metadata: {
            ...doc.metadata,
            job_error: pipelineErr.message,
            failed_at: failTime
          }
        })
        .eq('id', doc.id);

      throw pipelineErr;
    }
  }

  /**
   * Semantic vector search via match_rag_chunks() RPC
   * Generates a 384-dim query embedding with 'query: ' prefix and queries Supabase pgvector
   */
  async searchSimilarChunks({
    query,
    matchThreshold = 0.5,
    matchCount = 5,
    subjectId = null,
    departmentId = null,
    documentId = null
  }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured.');
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return { data: [], error: 'Search query cannot be empty.' };
    }

    try {
      console.log(`[RAG Search] Generating query embedding for: "${query.trim()}"...`);
      const queryEmbedding = await this.generateEmbedding(query, true);

      console.log(`[RAG Search] Invoking match_rag_chunks RPC (threshold: ${matchThreshold}, limit: ${matchCount})...`);
      const { data: rpcData, error: rpcError } = await supabase.rpc('match_rag_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_subject_id: subjectId,
        filter_department_id: departmentId,
        filter_document_id: documentId
      });

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        console.log(`[RAG Search] RPC match_rag_chunks returned ${rpcData.length} matches.`);
        return {
          data: rpcData,
          error: null,
          engine: 'rpc'
        };
      }

      if (rpcError) {
        console.warn(`[RAG Search] match_rag_chunks RPC notice (${rpcError.message}). Executing direct vector similarity fallback...`);
      }

      // Resilient Vector Similarity Search Fallback
      let queryBuilder = supabase
        .from('rag_chunks')
        .select(`
          id,
          document_id,
          chunk_index,
          content,
          embedding,
          metadata,
          rag_documents!inner (
            id,
            title,
            file_name,
            document_type,
            status,
            subject_id,
            department_id
          )
        `)
        .eq('rag_documents.status', 'indexed');

      if (documentId) queryBuilder = queryBuilder.eq('document_id', documentId);
      if (subjectId) queryBuilder = queryBuilder.eq('rag_documents.subject_id', subjectId);
      if (departmentId) queryBuilder = queryBuilder.eq('rag_documents.department_id', departmentId);

      const { data: candidateChunks, error: fetchErr } = await queryBuilder;

      if (fetchErr) {
        console.error('[RAG Search] Fallback chunk fetch error:', fetchErr.message);
        return { data: [], error: fetchErr.message };
      }

      if (!candidateChunks || candidateChunks.length === 0) {
        return { data: [], error: null, engine: 'fallback' };
      }

      // Compute exact cosine similarity
      const scoredChunks = [];

      for (const chunk of candidateChunks) {
        let chunkVec = chunk.embedding;
        if (typeof chunkVec === 'string') {
          try {
            chunkVec = JSON.parse(chunkVec);
          } catch {
            continue;
          }
        }

        if (!Array.isArray(chunkVec) || chunkVec.length !== EMBEDDING_DIMENSION) {
          continue;
        }

        // Dot product of normalized vectors = cosine similarity
        let dotProduct = 0;
        for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
          dotProduct += queryEmbedding[i] * chunkVec[i];
        }

        if (dotProduct >= matchThreshold) {
          scoredChunks.push({
            id: chunk.id,
            document_id: chunk.document_id,
            document_title: chunk.rag_documents?.title || chunk.metadata?.document_title || 'Document',
            document_file_name: chunk.rag_documents?.file_name || chunk.metadata?.file_name || 'document.pdf',
            document_type: chunk.rag_documents?.document_type || chunk.metadata?.document_type || 'syllabus',
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            metadata: chunk.metadata,
            similarity: dotProduct
          });
        }
      }

      // Sort by similarity descending
      scoredChunks.sort((a, b) => b.similarity - a.similarity);
      const topMatches = scoredChunks.slice(0, matchCount);

      console.log(`[RAG Search] Direct vector search returned ${topMatches.length} matching chunks.`);
      return {
        data: topMatches,
        error: null,
        engine: 'vector_direct'
      };

    } catch (err) {
      console.error('[RAG Search] Search exception:', err);
      return { data: [], error: err.message };
    }
  }
}

export const ragIngestionService = new RagIngestionService();
export default ragIngestionService;
