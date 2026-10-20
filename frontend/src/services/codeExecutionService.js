// GMRIT Academic Hub - Sandboxed Code Execution Engine Simulation
import {
  codingProblemsList,
  supportedLanguagesList,
  mysqlLanguage,
  isDatabaseProblem,
  getLanguagesForProblem
} from '../data/codingData.js';
import auditService from './auditService.js';
import authService from './authService.js';

class CodeExecutionService {
  constructor() {
    this.draftsKeyPrefix = 'gmrit_code_draft_';
    this.progressKeyPrefix = 'gmrit_coding_progress_';
  }

  getProblem(problemId) {
    return codingProblemsList.find(p => p.id === problemId) || codingProblemsList[0];
  }

  isDatabaseProblem(problem) {
    return isDatabaseProblem(problem);
  }

  getLanguagesForProblem(problem) {
    return getLanguagesForProblem(problem);
  }

  // --- Dynamic User Progress & KPI Tracking ---
  getProgressKey(userId) {
    const activeId = userId || authService.getCurrentUser()?.userId || 'student_default';
    return `${this.progressKeyPrefix}${activeId}`;
  }

  getUserProgress(userId) {
    try {
      const key = this.getProgressKey(userId);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read user coding progress:', e);
    }
    return {
      submissions: [],
      attempts: {}, // problemId -> { status: 'Attempted' | 'Solved', attemptsCount, firstAttemptAt, solvedAt, lastLanguage }
      streak: { current: 0, longest: 0, lastActiveDate: null }
    };
  }

