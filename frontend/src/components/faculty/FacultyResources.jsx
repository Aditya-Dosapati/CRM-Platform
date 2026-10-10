import React, { useState, useEffect, useCallback } from 'react';
import { FolderArchive, Plus, FileText, Trash2, CheckCircle2, Download, Eye, Users } from 'lucide-react';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import EmptyState from '../common/EmptyState';
import FacultyResourceUploadModal from './FacultyResourceUploadModal';
import { getBranchDisplay } from '../../services/academicCohortService';

export default function FacultyResources({ onOpenPdf }) {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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
      
      // Also merge any local cache entries
      const localStore = ragDocumentService._loadLocalStore();
      for (const lDoc of localStore) {
        if (lDoc.uploaded_by === activeUserId || lDoc.uploadedBy === activeUserId) {
          const alreadyExists = docs.some(d => 
            (d.id && lDoc.id && d.id === lDoc.id) ||
            (d.storagePath && lDoc.storage_path && d.storagePath === lDoc.storage_path) ||
            (d.storagePath && lDoc.storagePath && d.storagePath === lDoc.storagePath)
          );
          if (!alreadyExists) {
            docs.unshift({
              id: lDoc.id,
              title: lDoc.title,
              document: lDoc.title,
              fileName: lDoc.file_name || lDoc.fileName,
              storagePath: lDoc.storage_path || lDoc.storagePath,
              documentType: lDoc.document_type || lDoc.documentType,
              subject: lDoc.metadata?.subject_name || lDoc.subject || 'Course Material',
              department: lDoc.department,
              branch: lDoc.branch,
              year: lDoc.year,
              semester: lDoc.semester,
              section: lDoc.section,
              academicYear: lDoc.academic_year,
              status: lDoc.status === 'published' ? 'Published' : 'Indexed',
              rawStatus: lDoc.status,
              uploadedBy: lDoc.uploaded_by,
              fileSizeFormatted: lDoc.metadata?.file_size ? `${(lDoc.metadata.file_size / (1024*1024)).toFixed(1)} MB` : 'PDF'
            });
          }
        }
      }

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

    const handleUpdate = () => {
      loadResources();
    };

    window.addEventListener('gmrit_resources_updated', handleUpdate);
    return () => {
      window.removeEventListener('gmrit_resources_updated', handleUpdate);
    };
  }, [loadResources]);

  const handleDelete = async (doc) => {
    if (confirm(`Delete "${doc.title || doc.document || 'resource'}" from course repository? This will remove access for mapped students.`)) {
      try {
        await ragDocumentService.deleteDocument(doc.id, doc.storagePath);
        setResources(prev => prev.filter(r => r.id !== doc.id));
      } catch (err) {
        alert(`Failed to delete resource: ${err.message}`);
      }
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      await ragDocumentService.downloadDocument(
        doc.storagePath || doc.storage_path || doc.fileName,
        doc.fileName || `${doc.title}.pdf`,
        doc
      );
    } catch (err) {
      alert(`Download Failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
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
            Faculty Course Resources
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Upload, manage, and share lecture notes, syllabi, PYQs, and lab manuals with mapped student cohorts
          </p>
        </div>

        <button 
          id="faculty-upload-resource-btn"
          onClick={() => setShowUploadModal(true)} 
          className="btn btn-primary"
        >
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
              <th>Mapped Student Cohort</th>
              <th>Document Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text)' }}>
                  Loading academic resources...
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Academic Resources"
                message="No lecture notes or course resources have been uploaded yet. Click '+ Upload Resource' to share materials with your assigned classes."
                isTableRow={true}
                colSpan={6}
                actionText="Upload Resource"
                onAction={() => setShowUploadModal(true)}
              />
            ) : (
              resources.map((res) => {
                const branchDisp = getBranchDisplay(res.department || 'CSE', res.branch || res.department || 'CSE');
                const cohortLabel = `${branchDisp} • Y${res.year || 4} S${res.semester || 7} • Sec ${res.section || 'A'}`;
                const audType = res.audienceType || res.audience_type || res.metadata?.audience_type || 'cohort';
                const selectedCount = (res.selectedStudentIds || res.selected_student_ids || res.metadata?.selected_student_ids || []).length;
                const isPublished = (res.rawStatus || res.status) === 'published' || (res.rawStatus || res.status) === 'Published' || (res.rawStatus || res.status) === 'indexed';

                const handleTogglePublish = async () => {
                  const newStatus = isPublished ? 'draft' : 'published';
                  try {
                    await ragDocumentService.toggleResourceStatus(res.id, newStatus);
                    setResources(prev => prev.map(r => r.id === res.id ? { ...r, status: newStatus === 'published' ? 'Published' : 'Draft', rawStatus: newStatus } : r));
                  } catch (err) {
                    alert(`Failed to update status: ${err.message}`);
                  }
                };

                return (
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
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={16} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)', display: 'block' }}>
                            {res.title || res.document || res.fileName}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {res.fileName || 'document.pdf'} {res.fileSizeFormatted ? `• ${res.fileSizeFormatted}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{res.subject || 'Academic Resource'}</span>
                      {res.subjectCode && (
                        <span className="badge badge-blue" style={{ fontSize: '10px', marginLeft: '6px' }}>
                          {res.subjectCode}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={13} color="var(--color-primary)" />
                          <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                            {cohortLabel}
                          </span>
                        </div>
                        <div>
                          {audType === 'selected_students' ? (
                            <span className="badge badge-orange" style={{ fontSize: '10.5px' }}>
                              Selected Students ({selectedCount})
                            </span>
                          ) : (
                            <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>
                              Entire Class Cohort
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                        {res.documentType || 'Document'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={handleTogglePublish}
                        className={`badge ${isPublished ? 'badge-green' : 'badge-gray'}`}
                        style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Click to toggle Published / Draft"
                      >
                        <CheckCircle2 size={11} />
                        <span>{isPublished ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onOpenPdf({
                            id: res.id,
                            title: res.title || res.fileName,
                            doc: res.storagePath || res.storage_path || res.fileName,
                            storagePath: res.storagePath || res.storage_path,
                            fileName: res.fileName || res.file_name,
                            uploaderName: res.facultyName || 'Faculty',
                            subject: res.subject,
                            subjectCode: res.subjectCode,
                            department: res.department,
                            page: 1
                          })}
                          className="btn btn-secondary btn-sm"
                          title="Preview PDF Document"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownload(res)}
                          disabled={downloadingId === res.id}
                          className="btn btn-secondary btn-sm"
                          title="Download Original Document"
                        >
                          <Download size={13} />
                          <span>{downloadingId === res.id ? '...' : 'Download'}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(res)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--error)' }}
                          title="Delete Resource"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <FacultyResourceUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={() => {
            loadResources();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}
