import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  Save,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Code2,
  ChevronRight,
  Check,
  Smartphone,
  Upload,
  Settings,
  ChevronDown,
  BookOpen,
  FileText,
  History,
  Zap,
  BarChart3,
  Timer,
  Bug,
  ChevronLeft
} from 'lucide-react';
import { supportedLanguagesList, isDatabaseProblem, getLanguagesForProblem } from '../../data/codingData.js';
import codeExecutionService from '../../services/codeExecutionService.js';
import useEscapeKey from '../../hooks/useEscapeKey.js';
import useSafeTimeout from '../../hooks/useSafeTimeout.js';

export default function CodingWorkspaceModal({
  isOpen,
  onClose,
  problem,
  onProblemSolved,
  activeRole = 'student',
  isAssessmentMode = false,
  assessmentTimer = null,
  embedded = false
}) {
  if (!isOpen || !problem) return null;

  const setSafeTimeout = useSafeTimeout();

  useEscapeKey(() => {
    if (isFullscreen) {
      setIsFullscreen(false);
    } else {
      onClose();
    }
  }, isOpen);

  // Database Section Scope Check: Database Programming questions ONLY get MySQL; non-database questions get Python, C++, C, Java, JS
  const isDatabaseQuestion = useMemo(() => isDatabaseProblem(problem), [problem]);
  const availableLanguages = useMemo(() => getLanguagesForProblem(problem), [problem]);

  // Editor State
  const [selectedLanguage, setSelectedLanguage] = useState(() => isDatabaseProblem(problem) ? 'mysql' : 'python');
  const [fontSize, setFontSize] = useState(14);
  const [code, setCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Execution & Tabs State
  const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' | 'editorial' | 'submissions'
  const [activeBottomTab, setActiveBottomTab] = useState('testcase'); // 'testcase' | 'testresult' | 'debugger'
  const [debuggerFilter, setDebuggerFilter] = useState('all'); // 'all' | 'errors' | 'warnings'
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sampleResults, setSampleResults] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [consoleActiveResult, setConsoleActiveResult] = useState('run'); // 'run' | 'submit'
  const [isConsoleMaximized, setIsConsoleMaximized] = useState(false);
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);

  // Progressive Hints State
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolutionDiscussion, setShowSolutionDiscussion] = useState(false);

  // Settings dropdown
  const [showSettings, setShowSettings] = useState(false);

  // AI Coding Feedback State
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isLoadingAiFeedback, setIsLoadingAiFeedback] = useState(false);
  const [aiFeedbackError, setAiFeedbackError] = useState(null);
  const [aiHintLevel, setAiHintLevel] = useState(1);
  const [lastExecutedCode, setLastExecutedCode] = useState(null);

  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  const handleRequestAiFeedback = async (level = aiHintLevel) => {
    setIsLoadingAiFeedback(true);
    setAiFeedbackError(null);
    setAiHintLevel(level);
    setActiveBottomTab('ai-hints');

    try {
      const isCodeModified = lastExecutedCode === null || code !== lastExecutedCode;
      const activeRes = consoleActiveResult === 'submit'
        ? (submissionResult || sampleResults)
        : (sampleResults || submissionResult);
      const activeOutput = (!isCodeModified && activeRes)
        ? (activeRes.compilerOutput || activeRes.stdout || activeRes.testResults?.[0]?.actual || activeRes.results?.[0]?.actual || activeRes.error || '')
        : '';
      const activeCompiler = (!isCodeModified && activeRes)
        ? (activeRes.compilerOutput || activeRes.compileOutput || activeRes.error || '')
        : '';
      const activeStatus = (!isCodeModified && activeRes)
        ? (activeRes.status || 'Incomplete')
        : (syntaxCheck?.hasErrors ? 'Syntax Error' : 'Incomplete / Not Run');
      const testCasesList = (!isCodeModified && activeRes) ? (activeRes.testResults || activeRes.results || []) : [];
      const testCasesSummary = testCasesList.map(r => ({
        passed: r.passed,
        input: r.input,
        expected: r.expected,
        actual: r.actual
      }));

      const res = await fetch('http://127.0.0.1:8000/api/code/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_title: problem.title || 'Coding Problem',
          problem_description: problem.description || '',
          language: selectedLanguage,
          code: code || '',
          execution_output: activeOutput,
          compiler_output: activeCompiler,
          status: activeStatus,
          test_results: testCasesSummary,
          hint_level: level
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setAiFeedback(data);
    } catch (err) {
      console.error('Failed to get AI coding feedback:', err);
      setAiFeedbackError(err.message || 'Unable to fetch AI feedback. Ensure backend server is reachable.');
    } finally {
      setIsLoadingAiFeedback(false);
    }
  };


  // Live syntax & line-by-line diagnostics check
  const syntaxCheck = useMemo(() => {
    return codeExecutionService.validateSyntax(selectedLanguage, code, problem);
  }, [selectedLanguage, code, problem]);

  // Aggregate current diagnostics across editor live check or run results
  const allCurrentErrors = sampleResults?.errors || submissionResult?.errors || syntaxCheck?.errors || [];
  const allCurrentWarnings = sampleResults?.warnings || submissionResult?.warnings || syntaxCheck?.warnings || [];
  const activeDiagnostics = sampleResults?.lineDiagnostics || submissionResult?.lineDiagnostics || syntaxCheck?.lineDiagnostics || [];

  const errorLinesSet = useMemo(() => {
    const fromRes = sampleResults?.errorLines || submissionResult?.errorLines;
    if (fromRes && fromRes.length > 0) return new Set(fromRes);
    return new Set(syntaxCheck?.errorLines || []);
  }, [sampleResults, submissionResult, syntaxCheck]);

  const warningLinesSet = useMemo(() => {
    const fromRes = sampleResults?.warningLines || submissionResult?.warningLines;
    if (fromRes && fromRes.length > 0) return new Set(fromRes);
    return new Set(syntaxCheck?.warningLines || []);
  }, [sampleResults, submissionResult, syntaxCheck]);

  // Jump to specific line in code editor
  const jumpToLine = (targetLine) => {
    if (!textareaRef.current) return;
    const linesArr = code.split('\n');
    let charIndex = 0;
    for (let i = 0; i < Math.min(targetLine - 1, linesArr.length); i++) {
      charIndex += linesArr[i].length + 1;
    }
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charIndex, charIndex + (linesArr[targetLine - 1]?.length || 0));
    const lineHeight = fontSize * 1.6;
    textareaRef.current.scrollTop = Math.max(0, (targetLine - 3) * lineHeight);
  };

  // Load starter code or saved draft on mount or language change
  useEffect(() => {
    if (isDatabaseQuestion && selectedLanguage !== 'mysql') {
      setSelectedLanguage('mysql');
      return;
    }
    if (!isDatabaseQuestion && selectedLanguage === 'mysql') {
      setSelectedLanguage('python');
      return;
    }

    const draft = codeExecutionService.getDraft(problem.id, selectedLanguage);
    if (draft && draft.code) {
      setCode(draft.code);
    } else {
      const template = codeExecutionService.getStarterTemplate(problem, selectedLanguage);
      setCode(template);
    }
    setSampleResults(null);
    setSubmissionResult(null);
    setAiFeedback(null);
    setAiFeedbackError(null);
    setLastExecutedCode(null);
  }, [problem.id, selectedLanguage, isDatabaseQuestion]);

  // Periodic autosave
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => {
      codeExecutionService.saveDraft(problem.id, selectedLanguage, code);
    }, 2000);
    return () => clearTimeout(timer);
  }, [code, problem.id, selectedLanguage]);

  // Handle Tab key in code editor
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const spaces = '    ';
      setCode(code.substring(0, start) + spaces + code.substring(end));
      setSafeTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Run Code against visible sample cases
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setConsoleActiveResult('run');
    setLastExecutedCode(code);

    try {
      const result = await codeExecutionService.runCode(problem.id, selectedLanguage, code);
      setSampleResults(result);
      if (result.isCompileError || (result.errors && result.errors.length > 0)) {
        setActiveBottomTab('debugger');
      } else {
        setActiveBottomTab('testresult');
      }
    } catch (err) {
      setSampleResults({
        status: 'Runtime Error',
        isCompileError: false,
        allPassed: false,
        compilerOutput: err?.message || 'Execution error encountered.',
        testResults: (problem.sampleTestCases || []).map(tc => ({
          id: tc.id,
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: `Execution failed: ${err?.message || 'Unknown error'}`
        }))
      });
      setActiveBottomTab('testresult');
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code against hidden test cases
  const handleSubmitCode = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setConsoleActiveResult('submit');
    setLastExecutedCode(code);
    setConsoleActiveResult('run');
    setLastExecutedCode(code);
    try {
      const result = await codeExecutionService.submitCode(problem.id, selectedLanguage, code);
      setSubmissionResult(result);

      if (result.isCompileError || (result.errors && result.errors.length > 0)) {
        setActiveBottomTab('debugger');
      } else {
        setActiveBottomTab('testresult');
      }

      if (result.status === 'Accepted') {
        setShowSolutionDiscussion(true);
        if (onProblemSolved) {
          onProblemSolved(problem.id);
        }
      }
    } catch (err) {
      setSubmissionResult({
        status: 'Runtime Error',
        passedCount: 0,
        totalCount: (problem.sampleTestCases?.length || 0) + (problem.hiddenTestCases?.length || 0),
        compilerOutput: err?.message || 'Submission execution failed.'
      });
      setActiveBottomTab('testresult');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to original starter code
  const handleResetCode = () => {
    const template = codeExecutionService.getStarterTemplate(problem, selectedLanguage);
    setCode(template);
    codeExecutionService.clearDraft(problem.id, selectedLanguage);
    setSampleResults(null);
    setSubmissionResult(null);
    setAiFeedback(null);
    setAiFeedbackError(null);
    setLastExecutedCode(null);
    setConsoleActiveResult('run');

    setLastExecutedCode(code);

  };

  const currentLangObj = availableLanguages.find(l => l.id === selectedLanguage) || availableLanguages[0] || supportedLanguagesList[0];

  const difficultyColor =
    problem.difficulty === 'Easy' ? '#00B8A3' :
      problem.difficulty === 'Medium' ? '#FFC01E' : '#FF375F';

  // Line numbers calculation memoized
  const lineNumbers = useMemo(() => {
    const lineCount = Math.max(code.split('\n').length, 20);
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [code]);

  // Runtime and memory percentiles from genuine provider evaluation (if available)
  const runtimePercentile = submissionResult?.runtimePercentile || null;
  const memoryPercentile = submissionResult?.memoryPercentile || null;

  // LeetCode-style colors
  const lcBg = '#1A1A2E';
  const lcSurface = '#282828';
  const lcSurfaceLight = '#3A3A3A';
  const lcBorder = '#3E3E3E';
  const lcTextPrimary = '#EFF1F6FF';
  const lcTextSecondary = '#ABABAB';
  const lcTextMuted = '#6A6A6A';
  const lcGreen = '#2CBB5D';
  const lcGreenBg = 'rgba(44, 187, 93, 0.15)';
  const lcRed = '#EF4743';
  const lcYellow = '#FFC01E';

  // Execution status: 'CORRECT' | 'INCORRECT' | 'UNKNOWN'
  // Strictly derived from actual execution/submission results and invalidated when code is modified
  const executionStatus = useMemo(() => {
    // If code has been modified since last execution, or never executed
    if (lastExecutedCode === null || code !== lastExecutedCode) {
      return 'UNKNOWN';
    }

    const activeRes = consoleActiveResult === 'submit'
      ? (submissionResult || sampleResults)
      : (sampleResults || submissionResult);

    if (!activeRes) {
      return 'UNKNOWN';
    }

    // Check compilation, runtime, or service failures
    if (
      activeRes.isCompileError ||
      activeRes.status === 'Compilation Error' ||
      activeRes.status === 'Runtime Error' ||
      activeRes.status === 'Execution Error' ||
      activeRes.status === 'Time Limit Exceeded' ||
      activeRes.status === 'Service Unavailable'
    ) {
      return 'INCORRECT';
    }

    // Submission result evaluation
    if (activeRes.totalCount !== undefined) {
      if (activeRes.status === 'Accepted' || (activeRes.totalCount > 0 && activeRes.passedCount === activeRes.totalCount)) {
        return 'CORRECT';
      }
      return 'INCORRECT';
    }

    // Sample run result evaluation
    if (activeRes.allPassed === true || activeRes.status === 'Accepted') {
      return 'CORRECT';
    }

    if (activeRes.allPassed === false || activeRes.status === 'Wrong Answer') {
      return 'INCORRECT';
    }

    return 'UNKNOWN';
  }, [code, lastExecutedCode, consoleActiveResult, sampleResults, submissionResult]);

  const isCodeModifiedSinceRun = lastExecutedCode === null || code !== lastExecutedCode;

  // Single centralized status-driven styling and content configuration for AI Tutor panel
  const getAiTutorStyleConfig = (status) => {
    switch (status) {
      case 'CORRECT':
        return {
          status: 'CORRECT',
          badgeText: 'Code Accepted',
          badgeBg: 'rgba(44, 187, 93, 0.15)',
          badgeBorder: 'rgba(44, 187, 93, 0.4)',
          badgeColor: lcGreen,
          // Primary diagnosis: What Went Right / Code Accepted
          primaryHeading: 'WHAT WENT RIGHT',
          primaryBg: 'rgba(44, 187, 93, 0.10)',
          primaryBorder: '1px solid rgba(44, 187, 93, 0.35)',
          primaryHeaderColor: lcGreen,
          primaryIcon: <CheckCircle2 size={15} color={lcGreen} />,
          primaryTextColor: lcTextPrimary,
          // Root cause & explanation: neutral or green styling for correct code
          rootCauseHeading: 'Solution Highlights & Logic Explanation',
          rootCauseBg: 'rgba(44, 187, 93, 0.06)',
          rootCauseBorder: '1px solid rgba(44, 187, 93, 0.25)',
          rootCauseHeaderColor: lcGreen,
          rootCauseIcon: <Lightbulb size={15} color={lcGreen} />,
          // Test case analysis: green success state when all tests pass
          testCaseHeading: 'ALL TEST CASES PASSED',
          testCaseBg: 'rgba(44, 187, 93, 0.06)',
          testCaseBorder: '1px solid rgba(44, 187, 93, 0.25)',
          testCaseHeaderColor: lcGreen,
          testCaseIcon: <CheckCircle2 size={15} color={lcGreen} />
        };
      case 'INCORRECT':
        return {
          status: 'INCORRECT',
          badgeText: 'Execution Failed',
          badgeBg: 'rgba(239, 71, 67, 0.15)',
          badgeBorder: 'rgba(239, 71, 67, 0.4)',
          badgeColor: lcRed,
          // Primary diagnosis: What Went Wrong
          primaryHeading: 'WHAT WENT WRONG',
          primaryBg: '#271B1B',
          primaryBorder: `1px solid ${lcRed}44`,
          primaryHeaderColor: lcRed,
          primaryIcon: <AlertCircle size={15} color={lcRed} />,
          primaryTextColor: lcTextPrimary,
          // Root cause & explanation: red only for an actual failure
          rootCauseHeading: 'Root Cause & Explanation',
          rootCauseBg: '#271B1B',
          rootCauseBorder: `1px solid ${lcRed}44`,
          rootCauseHeaderColor: lcRed,
          rootCauseIcon: <AlertCircle size={15} color={lcRed} />,
          // Test case analysis: failing / boundary test case analysis
          testCaseHeading: 'FAILING / BOUNDARY TEST CASE ANALYSIS',
          testCaseBg: '#271B1B',
          testCaseBorder: `1px solid ${lcRed}44`,
          testCaseHeaderColor: lcRed,
          testCaseIcon: <AlertCircle size={15} color={lcRed} />
        };
      case 'UNKNOWN':
      default:
        return {
          status: 'UNKNOWN',
          badgeText: 'Awaiting Run',
          badgeBg: 'rgba(168, 168, 168, 0.12)',
          badgeBorder: lcBorder,
          badgeColor: lcTextSecondary,
          // Primary diagnosis: Awaiting Execution Result
          primaryHeading: 'AWAITING EXECUTION RESULT',
          primaryBg: '#222222',
          primaryBorder: `1px solid ${lcBorder}`,
          primaryHeaderColor: lcTextSecondary,
          primaryIcon: <Lightbulb size={15} color={lcTextSecondary} />,
          primaryTextColor: lcTextPrimary,
          // Root cause & explanation: neutral gray styling
          rootCauseHeading: 'Root Cause & Explanation',
          rootCauseBg: '#202020',
          rootCauseBorder: `1px solid ${lcBorder}`,
          rootCauseHeaderColor: lcTextSecondary,
          rootCauseIcon: <Lightbulb size={15} color={lcTextSecondary} />,
          // Test case analysis: neutral test case analysis
          testCaseHeading: 'TEST CASE ANALYSIS',
          testCaseBg: '#202020',
          testCaseBorder: `1px solid ${lcBorder}`,
          testCaseHeaderColor: lcTextSecondary,
          testCaseIcon: <CheckCircle2 size={15} color={lcTextSecondary} />
        };
    }
  };

  const aiTutorStyles = getAiTutorStyleConfig(executionStatus);

  const workspaceBody = (
    <div
      className="coding-workspace-card"
      style={{
        width: isFullscreen ? '100vw' : '100%',
        maxWidth: isFullscreen ? '100vw' : (embedded ? '100%' : '1600px'),
        height: isFullscreen ? '100vh' : '100%',
        backgroundColor: lcSurface,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: isFullscreen ? 0 : '10px',
        boxShadow: isFullscreen ? 'none' : (embedded ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'),
        border: isFullscreen ? 'none' : `1px solid ${lcBorder}`,
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : undefined
      }}
    >
      {/* ===== TOP NAVBAR (LeetCode-style) ===== */}
      <div style={{
        height: '44px',
        backgroundColor: '#1A1A1A',
        borderBottom: `1px solid ${lcBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0
      }}>
        {/* Left: Problem info + optional Back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {embedded && (
            <>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${lcBorder}`,
                  color: lcTextPrimary,
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                title="Return to Problem Library"
              >
                <ChevronLeft size={14} />
                <span>Problem Library</span>
              </button>
              <span style={{ color: lcTextMuted }}>|</span>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={18} color={lcGreen} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: lcTextPrimary }}>
              {problem.title}
            </span>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: difficultyColor,
            padding: '1px 8px',
            borderRadius: '10px',
            backgroundColor: `${difficultyColor}22`
          }}>
            {problem.difficulty}
          </span>
          {isAssessmentMode && assessmentTimer && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              color: lcRed, fontSize: '12px', fontWeight: 700
            }}>
              <Timer size={13} />
              <span>{assessmentTimer}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            style={{
              background: 'none', border: 'none', color: lcTextSecondary,
              cursor: 'pointer', padding: '4px', borderRadius: '4px',
              display: 'flex', alignItems: 'center'
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none', border: 'none', color: lcTextSecondary,
              cursor: 'pointer', padding: '4px', borderRadius: '4px',
              display: 'flex', alignItems: 'center'
            }}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: lcTextSecondary,
              cursor: 'pointer', padding: '4px', borderRadius: '4px',
              display: 'flex', alignItems: 'center'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>


      {/* Settings dropdown */}
      {showSettings && (
        <div style={{
          position: 'absolute', right: '16px', top: '44px', zIndex: 100,
          backgroundColor: '#333', border: `1px solid ${lcBorder}`,
          borderRadius: '8px', padding: '12px', minWidth: '200px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: lcTextSecondary, fontSize: '12px' }}>Font Size</span>
            <select
              value={fontSize}
              onChange={(e) => { setFontSize(Number(e.target.value)); setShowSettings(false); }}
              style={{
                backgroundColor: lcSurfaceLight, border: `1px solid ${lcBorder}`,
                color: lcTextPrimary, fontSize: '12px', borderRadius: '4px', padding: '2px 6px'
              }}
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: lcTextSecondary, fontSize: '12px' }}>Reset Code</span>
            <button
              onClick={() => { handleResetCode(); setShowSettings(false); }}
              style={{
                backgroundColor: lcSurfaceLight, border: `1px solid ${lcBorder}`,
                color: lcTextPrimary, fontSize: '11px', borderRadius: '4px',
                padding: '3px 8px', cursor: 'pointer'
              }}
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* ===== MAIN 3-PANE LAYOUT ===== */}
      <div className="coding-workspace-main-pane" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ============ LEFT PANEL: Problem Description ============ */}
        <div className="coding-workspace-left-panel" style={{
          width: '42%',
          minWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${lcBorder}`,
          backgroundColor: lcSurface
        }}>
          {/* Left Panel Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${lcBorder}`,
            backgroundColor: '#1A1A1A',
            padding: '0 4px'
          }}>
            {[
              { id: 'description', label: 'Description', icon: <FileText size={13} /> },
              { id: 'editorial', label: 'Editorial', icon: <BookOpen size={13} /> },
              { id: 'submissions', label: 'Submissions', icon: <History size={13} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLeftTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeLeftTab === tab.id ? `2px solid ${lcTextPrimary}` : '2px solid transparent',
                  color: activeLeftTab === tab.id ? lcTextPrimary : lcTextSecondary,
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Left Panel Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

            {activeLeftTab === 'description' && (
              <div>
                {/* Title + Difficulty */}
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: lcTextPrimary, margin: '0 0 8px 0' }}>
                    {problem.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: difficultyColor, fontSize: '13px', fontWeight: 600 }}>
                      {problem.difficulty}
                    </span>
                    <span style={{ color: lcTextMuted, fontSize: '12px' }}>|</span>
                    <span style={{ color: lcTextSecondary, fontSize: '12px' }}>
                      {problem.topic}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '14px', color: lcTextPrimary, lineHeight: 1.7,
                  whiteSpace: 'pre-line', marginBottom: '24px'
                }}>
                  {problem.description}
                </div>

                {/* Examples */}
                {problem.examples?.map((ex, idx) => (
                  <div key={idx} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: lcTextPrimary, marginBottom: '8px' }}>
                      Example {idx + 1}:
                    </div>
                    <div style={{
                      backgroundColor: '#373737',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                      fontSize: '13px',
                      lineHeight: 1.8
                    }}>
                      <div>
                        <span style={{ color: lcTextSecondary, fontWeight: 600 }}>Input: </span>
                        <span style={{ color: lcTextPrimary }}>{ex.input}</span>
                      </div>
                      <div>
                        <span style={{ color: lcTextSecondary, fontWeight: 600 }}>Output: </span>
                        <span style={{ color: lcTextPrimary }}>{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div>
                          <span style={{ color: lcTextSecondary, fontWeight: 600 }}>Explanation: </span>
                          <span style={{ color: lcTextSecondary }}>{ex.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Constraints */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: lcTextPrimary, marginBottom: '8px' }}>
                    Constraints:
                  </div>
                  <ul style={{
                    margin: 0, paddingLeft: '20px', fontSize: '13px',
                    color: lcTextPrimary, lineHeight: 1.8
                  }}>
                    {problem.constraints?.map((c, i) => (
                      <li key={i}>
                        <code style={{
                          backgroundColor: '#373737', padding: '2px 6px',
                          borderRadius: '4px', fontSize: '12px'
                        }}>{c}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hints (LeetCode-style collapsible) */}
                {!isAssessmentMode && problem.hints?.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    {problem.hints.map((hint, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        <button
                          onClick={() => setRevealedHints(prev => Math.max(prev, idx + 1))}
                          style={{
                            width: '100%', textAlign: 'left',
                            background: '#373737', border: 'none',
                            borderRadius: '8px', padding: '10px 14px',
                            color: lcTextPrimary, fontSize: '13px',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '8px'
                          }}
                        >
                          <Lightbulb size={14} color={lcYellow} />
                          <span style={{ fontWeight: 500 }}>Hint {idx + 1}</span>
                          <ChevronDown size={14} style={{
                            marginLeft: 'auto',
                            transform: revealedHints > idx ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s'
                          }} />
                        </button>
                        {revealedHints > idx && (
                          <div style={{
                            padding: '10px 14px 10px 38px',
                            fontSize: '13px', color: lcTextSecondary, lineHeight: 1.5
                          }}>
                            {hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Solution Complexity (after accepted) */}
                {showSolutionDiscussion && problem.solutionAnalysis && (
                  <div style={{
                    padding: '14px',
                    backgroundColor: lcGreenBg,
                    border: `1px solid ${lcGreen}44`,
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <CheckCircle2 size={16} color={lcGreen} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: lcGreen }}>
                        Solution Analysis
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: lcTextSecondary }}>Your Solution:</span>
                        <strong style={{ display: 'block', color: lcTextPrimary }}>{problem.solutionAnalysis.userComplexity}</strong>
                      </div>
                      <div>
                        <span style={{ color: lcTextSecondary }}>Optimal:</span>
                        <strong style={{ display: 'block', color: lcGreen }}>{problem.solutionAnalysis.optimalComplexity}</strong>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: lcTextSecondary, marginTop: '8px', marginBottom: 0 }}>
                      {problem.solutionAnalysis.recommendation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeLeftTab === 'editorial' && (
              <div style={{ color: lcTextSecondary, fontSize: '14px', lineHeight: 1.6 }}>
                {!isAssessmentMode ? (
                  <>
                    <h3 style={{ color: lcTextPrimary, fontWeight: 600, marginBottom: '12px' }}>Approach</h3>
                    {problem.solutionAnalysis ? (
                      <>
                        <p style={{ marginBottom: '12px' }}>
                          <strong style={{ color: lcTextPrimary }}>Optimal Complexity: </strong>
                          {problem.solutionAnalysis.optimalComplexity}
                        </p>
                        <p style={{ marginBottom: '12px' }}>
                          <strong style={{ color: lcTextPrimary }}>Brute Force: </strong>
                          {problem.solutionAnalysis.bruteForceComplexity}
                        </p>
                        <p>{problem.solutionAnalysis.recommendation}</p>
                      </>
                    ) : (
                      <p style={{ color: lcTextMuted }}>Editorial not available for this problem yet.</p>
                    )}
                  </>
                ) : (
                  <p style={{ color: lcTextMuted, textAlign: 'center', marginTop: '40px' }}>
                    Editorial is disabled during assessments.
                  </p>
                )}
              </div>
            )}

            {activeLeftTab === 'submissions' && (
              <div style={{ color: lcTextSecondary, fontSize: '13px' }}>
                {submissionResult ? (
                  <div style={{
                    backgroundColor: '#373737',
                    borderRadius: '8px',
                    padding: '14px'
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'
                    }}>
                      <span style={{
                        color: submissionResult.status === 'Accepted' ? lcGreen : lcRed,
                        fontWeight: 700, fontSize: '14px'
                      }}>
                        {submissionResult.status}
                      </span>
                      <span style={{ color: lcTextMuted, fontSize: '12px' }}>
                        — {selectedLanguage}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: lcTextSecondary }}>
                      Runtime: {submissionResult.runtimeMs} · Memory: {submissionResult.memoryMB}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: lcTextMuted, textAlign: 'center', marginTop: '40px' }}>
                    No submissions yet. Click Submit to evaluate your solution.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============ RIGHT PANEL: Code Editor + Console ============ */}
        <div className="coding-workspace-right-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: lcSurface
        }}>
          {/* Editor Header: Language selector */}
          <div style={{
            height: '38px',
            backgroundColor: '#1A1A1A',
            borderBottom: `1px solid ${lcBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  backgroundColor: '#333',
                  border: `1px solid ${lcBorder}`,
                  color: lcTextPrimary,
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {availableLanguages.map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Syntax & Debug status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {allCurrentErrors.length > 0 ? (
                <div
                  onClick={() => setActiveBottomTab('debugger')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: '11px', color: lcRed, fontWeight: 600,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    padding: '3px 10px', borderRadius: '4px',
                    maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                  title="Click to inspect all lines in Line Debugger"
                >
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {allCurrentErrors.length} Error{allCurrentErrors.length === 1 ? '' : 's'}: Line {allCurrentErrors[0].line} ({allCurrentErrors[0].message})
                  </span>
                </div>
              ) : allCurrentWarnings.length > 0 ? (
                <div
                  onClick={() => setActiveBottomTab('debugger')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: '11px', color: '#F59E0B', fontWeight: 500,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    padding: '3px 8px', borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="Click to inspect warnings in Line Debugger"
                >
                  <AlertCircle size={12} />
                  <span>Syntax OK ({allCurrentWarnings.length} warning{allCurrentWarnings.length === 1 ? '' : 's'})</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', color: lcGreen, fontWeight: 500,
                    backgroundColor: 'rgba(44, 187, 93, 0.12)',
                    padding: '3px 8px', borderRadius: '4px'
                  }}
                >
                  <Check size={12} />
                  <span>Syntax Clean</span>
                </div>
              )}
              <button
                onClick={() => {
                  codeExecutionService.saveDraft(problem.id, selectedLanguage, code);
                }}
                style={{
                  background: 'none', border: 'none', color: lcTextMuted,
                  cursor: 'pointer', padding: '4px', fontSize: '11px',
                  display: 'flex', alignItems: 'center', gap: '3px'
                }}
                title="Auto-saved"
              >
                <Save size={12} />
              </button>
            </div>
          </div>

          {/* ===== CODE EDITOR (Dark, Monaco-inspired) ===== */}
          <div style={{
            flex: 1,
            display: 'flex',
            minHeight: 0,
            backgroundColor: '#1E1E1E',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Line Numbers Gutter with Multi-Error & Warning Indicators */}
            <div
              ref={gutterRef}
              style={{
                width: '54px',
                padding: '10px 0',
                textAlign: 'right',
                userSelect: 'none',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: `${fontSize}px`,
                lineHeight: 1.6,
                backgroundColor: '#1E1E1E',
                borderRight: '1px solid #2D2D2D',
                overflowY: 'hidden'
              }}
            >
              {lineNumbers.map(n => {
                const isErr = errorLinesSet.has(n);
                const isWarn = !isErr && warningLinesSet.has(n);
                return (
                  <div
                    key={n}
                    onClick={() => jumpToLine(n)}
                    style={{
                      color: isErr ? '#EF4444' : isWarn ? '#F59E0B' : '#5A5A5A',
                      fontWeight: (isErr || isWarn) ? 700 : 400,
                      backgroundColor: isErr ? 'rgba(239, 68, 68, 0.22)' : isWarn ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                      paddingRight: '10px',
                      height: `${fontSize * 1.6}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      cursor: (isErr || isWarn) ? 'pointer' : 'default',
                      position: 'relative'
                    }}
                    title={isErr ? `Line ${n} has errors - click to focus in editor` : isWarn ? `Line ${n} has warnings` : `Line ${n}`}
                  >
                    {isErr && (
                      <span style={{
                        position: 'absolute',
                        left: '6px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#EF4444'
                      }} />
                    )}
                    {isWarn && (
                      <span style={{
                        position: 'absolute',
                        left: '6px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#F59E0B'
                      }} />
                    )}
                    {n}
                  </div>
                );
              })}
            </div>

            {/* Textarea Code Input */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={(e) => {
                if (gutterRef.current) {
                  gutterRef.current.scrollTop = e.target.scrollTop;
                }
              }}
              spellCheck={false}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: 'transparent',
                color: '#D4D4D4',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: `${fontSize}px`,
                lineHeight: 1.6,
                whiteSpace: 'pre',
                overflowX: 'auto',
                overflowY: 'auto',
                caretColor: '#AEAFAD'
              }}
            />
          </div>

          {/* ===== BOTTOM CONSOLE PANEL ===== */}
          <div style={{
            height: isConsoleMaximized ? '55vh' : '280px',
            minHeight: '180px',
            maxHeight: '75vh',
            borderTop: `1px solid ${lcBorder}`,
            backgroundColor: lcSurface,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            transition: 'height 0.2s ease'
          }}>
            {/* Console Header: Tabs + Run/Submit */}
            <div style={{
              height: '42px',
              backgroundColor: '#1A1A1A',
              borderBottom: `1px solid ${lcBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px'
            }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {[
                  { id: 'testcase', label: 'Testcase' },
                  { id: 'testresult', label: 'Test Result' },
                  { id: 'debugger', label: 'Line Debugger', isDebugger: true },
                  { id: 'ai-hints', label: 'AI Tutor & Hints', isAiHints: true }
                ].map(tab => {
                  const isSelected = activeBottomTab === tab.id;
                  const errorCount = allCurrentErrors.length;
                  const warningCount = allCurrentWarnings.length;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveBottomTab(tab.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: isSelected
                          ? `2px solid ${tab.isDebugger && errorCount > 0 ? lcRed : tab.isAiHints ? '#A855F7' : lcTextPrimary}`
                          : '2px solid transparent',
                        color: isSelected ? lcTextPrimary : lcTextSecondary,
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {tab.isDebugger && (
                        <Bug
                          size={13}
                          color={errorCount > 0 ? lcRed : warningCount > 0 ? lcYellow : lcGreen}
                        />
                      )}
                      {tab.isAiHints && (
                        <Sparkles
                          size={13}
                          color="#C084FC"
                        />
                      )}
                      {tab.label}
                      {tab.isAiHints && aiFeedback && (
                        <span style={{
                          width: '6px', height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#C084FC',
                          display: 'inline-block'
                        }} />
                      )}
                      {tab.id === 'testresult' && (sampleResults || submissionResult) && (
                        <span style={{
                          width: '6px', height: '6px',
                          borderRadius: '50%',
                          backgroundColor: consoleActiveResult === 'submit'
                            ? (submissionResult?.status === 'Accepted' ? lcGreen : lcRed)
                            : ((sampleResults?.status === 'Accepted' || sampleResults?.allPassed) ? lcGreen : lcRed),
                          display: 'inline-block'
                        }} />
                      )}
                      {tab.isDebugger && (
                        errorCount > 0 ? (
                          <span style={{
                            backgroundColor: `${lcRed}22`,
                            color: lcRed,
                            border: `1px solid ${lcRed}55`,
                            borderRadius: '10px',
                            padding: '1px 7px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {errorCount}
                          </span>
                        ) : warningCount > 0 ? (
                          <span style={{
                            backgroundColor: `${lcYellow}22`,
                            color: lcYellow,
                            border: `1px solid ${lcYellow}55`,
                            borderRadius: '10px',
                            padding: '1px 7px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {warningCount}
                          </span>
                        ) : (
                          <span style={{
                            color: lcGreen,
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            ✓
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Run + Submit + AI Tutor + Maximize Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => handleRequestAiFeedback(aiHintLevel)}
                  disabled={isLoadingAiFeedback}
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#D8B4FE',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '5px 14px',
                    borderRadius: '6px',
                    cursor: isLoadingAiFeedback ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                  title="Get intelligent AI diagnostic feedback and progressive hints"
                >
                  <Sparkles size={13} color="#C084FC" />
                  {isLoadingAiFeedback ? 'Analyzing...' : 'AI Tutor'}
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${lcBorder}`,
                    color: lcTextPrimary,
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '5px 16px',
                    borderRadius: '6px',
                    cursor: isRunning || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isRunning || isSubmitting ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Play size={13} fill={lcTextPrimary} />
                  {isRunning ? 'Running...' : 'Run'}
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning || isSubmitting}
                  style={{
                    backgroundColor: lcGreen,
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '5px 20px',
                    borderRadius: '6px',
                    cursor: isRunning || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isRunning || isSubmitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Upload size={13} />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>

                <button
                  onClick={() => setIsConsoleMaximized(prev => !prev)}
                  title={isConsoleMaximized ? "Restore Console" : "Expand Console"}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${lcBorder}`,
                    color: lcTextSecondary,
                    fontSize: '13px',
                    padding: '5px 9px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  {isConsoleMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </div>
            </div>

            {/* Console Body */}
            <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', fontSize: '13px', color: lcTextPrimary }}>

              {/* TESTCASE TAB */}
              {activeBottomTab === 'testcase' && (
                <div>
                  {/* Case selector pills */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {problem.sampleTestCases?.map((tc, idx) => (
                      <button
                        key={tc.id}
                        onClick={() => setActiveTestCaseIdx(idx)}
                        style={{
                          backgroundColor: activeTestCaseIdx === idx ? lcSurfaceLight : 'transparent',
                          color: activeTestCaseIdx === idx ? lcTextPrimary : lcTextSecondary,
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 14px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Case content */}
                  {problem.sampleTestCases?.[activeTestCaseIdx] && (
                    <div>
                      {/* Parse input params */}
                      {problem.sampleTestCases[activeTestCaseIdx].input.split(',').map((param, pIdx) => {
                        const trimmed = param.trim();
                        const eqIdx = trimmed.indexOf('=');
                        const paramName = eqIdx > -1 ? trimmed.substring(0, eqIdx).trim() : `param${pIdx}`;
                        const paramVal = eqIdx > -1 ? trimmed.substring(eqIdx + 1).trim() : trimmed;
                        return (
                          <div key={pIdx} style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px', fontWeight: 500 }}>
                              {paramName} =
                            </div>
                            <div style={{
                              backgroundColor: '#373737',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                              fontSize: '13px',
                              color: lcTextPrimary
                            }}>
                              {paramVal}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TEST RESULT TAB */}
              {activeBottomTab === 'testresult' && (
                <div>
                  {/* Toggle between Run Result and Submission */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    borderBottom: `1px solid ${lcBorder}`,
                    paddingBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setConsoleActiveResult('run')}
                        style={{
                          backgroundColor: consoleActiveResult === 'run' ? lcSurfaceLight : 'transparent',
                          border: `1px solid ${consoleActiveResult === 'run' ? lcBorder : 'transparent'}`,
                          color: consoleActiveResult === 'run' ? lcTextPrimary : lcTextSecondary,
                          borderRadius: '6px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span>Run Result</span>
                        {sampleResults && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: (sampleResults.status === 'Accepted' || sampleResults.allPassed) ? lcGreen : lcRed
                          }} />
                        )}
                      </button>
                      <button
                        onClick={() => setConsoleActiveResult('submit')}
                        style={{
                          backgroundColor: consoleActiveResult === 'submit' ? lcSurfaceLight : 'transparent',
                          border: `1px solid ${consoleActiveResult === 'submit' ? lcBorder : 'transparent'}`,
                          color: consoleActiveResult === 'submit' ? lcTextPrimary : lcTextSecondary,
                          borderRadius: '6px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span>Submission</span>
                        {submissionResult && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: submissionResult.status === 'Accepted' ? lcGreen : lcRed
                          }} />
                        )}
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: lcTextMuted }}>
                      {consoleActiveResult === 'run' ? 'Sample Testcases' : 'All Testcases (Hidden + Sample)'}
                    </div>
                  </div>

                  {/* RUN RESULT VIEW */}
                  {consoleActiveResult === 'run' && (
                    <div>
                      {!sampleResults ? (
                        <div style={{ color: lcTextMuted, textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>
                          You must run your code first to view sample test results.
                        </div>
                      ) : (sampleResults.status === 'Compilation Error' || sampleResults.status === 'Syntax Error' || sampleResults.isCompileError) ? (
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                          }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: lcRed }}>
                              Compile Error
                            </div>
                            <button
                              onClick={() => setActiveBottomTab('debugger')}
                              style={{
                                backgroundColor: '#2D1F1F',
                                border: `1px solid ${lcRed}66`,
                                color: lcRed,
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                padding: '5px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Bug size={13} />
                              View Line-by-Line Debugger ({allCurrentErrors.length > 0 ? `${allCurrentErrors.length} errors` : 'Inspect'})
                            </button>
                          </div>
                          <pre style={{
                            backgroundColor: '#373737',
                            borderRadius: '8px',
                            padding: '14px',
                            fontSize: '13px',
                            color: lcRed,
                            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                            lineHeight: 1.6,
                            margin: 0,
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {sampleResults.compilerOutput || sampleResults.compileOutput || 'Compilation failed.'}
                          </pre>
                        </div>
                      ) : sampleResults.status === 'Service Unavailable' ? (
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#FB923C', marginBottom: '8px' }}>
                            Service Unavailable
                          </div>
                          <div style={{ fontSize: '13px', color: lcTextSecondary, marginBottom: '12px' }}>
                            The code execution backend is currently unreachable. Make sure the local backend server is running on port 8000.
                          </div>
                          {sampleResults.compilerOutput && (
                            <pre style={{
                              backgroundColor: '#373737',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '12px',
                              color: lcTextMuted,
                              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                              margin: 0,
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {sampleResults.compilerOutput}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Status header */}
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            marginBottom: '12px',
                            color: sampleResults.allPassed ? lcGreen : lcRed
                          }}>
                            {sampleResults.allPassed
                              ? 'Accepted'
                              : (sampleResults.status === 'Time Limit Exceeded'
                                ? 'Time Limit Exceeded'
                                : sampleResults.status === 'Runtime Error'
                                  ? 'Runtime Error'
                                  : 'Wrong Answer')}
                          </div>

                          {/* Execution stats */}
                          <div style={{
                            display: 'flex', gap: '16px', marginBottom: '14px',
                            fontSize: '12px', color: lcTextSecondary
                          }}>
                            <span>Runtime: <strong style={{ color: lcTextPrimary }}>{sampleResults.totalTime || sampleResults.executionTime || '0 ms'}</strong></span>
                            <span>Memory: <strong style={{ color: lcTextPrimary }}>{sampleResults.totalMemory || '0 MB'}</strong></span>
                          </div>

                          {/* Case pills */}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {sampleResults.testResults?.map((tr, idx) => (
                              <button
                                key={tr.id || idx}
                                onClick={() => setActiveTestCaseIdx(idx)}
                                style={{
                                  backgroundColor: activeTestCaseIdx === idx ? lcSurfaceLight : 'transparent',
                                  color: tr.passed ? lcGreen : lcRed,
                                  border: `1px solid ${activeTestCaseIdx === idx ? lcBorder : 'transparent'}`,
                                  borderRadius: '6px',
                                  padding: '4px 14px',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {tr.passed ? <Check size={12} /> : <X size={12} />}
                                Case {idx + 1}
                              </button>
                            ))}
                          </div>

                          {/* Selected case detail */}
                          {sampleResults.testResults?.[activeTestCaseIdx] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div>
                                <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px', fontWeight: 500 }}>Input</div>
                                <div style={{
                                  backgroundColor: '#373737', borderRadius: '6px', padding: '8px 12px',
                                  fontFamily: 'Menlo, Monaco, "Courier New", monospace', fontSize: '13px', color: lcTextPrimary,
                                  overflowX: 'auto', whiteSpace: 'pre-wrap'
                                }}>
                                  {sampleResults.testResults[activeTestCaseIdx].input}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px', fontWeight: 500 }}>Output</div>
                                <div style={{
                                  backgroundColor: '#373737', borderRadius: '6px', padding: '8px 12px',
                                  fontFamily: 'Menlo, Monaco, "Courier New", monospace', fontSize: '13px',
                                  color: sampleResults.testResults[activeTestCaseIdx].passed ? lcTextPrimary : lcRed,
                                  overflowX: 'auto', whiteSpace: 'pre-wrap'
                                }}>
                                  {sampleResults.testResults[activeTestCaseIdx].actual}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px', fontWeight: 500 }}>Expected</div>
                                <div style={{
                                  backgroundColor: '#373737', borderRadius: '6px', padding: '8px 12px',
                                  fontFamily: 'Menlo, Monaco, "Courier New", monospace', fontSize: '13px', color: lcTextPrimary,
                                  overflowX: 'auto', whiteSpace: 'pre-wrap'
                                }}>
                                  {sampleResults.testResults[activeTestCaseIdx].expected}
                                </div>
                              </div>
                            </div>
                          )}

                          {sampleResults.compilerOutput && !sampleResults.allPassed && (
                            <div style={{ marginTop: '12px' }}>
                              <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px', fontWeight: 500 }}>Diagnostic Output</div>
                              <pre style={{
                                backgroundColor: '#373737',
                                borderRadius: '6px',
                                padding: '10px 12px',
                                fontSize: '12px',
                                color: lcRed,
                                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                margin: 0,
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {sampleResults.compilerOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBMISSION RESULT VIEW */}
                  {consoleActiveResult === 'submit' && (
                    <div>
                      {!submissionResult ? (
                        <div style={{ color: lcTextMuted, textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>
                          You must submit your code first to evaluate against all testcases.
                        </div>
                      ) : (submissionResult.status === 'Compilation Error' || submissionResult.status === 'Syntax Error' || submissionResult.isCompileError) ? (
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                          }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: lcRed }}>
                              Compile Error
                            </div>
                            <button
                              onClick={() => setActiveBottomTab('debugger')}
                              style={{
                                backgroundColor: '#2D1F1F',
                                border: `1px solid ${lcRed}66`,
                                color: lcRed,
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                padding: '5px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Bug size={13} />
                              View Line-by-Line Debugger ({allCurrentErrors.length > 0 ? `${allCurrentErrors.length} errors` : 'Inspect'})
                            </button>
                          </div>
                          <pre style={{
                            backgroundColor: '#373737',
                            borderRadius: '8px',
                            padding: '14px',
                            fontSize: '13px',
                            color: lcRed,
                            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                            lineHeight: 1.6,
                            margin: 0,
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {submissionResult.compilerOutput || submissionResult.compileOutput || 'Compilation failed.'}
                          </pre>
                        </div>
                      ) : submissionResult.status === 'Service Unavailable' ? (
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#FB923C', marginBottom: '8px' }}>
                            Service Unavailable
                          </div>
                          <div style={{ fontSize: '13px', color: lcTextSecondary, marginBottom: '12px' }}>
                            The code execution backend is currently unreachable. Make sure the local backend server is running on port 8000.
                          </div>
                          {submissionResult.compilerOutput && (
                            <pre style={{
                              backgroundColor: '#373737',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '12px',
                              color: lcTextMuted,
                              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                              margin: 0,
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {submissionResult.compilerOutput}
                            </pre>
                          )}
                        </div>
                      ) : submissionResult.status === 'Accepted' ? (
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: lcGreen, marginBottom: '16px' }}>
                            Accepted
                          </div>
                          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {/* Runtime */}
                            <div style={{
                              backgroundColor: '#2D2D2D',
                              padding: '12px 18px',
                              borderRadius: '8px',
                              border: `1px solid ${lcBorder}`,
                              minWidth: '140px'
                            }}>
                              <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px' }}>Runtime</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '22px', fontWeight: 700, color: lcTextPrimary }}>
                                  {submissionResult.runtimeMs || '0 ms'}
                                </span>
                              </div>
                              {runtimePercentile && (
                                <div style={{ fontSize: '12px', color: lcTextSecondary, marginTop: '4px' }}>
                                  Beats <span style={{ color: lcTextPrimary, fontWeight: 600 }}>{runtimePercentile}</span> of users
                                </div>
                              )}
                            </div>

                            {/* Memory */}
                            <div style={{
                              backgroundColor: '#2D2D2D',
                              padding: '12px 18px',
                              borderRadius: '8px',
                              border: `1px solid ${lcBorder}`,
                              minWidth: '140px'
                            }}>
                              <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px' }}>Memory</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '22px', fontWeight: 700, color: lcTextPrimary }}>
                                  {submissionResult.memoryMB || '0 MB'}
                                </span>
                              </div>
                              {memoryPercentile && (
                                <div style={{ fontSize: '12px', color: lcTextSecondary, marginTop: '4px' }}>
                                  Beats <span style={{ color: lcTextPrimary, fontWeight: 600 }}>{memoryPercentile}</span> of users
                                </div>
                              )}
                            </div>

                            {/* Testcases count */}
                            <div style={{
                              backgroundColor: '#2D2D2D',
                              padding: '12px 18px',
                              borderRadius: '8px',
                              border: `1px solid ${lcBorder}`,
                              minWidth: '140px'
                            }}>
                              <div style={{ fontSize: '12px', color: lcTextSecondary, marginBottom: '4px' }}>Testcases</div>
                              <div style={{ fontSize: '22px', fontWeight: 700, color: lcGreen }}>
                                {submissionResult.passedCount || submissionResult.totalCount} / {submissionResult.totalCount} Passed
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: lcRed,
                            marginBottom: '12px'
                          }}>
                            {submissionResult.status === 'Time Limit Exceeded'
                              ? 'Time Limit Exceeded'
                              : submissionResult.status === 'Runtime Error'
                                ? 'Runtime Error'
                                : 'Wrong Answer'}
                          </div>
                          <div style={{ fontSize: '13px', color: lcTextSecondary, marginBottom: '8px' }}>
                            {submissionResult.passedCount} / {submissionResult.totalCount} testcases passed
                          </div>
                          {submissionResult.compilerOutput && (
                            <pre style={{
                              backgroundColor: '#373737',
                              borderRadius: '8px',
                              padding: '14px',
                              fontSize: '13px',
                              color: lcTextSecondary,
                              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                              lineHeight: 1.6,
                              margin: 0,
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {submissionResult.compilerOutput}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* LINE-BY-LINE DEBUGGER TAB */}
              {activeBottomTab === 'debugger' && (() => {
                const codeLines = code.split('\n');
                const totalLines = codeLines.length;
                const displayedDiagnostics = activeDiagnostics.filter(d => {
                  if (debuggerFilter === 'errors') return d.type === 'error';
                  if (debuggerFilter === 'warnings') return d.type === 'warning';
                  return true;
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Debugger Header / Status Bar */}
                    <div style={{
                      backgroundColor: '#222222',
                      border: `1px solid ${lcBorder}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      {/* Status Summary */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {allCurrentErrors.length > 0 ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: `${lcRed}20`,
                            border: `1px solid ${lcRed}55`,
                            borderRadius: '6px',
                            padding: '5px 12px'
                          }}>
                            <AlertCircle size={15} color={lcRed} />
                            <span style={{ color: lcRed, fontWeight: 700, fontSize: '13px' }}>
                              {allCurrentErrors.length} Syntax Error{allCurrentErrors.length > 1 ? 's' : ''} on {errorLinesSet.size} line{errorLinesSet.size > 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : allCurrentWarnings.length > 0 ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: `${lcYellow}20`,
                            border: `1px solid ${lcYellow}55`,
                            borderRadius: '6px',
                            padding: '5px 12px'
                          }}>
                            <AlertTriangle size={15} color={lcYellow} />
                            <span style={{ color: lcYellow, fontWeight: 700, fontSize: '13px' }}>
                              {allCurrentWarnings.length} Warning{allCurrentWarnings.length > 1 ? 's' : ''} on {warningLinesSet.size} line{warningLinesSet.size > 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: lcGreenBg,
                            border: `1px solid ${lcGreen}44`,
                            borderRadius: '6px',
                            padding: '5px 12px'
                          }}>
                            <CheckCircle2 size={15} color={lcGreen} />
                            <span style={{ color: lcGreen, fontWeight: 700, fontSize: '13px' }}>
                              All {totalLines} lines verified clean for {currentLangObj.name}
                            </span>
                          </div>
                        )}

                        <span style={{ fontSize: '12px', color: lcTextMuted }}>
                          Language: <strong style={{ color: lcTextSecondary }}>{currentLangObj.name}</strong> · Total: <strong style={{ color: lcTextSecondary }}>{totalLines} lines</strong>
                        </span>
                      </div>

                      {/* Filter Pills + Run Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          display: 'flex',
                          backgroundColor: '#181818',
                          borderRadius: '6px',
                          padding: '2px',
                          border: `1px solid ${lcBorder}`
                        }}>
                          {[
                            { id: 'all', label: `Issues (${activeDiagnostics.length})` },
                            { id: 'errors', label: `Errors (${allCurrentErrors.length})` },
                            { id: 'warnings', label: `Warnings (${allCurrentWarnings.length})` },
                            { id: 'full', label: `Full Code Walkthrough` }
                          ].map(filter => (
                            <button
                              key={filter.id}
                              onClick={() => setDebuggerFilter(filter.id)}
                              style={{
                                backgroundColor: debuggerFilter === filter.id ? lcSurfaceLight : 'transparent',
                                color: debuggerFilter === filter.id ? lcTextPrimary : lcTextMuted,
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: debuggerFilter === filter.id ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleRunCode}
                          disabled={isRunning}
                          style={{
                            backgroundColor: 'transparent',
                            border: `1px solid ${lcBorder}`,
                            color: lcTextPrimary,
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Play size={12} fill={lcTextPrimary} />
                          {isRunning ? 'Analyzing...' : 'Re-Run & Debug'}
                        </button>
                      </div>
                    </div>

                    {/* MODE 1: FULL CODE WALKTHROUGH (Line-by-line inspection) */}
                    {debuggerFilter === 'full' ? (
                      <div style={{
                        backgroundColor: '#1E1E1E',
                        border: `1px solid ${lcBorder}`,
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '8px 14px',
                          backgroundColor: '#282828',
                          borderBottom: `1px solid ${lcBorder}`,
                          fontSize: '12px',
                          color: lcTextSecondary,
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontWeight: 500
                        }}>
                          <span>Line-by-Line Code Inspection ({totalLines} lines scanned)</span>
                          <span style={{ color: lcTextMuted }}>Click any line to jump to it in the editor</span>
                        </div>

                        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                          {codeLines.map((lineText, idx) => {
                            const lineNum = idx + 1;
                            const hasError = errorLinesSet.has(lineNum);
                            const hasWarning = warningLinesSet.has(lineNum);
                            const lineDiag = activeDiagnostics.filter(d => d.line === lineNum);

                            return (
                              <div
                                key={lineNum}
                                onClick={() => jumpToLine(lineNum)}
                                style={{
                                  borderBottom: '1px solid #2a2a2a',
                                  backgroundColor: hasError ? '#341515' : hasWarning ? '#2e2511' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={e => {
                                  if (!hasError && !hasWarning) e.currentTarget.style.backgroundColor = '#252525';
                                }}
                                onMouseLeave={e => {
                                  if (!hasError && !hasWarning) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {/* Code Row */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'stretch',
                                  minHeight: '26px'
                                }}>
                                  {/* Line Gutter */}
                                  <div style={{
                                    width: '56px',
                                    flexShrink: 0,
                                    padding: '4px 8px',
                                    backgroundColor: hasError ? `${lcRed}33` : hasWarning ? `${lcYellow}33` : '#181818',
                                    borderRight: `1px solid ${hasError ? lcRed : hasWarning ? lcYellow : lcBorder}`,
                                    color: hasError ? lcRed : hasWarning ? lcYellow : lcTextMuted,
                                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    userSelect: 'none'
                                  }}>
                                    <span>{lineNum}</span>
                                    {hasError && <span style={{ color: lcRed, fontWeight: 800 }}>!</span>}
                                    {hasWarning && !hasError && <span style={{ color: lcYellow, fontWeight: 800 }}>▲</span>}
                                  </div>

                                  {/* Line Text */}
                                  <div style={{
                                    padding: '4px 12px',
                                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                    fontSize: '13px',
                                    color: hasError ? '#FFA0A0' : hasWarning ? '#FFE599' : lcTextPrimary,
                                    whiteSpace: 'pre',
                                    flex: 1,
                                    overflowX: 'auto'
                                  }}>
                                    {lineText || ' '}
                                  </div>
                                </div>

                                {/* In-line Diagnostic Explanations */}
                                {lineDiag.map((diag, dIdx) => (
                                  <div
                                    key={dIdx}
                                    style={{
                                      margin: '4px 12px 8px 68px',
                                      padding: '8px 12px',
                                      backgroundColor: diag.type === 'error' ? '#441818' : '#3d3012',
                                      border: `1px solid ${diag.type === 'error' ? lcRed : lcYellow}88`,
                                      borderRadius: '6px',
                                      fontSize: '12px'
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      color: diag.type === 'error' ? lcRed : lcYellow,
                                      fontWeight: 600,
                                      marginBottom: '3px'
                                    }}>
                                      {diag.type === 'error' ? <AlertCircle size={13} /> : <AlertTriangle size={13} />}
                                      <span>{diag.message}</span>
                                    </div>
                                    {diag.suggestion && (
                                      <div style={{ color: '#DDD', marginTop: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>💡 Fix:</span>
                                        <strong style={{ color: '#FFF' }}>{diag.suggestion}</strong>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* MODE 2: FILTERED DIAGNOSTIC CARDS */
                      <div>
                        {displayedDiagnostics.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {displayedDiagnostics.map((diag, idx) => {
                              const isErr = diag.type === 'error';
                              const lineCode = diag.codeLine || codeLines[diag.line - 1] || '';

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    backgroundColor: '#202020',
                                    border: `1px solid ${isErr ? `${lcRed}66` : `${lcYellow}66`}`,
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {/* Card Header */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '8px'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{
                                        backgroundColor: isErr ? `${lcRed}22` : `${lcYellow}22`,
                                        color: isErr ? lcRed : lcYellow,
                                        border: `1px solid ${isErr ? lcRed : lcYellow}66`,
                                        borderRadius: '4px',
                                        padding: '2px 8px',
                                        fontSize: '11px',
                                        fontWeight: 700
                                      }}>
                                        {isErr ? 'SYNTAX ERROR' : 'WARNING'}
                                      </span>

                                      <button
                                        onClick={() => jumpToLine(diag.line)}
                                        style={{
                                          background: '#303030',
                                          border: `1px solid ${lcBorder}`,
                                          color: lcTextPrimary,
                                          borderRadius: '4px',
                                          padding: '2px 8px',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="Click to jump to line in editor"
                                      >
                                        Line {diag.line}
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => jumpToLine(diag.line)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: lcTextSecondary,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.color = lcTextPrimary}
                                      onMouseLeave={e => e.currentTarget.style.color = lcTextSecondary}
                                    >
                                      Jump to Line {diag.line} →
                                    </button>
                                  </div>

                                  {/* Code Snippet Box */}
                                  <div style={{
                                    backgroundColor: '#151515',
                                    border: '1px solid #282828',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    marginBottom: '10px',
                                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    overflowX: 'auto'
                                  }}>
                                    <span style={{ color: lcTextMuted, userSelect: 'none', fontSize: '11px', flexShrink: 0 }}>
                                      L{diag.line}
                                    </span>
                                    <span style={{
                                      color: isErr ? '#FF7A7A' : '#FFE58F',
                                      whiteSpace: 'pre',
                                      textDecoration: isErr ? 'underline wavy #E53E3E' : 'none'
                                    }}>
                                      {lineCode || '<empty line>'}
                                    </span>
                                  </div>

                                  {/* Message */}
                                  <div style={{
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: isErr ? lcRed : lcYellow,
                                    marginBottom: '6px',
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '6px'
                                  }}>
                                    {isErr ? <AlertCircle size={14} style={{ flexShrink: 0 }} /> : <AlertTriangle size={14} style={{ flexShrink: 0 }} />}
                                    <span>{diag.message}</span>
                                  </div>

                                  {/* Actionable Suggestion */}
                                  {diag.suggestion && (
                                    <div style={{
                                      backgroundColor: '#282828',
                                      borderLeft: `3px solid ${isErr ? lcRed : lcYellow}`,
                                      borderRadius: '0 6px 6px 0',
                                      padding: '7px 12px',
                                      fontSize: '12px',
                                      color: lcTextSecondary,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}>
                                      <span style={{ color: lcYellow, fontWeight: 600 }}>💡 Suggestion:</span>
                                      <span style={{ color: lcTextPrimary }}>{diag.suggestion}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Zero issues state */
                          <div style={{
                            textAlign: 'center',
                            padding: '36px 20px',
                            backgroundColor: '#1E1E1E',
                            borderRadius: '8px',
                            border: `1px solid ${lcBorder}`
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              backgroundColor: lcGreenBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 14px auto'
                            }}>
                              <CheckCircle2 size={26} color={lcGreen} />
                            </div>
                            <h4 style={{ color: lcTextPrimary, fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0' }}>
                              No Syntax or Compilation Issues Found
                            </h4>
                            <p style={{ color: lcTextSecondary, fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                              All {totalLines} lines passed syntax validation for {currentLangObj.name}.
                              Statement terminators, block closures, and language grammar verified cleanly.
                            </p>
                            <button
                              onClick={handleRunCode}
                              disabled={isRunning}
                              style={{
                                backgroundColor: lcSurfaceLight,
                                border: `1px solid ${lcBorder}`,
                                color: lcTextPrimary,
                                fontSize: '13px',
                                fontWeight: 500,
                                padding: '6px 18px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Play size={13} />
                              Run Against Test Cases
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* AI HINTS & FEEDBACK TAB */}
              {activeBottomTab === 'ai-hints' && (
                <div style={{ padding: '4px 0' }}>
                  {isLoadingAiFeedback ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        marginBottom: '12px'
                      }}>
                        <Sparkles size={22} color="#C084FC" />
                      </div>
                      <h4 style={{ color: lcTextPrimary, fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0' }}>
                        Analyzing Solution with AI Coding Mentor...
                      </h4>
                      <p style={{ color: lcTextSecondary, fontSize: '13px', margin: 0 }}>
                        Reviewing syntax, execution state, and formulating progressive hints.
                      </p>
                    </div>
                  ) : aiFeedbackError ? (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#2D1F1F',
                      border: `1px solid ${lcRed}55`,
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <AlertTriangle size={24} color={lcRed} style={{ marginBottom: '8px' }} />
                      <div style={{ color: lcRed, fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                        Failed to Retrieve AI Feedback
                      </div>
                      <div style={{ color: lcTextSecondary, fontSize: '12px', marginBottom: '14px' }}>
                        {aiFeedbackError}
                      </div>
                      <button
                        onClick={() => handleRequestAiFeedback(aiHintLevel)}
                        style={{
                          backgroundColor: lcSurfaceLight,
                          border: `1px solid ${lcBorder}`,
                          color: lcTextPrimary,
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Retry AI Analysis
                      </button>
                    </div>
                  ) : aiFeedback ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Top Summary Bar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        paddingBottom: '10px',
                        borderBottom: `1px solid ${lcBorder}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: aiFeedback.is_verified_execution ? 'rgba(44, 187, 93, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            border: `1px solid ${aiFeedback.is_verified_execution ? 'rgba(44, 187, 93, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                            borderRadius: '12px',
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: aiFeedback.is_verified_execution ? lcGreen : '#60A5FA'
                          }}>
                            <Zap size={11} />
                            {aiFeedback.is_verified_execution ? 'Verified with Execution Engine' : 'Algorithmic Review'}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: aiTutorStyles.badgeBg,
                            border: `1px solid ${aiTutorStyles.badgeBorder}`,
                            borderRadius: '12px',
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: aiTutorStyles.badgeColor
                          }}>
                            {aiTutorStyles.status === 'CORRECT' ? (
                              <CheckCircle2 size={11} color={lcGreen} />
                            ) : aiTutorStyles.status === 'INCORRECT' ? (
                              <AlertCircle size={11} color={lcRed} />
                            ) : (
                              <Lightbulb size={11} color={lcTextSecondary} />
                            )}
                            {aiTutorStyles.badgeText}
                          </div>
                          <span style={{ fontSize: '12px', color: lcTextMuted }}>
                            Current Hint: <strong style={{ color: lcTextPrimary }}>Level {aiHintLevel}</strong>
                          </span>
                        </div>

                        {/* Progressive Hint Switcher */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleRequestAiFeedback(1)}
                            disabled={isLoadingAiFeedback}
                            style={{
                              backgroundColor: aiHintLevel === 1 ? 'rgba(168, 85, 247, 0.25)' : lcSurfaceLight,
                              border: `1px solid ${aiHintLevel === 1 ? '#A855F7' : lcBorder}`,
                              color: aiHintLevel === 1 ? '#E9D5FF' : lcTextSecondary,
                              borderRadius: '6px',
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Level 1: Concept
                          </button>
                          <button
                            onClick={() => handleRequestAiFeedback(2)}
                            disabled={isLoadingAiFeedback}
                            style={{
                              backgroundColor: aiHintLevel === 2 ? 'rgba(168, 85, 247, 0.25)' : lcSurfaceLight,
                              border: `1px solid ${aiHintLevel === 2 ? '#A855F7' : lcBorder}`,
                              color: aiHintLevel === 2 ? '#E9D5FF' : lcTextSecondary,
                              borderRadius: '6px',
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Level 2: Structure
                          </button>
                        </div>
                      </div>

                      {/* Status Notice if code modified since run */}
                      {isCodeModifiedSinceRun && (
                        <div style={{
                          backgroundColor: 'rgba(255, 192, 30, 0.08)',
                          border: '1px solid rgba(255, 192, 30, 0.3)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#FFD768'
                        }}>
                          <Lightbulb size={13} color="#FFC01E" />
                          <span>Code has been edited since last execution. Run or submit your code to verify updated results.</span>
                        </div>
                      )}

                      {/* Primary Diagnosis Card: What Went Right / What Went Wrong / Awaiting Execution Result */}
                      <div style={{
                        backgroundColor: aiTutorStyles.primaryBg,
                        border: aiTutorStyles.primaryBorder,
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          {aiTutorStyles.primaryIcon}
                          <span style={{ fontSize: '12px', fontWeight: 700, color: aiTutorStyles.primaryHeaderColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {aiTutorStyles.primaryHeading}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: aiTutorStyles.primaryTextColor, lineHeight: 1.6 }}>
                          {aiFeedback.what_went_wrong}
                        </div>
                      </div>

                      {/* Root Cause & Explanation: Green/neutral for correct code, Red for actual failure, Neutral when unknown */}
                      <div style={{
                        backgroundColor: aiTutorStyles.rootCauseBg,
                        border: aiTutorStyles.rootCauseBorder,
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          {aiTutorStyles.rootCauseIcon}
                          <span style={{ fontSize: '12px', fontWeight: 700, color: aiTutorStyles.rootCauseHeaderColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {aiTutorStyles.rootCauseHeading}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: lcTextPrimary, lineHeight: 1.6 }}>
                          {aiFeedback.why_it_went_wrong}
                        </div>
                      </div>

                      {/* Progressive Hint (Retains Purple Styling) */}
                      <div style={{
                        backgroundColor: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Sparkles size={15} color="#C084FC" />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#D8B4FE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Progressive Hint (Level {aiHintLevel})
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#F3E8FF', lineHeight: 1.6 }}>
                          {aiFeedback.progressive_hint}
                        </div>
                      </div>

                      {/* Recommended Approach (Retains Blue Styling) */}
                      <div style={{
                        backgroundColor: '#1E2530',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <ChevronRight size={15} color="#60A5FA" />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Algorithmic Approach
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: lcTextPrimary, lineHeight: 1.6 }}>
                          {aiFeedback.approach_guidance}
                        </div>
                      </div>

                      {/* Test Case Analysis (Green for All Passed, Red for Failing, Neutral for Test Case Analysis) */}
                      {aiFeedback.test_case_analysis && (
                        <div style={{
                          backgroundColor: aiTutorStyles.testCaseBg,
                          border: aiTutorStyles.testCaseBorder,
                          borderRadius: '8px',
                          padding: '12px 14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            {aiTutorStyles.testCaseIcon}
                            <span style={{ fontSize: '12px', fontWeight: 700, color: aiTutorStyles.testCaseHeaderColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {aiTutorStyles.testCaseHeading}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: aiTutorStyles.status === 'CORRECT' ? lcTextPrimary : lcTextSecondary, lineHeight: 1.6 }}>
                            {aiFeedback.test_case_analysis}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px auto'
                      }}>
                        <Sparkles size={22} color="#C084FC" />
                      </div>
                      <h4 style={{ color: lcTextPrimary, fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0' }}>
                        Intelligent AI Coding Mentor
                      </h4>
                      <p style={{ color: lcTextSecondary, fontSize: '13px', maxWidth: '440px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                        Need guidance without giving away the full code? Request root-cause diagnosis, conceptual nudges, and step-by-step logic.
                      </p>
                      <button
                        onClick={() => handleRequestAiFeedback(1)}
                        disabled={isLoadingAiFeedback}
                        style={{
                          backgroundColor: '#8B5CF6',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: 600,
                          padding: '7px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Sparkles size={14} />
                        Analyze Solution with AI Tutor
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  if (embedded || isFullscreen) {
    return workspaceBody;
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        padding: '16px',
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ width: '96vw', maxWidth: '1600px', height: '94vh', display: 'flex' }}>
        {workspaceBody}
      </div>
    </div>
  );
}
