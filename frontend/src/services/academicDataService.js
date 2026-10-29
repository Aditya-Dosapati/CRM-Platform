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

    // Semester 7 (4th Year) - AR23 Authoritative Curriculum
  // FSI Prerequisite Subject (FSI Track)
  {
    id: 'sub-devops-7',
    code: '23CS019',
    name: 'Fundamentals of DevOps',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'FSI_REQUIREMENT',
    electiveGroup: 'FSI Prerequisite',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  // Elective V (Career Path Electives - Non-FSI Track)
  {
    id: 'sub-nlp-7',
    code: '23CSC13',
    name: 'Natural Language Processing',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective V',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse'],
    departmentCodes: ['CSE']
  },
  {
    id: 'sub-convai-7',
    code: '23MLC13',
    name: 'Conversational AI',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective V',
    departmentId: 'dept-aiml',
    departmentIds: ['dept-aiml', 'dept-aids'],
    departmentCodes: ['AIML', 'AIDS']
  },
  {
    id: 'sub-webdb-7',
    code: '23CSC23',
    name: 'Web Application Databases',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective V',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  {
    id: 'sub-cloudsec-7',
    code: '23MLC33',
    name: 'Cloud Security Essentials',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective V',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  // Elective VI (Professional Elective - Non-FSI Track)
  // 23ML002 Large Language Models is STRICTLY for AIML only
  {
    id: 'sub-llm-7',
    code: '23ML002',
    name: 'Large Language Models',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VI',
    departmentId: 'dept-aiml',
    departmentIds: ['dept-aiml'],
    departmentCodes: ['AIML']
  },
  {
    id: 'sub-powerbi-7',
    code: '23DS002',
    name: 'Data Visualization with Power BI',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VI',
    departmentId: 'dept-aids',
    departmentIds: ['dept-aids'],
    departmentCodes: ['AIDS']
  },
  {
    id: 'sub-greencomp-7',
    code: '23CS014',
    name: 'Green Computing',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VI',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse'],
    departmentCodes: ['CSE']
  },
  {
    id: 'sub-spm-7',
    code: '23CS015',
    name: 'Software Project Management',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VI',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  {
    id: 'sub-softcomp-7',
    code: '23CS016',
    name: 'Soft Computing',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VI',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse'],
    departmentCodes: ['CSE']
  },
  {
    id: 'sub-rl-7',
    code: '23ML003',
    name: 'Reinforcement Learning',
    semester: 7,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VI',
    departmentId: 'dept-aiml',
    departmentIds: ['dept-aiml', 'dept-aids'],
    departmentCodes: ['AIML', 'AIDS']
  },

  // Semester 8 (4th Year) - AR23 Authoritative Curriculum
  // FSI Capstone Internship (FSI Track)
  {
    id: 'sub-fsi-8',
    code: '23FIX01',
    name: 'Full Semester Internship (FSI)',
    semester: 8,
    credits: 10,
    regulation: 'AR23',
    subjectType: 'INTERNSHIP',
    electiveGroup: 'FSI Track',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  {
    id: 'sub-major-proj-8',
    code: '23CS801',
    name: 'Major Project / Industry Internship',
    semester: 8,
    credits: 10,
    regulation: 'AR23',
    subjectType: 'CORE',
    electiveGroup: 'Capstone',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  // Elective VIII (Professional Elective VIII - Non-FSI Track)
  {
    id: 'sub-sna-8',
    code: '23CS017',
    name: 'Fundamentals of Social Network Analysis',
    semester: 8,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VIII',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse'],
    departmentCodes: ['CSE']
  },
  {
    id: 'sub-irs-8',
    code: '23CS018',
    name: 'Information Retrieval Systems',
    semester: 8,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VIII',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  {
    id: 'sub-devops-8',
    code: '23CS019',
    name: 'Fundamentals of DevOps',
    semester: 8,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VIII',
    departmentId: 'dept-cse',
    departmentIds: ['dept-cse', 'dept-aiml', 'dept-aids'],
    departmentCodes: ['CSE', 'AIML', 'AIDS']
  },
  {
    id: 'sub-cybersec-8',
    code: '23DS003',
    name: 'Cyber Security',
    semester: 8,
    credits: 3,
    regulation: 'AR23',
    subjectType: 'PROFESSIONAL_ELECTIVE',
    electiveGroup: 'Elective VIII',
    departmentId: 'dept-aiml',
    departmentIds: ['dept-aiml', 'dept-aids'],
    departmentCodes: ['AIML', 'AIDS']
  }
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

    // Deduplicate by normalized subject code (Supabase real database records MUST supersede master catalog)
    const subjectMap = new Map();

    // 1. Seed with master catalogue
    MASTER_SUBJECTS.forEach(s => {
      if (s?.code) {
        subjectMap.set(s.code.toUpperCase().trim(), { ...s });
      }
    });

    // 2. Overwrite with Supabase records (authoritative UUIDs & metadata)
    supabaseSubjects.forEach(s => {
      if (s?.code) {
        const codeKey = s.code.toUpperCase().trim();
        const existing = subjectMap.get(codeKey);
        subjectMap.set(codeKey, {
          ...(existing || {}),
          ...s,
          // Guarantee authoritative Supabase attributes
          id: s.id,
          code: s.code,
          name: s.name || existing?.name,
          semester: Number(s.semester) || existing?.semester || 1,
          credits: Number(s.credits) || existing?.credits || 3,
          regulation: s.regulation || existing?.regulation || 'AR23',
          departmentId: s.departmentId || existing?.departmentId,
          departmentIds: (s.departmentIds && s.departmentIds.length > 0) ? s.departmentIds : (existing?.departmentIds || []),
          departmentCodes: (s.departmentCodes && s.departmentCodes.length > 0) ? s.departmentCodes : (existing?.departmentCodes || []),
          subjectType: s.subjectType || existing?.subjectType || 'CORE',
          electiveGroup: s.electiveGroup !== undefined ? s.electiveGroup : existing?.electiveGroup
        });
      }
    });

    const allDistinctSubjects = Array.from(subjectMap.values());

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

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
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
          `);

        if (isValidUuid(subjectIdOrCode)) {
          query = query.eq('id', subjectIdOrCode);
        } else {
          query = query.ilike('code', String(subjectIdOrCode).trim());
        }

        const { data, error } = await query.maybeSingle();

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
        console.warn('[AcademicDataService] Exception fetching subject by id/code:', err);
      }
    }

    // Lookup in master subjects
    const cleanSearch = String(subjectIdOrCode).toUpperCase().trim();
    return MASTER_SUBJECTS.find(s => s.id === subjectIdOrCode || (s.code && s.code.toUpperCase() === cleanSearch)) || null;
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
   * Fetch authorized course resources for logged-in student mapped to their cohort.
   */
  async getStudentResources(studentUserId, studentProfile = null, filters = {}) {
    const { ragDocumentService } = await import('./ragDocumentService.js');
    return ragDocumentService.getStudentResources(studentUserId, studentProfile, filters);
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
        canonicalBranch: 'CSE',
        departmentName: 'Computer Science and Engineering',
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

      // Canonical normalization for branch using academicCohortService
      const canonical = normalizeBranch(rawBranch);
      const branchCode = canonical.code; // 'CSE-AIML', 'CSE-AIDS', 'CSE'
      const canonicalBranch = canonical.branch; // 'AIML', 'AIDS', 'CSE'

      // Check auth user metadata if student record doesn't have is_fsi
      let isFsiMeta = false;
      let careerPathMeta = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        const meta = authData?.user?.user_metadata || {};
        if (meta.is_fsi !== undefined || meta.isFSI !== undefined) {
          isFsiMeta = Boolean(meta.is_fsi ?? meta.isFSI);
        }
        careerPathMeta = meta.career_path || meta.careerPath || null;
      } catch (e) {
        // non-blocking
      }

      const isFsiResolved = Boolean(
        data?.is_fsi ??
        data?.isFSI ??
        isFsiMeta ??
        false
      );

      return {
        id: data?.id || null,
        userId: targetUid,
        rollNumber: data?.roll_number || '',
        branch: branchCode,
        branchCode: branchCode,
        canonicalBranch: canonicalBranch,
        departmentName: deptName || canonical.name,
        semester: data?.semester || 1,
        year: data?.year || 1,
        section: data?.section || 'A',
        program: data?.program || 'B.Tech',
        isFSI: isFsiResolved,
        careerPath: data?.career_path || data?.careerPath || careerPathMeta || null
      };
    } catch (err) {
      console.warn('[AcademicDataService] Exception fetching student profile:', err);
      return {
        branch: 'CSE',
        branchCode: 'CSE',
        canonicalBranch: 'CSE',
        departmentName: 'Computer Science and Engineering',
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
