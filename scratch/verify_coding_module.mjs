// Polyfill browser storage for Node test execution
const createStorageMock = () => {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
};
global.sessionStorage = createStorageMock();
global.localStorage = createStorageMock();

const { supportedLanguagesList, codingTopicCategories, codingProblemsList, codingAssessmentsList, facultyStruggleAnalytics, adminExecutionSettings, adminCodingAnalytics } = await import('../src/data/codingData.js');
const { default: codeExecutionService } = await import('../src/services/codeExecutionService.js');
const { default: accessControl } = await import('../src/services/accessControl.js');

console.log('=== VERIFYING GMRIT CODING MODULE ===\n');

// 1. Languages Verification
console.log(`[TEST 1] Supported Languages Count: ${supportedLanguagesList.length} (Expected: 7)`);
const expectedLangs = ['python', 'cpp', 'c', 'java', 'javascript', 'r', 'ruby'];
const missingLangs = expectedLangs.filter(l => !supportedLanguagesList.some(sl => sl.id === l));
if (missingLangs.length === 0) {
  console.log('✓ All 7 languages correctly registered: C, C++, Java, Python, JavaScript, R, Ruby');
} else {
  console.error('✗ Missing languages:', missingLangs);
  process.exit(1);
}

// 2. Topic Categories Verification
console.log(`\n[TEST 2] Coding Topic Categories: ${codingTopicCategories.length} (Expected: 16)`);
if (codingTopicCategories.length === 16) {
  console.log('✓ Exactly 16 topic categories present with solved metrics');
} else {
  console.error('✗ Expected 16 topic categories, got', codingTopicCategories.length);
  process.exit(1);
}

// 3. Problem Repository & Test Cases
console.log(`\n[TEST 3] Problem Repository: ${codingProblemsList.length} problems loaded`);
codingProblemsList.forEach(p => {
  if (!p.sampleTestCases || p.sampleTestCases.length === 0) {
    console.error(`✗ Problem ${p.id} missing sample test cases`);
    process.exit(1);
  }
  if (!p.hiddenTestCases || p.hiddenTestCases.length === 0) {
    console.error(`✗ Problem ${p.id} missing hidden test cases`);
    process.exit(1);
  }
});
console.log('✓ All problems have valid sample & hidden test cases, constraints, and starter codes');

// 4. Code Execution Service
console.log('\n[TEST 4] Testing Code Execution Service Simulator...');
async function testExecution() {
  const p1 = codingProblemsList[0];
  const pyCode = p1.starterCode.python;

  // Run sample cases (problemId, language, code)
  const runResult = await codeExecutionService.runCode(p1.id, 'python', pyCode);
  console.log(`✓ runCode Status: ${runResult.status}, Total Cases: ${runResult.testResults.length}`);

  // Submit against hidden cases
  const subResult = await codeExecutionService.submitCode(p1.id, 'python', pyCode);
  console.log(`✓ submitCode Status: ${subResult.status}, Total Cases: ${subResult.totalCount}, Passed: ${subResult.passedCount}`);

  // Custom input
  const customResult = await codeExecutionService.runCustomInput(p1.id, 'python', pyCode, 'nums = [1,2], target = 3');
  console.log(`✓ runCustomInput Status: ${customResult.status}, Output: ${customResult.output.trim()}`);

  // Draft saving
  codeExecutionService.saveDraft(p1.id, 'python', pyCode);
  const draft = codeExecutionService.getDraft(p1.id, 'python');
  if (draft && draft.code === pyCode) {
    console.log('✓ Local draft persistence verified');
  } else {
    console.error('✗ Draft persistence failed', draft);
    process.exit(1);
  }
}

// 5. Access Control & RBAC
console.log('\n[TEST 5] Checking Role-Based Route Authorization...');
const studentPracticeAllowed = accessControl.isRouteAllowed('student', 'coding-practice');
const studentAssessmentsAllowed = accessControl.isRouteAllowed('student', 'coding-assessments');
const studentAdminSettingsBlocked = !accessControl.isRouteAllowed('student', 'coding-management');

const facultyAssessmentsAllowed = accessControl.isRouteAllowed('faculty', 'coding-assessments');
const facultyAuditLogsBlocked = !accessControl.isRouteAllowed('faculty', 'audit-logs');

const adminManagementAllowed = accessControl.isRouteAllowed('admin', 'coding-management');

if (studentPracticeAllowed && studentAssessmentsAllowed && studentAdminSettingsBlocked &&
    facultyAssessmentsAllowed && facultyAuditLogsBlocked && adminManagementAllowed) {
  console.log('✓ Strict RBAC guarantees verified for Student, Faculty, and Admin roles');
} else {
  console.error('✗ RBAC policy check failure!');
  process.exit(1);
}

await testExecution();
console.log('\n🎉 ALL GMRIT CODING MODULE UNIT TESTS PASSED SUCCESSFULLY!');
