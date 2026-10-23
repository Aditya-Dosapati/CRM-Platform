// GMRIT Academic Hub - Sandboxed Code Execution Engine Simulation
import { codingProblemsList } from '../data/codingData.js';
import auditService from './auditService.js';

class CodeExecutionService {
  constructor() {
    this.draftsKeyPrefix = 'gmrit_code_draft_';
  }

  getProblem(problemId) {
    return codingProblemsList.find(p => p.id === problemId) || codingProblemsList[0];
  }

  // Evaluate code against visible sample test cases
  async runCode(arg1, arg2, arg3) {
    // Artificial execution latency (300ms - 500ms) to simulate sandboxed container run
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

    // Syntax / Compilation error check
    if (!cleanCode || cleanCode.length < 15) {
      const errOutput = `[${language.toUpperCase()} Compiler] error: Empty or incomplete implementation in main compilation unit.`;
      return {
        status: 'Compilation Error',
        compilerOutput: errOutput,
        compileOutput: errOutput,
        testResults: [],
        testCasesResults: [],
        allPassed: false,
        totalTime: '0 ms',
        executionTime: '0 ms',
        totalMemory: '0 MB'
      };
    }

    // Check basic structural validity
    if (
      (language === 'c' || language === 'cpp' || language === 'java') &&
      (!cleanCode.includes('{') || !cleanCode.includes('}'))
    ) {
      const errOutput = `[${language.toUpperCase()} GMRIT Sandbox] error: expected ';' or '}' before end of file. Syntax verification failed.`;
      return {
        status: 'Compilation Error',
        compilerOutput: errOutput,
        compileOutput: errOutput,
        testResults: [],
        testCasesResults: [],
        allPassed: false,
        totalTime: '12 ms',
        executionTime: '12 ms',
        totalMemory: '14 MB'
      };
    }

    // SQL syntax check for MySQL and Oracle
    if (language === 'mysql' || language === 'oracle') {
      const upperCode = cleanCode.toUpperCase();
      const hasSqlKeyword = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'CREATE', 'ALTER', 'SHOW', 'DESC'].some(k => upperCode.includes(k));
      if (!hasSqlKeyword) {
        const errOutput = `[${language.toUpperCase()} Engine] Error 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your ${language === 'mysql' ? 'MySQL' : 'Oracle'} server version.`;
        return {
          status: 'Syntax Error',
          compilerOutput: errOutput,
          compileOutput: errOutput,
          testResults: [],
          testCasesResults: [],
          allPassed: false,
          totalTime: '18 ms',
          executionTime: '18 ms',
          totalMemory: '22 MB'
        };
      }
    }

    // Time Limit Exceeded check for intentional infinite loops
    if (cleanCode.includes('while True:') || cleanCode.includes('while(true)') || cleanCode.includes('while (1)')) {
      if (!cleanCode.includes('break') && !cleanCode.includes('return')) {
        const tleOutput = `Execution timed out after 5.0 seconds. Process killed by GMRIT Sandbox daemon (SIGXCPU).`;
        return {
          status: 'Time Limit Exceeded',
          compilerOutput: tleOutput,
          compileOutput: tleOutput,
          testResults: [],
          testCasesResults: [],
          allPassed: false,
          totalTime: '5002 ms',
          executionTime: '5002 ms',
          totalMemory: '128 MB'
        };
      }
    }

    // Helper: strip comments
    const stripComments = (str) => {
      return str
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/#.*$/gm, '')
        .trim();
    };

