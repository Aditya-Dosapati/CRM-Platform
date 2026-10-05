import React, { useState, useEffect, useCallback } from 'react';
import { FolderArchive, Plus, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import ragDocumentService from '../../services/ragDocumentService';
import academicDataService from '../../services/academicDataService';
import authService from '../../services/authService';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import EmptyState from '../common/EmptyState';
import RagUploadModal from '../admin/RagUploadModal';

export default function FacultyResources({ onOpenPdf }) {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Get authenticated user ID from Supabase auth session or authService
      let activeUserId = null;
      if (isSupabaseConfigured()) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          activeUserId = authData?.user?.id;
        } catch (authErr) {
          console.warn('[FacultyResources] Notice getting supabase auth user:', authErr);
        }
      }
      if (!activeUserId) {
        const currentUser = authService.getCurrentUser();
        activeUserId = currentUser?.userId || currentUser?.id;
      }

      // 2. Fetch resources strictly scoped by uploaded_by at the database layer
      const resData = activeUserId
        ? await ragDocumentService.getDocuments({ uploadedBy: activeUserId })
        : { data: [] };

      let docs = resData?.data || [];
      // 3. Strict client-side ownership guard
      if (activeUserId) {
        docs = docs.filter(doc => (doc.uploadedBy === activeUserId || doc.uploaded_by === activeUserId));
      } else {
        docs = [];
      }

      setResources(docs);
    } catch (e) {
      console.warn('Error loading faculty resources:', e);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <RagUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={() => {
            loadResources();
          }}
        />
      )}
    </div>
  );
}
