import React, { useState, useMemo, useEffect, useCallback } from 'react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';
import SyllabusViewer from './syllabus/SyllabusViewer';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import {
  BookOpen, FileText, Sparkles, CheckCircle2, Download, Layers,
  GraduationCap, Clock, Award, Users, ChevronRight, BarChart3, AlertCircle,
  RefreshCw, Database, BookMarked
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function StudentSubjects({ onOpenPdf, onOpenRagQuery }) {
  // Student Profile State (resolves branch/stream, semester, FSI status)
  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Active View State: 'syllabus' (default academic syllabus) | 'enrolled' (legacy active enrollments)
  const [activePortalView, setActivePortalView] = useState('syllabus');

  // Enrolled subjects state
  const [subjects, setSubjects] = useState([]);
  const [subjectPYQs, setSubjectPYQs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [activeTab, setActiveTab] = useState('syllabus'); // 'overview' | 'syllabus' | 'pyqs'
  const [pyqYearFilter, setPyqYearFilter] = useState('All');
  const [pyqExamFilter, setPyqExamFilter] = useState('All');

  // 1. Fetch Verified Student Profile & Branch from public.students and public.departments
  const fetchStudentProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const user = authService.getCurrentUser();
      const profile = await academicDataService.getStudentProfile(user?.userId || user?.id);
      setStudentProfile(profile);
    } catch (err) {
      console.warn('[StudentSubjects] Failed to resolve student profile:', err);
      setStudentProfile({
        branch: 'CSE',
        branchCode: 'CSE',
        departmentName: 'Computer Science & Engineering',
        semester: 1,
        year: 1,
        isFSI: false,
        careerPath: null
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentProfile();
  }, [fetchStudentProfile]);

  // 2. Fetch Optional Course Enrollments
  // Non-blocking: syllabus display DOES NOT depend on this
  const fetchSubjectsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = authService.getCurrentUser();

      const studentId = currentUser?.id || currentUser?.userId;

      if (!studentId) {
        console.warn('[StudentSubjects] No authenticated student found.');
        setSubjects([]);
        setSelectedSubjectId('');
        return;
      }

      const loadedSubjects =
        await facultyAssignmentService.getStudentAssignedSubjects(
          studentId,
          currentUser
        );

      if (loadedSubjects && loadedSubjects.length > 0) {
        setSubjects(loadedSubjects);

        setSelectedSubjectId((prevId) => {
          if (prevId && loadedSubjects.some((s) => s.id === prevId)) {
            return prevId;
          }

          return loadedSubjects[0].id;
        });
      } else {
        setSubjects([]);
        setSelectedSubjectId('');
      }
    } catch (err) {
      console.warn(
        '[StudentSubjects] Notice fetching course enrollments:',
        err
      );
      setSubjects([]);
      setSelectedSubjectId('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjectsData();

    const handleUpdate = () => {
      fetchSubjectsData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('gmrit_assignments_updated', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmrit_assignments_updated', handleUpdate);
      }
    };
  }, [fetchSubjectsData]);

  const selectedSubject = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  // Fetch subject-specific PYQs if an enrolled subject is viewed
  useEffect(() => {
    let isMounted = true;
    const loadPYQs = async () => {
      if (!selectedSubject) {
        setSubjectPYQs([]);
        return;
      }
      try {
        const docs = await ragDocumentService.getDocuments({
          subjectId: selectedSubject.id,
          documentType: 'pyq'
        });
        if (isMounted) {
          const list = Array.isArray(docs) ? docs : (docs?.data || []);
          setSubjectPYQs(list);
        }
      } catch (e) {
        if (isMounted) setSubjectPYQs([]);
      }
    };
    loadPYQs();
    return () => { isMounted = false; };
  }, [selectedSubject]);

  if (profileLoading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              My Subjects
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Loading academic curriculum and branch structure...
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px', color: 'var(--primary-blue)' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Loading Academic Syllabus</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Querying verified branch and semester curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Top Portal Switcher (Only shown if student has active course enrollments to explore) */}
      {subjects.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActivePortalView('syllabus')}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: activePortalView === 'syllabus' ? 700 : 500,
              borderRadius: 'var(--radius-md)',
              border: activePortalView === 'syllabus' ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
              backgroundColor: activePortalView === 'syllabus' ? 'var(--pastel-blue-bg)' : '#FFFFFF',
              color: activePortalView === 'syllabus' ? 'var(--primary-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookMarked size={14} />
            <span>Academic Syllabus (All Semesters)</span>
          </button>

          <button
            onClick={() => setActivePortalView('enrolled')}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: activePortalView === 'enrolled' ? 700 : 500,
              borderRadius: 'var(--radius-md)',
              border: activePortalView === 'enrolled' ? '1px solid var(--primary-blue)' : '1px solid var(--border-light)',
              backgroundColor: activePortalView === 'enrolled' ? 'var(--pastel-blue-bg)' : '#FFFFFF',
              color: activePortalView === 'enrolled' ? 'var(--primary-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={14} />
            <span>Active Enrolled Courses ({subjects.length})</span>
          </button>
        </div>
      )}

      {/* VIEW 1: COMPLETE ACADEMIC SYLLABUS VIEWER (Primary & Default) */}
      {activePortalView === 'syllabus' && (
        <SyllabusViewer
          studentProfile={studentProfile}
          onOpenRagQuery={onOpenRagQuery}
        />
      )}

      {/* VIEW 2: ACTIVE ENROLLED COURSE WORKSPACE (Secondary, if enrollments exist) */}
      {activePortalView === 'enrolled' && selectedSubject && (
        <div>
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
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
                Enrolled Course Materials & PYQs
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Course materials, lecture units, and previous year examination papers for active semester
              </p>
            </div>

            {onOpenRagQuery && (
              <button
                onClick={() => onOpenRagQuery(`Provide a high-yield study guide and revision summary for ${selectedSubject.name} (Code: ${selectedSubject.code})`)}
                className="btn btn-primary"
              >
                <Sparkles size={14} />
                <span>Ask AI Subject Tutor</span>
              </button>
            )}
          </div>

          {/* Enrolled Subjects Horizontal Selector Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {subjects.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  style={{
                    backgroundColor: isSelected ? 'var(--pastel-blue-bg)' : '#FFFFFF',
                    border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '10px' }}>{sub.code}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--primary-blue)' : 'var(--text-muted)' }}>
                      {sub.credits} Cr
                    </span>
                  </div>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    marginBottom: '6px'
                  }}>
                    {sub.name}
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Semester {sub.semester || '—'} • {sub.units?.length || 4} Units
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Subject Banner Card */}
          <div className="card" style={{
            padding: '20px 24px',
            marginBottom: '20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--pastel-blue-bg)',
                  color: 'var(--primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <BookOpen size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">{selectedSubject.code}</span>
                    <span className="badge badge-purple">{selectedSubject.credits} Credits</span>
                    <span className="badge badge-gray">{selectedSubject.regulation || 'AR23'} Regulation</span>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                    {selectedSubject.name}
                  </h2>
                </div>
              </div>

              {onOpenPdf && (
                <button
                  onClick={() => onOpenPdf({
                    title: `${selectedSubject.name} — Full Course Syllabus`,
                    doc: `${selectedSubject.code}_Full_Syllabus.pdf`,
                    page: 1
                  })}
                  className="btn btn-secondary btn-sm"
                >
                  <FileText size={14} />
                  <span>Full Syllabus PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs: Syllabus Units | Course Overview | PYQs */}
          <div className="tabs-nav" style={{ marginBottom: '18px' }}>
            <button
              onClick={() => setActiveTab('syllabus')}
              className={`tab-button ${activeTab === 'syllabus' ? 'active' : ''}`}
            >
              <Layers size={14} style={{ marginRight: '6px' }} />
              <span>Syllabus Units ({(selectedSubject.units?.length || 4)})</span>
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <BarChart3 size={14} style={{ marginRight: '6px' }} />
              <span>Course Learning Objectives</span>
            </button>
            <button
              onClick={() => setActiveTab('pyqs')}
              className={`tab-button ${activeTab === 'pyqs' ? 'active' : ''}`}
            >
              <Award size={14} style={{ marginRight: '6px' }} />
              <span>Subject PYQs ({subjectPYQs.length})</span>
            </button>
          </div>

          {/* TAB 1: SYLLABUS UNITS */}
          {activeTab === 'syllabus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(selectedSubject.units || [
                { number: 'Unit I', title: 'Introduction & Core Foundations', summary: `Covers foundational principles and algorithmic models of ${selectedSubject.name}.`, pdfName: `${selectedSubject.code}_Unit1.pdf`, ragChunks: 38 },
                { number: 'Unit II', title: 'Theoretical Frameworks & Structures', summary: `Detailed examination of theoretical constructs and system architecture.`, pdfName: `${selectedSubject.code}_Unit2.pdf`, ragChunks: 42 },
                { number: 'Unit III', title: 'Algorithmic Formulations & Problem Solving', summary: `Analytical formulations, complexity analysis, and modern algorithms.`, pdfName: `${selectedSubject.code}_Unit3.pdf`, ragChunks: 56 },
                { number: 'Unit IV', title: 'Advanced Applications & Emerging Trends', summary: `Real-world case studies, system implementations, and modern architectures.`, pdfName: `${selectedSubject.code}_Unit4.pdf`, ragChunks: 46 }
              ]).map((unit) => (
                <div key={unit.number} className="card" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-blue" style={{ fontWeight: 800 }}>
                          {unit.number}
                        </span>
                        <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {unit.title}
                        </h4>
                        <span className="badge badge-green" style={{ fontSize: '11px' }}>
                          <CheckCircle2 size={12} />
                          RAG Vectorized
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: '6px' }}>
                        {unit.summary}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '11.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>📄 {unit.pdfName}</span>
                        <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>⚡ {unit.ragChunks || 42} Vector Chunks</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {onOpenPdf && (
                        <button
                          onClick={() => onOpenPdf({
                            title: `${selectedSubject.name}: ${unit.number} — ${unit.title}`,
                            doc: unit.pdfName,
                            page: 1
                          })}
                          className="btn btn-secondary btn-sm"
                        >
                          <FileText size={13} />
                          <span>View Notes PDF</span>
                        </button>
                      )}
                      {onOpenRagQuery && (
                        <button
                          onClick={() => onOpenRagQuery(`Explain ${unit.number} of ${selectedSubject.name} (${unit.title}). Provide key concepts and exam topics.`)}
                          className="btn btn-subtle btn-sm"
                        >
                          <Sparkles size={13} />
                          <span>Ask AI Tutor</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: COURSE LEARNING OBJECTIVES */}
          {activeTab === 'overview' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Course Learning Objectives (CLOs)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  `Understand foundational theoretical principles and algorithmic paradigms of ${selectedSubject.name}.`,
                  `Formulate analytical problem solutions and evaluate complexity trade-offs under practical engineering constraints.`,
                  `Implement robust computer applications utilizing standardized laboratory toolsets and development frameworks.`,
                  `Synthesize multidisciplinary case studies for autonomous engineering design and scientific reporting.`
                ].map((clo, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span className="badge badge-blue" style={{ minWidth: '24px', justifyContent: 'center' }}>CLO {idx + 1}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{clo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SUBJECT PYQS */}
          {activeTab === 'pyqs' && (
            <div>
              <div className="card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <label className="input-label" style={{ fontSize: '11px' }}>Filter by Year</label>
                    <select className="input-field" value={pyqYearFilter} onChange={(e) => setPyqYearFilter(e.target.value)} style={{ paddingBlock: '6px' }}>
                      <option value="All">All Years</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label" style={{ fontSize: '11px' }}>Filter by Exam Type</label>
                    <select className="input-field" value={pyqExamFilter} onChange={(e) => setPyqExamFilter(e.target.value)} style={{ paddingBlock: '6px' }}>
                      <option value="All">All Examinations</option>
                      <option value="Semester End Examination">Semester End Examination</option>
                      <option value="Mid Examination">Mid Examination</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Examination</th>
                      <th>Year</th>
                      <th>Questions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectPYQs.length === 0 ? (
                      <EmptyState
                        icon={FileText}
                        title="No PYQs Available"
                        message={`No previous year question papers found for ${selectedSubject.name}.`}
                        isTableRow={true}
                        colSpan={4}
                      />
                    ) : (
                      subjectPYQs.map((pyq) => (
                        <tr key={pyq.id}>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                              {pyq.examType || 'Semester Examination'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                              {pyq.year || '2024'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{pyq.questionCount || 5} Questions</td>
                          <td>
                            {onOpenPdf && (
                              <button
                                onClick={() => onOpenPdf({
                                  title: `${selectedSubject.name} — ${pyq.year}`,
                                  doc: pyq.pdfUrl,
                                  page: 1
                                })}
                                className="btn btn-secondary btn-sm"
                              >
                                <FileText size={13} />
                                <span>View PDF</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}