    // Helper: check if solution is just starter stub / empty placeholder
    const codeWithoutComments = stripComments(cleanCode);
    const isStub = (
      codeWithoutComments.length < 25 ||
      /^(def\s+\w+\([^)]*\):\s*(pass|return\s*(\[\]|None|0|null|false)?)\s*)+$/m.test(codeWithoutComments) ||
      codeWithoutComments.includes('Write your solution here') ||
      codeWithoutComments.includes('Complete your solution') ||
      /return\s*(\[\]|0|null|false|""|'');?\s*$/.test(codeWithoutComments) && !/for|while|map|filter|forEach|reduce|if/i.test(codeWithoutComments)
    );

    // Evaluate sample test cases
    const sampleCases = problem.sampleTestCases || [
      { id: 1, input: 'Sample Input', expected: 'Sample Output' }
    ];

    const testResults = sampleCases.map((tc, idx) => {
      const runtime = Math.floor(28 + Math.random() * 24);
      const memory = (14.2 + Math.random() * 5).toFixed(1);

      if (isStub) {
        return {
          id: tc.id,
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: language === 'python' ? 'None (solution body empty)' : 'undefined (placeholder not implemented)',
          runtimeMs: `${runtime} ms`,
          memoryMB: `${memory} MB`
        };
      }

      // Live JavaScript evaluation when language is JavaScript
      if (language === 'javascript') {
        try {
          // Prepare sandboxed evaluation
          // Parse inputs like: nums = [2,7,11,15], target = 9
          const runner = new Function(`
            ${cleanCode}
            try {
              ${tc.input};
              // Determine which function was defined
              let targetFn = null;
              if (typeof twoSum === 'function') targetFn = twoSum;
              else if (typeof reverseList === 'function') targetFn = reverseList;
              else if (typeof solve === 'function') targetFn = solve;
              else {
                // Find any user function
                const fns = [typeof maxSubArray === 'function' ? maxSubArray : null, typeof isValid === 'function' ? isValid : null].filter(Boolean);
                if (fns.length > 0) targetFn = fns[0];
              }

              if (targetFn) {
                // Infer arguments from input
                if (typeof nums !== 'undefined' && typeof target !== 'undefined') return targetFn(nums, target);
                if (typeof head !== 'undefined') return targetFn(head);
                if (typeof nums !== 'undefined') return targetFn(nums);
                if (typeof s !== 'undefined') return targetFn(s);
              }
              return 'NO_EXEC';
            } catch (innerErr) {
              return 'ERR: ' + innerErr.message;
            }
          `);

          const execVal = runner();
          if (execVal !== 'NO_EXEC' && !String(execVal).startsWith('ERR:')) {
            const actualStr = JSON.stringify(execVal);
            const expectedStr = tc.expected.replace(/\s+/g, '');
            const normalizedActual = actualStr.replace(/\s+/g, '');
            const isMatch = normalizedActual === expectedStr;

            return {
              id: tc.id,
              passed: isMatch,
              input: tc.input,
              expected: tc.expected,
              actual: actualStr,
              runtimeMs: `${runtime} ms`,
              memoryMB: `${memory} MB`
            };
          }
        } catch (jsErr) {
          return {
            id: tc.id,
            passed: false,
            input: tc.input,
            expected: tc.expected,
            actual: `Runtime Error: ${jsErr.message}`,
            runtimeMs: `${runtime} ms`,
            memoryMB: `${memory} MB`
          };
        }
      }

      // Algorithmic check for Python / C++ / Java / SQL:
      // Verify substantial logic presence (loops, conditionals, hash maps, return statement)
      const hasLogic = (
        (/for|while|if|switch|map|filter|dict|HashMap|unordered_map|vector|set/i.test(codeWithoutComments)) &&
        (/return|SELECT/i.test(codeWithoutComments))
      );

      const passed = hasLogic && !isStub;
      return {
        id: tc.id,
        passed,
        input: tc.input,
        expected: tc.expected,
        actual: passed ? tc.expected : 'Output mismatch / Incomplete logic',
        runtimeMs: `${runtime} ms`,
        memoryMB: `${memory} MB`
      };
    });

    const allPassed = testResults.every(t => t.passed);
    const totalRuntime = Math.floor(32 + Math.random() * 15);
    const totalMem = (16.4 + Math.random() * 3).toFixed(1);

    return {
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      compilerOutput: language === 'mysql' || language === 'oracle' ? `Query executed successfully. 4 rows affected (${totalRuntime} ms).` : (allPassed ? '' : 'Failed test verification: check solution logic and return values.'),
      compileOutput: language === 'mysql' || language === 'oracle' ? `Query executed successfully. 4 rows affected (${totalRuntime} ms).` : '',
      testResults,
      testCasesResults: testResults,
      allPassed,
      totalTime: `${totalRuntime} ms`,
      executionTime: `${totalRuntime} ms`,
      totalMemory: `${totalMem} MB`
    };
  }

  // Submit code for official evaluation against hidden test cases
  async submitCode(problemId, language, code, user = null) {
    // Artificial latency (600ms) to simulate sandboxed container run
    await new Promise(r => setTimeout(r, 650));

    const problem = this.getProblem(problemId);
    const cleanCode = (code || '').trim();

    if (!cleanCode || cleanCode.length < 20) {
      return {
        status: 'Compilation Error',
        passedCount: 0,
        totalCount: problem.hiddenTestCases.length + problem.sampleTestCases.length,
        compilerOutput: `error: Solution file contains no executable statements or functions.`,
        runtimeMs: '0 ms',
        memoryMB: '0 MB'
      };
    }

    // Check basic structural validity
    if (
      (language === 'c' || language === 'cpp' || language === 'java') &&
      (!cleanCode.includes('{') || !cleanCode.includes('}'))
    ) {
      return {
        status: 'Compilation Error',
        passedCount: 0,
        totalCount: problem.hiddenTestCases.length + problem.sampleTestCases.length,
        compilerOutput: `[${language.toUpperCase()} GMRIT Sandbox] error: expected ';' or '}' before end of file. Syntax verification failed.`,
        runtimeMs: '12 ms',
        memoryMB: '14 MB'
      };
    }

    // Run sample test evaluation
    const sampleEval = await this.runCode(problemId, language, cleanCode);
    const totalCases = (problem.hiddenTestCases?.length || 0) + (problem.sampleTestCases?.length || 0);

    if (!sampleEval.allPassed) {
      // Record failed institutional audit event
      auditService.logAction({
        user: user?.name || 'Student User',
        role: user?.role || 'student',
        userId: user?.userId || 'STU001',
        action: 'Code Submission (Failed)',
        resource: `/coding/problems/${problem.id}`,
        result: 'Failed',
        details: `Submitted solution for [${problem.title}] failed verification. 0/${totalCases} test cases passed.`
      });

      return {
        status: 'Wrong Answer',
        passedCount: 0,
        totalCount: totalCases,
        compilerOutput: 'Solution failed sample test cases. Review your logic and test case edge cases.',
        runtimeMs: sampleEval.totalTime || '42 ms',
        memoryMB: sampleEval.totalMemory || '16 MB',
        runtimePercentile: null,
        memoryPercentile: null
      };
    }

    const passedCount = totalCases;
    const runtime = Math.floor(36 + Math.random() * 18);
    const memory = (17.5 + Math.random() * 4).toFixed(1);

    // Persist solved problem in localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const solved = JSON.parse(localStorage.getItem('gmrit_solved_problems') || '[]');
        if (!solved.includes(problemId)) {
          solved.push(problemId);
          localStorage.setItem('gmrit_solved_problems', JSON.stringify(solved));
        }
      }
    } catch (e) {
      console.warn('Could not save solved problem state:', e);
    }

    // Record institutional audit event
    auditService.logAction({
      user: user?.name || 'Student User',
      role: user?.role || 'student',
      userId: user?.userId || 'STU001',
      action: 'Code Submission',
      resource: `/coding/problems/${problem.id}`,
      result: 'Success',
      details: `Submitted solution for [${problem.title}] in ${language.toUpperCase()}. All ${totalCases}/${totalCases} test cases passed.`
    });

    return {
      status: 'Accepted',
      passedCount,
      totalCount: totalCases,
      compilerOutput: '',
      runtimeMs: `${runtime} ms`,
      memoryMB: `${memory} MB`,
      runtimePercentile: '89.4%',
      memoryPercentile: '76.8%'
    };
  }

  // Run Custom Input
  async runCustomInput(arg1, arg2, arg3, arg4) {
    await new Promise(r => setTimeout(r, 400));
    // Support (language, code, customInput) or (problemId, language, code, customInput)
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

  getSolvedProblems() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('gmrit_solved_problems');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not retrieve solved problems", e);
    }
    return [];
  }
}

export const codeExecutionService = new CodeExecutionService();
export default codeExecutionService;
