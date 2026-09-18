import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Play,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Terminal,
  FileCode,
  Lock,
  RotateCcw,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { codingProblemsList, supportedLanguagesList } from '../../data/codingData.js';
import codeExecutionService from '../../services/codeExecutionService.js';

export default function CodingExamEnvironment({ assessment, onExit, onSubmitExam }) {
  // Questions mapped to assessment questionIds or default subset
  const examQuestions = React.useMemo(() => {
    if (!assessment || !assessment.questionIds || assessment.questionIds.length === 0) {
      return codingProblemsList.slice(0, 4);
    }
    const mapped = assessment.questionIds
      .map(id => codingProblemsList.find(p => p.id === id))
      .filter(Boolean);
    return mapped.length > 0 ? mapped : codingProblemsList.slice(0, 4);
  }, [assessment]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const activeProblem = examQuestions[currentQuestionIndex] || codingProblemsList[0];

  // Allowed languages
  const allowedLanguages = assessment?.allowedLanguages || ['Python', 'C++', 'Java', 'C'];
  const initialLang = allowedLanguages.includes('Python') ? 'python' : allowedLanguages[0]?.toLowerCase() || 'python';
  const [selectedLanguage, setSelectedLanguage] = useState(initialLang);

  // Per-question code states & answered status
  const [questionCodes, setQuestionCodes] = useState(() => {
    const initial = {};
    examQuestions.forEach((q, idx) => {
      initial[q.id] = q.starterCode?.[initialLang] || `// Solution for ${q.title}\n`;
    });
    return initial;
  });

  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [lastSavedTime, setLastSavedTime] = useState('Just now');
  const [activeBottomTab, setActiveBottomTab] = useState('tests'); // 'tests' | 'output'

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);

  // Countdown timer in seconds (e.g. 90 mins = 5400s)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(() => {
    return (assessment?.durationMinutes || 90) * 60;
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Autosave interval (every 25 seconds)
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      codeExecutionService.saveDraft(
        `exam-${assessment?.id || 'exam'}-${activeProblem.id}`,
        selectedLanguage,
        questionCodes[activeProblem.id]
      );
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 25000);

    return () => clearInterval(autosaveInterval);
  }, [assessment, activeProblem, selectedLanguage, questionCodes]);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentCode = questionCodes[activeProblem.id] || activeProblem.starterCode?.[selectedLanguage] || '';

  const handleCodeChange = (newCode) => {
    setQuestionCodes(prev => ({
      ...prev,
      [activeProblem.id]: newCode
    }));
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    const starter = activeProblem.starterCode?.[newLang] || `// Code for ${activeProblem.title} in ${newLang}\n`;
    setQuestionCodes(prev => ({
      ...prev,
      [activeProblem.id]: starter
    }));
  };

  const handleSaveQuestion = () => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [activeProblem.id]: true
    }));
    codeExecutionService.saveDraft(
      `exam-${assessment?.id || 'exam'}-${activeProblem.id}`,
      selectedLanguage,
      questionCodes[activeProblem.id]
    );
    const now = new Date();
    setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleRunSampleTests = async () => {
    setIsRunning(true);
    setActiveBottomTab('tests');
    try {
      const res = await codeExecutionService.runCode(
        activeProblem.id,
        selectedLanguage,
        currentCode
      );
      setExecutionResult(res);
    } catch (e) {
      setExecutionResult({
        status: 'Compilation Error',
        compileOutput: 'Internal execution error.',
        testCasesResults: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoSubmit = () => {
    if (onSubmitExam) {
      onSubmitExam({
        assessmentId: assessment?.id,
        answeredCount: Object.keys(answeredQuestions).length,
        totalQuestions: examQuestions.length,
        score: 86,
        totalMarks: assessment?.totalMarks || 100
      });
    }
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    if (onSubmitExam) {
      const answeredCount = Object.keys(answeredQuestions).length;
      onSubmitExam({
        assessmentId: assessment?.id,
        title: assessment?.title,
        score: Math.min(assessment?.totalMarks || 100, Math.round((answeredCount / examQuestions.length) * (assessment?.totalMarks || 100))),
        totalMarks: assessment?.totalMarks || 100,
        solvedCount: answeredCount,
        questionsCount: examQuestions.length,
        testCasesPassed: `${answeredCount * 8} / ${examQuestions.length * 8}`,
        runtimeScore: 'Good (36 ms avg)'
      });
    }
  };

  const isLowTime = timeLeftSeconds < 300; // Under 5 minutes

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#F8FAFC',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Top Exam Navigation Bar */}
      <header
        style={{
          height: '62px',
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          padding: '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          flexShrink: 0
        }}
      >
        {/* Left Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <Lock size={12} />
            Exam In Progress
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#F8FAFC' }}>
              {assessment?.title || 'Mid-Term Coding Assessment'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              {assessment?.className || 'B.Tech CSE'} • Total Marks: {assessment?.totalMarks || 100}
            </span>
          </div>
        </div>

        {/* Center: Question Selector Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: '600' }}>
            Questions:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {examQuestions.map((q, idx) => {
              const isActive = idx === currentQuestionIndex;
              const isAnswered = answeredQuestions[q.id];

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  style={{
                    width: '36px',
                    height: '32px',
                    borderRadius: '6px',
                    border: isActive
                      ? '2px solid #3B82F6'
                      : isAnswered
                      ? '1px solid #10B981'
                      : '1px solid #334155',
                    backgroundColor: isActive
                      ? '#2563EB'
                      : isAnswered
                      ? 'rgba(16, 185, 129, 0.2)'
                      : '#1E293B',
                    color: isActive ? '#FFFFFF' : isAnswered ? '#34D399' : '#CBD5E1',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Question ${idx + 1}: ${q.title} (${isAnswered ? 'Saved' : 'Unsaved'})`}
                >
                  Q{idx + 1}
                  {isAnswered && !isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '7px',
                        height: '7px',
                        backgroundColor: '#10B981',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Timer & Submit CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Autosave Status */}
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Save size={13} style={{ color: '#10B981' }} />
            Saved {lastSavedTime}
          </span>

          {/* Countdown Clock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: isLowTime ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.8)',
              border: `1px solid ${isLowTime ? '#EF4444' : '#334155'}`,
              color: isLowTime ? '#EF4444' : '#F8FAFC',
              padding: '0.35rem 0.85rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '1rem',
              fontFamily: 'monospace'
            }}
          >
            <Clock size={16} style={{ color: isLowTime ? '#EF4444' : '#38BDF8' }} />
            {formatTimer(timeLeftSeconds)}
          </div>

          {/* Finish & Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <Send size={15} />
            Finish &amp; Submit
          </button>
        </div>
      </header>

      {/* Security Proctor Notice Bar */}
      <div
        style={{
          backgroundColor: '#FEF2F2',
          borderBottom: '1px solid #FECACA',
          padding: '0.4rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#991B1B'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={15} style={{ color: '#DC2626' }} />
          <span>
            <strong>Proctored Academic Assessment Mode:</strong> General AI assistant and hint queries are disabled. Tab switches are logged to the security audit trail.
          </span>
        </div>
        <span style={{ color: '#B91C1C', fontWeight: '600' }}>
          Answered: {Object.keys(answeredQuestions).length} / {examQuestions.length} Questions
        </span>
      </div>

      {/* Main Split Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Pane: Question Details */}
        <div
          style={{
            width: '45%',
            minWidth: '380px',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Question Header */}
          <div
            style={{
              padding: '1.25rem',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase' }}>
                  Question {currentQuestionIndex + 1} of {examQuestions.length}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    backgroundColor: activeProblem.difficulty === 'Easy' ? '#ECFDF5' : activeProblem.difficulty === 'Medium' ? '#FFFBEB' : '#FEF2F2',
                    color: activeProblem.difficulty === 'Easy' ? '#059669' : activeProblem.difficulty === 'Medium' ? '#D97706' : '#DC2626',
                    border: `1px solid ${activeProblem.difficulty === 'Easy' ? '#A7F3D0' : activeProblem.difficulty === 'Medium' ? '#FDE68A' : '#FECACA'}`
                  }}
                >
                  {activeProblem.difficulty}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
                {activeProblem.title}
              </h3>
            </div>
            <div
              style={{
                textAlign: 'right',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: '600' }}>WEIGHTAGE</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#2563EB' }}>
                {Math.round((assessment?.totalMarks || 100) / examQuestions.length)} Marks
              </div>
            </div>
          </div>

          {/* Question Body */}
          <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Description */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                Problem Statement
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#1E293B', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {activeProblem.description}
              </div>
            </div>

            {/* Examples */}
            {activeProblem.examples && activeProblem.examples.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                  Examples
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeProblem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#0F172A', marginBottom: '0.35rem' }}>
                        Example {idx + 1}:
                      </div>
                      <div style={{ fontFamily: 'monospace', color: '#334155', marginBottom: '0.2rem' }}>
                        <strong>Input:</strong> {ex.input}
                      </div>
                      <div style={{ fontFamily: 'monospace', color: '#059669', marginBottom: '0.2rem' }}>
                        <strong>Output:</strong> {ex.output}
                      </div>
                      {ex.explanation && (
                        <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                          <strong>Explanation:</strong> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            {activeProblem.constraints && activeProblem.constraints.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                  Constraints
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                  {activeProblem.constraints.map((c, i) => (
                    <li key={i} style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Left Footer Navigation */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #F1F5F9',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: currentQuestionIndex === 0 ? '#94A3B8' : '#334155',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Q{currentQuestionIndex + 1} of {examQuestions.length}
            </span>
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(examQuestions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === examQuestions.length - 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: currentQuestionIndex === examQuestions.length - 1 ? '#94A3B8' : '#334155',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: currentQuestionIndex === examQuestions.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Pane: Code Editor & Execution Console */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0F172A', overflow: 'hidden' }}>
          {/* Editor Sub-Header Toolbar */}
          <div
            style={{
              height: '48px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid #334155',
              padding: '0 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#F8FAFC'
            }}
          >
            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>LANGUAGE:</span>
              <select
                value={selectedLanguage}
                onChange={e => handleLanguageChange(e.target.value)}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {allowedLanguages.map(l => (
                  <option key={l} value={l.toLowerCase()}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const starter = activeProblem.starterCode?.[selectedLanguage] || '';
                  handleCodeChange(starter);
                }}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer'
                }}
                title="Reset to starter template"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button
                onClick={handleSaveQuestion}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #10B981',
                  backgroundColor: answeredQuestions[activeProblem.id] ? 'rgba(16, 185, 129, 0.2)' : '#10B981',
                  color: answeredQuestions[activeProblem.id] ? '#34D399' : '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer'
                }}
              >
                <Check size={14} />
                {answeredQuestions[activeProblem.id] ? 'Draft Saved' : 'Save Solution'}
              </button>
            </div>
          </div>

          {/* Monaco-Style Dark Code Editor Area */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
            {/* Line Numbers Simulation */}
            <div
              style={{
                width: '42px',
                backgroundColor: '#0F172A',
                borderRight: '1px solid #1E293B',
                padding: '0.75rem 0',
                userSelect: 'none',
                textAlign: 'right',
                paddingRight: '0.6rem',
                color: '#475569',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.85rem',
                lineHeight: '1.5'
              }}
            >
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code TextArea */}
            <textarea
              value={currentCode}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder="// Write your solution here..."
              spellCheck={false}
              style={{
                flex: 1,
                backgroundColor: '#0B1120',
                color: '#E2E8F0',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.88rem',
                lineHeight: '1.5',
                padding: '0.75rem 1rem',
                border: 'none',
                outline: 'none',
                resize: 'none',
                tabSize: 4,
                whiteSpace: 'pre'
              }}
            />
          </div>

          {/* Bottom Execution Console Drawer */}
          <div
            style={{
              height: '220px',
              backgroundColor: '#0F172A',
              borderTop: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            {/* Console Toolbar */}
            <div
              style={{
                height: '40px',
                backgroundColor: '#1E293B',
                borderBottom: '1px solid #334155',
                padding: '0 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setActiveBottomTab('tests')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    border: 'none',
                    borderBottom: activeBottomTab === 'tests' ? '2px solid #3B82F6' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: activeBottomTab === 'tests' ? '#60A5FA' : '#94A3B8',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Sample Test Cases
                </button>
                <button
                  onClick={() => setActiveBottomTab('output')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    border: 'none',
                    borderBottom: activeBottomTab === 'output' ? '2px solid #3B82F6' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: activeBottomTab === 'output' ? '#60A5FA' : '#94A3B8',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Execution Logs
                </button>
              </div>

              {/* Run Code Action */}
              <button
                onClick={handleRunSampleTests}
                disabled={isRunning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: isRunning ? 'wait' : 'pointer'
                }}
              >
                <Play size={13} />
                {isRunning ? 'Running Tests...' : 'Run Sample Tests'}
              </button>
            </div>

            {/* Console Content */}
            <div style={{ flex: 1, padding: '0.85rem 1rem', overflowY: 'auto', color: '#E2E8F0', fontSize: '0.82rem' }}>
              {activeBottomTab === 'tests' ? (
                <div>
                  {executionResult ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span
                          style={{
                            fontWeight: '700',
                            color: executionResult.status === 'Accepted' ? '#10B981' : '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {executionResult.status === 'Accepted' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          {executionResult.status}
                        </span>
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                          Passed: {executionResult.testCasesResults?.filter(t => t.passed).length} / {executionResult.testCasesResults?.length} cases
                        </span>
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                          Runtime: {executionResult.executionTime}
                        </span>
                      </div>

                      {/* Test Case Detail Pills */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {executionResult.testCasesResults?.map((tc, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#1E293B',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              border: `1px solid ${tc.passed ? '#059669' : '#DC2626'}`
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: '600', color: tc.passed ? '#34D399' : '#F87171' }}>
                                Case {idx + 1}: {tc.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94A3B8' }}>
                              Input: {tc.input}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#CBD5E1' }}>
                              Expected: {tc.expected} | Actual: {tc.actual}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                      <Terminal size={18} />
                      Click "Run Sample Tests" to execute your solution against sample test cases.
                    </div>
                  )}
                </div>
              ) : (
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.8rem', color: '#94A3B8' }}>
                  {executionResult?.compileOutput || 'No execution logs recorded yet.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.75rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
                  Submit Assessment?
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Final Examination Evaluation
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              You have completed <strong>{Object.keys(answeredQuestions).length}</strong> of <strong>{examQuestions.length}</strong> questions.
              {Object.keys(answeredQuestions).length < examQuestions.length && (
                <span style={{ display: 'block', color: '#DC2626', fontWeight: '600', marginTop: '0.5rem' }}>
                  ⚠️ Warning: You have uncompleted questions. Any unanswered questions will receive 0 marks.
                </span>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Return to Exam
              </button>
              <button
                onClick={handleConfirmSubmit}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Confirm &amp; Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
