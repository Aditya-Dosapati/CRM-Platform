import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  Save,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Code2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Cpu,
  FileCode,
  Share2,
  Check,
  Smartphone
} from 'lucide-react';
import { supportedLanguagesList } from '../../data/codingData.js';
import codeExecutionService from '../../services/codeExecutionService.js';

export default function CodingWorkspaceModal({
  isOpen,
  onClose,
  problem,
  onProblemSolved,
  activeRole = 'student',
  isAssessmentMode = false,
  assessmentTimer = null
}) {
  if (!isOpen || !problem) return null;

  // Editor State
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [fontSize, setFontSize] = useState(14);
  const [editorTheme, setEditorTheme] = useState('vs-dark'); // 'vs-dark' | 'dracula' | 'one-dark'
  const [code, setCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('Saved just now');

  // Execution & Tabs State
  const [activeBottomTab, setActiveBottomTab] = useState('testcases'); // 'testcases' | 'custom' | 'submission'
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sampleResults, setSampleResults] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);

  // Progressive Hints State
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolutionDiscussion, setShowSolutionDiscussion] = useState(false);

  // AI Assistant in IDE State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const textareaRef = useRef(null);

  // Load starter code or saved draft on mount or language change
  useEffect(() => {
    const draft = codeExecutionService.getDraft(problem.id, selectedLanguage);
    if (draft && draft.code) {
      setCode(draft.code);
      setLastSavedText('Restored from draft');
    } else if (problem.starterCode && problem.starterCode[selectedLanguage]) {
      setCode(problem.starterCode[selectedLanguage]);
      setLastSavedText('Initial template loaded');
    } else {
      const langConfig = supportedLanguagesList.find(l => l.id === selectedLanguage);
      setCode(langConfig?.defaultCode || '// Write your code here\n');
      setLastSavedText('Ready');
    }
    setSampleResults(null);
    setSubmissionResult(null);
    setCustomOutput(null);
  }, [problem.id, selectedLanguage]);

  // Periodic autosave simulation
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => {
      codeExecutionService.saveDraft(problem.id, selectedLanguage, code);
      setLastSavedText('Saved just now');
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
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Run Code against visible sample cases
  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveBottomTab('testcases');
    const result = await codeExecutionService.runCode(problem.id, selectedLanguage, code);
    setSampleResults(result);
    setIsRunning(false);
  };

  // Submit Code against hidden test cases
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setActiveBottomTab('submission');
    const result = await codeExecutionService.submitCode(problem.id, selectedLanguage, code);
    setSubmissionResult(result);
    setIsSubmitting(false);

    if (result.status === 'Accepted') {
      setShowSolutionDiscussion(true);
      if (onProblemSolved) {
        onProblemSolved(problem.id);
      }
    }
  };

  // Run with Custom Input
  const handleRunCustom = async () => {
    setIsRunning(true);
    setActiveBottomTab('custom');
    const result = await codeExecutionService.runCustomInput(selectedLanguage, code, customInput);
    setCustomOutput(result);
    setIsRunning(false);
  };

  // Reset to original starter code
  const handleResetCode = () => {
    if (confirm("Reset code to original problem template? Your unsaved edits will be cleared.")) {
      const template = problem.starterCode?.[selectedLanguage] || '// Solution\n';
      setCode(template);
      codeExecutionService.saveDraft(problem.id, selectedLanguage, template);
      setLastSavedText('Reset to template');
    }
  };

  // Trigger GMRIT AI Assistance inside coding environment
  const handleAiAction = (actionType) => {
    if (isAssessmentMode) {
      alert("GMRIT AI Assistance is disabled during active assessments in compliance with examination security policy.");
      return;
    }

    setIsAiThinking(true);
    setAiAnalysis(null);

    setTimeout(() => {
      let analysisText = "";
      if (actionType === 'explain') {
        analysisText = `### Problem Analysis: ${problem.title}\n\nThe goal is to find elements or structures satisfying the given constraints. Notice the input boundaries: \`${problem.constraints?.[0] || 'N <= 10^4'}\`. A linear or logarithmic approach is required to pass within the 2.0s sandbox limit.`;
      } else if (actionType === 'hint') {
        analysisText = `### Algorithmic Hint\n\nConsider utilizing a secondary lookup structure (e.g., Hash Map or Two Pointers). If you index elements during iteration, search overhead reduces from O(n) to O(1).`;
      } else if (actionType === 'complexity') {
        analysisText = `### Complexity Evaluation\n\n- **Target Runtime**: O(n) or O(log n)\n- **Space Limit**: O(n) auxiliary memory permitted in GMRIT container.\n- **Current Solution Vector**: Using a single traversal avoids redundant pairwise combinations.`;
      } else if (actionType === 'debug') {
        analysisText = `### Diagnostic Check\n\nYour code structure appears logically sound. Verify edge conditions: zero elements, negative indices, and boundary values near 10^9.`;
      }
      setAiAnalysis({ action: actionType, text: analysisText });
      setIsAiThinking(false);
    }, 550);
  };

  const currentLangObj = supportedLanguagesList.find(l => l.id === selectedLanguage) || supportedLanguagesList[0];

  const difficultyColor =
    problem.difficulty === 'Easy' ? '#059669' :
    problem.difficulty === 'Medium' ? '#EA580C' : '#DC2626';

  const difficultyBg =
    problem.difficulty === 'Easy' ? 'var(--pastel-green-bg)' :
    problem.difficulty === 'Medium' ? 'var(--pastel-orange-bg)' : '#FFF1F2';

  const difficultyBorder =
    problem.difficulty === 'Easy' ? 'var(--pastel-green-border)' :
    problem.difficulty === 'Medium' ? 'var(--pastel-orange-border)' : '#FECDD3';

  // Line numbers calculation
  const lineCount = Math.max(code.split('\n').length, 18);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div
      className="modal-overlay"
      style={{
        padding: isFullscreen ? 0 : '16px',
        backdropFilter: 'blur(4px)',
        background: 'rgba(15, 23, 42, 0.65)',
        zIndex: 1000
      }}
    >
      <div
        style={{
          width: isFullscreen ? '100vw' : '96vw',
          height: isFullscreen ? '100vh' : '94vh',
          maxWidth: isFullscreen ? '100vw' : '1720px',
          backgroundColor: '#FFFFFF',
          borderRadius: isFullscreen ? 0 : 'var(--radius-xl)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: isFullscreen ? 'none' : '1px solid var(--border-light)',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        {/* Mobile Responsive Notice */}
        <div style={{
          display: 'none',
          padding: '8px 12px',
          backgroundColor: '#FFFBEB',
          borderBottom: '1px solid #FDE68A',
          color: '#B45309',
          fontSize: '12px',
          alignItems: 'center',
          gap: '8px'
        }} className="mobile-only-warning">
          <Smartphone size={14} />
          <span><strong>Notice:</strong> The full IDE workspace is best experienced on a desktop or laptop display.</span>
        </div>

        {/* Top Header Bar */}
        <div style={{
          padding: '10px 18px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Left: Problem Title & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={20} color="var(--primary-blue)" />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {problem.title}
              </h2>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: difficultyBg,
              color: difficultyColor,
              border: `1px solid ${difficultyBorder}`
            }}>
              {problem.difficulty}
            </span>

            <span className="badge badge-blue" style={{ fontSize: '10.5px', padding: '2px 7px' }}>
              {problem.topic}
            </span>

            {isAssessmentMode && assessmentTimer && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                backgroundColor: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: '12px',
                color: '#E11D48',
                fontWeight: 800,
                fontSize: '12px'
              }}>
                <Clock size={13} />
                <span>Timer: {assessmentTimer}</span>
              </div>
            )}
          </div>

          {/* Right: Controls (Font, Theme, Reset, Save, Fullscreen, Close) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {lastSavedText}
            </span>

            <button
              onClick={() => {
                codeExecutionService.saveDraft(problem.id, selectedLanguage, code);
                setLastSavedText('Saved just now');
              }}
              className="btn btn-secondary btn-sm"
              title="Save draft"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              <Save size={12} />
              <span>Save Draft</span>
            </button>

            <button
              onClick={handleResetCode}
              className="btn btn-secondary btn-sm"
              title="Reset to starter template"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn btn-secondary btn-sm"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Workspace"}
              style={{ padding: '5px' }}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              title="Close Workspace"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Split-Pane Workspace */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* ================= LEFT PANE: PROBLEM STATEMENT & HINTS ================= */}
          <div style={{
            width: '44%',
            borderRight: '1px solid var(--border-light)',
            overflowY: 'auto',
            padding: '24px 22px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Description */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Problem Statement
              </h3>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {problem.description}
              </div>
            </div>

            {/* Examples */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Examples
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {problem.examples?.map((ex, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12.5px'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Example {idx + 1}:
                    </div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Input:</span> <code style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>{ex.input}</code></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Output:</span> <code style={{ color: '#059669', fontWeight: 600 }}>{ex.output}</code></div>
                    {ex.explanation && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Explanation: {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Constraints
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {problem.constraints?.map((c, i) => (
                  <li key={i}><code style={{ backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>{c}</code></li>
                ))}
                <li>Runtime Limit: <code style={{ backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>{problem.timeLimit || '2.0s'}</code></li>
                <li>Memory Limit: <code style={{ backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>{problem.memoryLimit || '128 MB'}</code></li>
              </ul>
            </div>

            {/* Progressive Hints Section (Disabled in Assessment Mode) */}
            {!isAssessmentMode && (
              <div style={{
                padding: '14px',
                backgroundColor: 'var(--pastel-blue-bg)',
                border: '1px solid var(--pastel-blue-border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={16} color="var(--primary-blue)" />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--pastel-blue-text)' }}>
                      Progressive Hints
                    </span>
                  </div>
                  {revealedHints < (problem.hints?.length || 0) && (
                    <button
                      onClick={() => setRevealedHints(prev => prev + 1)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      Reveal Hint {revealedHints + 1}
                    </button>
                  )}
                </div>

                {revealedHints === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    Need help? Reveal a small hint without spoiling the full solution.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    {problem.hints?.slice(0, revealedHints).map((h, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: '#1E40AF', lineHeight: 1.4, padding: '6px 8px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--pastel-blue-border)' }}>
                        {h}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GMRIT AI Assistant in IDE (Disabled in Assessment Mode) */}
            {!isAssessmentMode && (
              <div style={{
                padding: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="var(--primary-blue)" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    GMRIT AI Coding Tutor
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  <button onClick={() => handleAiAction('explain')} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    Explain Problem
                  </button>
                  <button onClick={() => handleAiAction('hint')} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    Give Algorithmic Hint
                  </button>
                  <button onClick={() => handleAiAction('complexity')} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    Analyze Complexity
                  </button>
                  <button onClick={() => handleAiAction('debug')} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    Diagnostic Check
                  </button>
                </div>

                {isAiThinking && (
                  <div style={{ fontSize: '12px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} className="spin-animation" />
                    <span>Analyzing code with GMRIT Academic Knowledge Base...</span>
                  </div>
                )}

                {aiAnalysis && !isAiThinking && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ whiteSpace: 'pre-line' }}>{aiAnalysis.text}</div>
                  </div>
                )}
              </div>
            )}

            {/* Solution Complexity Discussion */}
            {showSolutionDiscussion && problem.solutionAnalysis && (
              <div style={{
                padding: '14px',
                backgroundColor: 'var(--pastel-green-bg)',
                border: '1px solid var(--pastel-green-border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <CheckCircle2 size={16} color="var(--success)" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--pastel-green-text)' }}>
                    Solution Complexity Comparison
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginTop: '6px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Your Solution:</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{problem.solutionAnalysis.userComplexity}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Optimal Approach:</span>
                    <strong style={{ display: 'block', color: 'var(--success)' }}>{problem.solutionAnalysis.optimalComplexity}</strong>
                  </div>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                  {problem.solutionAnalysis.recommendation}
                </p>
              </div>
            )}
          </div>

          {/* ================= RIGHT PANE: MONACO-STYLE CODE EDITOR ================= */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            backgroundColor: '#1E1E1E'
          }}>
            {/* Editor Sub-Header Toolbar */}
            <div style={{
              padding: '8px 14px',
              backgroundColor: '#18181B',
              borderBottom: '1px solid #27272A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#A1A1AA'
            }}>
              {/* Language Selector with Configurable Runtime Versions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  style={{
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#F4F4F5',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    padding: '4px 10px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {supportedLanguagesList.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name} ({lang.version})
                    </option>
                  ))}
                </select>

                <span style={{ fontSize: '11px', color: '#71717A' }}>
                  {currentLangObj.runtime}
                </span>
              </div>

              {/* Font Size & Editor Theme */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#71717A' }}>Font:</span>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{
                      backgroundColor: '#27272A',
                      border: '1px solid #3F3F46',
                      color: '#D4D4D8',
                      fontSize: '11px',
                      borderRadius: '4px',
                      padding: '2px 6px'
                    }}
                  >
                    <option value={12}>12px</option>
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#71717A' }}>Theme:</span>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    style={{
                      backgroundColor: '#27272A',
                      border: '1px solid #3F3F46',
                      color: '#D4D4D8',
                      fontSize: '11px',
                      borderRadius: '4px',
                      padding: '2px 6px'
                    }}
                  >
                    <option value="vs-dark">VS Dark</option>
                    <option value="dracula">Dracula</option>
                    <option value="one-dark">One Dark</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dark Monaco-Style Code Editor Canvas */}
            <div style={{
              flex: 1,
              display: 'flex',
              minHeight: 0,
              backgroundColor: editorTheme === 'dracula' ? '#282A36' : editorTheme === 'one-dark' ? '#21252B' : '#1E1E1E',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Line Numbers Gutter */}
              <div style={{
                width: '44px',
                padding: '12px 6px',
                textAlign: 'right',
                userSelect: 'none',
                color: '#6B7280',
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                fontSize: `${fontSize}px`,
                lineHeight: 1.6,
                backgroundColor: 'transparent',
                borderRight: '1px solid #2D3748',
                opacity: 0.65
              }}>
                {lineNumbers.map(n => (
                  <div key={n}>{n}</div>
                ))}
              </div>

              {/* Textarea Code Input */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  backgroundColor: 'transparent',
                  color: '#E2E8F0',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.6,
                  whiteSpace: 'pre',
                  overflowX: 'auto',
                  overflowY: 'auto'
                }}
              />
            </div>

            {/* ================= BOTTOM PANE: TEST RESULTS & EXECUTION CONSOLE ================= */}
            <div style={{
              height: '240px',
              borderTop: '1px solid #27272A',
              backgroundColor: '#18181B',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}>
              {/* Console Tabs & Actions */}
              <div style={{
                padding: '6px 14px',
                backgroundColor: '#121214',
                borderBottom: '1px solid #27272A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setActiveBottomTab('testcases')}
                    style={{
                      backgroundColor: activeBottomTab === 'testcases' ? '#27272A' : 'transparent',
                      color: activeBottomTab === 'testcases' ? '#F4F4F5' : '#A1A1AA',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Test Cases ({problem.sampleTestCases?.length || 2})
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('custom')}
                    style={{
                      backgroundColor: activeBottomTab === 'custom' ? '#27272A' : 'transparent',
                      color: activeBottomTab === 'custom' ? '#F4F4F5' : '#A1A1AA',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Custom Input
                  </button>

                  {submissionResult && (
                    <button
                      onClick={() => setActiveBottomTab('submission')}
                      style={{
                        backgroundColor: activeBottomTab === 'submission' ? '#27272A' : 'transparent',
                        color: submissionResult.status === 'Accepted' ? '#10B981' : '#EF4444',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Submission Result: {submissionResult.status}
                    </button>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    className="btn btn-secondary btn-sm"
                    style={{ backgroundColor: '#27272A', border: '1px solid #3F3F46', color: '#F4F4F5', fontSize: '12px', padding: '5px 12px' }}
                  >
                    <Play size={13} fill="#F4F4F5" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    onClick={handleSubmitCode}
                    disabled={isRunning || isSubmitting}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '12px', padding: '5px 14px' }}
                  >
                    <Send size={13} />
                    <span>{isSubmitting ? 'Evaluating...' : 'Submit Code'}</span>
                  </button>
                </div>
              </div>

              {/* Console Body */}
              <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', fontSize: '12px', color: '#D4D4D8' }}>
                {/* TAB 1: Test Cases */}
                {activeBottomTab === 'testcases' && (
                  <div>
                    {/* Case selectors */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {problem.sampleTestCases?.map((tc, idx) => {
                        const runResult = sampleResults?.testResults?.[idx];
                        return (
                          <button
                            key={tc.id}
                            onClick={() => setActiveTestCaseIdx(idx)}
                            style={{
                              backgroundColor: activeTestCaseIdx === idx ? '#3F3F46' : '#27272A',
                              color: runResult ? (runResult.passed ? '#10B981' : '#EF4444') : '#D4D4D8',
                              border: '1px solid #3F3F46',
                              borderRadius: '4px',
                              padding: '3px 10px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            {runResult ? (runResult.passed ? <Check size={11} /> : <X size={11} />) : null}
                            <span>Case {idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active case content */}
                    {problem.sampleTestCases?.[activeTestCaseIdx] && (
                      <div style={{ backgroundColor: '#27272A', padding: '10px 12px', borderRadius: '6px', fontFamily: 'monospace' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#A1A1AA' }}>Input:</span>
                          <div style={{ color: '#93C5FD', marginTop: '2px' }}>
                            {problem.sampleTestCases[activeTestCaseIdx].input}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#A1A1AA' }}>Expected Output:</span>
                          <div style={{ color: '#86EFAC', marginTop: '2px' }}>
                            {problem.sampleTestCases[activeTestCaseIdx].expected}
                          </div>
                        </div>

                        {sampleResults?.testResults?.[activeTestCaseIdx] && (
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #3F3F46' }}>
                            <span style={{ color: '#A1A1AA' }}>Sandbox Execution Output:</span>
                            <div style={{ color: sampleResults.testResults[activeTestCaseIdx].passed ? '#86EFAC' : '#FCA5A5', marginTop: '2px' }}>
                              {sampleResults.testResults[activeTestCaseIdx].actual}
                            </div>
                            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>
                              Runtime: {sampleResults.testResults[activeTestCaseIdx].runtimeMs} • Memory: {sampleResults.testResults[activeTestCaseIdx].memoryMB}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {sampleResults?.compilerOutput && (
                      <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#3B0764', border: '1px solid #581C87', borderRadius: '4px', color: '#F472B6', fontFamily: 'monospace' }}>
                        {sampleResults.compilerOutput}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Custom Input */}
                {activeBottomTab === 'custom' && (
                  <div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter your custom input parameters (e.g. nums = [1,2,3], target = 4)"
                        style={{
                          flex: 1,
                          height: '70px',
                          backgroundColor: '#27272A',
                          border: '1px solid #3F3F46',
                          borderRadius: '4px',
                          color: '#F4F4F5',
                          padding: '8px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          resize: 'none'
                        }}
                      />
                      <button
                        onClick={handleRunCustom}
                        disabled={isRunning}
                        className="btn btn-secondary btn-sm"
                        style={{ alignSelf: 'flex-start', backgroundColor: '#27272A', color: '#F4F4F5', border: '1px solid #3F3F46' }}
                      >
                        Run Custom Input
                      </button>
                    </div>

                    {customOutput && (
                      <div style={{ padding: '8px 10px', backgroundColor: '#27272A', borderRadius: '4px', fontFamily: 'monospace' }}>
                        <div style={{ color: '#86EFAC' }}>{customOutput.stdout}</div>
                        <div style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>
                          Execution: {customOutput.runtimeMs} • Memory: {customOutput.memoryMB}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Submission Result */}
                {activeBottomTab === 'submission' && submissionResult && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      {submissionResult.status === 'Accepted' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={22} color="#10B981" />
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>Accepted 🎉</div>
                            <div style={{ fontSize: '11.5px', color: '#A1A1AA' }}>All {submissionResult.passedCount} / {submissionResult.totalCount} test cases passed.</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertCircle size={22} color="#EF4444" />
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444' }}>{submissionResult.status}</div>
                            <div style={{ fontSize: '11.5px', color: '#A1A1AA' }}>Passed {submissionResult.passedCount} / {submissionResult.totalCount} test cases.</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#27272A', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#71717A' }}>Runtime:</span>
                        <strong style={{ color: '#F4F4F5', marginLeft: '6px' }}>{submissionResult.runtimeMs}</strong>
                        {submissionResult.runtimePercentile && (
                          <span style={{ color: '#10B981', fontSize: '11px', marginLeft: '6px' }}>(Beats {submissionResult.runtimePercentile})</span>
                        )}
                      </div>
                      <div>
                        <span style={{ color: '#71717A' }}>Memory:</span>
                        <strong style={{ color: '#F4F4F5', marginLeft: '6px' }}>{submissionResult.memoryMB}</strong>
                        {submissionResult.memoryPercentile && (
                          <span style={{ color: '#10B981', fontSize: '11px', marginLeft: '6px' }}>(Beats {submissionResult.memoryPercentile})</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
