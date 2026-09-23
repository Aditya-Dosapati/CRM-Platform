import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckSquare, Clock, Play, Sparkles, X, ChevronRight, CheckCircle, Award } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function StudentAssessments({ onOpenRagQuery }) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [assessments, setAssessments] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800);

  useEscapeKey(() => setActiveQuiz(null), Boolean(activeQuiz));

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      if (activeTab === 'upcoming') return a.status === 'upcoming';
      if (activeTab === 'completed') return a.status === 'completed';
      if (activeTab === 'missed') return a.status === 'missed';
      return true;
    });
  }, [assessments, activeTab]);

  const handleSubmitQuiz = useCallback(() => {
    if (!activeQuiz) return;
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  }, [activeQuiz, selectedAnswers]);

  useEffect(() => {
    if (!activeQuiz || quizSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, quizSubmitted, handleSubmitQuiz]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartQuiz = (assessment) => {
    if (!assessment.questions || assessment.questions.length === 0) {
      alert("This assessment question pool is being finalized by the faculty coordinator.");
      return;
    }
    setActiveQuiz(assessment);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setQuizSubmitted(false);
    setQuizScore(null);
    setTimeLeft(1800);
  };

  const handleAnswerSelect = (optIdx) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: optIdx
    }));
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
            Academic Assessments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Continuous internal evaluations (CIE), lab quizzes, and online practice assessments
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("What topics should I study before my upcoming academic assessments?")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>Prep with GMRIT AI</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        {[
          { id: 'upcoming', label: `Upcoming (${assessments.filter(a => a.status === 'upcoming').length})` },
          { id: 'completed', label: `Completed (${assessments.filter(a => a.status === 'completed').length})` },
          { id: 'missed', label: `Missed (${assessments.filter(a => a.status === 'missed').length})` }
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

      {/* Assessment Cards or EmptyState */}
      {filteredAssessments.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Assessments Scheduled"
          description={`No ${activeTab} evaluations recorded for this semester.`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAssessments.map((item) => (
            <div key={item.id} className="card card-interactive" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge">{item.subject}</span>
                    <span className="badge" style={{ textTransform: 'capitalize' }}>
                      {item.status}
                    </span>
                    <span className="badge">Due: {item.dueDate}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {item.subtitle} • Faculty: {item.faculty}
                  </p>

                  <div style={{ display: 'flex', gap: '18px', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    <span>Questions: <strong>{item.questionCount}</strong></span>
                    <span>Duration: <strong>{item.duration}</strong></span>
                    {item.score && (
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                        Score: {item.score} ({item.marksObtained})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {item.status === 'upcoming' ? (
                    <button
                      onClick={() => handleStartQuiz(item)}
                      className="btn btn-primary"
                    >
                      <Play size={14} />
                      <span>Start Assessment</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => alert(`Reviewing results for ${item.title}`)}
                      className="btn btn-secondary"
                    >
                      <span>View Performance</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Clean White Quiz Simulator Modal */}
      {activeQuiz && (
        <div className="modal-overlay">
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ backgroundColor: '#F8FAFC' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeQuiz.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                  Subject: {activeQuiz.subject} • Autonomous CIE Evaluation
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-light)',
                  color: timeLeft < 60 ? 'var(--error)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px'
                }}>
                  <Clock size={15} color={timeLeft < 60 ? 'var(--error)' : 'var(--primary-blue)'} />
                  <span>{formatTime(timeLeft)}</span>
                </div>

                <button
                  onClick={() => setActiveQuiz(null)}
                  className="btn-icon"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {!quizSubmitted ? (
                <div>
                  {/* Navigator Pills */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {activeQuiz.questions.map((_, qIdx) => {
                      const isAnswered = selectedAnswers[qIdx] !== undefined;
                      const isCurrent = currentQuestionIdx === qIdx;
                      return (
                        <button
                          key={qIdx}
                          onClick={() => setCurrentQuestionIdx(qIdx)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: isCurrent ? 'var(--primary-blue)' : isAnswered ? 'var(--pastel-blue-bg)' : '#F8FAFC',
                            color: isCurrent ? '#FFFFFF' : isAnswered ? 'var(--primary-blue)' : 'var(--text-secondary)',
                            border: `1px solid ${isCurrent ? 'var(--primary-blue)' : isAnswered ? 'var(--pastel-blue-border)' : 'var(--border-light)'}`,
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.18s var(--ease-spring)',
                            transform: isCurrent ? 'scale(1.06)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrent) e.currentTarget.style.transform = 'translateY(-1.5px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = isCurrent ? 'scale(1.06)' : 'none';
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.transform = isCurrent ? 'scale(1.06)' : 'translateY(-1.5px)';
                          }}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {(() => {
                    const q = activeQuiz.questions[currentQuestionIdx];
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                            QUESTION {currentQuestionIdx + 1} OF {activeQuiz.questions.length}
                          </span>
                          <span className="badge badge-blue">1.0 Mark</span>
                        </div>

                        <h4 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '18px' }}>
                          {q.question}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[currentQuestionIdx] === oIdx;
                            return (
                              <div
                                key={oIdx}
                                onClick={() => handleAnswerSelect(oIdx)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '13px 16px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: isSelected ? 'var(--pastel-blue-bg)' : '#F8FAFC',
                                  border: `1px solid ${isSelected ? 'var(--primary-blue)' : 'var(--border-light)'}`,
                                  cursor: 'pointer',
                                  boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none',
                                  transition: 'all 0.18s var(--ease-spring)'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                                    e.currentTarget.style.borderColor = 'var(--pastel-blue-border)';
                                  }
                                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                                    e.currentTarget.style.borderColor = 'var(--border-light)';
                                  }
                                  e.currentTarget.style.transform = 'none';
                                }}
                                onMouseDown={(e) => {
                                  e.currentTarget.style.transform = 'scale(0.99)';
                                }}
                                onMouseUp={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                                }}
                              >
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  border: `2px solid ${isSelected ? 'var(--primary-blue)' : '#CBD5E1'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}>
                                  {isSelected && (
                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--primary-blue)',
                                      animation: 'checkPop 0.25s var(--ease-bounce-subtle)'
                                    }} />
                                  )}
                                </div>
                                <span style={{ fontSize: '13.5px', color: isSelected ? 'var(--primary-blue)' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                                  {opt}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Results View */
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--pastel-green-bg)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Award size={32} />
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Assessment Completed!
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Score calculated according to course evaluation rubric
                  </p>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '24px',
                    backgroundColor: 'var(--pastel-blue-bg)',
                    padding: '14px 28px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--pastel-blue-border)',
                    margin: '18px 0'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SCORE</span>
                      <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {quizScore} / {activeQuiz.questions.length}
                      </p>
                    </div>
                    <div style={{ width: '1px', height: '36px', backgroundColor: 'var(--pastel-blue-border)' }} />
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PERCENTAGE</span>
                      <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {Math.round((quizScore / activeQuiz.questions.length) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left', marginTop: '16px' }}>
                    <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      Automated Feedback & AI Explanations:
                    </h5>
                    {activeQuiz.questions.map((q, idx) => {
                      const userAns = selectedAnswers[idx];
                      const isCorrect = userAns === q.correctAnswer;
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: isCorrect ? 'var(--pastel-green-bg)' : 'var(--error-bg)',
                            border: `1px solid ${isCorrect ? 'var(--pastel-green-border)' : 'var(--error-border)'}`,
                            marginBottom: '8px'
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                            Q{idx + 1}: {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                          </span>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', margin: '4px 0' }}>{q.question}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            💡 {q.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!quizSubmitted ? (
                <>
                  <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="btn btn-primary btn-sm"
                    >
                      <span>Next Question</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button onClick={handleSubmitQuiz} className="btn btn-primary btn-sm">
                      <CheckCircle size={14} />
                      <span>Submit Quiz</span>
                    </button>
                  )}
                </>
              ) : (
                <button onClick={() => setActiveQuiz(null)} className="btn btn-primary btn-sm">
                  Done & Return to Assessments
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
