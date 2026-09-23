import React, { useState, useEffect, useCallback } from 'react';
import { FolderArchive, Plus, FileText, Download, Trash2, Edit3, CheckCircle2, X, Upload } from 'lucide-react';
import ragDocumentService from '../../services/ragDocumentService';
import academicDataService from '../../services/academicDataService';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function FacultyResources({ onOpenPdf }) {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEscapeKey(() => setShowUploadModal(false), showUploadModal);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [fileType, setFileType] = useState('notes');

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resData, subData] = await Promise.all([
        ragDocumentService.getDocuments(),
        academicDataService.getSubjects()
      ]);
      setResources(resData?.data || []);
      const subs = subData?.data || [];
      setSubjects(subs);
      if (subs.length > 0 && !subjectId) {
        setSubjectId(subs[0].id);
      }
    } catch (e) {
      console.warn('Error loading faculty resources:', e);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleDelete = async (doc) => {
    if (confirm(`Delete "${doc.title || doc.document || 'resource'}" from course repository?`)) {
      try {
        await ragDocumentService.deleteDocument(doc.id, doc.storagePath);
        setResources(prev => prev.filter(r => r.id !== doc.id));
      } catch (err) {
        alert(`Failed to delete resource: ${err.message}`);
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
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
            Faculty Resources
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Upload and manage lecture notes, handouts, PYQs, and reference PDFs
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>+ Upload Resource</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Subject</th>
              <th>Document Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text)' }}>
                  Loading academic resources...
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Academic Resources"
                message="No lecture notes or course resources have been uploaded yet. Click '+ Upload Resource' to add one."
                isTableRow={true}
                colSpan={5}
                actionText="Upload Resource"
                onAction={() => setShowUploadModal(true)}
              />
            ) : (
              resources.map((res) => (
                <tr key={res.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)', display: 'block' }}>
                          {res.title || res.document || res.fileName}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6 }}>
                          {res.fileName || 'document.pdf'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{res.subject || 'Academic Resource'}</span>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                      {res.documentType || 'Document'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      (res.rawStatus || res.status) === 'indexed' ? 'badge-green' :
                      (res.rawStatus || res.status) === 'processing' ? 'badge-orange' : 'badge-blue'
                    }`}>
                      <CheckCircle2 size={11} />
                      {res.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => onOpenPdf({ title: res.title || res.fileName, doc: res.storagePath || res.fileName, page: 1 })}
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(res)}
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

      {/* Upload Info Note Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                Upload Academic Resource
              </h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.8, marginBottom: '16px' }}>
                To upload and index documents directly into the Supabase RAG storage pipeline, please use the centralized RAG upload interface.
              </p>
              <div style={{
                padding: '24px',
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg)'
              }}>
                <Upload size={24} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Supabase RAG Document Ingestion
                </p>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.6, marginTop: '2px' }}>
                  Documents uploaded are securely stored in the private rag-documents storage bucket and mapped with strict subject-level RLS.
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
