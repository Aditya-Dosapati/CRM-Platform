import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CheckSquare, Clock, Play, Sparkles, X, ChevronRight, CheckCircle, 
  Award, AlertTriangle, ArrowLeft, ArrowRight, RefreshCw, CheckCircle2,
  FileText, User, HelpCircle, Eye
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';
import assessmentService from '../../services/assessmentService';
import authService from '../../services/authService';
import { extractCanonicalCohort } from '../../services/academicCohortService';

export default function StudentAssessments({ onOpenRagQuery }) {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'missed'
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Quiz Examination State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeScorecard, setActiveScorecard] = useState(null); // attempt result view

  const currentUser = authService.getCurrentUser();
  const currentStudentId = currentUser?.id || currentUser?.userId || 'std-rahul';

  useEscapeKey(() => {
    if (activeScorecard) {
      setActiveScorecard(null);
    }
  }, Boolean(activeScorecard));

  // Load student's assigned published assessments and prior attempts
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const studentProfile = extractCanonicalCohort(currentUser);

      const asmtRes = await assessmentService.getAssessments({ student: studentProfile });
      const localAttempts = assessmentService._loadAttemptsLocal();
      const myAttempts = localAttempts.filter(att => 
        att.studentId === currentStudentId || att.studentUserId === currentStudentId
      );

      setAssessments(asmtRes?.data || []);
      setAttempts(myAttempts);
    } catch (err) {
      console.warn('[StudentAssessments] Error loading assessments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentStudentId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('gmrit_assessments_updated', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmrit_assessments_updated', handleUpdate);
      }
    };
  }, [loadData]);

  // Attempt Map per assessmentId
  const attemptsMap = useMemo(() => {
    const map = new Map();
    attempts.forEach(att => map.set(att.assessmentId, att));
    return map;
  }, [attempts]);

  // Filter assessments based on student attempt status
  const categorizedAssessments = useMemo(() => {
    const upcoming = [];
    const completed = [];
    const missed = [];

    const now = new Date();

    assessments.forEach(asmt => {
      const attempt = attemptsMap.get(asmt.id);
      const dueDate = asmt.dueDate ? new Date(asmt.dueDate) : null;
      const isPastDue = dueDate && dueDate < now;

      if (attempt) {
        completed.push({ ...asmt, attempt });
      } else if (isPastDue) {
        missed.push(asmt);
      } else {
        upcoming.push(asmt);
      }
    });

    return { upcoming, completed, missed };
  }, [assessments, attemptsMap]);

  const currentTabList = useMemo(() => {
    return categorizedAssessments[activeTab] || [];
  }, [categorizedAssessments, activeTab]);

  // Handle Assessment Submission & Automatic Grading
  const handleSubmitAssessment = useCallback(async () => {
    if (!activeQuiz || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await assessmentService.submitAttempt({
        assessmentId: activeQuiz.id,
        studentId: currentStudentId,
        studentName: currentUser?.name || 'Rahul Kumar',
        rollNumber: currentUser?.rollNumber || '23CS001',
        answers: selectedAnswers,
        timeSpentSeconds: (activeQuiz.duration * 60) - timeLeft
      });

      if (result.success) {
        setActiveQuiz(null);
        setActiveScorecard(result.data);
        await loadData();
      }
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeQuiz, isSubmitting, currentStudentId, currentUser, selectedAnswers, timeLeft, loadData]);

  // Exam Countdown Timer
  useEffect(() => {
    if (!activeQuiz) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, handleSubmitAssessment]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartAssessment = (asmt) => {
    if (!asmt.questions || asmt.questions.length === 0) {
      alert("This assessment questions are being configured by your course instructor.");
      return;
    }
    setActiveQuiz(asmt);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setTimeLeft((asmt.duration || 20) * 60);
  };

  const handleSelectOption = (optionKey) => {
    if (!activeQuiz) return;
    const qKey = activeQuiz.questions[currentQuestionIdx]?.id || currentQuestionIdx;
    setSelectedAnswers(prev => ({
      ...prev,
      [qKey]: optionKey
    }));
  };

  // Active question in exam
  const currentQ = activeQuiz?.questions ? activeQuiz.questions[currentQuestionIdx] : null;
  const currentQKey = currentQ?.id || currentQuestionIdx;
  const currentSelectedOpt = selectedAnswers[currentQKey];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = activeQuiz?.questions?.length || 1;

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
            Academic Assessments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Continuous internal evaluations (CIE), section quizzes, and instant evaluation scorecards
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("What topics should I revise before my upcoming academic assessments?")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>Prep with GMRIT AI</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '20px' }}>
        {[
          { id: 'upcoming', label: `Active & Scheduled (${categorizedAssessments.upcoming.length})` },
          { id: 'completed', label: `Completed (${categorizedAssessments.completed.length})` },
          { id: 'missed', label: `Missed (${categorizedAssessments.missed.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assessments Grid / Empty State */}
      {currentTabList.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title={activeTab === 'upcoming' ? 'No Pending Assessments' : activeTab === 'completed' ? 'No Completed Assessments' : 'No Missed Assessments'}
            message={activeTab === 'upcoming' 
              ? 'You have attempted all scheduled assessments for your class section. Check back when faculty publishes a new quiz.' 
              : activeTab === 'completed' 
              ? 'You haven\'t completed any assessments yet. Active assessments will appear under the "Active & Scheduled" tab.'
              : 'Great job! You have no missed or expired assessments for this semester.'}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentTabList.map((asmt) => {
            const isCompleted = Boolean(asmt.attempt);
            return (
              <div 
                key={asmt.id} 
                className="card card-interactive" 
                style={{ 
                  padding: '20px 24px', 
                  borderLeft: isCompleted ? '4px solid #10b981' : '4px solid var(--color-primary)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-blue">{asmt.subjectName || asmt.subject}</span>
                      <span className="badge badge-purple">Section {asmt.section}</span>
                      <span className="badge badge-gray">Faculty: {asmt.facultyName || 'Course Faculty'}</span>
                      <span className="badge badge-gray">Due: {asmt.dueDate || 'Flexible'}</span>
                      {isCompleted && (
                        <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Score: {asmt.attempt.score} / {asmt.attempt.totalQuestions} ({asmt.attempt.percentage}%)
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px' }}>
                      {asmt.title}
                    </h3>

                    <div style={{ display: 'flex', gap: '18px', fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.85, flexWrap: 'wrap' }}>
                      <span>Questions: <strong>{asmt.questionCount || (asmt.questions?.length || 10)} MCQs</strong></span>
                      <span>Duration: <strong>{asmt.duration || 20} Minutes</strong></span>
                      <span>Auto-Graded: <strong>Instant Results</strong></span>
                      {asmt.sourceResourceName && (
                        <span>Source: <strong>{asmt.sourceResourceName}</strong></span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <button
                        onClick={() => setActiveScorecard(asmt.attempt)}
                        className="btn btn-secondary"
                        style={{ fontWeight: 700 }}
                      >
                        <Eye size={14} />
                        <span>View Scorecard</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartAssessment(asmt)}
                        className="btn btn-primary"
                        style={{ fontWeight: 800, padding: '8px 18px' }}
                      >
                        <Play size={14} />
                        <span>Start Assessment</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-SCREEN MCQ EXAM ENVIRONMENT MODAL */}
      {activeQuiz && (
        <div className="modal-overlay" style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '900px', 
              width: '95%', 
              height: '88vh', 
              display: 'flex', 
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {/* Exam Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '4px' }}>
                  {activeQuiz.subjectName} • Section {activeQuiz.section}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                  {activeQuiz.title}
                </h3>
              </div>

              {/* Timer & Progress Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: timeLeft < 300 ? '#fee2e2' : 'var(--color-card)',
                  color: timeLeft < 300 ? '#ef4444' : 'var(--color-text)',
                  border: `1px solid ${timeLeft < 300 ? '#f87171' : 'var(--color-border)'}`,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 800,
                  fontSize: '15px'
                }}>
                  <Clock size={16} />
                  <span>{formatTime(timeLeft)}</span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.85 }}>
                  Answered: <strong>{answeredCount}</strong> / {totalQuestions}
                </div>
              </div>
            </div>

            {/* Exam Body Grid: Left Question, Right Palette */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', flex: 1, overflow: 'hidden' }}>
              {/* Question Main Panel */}
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {currentQ && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)' }}>
                        Question {currentQuestionIdx + 1} of {totalQuestions}
                      </span>
                      <span className="badge badge-gray">Single Choice (1 Mark)</span>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.5, color: 'var(--color-text)', marginBottom: '20px' }}>
                      {currentQ.question}
                    </h4>

                    {/* Options List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {['A', 'B', 'C', 'D'].map(optKey => {
                        const isSelected = currentSelectedOpt === optKey;
                        const optText = currentQ[`option${optKey}`];
                        return (
                          <div
                            key={optKey}
                            onClick={() => handleSelectOption(optKey)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--color-bg)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                              color: isSelected ? '#ffffff' : 'var(--color-text)',
                              border: isSelected ? 'none' : '1px solid var(--color-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              {optKey}
                            </div>
                            <span style={{ fontSize: '13.5px', color: 'var(--color-text)', fontWeight: isSelected ? 600 : 400 }}>
                              {optText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bottom Question Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 600 }}
                  >
                    <ArrowLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {currentQuestionIdx < totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
                        className="btn btn-secondary btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        <span>Next Question</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitAssessment}
                        disabled={isSubmitting}
                        className="btn btn-primary btn-sm"
                        style={{ fontWeight: 800, padding: '6px 18px', backgroundColor: '#059669' }}
                      >
                        <CheckCircle size={14} />
                        <span>{isSubmitting ? 'Evaluating...' : 'Submit Assessment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar Question Palette */}
              <div style={{
                borderLeft: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflowY: 'auto'
              }}>
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase', marginBottom: '12px' }}>
                    Question Palette
                  </h5>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {activeQuiz.questions.map((q, idx) => {
                      const qKey = q.id || idx;
                      const isAnswered = selectedAnswers[qKey] !== undefined;
                      const isCurrent = currentQuestionIdx === idx;

                      return (
                        <button
                          key={qKey}
                          onClick={() => setCurrentQuestionIdx(idx)}
                          style={{
                            height: '34px',
                            borderRadius: 'var(--radius-sm)',
                            border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            backgroundColor: isAnswered ? '#10b981' : isCurrent ? 'var(--color-card)' : 'transparent',
                            color: isAnswered ? '#ffffff' : 'var(--color-text)',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={handleSubmitAssessment}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ width: '100%', fontWeight: 800, justifyContent: 'center' }}
                  >
                    {isSubmitting ? 'Grading...' : 'Submit All'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSTANT SCORECARD & ATTEMPT REVIEW MODAL */}
      {activeScorecard && (
        <div className="modal-overlay" onClick={() => setActiveScorecard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', width: '95%' }}>
            <div className="modal-header" style={{ backgroundColor: activeScorecard.isPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
              <div>
                <span className={`badge ${activeScorecard.isPassed ? 'badge-green' : 'badge-orange'}`} style={{ marginBottom: '4px' }}>
                  {activeScorecard.isPassed ? 'Assessment Passed' : 'Needs Improvement'}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text)' }}>
                  {activeScorecard.assessmentTitle || 'Assessment Scorecard'}
                </h3>
              </div>
              <button onClick={() => setActiveScorecard(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Scorecard Hero Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>YOUR SCORE</span>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: activeScorecard.isPassed ? '#059669' : '#dc2626' }}>
                    {activeScorecard.score} / {activeScorecard.totalQuestions}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>PERCENTAGE</span>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {activeScorecard.percentage}%
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>CORRECT / WRONG</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginTop: '4px' }}>
                    <span style={{ color: '#059669' }}>{activeScorecard.correctCount} Correct</span> • <span style={{ color: '#dc2626' }}>{activeScorecard.incorrectCount} Wrong</span>
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>STATUS</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: activeScorecard.isPassed ? '#059669' : '#d97706', marginTop: '4px' }}>
                    {activeScorecard.isPassed ? 'PASSED (>=50%)' : 'RETEST RECOMMENDED'}
                  </p>
                </div>
              </div>

              {/* Itemized Questions Review */}
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '12px' }}>
                Itemized Question Feedback & Explanations
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(activeScorecard.responses || []).map((resp, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--color-card)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${resp.isCorrect ? '#10b981' : '#ef4444'}`,
                      border: '1px solid var(--color-border)',
                      borderLeftWidth: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '12.5px', color: resp.isCorrect ? '#059669' : '#dc2626' }}>
                        Question {idx + 1} {resp.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                      {resp.questionText}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginBottom: '6px' }}>
                      <span>Your Answer: <strong style={{ color: resp.isCorrect ? '#059669' : '#dc2626' }}>Option {resp.selectedAnswer}</strong></span>
                      {!resp.isCorrect && (
                        <span>Correct Answer: <strong style={{ color: '#059669' }}>Option {resp.correctAnswer}</strong></span>
                      )}
                    </div>

                    {resp.explanation && (
                      <p style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.75, backgroundColor: 'var(--color-bg)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                        <strong>Explanation:</strong> {resp.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveScorecard(null)}>
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
