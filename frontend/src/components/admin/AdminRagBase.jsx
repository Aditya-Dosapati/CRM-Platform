import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ragDocumentService from '../../services/ragDocumentService';
import RagUploadModal from './RagUploadModal';
import {
  Cpu, Upload, RefreshCw, Trash2, Eye, Search, Layers, CheckCircle2,
  AlertCircle, Clock, X, Sliders, FileText,
  FileQuestion, Info, ExternalLink, Loader2, Database
} from 'lucide-react';
import useSafeTimeout from '../../hooks/useSafeTimeout';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function AdminRagBase({ onOpenPdf, onNavigate }) {
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChunkDoc, setSelectedChunkDoc] = useState(null);
  const [chunkList, setChunkList] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [selectedMetadataDoc, setSelectedMetadataDoc] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reindexingId, setReindexingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const setSafeTimeout = useSafeTimeout();

  useEscapeKey(() => {
    setSelectedChunkDoc(null);
    setSelectedMetadataDoc(null);
  }, Boolean(selectedChunkDoc || selectedMetadataDoc));

  // Fetch real chunks when a document is selected in Chunk Inspector
  useEffect(() => {
    let active = true;
    if (selectedChunkDoc?.id) {
      setLoadingChunks(true);
      ragDocumentService.getChunks(selectedChunkDoc.id).then(res => {
        if (active) {
          setChunkList(res?.data || []);
          setLoadingChunks(false);
        }
      }).catch(err => {
        if (active) {
          console.warn('Error loading chunks:', err);
          setChunkList([]);
          setLoadingChunks(false);
        }
      });
    } else {
      setChunkList([]);
    }
    return () => { active = false; };
  }, [selectedChunkDoc]);

  // Load documents from real Supabase table
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ragDocumentService.getDocuments();
      setDocs(res?.data || []);
    } catch (e) {
      console.warn('Error loading RAG documents:', e);
      setDocs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const docName = (d.document || d.title || d.fileName || '').toLowerCase();
      const subj = (d.subject || '').toLowerCase();
      const cat = (d.category || d.documentType || '').toLowerCase();
      const dept = (d.department || '').toLowerCase();
      return docName.includes(q) || subj.includes(q) || cat.includes(q) || dept.includes(q);
    });
  }, [docs, searchQuery]);

  // Real KPI calculations from actual Supabase document records
  const kpiStats = useMemo(() => {
    const total = docs.length;
    const uploaded = docs.filter(d => (d.rawStatus || d.status)?.toLowerCase() === 'uploaded').length;
    const processing = docs.filter(d => (d.rawStatus || d.status)?.toLowerCase() === 'processing').length;
    const indexed = docs.filter(d => (d.rawStatus || d.status)?.toLowerCase() === 'indexed').length;
    const failed = docs.filter(d => (d.rawStatus || d.status)?.toLowerCase() === 'failed').length;
    return { total, uploaded, processing, indexed, failed };
  }, [docs]);

  const handleUploadSuccess = useCallback(async (newDoc) => {
    setActionFeedback({ type: 'success', message: `"${newDoc.title}" uploaded. Starting Stage 2 vector ingestion...` });
    loadDocuments();

    if (newDoc?.id) {
      try {
        setReindexingId(newDoc.id);
        await ragDocumentService.reindexDocument(newDoc.id);
        setActionFeedback({ type: 'success', message: `"${newDoc.title}" successfully vectorized and indexed in pgvector (384 dim)!` });
        loadDocuments();
      } catch (err) {
        console.error('Auto-ingestion error:', err);
        setActionFeedback({ type: 'danger', message: `Ingestion error: ${err.message}` });
      } finally {
        setReindexingId(null);
        setSafeTimeout(() => setActionFeedback(null), 5000);
      }
    }
  }, [loadDocuments, setSafeTimeout]);

  const handleReindex = useCallback(async (docId, docTitle) => {
    setReindexingId(docId);
    setActionFeedback({ type: 'info', message: `Extracting text and generating multilingual-e5-small embeddings for "${docTitle || 'document'}"...` });
    try {
      const res = await ragDocumentService.reindexDocument(docId);
      setActionFeedback({ type: 'success', message: `Successfully indexed ${res.chunksCreated} chunks into vector store for "${docTitle || 'document'}".` });
      loadDocuments();
    } catch (err) {
      console.error('Re-indexing error:', err);
      setActionFeedback({ type: 'danger', message: `Re-indexing failed: ${err.message}` });
      loadDocuments();
    } finally {
      setReindexingId(null);
      setSafeTimeout(() => setActionFeedback(null), 4000);
    }
  }, [loadDocuments, setSafeTimeout]);

  const handleDelete = useCallback(async (doc) => {
    const docName = doc.title || doc.document || doc.fileName || 'document';
    if (!confirm(`Are you sure you want to delete "${docName}" from the RAG Knowledge Base and purge its file from Supabase Storage?`)) {
      return;
    }

    setDeletingId(doc.id);
    try {
      await ragDocumentService.deleteDocument(doc.id, doc.storagePath);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      setActionFeedback({ type: 'success', message: `Deleted "${docName}" from database and storage.` });
      setSafeTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }, [setSafeTimeout]);

  const handleOpenDocument = useCallback(async (doc) => {
    try {
      if (doc.storagePath) {
        const signedUrl = await ragDocumentService.getDocumentDownloadUrl(doc.storagePath);
        if (signedUrl) {
          window.open(signedUrl, '_blank');
          return;
        }
      }

      if (onOpenPdf) {
        onOpenPdf({
          title: doc.title || doc.document || 'Document',
          doc: doc.fileName || doc.document || 'document.pdf',
          page: 1
        });
      }
    } catch (err) {
      console.warn('Error opening document:', err);
    }
  }, [onOpenPdf]);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              RAG Knowledge Base
            </h1>
            <span className="badge badge-blue" style={{ fontSize: '11px', letterSpacing: '0.4px' }}>
              PGVECTOR (384 DIM)
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage the vectorized knowledge repository and document ingestion pipeline powering GMRIT AI
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate && onNavigate('rag-settings')} className="btn btn-secondary">
            <Sliders size={14} />
            <span>Retrieval Settings</span>
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className="btn btn-primary" id="btn-ingest-document">
            <Upload size={14} />
            <span>+ Ingest Document</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: actionFeedback.type === 'success' ? 'var(--pastel-green-bg, #D1FAE5)' : 'var(--pastel-red-bg, #FFE4E6)',
          border: `1px solid ${actionFeedback.type === 'success' ? 'var(--pastel-green-border, #A7F3D0)' : 'var(--pastel-red-border, #FECDD3)'}`,
          color: actionFeedback.type === 'success' ? '#065F46' : '#9F1239',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: 500
        }}>
          {actionFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Real-time KPI Metric Cards from Supabase rag_documents */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL DOCUMENTS</span>
            <div className="kpi-icon-wrap">
              <FileText size={16} />
            </div>
          </div>
          <div className="kpi-value">{kpiStats.total}</div>
          <div className="kpi-trend neutral">Cataloged in database</div>
        </div>

        <div className="kpi-card kpi-cyan">
          <div className="kpi-top">
            <span className="kpi-label">UPLOADED & QUEUED</span>
            <div className="kpi-icon-wrap">
              <Upload size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#0891B2' }}>{kpiStats.uploaded}</div>
          <div className="kpi-trend neutral">Awaiting Stage 2 Chunker</div>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-top">
            <span className="kpi-label">IN-PROCESSING</span>
            <div className="kpi-icon-wrap">
              <Clock size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#EA580C' }}>{kpiStats.processing}</div>
          <div className="kpi-trend warning">Ingestion In-Flight</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-label">INDEXED ASSETS</span>
            <div className="kpi-icon-wrap">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>{kpiStats.indexed}</div>
          <div className="kpi-trend positive">Search Ready</div>
        </div>

        <div className="kpi-card" style={{ background: '#FFF1F2', borderColor: '#FECDD3' }}>
          <div className="kpi-top">
            <span className="kpi-label" style={{ color: '#BE123C' }}>FAILED INGESTION</span>
            <div className="kpi-icon-wrap" style={{ background: '#FFE4E6', color: '#E11D48' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#E11D48' }}>{kpiStats.failed}</div>
          <div className="kpi-trend neutral" style={{ color: '#BE123C' }}>Requires review</div>
        </div>
      </div>

      {/* Search & Active Configuration Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Search documents, subjects, departments, or categories..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', paddingBlock: '8px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>RAG Model:</span>
            <span className="badge badge-purple" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              intfloat/multilingual-e5-small (384 dim)
            </span>
          </div>
        </div>
      </div>

      {/* Live Document Table from Supabase */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Document Title & File</th>
              <th>Category</th>
              <th>Department & Subject</th>
              <th>Chunks</th>
              <th>Status</th>
              <th>Uploaded Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px' }}>
                  <Loader2 size={24} className="spin" style={{ color: 'var(--primary-blue)', margin: '0 auto 8px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading RAG document catalog from Supabase...</p>
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <EmptyState
                icon={FileQuestion}
                title="No RAG Documents in Repository"
                message="No academic documents have been uploaded to the RAG knowledge base yet. Click '+ Ingest Document' to upload your first course PDF."
                isTableRow={true}
                colSpan={7}
                actionText="+ Ingest Document"
                onAction={() => setIsUploadModalOpen(true)}
              />
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--pastel-blue-bg)',
                        color: 'var(--primary-blue)',
                        border: '1px solid var(--pastel-blue-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Cpu size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                          {doc.title || doc.document}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {doc.fileName || doc.document} • {doc.fileSizeFormatted || 'PDF'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{doc.category || doc.documentType}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {doc.subject}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Dept: {doc.department} • {doc.semester || 'IV Sem'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--primary-blue)' }}>
                    {doc.chunks > 0 ? `${doc.chunks} chunks` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${
                      doc.statusType === 'success' ? 'badge-green' :
                      doc.statusType === 'warning' ? 'badge-orange' :
                      doc.statusType === 'danger' ? 'badge-danger' : 'badge-blue'
                    }`}>
                      {doc.statusType === 'success' && <CheckCircle2 size={12} />}
                      {doc.statusType === 'warning' && <Clock size={12} />}
                      {doc.statusType === 'danger' && <AlertCircle size={12} />}
                      {doc.status || 'Uploaded'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.lastUpdated}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenDocument(doc)}
                        className="btn btn-secondary btn-sm"
                        title="View Document"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => setSelectedMetadataDoc(doc)}
                        className="btn btn-secondary btn-sm"
                        title="View Document Metadata"
                      >
                        <Info size={13} />
                      </button>
                      <button
                        onClick={() => setSelectedChunkDoc(doc)}
                        className="btn btn-secondary btn-sm"
                        title="Inspect Chunks"
                      >
                        <Layers size={13} />
                      </button>
                      <button
                        onClick={() => handleReindex(doc.id, doc.title || doc.document)}
                        disabled={reindexingId === doc.id}
                        className="btn btn-secondary btn-sm"
                        title="Re-index into Vector Store"
                      >
                        <RefreshCw size={13} className={reindexingId === doc.id ? 'spin' : ''} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--error)' }}
                        title="Purge Document"
                      >
                        {deletingId === doc.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ingest Document Modal */}
      <RagUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Document Metadata Inspector Modal */}
      {selectedMetadataDoc && (
        <div className="modal-overlay" onClick={() => setSelectedMetadataDoc(null)}>
          <div className="modal-content medium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={18} color="var(--primary-blue)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Document System Metadata
                </h3>
              </div>
              <button
                onClick={() => setSelectedMetadataDoc(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Title:</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedMetadataDoc.title || selectedMetadataDoc.document}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Original File Name:</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{selectedMetadataDoc.fileName || selectedMetadataDoc.document}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Storage Path:</strong>
                  <div style={{ color: 'var(--primary-blue)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>
                    {selectedMetadataDoc.storagePath || 'uploads/sample.pdf'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Department:</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedMetadataDoc.department}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Subject:</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedMetadataDoc.subject}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Semester / Year:</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedMetadataDoc.semester} ({selectedMetadataDoc.academicYear})</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Ingestion Status:</strong>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${selectedMetadataDoc.statusType === 'success' ? 'badge-green' : 'badge-blue'}`}>
                        {selectedMetadataDoc.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleOpenDocument(selectedMetadataDoc)}
              >
                <ExternalLink size={13} />
                <span>Open in Viewer</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedMetadataDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Chunks Modal */}
      {selectedChunkDoc && (
        <div className="modal-overlay" onClick={() => setSelectedChunkDoc(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={20} color="var(--primary-blue)" />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Semantic Chunk Inspector: {selectedChunkDoc.title || selectedChunkDoc.document}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '2px' }}>
                    Embedding Model: intfloat/multilingual-e5-small (384 dim) • Chunks: {chunkList.length || selectedChunkDoc.chunks || 0}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedChunkDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '14px',
                background: 'var(--bg-canvas)',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                marginBottom: '16px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)'
              }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>Model:</strong> intfloat/multilingual-e5-small</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Dimension:</strong> 384 float32 elements</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Storage:</strong> Private (rag-documents)</div>
              </div>

              {loadingChunks ? (
                <div style={{ padding: '36px', textAlign: 'center' }}>
                  <Loader2 size={24} className="spin" style={{ color: 'var(--primary-blue)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading vectorized chunks from database...</p>
                </div>
              ) : chunkList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {chunkList.map((chunk, idx) => (
                    <div
                      key={chunk.id || idx}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
                          CHUNK #{chunk.chunk_index !== undefined ? chunk.chunk_index + 1 : idx + 1}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span className="badge badge-gray" style={{ fontSize: '11px' }}>
                            Page {chunk.metadata?.page_number || 1}
                          </span>
                          <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                            {chunk.content?.length || 0} chars
                          </span>
                          <span className="badge badge-green" style={{ fontSize: '11px' }}>
                            Vector 384-D
                          </span>
                        </div>
                      </div>

                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Inter, sans-serif',
                        background: 'var(--bg-canvas)',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        margin: 0
                      }}>
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No Vector Chunks Found in Database</p>
                  <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
                    This document is in <strong style={{ color: 'var(--primary-blue)' }}>"{selectedChunkDoc.rawStatus || selectedChunkDoc.status || 'uploaded'}"</strong> status. Click the "Re-index" icon in the table to extract and vectorize.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedChunkDoc(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
