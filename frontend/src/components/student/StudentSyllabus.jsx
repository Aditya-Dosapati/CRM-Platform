import React, { useState, useMemo, useEffect, useCallback } from 'react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';
import { 
  FileText, Sparkles, BookOpen, Layers, CheckCircle2, 
  RefreshCw, AlertCircle, FileCheck, ExternalLink, Download 
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

const SEMESTER_OPTIONS = [
  { value: 'Sem 1', number: 1, label: 'Semester 1' },
  { value: 'Sem 2', number: 2, label: 'Semester 2' },
  { value: 'Sem 3', number: 3, label: 'Semester 3' },
  { value: 'Sem 4', number: 4, label: 'Semester 4' },
  { value: 'Sem 5', number: 5, label: 'Semester 5' },
  { value: 'Sem 6', number: 6, label: 'Semester 6' },
  { value: 'Sem 7', number: 7, label: 'Semester 7' },
  { value: 'Sem 8', number: 8, label: 'Semester 8' }
];

export default function StudentSyllabus({ onOpenPdf, onOpenRagQuery }) {
  const currentUser = authService.getCurrentUser();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(() => currentUser?.departmentCode || currentUser?.branch || 'CSE');
  const [selectedSem, setSelectedSem] = useState(() => {
    const semNum = currentUser?.semester || 3;
    return `Sem ${semNum}`;
  });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [syllabusDocs, setSyllabusDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch departments on mount & resolve student cohort
  useEffect(() => {
    let isMounted = true;
    const loadInitialCohort = async () => {
      try {
        const [deptRes, profileRes] = await Promise.allSettled([
          academicDataService.getDepartments(),
          currentUser?.id ? academicDataService.getStudentProfile(currentUser.id) : Promise.resolve(null)
        ]);

        if (!isMounted) return;

        if (deptRes.status === 'fulfilled' && deptRes.value?.data?.length > 0) {
          const depts = deptRes.value.data;
          setDepartments(depts);

          // If student has explicit department in profile, default to it
          const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;
          const userDept = profile?.departmentCode || profile?.branch || currentUser?.departmentCode || currentUser?.branch;
          if (userDept) {
            const matched = depts.find(d => 
              String(d.code).toUpperCase() === String(userDept).toUpperCase() ||
              String(d.id).toLowerCase() === String(userDept).toLowerCase()
            );
            if (matched) {
              setSelectedDept(matched.code);
            }
          }

          if (profile?.semester) {
            setSelectedSem(`Sem ${profile.semester}`);
          }
        }
      } catch (e) {
        console.warn('[StudentSyllabus] Error initializing cohort defaults:', e);
      }
    };

    loadInitialCohort();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch subjects for selected department & syllabus documents
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectsRes, syllabusRes] = await Promise.all([
        academicDataService.getSubjects(selectedDept),
        ragDocumentService.getDocuments({ documentType: 'syllabus' })
      ]);

      if (subjectsRes?.error) {
        throw new Error(subjectsRes.error);
      }
      if (syllabusRes?.error && (!syllabusRes?.data || syllabusRes.data.length === 0)) {
        throw new Error(syllabusRes.error);
      }

      const rawSubs = Array.isArray(subjectsRes?.data) ? subjectsRes.data : (Array.isArray(subjectsRes) ? subjectsRes : []);
      setSubjects(rawSubs);

      const rawDocs = Array.isArray(syllabusRes?.data) ? syllabusRes.data : (Array.isArray(syllabusRes) ? syllabusRes : []);
      setSyllabusDocs(rawDocs);
    } catch (err) {
      console.error('[StudentSyllabus] Failed to load syllabus repository data:', err);
      setError(err.message || 'Unable to retrieve syllabus records from curriculum repository.');
      setSubjects([]);
      setSyllabusDocs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract selected semester number
  const currentSemNumber = useMemo(() => {
    const match = String(selectedSem).match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
  }, [selectedSem]);

  // Filter subjects strictly by current semester
  const semesterSubjects = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];
    const filtered = subjects.filter(s => Number(s.semester) === currentSemNumber);
    // If no subjects exist for this specific semester, fallback to empty rather than showing wrong semester
    return filtered;
  }, [subjects, currentSemNumber]);

  // Update selectedSubjectId when semesterSubjects changes
  useEffect(() => {
    if (semesterSubjects.length > 0) {
      setSelectedSubjectId(prev => {
        if (prev && semesterSubjects.some(s => s.id === prev || s.code === prev)) {
          return prev;
        }
        return semesterSubjects[0].id;
      });
    } else {
      setSelectedSubjectId('');
    }
  }, [semesterSubjects]);

  const selectedSubject = useMemo(() => {
    if (!semesterSubjects || semesterSubjects.length === 0) return null;
    return semesterSubjects.find(s => s.id === selectedSubjectId || s.code === selectedSubjectId) || semesterSubjects[0];
  }, [semesterSubjects, selectedSubjectId]);

  // Uploaded syllabus documents matching the selected subject
  const matchingSyllabusDocs = useMemo(() => {
    if (!selectedSubject) return [];
    const selId = String(selectedSubject.id || '').toLowerCase().trim();
    const selCode = String(selectedSubject.code || '').toUpperCase().trim();
    const selName = String(selectedSubject.name || '').toLowerCase().trim();

    return syllabusDocs.filter(doc => {
      const docSubId = String(doc.subjectId || doc.subject_id || '').toLowerCase().trim();
      const docSubCode = String(doc.subjectCode || doc.subject_code || doc.metadata?.subject_code || doc.subjects?.code || '').toUpperCase().trim();
      const docTitle = String(doc.title || doc.document || '').toUpperCase().trim();
      const docFileName = String(doc.fileName || doc.file_name || '').toUpperCase().trim();
      const docSubName = String(doc.subject || doc.subjectName || doc.metadata?.subject_name || doc.subjects?.name || '').toLowerCase().trim();

      // 1. Direct ID match
      if (selId && docSubId && (docSubId === selId)) return true;

      // 2. Exact Subject Code match (e.g. 23CS301)
      if (selCode && docSubCode && (docSubCode === selCode)) return true;

      // 3. Subject Code embedded in filename or title
      if (selCode && (docTitle.includes(selCode) || docFileName.includes(selCode))) return true;

      // 4. Subject Name match
      if (selName && (docSubName === selName || docTitle.toLowerCase().includes(selName))) return true;

      return false;
    });
  }, [syllabusDocs, selectedSubject]);

  const hasUploadedContent = matchingSyllabusDocs.length > 0 || (selectedSubject?.units && selectedSubject.units.length > 0);

  const handleOpenDocument = (doc) => {
    if (!onOpenPdf || !doc) return;
    onOpenPdf({
      id: doc.id,
      title: doc.title || `${selectedSubject?.name || 'Subject'} — Full Course Syllabus`,
      doc: doc.storagePath || doc.fileName,
      storagePath: doc.storagePath,
      fileName: doc.fileName,
      page: 1
    });
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
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            My Syllabus
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Access your subject-wise academic syllabus and vectorized RAG course units
          </p>
        </div>

        {selectedSubject && onOpenRagQuery && (
          <button
            onClick={() => onOpenRagQuery(`Summarize the official curriculum, unit breakdown, and high-yield examination topics for ${selectedSubject.name} (${selectedSubject.code}).`)}
            className="btn btn-primary"
          >
            <Sparkles size={15} />
            <span>Ask GMRIT AI: Syllabus Summary</span>
          </button>
        )}
      </div>

      {/* Filter Bar: Department, Semester, Subject */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}>
          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Department</label>
            <select 
              className="input-field" 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <option key={dept.code || dept.id} value={dept.code}>
                    {dept.name} ({dept.code})
                  </option>
                ))
              ) : (
                <option value="CSE">Computer Science & Engineering (CSE)</option>
              )}
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Semester</label>
            <select 
              className="input-field" 
              value={selectedSem} 
              onChange={(e) => setSelectedSem(e.target.value)}
            >
              {SEMESTER_OPTIONS.map((sem) => (
                <option key={sem.value} value={sem.value}>
                  {sem.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Subject</label>
            <select 
              className="input-field" 
              value={selectedSubjectId} 
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={loading || semesterSubjects.length === 0}
            >
              {loading ? (
                <option>Loading subjects...</option>
              ) : semesterSubjects.length === 0 ? (
                <option>No subjects available for {selectedSem}</option>
              ) : (
                semesterSubjects.map(s => (
                  <option key={s.id || s.code} value={s.id || s.code}>
                    {s.name} ({s.code})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px', color: 'var(--primary-blue)' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Loading Syllabus Data</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Querying curriculum repository...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card" style={{ padding: '20px', backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertCircle size={22} color="#DC2626" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#991B1B' }}>Failed to Load Syllabus</h3>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#B91C1C' }}>{error}</p>
            </div>
          </div>
          <button onClick={loadData} className="btn btn-primary btn-sm" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State when no subjects exist for the selected department & semester */}
      {!loading && !error && semesterSubjects.length === 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <EmptyState
            icon={BookOpen}
            title="No syllabus uploaded yet."
            message={`No syllabus uploaded yet for ${selectedDept} in ${selectedSem}.`}
            actionText="Refresh"
            onAction={loadData}
          />
        </div>
      )}

      {/* Subject Details & Uploaded Syllabus Resources */}
      {!loading && !error && selectedSubject && (
        <>
          <div className="card" style={{
            marginBottom: '16px',
            backgroundColor: 'var(--pastel-blue-bg)',
            borderColor: 'var(--pastel-blue-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-blue)'
                }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-blue">{selectedSubject.code}</span>
                    <span className="badge badge-gray">{selectedSubject.regulation || 'AR23'} Regulation</span>
                    <span className="badge badge-purple">{selectedSubject.credits} Credits</span>
                    <span className="badge badge-info">Semester {selectedSubject.semester || currentSemNumber}</span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedSubject.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Regulation: <strong>{selectedSubject.regulation || 'AR23'}</strong>
                    {selectedSubject.faculty ? <> • Faculty: <strong>{selectedSubject.faculty}</strong></> : null}
                  </p>
                </div>
              </div>

              {matchingSyllabusDocs.length > 0 && onOpenPdf && (
                <button
                  onClick={() => handleOpenDocument(matchingSyllabusDocs[0])}
                  className="btn btn-secondary btn-sm"
                >
                  <FileText size={14} />
                  <span>View Official PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Uploaded Official Syllabus Documents */}
          {matchingSyllabusDocs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {matchingSyllabusDocs.map((doc) => (
                <div key={doc.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="badge badge-green" style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} />
                          Official Syllabus
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {doc.title || doc.fileName}
                        </h4>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '6px 0 0 0' }}>
                        {doc.description || `Official BOS curriculum and course outline for ${selectedSubject.name} (${selectedSubject.code}).`}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px', fontSize: '11.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>📄 {doc.fileName}</span>
                        <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>⚡ {doc.chunks || 24} Vector Chunks</span>
                        <span>{doc.fileSizeFormatted || 'PDF Document'}</span>
                        <span>Updated: {doc.lastUpdated || 'Recently'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {onOpenPdf && (
                        <button
                          onClick={() => handleOpenDocument(doc)}
                          className="btn btn-secondary btn-sm"
                        >
                          <FileText size={13} />
                          <span>View Full PDF</span>
                        </button>
                      )}
                      {onOpenRagQuery && (
                        <button
                          onClick={() => onOpenRagQuery(`Explain the syllabus outline and examination format for ${selectedSubject.name} (${selectedSubject.code}).`)}
                          className="btn btn-subtle btn-sm"
                        >
                          <Sparkles size={13} />
                          <span>Ask AI</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unit-wise Breakdown if available */}
          {selectedSubject.units && selectedSubject.units.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedSubject.units.map((unit) => (
                <div key={`${selectedSubject.id}_${unit.number || unit.unitNumber}`} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="badge badge-blue" style={{ fontWeight: 800 }}>
                          {unit.number || `Unit ${unit.unitNumber}`}
                        </span>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {unit.title}
                        </h4>
                        <span className="badge badge-green" style={{ fontSize: '11px' }}>
                          <CheckCircle2 size={12} />
                          RAG Indexed
                        </span>
                      </div>

                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '6px 0 0 0' }}>
                        {unit.summary || `Covers theoretical concepts, formulations, and practical applications for ${unit.title}.`}
                      </p>
                    </div>

                    {onOpenRagQuery && (
                      <button
                        onClick={() => onOpenRagQuery(`Explain ${unit.number || unit.title} of ${selectedSubject.name}. Detail key formulas and exam questions.`)}
                        className="btn btn-subtle btn-sm"
                      >
                        <Sparkles size={13} />
                        <span>Ask AI</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Genuinely Empty State: Show exact required message when no syllabus is uploaded yet */}
          {!hasUploadedContent && (
            <div className="card" style={{ padding: '24px' }}>
              <EmptyState
                icon={BookOpen}
                title="No syllabus uploaded yet."
                message={`No syllabus uploaded yet for ${selectedSubject.name} (${selectedSubject.code}).`}
                actionText="Refresh"
                onAction={loadData}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
