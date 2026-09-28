import React, { useState, useMemo, useEffect, useCallback } from 'react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import { 
  BookOpen, FileText, Sparkles, CheckCircle2, Download, Layers, 
  GraduationCap, Clock, Award, Users, ChevronRight, BarChart3, AlertCircle,
  RefreshCw, Database
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function StudentSubjects({ onOpenPdf, onOpenRagQuery }) {
  const [subjects, setSubjects] = useState([]);
  const [subjectPYQs, setSubjectPYQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('init');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [activeTab, setActiveTab] = useState('syllabus'); // 'overview' | 'syllabus' | 'pyqs'
  const [pyqYearFilter, setPyqYearFilter] = useState('All');
  const [pyqExamFilter, setPyqExamFilter] = useState('All');


  const fetchSubjectsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await academicDataService.getSubjects();
      if (res.data && res.data.length > 0) {
        setSubjects(res.data);
        setSelectedSubjectId(prevId => {
          if (prevId && res.data.some(s => s.id === prevId)) return prevId;
          return res.data[0].id;
        });
      } else {
        setSubjects([]);
      }
      setDataSource(res.source);
      if (res.error) {
        // Non-blocking warning error
        console.warn('Academic data source note:', res.error);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError(err.message || 'Unable to retrieve course subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjectsData();
  }, [fetchSubjectsData]);

  const selectedSubject = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  // Fetch subject-specific PYQs from Supabase RAG documents
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
          setSubjectPYQs(docs || []);
        }
      } catch (e) {
        console.warn('Could not load subject PYQs:', e);
        if (isMounted) setSubjectPYQs([]);
      }
    };
    loadPYQs();
    return () => { isMounted = false; };
  }, [selectedSubject]);


  if (loading && subjects.length === 0) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              My Subjects & Course Portal
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Loading course syllabus and indexed curriculum data...
            </p>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className="card"
              style={{
                height: '100px',
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                Loading Subject...
              </span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px', color: 'var(--primary-blue)' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Connecting to Academic Knowledge Base</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Fetching R20 curriculum structure and lecture units...</p>
        </div>
      </div>
    );
  }

  if (error && subjects.length === 0) {
    return (
      <div className="page-content">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>My Subjects & Course Portal</h1>
        </div>
        <div className="card" style={{ padding: '24px', backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertCircle size={22} color="#DC2626" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#991B1B' }}>Failed to Load Course Subjects</h3>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#B91C1C' }}>{error}</p>
            </div>
          </div>
          <button onClick={fetchSubjectsData} className="btn btn-primary btn-sm" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  if (!selectedSubject || subjects.length === 0) {
    return (
      <div className="page-content">
        <EmptyState
          icon={BookOpen}
          title="No Subjects Enrolled"
          message="There are currently no active course subjects registered for this semester."
          actionText="Refresh Course List"
          onAction={fetchSubjectsData}
        />
      </div>
    );
  }

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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            My Subjects & Course Portal
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Unified subject workspace for syllabus units, course materials, and previous year question papers
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery(`Provide a high-yield study guide and revision summary for ${selectedSubject.name} (Code: ${selectedSubject.code})`)}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>Ask AI Subject Tutor</span>
        </button>
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
                  {sub.progress}%
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
                {sub.credits} Credits • {sub.units?.length || 0} Units
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
                <span className="badge badge-gray">R20 Regulation</span>
                <span className="badge badge-green">{(selectedSubject.units?.length || 4)} Units Indexed</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                {selectedSubject.name}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Coordinator: <strong>{selectedSubject.faculty}</strong> • Department: <strong>Computer Science & Engineering</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
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
            <button
              onClick={() => onOpenRagQuery(`Provide previous exam high-weightage topics for ${selectedSubject.name}`)}
              className="btn btn-subtle btn-sm"
            >
              <Sparkles size={14} />
              <span>Exam Analysis</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats for subject */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Syllabus Coverage</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-blue)' }}>{selectedSubject.progress}%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Class Attendance</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)' }}>92.4%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Internal Score (Avg)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>26 / 30</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Available PYQs</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--pastel-purple-text)' }}>{subjectPYQs.length || 3} Papers</div>
          </div>
        </div>
      </div>

      {/* Tabs: Course Overview | Syllabus Units | Subject PYQs */}
      <div className="tabs-nav" style={{ marginBottom: '18px' }}>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`tab-button ${activeTab === 'syllabus' ? 'active' : ''}`}
        >
          <Layers size={14} style={{ marginRight: '6px' }} />
          <span>Syllabus Units ({(selectedSubject.units?.length || 0)})</span>
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <BarChart3 size={14} style={{ marginRight: '6px' }} />
          <span>Course Overview & Learning Outcomes</span>
        </button>
        <button
          onClick={() => setActiveTab('pyqs')}
          className={`tab-button ${activeTab === 'pyqs' ? 'active' : ''}`}
        >
          <Award size={14} style={{ marginRight: '6px' }} />
          <span>Subject PYQs & Model Papers</span>
        </button>
      </div>

      {/* TAB 1: SYLLABUS UNITS */}
      {activeTab === 'syllabus' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(selectedSubject.units || []).map((unit) => (
            <div key={`${selectedSubject.id}_${unit.number}`} className="card" style={{ padding: '18px 22px' }}>
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
                    {unit.summary || `Covers core theoretical concepts, problem formulations, and algorithmic implementations for ${unit.title}.`}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '11.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>📄 {unit.pdfName}</span>
                    <span>📚 {unit.notesCount || 3} Handouts</span>
                    <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>⚡ {unit.ragChunks || 48} Vector Chunks</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <button
                    onClick={() => onOpenRagQuery(`Explain ${unit.number} of ${selectedSubject.name} (${unit.title}). Provide a concise breakdown with key mathematical equations, examples, and expected 10-mark questions.`)}
                    className="btn btn-subtle btn-sm"
                  >
                    <Sparkles size={13} />
                    <span>Ask AI Tutor</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: COURSE OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Course Learning Objectives (CLOs)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                `Understand foundational theoretical principles and modern algorithmic paradigms of ${selectedSubject.name}.`,
                `Formulate analytical problem solutions and evaluate complexity trade-offs under real-world constraints.`,
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '18px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Course Coordinator Info
              </h4>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div><strong>Faculty:</strong> {selectedSubject.faculty}</div>
                <div><strong>Office:</strong> Department of CSE, Block 3, Room 204</div>
                <div><strong>Office Hours:</strong> Mon - Thu (3:30 PM - 5:00 PM)</div>
                <div><strong>Institutional Email:</strong> faculty@gmrit.edu.in</div>
              </div>
            </div>

            <div className="card" style={{ padding: '18px', backgroundColor: 'var(--pastel-green-bg)', borderColor: 'var(--pastel-green-border)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--pastel-green-text)', marginBottom: '6px' }}>
                Evaluation Breakdown (R20)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Continuous Internal Evaluation (CIE): <strong>30 Marks</strong> (2 Mid Exams + Assignments + Quizzes)<br />
                Semester End Examination (SEE): <strong>70 Marks</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT PYQS */}
      {activeTab === 'pyqs' && (
        <div>
          {/* Year & Exam Filters */}
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

          {/* PYQ List */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Examination</th>
                  <th>Year</th>
                  <th>Questions</th>
                  <th>Max Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjectPYQs.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No PYQs Available"
                    message={`No previous year question papers found for ${selectedSubject.name} matching your filter.`}
                    isTableRow={true}
                    colSpan={5}
                    actionText="Reset Filters"
                    onAction={() => {
                      setPyqYearFilter('All');
                      setPyqExamFilter('All');
                    }}
                  />
                ) : (
                  subjectPYQs.map((pyq) => (
                    <tr key={pyq.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                          {pyq.examType}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {pyq.regulation} Regulation • Autonomous
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                          {pyq.year}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{pyq.questionCount} Questions</td>
                      <td>{pyq.maxMarks} Marks</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => onOpenPdf({
                              title: `${selectedSubject.name} — ${pyq.year} ${pyq.examType}`,
                              doc: pyq.pdfUrl,
                              page: 1
                            })}
                            className="btn btn-secondary btn-sm"
                          >
                            <FileText size={13} />
                            <span>View PDF</span>
                          </button>
                          <button
                            onClick={() => onOpenRagQuery(`Solve the following ${pyq.subject} (${pyq.year} ${pyq.examType}) question step-by-step: ${pyq.sampleQuestions[0]}`)}
                            className="btn btn-subtle btn-sm"
                          >
                            <Sparkles size={13} />
                            <span>Solve with AI</span>
                          </button>
                        </div>
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
  );
}
