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
    if (typeof arg1 === 'string' && (arg1.startsWith('prob-') || codingProblemsList.some(p => p.id === arg1))) {
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

    // Evaluate sample test cases
    const sampleCases = problem.sampleTestCases || [
      { id: 1, input: 'Sample Input', expected: 'Sample Output' }
    ];

    const testResults = sampleCases.map((tc, idx) => {
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

    return {
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      compilerOutput: '',
      compileOutput: '',
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
    // Longer latency (600ms) to simulate multi-container test suite
    await new Promise(r => setTimeout(r, 650));

    const problem = this.getProblem(problemId);
    const cleanCode = (code || '').trim();

    if (!cleanCode || cleanCode.length < 20) {
      return {
        status: 'Compilation Error',
        passedCount: 0,
        totalCount: problem.hiddenTestCases.length + problem.sampleTestCases.length,
        compilerOutput: `error: Solution file contains no executable return statements.`,
        runtimeMs: '0 ms',
        memoryMB: '0 MB'
      };
    }

    const totalCases = problem.hiddenTestCases.length + problem.sampleTestCases.length;
    const passedCount = totalCases; // 100% pass for working solution
    const runtime = Math.floor(36 + Math.random() * 18);
    const memory = (17.5 + Math.random() * 4).toFixed(1);

    // Record institutional audit event
    auditService.logAction({
      user: user?.name || 'Rahul Kumar',
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
}

export const codeExecutionService = new CodeExecutionService();
export default codeExecutionService;
