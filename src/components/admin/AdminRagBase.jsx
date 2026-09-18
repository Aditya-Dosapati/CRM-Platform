import React, { useState } from 'react';
import { adminRagDocuments, adminSystemHealth } from '../../data/mockData';
import { Cpu, Upload, RefreshCw, Trash2, Eye, Search, Layers, CheckCircle2, AlertCircle, Clock, X, Sparkles, Sliders, Database, FileText } from 'lucide-react';

export default function AdminRagBase({ onOpenPdf, onNavigate }) {
  const [docs, setDocs] = useState(adminRagDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChunkDoc, setSelectedChunkDoc] = useState(null);
  const [reindexingId, setReindexingId] = useState(null);

  const filteredDocs = docs.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.document.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
  });

  const handleReindex = (docId) => {
    setReindexingId(docId);
    setTimeout(() => {
      setReindexingId(null);
      setDocs(docs.map(d => d.id === docId ? { ...d, status: 'Indexed', statusType: 'success', lastUpdated: 'Just now' } : d));
      alert("Vector embedding re-generation complete. Updated 142 vectors in Qdrant collection.");
    }, 1500);
  };

  const handleDelete = (docId) => {
    if (confirm("Delete document from RAG knowledge base and purge all associated vector embeddings?")) {
      setDocs(docs.filter(d => d.id !== docId));
    }
  };

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
              QDRANT HYBRID SEARCH
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage the vectorized knowledge repository and document ingestion pipeline powering GMRIT AI
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate('rag-settings')} className="btn btn-secondary">
            <Sliders size={14} />
            <span>Retrieval Settings</span>
          </button>
          <button onClick={() => alert("Upload dialog initialized for batch PDF embedding.")} className="btn btn-primary">
            <Upload size={14} />
            <span>+ Ingest Document</span>
          </button>
        </div>
      </div>

      {/* Control Center Summary Metric Cards */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL DOCUMENTS</span>
            <div className="kpi-icon-wrap">
              <FileText size={16} />
            </div>
          </div>
          <div className="kpi-value">4,284</div>
          <div className="kpi-trend neutral">Across all 8 departments</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-label">INDEXED DOCUMENTS</span>
            <div className="kpi-icon-wrap">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>4,240</div>
          <div className="kpi-trend positive">98.9% Success Rate</div>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-top">
            <span className="kpi-label">IN-PROCESSING</span>
            <div className="kpi-icon-wrap">
              <Clock size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#EA580C' }}>32</div>
          <div className="kpi-trend warning">Embedding in-flight</div>
        </div>

        <div className="kpi-card" style={{ background: '#FFF1F2', borderColor: '#FECDD3' }}>
          <div className="kpi-top">
            <span className="kpi-label" style={{ color: '#BE123C' }}>FAILED OCR</span>
            <div className="kpi-icon-wrap" style={{ background: '#FFE4E6', color: '#E11D48' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#E11D48' }}>12</div>
          <div className="kpi-trend neutral" style={{ color: '#BE123C' }}>Requires OCR repair</div>
        </div>

        <div className="kpi-card kpi-cyan">
          <div className="kpi-top">
            <span className="kpi-label">VECTOR STORAGE</span>
            <div className="kpi-icon-wrap">
              <Database size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#0891B2' }}>1.42 GB</div>
          <div className="kpi-trend neutral">of 10.0 GB quota</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Search indexed documents, subjects, or categories..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', paddingBlock: '8px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>Active Model:</span>
            <span className="badge badge-purple" style={{ fontFamily: 'JetBrains Mono, monospace' }}>text-embedding-3-small (1536 dim)</span>
          </div>
        </div>
      </div>

      {/* Live Document Ingestion Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Document Filename</th>
              <th>Category</th>
              <th>Subject</th>
              <th>Chunks</th>
              <th>Embedding Model</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
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
                      justifyContent: 'center'
                    }}>
                      <Cpu size={16} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{doc.document}</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Dept: {doc.department}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-gray">{doc.category}</span>
                </td>
                <td>{doc.subject}</td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--primary-blue)' }}>
                  {doc.chunks > 0 ? `${doc.chunks} chunks` : '—'}
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {doc.embeddingModel}
                </td>
                <td>
                  <span className={`badge ${
                    doc.statusType === 'success' ? 'badge-green' :
                    doc.statusType === 'warning' ? 'badge-orange' : 'badge-danger'
                  }`}>
                    {doc.statusType === 'success' && <CheckCircle2 size={12} />}
                    {doc.statusType === 'warning' && <Clock size={12} />}
                    {doc.statusType === 'danger' && <AlertCircle size={12} />}
                    {doc.status}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.lastUpdated}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setSelectedChunkDoc(doc)}
                      className="btn btn-secondary btn-sm"
                      title="Inspect Chunks & Vectors"
                    >
                      <Layers size={13} />
                      <span>Chunks</span>
                    </button>
                    <button
                      onClick={() => handleReindex(doc.id)}
                      disabled={reindexingId === doc.id}
                      className="btn btn-secondary btn-sm"
                      title="Re-index into Vector Store"
                    >
                      <RefreshCw size={13} className={reindexingId === doc.id ? 'spin' : ''} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--error)' }}
                      title="Purge Document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspect Chunks Modal */}
      {selectedChunkDoc && (
        <div className="modal-overlay" onClick={() => setSelectedChunkDoc(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={20} color="var(--primary-blue)" />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Semantic Chunk Inspector: {selectedChunkDoc.document}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '2px' }}>
                    Vector ID Namespace: /gmrit/r20/{selectedChunkDoc.subject.toLowerCase().replace(/\s+/g, '_')} • Chunks: {selectedChunkDoc.chunks}
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
                <div><strong style={{ color: 'var(--text-primary)' }}>Chunk Strategy:</strong> Recursive Character (512 tokens)</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Overlap Window:</strong> 64 tokens (12.5%)</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Vector Dimension:</strong> 1536 float32 elements</div>
              </div>

              {/* Sample Chunks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  {
                    chunkId: "#0042",
                    page: 4,
                    tokenCount: 486,
                    simVector: "[0.0241, -0.0892, 0.1423, 0.0091, -0.1982, ... 1531 more]",
                    text: "Unit III Classification: Support Vector Machines (SVM) find the optimal separating hyperplane that maximizes the geometric margin 2/||w||. Dual formulation with Lagrange multipliers enables non-linear transformations using Mercer kernels."
                  },
                  {
                    chunkId: "#0043",
                    page: 5,
                    tokenCount: 498,
                    simVector: "[0.0381, -0.0612, 0.1841, -0.0124, -0.1428, ... 1531 more]",
                    text: "Decision Tree induction with CART algorithm calculates Gini Impurity = 1 - Σ(p_i)^2. Compared to Shannon Entropy, Gini does not require logarithmic operations, accelerating recursive tree building on large academic cohorts."
                  }
                ].map((chunk, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
                        CHUNK {chunk.chunkId} • Page {chunk.page} • {chunk.tokenCount} Tokens
                      </span>
                      <span className="badge badge-green">Vectorized</span>
                    </div>

                    <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: '10px' }}>
                      "{chunk.text}"
                    </p>

                    <div style={{
                      padding: '8px 12px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: 'var(--text-secondary)'
                    }}>
                      Embedding Vector: <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>{chunk.simVector}</span>
                    </div>
                  </div>
                ))}
              </div>
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
