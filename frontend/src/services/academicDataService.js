// GMR CRM - Academic Data Service (Direct Supabase Integration with Master Catalogue Fallback)
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { isValidUuid } from './ragDocumentService.js';
import userManagementService from './userManagementService.js';
import facultyAssignmentService from './facultyAssignmentService.js';

import { normalizeBranch, registerDepartments } from './academicCohortService.js';

export const MASTER_DEPARTMENTS = [
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science and Engineering' },
  { id: 'dept-aids', code: 'CSE-AIDS', name: 'CSE - Artificial Intelligence and Data Science' },
  { id: 'dept-aiml', code: 'CSE-AIML', name: 'CSE - Artificial Intelligence and Machine Learning' },
  { id: 'dept-it', code: 'IT', name: 'Information Technology' },
  { id: 'dept-ece', code: 'ECE', name: 'Electronics and Communication Engineering' },
  { id: 'dept-eee', code: 'EEE', name: 'Electrical and Electronics Engineering' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering' },
  { id: 'dept-civil', code: 'CIVIL', name: 'Civil Engineering' }
];

export const MASTER_SUBJECTS = [
  // Semester 3 (2nd Year)
  { id: 'sub-ps-python', code: '23CS301', name: 'Problem Solving using Python', semester: 3, credits: 4, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-econ-pm', code: '23HSX10', name: 'Engineering Economics and Project Management', semester: 3, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-ai-3', code: '23ML302', name: 'Artificial Intelligence', semester: 3, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-daa-3', code: '23CS303', name: 'Design and Analysis of Algorithms', semester: 3, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-dld-3', code: '23CS304', name: 'Digital Logic Design', semester: 3, credits: 4, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-dms-3', code: '23CS305', name: 'Discrete Mathematical Structures', semester: 3, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-java-3', code: '23CS306', name: 'Object Oriented Programming with JAVA', semester: 3, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },

  // Semester 4 (2nd Year)
  { id: 'sub-dbms-4', code: '23IT304', name: 'Database Management Systems', semester: 4, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-os-4', code: '23IT403', name: 'Operating Systems', semester: 4, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-coa-4', code: '23CS403', name: 'Computer Organization and Architecture', semester: 4, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-prob-stats', code: '23MA404', name: 'Probability and Statistics using Python', semester: 4, credits: 4, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-web-dev', code: '23CS405', name: 'Web Coding and Development', semester: 4, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-fds-4', code: '23DS405', name: 'Foundations of Data Science', semester: 4, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-aids' },
  { id: 'sub-fml-4', code: '23ML405', name: 'Foundations of Machine Learning', semester: 4, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-aiml' },

  // Semester 5 (3rd Year)
  { id: 'sub-mpmc-5', code: '23EC502', name: 'Microprocessors and Microcontrollers (Integrated)', semester: 5, credits: 4, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-ml-5', code: '23CS502', name: 'Machine Learning', semester: 5, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-cn-5', code: '23CS503', name: 'Computer Networks (Integrated)', semester: 5, credits: 4, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-toc-5', code: '23CS504', name: 'Theory of Computation', semester: 5, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-wt-5', code: '23IT405', name: 'Web Technologies', semester: 5, credits: 4, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-ann-5', code: '23CSC11', name: 'Artificial Neural Networks', semester: 5, credits: 3, regulation: 'AR23', subjectType: 'PROFESSIONAL_ELECTIVE', departmentId: 'dept-cse' },
  { id: 'sub-cv-5', code: '23MLC11', name: 'Computer Vision & Pattern Recognition', semester: 5, credits: 3, regulation: 'AR23', subjectType: 'PROFESSIONAL_ELECTIVE', departmentId: 'dept-aiml' },
  { id: 'sub-cloud-5', code: '23MLC31', name: 'Fundamentals of Cloud Computing', semester: 5, credits: 3, regulation: 'AR23', subjectType: 'PROFESSIONAL_ELECTIVE', departmentId: 'dept-cse' },

  // Semester 6 (3rd Year)
  { id: 'sub-cd-6', code: '23CS601', name: 'Compiler Design', semester: 6, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-cns-6', code: '23CS602', name: 'Cryptography and Network Security', semester: 6, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-se-6', code: '23CS603', name: 'Software Engineering & Agile Methodologies', semester: 6, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-nlp-6', code: '23ML601', name: 'Natural Language Processing', semester: 6, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-aiml' },

  // Semester 7 (4th Year)
  { id: 'sub-llm-7', code: '23ML002', name: 'Large Language Models', semester: 7, credits: 3, regulation: 'AR23', subjectType: 'PROFESSIONAL_ELECTIVE', departmentId: '835f1428-d1ec-47b9-87e0-d281feba4234' },
  { id: 'sub-ai-7', code: '23ML302', name: 'Artificial Intelligence', semester: 7, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-aiml' },
  { id: 'sub-nlp-7', code: '23CSC13', name: 'Natural Language Processing', semester: 7, credits: 3, regulation: 'AR23', subjectType: 'PROFESSIONAL_ELECTIVE', departmentId: 'dept-cse' },
  { id: 'sub-ml-7', code: '23CS502', name: 'Machine Learning', semester: 7, credits: 3, regulation: 'AR23', subjectType: 'PROFESSIONAL_ELECTIVE', departmentId: 'dept-cse' },
  { id: 'sub-cloud-devops-7', code: '23CS701', name: 'Cloud Computing & DevOps', semester: 7, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-bda-7', code: '23CS702', name: 'Big Data Analytics', semester: 7, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },
  { id: 'sub-dl-7', code: '23ML701', name: 'Deep Learning & Reinforcement Learning', semester: 7, credits: 3, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-aiml' },
  { id: 'sub-proj-7', code: '23CS703', name: 'Full Stack Capstone Project', semester: 7, credits: 4, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' },

  // Semester 8 (4th Year)
  { id: 'sub-major-proj-8', code: '23CS801', name: 'Major Project / Industry Internship', semester: 8, credits: 10, regulation: 'AR23', subjectType: 'CORE', departmentId: 'dept-cse' }
];

class AcademicDataService {
  /**
   * Fetch all academic departments directly from Supabase `departments` table, with full master catalogue fallback.
   */
  async getDepartments() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name, code, created_at')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          const formatted = data.map(item => {
            const canonical = normalizeBranch(item.code || item.name || item.id);
            const rawCode = (item.code || '').trim().toUpperCase();
            return {
              id: item.id,
              code: rawCode || canonical.branch, // Authoritative DB code: 'AIML', 'AIDS', 'CSE'
              rawCode: rawCode,
              branch: canonical.branch,          // 'AIML', 'AIDS', 'CSE'
              displayCode: canonical.code,       // Display: 'CSE-AIML', 'CSE-AIDS', 'CSE'
              name: item.name || canonical.name
            };
          });
          registerDepartments(formatted);
          return {
            data: formatted,
            source: 'supabase',
            error: null
          };
        }
      } catch (err) {
        console.warn('[AcademicDataService] Exception fetching departments, using master catalogue:', err);
      }
    }

    registerDepartments(MASTER_DEPARTMENTS);
    return {
      data: MASTER_DEPARTMENTS,
      source: 'local_catalogue',
      error: null
    };
  }

  /**
   * Fetch academic subjects directly from Supabase `subjects`, with master catalogue fallback.
   * Returns complete subject records with code, name, credits, semester, regulation, department.
   */
  async getSubjects(departmentIdOrCode = null) {
    let supabaseSubjects = [];

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('subjects').select(`
          id,
          name,
          code,
          semester,
          credits,
          subject_type,
          elective_group,
          regulation,
          subject_departments (
            department_id,
            departments ( id, code, name )
          )
        `).order('name', { ascending: true });

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          supabaseSubjects = data.map(s => {
            const sDepts = s.subject_departments || [];
            const deptIds = sDepts.map(sd => sd.department_id).filter(Boolean);
            const deptCodes = sDepts.map(sd => sd.departments?.code?.toUpperCase()).filter(Boolean);
            const primaryDeptId = deptIds[0] || s.department_id || null;
            return {
              id: s.id,
              code: s.code || '',
              name: s.name || '',
              semester: Number(s.semester) || 1,
              credits: Number(s.credits) || 3,
              subjectType: s.subject_type || 'CORE',
              electiveGroup: s.elective_group || null,
              regulation: s.regulation || 'AR23',
              departmentId: primaryDeptId,
              departmentIds: deptIds,
              departmentCodes: deptCodes,
              subjectDepartments: sDepts
            };
          });
        }
      } catch (err) {
        console.warn('[AcademicDataService] Exception querying subjects from Supabase, using master catalogue:', err);
      }
    }

    // Combine Supabase subjects with Master catalogue (deduplicated by code & name)
    const combinedMap = new Map();
    MASTER_SUBJECTS.forEach(s => combinedMap.set(s.id, s));
    MASTER_SUBJECTS.forEach(s => combinedMap.set(s.code, s));
    supabaseSubjects.forEach(s => {
      combinedMap.set(s.id, s);
      combinedMap.set(s.code, s);
    });

    const allDistinctSubjects = Array.from(new Set(Array.from(combinedMap.values())));

    let filtered = allDistinctSubjects;
    if (departmentIdOrCode && departmentIdOrCode !== 'All') {
      const targetDept =
        MASTER_DEPARTMENTS.find(
          d =>
            d.id === departmentIdOrCode ||
            d.code === departmentIdOrCode
        ) || {
          id: departmentIdOrCode,
          code: departmentIdOrCode
        };

      const targetCode = String(
        targetDept?.code || departmentIdOrCode
      ).toUpperCase();

      const targetId = String(
        targetDept?.id || departmentIdOrCode
      ).toLowerCase();

      filtered = allDistinctSubjects.filter(s => {
        // Direct ID match
        if (s.departmentId && String(s.departmentId).toLowerCase() === targetId) return true;
        if (Array.isArray(s.departmentIds) && s.departmentIds.some(id => String(id).toLowerCase() === targetId)) return true;

        // Code match
        if (Array.isArray(s.departmentCodes) && s.departmentCodes.some(c => c.toUpperCase() === targetCode)) return true;

        // Pattern match fallback for legacy / master data
        if (targetCode.includes('AIML') && (s.code?.startsWith('23ML') || s.departmentId === 'dept-aiml')) return true;
        if (targetCode.includes('AIDS') && (s.code?.startsWith('23DS') || s.departmentId === 'dept-aids')) return true;
        if (targetCode === 'CSE' && (s.code?.startsWith('23CS') || s.departmentId === 'dept-cse')) return true;

        return false;
      });
    }

    return {
      data: filtered,
      source: supabaseSubjects.length > 0 ? 'supabase' : 'local_catalogue',
      error: null
    };
  }

  /**
   * Get single subject by ID or Code from catalogue/database.
   */
  async getSubjectById(subjectIdOrCode) {
    if (!subjectIdOrCode) return null;

    if (isSupabaseConfigured() && isValidUuid(subjectIdOrCode)) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select(`
            id,
            name,
            code,
            semester,
            credits,
            subject_type,
            elective_group,
            regulation
          `)
          .eq('id', subjectIdOrCode)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            code: data.code || '',
            name: data.name || '',
            semester: Number(data.semester) || 1,
            credits: Number(data.credits) || 3,
            subjectType: data.subject_type || 'CORE',
            electiveGroup: data.elective_group || null,
            regulation: data.regulation || 'AR23'
          };
        }
      } catch (err) {
        console.warn('[AcademicDataService] Exception fetching subject by id:', err);
      }
    }

    // Lookup in master subjects
    return MASTER_SUBJECTS.find(s => s.id === subjectIdOrCode || s.code === subjectIdOrCode) || null;
  }

  /**
   * Fetch all active faculty members with their user profiles and department details.
   */
  async getFaculty() {
    try {
      const allUsers = await userManagementService.getAllUsers();
      const faculty = allUsers.filter(u => u.role === 'faculty' && u.rawStatus === 'active');
      return {
        data: faculty,
        source: 'supabase',
        error: null
      };
    } catch (err) {
      console.error('[AcademicDataService] Exception fetching faculty:', err);
      return {
        data: [],
        source: 'supabase',
        error: err.message
      };
    }
  }

  /**
   * Fetch all students from the database joined with user profile and department metadata.
   */
  async getStudents(filters = {}) {
    try {
      const allUsers = await userManagementService.getAllUsers();
      let students = allUsers.filter(u => u.role === 'student');

      if (filters.departmentId) {
        students = students.filter(s => s.departmentId === filters.departmentId);
      }
      if (filters.year && filters.year !== 'All') {
        students = students.filter(s => String(s.year) === String(filters.year));
      }
      if (filters.semester && filters.semester !== 'All') {
        students = students.filter(s => String(s.semester) === String(filters.semester));
      }
      if (filters.section && filters.section !== 'All') {
        students = students.filter(s => s.section === String(filters.section).toUpperCase());
      }

      const formatted = students.map(s => ({
        id: s.id || s.userId,
        user_id: s.userId || s.id,
        name: s.name,
        email: s.email,
        roll_number: s.rollNumber || 'N/A',
        rollNumber: s.rollNumber || 'N/A',
        department: s.department,
        departmentId: s.departmentId,
        year: s.year,
        semester: s.semester,
        section: s.section || 'A',
        program: s.program || 'B.Tech',
        attendance: 88,
        status: s.status || 'Active',
        isAtRisk: false,
        user: {
          full_name: s.name,
          email: s.email
        }
      }));

      return {
        data: formatted,
        source: 'supabase',
        error: null
      };
    } catch (err) {
      console.error('[AcademicDataService] Exception fetching students:', err);
      return {
        data: [],
        source: 'supabase',
        error: err.message
      };
    }
  }

  /**
   * Get Assigned Classes for a specific Faculty user.
   */
  async getFacultyAssignedClasses(facultyUserId) {
    return facultyAssignmentService.getFacultyAssignedClasses(facultyUserId);
  }

  /**
   * Get Students belonging to the sections assigned to a specific Faculty.
   */
  async getFacultyAssignedStudents(facultyUserId, selectedSection = null) {
    return facultyAssignmentService.getFacultyAssignedStudents(facultyUserId, selectedSection);
  }

  /**
   * Get Enrolled Subjects & Assigned Faculty for a logged-in Student.
   */
  async getStudentAssignedSubjects(studentUserId, studentProfile = null) {
    return facultyAssignmentService.getStudentAssignedSubjects(studentUserId, studentProfile);
  }

  /**
   * Fetch verified student profile with department / branch details from public.students.
   * Resolves existing branch/stream, semester, year, FSI status, and career path.
   */
  async getStudentProfile(userId = null) {
    let targetUid = userId;

    if (!targetUid && isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        targetUid = authData?.user?.id || null;
      } catch (e) {
        console.warn('[AcademicDataService] Could not resolve auth user:', e);
      }
    }

    if (!isSupabaseConfigured() || !targetUid) {
      return {
        branch: 'CSE',
        branchCode: 'CSE',
        departmentName: 'Computer Science & Engineering',
        semester: 4,
        year: 2,
        section: 'A',
        program: 'B.Tech',
        isFSI: false,
        careerPath: null
      };
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          roll_number,
          department_id,
          semester,
          year,
          section,
          program,
          departments ( id, code, name )
        `)
        .eq('user_id', targetUid)
        .maybeSingle();

      if (error) {
        console.warn('[AcademicDataService] Notice querying student profile:', error.message);
      }

      const deptCode = data?.departments?.code || '';
      const deptName = data?.departments?.name || '';
      const rawBranch = deptCode || deptName || 'CSE';

      // Safe normalization for branch
      let branchCode = 'CSE';
      const cleanUpper = rawBranch.toUpperCase();
      if (cleanUpper.includes('AIML') || cleanUpper.includes('MACHINE LEARNING')) {
        branchCode = 'CSE-AIML';
      } else if (
        cleanUpper.includes('AIDS') ||
        cleanUpper.includes('DATA SCIENCE') ||
        cleanUpper.includes('AI&DS') ||
        cleanUpper.includes('AI & DS')
      ) {
        branchCode = 'CSE-AIDS';
      } else {
        branchCode = 'CSE';
      }

      return {
        id: data?.id || null,
        userId: targetUid,
        rollNumber: data?.roll_number || '',
        branch: branchCode,
        branchCode: branchCode,
        departmentName: deptName || 'Computer Science & Engineering',
        semester: data?.semester || 1,
        year: data?.year || 1,
        section: data?.section || 'A',
        program: data?.program || 'B.Tech',
        isFSI: Boolean(data?.is_fsi || data?.isFSI),
        careerPath: data?.career_path || data?.careerPath || null
      };
    } catch (err) {
      console.warn('[AcademicDataService] Exception fetching student profile:', err);
      return {
        branch: 'CSE',
        branchCode: 'CSE',
        departmentName: 'Computer Science & Engineering',
        semester: 4,
        year: 2,
        section: 'A',
        program: 'B.Tech',
        isFSI: false,
        careerPath: null
      };
    }
  }
}

export const academicDataService = new AcademicDataService();
export default academicDataService;
