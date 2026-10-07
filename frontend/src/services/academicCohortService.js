// GMR CRM - Canonical Academic Cohort & Branch Mapping Engine
// Single Source of Truth for Student ↔ Branch ↔ Year ↔ Semester ↔ Section ↔ Faculty Assignment Mapping

export const MASTER_BRANCHES = [
  {
    branch: 'CSE',
    department: 'CSE',
    displayName: 'CSE',
    name: 'Computer Science and Engineering',
    id: 'dept-cse'
  },
  {
    branch: 'AIML',
    department: 'CSE',
    displayName: 'CSE-AIML',
    name: 'CSE - Artificial Intelligence and Machine Learning',
    id: 'dept-aiml'
  },
  {
    branch: 'AIDS',
    department: 'CSE',
    displayName: 'CSE-AIDS',
    name: 'CSE - Artificial Intelligence and Data Science',
    id: 'dept-aids'
  }
];

export const CANONICAL_DEPARTMENTS = MASTER_BRANCHES.map(b => ({
  id: b.id,
  code: b.displayName,
  name: b.name,
  branch: b.branch,
  department: b.department
}));

export const DYNAMIC_DEPARTMENT_MAP = new Map([
  ['dept-cse', { branch: 'CSE', code: 'CSE', name: 'Computer Science and Engineering', department: 'CSE' }],
  ['dept-aiml', { branch: 'AIML', code: 'CSE-AIML', name: 'CSE - Artificial Intelligence and Machine Learning', department: 'CSE' }],
  ['dept-aids', { branch: 'AIDS', code: 'CSE-AIDS', name: 'CSE - Artificial Intelligence and Data Science', department: 'CSE' }],
  ['b9cce72e-288c-4091-88a7-fcb31a08863f', { branch: 'CSE', code: 'CSE', name: 'Computer Science and Engineering', department: 'CSE' }],
  ['835f1428-d1ec-47b9-87e0-d281feba4234', { branch: 'AIML', code: 'CSE-AIML', name: 'CSE - Artificial Intelligence and Machine Learning', department: 'CSE' }],
  ['e126f2f2-8159-4c22-8d86-4ff57ee3d66c', { branch: 'AIDS', code: 'CSE-AIDS', name: 'CSE - Artificial Intelligence and Data Science', department: 'CSE' }],
  ['a0000000-0000-0000-0000-000000000001', { branch: 'CSE', code: 'CSE', name: 'Computer Science and Engineering', department: 'CSE' }],
  ['a0000000-0000-0000-0000-000000000002', { branch: 'AIML', code: 'CSE-AIML', name: 'CSE - Artificial Intelligence and Machine Learning', department: 'CSE' }],
  ['a0000000-0000-0000-0000-000000000003', { branch: 'AIDS', code: 'CSE-AIDS', name: 'CSE - Artificial Intelligence and Data Science', department: 'CSE' }]
]);

export function registerDepartments(deptList) {
  if (!Array.isArray(deptList)) return;
  for (const item of deptList) {
    if (!item) continue;
    const resolved = normalizeBranch(item.code || item.name || item.id);
    if (item.id) {
      DYNAMIC_DEPARTMENT_MAP.set(String(item.id).toLowerCase(), resolved);
    }
  }
}

/**
 * Resolves the database department code.
 * Preserves 'CSE' as the base department.
 */
export function resolveDepartment(input) {
  if (!input) return 'CSE';
  if (typeof input === 'object') {
    return resolveDepartment(input.department || input.departmentCode || input.department_code || input.departmentId || input.department_id || 'CSE');
  }
  const raw = String(input).trim();
  if (raw === 'dept-cse' || raw === 'dept-aiml' || raw === 'dept-aids') return 'CSE';
  if (raw === 'a0000000-0000-0000-0000-000000000001' || raw === 'a0000000-0000-0000-0000-000000000002' || raw === 'a0000000-0000-0000-0000-000000000003') return 'CSE';
  if (raw === 'Computer Science and Engineering' || raw === 'Computer Science & Engineering') return 'CSE';
  return 'CSE';
}

/**
 * Resolves the database branch code.
 * Strictly maintains separate values: 'AIML', 'AIDS', or 'CSE'.
 * Does NOT convert AIML -> CSE or AIDS -> CSE.
 */
