// GMR CRM - User Management & Admin Governance Service
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import auditService from './auditService.js';
import {
  normalizeBranch,
  resolveBranch,
  resolveDepartment,
  getBranchDisplay,
  normalizeYear,
  normalizeSemester,
  normalizeSection,
  normalizeAcademicYear,
  normalizeRegulation,
  extractCanonicalCohort
} from './academicCohortService.js';

const LOCAL_USERS_STORE_KEY = 'gmrit_users_store';

export const DEFAULT_USERS = [
  {
    id: 'user-admin',
    userId: 'user-admin',
    email: 'admin@gmrit.edu.in',
    name: 'Administrator',
    role: 'admin',
    displayRole: 'Admin',
    status: 'Active',
    rawStatus: 'active',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    designation: 'System Administrator'
  },
  {
    id: 'fac-anand',
    userId: 'fac-anand',
    email: 'faculty@gmrit.edu.in',
    name: 'Anand Rao',
    role: 'faculty',
    displayRole: 'Faculty',
    status: 'Active',
    rawStatus: 'active',
    employeeId: 'FAC550',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    designation: 'Associate Professor'
  },
  {
    id: 'fac-sudhakar',
    userId: 'fac-sudhakar',
    email: 'sudhakar@gmrit.edu.in',
    name: 'Dr. Sudhakar',
    role: 'faculty',
    displayRole: 'Faculty',
    status: 'Active',
    rawStatus: 'active',
    employeeId: '52413',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    designation: 'Professor'
  },
  {
    id: 'fac-ravi',
    userId: 'fac-ravi',
    email: 'ravi.kumar@gmrit.edu.in',
    name: 'Dr. Ravi Kumar',
    role: 'faculty',
    displayRole: 'Faculty',
    status: 'Active',
    rawStatus: 'active',
    employeeId: 'FAC552',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    designation: 'Assistant Professor'
  },
  {
    id: 'fac-priya',
    userId: 'fac-priya',
    email: 'priya.rao@gmrit.edu.in',
    name: 'Dr. Priya Rao',
    role: 'faculty',
    displayRole: 'Faculty',
    status: 'Active',
    rawStatus: 'active',
    employeeId: 'FAC553',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    designation: 'Assistant Professor'
  },

  // 4th Year Sem 7 Section A Students (CSE Branch)
  {
    id: 'std-rahul',
    userId: 'std-rahul',
    email: 'student@gmrit.edu.in',
    name: 'Rahul Kumar',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS001',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-priya-s',
    userId: 'std-priya-s',
    email: 'priya.23cs002@gmrit.edu.in',
    name: 'Priya Sharma',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS002',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-aditya',
    userId: 'std-aditya',
    email: 'aditya.23cs003@gmrit.edu.in',
    name: 'Aditya Varma',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS003',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-sneha',
    userId: 'std-sneha',
    email: 'sneha.23cs004@gmrit.edu.in',
    name: 'Sneha Reddy',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS004',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },

  // 4th Year Sem 7 Section A Students (AIML Branch)
  {
    id: 'std-vikram-aiml',
    userId: 'std-vikram-aiml',
    email: 'vikram.23ml001@gmrit.edu.in',
    name: 'Vikram Joshi',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23ML001',
    department: 'CSE',
    branch: 'AIML',
    branchId: 'AIML',
    departmentId: 'dept-aiml',
    departmentCode: 'CSE-AIML',
    branchDisplayName: 'CSE-AIML',
    departmentName: 'CSE - Artificial Intelligence and Machine Learning',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-pooja-aiml',
    userId: 'std-pooja-aiml',
    email: 'pooja.23ml002@gmrit.edu.in',
    name: 'Pooja Hegde',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23ML002',
    department: 'CSE',
    branch: 'AIML',
    branchId: 'AIML',
    departmentId: 'dept-aiml',
    departmentCode: 'CSE-AIML',
    branchDisplayName: 'CSE-AIML',
    departmentName: 'CSE - Artificial Intelligence and Machine Learning',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-tru-aiml',
    userId: 'std-tru-aiml',
    email: 'tru@gmail.com',
    name: 'Tiru Student',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '06',
    department: 'CSE',
    branch: 'AIML',
    branchId: 'AIML',
    departmentId: 'dept-aiml',
    departmentCode: 'CSE-AIML',
    branchDisplayName: 'CSE-AIML',
    departmentName: 'CSE - Artificial Intelligence and Machine Learning',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },

  // 4th Year Sem 7 Section A Students (AIDS Branch)
  {
    id: 'std-dinesh-aids',
    userId: 'std-dinesh-aids',
    email: 'dinesh.23ds001@gmrit.edu.in',
    name: 'Dinesh Karthik',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23DS001',
    department: 'CSE',
    branch: 'AIDS',
    branchId: 'AIDS',
    departmentId: 'dept-aids',
    departmentCode: 'CSE-AIDS',
    branchDisplayName: 'CSE-AIDS',
    departmentName: 'CSE - Artificial Intelligence and Data Science',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-sanya-aids',
    userId: 'std-sanya-aids',
    email: 'sanya.23ds002@gmrit.edu.in',
    name: 'Sanya Malhotra',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23DS002',
    department: 'CSE',
    branch: 'AIDS',
    branchId: 'AIDS',
    departmentId: 'dept-aids',
    departmentCode: 'CSE-AIDS',
    branchDisplayName: 'CSE-AIDS',
    departmentName: 'CSE - Artificial Intelligence and Data Science',
    year: '4',
    semester: '7',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },

  // 4th Year Sem 7 Section B Students
  {
    id: 'std-kiran',
    userId: 'std-kiran',
    email: 'kiran.23cs051@gmrit.edu.in',
    name: 'Kiran Sai',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS051',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '4',
    semester: '7',
    section: 'B',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-divya',
    userId: 'std-divya',
    email: 'divya.23cs052@gmrit.edu.in',
    name: 'Divya Sri',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS052',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '4',
    semester: '7',
    section: 'B',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },

  // 3rd Year Sem 5 Section A Students
  {
    id: 'std-sravan',
    userId: 'std-sravan',
    email: 'sravan.23cs101@gmrit.edu.in',
    name: 'Sravan Kumar',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS101',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '3',
    semester: '5',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  },
  {
    id: 'std-ananya',
    userId: 'std-ananya',
    email: 'ananya.23cs102@gmrit.edu.in',
    name: 'Ananya Rao',
    role: 'student',
    displayRole: 'Student',
    status: 'Active',
    rawStatus: 'active',
    rollNumber: '23CS102',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    branchDisplayName: 'CSE',
    year: '3',
    semester: '5',
    section: 'A',
    program: 'B.Tech',
    regulation: 'AR23',
    academicYear: '2025-2026'
  }
];

class UserManagementService {
  constructor() {
    this._memoryUsers = this._loadLocalStore();
  }

  _sanitizeAndMigrateUsers(users) {
    if (!Array.isArray(users)) return [];
    return users.map(u => {
      const b = resolveBranch(u);
      const branchDisplayName = getBranchDisplay('CSE', b);
      const deptName = b === 'AIML'
        ? 'CSE - Artificial Intelligence and Machine Learning'
        : b === 'AIDS'
        ? 'CSE - Artificial Intelligence and Data Science'
        : 'Computer Science and Engineering';
      const deptId = b === 'AIML' ? 'dept-aiml' : b === 'AIDS' ? 'dept-aids' : 'dept-cse';

      return {
        ...u,
        department: 'CSE',
        branch: b,
        branchId: b,
        departmentCode: branchDisplayName,
        branchDisplayName: branchDisplayName,
        departmentName: deptName,
        departmentId: deptId
      };
    });
  }

  _loadLocalStore() {
    try {
      if (
        typeof window !== 'undefined' &&
        window.localStorage &&
        typeof window.localStorage.getItem === 'function'
      ) {
        const stored = window.localStorage.getItem(LOCAL_USERS_STORE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized = this._sanitizeAndMigrateUsers(parsed);
            this._saveLocalStore(sanitized);
            return sanitized;
          }
        }
      }
    } catch (e) {
      console.warn(
        '[UserManagementService] Could not load local users store:',
        e
      );
    }

    const base = (this._memoryUsers && this._memoryUsers.length > 0) ? this._memoryUsers : DEFAULT_USERS;
    return this._sanitizeAndMigrateUsers(base);
  }

  _saveLocalStore(users) {
    const sanitized = this._sanitizeAndMigrateUsers(users);
    this._memoryUsers = sanitized;

    try {
      if (
        typeof window !== 'undefined' &&
        window.localStorage &&
        typeof window.localStorage.setItem === 'function'
      ) {
        window.localStorage.setItem(
          LOCAL_USERS_STORE_KEY,
          JSON.stringify(sanitized)
        );
      }
    } catch (e) {
      console.warn(
        '[UserManagementService] Could not save local users store:',
        e
      );
    }
  }

  /**
   * Fetch all users joined with students, faculty, and department metadata.
   * Normalizes output into a safe, clean array.
   */
  async getAllUsers() {
    let supabaseUsers = [];

    if (isSupabaseConfigured()) {
      try {
        const { data: users, error: uErr } = await supabase
          .from('users')
          .select(
            'id, email, full_name, role, status, created_at, last_login'
          )
          .order('created_at', { ascending: false });

        if (!uErr && Array.isArray(users) && users.length > 0) {
          const { data: students } = await supabase
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
            `);

          const { data: faculty } = await supabase
            .from('faculty')
            .select(`
              id,
              user_id,
              employee_id,
              department_id,
              designation,
              departments ( id, code, name )
            `);

          const studentMap = new Map(
            (students || []).map((s) => [s.user_id, s])
          );

          const facultyMap = new Map(
            (faculty || []).map((f) => [f.user_id, f])
          );

          supabaseUsers = users.map((u) => {
            const studentInfo = studentMap.get(u.id);
            const facultyInfo = facultyMap.get(u.id);
            const rawRole = (u.role || '').toLowerCase().trim();

            let departmentName = '—';
            let departmentId = null;
            let rollNumber = '';
            let employeeId = '';
            let year = '—';
            let semester = '—';
            let section = '—';
            let program = '—';
            let designation = '';

            if (studentInfo) {
              departmentName =
                studentInfo.departments?.name ||
                studentInfo.departments?.code ||
                'Computer Science and Engineering';

              departmentId =
                studentInfo.department_id || 'dept-cse';

              rollNumber = studentInfo.roll_number || '';

              year = studentInfo.year
                ? String(studentInfo.year).replace(/[^0-9]/g, '') || '1'
                : '1';

              semester = studentInfo.semester
                ? String(studentInfo.semester).replace(/[^0-9]/g, '') || '1'
                : String((Number(year) || 1) * 2 - 1);

              section = studentInfo.section
                ? String(studentInfo.section).trim().toUpperCase()
                : 'A';

              program = studentInfo.program || 'B.Tech';
            } else if (facultyInfo) {
              departmentName =
                facultyInfo.departments?.name ||
                facultyInfo.departments?.code ||
                'Computer Science and Engineering';

              departmentId =
                facultyInfo.department_id || 'dept-cse';

              employeeId = facultyInfo.employee_id || '';

              designation =
                facultyInfo.designation || 'Assistant Professor';
            } else if (rawRole === 'admin') {
              departmentName = 'Institutional Administration';
              designation = 'System Administrator';
            }

            const normalizedStatus = (
              u.status || 'Active'
            ).trim();

            const displayStatus =
              normalizedStatus.charAt(0).toUpperCase() +
              normalizedStatus.slice(1).toLowerCase();

            return {
              id: u.id,
              userId: u.id,
              email: u.email || '',
              name:
                u.full_name ||
                (u.email ? u.email.split('@')[0] : 'User'),
              role: rawRole,
              displayRole: rawRole
                ? rawRole.charAt(0).toUpperCase() +
                  rawRole.slice(1)
                : 'Unknown',
              status: displayStatus,
              rawStatus: normalizedStatus.toLowerCase(),
              department: departmentName,
              departmentId,
              departmentCode:
                studentInfo?.departments?.code ||
                facultyInfo?.departments?.code ||
                '',
              branch:
                studentInfo?.departments?.code ||
                facultyInfo?.departments?.code ||
                departmentId ||
                '',
              rollNumber,
              employeeId,
              year,
              semester,
              section,
              program,
              designation,
              createdAt: u.created_at,
              lastLogin: u.last_login
            };
          });
        }
      } catch (err) {
        console.warn(
          '[UserManagementService] Exception fetching users from Supabase, using local store:',
          err
        );
      }
    }

    let rawMerged = [];
    if (supabaseUsers && supabaseUsers.length > 0) {
      rawMerged = supabaseUsers;
    } else {
      const localUsers = this._loadLocalStore();
      rawMerged = localUsers.length > 0 ? localUsers : [];
    }

    const canonicalUsers = rawMerged.map((u) => {
      const rawRole = (u.role || 'student').toLowerCase().trim();
      const branch = normalizeBranch(u);

      let year = u.year;
      let semester = u.semester;
      let section = u.section;
      let regulation = u.regulation;
      let academicYear = u.academicYear;

      if (rawRole === 'student') {
        const numYear = normalizeYear(u.year, u.semester);
        const numSem = normalizeSemester(u.semester, numYear);
        const cleanSec = normalizeSection(u.section);
        year = String(numYear);
        semester = String(numSem);
        section = cleanSec;
        regulation = normalizeRegulation(u.regulation);
        academicYear = normalizeAcademicYear(u.academicYear);
      }

      const rawStatus = (u.rawStatus || u.status || 'active').toLowerCase().trim();
      const displayStatus = rawStatus === 'pending'
        ? 'Pending Approval'
        : (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1));

      return {
        ...u,
        id: u.id || u.userId,
        userId: u.userId || u.id,
        email: (u.email || '').toLowerCase().trim(),
        name: u.name || u.full_name || 'User',
        role: rawRole,
        displayRole: rawRole ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1) : 'Student',
        status: displayStatus,
        rawStatus,
        department: 'CSE',
        departmentId: branch.id,
        departmentCode: branch.displayName,
        departmentName: branch.name,
        branch: branch.branch,
        branchId: branch.branch,
        branchDisplayName: branch.displayName,
        year: year ? String(year) : '—',
        semester: semester ? String(semester) : '—',
        section: section ? String(section) : '—',
        regulation: regulation || 'AR23',
        academicYear: academicYear || '2025-2026',
        rollNumber: u.rollNumber ? String(u.rollNumber).trim().toUpperCase() : (u.roll_number ? String(u.roll_number).trim().toUpperCase() : ''),
        employeeId: u.employeeId ? String(u.employeeId).trim().toUpperCase() : (u.employee_id ? String(u.employee_id).trim().toUpperCase() : '')
      };
    });

    this._memoryUsers = canonicalUsers;

    return canonicalUsers;
  }

  /**
   * Fetch all pending user registration requests for Admin approval.
   */
  async getPendingRegistrations() {
    const all = await this.getAllUsers();

    return all.filter(
      (u) => u.rawStatus === 'pending'
    );
  }

  /**
   * Admin approves a user registration.
   */
  async approveUser(userId, adminName = 'Admin') {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error(
        'Supabase client not configured or invalid User ID.'
      );
    }

    try {
      const {
        data: rpcRes,
        error: rpcErr
      } = await supabase.rpc(
        'admin_approve_user',
        {
          p_user_id: userId
        }
      );

      if (!rpcErr && rpcRes?.success) {
        auditService.logAction({
          user: adminName,
          role: 'admin',
          userId,
          action: 'Approve User Registration',
          resource: '/admin/users',
          result: 'Success',
          details:
            `User ID [${userId}] registration approved and account activated.`
        });

        return rpcRes;
      }

      const { data, error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      auditService.logAction({
        user: adminName,
        role: 'admin',
        userId,
        action: 'Approve User Registration',
        resource: '/admin/users',
        result: 'Success',
        details:
          `User ID [${userId}] registration approved and account activated.`
      });

      return {
        success: true,
        userId,
        status: 'active'
      };
    } catch (err) {
      console.error(
        '[UserManagementService] Error approving user:',
        err
      );

      throw new Error(
        err.message || 'Failed to approve user registration.'
      );
    }
  }

  /**
   * Admin rejects a user registration.
   */
  async rejectUser(
    userId,
    reason = 'Administrative verification rejected',
    adminName = 'Admin'
  ) {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error(
        'Supabase client not configured or invalid User ID.'
      );
    }

    try {
      const {
        data: rpcRes,
        error: rpcErr
      } = await supabase.rpc(
        'admin_reject_user',
        {
          p_user_id: userId,
          p_reason: reason
        }
      );

      if (!rpcErr && rpcRes?.success) {
        auditService.logAction({
          user: adminName,
          role: 'admin',
          userId,
          action: 'Reject User Registration',
          resource: '/admin/users',
          result: 'Rejected',
          details:
            `User ID [${userId}] registration rejected. Reason: ${reason}`
        });

        return rpcRes;
      }

      const { data, error } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      auditService.logAction({
        user: adminName,
        role: 'admin',
        userId,
        action: 'Reject User Registration',
        resource: '/admin/users',
        result: 'Rejected',
        details:
          `User ID [${userId}] registration rejected. Reason: ${reason}`
      });

      return {
        success: true,
        userId,
        status: 'rejected'
      };
    } catch (err) {
      console.error(
        '[UserManagementService] Error rejecting user:',
        err
      );

      throw new Error(
        err.message || 'Failed to reject user registration.'
      );
    }
  }

  /**
   * Toggle or set status.
   */
  async setUserStatus(
    userId,
    status,
    adminName = 'Admin'
  ) {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error(
        'Supabase client not configured or invalid User ID.'
      );
    }

    const cleanStatus = (status || '')
      .toLowerCase()
      .trim();

    try {
      const {
        data: rpcRes,
        error: rpcErr
      } = await supabase.rpc(
        'admin_set_user_status',
        {
          p_user_id: userId,
          p_status: cleanStatus
        }
      );

      if (!rpcErr && rpcRes?.success) {
        auditService.logAction({
          user: adminName,
          role: 'admin',
          userId,
          action: 'Update User Status',
          resource: '/admin/users',
          result: 'Success',
          details:
            `User ID [${userId}] status updated to [${cleanStatus.toUpperCase()}].`
        });

        return rpcRes;
      }

      const { data, error } = await supabase
        .from('users')
        .update({ status: cleanStatus })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      auditService.logAction({
        user: adminName,
        role: 'admin',
        userId,
        action: 'Update User Status',
        resource: '/admin/users',
        result: 'Success',
        details:
          `User ID [${userId}] status updated to [${cleanStatus.toUpperCase()}].`
      });

      return {
        success: true,
        userId,
        status: cleanStatus
      };
    } catch (err) {
      console.error(
        '[UserManagementService] Error updating user status:',
        err
      );

      throw new Error(
        err.message || 'Failed to update user status.'
      );
    }
  }

  /**
   * Single user provisioning by Admin using secure Edge Function.
   */
  async provisionUser(userData) {
    const role = (userData.role || 'student')
      .toLowerCase()
      .trim();

    const email = (userData.email || '')
      .toLowerCase()
      .trim();

    const name = (userData.name || '').trim();

    const defaultPassword =
      role === 'student'
        ? (userData.rollNumber || email.split('@')[0])
        : (userData.employeeId || email.split('@')[0]);

    const password = (
      userData.password ||
      userData.temporaryPassword ||
      defaultPassword
    ).trim();

    const status = (
      userData.status || 'active'
    ).toLowerCase().trim();

    const numYear = userData.year
      ? normalizeYear(userData.year, userData.semester)
      : 1;

    const numSem = userData.semester
      ? normalizeSemester(userData.semester, numYear)
      : (numYear * 2 - 1);

    const section = normalizeSection(userData.section);

    const program = (
      userData.program || 'B.Tech'
    ).trim();

    let targetUserId = userData.id || userData.userId || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (isSupabaseConfigured()) {
      try {
        const {
          data,
          error: fnErr
        } = await supabase.functions.invoke(
          'admin-provision-user',
          {
            body: {
              action: 'single',
              role,
              name,
              email,
              password,
              departmentId:
                userData.departmentId || null,
              rollNumber: userData.rollNumber
                ? String(userData.rollNumber)
                    .trim()
                    .toUpperCase()
                : null,
              employeeId: userData.employeeId
                ? String(userData.employeeId)
                    .trim()
                    .toUpperCase()
                : null,
              program,
              year: numYear,
              semester: numSem,
              section,
              designation:
                userData.designation ||
                'Assistant Professor',
              status
            }
          }
        );

        if (!fnErr && data?.success) {
          if (data.userId) targetUserId = data.userId;
        }
      } catch (err) {
        console.warn(
          '[UserManagementService] admin-provision-user Edge Function notice:',
          err.message
        );
      }

      // Direct table upsert fallback for Admin
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', email)
          .maybeSingle();

        if (existingUser?.id) {
          targetUserId = existingUser.id;
          await supabase
            .from('users')
            .update({
              full_name: name,
              role,
              status
            })
            .eq('id', targetUserId);
        } else {
          const {
            data: userProfile,
            error: uErr
          } = await supabase
            .from('users')
            .insert([
              {
                email,
                full_name: name,
                role,
                status,
                must_change_password: true,
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (!uErr && userProfile?.id) {
            targetUserId = userProfile.id;
          }
        }

        if (role === 'student') {
          const {
            data: existingStudent
          } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', targetUserId)
            .maybeSingle();

          const studentPayload = {
            roll_number: userData.rollNumber
              ? String(userData.rollNumber)
                  .trim()
                  .toUpperCase()
              : null,
            department_id:
              userData.departmentId || null,
            year: numYear,
            semester: numSem,
            section,
            program
          };

          if (existingStudent) {
            await supabase
              .from('students')
              .update(studentPayload)
              .eq('user_id', targetUserId);
          } else {
            await supabase
              .from('students')
              .insert([
                {
                  user_id: targetUserId,
                  ...studentPayload
                }
              ]);
          }
        } else if (role === 'faculty') {
          const {
            data: existingFaculty
          } = await supabase
            .from('faculty')
            .select('id')
            .eq('user_id', targetUserId)
            .maybeSingle();

          const facultyPayload = {
            employee_id: userData.employeeId
              ? String(userData.employeeId)
                  .trim()
                  .toUpperCase()
              : null,
            department_id:
              userData.departmentId || null,
            designation:
              userData.designation ||
              'Assistant Professor'
          };

          if (existingFaculty) {
            await supabase
              .from('faculty')
              .update(facultyPayload)
              .eq('user_id', targetUserId);
          } else {
            await supabase
              .from('faculty')
              .insert([
                {
                  user_id: targetUserId,
                  ...facultyPayload
                }
              ]);
          }
        }
      } catch (dbErr) {
        console.warn('[UserManagementService] Supabase fallback write notice:', dbErr.message);
      }
    }

    const branch = normalizeBranch(userData);
    const cleanYear = role === 'student' ? normalizeYear(userData.year, userData.semester) : null;
    const cleanSem = role === 'student' ? normalizeSemester(userData.semester, cleanYear) : null;
    const cleanSec = role === 'student' ? normalizeSection(userData.section) : null;

      const newUserObj = {
        id: targetUserId,
        userId: targetUserId,
        email,
        name,
        role,
        displayRole: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Student',
        status: status === 'active' ? 'Active' : 'Pending Approval',
        rawStatus: status,
        department: 'CSE',
        departmentId: branch.id,
        departmentCode: branch.displayName,
        departmentName: branch.name,
        branch: branch.branch,
        branchId: branch.branch,
        branchDisplayName: branch.displayName,
        year: cleanYear ? String(cleanYear) : '—',
        semester: cleanSem ? String(cleanSem) : '—',
        section: cleanSec || '—',
        program: program || 'B.Tech',
        regulation: userData.regulation || 'AR23',
        academicYear: userData.academicYear || '2025-2026',
        rollNumber: userData.rollNumber ? String(userData.rollNumber).trim().toUpperCase() : '',
        employeeId: userData.employeeId ? String(userData.employeeId).trim().toUpperCase() : '',
        designation: userData.designation || (role === 'faculty' ? 'Assistant Professor' : ''),
        createdAt: new Date().toISOString()
      };

      const existingUsers = this._loadLocalStore();
      const updatedList = [
        ...existingUsers.filter(u => u.id !== targetUserId && (u.email || '').toLowerCase() !== email),
        newUserObj
      ];
      this._saveLocalStore(updatedList);

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('gmrit_users_updated'));
        window.dispatchEvent(new CustomEvent('gmrit_assignments_updated'));
      }

      auditService.logAction({
        user: 'Admin',
        role: 'admin',
        userId: targetUserId,
        action: 'Provision User Account',
        resource: '/admin/users',
        result: 'Success',
        details:
          `Provisioned new [${role.toUpperCase()}] profile for ${name} (${email}).`
      });

      return {
        success: true,
        userId: targetUserId,
        email,
        name,
        role,
        status,
        tempPass: password
      };
  }

  /**
   * RFC-4180 Compliant CSV Text Parser.
   */
  parseCsv(csvText) {
    if (
      !csvText ||
      typeof csvText !== 'string'
    ) {
      return [];
    }

    const lines = [];
    let row = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (inQuotes) {
        if (
          char === '"' &&
          nextChar === '"'
        ) {
          currentField += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(currentField.trim());
          currentField = '';
        } else if (
          char === '\r' ||
          char === '\n'
        ) {
          row.push(currentField.trim());
          currentField = '';

          if (row.some((f) => f.length > 0)) {
            lines.push(row);
          }

          row = [];

          if (
            char === '\r' &&
            nextChar === '\n'
          ) {
            i++;
          }
        } else {
          currentField += char;
        }
      }
    }

    if (
      currentField.length > 0 ||
      row.length > 0
    ) {
      row.push(currentField.trim());

      if (row.some((f) => f.length > 0)) {
        lines.push(row);
      }
    }

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].map((h) =>
      h
        .toLowerCase()
        .replace(/[\s_-]+/g, '_')
        .trim()
    );

    const dataRows = [];

    for (let i = 1; i < lines.length; i++) {
      const rowValues = lines[i];
      const rowObj = {
        _rowNumber: i + 1
      };

      headers.forEach((h, colIdx) => {
        rowObj[h] =
          rowValues[colIdx] !== undefined
            ? rowValues[colIdx]
            : '';
      });

      dataRows.push(rowObj);
    }

    return dataRows;
  }

  /**
   * Pre-import Student CSV Validation Engine.
   */
  validateStudentCsv(
    dataRows,
    departments = []
  ) {
    return this.validateCsv(
      dataRows,
      departments,
      'student'
    );
  }

  /**
   * Pre-import Faculty CSV Validation Engine.
   */
  validateFacultyCsv(
    dataRows,
    departments = []
  ) {
    return this.validateCsv(
      dataRows,
      departments,
      'faculty'
    );
  }

  /**
   * Universal Smart Pre-Import CSV Validator.
   */
  validateCsv(
    dataRows,
    departments = [],
    defaultRole = 'student'
  ) {
    const validRows = [];
    const invalidRows = [];
    const seenRollNumbers = new Set();
    const seenEmployeeIds = new Set();
    const seenEmails = new Set();

    const deptCodeMap = new Map();

    departments.forEach((d) => {
      if (d.code) {
        deptCodeMap.set(
          d.code.toUpperCase().trim(),
          d.id
        );
      }

      if (d.name) {
        deptCodeMap.set(
          d.name.toUpperCase().trim(),
          d.id
        );
      }
    });

    dataRows.forEach((row, idx) => {
      const errors = [];
      const rowNum =
        row._rowNumber || idx + 2;

      const rawRole = (
        row.role ||
        row.user_role ||
        row.type ||
        row.account_type ||
        ''
      )
        .trim()
        .toLowerCase();

      let rowRole = defaultRole;

      if (
        rawRole === 'faculty' ||
        rawRole === 'teaching_staff' ||
        rawRole === 'teacher' ||
        rawRole === 'prof'
      ) {
        rowRole = 'faculty';
      } else if (
        rawRole === 'student' ||
        rawRole === 'pupil' ||
        rawRole === 'scholar'
      ) {
        rowRole = 'student';
      } else if (
        row.employee_id ||
        row.emp_id ||
        row.faculty_id ||
        row.designation
      ) {
        rowRole = 'faculty';
      } else if (
        row.roll_number ||
        row.roll_no ||
        row.student_id ||
        row.htno ||
        row.year ||
        row.semester
      ) {
        rowRole = 'student';
      }

      const name = (
        row.full_name ||
        row.name ||
        row.student_name ||
        row.faculty_name ||
        ''
      ).trim();

      const email = (
        row.email ||
        row.institutional_email ||
        row.email_address ||
        ''
      )
        .trim()
        .toLowerCase();

      const deptVal = (
        row.department ||
        row.department_code ||
        row.branch ||
        row.dept ||
        ''
      )
        .trim()
        .toUpperCase();

      if (!name || name.length < 2) {
        errors.push(
          'Full Name is required (minimum 2 characters).'
        );
      }

      if (
        !email ||
        !email.includes('@') ||
        !email.includes('.')
      ) {
        errors.push(
          'Valid institutional email address is required.'
        );
      } else if (seenEmails.has(email)) {
        errors.push(
          `Duplicate email "${email}" found in CSV.`
        );
      } else {
        seenEmails.add(email);
      }

      const branchResolved = resolveBranch(deptVal || row.branch || row.roll_number || row.employee_id || email);
      const branchInfo = normalizeBranch(branchResolved);
      const branchDisplayName = getBranchDisplay('CSE', branchResolved);

      let departmentId = null;

      if (deptVal) {
        departmentId =
          deptCodeMap.get(deptVal) ||
          deptCodeMap.get(branchResolved) ||
          deptCodeMap.get(branchDisplayName) ||
          null;
      }

      if (!departmentId) {
        departmentId = branchInfo.id;
      }

      if (rowRole === 'student') {
        const rollNumber = (
          row.roll_number ||
          row.roll_no ||
          row.student_id ||
          row.htno ||
          ''
        )
          .trim()
          .toUpperCase();

        const yearVal =
          row.year ||
          row.academic_year_number ||
          '1';

        const semVal =
          row.semester ||
          row.sem ||
          row.semester_number ||
          '';

        const section = (
          row.section || 'A'
        )
          .trim()
          .toUpperCase();

        const program = (
          row.program || 'B.Tech'
        ).trim();

        if (!rollNumber) {
          errors.push(
            'Student Roll Number is required.'
          );
        } else if (
          seenRollNumbers.has(rollNumber)
        ) {
          errors.push(
            `Duplicate Roll Number "${rollNumber}" found in CSV.`
          );
        } else {
          seenRollNumbers.add(rollNumber);
        }

        const parsedYear =
          parseInt(yearVal, 10) || 1;

        const parsedSem = semVal
          ? (
              parseInt(semVal, 10) ||
              (parsedYear * 2 - 1)
            )
          : (parsedYear * 2 - 1);

        const validatedRecord = {
          _rowNumber: rowNum,
          name,
          email,
          rollNumber,
          departmentVal: deptVal,
          department: 'CSE',
          departmentId,
          departmentCode: branchDisplayName,
          branch: branchResolved,
          branchId: branchResolved,
          branchDisplayName,
          year: parsedYear,
          semester: parsedSem,
          section: section || 'A',
          program: program || 'B.Tech',
          role: 'student'
        };

        if (errors.length > 0) {
          invalidRows.push({
            rowNumber: rowNum,
            rowData: validatedRecord,
            errors
          });
        } else {
          validRows.push(
            validatedRecord
          );
        }
      } else {
        const employeeId = (
          row.employee_id ||
          row.emp_id ||
          row.faculty_id ||
          ''
        )
          .trim()
          .toUpperCase();

        const designation = (
          row.designation ||
          'Assistant Professor'
        ).trim();

        if (!employeeId) {
          errors.push(
            'Faculty Employee ID is required.'
          );
        } else if (
          seenEmployeeIds.has(employeeId)
        ) {
          errors.push(
            `Duplicate Employee ID "${employeeId}" found in CSV.`
          );
        } else {
          seenEmployeeIds.add(employeeId);
        }

        const validatedRecord = {
          _rowNumber: rowNum,
          name,
          email,
          employeeId,
          departmentVal: deptVal,
          department: 'CSE',
          departmentId,
          departmentCode: branchDisplayName,
          branch: branchResolved,
          branchId: branchResolved,
          branchDisplayName,
          designation,
          role: 'faculty'
        };

        if (errors.length > 0) {
          invalidRows.push({
            rowNumber: rowNum,
            rowData: validatedRecord,
            errors
          });
        } else {
          validRows.push(
            validatedRecord
          );
        }
      }
    });

    const studentCount =
      validRows.filter(
        (r) => r.role === 'student'
      ).length;

    const facultyCount =
      validRows.filter(
        (r) => r.role === 'faculty'
      ).length;

    return {
      totalRows: dataRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      studentCount,
      facultyCount,
      isValid: invalidRows.length === 0,
      validRows,
      invalidRows
    };
  }

  /**
   * Universal Bulk Import for Students and Faculty.
   */
  async executeBulkImport(
    validRows,
    fallbackDeptId = null,
    onProgress = null
  ) {
    if (
      !Array.isArray(validRows) ||
      validRows.length === 0
    ) {
      return {
        total: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      };
    }

    const errors = [];
    let succeeded = 0;

    for (
      let i = 0;
      i < validRows.length;
      i++
    ) {
      const row = validRows[i];

      try {
        const branch = resolveBranch(
          row.branch ||
          row.branchId ||
          row.departmentVal ||
          row.departmentCode ||
          row.rollNumber ||
          row.employeeId ||
          row.email
        );
        const branchDisplayName = getBranchDisplay('CSE', branch);
        const branchInfo = normalizeBranch(branch);

        const deptId =
          row.departmentId ||
          branchInfo.id ||
          fallbackDeptId;

        const identifier =
          row.role === 'faculty'
            ? (
                row.employeeId ||
                row.email?.split('@')[0] ||
                ''
              ).trim()
            : (
                row.rollNumber ||
                row.email?.split('@')[0] ||
                ''
              ).trim();

        const tempPass = identifier;

        await this.provisionUser({
          role: row.role || 'student',
          name: row.name,
          email: row.email,
          rollNumber:
            row.role === 'student'
              ? identifier
              : undefined,
          employeeId:
            row.role === 'faculty'
              ? identifier
              : undefined,
          departmentId: deptId,
          department: 'CSE',
          branch: branch,
          branchId: branch,
          departmentCode: branchDisplayName,
          branchDisplayName: branchDisplayName,
          departmentVal: row.departmentVal,
          year: row.year || 1,
          semester: row.semester || 1,
          section: row.section || 'A',
          program: row.program || 'B.Tech',
          designation:
            row.designation || undefined,
          temporaryPassword: tempPass,
          status: 'active'
        });

        succeeded++;
      } catch (err) {
        errors.push(
          `Row ${row._rowNumber} (${row.email}): ${err.message}`
        );
      }

      if (
        typeof onProgress === 'function'
      ) {
        onProgress(
          Math.round(
            ((i + 1) / validRows.length) * 100
          )
        );
      }
    }

    auditService.logAction({
      user: 'Admin',
      role: 'admin',
      userId: 'BULK_IMPORT',
      action: 'Bulk User Import',
      resource: '/admin/users/import',
      result:
        errors.length === 0
          ? 'Success'
          : (
              succeeded > 0
                ? 'Partial Success'
                : 'Failed'
            ),
      details:
        `Bulk imported ${succeeded}/${validRows.length} institutional accounts.`
    });

    return {
      total: validRows.length,
      succeeded,
      failed: errors.length,
      errors
    };
  }

  /**
   * Execute Bulk Import for Students.
   */
  async executeStudentBulkImport(
    validRows,
    fallbackDeptId = null,
    onProgress = null
  ) {
    return this.executeBulkImport(
      validRows,
      fallbackDeptId,
      onProgress
    );
  }

  /**
   * Execute Bulk Import for Faculty.
   */
  async executeFacultyBulkImport(
    validRows,
    fallbackDeptId = null,
    onProgress = null
  ) {
    return this.executeBulkImport(
      validRows,
      fallbackDeptId,
      onProgress
    );
  }

  /**
   * Safe Admin-Only password repair for a specific CSV-imported account.
   */
  async repairImportedUserPassword(
    emailOrUserId
  ) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase client not configured.'
      );
    }

    const identifier =
      (emailOrUserId || '').trim();

    const isEmail =
      identifier.includes('@');

    const {
      data,
      error
    } = await supabase.functions.invoke(
      'admin-provision-user',
      {
        body: {
          action: 'repair_user_password',
          email: isEmail
            ? identifier.toLowerCase()
            : undefined,
          userId: !isEmail
            ? identifier
            : undefined
        }
      }
    );

    if (error) {
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    auditService.logAction({
      user: 'Admin',
      role: 'admin',
      userId: identifier,
      action: 'Repair User Password',
      resource: '/admin/users/repair',
      result: 'Success',
      details:
        `Repaired temporary password to roll/employee ID for ${identifier}.`
    });

    return data;
  }

  /**
   * Safe Admin-Only bulk password repair for all existing CSV-imported accounts.
   */
  async repairAllImportedPasswords() {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase client not configured.'
      );
    }

    const {
      data,
      error
    } = await supabase.functions.invoke(
      'admin-provision-user',
      {
        body: {
          action: 'repair_bulk_passwords',
          allImported: true
        }
      }
    );

    if (error) {
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    auditService.logAction({
      user: 'Admin',
      role: 'admin',
      userId: 'ALL_IMPORTED',
      action: 'Bulk Repair Passwords',
      resource: '/admin/users/repair-all',
      result: 'Success',
      details:
        `Repaired ${data.repairedCount} imported account passwords to JNTU/roll numbers.`
    });

    return data;
  }
}

export const userManagementService =
  new UserManagementService();

export default userManagementService;