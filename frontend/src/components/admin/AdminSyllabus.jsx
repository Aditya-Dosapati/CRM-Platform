import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Filter, CheckCircle2, Clock, AlertCircle, Cpu, Download, Trash2, BookOpen, Layers } from 'lucide-react';
import ragDocumentService from '../../services/ragDocumentService';
import academicDataService from '../../services/academicDataService';
import useSafeTimeout from '../../hooks/useSafeTimeout';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';
import RagUploadModal from './RagUploadModal';

export default function AdminSyllabus({ onOpenPdf }) {
  const [syllabi, setSyllabi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const setSafeTimeout = useSafeTimeout();

  useEscapeKey(() => setShowUploadModal(false), showUploadModal);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ragDocumentService.getDocuments({ documentType: 'syllabus' });
      setSyllabi(res?.data || []);
    } catch (err) {
      console.warn('Error loading syllabi:', err);
      setSyllabi([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (s) => {
    if (confirm(`Delete syllabus "${s.title || s.document || 'syllabus'}" from repository?`)) {
      try {
        await ragDocumentService.deleteDocument(s.id, s.storagePath);
        setSyllabi(prev => prev.filter(item => item.id !== s.id));
      } catch (err) {
        alert(`Failed to delete: ${err.message}`);
      }
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            Institutional Syllabus Management
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '4px' }}>
            Curriculum document indexing, BOS approvals, and automated RAG embedding pipelines
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>Upload Syllabus</span>
        </button>
      </div>

      {/* RAG Ingestion Pipeline Status Summary */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL CURRICULA
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            {isLoading ? '...' : syllabi.length} Courses
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            AR23 Regulation
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              INDEXED IN RAG
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            {isLoading ? '...' : syllabi.filter(s => (s.rawStatus || s.status) === 'indexed').length} Active
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            Instant AI Search Ready
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PROCESSING CHUNKS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            {isLoading ? '...' : syllabi.filter(s => (s.rawStatus || s.status) === 'processing').length} In-Queue
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            rag_ingestion_jobs
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course / Subject</th>
              <th>Document Type</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text)' }}>
                  Loading curriculum documents...
                </td>
              </tr>
            ) : syllabi.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Syllabus Documents"
                message="No course syllabi have been uploaded to the RAG knowledge repository yet."
                isTableRow={true}
                colSpan={5}
                actionText="Upload Syllabus"
                onAction={() => setShowUploadModal(true)}
              />
            ) : (
              syllabi.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--color-primary)" />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {s.title || s.document || s.fileName}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, display: 'block' }}>
                          {s.fileName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple">
                      {s.documentType || 'Syllabus'}
                    </span>
                  </td>
                  <td>{s.department || 'CSE'}</td>
                  <td>
                    <span className={`badge ${
                      (s.rawStatus || s.status) === 'indexed' ? 'badge-green' :
                      (s.rawStatus || s.status) === 'processing' ? 'badge-orange' : 'badge-danger'
                    }`}>
                      {(s.rawStatus || s.status) === 'indexed' && <CheckCircle2 size={12} />}
                      {(s.rawStatus || s.status) === 'processing' && <Clock size={12} />}
                      {(s.rawStatus || s.status) === 'failed' && <AlertCircle size={12} />}
                      {s.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => onOpenPdf && onOpenPdf({ id: s.id, title: s.title || s.fileName, doc: s.storagePath || s.fileName, storagePath: s.storagePath, fileName: s.fileName, page: 1 })}
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--error)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Institutional Syllabus Upload Modal */}
      {showUploadModal && (
        <RagUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