export function resolveBranch(input) {
  if (!input) return 'CSE';

  if (typeof input === 'object') {
    // Check direct department_id or departmentId UUID in dynamic map first
    const directDeptId = input.department_id || input.departmentId;
    if (directDeptId && typeof directDeptId === 'string') {
      const lowerDept = directDeptId.toLowerCase().trim();
      if (DYNAMIC_DEPARTMENT_MAP.has(lowerDept)) {
        const mapped = DYNAMIC_DEPARTMENT_MAP.get(lowerDept);
        if (typeof mapped === 'string') return resolveBranch(mapped);
        if (mapped && mapped.branch) return mapped.branch;
        if (mapped && mapped.code) return resolveBranch(mapped.code);
      }
    }

    const candidates = [
      input.branch,
      input.branchId,
      input.branch_id,
      input.departmentCode,
      input.department_code,
      input.departmentVal,
      input.department_val,
      input.branchDisplayName,
      input.departmentName,
      input.department_name,
      input.department,
      input.name,
      input.full_name,
      input.departmentId,
      input.department_id,
      input.rollNumber,
      input.roll_number,
      input.employeeId,
      input.employee_id,
      input.email
    ];
    for (const c of candidates) {
      if (c && typeof c === 'string') {
        const resolved = resolveBranch(c);
        if (resolved === 'AIML' || resolved === 'AIDS') {
          return resolved;
        }
      }
    }
    return 'CSE';
  }

  const raw = String(input).trim();
  const lower = raw.toLowerCase();
  const upper = raw.toUpperCase();

  // Dynamic registered UUID mapping
  if (DYNAMIC_DEPARTMENT_MAP.has(lower)) {
    const mapped = DYNAMIC_DEPARTMENT_MAP.get(lower);
    if (typeof mapped === 'string') return resolveBranch(mapped);
    if (mapped && mapped.branch) return mapped.branch;
    if (mapped && mapped.code) return resolveBranch(mapped.code);
  }

  // Exact & Pattern Matches for AIML
  if (
    upper === 'AIML' ||
    upper === 'CSE-AIML' ||
    upper === 'CSE_AIML' ||
    upper === 'DEPT-AIML' ||
    lower === 'a0000000-0000-0000-0000-000000000002' ||
    upper.includes('MACHINE LEARNING') ||
    upper.includes('AIML') ||
    upper.includes('A42') ||
    upper.startsWith('23ML') ||
    upper.startsWith('22ML') ||
    upper.startsWith('24ML') ||
    upper.startsWith('21ML')
  ) {
    return 'AIML';
  }

  // Exact & Pattern Matches for AIDS
  if (
    upper === 'AIDS' ||
    upper === 'CSE-AIDS' ||
    upper === 'CSE_AIDS' ||
    upper === 'DEPT-AIDS' ||
    lower === 'a0000000-0000-0000-0000-000000000003' ||
    upper.includes('DATA SCIENCE') ||
    upper.includes('AIDS') ||
    upper.includes('A54') ||
    upper.startsWith('23DS') ||
    upper.startsWith('22DS') ||
    upper.startsWith('24DS') ||
    upper.startsWith('21DS')
  ) {
    return 'AIDS';
  }

  // Default / Core CSE
  return 'CSE';
}

/**
 * Display transformation:
 * department = CSE + branch = CSE  → CSE
 * department = CSE + branch = AIML → CSE-AIML
 * department = CSE + branch = AIDS → CSE-AIDS
 */
export function getBranchDisplay(department, branch) {
  const b = resolveBranch(branch !== undefined && branch !== null ? branch : department);
  if (b === 'AIML') return 'CSE-AIML';
  if (b === 'AIDS') return 'CSE-AIDS';
  return 'CSE';
}

/**
 * Normalizes branch / department into a canonical branch descriptor.
 * Provided for backward compatibility across modules without throwing ReferenceErrors.
 */
export function normalizeBranch(input) {
  const b = resolveBranch(input);
  const found = MASTER_BRANCHES.find(item => item.branch === b) || MASTER_BRANCHES[0];
  return {
    id: found.id,
    code: found.displayName,
    name: found.name,
    branch: found.branch,
    department: found.department,
    displayName: found.displayName
  };
}

/**
 * Normalizes Year representation into an integer 1, 2, 3, or 4.
 */
export function normalizeYear(input, fallbackSem = null) {
  if (input === 1 || input === 2 || input === 3 || input === 4) return input;
  
  const str = String(input || '').toUpperCase().trim();
  const digits = str.replace(/\D/g, '');
  if (digits) {
    const num = Number(digits);
    if (num >= 1 && num <= 4) return num;
  }

  if (str.includes('IV') || str.includes('FOURTH') || str.includes('4TH')) return 4;
  if (str.includes('III') || str.includes('THIRD') || str.includes('3RD')) return 3;
  if (str.includes('II') || str.includes('SECOND') || str.includes('2ND')) return 2;
  if (str.includes('I') || str.includes('FIRST') || str.includes('1ST')) return 1;

  if (fallbackSem) {
    const numSem = normalizeSemester(fallbackSem);
    return Math.max(1, Math.min(4, Math.ceil(numSem / 2)));
  }

  return 4;
}

/**
 * Normalizes Semester representation into an integer 1, 2, 3, 4, 5, 6, 7, or 8.
 */
export function normalizeSemester(input, fallbackYear = null) {
  if (input >= 1 && input <= 8) return Number(input);

  const str = String(input || '').toUpperCase().trim();
  const digits = str.replace(/\D/g, '');
  if (digits) {
    const num = Number(digits);
    if (num >= 1 && num <= 8) return num;
  }

  if (str.includes('VIII') || str.includes('8TH')) return 8;
  if (str.includes('VII') || str.includes('7TH')) return 7;
  if (str.includes('VI') || str.includes('6TH')) return 6;
  if (str.includes('V') || str.includes('5TH')) return 5;
  if (str.includes('IV') || str.includes('4TH')) return 4;
  if (str.includes('III') || str.includes('3RD')) return 3;
  if (str.includes('II') || str.includes('2ND')) return 2;
  if (str.includes('I') || str.includes('1ST')) return 1;

  if (fallbackYear) {
    const numYear = normalizeYear(fallbackYear);
    return (numYear * 2) - 1;
  }

  return 7;
}

