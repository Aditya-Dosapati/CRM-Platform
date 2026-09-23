import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Plus, FileText, Download, CheckCircle2, Filter, Trash2, Sparkles, BookOpen } from 'lucide-react';
import ragDocumentService from '../../services/ragDocumentService';
import academicDataService from '../../services/academicDataService';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function AdminPYQs({ onOpenPdf }) {
  const [papers, setPapers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEscapeKey(() => setShowUploadModal(false), showUploadModal);

  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('2025');
  const [examType, setExamType] = useState('Semester End Examination');
  const [regulation, setRegulation] = useState('R20');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docRes, subRes] = await Promise.all([
        ragDocumentService.getDocuments({ documentType: 'pyq' }),
        academicDataService.getSubjects()
      ]);
      setPapers(docRes?.data || []);
      const subs = subRes?.data || [];
      setSubjects(subs);
      if (subs.length > 0 && !subject) {
        setSubject(subs[0].name);
      }
    } catch (err) {
      console.warn('Error loading PYQs:', err);
      setPapers([]);
    } finally {
      setIsLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (p) => {
    if (confirm(`Delete "${p.title || p.document || 'paper'}" from examination repository?`)) {
      try {
        await ragDocumentService.deleteDocument(p.id, p.storagePath);
        setPapers(prev => prev.filter(item => item.id !== p.id));
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
            Institutional PYQ Examination Repository
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '4px' }}>
            Manage Semester End Examinations (SEE), Mid assessments, and model answer key indexing
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>Upload Question Paper</span>
        </button>
      </div>

      {/* Papers Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject / Title</th>
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
                  Loading PYQ examination papers...
                </td>
              </tr>
            ) : papers.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="No PYQ Papers Found"
                message="No previous year question papers have been indexed in the RAG repository yet."
                isTableRow={true}
                colSpan={5}
                actionText="Upload Question Paper"
                onAction={() => setShowUploadModal(true)}
              />
            ) : (
              papers.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--color-primary)" />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {p.title || p.document || p.fileName}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, display: 'block' }}>
                          {p.fileName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple">
                      {p.documentType || 'PYQ'}
                    </span>
                  </td>
                  <td>{p.department || 'CSE'}</td>
                  <td>
                    <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={12} />
                      {p.status || 'Indexed'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => onOpenPdf({ title: p.title || p.fileName, doc: p.storagePath || p.fileName, page: 1 })}
                        className="btn btn-secondary btn-sm"
                      >
                        View Paper
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
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

      {/* Upload Modal Information */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Upload Previous Examination Paper
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.8, marginBottom: '14px' }}>
                Please use the RAG Document Ingestion Center to upload and categorize institutional question papers into the Supabase RAG storage bucket.
              </p>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                textAlign: 'center'
              }}>
                <HelpCircle size={24} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Supabase RAG Knowledge Ingestion
                </p>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.6, marginTop: '2px' }}>
                  Uploads will automatically extract PDF text, chunk, and create 384-dimensional vector embeddings.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowUploadModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
