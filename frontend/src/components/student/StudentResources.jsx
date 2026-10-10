import React, { useState, useMemo, useEffect, useCallback } from 'react';
import academicDataService from '../../services/academicDataService';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import authService from '../../services/authService';
import ragDocumentService from '../../services/ragDocumentService';
import { 
  FolderDown, BookOpen, FileText, Download, Sparkles, Filter, 
  Search, ExternalLink, Bookmark, CheckCircle2, User, Calendar, 
  Layers, Eye, Loader2 
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function StudentResources({ onOpenPdf, onOpenRagQuery }) {
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'syllabus' | 'notes' | 'pyq' | 'lab_manual' | 'reference'
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = authService.getCurrentUser();
      const studentId = currentUser?.id || currentUser?.userId;
      
      const [assignedSubs, studentDocs] = await Promise.all([
        facultyAssignmentService.getStudentAssignedSubjects(studentId, currentUser),
        ragDocumentService.getStudentResources(studentId, currentUser)
      ]);

      if (assignedSubs && assignedSubs.length > 0) {
        setSubjects(assignedSubs);
      } else {
        const allSubs = await academicDataService.getSubjects();
        if (allSubs?.data) setSubjects(allSubs.data);
      }

      setResources(studentDocs || []);
    } catch (err) {
      console.warn('StudentResources: could not fetch student academic data:', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();

    const handleUpdate = () => {
      fetchStudentData();
    };

    window.addEventListener('gmrit_resources_updated', handleUpdate);
    return () => {
      window.removeEventListener('gmrit_resources_updated', handleUpdate);
    };
  }, [fetchStudentData]);

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      // 1. Category Filter
      if (selectedCategory !== 'All') {
        const cat = (res.documentType || res.document_type || '').toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) return false;
      }

      // 2. Subject Filter
      if (selectedSubject !== 'All') {
        const subId = res.subjectId || res.subject_id;
        const subName = res.subject || '';
        if (subId !== selectedSubject && subName !== selectedSubject) return false;
      }

      // 3. Search Query Filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = res.title && res.title.toLowerCase().includes(q);
        const fileMatch = res.fileName && res.fileName.toLowerCase().includes(q);
        const subjectMatch = res.subject && res.subject.toLowerCase().includes(q);
        const facultyMatch = res.facultyName && res.facultyName.toLowerCase().includes(q);
        const descMatch = res.description && res.description.toLowerCase().includes(q);
        return titleMatch || fileMatch || subjectMatch || facultyMatch || descMatch;
      }

      return true;
    });
  }, [resources, selectedCategory, selectedSubject, searchQuery]);

  const handleDownload = async (res) => {
    setDownloadingId(res.id);
    try {
      await ragDocumentService.downloadDocument(
        res.storagePath || res.storage_path || res.fileName,
        res.fileName || `${res.title}.pdf`,
        res
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px' }}>
            Academic Resources & Course Library
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Verified faculty lecture notes, course syllabi, laboratory manuals, and previous year question papers
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery && onOpenRagQuery("Recommend the best study materials, lecture notes, and reference guides for my current subjects.")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Resource Recommendations</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'center'
        }}>
          <div>
            <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>Resource Type</label>
            <select
              id="student-resource-category-select"
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Resource Types</option>
              <option value="notes">Faculty Lecture Notes</option>
              <option value="syllabus">Curriculum & Syllabus</option>
              <option value="pyq">Previous Year Questions (PYQ)</option>
              <option value="lab_manual">Laboratory Manuals</option>
              <option value="reference">Quick Reference Guides</option>
              <option value="textbook">Reference Textbooks</option>
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>Subject</label>
            <select
              id="student-resource-subject-select"
              className="input-field"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="All">All Enrolled Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11px', fontWeight: 700 }}>Search Resources</label>
            <div style={{ position: 'relative' }}>
              <input
                id="student-resource-search-input"
                type="text"
                placeholder="Search title, faculty, subject..."
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-primary)' }} />
          <p style={{ margin: 0, fontSize: '14px' }}>Loading your verified course resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="card" style={{ padding: '30px' }}>
          <EmptyState
            icon={BookOpen}
            title="No Course Resources Found"
            description="No lecture notes or course materials match your current category or search criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSelectedCategory('All');
              setSelectedSubject('All');
              setSearchQuery('');
            }}
          />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '18px'
        }}>
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                borderRadius: 'var(--radius-lg, 12px)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                {/* Top Tags */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                      {res.category || res.documentType || 'Course Note'}
                    </span>
                    {res.audienceType === 'selected_students' && (
                      <span className="badge badge-blue" style={{ fontSize: '10.5px', fontWeight: 600 }}>
                        Direct Share
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                    {res.fileSizeFormatted || 'PDF Document'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px', lineHeight: 1.35 }}>
                  {res.title || res.fileName}
                </h3>

                {/* Subject & Faculty Metadata */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg, #f8fafc)',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '12px',
                  color: 'var(--color-text)',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={13} color="var(--color-primary)" />
                    <span style={{ fontWeight: 700 }}>{res.subject}</span>
                    {res.subjectCode && (
                      <span className="badge badge-blue" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {res.subjectCode}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                    <User size={13} />
                    <span>Uploaded by: <strong style={{ color: 'var(--color-text)' }}>{res.facultyName}</strong></span>
                  </div>

                  {res.uploadDateFormatted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                      <Calendar size={13} />
                      <span>Published: {res.uploadDateFormatted}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #e2e8f0)' }}>
                <button
                  id={`student-view-resource-${res.id}`}
                  onClick={() => onOpenPdf && onOpenPdf({
                    id: res.id,
                    title: res.title || res.fileName,
                    doc: res.storagePath || res.storage_path || res.fileName,
                    storagePath: res.storagePath || res.storage_path,
                    fileName: res.fileName || res.file_name,
                    uploaderName: res.facultyName,
                    subject: res.subject,
                    subjectCode: res.subjectCode,
                    department: res.department,
                    page: 1
                  })}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
                  title="View and preview original PDF document"
                >
                  <Eye size={14} />
                  <span>View Document</span>
                </button>

                <button
                  id={`student-download-resource-${res.id}`}
                  onClick={() => handleDownload(res)}
                  disabled={downloadingId === res.id}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
                  title="Download verified document to device"
                >
                  {downloadingId === res.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download</span>
                    </>
                  )}
                </button>

                {onOpenRagQuery && (
                  <button
                    onClick={() => onOpenRagQuery(`Explain and summarize key concepts from "${res.title}".`)}
                    className="btn btn-subtle btn-sm"
                    title="Ask AI about this resource"
                    style={{ padding: '6px 10px' }}
                  >
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