/**
 * Normalizes Section into a clean single uppercase letter ('A', 'B', 'C', 'D').
 */
export function normalizeSection(input) {
  if (!input) return 'A';
  const str = String(input).toUpperCase().trim();
  const clean = str.replace(/SECTION|SEC|[:\s\-_]/gi, '');
  if (clean.length > 0) {
    const firstChar = clean.charAt(0);
    if (firstChar >= 'A' && firstChar <= 'Z') return firstChar;
  }
  return 'A';
}

/**
 * Normalizes Academic Year string ('2025-2026').
 */
export function normalizeAcademicYear(input) {
  if (!input) return '2025-2026';
  const str = String(input).trim().replace(/[\u2012-\u2015\u2212\/\s_]+/g, '-');
  if (str.includes('2025') && str.includes('2026')) return '2025-2026';
  if (str.includes('25') && str.includes('26')) return '2025-2026';
  return str || '2025-2026';
}

/**
 * Normalizes Regulation string ('AR23', 'R20', 'R23').
 */
export function normalizeRegulation(input) {
  if (!input) return 'AR23';
  const str = String(input).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
  if (str.includes('20')) return 'R20';
  if (str.includes('23')) return 'AR23';
  return str || 'AR23';
}

/**
 * Checks whether a user / student is in active status.
 */
export function isUserActive(user) {
  if (!user) return false;
  const status = String(user.status || user.rawStatus || 'active').toLowerCase().trim();
  return status === 'active' || status === 'approved' || status === 'enrolled' || status === 'verified';
}

/**
 * Extracts a Canonical Academic Cohort object from any student, faculty assignment, or form entity.
 */
export function extractCanonicalCohort(entity) {
  if (!entity) return null;

  const department = resolveDepartment(entity);
  const branch = resolveBranch(entity);
  const branchDisplayName = getBranchDisplay(department, branch);

  const year = normalizeYear(entity.year, entity.semester);
  const semester = normalizeSemester(entity.semester, year);
  const section = normalizeSection(entity.section);
  const academicYear = normalizeAcademicYear(entity.academicYear || entity.academic_year);
  const regulation = normalizeRegulation(entity.regulation);

  const matchedMaster = MASTER_BRANCHES.find(b => b.branch === branch) || MASTER_BRANCHES[0];
  const rawDeptId = entity.departmentId || entity.department_id;
  const isUuidDept = rawDeptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawDeptId).trim());

  return {
    department,
    branch,
    branchDisplayName,
    branchId: branch,
    departmentId: isUuidDept ? String(rawDeptId).trim() : matchedMaster.id,
    departmentCode: branchDisplayName,
    departmentName: matchedMaster.name,
    year,
    semester,
    section,
    academicYear,
    regulation,
    cohortKey: `${department}_${branch}_Y${year}_S${semester}_SEC${section}_${academicYear}`
  };
}

/**
 * Determines whether a student belongs to the specified academic cohort.
 * Matches using BOTH:
 * student.department === assignment.department
 * AND
 * student.branch === assignment.branch
 * PLUS:
 * student.year === assignment.year
 * student.semester === assignment.semester
 * student.section === assignment.section
 * student.academicYear === assignment.academicYear
 * student.status === "Active"
 */
export function matchesCohort(student, assignmentOrCohort) {
  if (!student || !assignmentOrCohort) return false;
  if (!isUserActive(student)) return false;

  const sCohort = extractCanonicalCohort(student);
  const aCohort = extractCanonicalCohort(assignmentOrCohort);
  if (!sCohort || !aCohort) return false;

  const matchDepartment = sCohort.department === aCohort.department;
  const matchBranch = sCohort.branch === aCohort.branch;
  const matchYear = sCohort.year === aCohort.year;
  const matchSemester = sCohort.semester === aCohort.semester;
  const matchSection = sCohort.section === aCohort.section;
  const matchAcademicYear = !sCohort.academicYear || !aCohort.academicYear || sCohort.academicYear === aCohort.academicYear;

  return matchDepartment && matchBranch && matchYear && matchSemester && matchSection && matchAcademicYear;
}

export default {
  MASTER_BRANCHES,
  CANONICAL_DEPARTMENTS,
  DYNAMIC_DEPARTMENT_MAP,
  registerDepartments,
  resolveDepartment,
  resolveBranch,
  getBranchDisplay,
  normalizeBranch,
  normalizeYear,
  normalizeSemester,
  normalizeSection,
  normalizeAcademicYear,
  normalizeRegulation,
  isUserActive,
  extractCanonicalCohort,
  matchesCohort
};
