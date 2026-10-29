// GMR CRM - Stage 3A: Permission-Aware RAG Retrieval & Context Assembly Service
// Embedding Model: intfloat/multilingual-e5-small (384-dimensional)
// Strict Database RBAC & RLS Enforcement (Zero LLM / Zero Hallucination)

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { ragIngestionService } from './ragIngestionService.js';

const EMBEDDING_DIMENSION = 384;
const DEFAULT_MATCH_THRESHOLD = 0.65;
const DEFAULT_MATCH_COUNT = 5;

export class RagChatService {
  /**
   * Validate and sanitize input query string
   */
  validateQuestion(question) {
    if (!question || typeof question !== 'string') {
      return { valid: false, error: 'Please enter a valid question.' };
    }

    const clean = question.trim();
    if (clean.length < 3) {
      return { valid: false, error: 'Question must be at least 3 characters long.' };
    }

    if (clean.length > 1000) {
      return { valid: false, error: 'Question exceeds maximum character limit of 1000.' };
    }

    return { valid: true, cleanQuestion: clean };
  }

  /**
   * Compute cosine similarity between two normalized 384-dim vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== EMBEDDING_DIMENSION || vecB.length !== EMBEDDING_DIMENSION) {
      return 0;
    }

    let dot = 0;
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }

  /**
   * Primary Stage 3A Retrieval Method:
   * 1. Validates and normalizes the question
   * 2. Verifies active authenticated Supabase session (server-side security)
   * 3. Generates 384-dim vector embedding using multilingual-e5-small ('query: ' prefix)
   * 4. Enforces database academic permissions via RLS on rag_documents
   * 5. Performs vector similarity ranking and deduplication
   * 6. Assembles deterministic, citation-ready context
   */
  async askQuestion(question, options = {}) {
    // 1. Validate query
    const val = this.validateQuestion(question);
    if (!val.valid) {
      return {
        success: false,
        error: val.error,
        question: question || '',
        context: { question: question || '', chunks: [] },
        sources: []
      };
    }

    const cleanQuestion = val.cleanQuestion;
    const matchThreshold = typeof options.matchThreshold === 'number' ? options.matchThreshold : DEFAULT_MATCH_THRESHOLD;
    const matchCount = typeof options.matchCount === 'number' ? options.matchCount : (options.limit || DEFAULT_MATCH_COUNT);
    const filterSubjectId = options.subjectId || null;
    const filterDepartmentId = options.departmentId || null;
    const filterDocumentId = options.documentId || null;

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase client is not configured.',
        question: cleanQuestion,
        context: { question: cleanQuestion, chunks: [] },
        sources: []
      };
    }

    try {
      // 2. Verify authenticated Supabase session (never trust frontend-supplied role)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return {
          success: false,
          error: 'Authentication required. Please sign in to access academic RAG knowledge.',
          question: cleanQuestion,
          context: { question: cleanQuestion, chunks: [] },
          sources: []
        };
      }

      // 2b. Restrict Faculty Access to student AI Copilot
      const userRole = userData.user.user_metadata?.role || (await (async () => {
        try {
          const { data } = await supabase.from('users').select('role').eq('id', userData.user.id).maybeSingle();
          return data?.role;
        } catch { return null; }
      })());
      if (userRole === 'faculty') {
        return {
          success: false,
          error: 'Faculty access to the Student AI Academic Copilot is restricted.',
          question: cleanQuestion,
          context: { question: cleanQuestion, chunks: [] },
          sources: []
        };
      }

      // 3. Generate query embedding using multilingual-e5-small with 'query: ' prefix
      const queryVec = await ragIngestionService.generateEmbedding(cleanQuestion, true);

      // 4. Retrieve candidate documents accessible to this authenticated user via RLS
      // RLS policy 'rag_docs_authenticated_select' strictly enforces:
      // - Admin: all indexed docs
      // - Faculty: indexed docs for assigned faculty_subjects / permissions
      // - Student: ONLY indexed docs for assigned student_subjects / permissions
      let docQuery = supabase
        .from('rag_documents')
        .select(`
          id,
          title,
          file_name,
          document_type,
          status,
          subject_id,
          department_id,
          subjects ( id, name, code ),
          departments ( id, name, code )
        `)
        .in('status', ['indexed', 'published']);

      if (filterDocumentId) docQuery = docQuery.eq('id', filterDocumentId);
      if (filterSubjectId) docQuery = docQuery.eq('subject_id', filterSubjectId);
      if (filterDepartmentId) docQuery = docQuery.eq('department_id', filterDepartmentId);

      const { data: accessibleDocs, error: docError } = await docQuery;

      if (docError) {
        console.error('[RagChatService] Error querying accessible documents:', docError.message);
        return {
          success: false,
          error: `Permission error retrieving academic documents: ${docError.message}`,
          question: cleanQuestion,
          context: { question: cleanQuestion, chunks: [] },
          sources: []
        };
      }

      // If user has no accessible documents for this subject/scope, return empty result (zero leak)
      if (!accessibleDocs || accessibleDocs.length === 0) {
        return {
          success: true,
          question: cleanQuestion,
          context: {
            question: cleanQuestion,
            chunks: []
          },
          sources: []
        };
      }

      const accessibleDocIds = accessibleDocs.map(d => d.id);
      const docMap = new Map(accessibleDocs.map(d => [d.id, d]));

      // 5. Query candidate chunks for accessible documents
      const { data: rawChunks, error: chunkError } = await supabase
        .from('rag_chunks')
        .select('id, document_id, chunk_index, content, embedding, metadata')
        .in('document_id', accessibleDocIds);

      if (chunkError) {
        console.error('[RagChatService] Error querying candidate chunks:', chunkError.message);
        return {
          success: false,
          error: `Error retrieving document chunks: ${chunkError.message}`,
          question: cleanQuestion,
          context: { question: cleanQuestion, chunks: [] },
          sources: []
        };
      }

      if (!rawChunks || rawChunks.length === 0) {
        return {
          success: true,
          question: cleanQuestion,
          context: {
            question: cleanQuestion,
            chunks: []
          },
          sources: []
        };
      }

      // 6. Compute vector cosine similarity & rank
      const scoredList = [];
      const seenContentFingerprints = new Set();

      for (const chunk of rawChunks) {
        let chunkEmbedding = chunk.embedding;
        if (typeof chunkEmbedding === 'string') {
          try {
            chunkEmbedding = JSON.parse(chunkEmbedding);
          } catch {
            continue;
          }
        }

        if (!Array.isArray(chunkEmbedding) || chunkEmbedding.length !== EMBEDDING_DIMENSION) {
          continue;
        }

        const similarity = this.cosineSimilarity(queryVec, chunkEmbedding);

        if (similarity >= matchThreshold) {
          // Deduplication by normalized text fingerprint
          const contentKey = (chunk.content || '').trim().toLowerCase().slice(0, 120);
          if (!seenContentFingerprints.has(contentKey)) {
            seenContentFingerprints.add(contentKey);
            scoredList.push({
              chunk,
              similarity
            });
          }
        }
      }

      // 7. Sort by similarity descending
      scoredList.sort((a, b) => b.similarity - a.similarity);
      const topMatches = scoredList.slice(0, matchCount);

      // 8. Assemble structured context and citation sources
      const structuredChunks = topMatches.map(({ chunk, similarity }) => {
        const doc = docMap.get(chunk.document_id);
        const pageNum = chunk.metadata?.page_number ?? chunk.metadata?.page ?? null;
        const subjectName = doc?.subjects?.name || doc?.subjects?.code || chunk.metadata?.subject_name || chunk.metadata?.subject_code || 'General';
        const deptName = doc?.departments?.name || doc?.departments?.code || chunk.metadata?.department_name || chunk.metadata?.department_code || 'General';
        const docTitle = doc?.title || chunk.metadata?.document_title || 'Academic Document';
        const docFileName = doc?.file_name || chunk.metadata?.file_name || 'document.pdf';
        const docType = doc?.document_type || chunk.metadata?.document_type || 'syllabus';

        return {
          chunkId: chunk.id,
          documentId: chunk.document_id,
          content: chunk.content,
          similarity: Math.round(similarity * 10000) / 10000,
          metadata: {
            title: docTitle,
            fileName: docFileName,
            page: pageNum,
            chunkIndex: chunk.chunk_index,
            subject: subjectName,
            department: deptName,
            documentType: docType
          }
        };
      });

      // Deduplicate source cards by document ID and display actual source title once per document
      const seenDocIds = new Set();
      const sources = [];

      for (const c of structuredChunks) {
        if (!seenDocIds.has(c.documentId)) {
          seenDocIds.add(c.documentId);
          const doc = docMap.get(c.documentId);
          sources.push({
            documentId: c.documentId,
            title: c.metadata.title,
            fileName: c.metadata.fileName,
            storagePath: doc?.storage_path || '',
            storage_path: doc?.storage_path || '',
            page: c.metadata.page,
            chunkIndex: c.metadata.chunkIndex,
            similarity: c.similarity
          });
        }
      }

      return {
        success: true,
        question: cleanQuestion,
        context: {
          question: cleanQuestion,
          chunks: structuredChunks
        },
        sources
      };

    } catch (err) {
      console.error('[RagChatService] askQuestion exception:', err);
      return {
        success: false,
        error: err.message || 'An unexpected error occurred while retrieving academic context.',
        question: cleanQuestion,
        context: { question: cleanQuestion, chunks: [] },
        sources: []
      };
    }
  }

  /**
  /**
   * DeepExtract LangGraph RAG Question Answering Pipeline:
   * 1. Authenticates session token & verifies student/admin authorization
   * 2. Generates E5 query embedding with 'query: ' prefix
   * 3. Invokes backend DeepExtract LangGraph service (/api/rag/chat)
   * 4. Enforces query classification, bounded retry, untrusted data isolation, and verified source citations
   * 5. Maintains automatic fallback to Supabase Edge Function if backend service is unreachable
   */
  async askQuestionWithAnswer(question, options = {}) {
    const val = this.validateQuestion(question);
    if (!val.valid) {
      return {
        success: false,
        question: question || '',
        answer: null,
        error: val.error,
        sources: [],
        retrieval: { chunkCount: 0, topSimilarity: 0 }
      };
    }

    const cleanQuestion = val.cleanQuestion;

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        question: cleanQuestion,
        answer: null,
        error: 'Supabase client is not configured.',
        sources: [],
        retrieval: { chunkCount: 0, topSimilarity: 0 }
      };
    }

    // 1. Verify user session & enforce faculty guard
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (sessionErr || !token) {
      return {
        success: false,
        question: cleanQuestion,
        answer: null,
        error: 'Authentication required. Please sign in to access academic RAG knowledge.',
        sources: [],
        retrieval: { chunkCount: 0, topSimilarity: 0 }
      };
    }

    const user = sessionData.session.user;
    const userRole = user?.user_metadata?.role || (await (async () => {
      try {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
        return data?.role;
      } catch { return null; }
    })());

    if (userRole === 'faculty') {
      return {
        success: false,
        question: cleanQuestion,
        answer: null,
        error: 'Faculty access to the Student AI Academic Copilot is restricted.',
        sources: [],
        retrieval: { chunkCount: 0, topSimilarity: 0 }
      };
    }

    // 2. Generate E5 query vector with 'query: ' prefix
    let queryVec = null;
    try {
      queryVec = await ragIngestionService.generateEmbedding(cleanQuestion, true);
    } catch (embErr) {
      console.warn('[RagChatService] Client-side embedding generation failed; backend will generate vector:', embErr);
    }

    // 3. Primary Path: Invoke backend DeepExtract RAG workflow
    const backendBaseUrl = typeof window !== 'undefined' && window.__VITE_BACKEND_URL__
      ? window.__VITE_BACKEND_URL__
      : 'http://localhost:8000';

    try {
      const response = await fetch(`${backendBaseUrl}/api/rag/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: cleanQuestion,
          query_vector: queryVec,
          options: {
            maxChunks: options.maxChunks || 5,
            score_threshold: options.score_threshold || 0.60,
            subjectId: options.subjectId || null,
            departmentId: options.departmentId || null,
            documentId: options.documentId || null
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedSources = (data.sources || []).map(s => ({
            documentId: s.document_id,
            title: s.document_name || 'Academic Document',
            fileName: s.file_name || 'document.pdf',
            storagePath: s.storage_path || '',
            storage_path: s.storage_path || '',
            page: s.page_number || null,
            chunkIndex: s.chunk_index,
            similarity: s.score ?? s.similarity,
            excerpt: s.excerpt || ''
          }));

          return {
            success: true,
            question: cleanQuestion,
            answer: data.answer,
            grounded: data.grounded,
            sources: formattedSources,
            retrieval: {
              chunkCount: data.retrieval?.chunkCount ?? formattedSources.length,
              topSimilarity: data.retrieval?.topSimilarity ?? (formattedSources[0]?.similarity || 0),
              model: 'Groq (DeepExtract LangGraph)',
              classification: data.retrieval?.classification,
              retryCount: data.retrieval?.retryCount || 0
            }
          };
        }
      } else if (response.status === 403) {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          question: cleanQuestion,
          answer: null,
          error: errJson.detail || 'Access restricted by institutional policy.',
          sources: [],
          retrieval: { chunkCount: 0, topSimilarity: 0 }
        };
      }
    } catch (backendErr) {
      console.warn('[RagChatService] DeepExtract backend unreachable, falling back to Edge Function:', backendErr.message);
    }

    // 4. Fallback Path: Stage 3A Retrieval + Supabase Edge Function
    const retrieval = await this.askQuestion(question, options);
    if (!retrieval.success) {
      return {
        success: false,
        question: question || '',
        answer: null,
        error: retrieval.error,
        sources: [],
        retrieval: { chunkCount: 0, topSimilarity: 0 }
      };
    }

    const chunks = retrieval.context?.chunks || [];
    if (chunks.length === 0) {
      return {
        success: true,
        question: retrieval.question,
        answer: "I couldn't find enough information in the available documents to answer that question.",
        sources: [],
        retrieval: { chunkCount: 0, topSimilarity: 0 }
      };
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('rag-answer', {
        body: {
          question: retrieval.question,
          context: chunks,
          options: { maxChunks: options.maxChunks || 5 }
        }
      });

      if (fnError || !fnData?.success) {
        let errorMsg = fnData?.error || fnError?.message || 'Failed to generate answer from AI service.';
        return {
          success: false,
          question: retrieval.question,
          answer: null,
          error: errorMsg,
          sources: retrieval.sources,
          retrieval: {
            chunkCount: chunks.length,
            topSimilarity: chunks[0]?.similarity || 0
          }
        };
      }

      return {
        success: true,
        question: retrieval.question,
        answer: fnData.answer,
        sources: retrieval.sources,
        retrieval: {
          chunkCount: chunks.length,
          topSimilarity: chunks[0]?.similarity || 0,
          model: fnData.model
        }
      };
    } catch (edgeErr) {
      return {
        success: false,
        question: retrieval.question,
        answer: null,
        error: edgeErr.message || 'Error communicating with AI answer service.',
        sources: retrieval.sources,
        retrieval: {
          chunkCount: chunks.length,
          topSimilarity: chunks[0]?.similarity || 0
        }
      };
    }
  }
}

export const ragChatService = new RagChatService();
export default ragChatService;

