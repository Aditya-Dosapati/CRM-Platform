import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Terminal,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Code2,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import codingAssessmentService from '../../services/codingAssessmentService.js';
import CodingExamEnvironment from './CodingExamEnvironment.jsx';
import CodingAssessmentResultModal from './CodingAssessmentResultModal.jsx';
import useEscapeKey from '../../hooks/useEscapeKey.js';
import authService from '../../services/authService.js';

export default function CodingAssessmentsView({ currentUser }) {
  const [assessments, setAssessments] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRulesExpanded, setIsRulesExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Exam states
  const [selectedAssessmentForExam, setSelectedAssessmentForExam] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [activeExamSession, setActiveExamSession] = useState(null);
  const [selectedCompletedAssessment, setSelectedCompletedAssessment] = useState(null);

  useEscapeKey(() => {
    if (selectedCompletedAssessment) {
      setSelectedCompletedAssessment(null);
    } else if (isExamModalOpen) {
      setIsExamModalOpen(false);
    }
  }, isExamModalOpen || Boolean(selectedCompletedAssessment));

  // Load assessments safely via centralized codingAssessmentService
  const loadAssessments = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const activeUser = currentUser || authService.getCurrentUser();
      const loaded = codingAssessmentService.getAssessments({ user: activeUser });
      setAssessments(Array.isArray(loaded) ? loaded : []);
    } catch (err) {
      console.error('[CodingAssessmentsView] Failed to load assessments:', err);
      setError('Unable to load coding assessments from local storage. Click "Reload View" to recover.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Initial load and subscription to same-tab / cross-tab storage events
  useEffect(() => {
    loadAssessments();
    const unsubscribe = codingAssessmentService.subscribe(() => {
      loadAssessments();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadAssessments]);

  // Computed counts: active/upcoming vs completed
  const { activeCount, completedCount } = useMemo(() => {
    let active = 0;
    let completed = 0;
    if (Array.isArray(assessments)) {
      for (const a of assessments) {
        if (a && a.status === 'completed') {
          completed++;
        } else {
          active++;
        }
      }
    }
    return { activeCount: active, completedCount: completed };
  }, [assessments]);

  // Computed filtered list based on tab and search
  const filteredAssessments = useMemo(() => {
    if (!Array.isArray(assessments)) return [];

    let list = assessments.filter(a => {
      if (!a) return false;
      if (activeTab === 'completed') {
        return a.status === 'completed';
      }
      return a.status !== 'completed';
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.className && a.className.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q)) ||
        (a.faculty && a.faculty.toLowerCase().includes(q))
      );
    }

    return list;
  }, [assessments, activeTab, searchQuery]);

  const handleStartExamClick = (assessment) => {
    if (assessment.status === 'completed') {
      setSelectedCompletedAssessment(assessment);
      return;
    }
    setSelectedAssessmentForExam(assessment);
    setIsExamModalOpen(true);
  };

  const handleConfirmStartExam = () => {
    setIsExamModalOpen(false);
    setActiveExamSession(selectedAssessmentForExam);
  };

  const handleExamSubmitted = (result) => {
    setActiveExamSession(null);

    // Save attempt via centralized service
    codingAssessmentService.saveExamAttempt(result);

    // Update local state immediately
    setAssessments(prev =>
      prev.map(a => {
        if (a.id === result.assessmentId) {
          return {
            ...a,
            status: 'completed',
            score: result.score,
            solvedCount: result.solvedCount,
            testCasesPassed: result.testCasesPassed,
            runtimeScore: result.runtimeScore || 'Good (36 ms avg)',
            problemBreakdown: result.problemBreakdown
          };
        }
        return a;
      })
    );

    // Find and open result modal
    const target = assessments.find(a => a.id === result.assessmentId) || selectedAssessmentForExam;
    setSelectedCompletedAssessment({
      ...target,
      score: result.score,
      solvedCount: result.solvedCount,
      testCasesPassed: result.testCasesPassed,
      problemBreakdown: result.problemBreakdown
    });
  };

  // If in active exam session, render fullscreen Exam Environment
  if (activeExamSession) {
    return (
      <CodingExamEnvironment
        assessment={activeExamSession}
        onExit={() => setActiveExamSession(null)}
        onSubmitExam={handleExamSubmitted}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--pastel-purple-bg, #F5F3FF)',
                  color: 'var(--pastel-purple-text, #7C3AED)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--pastel-purple-border, #DDD6FE)'
                }}
              >
                <Terminal size={20} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
                Coding Assessments &amp; Examinations
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
              Autonomous Semester &amp; Lab Practical Examination Environment • Powered by Isolated Linux Sandboxes
            </p>
          </div>

          {/* Quick Search & Reload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem'
              }}
            >
              <Search size={16} color="#94A3B8" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.85rem',
                  color: '#1E293B',
                  width: '200px'
                }}
              />
            </div>

            <button
              onClick={loadAssessments}
              title="Reload Assessments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.48rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span className="hide-on-mobile">Reload</span>
            </button>
          </div>
        </div>

        {/* Temporary Local Persistence Informational Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            fontSize: '0.82rem',
            color: '#1E40AF',
            lineHeight: 1.4
          }}
        >
          <Info size={16} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>
            <strong>Temporary Local Persistence:</strong> Coding assessments created by Admin/Faculty and student exam attempts are persisted in this browser's local storage. Data is browser-specific and will not synchronize across different computers or browsers.
          </span>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'active' ? 'var(--color-primary, #EA580C)' : '#F1F5F9',
              color: activeTab === 'active' ? '#FFFFFF' : '#475569',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Upcoming &amp; Active</span>
            <span
              style={{
                backgroundColor: activeTab === 'active' ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                color: activeTab === 'active' ? '#FFFFFF' : '#334155',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.75rem'
              }}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'completed' ? 'var(--color-primary, #EA580C)' : '#F1F5F9',
              color: activeTab === 'completed' ? '#FFFFFF' : '#475569',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Completed &amp; Evaluated</span>
            <span
              style={{
                backgroundColor: activeTab === 'completed' ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                color: activeTab === 'completed' ? '#FFFFFF' : '#334155',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.75rem'
              }}
            >
              {completedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Examination Rules & Policy Card */}
      <div
        style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        <div
          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
          style={{
            padding: '0.875rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={18} color="#D97706" />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#92400E' }}>
              Before You Begin: GMRIT Autonomous Coding Examination Guidelines
            </span>
          </div>
          <button
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: '#B45309',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isRulesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {isRulesExpanded && (
          <div
            style={{
              padding: '0 1.25rem 1.25rem 1.25rem',
              borderTop: '1px solid rgba(253, 230, 138, 0.6)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.875rem',
              paddingTop: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706', marginTop: '0.45rem' }} />
              <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: '1.45' }}>
                <strong>Proctored Environment:</strong> Browser tab switches and window unfocus events are recorded in the institutional audit log.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706', marginTop: '0.45rem' }} />
              <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: '1.45' }}>
                <strong>No AI or External Hints:</strong> General GMRIT AI and progressive hints are strictly disabled inside examination mode.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706', marginTop: '0.45rem' }} />
              <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: '1.45' }}>
                <strong>Continuous Autosave:</strong> Your draft code is automatically synchronized every 25 seconds across all questions.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706', marginTop: '0.45rem' }} />
              <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: '1.45' }}>
                <strong>Automated Expiration:</strong> When the countdown timer reaches 00:00:00, all active solutions are auto-submitted.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Recovery State */}
      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#DC2626" />
            <span style={{ fontSize: '0.88rem', color: '#991B1B', fontWeight: '600' }}>
              {error}
            </span>
          </div>
          <button
            onClick={loadAssessments}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Reload View
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Loader2 size={24} className="animate-spin" color="#EA580C" />
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748B' }}>
            Loading coding assessments...
          </p>
        </div>
      ) : (
        /* Assessments Grid */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAssessments.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                border: '1px solid #E2E8F0'
              }}
            >
              <Code2 size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#475569' }}>
                No {activeTab === 'completed' ? 'completed' : 'upcoming'} assessments found.
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                {searchQuery.trim()
                  ? `No assessments match "${searchQuery}". Try clearing the search query.`
                  : activeTab === 'completed'
                    ? 'Complete an assessment to see your scorecard and question breakdown here.'
                    : 'Check back later or contact your course instructor for upcoming coding tests.'}
              </p>
            </div>
          ) : (
            filteredAssessments.map(assessment => {
              const isCompleted = assessment.status === 'completed';
              const isUpcoming = assessment.status === 'upcoming';

              return (
                <div
                  key={assessment.id}
                  className="card-interactive"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s var(--ease-spring)'
                  }}
                >
                  {/* Top Row: Badges & Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '9999px',
                            backgroundColor: isCompleted ? '#ECFDF5' : '#FFF7ED',
                            color: isCompleted ? '#059669' : '#EA580C',
                            border: `1px solid ${isCompleted ? '#A7F3D0' : '#FED7AA'}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {assessment.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>
                          {assessment.className}
                        </span>
                        {assessment.regulation && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: '#F1F5F9',
                              color: '#475569',
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            {assessment.regulation}
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
                        {assessment.title}
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        Instructor: <strong>{assessment.faculty}</strong> • {assessment.department}
                      </div>
                    </div>

                    {/* Right Score Badge if completed */}
                    {isCompleted && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: '12px',
                          padding: '0.6rem 1.25rem',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                          Secured Score
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#15803D' }}>
                          {assessment.score} <span style={{ fontSize: '0.85rem', color: '#4ADE80' }}>/ {assessment.totalMarks}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      flexWrap: 'wrap',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#475569'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={15} color="#64748B" />
                      <span>{assessment.startTime}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={15} color="#64748B" />
                      <span>{assessment.durationMinutes} Minutes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={15} color="#64748B" />
                      <span>{assessment.questionsCount} Coding Problems</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Award size={15} color="#64748B" />
                      <span>{assessment.totalMarks} Marks</span>
                    </div>
                  </div>

                  {/* Bottom Row: Allowed Languages & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>Allowed:</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {assessment.allowedLanguages?.map(lang => (
                          <span
                            key={lang}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              backgroundColor: '#F1F5F9',
                              color: '#334155',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <button
                          onClick={() => setSelectedCompletedAssessment(assessment)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#FFFFFF',
                            color: '#EA580C',
                            border: '1px solid #FED7AA',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Award size={15} />
                          View Scorecard &amp; Breakdown
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartExamClick(assessment)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            backgroundColor: 'var(--color-primary, #EA580C)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.55rem 1.25rem',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)',
                            transition: 'background-color 0.15s'
                          }}
                        >
                          <span>Start Assessment</span>
                          <ArrowRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Assessment Pre-Check & Start Confirmation Modal */}
      {isExamModalOpen && selectedAssessmentForExam && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={() => setIsExamModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid #E2E8F0'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF7ED',
                  color: '#EA580C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #FED7AA'
                }}
              >
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#0F172A' }}>
                  Ready to Begin Assessment?
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  {selectedAssessmentForExam.title}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid #E2E8F0',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Total Duration:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>{selectedAssessmentForExam.durationMinutes} Minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Total Questions:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>{selectedAssessmentForExam.questionsCount} Coding Problems</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Maximum Marks:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>{selectedAssessmentForExam.totalMarks} Marks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Allowed Compilers:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>{selectedAssessmentForExam.allowedLanguages?.join(', ')}</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.82rem',
                color: '#991B1B',
                marginBottom: '1.5rem',
                lineHeight: '1.45'
              }}
            >
              <strong>Important Notice:</strong> Once you enter, your browser will switch to full-screen examination mode. GMRIT AI is disabled, and your server countdown timer will commence immediately.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsExamModalOpen(false)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartExam}
                style={{
                  padding: '0.55rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#EA580C',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Enter Examination Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Assessment Result Modal */}
      {selectedCompletedAssessment && (
        <CodingAssessmentResultModal
          assessment={selectedCompletedAssessment}
          onClose={() => setSelectedCompletedAssessment(null)}
        />
      )}
    </div>
  );
}