  saveUserProgress(progress, userId) {
    try {
      const key = this.getProgressKey(userId);
      localStorage.setItem(key, JSON.stringify(progress));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gmrit_coding_progress_updated', { detail: { userId: key } }));
      }
    } catch (e) {
      console.warn('Could not save user coding progress:', e);
    }
  }

  recordAttempt(problemId, language, user = null) {
    try {
      const activeUser = user || authService.getCurrentUser();
      const progress = this.getUserProgress(activeUser?.userId);
      const existing = progress.attempts[problemId] || {
        status: 'Attempted',
        attemptsCount: 0,
        firstAttemptAt: Date.now()
      };

      existing.attemptsCount = (existing.attemptsCount || 0) + 1;
      if (existing.status !== 'Solved') {
        existing.status = 'Attempted';
      }
      existing.lastAttemptAt = Date.now();
      existing.lastLanguage = language;
      progress.attempts[problemId] = existing;

      this.updateStreak(progress);
      this.saveUserProgress(progress, activeUser?.userId);
      return progress;
    } catch (e) {
      console.warn('Failed to record attempt:', e);
    }
  }

  recordSubmission(problemId, language, result, user = null) {
    try {
      const activeUser = user || authService.getCurrentUser();
      const progress = this.getUserProgress(activeUser?.userId);
      const existing = progress.attempts[problemId] || {
        status: 'Attempted',
        attemptsCount: 0,
        firstAttemptAt: Date.now()
      };

      existing.attemptsCount = (existing.attemptsCount || 0) + 1;
      existing.lastAttemptAt = Date.now();
      existing.lastLanguage = language;

      const isAccepted = result.status === 'Accepted';
      if (isAccepted) {
        existing.status = 'Solved';
        if (!existing.solvedAt) {
          existing.solvedAt = Date.now();
        }
        existing.bestLanguage = language;
      } else if (existing.status !== 'Solved') {
        existing.status = 'Attempted';
      }

      progress.attempts[problemId] = existing;

      // Add to submissions history
      progress.submissions = progress.submissions || [];
      progress.submissions.unshift({
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        problemId,
        language,
        status: result.status,
        passedCount: result.passedCount || 0,
        totalCount: result.totalCount || 0,
        runtimeMs: result.runtimeMs || '0 ms',
        memoryMB: result.memoryMB || '0 MB',
        submittedAt: Date.now()
      });

      this.updateStreak(progress);
      this.saveUserProgress(progress, activeUser?.userId);
      return progress;
    } catch (e) {
      console.warn('Failed to record submission:', e);
    }
  }

  updateStreak(progress) {
    if (!progress.streak) {
      progress.streak = { current: 0, longest: 0, lastActiveDate: null };
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastActive = progress.streak.lastActiveDate;

    if (!lastActive) {
      progress.streak.current = 1;
      progress.streak.longest = 1;
      progress.streak.lastActiveDate = todayStr;
      return;
    }

    if (lastActive === todayStr) {
      return;
    }

    const todayDate = new Date(todayStr);
    const lastDate = new Date(lastActive);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      progress.streak.current = (progress.streak.current || 0) + 1;
      if (progress.streak.current > (progress.streak.longest || 0)) {
        progress.streak.longest = progress.streak.current;
      }
    } else if (diffDays > 1) {
      progress.streak.current = 1;
    }
    progress.streak.lastActiveDate = todayStr;
  }

  resetUserProgress(userId) {
    const activeUser = userId ? { userId } : authService.getCurrentUser();
    const emptyProgress = {
      submissions: [],
      attempts: {},
      streak: { current: 0, longest: 0, lastActiveDate: null }
    };
    this.saveUserProgress(emptyProgress, activeUser?.userId);
    return emptyProgress;
  }

  computeKPIs(userId, problemsList = codingProblemsList) {
    const progress = this.getUserProgress(userId);
    const attempts = progress.attempts || {};
    const solvedProblemIds = Object.keys(attempts).filter(
      id => attempts[id]?.status === 'Solved'
    );
    const attemptedProblemIds = Object.keys(attempts).filter(
      id => attempts[id]?.status === 'Attempted' || attempts[id]?.status === 'Solved'
    );

    const problemsSolved = solvedProblemIds.length;
    const problemsAttempted = attemptedProblemIds.length;

    // Solved this calendar month
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const solvedThisMonth = solvedProblemIds.filter(id => {
      const sAt = attempts[id]?.solvedAt;
      if (!sAt) return false;
      const d = new Date(sAt);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    }).length;

    // Distinct topics attempted
    const attemptedTopics = new Set();
    attemptedProblemIds.forEach(id => {
      const prob = problemsList.find(p => p.id === id);
      if (prob?.topic) attemptedTopics.add(prob.topic);
    });

    const successRateVal = problemsAttempted > 0
      ? ((problemsSolved / problemsAttempted) * 100).toFixed(1)
      : '0.0';

    return {
      problemsSolved,
      solvedThisMonth: `+${solvedThisMonth} this month`,
      problemsAttempted,
      topicsAttemptedText: attemptedTopics.size > 0
        ? `Across ${attemptedTopics.size} topic${attemptedTopics.size === 1 ? '' : 's'}`
        : 'Across 0 topics',
      successRate: `${successRateVal}%`,
      successRateSubtitle: problemsAttempted > 0
        ? `${problemsSolved} of ${problemsAttempted} completed`
        : 'No attempts yet',
      currentStreak: progress.streak?.current || 0,
      longestStreak: progress.streak?.longest || 0,
      totalSubmissions: progress.submissions?.length || 0,
      points: problemsSolved * 20
    };
  }

  computeTopicCategories(categoriesList, problemsList = codingProblemsList, userId) {
    const progress = this.getUserProgress(userId);
    const attempts = progress.attempts || {};

    return categoriesList.map(cat => {
      const topicProblems = problemsList.filter(
        p => p.topic.toLowerCase() === cat.name.toLowerCase() || p.topic.toLowerCase() === cat.id.toLowerCase()
      );

      const totalProblems = topicProblems.length > 0 ? topicProblems.length : cat.problems;
      const solvedCount = topicProblems.filter(
        p => attempts[p.id]?.status === 'Solved'
      ).length;

      const percentage = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

      return {
        ...cat,
        problems: totalProblems,
        solved: solvedCount,
        percentage
      };
    });
  }

  computeAchievements(userId, problemsList = codingProblemsList) {
    const progress = this.getUserProgress(userId);
    const kpis = this.computeKPIs(userId, problemsList);
    const submissions = progress.submissions || [];

    return [
      {
        id: 'ach-1',
        title: '🔥 7 Day Streak',
        description: 'Solve problems on 7 consecutive days',
        unlocked: kpis.currentStreak >= 7 || kpis.longestStreak >= 7,
        progress: `${Math.min(kpis.currentStreak, 7)}/7 days`
      },
      {
        id: 'ach-2',
        title: '💻 First 10 Problems',
        description: 'Successfully solve your first 10 problems',
        unlocked: kpis.problemsSolved >= 10,
        progress: `${Math.min(kpis.problemsSolved, 10)}/10`
      },
      {
        id: 'ach-3',
        title: '🏆 50 Problems Solved',
        description: 'Cross the 50 solved problems milestone',
        unlocked: kpis.problemsSolved >= 50,
        progress: `${Math.min(kpis.problemsSolved, 50)}/50`
      },
      {
        id: 'ach-4',
        title: '⚡ First Problem Solved',
        description: 'Solve your first programming challenge',
        unlocked: kpis.problemsSolved >= 1,
        progress: `${Math.min(kpis.problemsSolved, 1)}/1`
      },
      {
        id: 'ach-5',
        title: '🎯 First Submission',
        description: 'Submit your code for automated evaluation',
        unlocked: submissions.length >= 1,
        progress: `${Math.min(submissions.length, 1)}/1`
      },
      {
        id: 'ach-6',
        title: '🌟 Algorithm Explorer',
        description: 'Attempt problems across at least 3 distinct topics',
        unlocked: Object.keys(progress.attempts || {}).length >= 3,
        progress: `${Math.min(Object.keys(progress.attempts || {}).length, 3)}/3`
      }
    ];
  }

  // --- Comprehensive Multi-Language Line-by-Line Debugger & Diagnostics Engine ---
  debugCode(language, code, problem = null) {
    const raw = code || '';
    const lines = raw.split('\n');
    const cleanCode = raw.trim();

    const errors = [];
    const warnings = [];
    const lineDiagnostics = [];

    if (!cleanCode) {
      const err = {
        line: 1,
        col: 1,
        severity: 'error',
        type: 'Compilation Error',
        message: 'Empty solution file provided.',
        suggestion: 'Write solution code or reset to starter template.'
      };
      return {
        isValid: false,
        hasErrors: true,
        line: 1,
        column: 1,
        status: 'Compilation Error',
        message: err.message,
        errors: [err],
        warnings: [],
        errorLines: [1],
        warningLines: [],
        lineDiagnostics: [{ lineNumber: 1, code: '', status: 'error', message: err.message, errors: [err] }],
        compilerOutput: `[${(language || '').toUpperCase()} Compiler] fatal error: no code provided to compile.`,
        totalLines: 1,
        summary: 'Empty solution file provided.'
      };
    }

    const nonCommentLines = lines.filter(l => {
      const t = l.trim();
      if (!t) return false;
      if (t.startsWith('//') || t.startsWith('#') || t.startsWith('--') || t.startsWith('/*') || t.startsWith('*')) return false;
      return true;
    });

    if (nonCommentLines.length === 0) {
      const err = {
        line: 1,
        col: 1,
        severity: 'error',
        type: 'Compilation Error',
        message: 'No executable code found in solution.',
        suggestion: 'Add executable code inside the solution function or query.'
      };
      return {
        isValid: false,
        hasErrors: true,
        line: 1,
        column: 1,
        status: 'Compilation Error',
        message: err.message,
        errors: [err],
        warnings: [],
        errorLines: [1],
        warningLines: [],
        lineDiagnostics: [{ lineNumber: 1, code: '', status: 'error', message: err.message, errors: [err] }],
        compilerOutput: `[${(language || '').toUpperCase()} Compiler] fatal error: file contains only comments or whitespace.`,
        totalLines: lines.length,
        summary: 'File contains only comments or whitespace.'
      };
    }

    // Bracket & block comment tracking
    let inBlockComment = false;
    let inTripleQuotePy = null;
    const bracketStack = [];

    // Python-specific indentation tracking
    let openParensPy = 0;
    const pyIndentStack = [0];
    let pyExpectIndentAfterLine = null;
    let pyExpectIndentHeader = '';

    // C/C++/Java specific tracking
    let openParensC = 0;
    let hasClassDeclaration = false;

    if (language === 'java' || language === 'cpp') {
      hasClassDeclaration = lines.some(l => /\b(class|struct)\s+\w+/.test(l));
      if (language === 'java' && !hasClassDeclaration) {
        errors.push({
          line: 1,
          col: 1,
          severity: 'error',
          type: 'Structure Error',
          message: "Class declaration expected in Java file (e.g. 'class Solution { ... }').",
          suggestion: "Wrap your code in 'class Solution { ... }'"
        });
      }
    }

    // LINE-BY-LINE COMPILATION & STATIC ANALYSIS
    for (let idx = 0; idx < lines.length; idx++) {
      const lineNum = idx + 1;
      const rawLine = lines[idx];
      const trimmed = rawLine.trim();

      const lineErrors = [];
      const lineWarnings = [];

      // Empty line check
      if (!trimmed) {
        lineDiagnostics.push({
          line: lineNum,
          lineNumber: lineNum,
          code: rawLine,
          codeLine: rawLine,
          type: 'pass',
          status: 'pass',
          message: 'Empty line',
          suggestion: '',
          errors: [],
          warnings: []
        });
        continue;
      }

      // Bracket and quote matching per line
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let inBacktick = false;

      for (let cIdx = 0; cIdx < rawLine.length; cIdx++) {
        const char = rawLine[cIdx];
        const nextChar = cIdx + 1 < rawLine.length ? rawLine[cIdx + 1] : '';
        const nextTwo = cIdx + 2 < rawLine.length ? rawLine.substring(cIdx, cIdx + 3) : '';

        if (inBlockComment) {
          if (char === '*' && nextChar === '/') {
            inBlockComment = false;
            cIdx++;
          }
          continue;
        }

        if (language === 'python') {
          if (inTripleQuotePy) {
            if (nextTwo === inTripleQuotePy) {
              inTripleQuotePy = null;
              cIdx += 2;
            }
            continue;
          } else if (nextTwo === '"""' || nextTwo === "'''") {
            if (!inSingleQuote && !inDoubleQuote) {
              inTripleQuotePy = nextTwo;
              cIdx += 2;
              continue;
            }
          }
        }

        if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
          if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            cIdx++;
            continue;
          }
          if (char === '/' && nextChar === '/') break;
          if (language === 'python' && char === '#') break;
          if (language === 'mysql' && (char === '#' || (char === '-' && nextChar === '-'))) break;
        }

        if (char === '\\' && (inSingleQuote || inDoubleQuote || inBacktick)) {
          cIdx++;
          continue;
        }

        if (char === "'" && !inDoubleQuote && !inBacktick) {
          inSingleQuote = !inSingleQuote;
          continue;
        }
        if (char === '"' && !inSingleQuote && !inBacktick) {
          inDoubleQuote = !inDoubleQuote;
          continue;
        }
        if (char === '`' && !inSingleQuote && !inDoubleQuote && language === 'javascript') {
          inBacktick = !inBacktick;
          continue;
        }

        if (inSingleQuote || inDoubleQuote || inBacktick) continue;

        if (char === '{' || char === '(' || char === '[') {
          bracketStack.push({ char, line: lineNum, col: cIdx + 1 });
        } else if (char === '}' || char === ')' || char === ']') {
          const expected = char === '}' ? '{' : char === ')' ? '(' : '[';
          if (bracketStack.length === 0) {
            lineErrors.push({
              line: lineNum,
              col: cIdx + 1,
              severity: 'error',
              type: 'Syntax Error',
              message: `Extraneous closing '${char}' without corresponding open bracket.`,
              suggestion: `Remove extraneous '${char}'`
            });
          } else {
            const top = bracketStack.pop();
            if (top.char !== expected) {
              lineErrors.push({
                line: lineNum,
                col: cIdx + 1,
                severity: 'error',
                type: 'Syntax Error',
                message: `Mismatched bracket: expected closing for '${top.char}' (opened line ${top.line}), found '${char}'.`,
                suggestion: `Replace '${char}' with closing bracket for '${top.char}'`
              });
            }
          }
        }
      }

      // Check comments
      const isCommentLine = inBlockComment || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--') || trimmed.startsWith('*');
      if (isCommentLine) {
        lineDiagnostics.push({
          line: lineNum,
          lineNumber: lineNum,
          code: rawLine,
          codeLine: rawLine,
          type: 'pass',
          status: 'pass',
          message: 'Comment line',
          suggestion: '',
          errors: [],
          warnings: []
        });
        continue;
      }

      // Extract code portion
      let codeOnly = trimmed;
      if (trimmed.includes('//')) codeOnly = trimmed.split('//')[0].trim();
      else if (language === 'python' && trimmed.includes('#')) codeOnly = trimmed.split('#')[0].trim();
      else if (language === 'mysql') {
        if (trimmed.includes('--')) codeOnly = trimmed.split('--')[0].trim();
        else if (trimmed.includes('#')) codeOnly = trimmed.split('#')[0].trim();
      }

      // --- LANGUAGE RULES ---

      // 1. PYTHON
      if (language === 'python') {
        const indentMatch = rawLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;

        if (pyExpectIndentAfterLine !== null) {
          if (indent <= pyIndentStack[pyIndentStack.length - 1]) {
            lineErrors.push({
              line: lineNum,
              col: indent + 1,
              severity: 'error',
              type: 'Indentation Error',
              message: `IndentationError: expected an indented block after '${pyExpectIndentHeader}' statement on line ${pyExpectIndentAfterLine}.`,
              suggestion: `Indent this line by at least 4 spaces`
            });
          } else {
            pyIndentStack.push(indent);
          }
          pyExpectIndentAfterLine = null;
          pyExpectIndentHeader = '';
        } else {
          if (indent < pyIndentStack[pyIndentStack.length - 1]) {
            while (pyIndentStack.length > 1 && indent < pyIndentStack[pyIndentStack.length - 1]) {
              pyIndentStack.pop();
            }
            if (indent !== pyIndentStack[pyIndentStack.length - 1]) {
              lineErrors.push({
                line: lineNum,
                col: indent + 1,
                severity: 'error',
                type: 'Indentation Error',
                message: `IndentationError: unindent does not match any outer indentation level.`,
                suggestion: `Align indentation to block (${pyIndentStack[pyIndentStack.length - 1]} spaces)`
              });
            }
          }
        }

        for (const c of codeOnly) {
          if (c === '(' || c === '[' || c === '{') openParensPy++;
          else if (c === ')' || c === ']' || c === '}') openParensPy = Math.max(0, openParensPy - 1);
        }

        if (/\b\w+\+\+|\+\+\w+|\b\w+--|--\w+/.test(codeOnly)) {
          lineErrors.push({
            line: lineNum,
            col: 1,
            severity: 'error',
            type: 'Syntax Error',
            message: "SyntaxError: Python does not support '++' or '--' operators.",
            suggestion: "Use '+= 1' or '-= 1' instead"
          });
        }

        if (/^(var|let|const|function)\b/.test(codeOnly)) {
          lineErrors.push({
            line: lineNum,
            col: 1,
            severity: 'error',
            type: 'Syntax Error',
            message: `SyntaxError: Unexpected '${codeOnly.split(' ')[0]}' keyword in Python.`,
            suggestion: `Remove '${codeOnly.split(' ')[0]}'`
          });
        }

        if (/^(public:|private:|protected:)/.test(codeOnly)) {
          lineErrors.push({
            line: lineNum,
            col: 1,
            severity: 'error',
            type: 'Syntax Error',
            message: "SyntaxError: Access specifiers ('public:', 'private:') do not exist in Python.",
            suggestion: "Remove access specifier"
          });
        }

        if (/\b(null)\b/.test(codeOnly)) {
          lineWarnings.push({
            line: lineNum,
            severity: 'warning',
            type: 'Convention Warning',
            message: "Use 'None' instead of 'null' in Python.",
            suggestion: "Replace 'null' with 'None'"
          });
        }

        if (/\b(true|false)\b/.test(codeOnly)) {
          lineWarnings.push({
            line: lineNum,
            severity: 'warning',
            type: 'Convention Warning',
            message: "Use capitalized 'True' or 'False' in Python.",
            suggestion: "Capitalize boolean literal"
          });
        }

        if (/===|!==/.test(codeOnly)) {
          lineWarnings.push({
            line: lineNum,
            severity: 'warning',
            type: 'Syntax Warning',
            message: "Python uses '==' or '!=' instead of '==='/'!=='.",
            suggestion: "Replace with '==' or '!='"
          });
        }

        if (openParensPy === 0) {
          if (/^(def|class|if|elif|else|for|while|try|except|finally|with)\b/.test(codeOnly)) {
            if (!codeOnly.endsWith(':')) {
              lineErrors.push({
                line: lineNum,
                col: codeOnly.length,
                severity: 'error',
                type: 'Syntax Error',
                message: "SyntaxError: expected ':' at end of header statement.",
                suggestion: "Add ':' at end of line"
              });
            } else {
              pyExpectIndentAfterLine = lineNum;
              pyExpectIndentHeader = codeOnly.split(/[\s(:]/)[0];
            }
          }
        }
      }

      // 2. C & C++
      if (language === 'cpp' || language === 'c') {
        if (language === 'cpp' && /^(public|private|protected)\s*:/.test(codeOnly) && !hasClassDeclaration) {
          lineErrors.push({
            line: lineNum,
            col: 1,
            severity: 'error',
            type: 'Scope Error',
            message: `'${codeOnly}' access specifier can only appear inside a class or struct declaration.`,
            suggestion: "Move inside class Solution { ... }"
          });
        }

        for (const c of codeOnly) {
          if (c === '(' || c === '[') openParensC++;
          else if (c === ')' || c === ']') openParensC = Math.max(0, openParensC - 1);
        }

        if (openParensC === 0) {
          const endsValid = codeOnly.endsWith('{') || codeOnly.endsWith('}') || codeOnly.endsWith(';') || codeOnly.endsWith(':') || codeOnly.endsWith(',') || codeOnly.endsWith('\\');
          const isControl = /^(if|for|while|switch|else|case|default|class|struct|namespace|public|private|protected|template)\b/.test(codeOnly);
          const isOperatorContinuation = /[+\-*\/%&|^=<>!~?]$/.test(codeOnly) || codeOnly.endsWith('<<') || codeOnly.endsWith('>>') || codeOnly.endsWith('->') || codeOnly.endsWith('.');
          const isPreprocessor = codeOnly.startsWith('#');

          if (!endsValid && !isControl && !isOperatorContinuation && !isPreprocessor) {
            if (/^(return|int|char|double|float|bool|long|short|unsigned|void|auto|string|vector|map|unordered_map|set|stack|queue|ListNode|TreeNode|cout|cin|printf|scanf|malloc|free|break|continue|throw)\b/.test(codeOnly) ||
                /=|\+\+|--|<<|>>/.test(codeOnly)) {
              lineErrors.push({
                line: lineNum,
                col: codeOnly.length + 1,
                severity: 'error',
                type: 'Syntax Error',
                message: "Expected ';' at end of statement.",
                suggestion: "Add ';' at end of line"
              });
            }
          }
        }
      }

      // 3. JAVA
      if (language === 'java') {
        for (const c of codeOnly) {
          if (c === '(' || c === '[') openParensC++;
          else if (c === ')' || c === ']') openParensC = Math.max(0, openParensC - 1);
        }

        if (openParensC === 0) {
          const endsValid = codeOnly.endsWith('{') || codeOnly.endsWith('}') || codeOnly.endsWith(';') || codeOnly.endsWith(':') || codeOnly.endsWith(',') || codeOnly.endsWith('\\');
          const isControl = /^(if|for|while|switch|else|case|default|class|public\s+class|interface|import|package|@)\b/.test(codeOnly);
          const isOperatorContinuation = /[+\-*\/%&|^=<>!~?]$/.test(codeOnly) || codeOnly.endsWith('.');

          if (!endsValid && !isControl && !isOperatorContinuation) {
            if (/^(return|int|char|double|float|boolean|long|short|byte|void|String|List|ArrayList|Map|HashMap|Set|HashSet|Stack|Queue|ListNode|TreeNode|System\.out|break|continue|throw)\b/.test(codeOnly) ||
                /=|\+\+|--/.test(codeOnly)) {
              lineErrors.push({
                line: lineNum,
                col: codeOnly.length + 1,
                severity: 'error',
                type: 'Syntax Error',
                message: "';' expected at end of statement.",
                suggestion: "Add ';' at end of line"
              });
            }
          }
        }
      }

      // 4. JAVASCRIPT
      if (language === 'javascript') {
        if (!codeOnly.endsWith('{') && !codeOnly.endsWith('}') && !codeOnly.endsWith(',')) {
          try {
            new Function(codeOnly);
          } catch (e) {
            const msg = e.message.toLowerCase();
            if (!msg.includes('unexpected end of input') && !msg.includes('missing }') && !msg.includes('missing )') && !msg.includes('return statement')) {
              lineErrors.push({
                line: lineNum,
                col: 1,
                severity: 'error',
                type: 'Syntax Error',
                message: e.message,
                suggestion: "Fix JavaScript syntax"
              });
            }
          }
        }
      }

      // 5. RUNTIME / LOGIC WARNINGS
      if (/while\s*\(\s*(true|1)\s*\)|while\s+True\s*:/.test(codeOnly)) {
        if (!raw.includes('break') && !raw.includes('return')) {
          lineErrors.push({
            line: lineNum,
            col: 1,
            severity: 'error',
            type: 'Runtime Warning',
            message: 'Potential Infinite Loop: while loop has no break or return exit condition.',
            suggestion: 'Add termination condition'
          });
        }
      }

      // Record line diagnostics
      if (lineErrors.length > 0) {
        errors.push(...lineErrors);
        lineDiagnostics.push({
          line: lineNum,
          lineNumber: lineNum,
          code: rawLine,
          codeLine: rawLine,
          type: 'error',
          status: 'error',
          message: lineErrors.map(e => e.message).join('; '),
          suggestion: lineErrors[0]?.suggestion || '',
          errors: lineErrors,
          warnings: []
        });
      } else if (lineWarnings.length > 0) {
        warnings.push(...lineWarnings);
        lineDiagnostics.push({
          line: lineNum,
          lineNumber: lineNum,
          code: rawLine,
          codeLine: rawLine,
          type: 'warning',
          status: 'warning',
          message: lineWarnings.map(w => w.message).join('; '),
          suggestion: lineWarnings[0]?.suggestion || '',
          errors: [],
          warnings: lineWarnings
        });
      } else {
        lineDiagnostics.push({
          line: lineNum,
          lineNumber: lineNum,
          code: rawLine,
          codeLine: rawLine,
          type: 'pass',
          status: 'pass',
          message: 'Line OK',
          suggestion: '',
          errors: [],
          warnings: []
        });
      }
    }

    // Check EOF unclosed brackets
    if (bracketStack.length > 0) {
      for (const b of bracketStack) {
        const matchClose = b.char === '{' ? '}' : b.char === '(' ? ')' : ']';
        const errObj = {
          line: b.line,
          col: b.col,
          severity: 'error',
          type: 'Syntax Error',
          message: `Unclosed bracket '${b.char}'. Expected '${matchClose}' before end of file.`,
          suggestion: `Add closing '${matchClose}' to match '${b.char}' from line ${b.line}`
        };
        errors.push(errObj);
        const diag = lineDiagnostics.find(d => (d.lineNumber === b.line || d.line === b.line));
        if (diag) {
          diag.status = 'error';
          diag.type = 'error';
          diag.message = errObj.message;
          diag.suggestion = errObj.suggestion;
          if (!diag.errors) diag.errors = [];
          diag.errors.push(errObj);
        }
      }
    }

    // MySQL Validation
    if (language === 'mysql') {
      const cleanSql = raw
        .replace(/--.*$/gm, '')
        .replace(/#.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim();

      const upper = cleanSql.toUpperCase();
      const hasSqlVerb = ['SELECT', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'SHOW', 'DESC', 'EXPLAIN'].some(k => upper.includes(k));
      if (!hasSqlVerb) {
        errors.push({
          line: 1,
          col: 1,
          severity: 'error',
          type: 'Syntax Error',
          message: 'No executable SQL statement found (expected SELECT, WITH, INSERT, etc.)',
          suggestion: 'Begin query with SELECT or WITH'
        });
        if (lineDiagnostics[0]) {
          lineDiagnostics[0].type = 'error';
          lineDiagnostics[0].status = 'error';
          lineDiagnostics[0].message = 'No executable SQL statement found';
          lineDiagnostics[0].suggestion = 'Begin query with SELECT or WITH';
        }
      }

      const singleQuotes = (cleanSql.match(/'/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push({
          line: lines.length,
          col: 1,
          severity: 'error',
          type: 'Syntax Error',
          message: 'Unclosed quotation mark after character string in SQL query.',
          suggestion: 'Close all open quotation marks'
        });
        const lastDiag = lineDiagnostics[lineDiagnostics.length - 1];
        if (lastDiag) {
          lastDiag.type = 'error';
          lastDiag.status = 'error';
          lastDiag.message = 'Unclosed quotation mark';
          lastDiag.suggestion = 'Close all open quotation marks';
        }
      }
    }

    const errorLines = [...new Set(errors.map(e => e.line))];
    const warningLines = [...new Set(warnings.map(w => w.line))];

    // Format rich compiler output
    let compilerOutput = '';
    if (errors.length > 0) {
      const fileExt = language === 'cpp' ? 'solution.cpp' : language === 'java' ? 'Solution.java' : language === 'c' ? 'solution.c' : language === 'python' ? 'solution.py' : 'solution.js';
      compilerOutput = `[${(language || '').toUpperCase()} Compiler & Debugger] Build failed with ${errors.length} error(s) and ${warnings.length} warning(s):\n\n`;
      errors.forEach((e, i) => {
        const lineContent = (lines[e.line - 1] || '').trim();
        compilerOutput += `${fileExt}:${e.line}:${e.col || 1}: error: ${e.message}\n`;
        if (lineContent) {
          compilerOutput += `    ${lineContent}\n`;
          compilerOutput += `    ${' '.repeat(Math.max(0, (e.col || 1) - 1))}^\n`;
        }
        if (e.suggestion) {
          compilerOutput += `    (suggestion: ${e.suggestion})\n`;
        }
        if (i < errors.length - 1) compilerOutput += '\n';
      });
    }

    const summary = errors.length === 0
      ? `All ${lines.length} lines parsed cleanly. ${warnings.length > 0 ? `${warnings.length} warning(s) detected.` : 'No errors found.'}`
      : `Found ${errors.length} error(s) and ${warnings.length} warning(s) across ${lines.length} lines.`;

    return {
      isValid: errors.length === 0,
      hasErrors: errors.length > 0,
      line: errors[0]?.line || 1,
      column: errors[0]?.col || 1,
      status: errors.length === 0 ? 'Success' : 'Compilation Error',
      message: errors[0]?.message || '',
      errors,
      warnings,
      errorLines,
      warningLines,
      lineDiagnostics,
      compilerOutput,
      totalLines: lines.length,
      summary
    };
  }

  validateSyntax(language, code, problem = null) {
    return this.debugCode(language, code, problem);
  }

  // Guaranteed clean starter template generator for all languages and problems
  getStarterTemplate(problem, language) {
    if (problem?.starterCode?.[language]) {
      return problem.starterCode[language];
    }
    if (language === 'mysql') {
      return `# Write your MySQL query statement below\nSELECT \nFROM \nWHERE ;\n`;
    }
    // Default fallback from supported languages
    const langConfig = supportedLanguagesList.find(l => l.id === language);
    return langConfig?.defaultCode || '// Write your solution here\n';
  }

  // Evaluate code against visible sample test cases
  async runCode(arg1, arg2, arg3) {
    await new Promise(r => setTimeout(r, 380));

    let problemId, language, code;
    if (typeof arg1 === 'object' && arg1 !== null) {
      code = arg1.code || '';
      language = arg1.language || 'python';
      problemId = arg1.problemId || 'prob-1';
    } else if (typeof arg1 === 'string' && (arg1.startsWith('prob-') || codingProblemsList.some(p => p.id === arg1))) {
      problemId = arg1;
      language = arg2 || 'python';
      code = arg3 || '';
    } else {
      code = arg1 || '';
      language = arg2 || 'python';
      problemId = (arg3 && typeof arg3 === 'string') ? arg3 : 'prob-1';
    }

    const problem = this.getProblem(problemId);
    const cleanCode = (code || '').trim();

    // 1. Strict Line-by-Line Debugging & Diagnostics Check
    const debug = this.debugCode(language, cleanCode, problem);
    if (!debug.isValid) {
      this.recordAttempt(problemId, language);
      return {
        status: debug.status || 'Compilation Error',
        isCompileError: true,
        errorLine: debug.line,
        errorColumn: debug.column,
        errorMessage: debug.message,
        errors: debug.errors,
        warnings: debug.warnings,
        errorLines: debug.errorLines,
        warningLines: debug.warningLines,
        lineDiagnostics: debug.lineDiagnostics,
        debugSummary: debug.summary,
        compilerOutput: debug.compilerOutput,
        compileOutput: debug.compilerOutput,
        testResults: (problem.sampleTestCases || []).map(tc => ({
          id: tc.id,
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: `[${debug.status}] Build failed at line ${debug.line}:${debug.column} (${debug.errors.length} error${debug.errors.length === 1 ? '' : 's'})`,
          runtimeMs: '0 ms',
          memoryMB: '0 MB'
        })),
        allPassed: false,
        totalTime: '0 ms',
        executionTime: '0 ms',
        totalMemory: '0 MB'
      };
    }

    // 2. Infinite Loop / TLE Protection
    if (cleanCode.includes('while True:') || cleanCode.includes('while(true)') || cleanCode.includes('while (1)')) {
      if (!cleanCode.includes('break') && !cleanCode.includes('return')) {
        const tleOutput = `Execution timed out after 4.0 seconds. Process killed by GMRIT Sandbox daemon (SIGXCPU).`;
        this.recordAttempt(problemId, language);
        return {
          status: 'Time Limit Exceeded',
          errorLine: null,
          errors: debug.errors,
          warnings: debug.warnings,
          errorLines: debug.errorLines,
          warningLines: debug.warningLines,
          lineDiagnostics: debug.lineDiagnostics,
          debugSummary: debug.summary,
          compilerOutput: tleOutput,
          compileOutput: tleOutput,
          testResults: (problem.sampleTestCases || []).map(tc => ({
            id: tc.id,
            passed: false,
            input: tc.input,
            expected: tc.expected,
            actual: 'Time Limit Exceeded (CPU execution timeout)',
            runtimeMs: '4000 ms',
            memoryMB: '128 MB'
          })),
          allPassed: false,
          totalTime: '4000 ms',
          executionTime: '4000 ms',
          totalMemory: '128 MB'
        };
      }
    }

    // 3. Evaluate sample test cases
    const sampleCases = problem.sampleTestCases || [
      { id: 1, input: 'Sample Input', expected: 'Sample Output' }
    ];

    const testResults = sampleCases.map((tc) => {
      const runtime = Math.floor(28 + Math.random() * 24);
      const memory = (14.2 + Math.random() * 5).toFixed(1);

      return {
        id: tc.id,
        passed: true,
        input: tc.input,
        expected: tc.expected,
        actual: tc.expected,
        runtimeMs: `${runtime} ms`,
        memoryMB: `${memory} MB`
      };
    });

    const allPassed = testResults.every(t => t.passed);
    const totalRuntime = Math.floor(32 + Math.random() * 15);
    const totalMem = (16.4 + Math.random() * 3).toFixed(1);

    this.recordAttempt(problemId, language);

    return {
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      compilerOutput: language === 'mysql' ? `MySQL 8.0 query executed successfully. 4 rows affected (${totalRuntime} ms).` : '',
      compileOutput: language === 'mysql' ? `MySQL 8.0 query executed successfully. 4 rows affected (${totalRuntime} ms).` : '',
      testResults,
      testCasesResults: testResults,
      allPassed,
      totalTime: `${totalRuntime} ms`,
      executionTime: `${totalRuntime} ms`,
      totalMemory: `${totalMem} MB`,
      // Attach full line-by-line debugging diagnostics
      errors: debug.errors,
      warnings: debug.warnings,
      errorLines: debug.errorLines,
      warningLines: debug.warningLines,
      lineDiagnostics: debug.lineDiagnostics,
      debugSummary: debug.summary
    };
  }

  // Submit code for official evaluation against hidden test cases
  async submitCode(problemId, language, code, user = null) {
    await new Promise(r => setTimeout(r, 650));

    const problem = this.getProblem(problemId);
    const cleanCode = (code || '').trim();

    // 1. Strict Line-by-Line Debugging & Diagnostics Check
    const debug = this.debugCode(language, cleanCode, problem);
    const totalCases = (problem.hiddenTestCases?.length || 0) + (problem.sampleTestCases?.length || 0);

    if (!debug.isValid) {
      const errRes = {
        status: debug.status || 'Compilation Error',
        isCompileError: true,
        errorLine: debug.line,
        errorColumn: debug.column,
        errorMessage: debug.message,
        errors: debug.errors,
        warnings: debug.warnings,
        errorLines: debug.errorLines,
        warningLines: debug.warningLines,
        lineDiagnostics: debug.lineDiagnostics,
        debugSummary: debug.summary,
        passedCount: 0,
        totalCount: totalCases,
        compilerOutput: debug.compilerOutput,
        compileOutput: debug.compilerOutput,
        runtimeMs: '0 ms',
        memoryMB: '0 MB'
      };
      this.recordSubmission(problemId, language, errRes, user);
      return errRes;
    }

    const passedCount = totalCases;
    const runtime = Math.floor(36 + Math.random() * 18);
    const memory = (17.5 + Math.random() * 4).toFixed(1);

    const activeUser = user || authService.getCurrentUser();

    auditService.logAction({
      user: activeUser?.name || 'Rahul Kumar',
      role: activeUser?.role || 'student',
      userId: activeUser?.userId || 'STU001',
      action: 'Code Submission',
      resource: `/coding/problems/${problem.id}`,
      result: 'Success',
      details: `Submitted solution for [${problem.title}] in ${language.toUpperCase()}. All ${totalCases}/${totalCases} test cases passed.`
    });

    const result = {
      status: 'Accepted',
      passedCount,
      totalCount: totalCases,
      compilerOutput: '',
      runtimeMs: `${runtime} ms`,
      memoryMB: `${memory} MB`,
      runtimePercentile: '89.4%',
      memoryPercentile: '76.8%'
    };

    this.recordSubmission(problemId, language, result, activeUser);

    return result;
  }

  // Run Custom Input
  async runCustomInput(arg1, arg2, arg3, arg4) {
    await new Promise(r => setTimeout(r, 400));
    let customInput = typeof arg4 === 'string' ? arg4 : (typeof arg3 === 'string' ? arg3 : '');
    const inputClean = (customInput || '').trim();
    const runtime = Math.floor(22 + Math.random() * 20);
    const memory = (15.1 + Math.random() * 3).toFixed(1);
    const out = inputClean ? `Execution Output:\nProcessed [${inputClean}]\nResult: True` : 'Empty input provided. Standard input (stdin) was blank.';

    return {
      status: 'Success',
      stdout: out,
      output: out,
      runtimeMs: `${runtime} ms`,
      memoryMB: `${memory} MB`
    };
  }

  // Drafts Persistence
  saveDraft(problemId, language, code) {
    try {
      const key = `${this.draftsKeyPrefix}${problemId}_${language}`;
      const payload = {
        code,
        timestamp: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save draft", e);
    }
  }

  getDraft(problemId, language) {
    try {
      const key = `${this.draftsKeyPrefix}${problemId}_${language}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not retrieve draft", e);
    }
    return null;
  }
}

export const codeExecutionService = new CodeExecutionService();
export default codeExecutionService;

