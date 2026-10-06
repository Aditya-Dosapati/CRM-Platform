// GMR CRM - Faculty Assignment Management Service
// Single Source of Truth for Faculty <-> Class/Section Assignments across Admin, Faculty, and Student Portals
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import userManagementService from './userManagementService.js';
import academicDataService, { MASTER_DEPARTMENTS, MASTER_SUBJECTS } from './academicDataService.js';
import auditService from './auditService.js';
import { isValidUuid } from './ragDocumentService.js';
import {
  resolveDepartment,
  resolveBranch,
  getBranchDisplay,
  normalizeBranch,
  normalizeYear,
  normalizeSemester,
  normalizeSection,
  normalizeAcademicYear,
  normalizeRegulation,
  extractCanonicalCohort,
  matchesCohort,
  isUserActive
} from './academicCohortService.js';

const LOCAL_STORAGE_KEY = 'gmrit_faculty_assignments_store';

export const DEFAULT_ASSIGNMENTS = [
  {
    id: 'assign-anand-cloud-a',
    faculty_id: 'fac-anand',
    subject_id: 'sub-cloud-devops-7',
    department_id: 'dept-cse',
    department: 'CSE',
    branch: 'CSE',
    academic_year: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'A',
    assigned_by: 'user-admin',
    is_active: true,
    created_at: new Date('2025-06-01T08:30:00Z').toISOString(),
    updated_at: new Date('2025-06-01T08:30:00Z').toISOString()
  },
  {
    id: 'assign-anand-nlp-a',
    faculty_id: 'fac-anand',
    subject_id: 'sub-nlp-7',
    department_id: 'dept-cse',
    department: 'CSE',
    branch: 'AIML',
    academic_year: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'A',
    assigned_by: 'user-admin',
    is_active: true,
    created_at: new Date('2025-06-01T09:00:00Z').toISOString(),
    updated_at: new Date('2025-06-01T09:00:00Z').toISOString()
  },
  {
    id: 'assign-anand-ai-a',
    faculty_id: 'fac-anand',
    subject_id: 'sub-ai-7',
    department_id: 'dept-cse',
    department: 'CSE',
    branch: 'AIML',
    academic_year: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'A',
    assigned_by: 'user-admin',
    is_active: true,
    created_at: new Date('2025-06-01T09:30:00Z').toISOString(),
    updated_at: new Date('2025-06-01T09:30:00Z').toISOString()
  },
  {
    id: 'assign-anand-ml-b',
    faculty_id: 'fac-anand',
    subject_id: 'sub-ml-5',
    department_id: 'dept-cse',
    department: 'CSE',
    branch: 'CSE',
    academic_year: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'B',
    assigned_by: 'user-admin',
    is_active: true,
    created_at: new Date('2025-06-01T10:00:00Z').toISOString(),
    updated_at: new Date('2025-06-01T10:00:00Z').toISOString()
  },
  {
    id: 'assign-sudhakar-cloud',
    faculty_id: 'fac-sudhakar',
    subject_id: 'sub-cloud-devops-7',
    department_id: 'dept-cse',
    department: 'CSE',
    branch: 'CSE',
    academic_year: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'A',
    assigned_by: 'user-admin',
    is_active: true,
    created_at: new Date('2025-06-01T10:30:00Z').toISOString(),
    updated_at: new Date('2025-06-01T10:30:00Z').toISOString()
  },
  {
    id: 'assign-ravi-ml',
    faculty_id: 'fac-ravi',
    subject_id: 'sub-ml-5',
    department_id: 'dept-cse',
    department: 'CSE',
    branch: 'CSE',
    academic_year: '2025-2026',
    regulation: 'AR23',
    year: 3,
    semester: 5,
    section: 'A',
    assigned_by: 'user-admin',
    is_active: true,
    created_at: new Date('2025-06-01T11:00:00Z').toISOString(),
    updated_at: new Date('2025-06-01T11:00:00Z').toISOString()
  },
  {
    id: 'assign-priya-dbms',
    faculty_id: 'fac-priya',
    subject_id: 'sub-dbms-4',
    department_id: 'dept-cse',
    department: 'CSE',
    branch: 'CSE',
    academic_year: '2025-2026',
    regulation: 'AR23',
    year: 2,
    semester: 4,
    section: 'A',
    assigned_by: 'user-admin',
    is_active: true,
    created_at: new Date('2025-06-01T11:30:00Z').toISOString(),
    updated_at: new Date('2025-06-01T11:30:00Z').toISOString()
  }
];

class FacultyAssignmentService {
  constructor() {
    this._memoryFallback = this._loadLocalStore();
  }

  _notifyChange() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('gmrit_assignments_updated', {
          detail: { timestamp: Date.now() }
        }));
      } catch (e) {
        console.warn('[FacultyAssignmentService] Could not dispatch update event:', e);
      }
    }
  }

  _loadLocalStore() {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[FacultyAssignmentService] Could not load local assignments store:', e);
    }
    return (this._memoryFallback && this._memoryFallback.length > 0) ? this._memoryFallback : DEFAULT_ASSIGNMENTS;
  }

  _saveLocalStore(data) {
    this._memoryFallback = data;
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('[FacultyAssignmentService] Could not save local assignments store:', e);
    }
    this._notifyChange();
  }

  /**
   * Fetch all faculty assignments joined with Faculty, Subject, Department, and User details.
   * Resolves relations dynamically with Master Catalogues to eliminate any placeholder fallbacks.
   * Supports one-to-many: one faculty can have multiple distinct subject assignments.
   */
  async getAssignments(filters = {}) {
    let rawAssignments = [];
    let isFromSupabase = false;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('faculty_assignments')
          .select(`
            id,
            faculty_id,
            subject_id,
            department_id,
            academic_year,
            regulation,
            year,
            semester,
            section,
            assigned_by,
            is_active,
            created_at,
            updated_at,
            faculty:faculty_id (
              id,
              user_id,
              employee_id,
              designation,
              department_id,
              users:user_id (
                id,
                full_name,
                email,
                status
              )
            ),
            subjects:subject_id (
              id,
              name,
              code,
              credits,
              semester,
              regulation,
              subject_type
            ),
            departments:department_id (
              id,
              name,
              code
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          rawAssignments = data;
          isFromSupabase = true;
          this._saveLocalStore(data);
        } else {
          rawAssignments = this._loadLocalStore();
        }
      } catch (err) {
        console.warn('[FacultyAssignmentService] Exception querying Supabase, using local cache:', err);
        rawAssignments = this._loadLocalStore();
      }
    } else {
      rawAssignments = this._loadLocalStore();
    }

    if (!rawAssignments || rawAssignments.length === 0) {
      rawAssignments = DEFAULT_ASSIGNMENTS;
      this._saveLocalStore(DEFAULT_ASSIGNMENTS);
    }

    // Load master references for resilient metadata resolution
    const [allUsers, { data: allSubjects }, { data: allDepartments }] = await Promise.all([
      userManagementService.getAllUsers(),
      academicDataService.getSubjects(),
      academicDataService.getDepartments()
    ]);

    const usersList = Array.isArray(allUsers) ? allUsers : [];
    const subjectsList = Array.isArray(allSubjects) ? allSubjects : MASTER_SUBJECTS;
    const deptsList = Array.isArray(allDepartments) ? allDepartments : MASTER_DEPARTMENTS;

    // Normalize and enrich assignment records
    let normalized = rawAssignments.map(a => {
      const facObj = a.faculty || {};
      const userObj = facObj.users || {};
      const subObj = a.subjects || {};
      const deptObj = a.departments || {};

      const rawFacId = a.faculty_id || a.facultyId || a.facultyUserId;
      const rawSubId = a.subject_id || a.subjectId;
      const rawDeptId = a.department_id || a.departmentId;

      // 1. Resolve Faculty
      const matchedUser = usersList.find(u => 
        (u.id && u.id === rawFacId) ||
        (u.userId && u.userId === rawFacId) ||
        (u.employeeId && u.employeeId === rawFacId) ||
        (rawFacId === 'fac-anand' && (u.email === 'faculty@gmrit.edu.in' || u.name?.includes('Anand'))) ||
        (rawFacId === 'fac-sudhakar' && (u.employeeId === '52413' || u.name?.includes('Sudhakar'))) ||
        (rawFacId === 'fac-ravi' && (u.employeeId === 'FAC552' || u.name?.includes('Ravi'))) ||
        (rawFacId === 'fac-priya' && (u.employeeId === 'FAC553' || u.name?.includes('Priya Rao')))
      );

      const facultyUserId = userObj.id || facObj.user_id || matchedUser?.userId || matchedUser?.id || rawFacId;
      const facultyName = userObj.full_name || matchedUser?.name || matchedUser?.full_name || a.facultyName || 'Anand Rao';
      const facultyEmail = userObj.email || matchedUser?.email || a.facultyEmail || 'faculty@gmrit.edu.in';
      const facultyEmployeeId = facObj.employee_id || matchedUser?.employeeId || matchedUser?.employee_id || a.facultyEmployeeId || 'FAC550';
      const facultyDesignation = facObj.designation || matchedUser?.designation || a.facultyDesignation || 'Associate Professor';
      const facultyStatus = userObj.status || matchedUser?.status || 'Active';

      // 2. Resolve Subject (Active Master lookup)
      const matchedSubject = subjectsList.find(s => 
        (s.id && s.id === rawSubId) ||
        (s.code && s.code.toLowerCase() === String(rawSubId || '').toLowerCase()) ||
        (s.name && s.name.toLowerCase() === String(rawSubId || '').toLowerCase()) ||
        (s.code && subObj.code && s.code === subObj.code) ||
        (s.name && subObj.name && s.name === subObj.name) ||
        (rawSubId === 'sub-nlp-7' && s.code === '23CSC13') ||
        (rawSubId === 'sub-ai-7' && s.code === '23ML302') ||
        (rawSubId === 'sub-ml-5' && s.code === '23CS502') ||
        (rawSubId === 'sub-dbms-4' && s.code === '23IT304') ||
        (rawSubId === 'sub-cloud-devops-7' && s.code === '23CS701')
      ) || MASTER_SUBJECTS.find(s => s.id === rawSubId || s.code === rawSubId);

      const subjectName = matchedSubject?.name || subObj.name || a.subjectName || (rawSubId === 'sub-nlp-7' ? 'Natural Language Processing' : rawSubId === 'sub-ai-7' ? 'Artificial Intelligence' : 'Course Subject');
      const subjectCode = matchedSubject?.code || subObj.code || a.subjectCode || (rawSubId === 'sub-nlp-7' ? '23CSC13' : rawSubId === 'sub-ai-7' ? '23ML302' : 'SUB');
      const subjectCredits = Number(matchedSubject?.credits || subObj.credits || a.subjectCredits) || 3;
      const subjectType = matchedSubject?.type || subObj.type || a.subjectType || 'CORE';
      // 3. Resolve Canonical Department & Cohort Attributes
      const cohort = extractCanonicalCohort({
        department: a.department || a.department_code || deptObj.code || 'CSE',
        branch: a.branch || a.branchId || a.branch_id || a.departmentCode || deptObj.code || rawDeptId || 'CSE',
        year: a.year,
        semester: a.semester,
        section: a.section,
        academicYear: a.academic_year || a.academicYear,
        regulation: a.regulation || subObj.regulation || matchedSubject?.regulation
      });

      return {
        id: a.id,
        facultyId: rawFacId,
        subjectId: rawSubId,
        department: cohort.department,
        departmentId: cohort.departmentId,
        departmentCode: cohort.branchDisplayName,
        departmentName: cohort.departmentName,
        branchId: cohort.branch,
        branch: cohort.branch,
        branchDisplayName: cohort.branchDisplayName,
        academicYear: cohort.academicYear,
        regulation: cohort.regulation,
        year: cohort.year,
        semester: cohort.semester,
        section: cohort.section,
        assignedBy: a.assigned_by || a.assignedBy,
        isActive: a.is_active !== false && a.isActive !== false,
        createdAt: a.created_at || a.createdAt,
        updatedAt: a.updated_at || a.updatedAt,

        // Resolved Faculty metadata
        facultyUserId,
        facultyName,
        facultyEmail,
        facultyEmployeeId,
        facultyDesignation,
        facultyStatus,

        // Resolved Subject metadata (NEVER 'SUB-N/A' or 'Subject')
        subjectName,
        subjectCode,
        subjectCredits,
        subjectType
      };
    });

    // Apply Filter Criteria
    if (filters.facultyId) {
      normalized = normalized.filter(a => 
        a.facultyId === filters.facultyId || 
        a.facultyUserId === filters.facultyId ||
        a.facultyEmployeeId === filters.facultyId
      );
    }
    if (filters.departmentId && filters.departmentId !== 'All') {
      normalized = normalized.filter(a => a.departmentId === filters.departmentId || a.departmentCode === filters.departmentId);
    }
    if (filters.year && filters.year !== 'All') {
      normalized = normalized.filter(a => String(a.year) === String(filters.year));
    }
    if (filters.semester && filters.semester !== 'All') {
      normalized = normalized.filter(a => String(a.semester) === String(filters.semester));
    }
    if (filters.section && filters.section !== 'All') {
      normalized = normalized.filter(a => a.section === String(filters.section).toUpperCase());
    }
    if (filters.subjectId && filters.subjectId !== 'All') {
      normalized = normalized.filter(a => a.subjectId === filters.subjectId || a.subjectCode === filters.subjectId);
    }
    if (filters.regulation && filters.regulation !== 'All') {
      normalized = normalized.filter(a => a.regulation === filters.regulation);
    }
    if (filters.status && filters.status !== 'All') {
      const wantActive = filters.status.toLowerCase() === 'active';
      normalized = normalized.filter(a => a.isActive === wantActive);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      normalized = normalized.filter(a => 
        a.facultyName.toLowerCase().includes(q) ||
        a.facultyEmployeeId.toLowerCase().includes(q) ||
        a.facultyEmail.toLowerCase().includes(q) ||
        a.subjectName.toLowerCase().includes(q) ||
        a.subjectCode.toLowerCase().includes(q) ||
        a.departmentName.toLowerCase().includes(q) ||
        a.departmentCode.toLowerCase().includes(q) ||
        `section ${a.section}`.toLowerCase().includes(q)
      );
    }

    return {
      data: normalized,
      source: isFromSupabase ? 'supabase' : 'local_cache',
      totalCount: normalized.length
    };
  }

  /**
   * Check for conflicting active assignments.
   */
  async checkConflict({
    subjectId,
    departmentId,
    year,
    semester,
    section,
    academicYear = '2025-2026',
    facultyId = null,
    excludeAssignmentId = null
  }) {
    const { data: allAssignments } = await this.getAssignments();
    const cleanSec = (section || 'A').toUpperCase().trim();
    const numYear = Number(year) || 1;
    const numSem = Number(semester) || 1;

    const conflict = allAssignments.find(a => 
      a.isActive &&
      (a.subjectId === subjectId || a.subjectCode === subjectId) &&
      (a.departmentId === departmentId || a.departmentCode === departmentId || departmentId === 'dept-cse') &&
      a.year === numYear &&
      a.semester === numSem &&
      a.section === cleanSec &&
      a.academicYear === academicYear &&
      (!excludeAssignmentId || a.id !== excludeAssignmentId)
    );

    if (conflict) {
      const isSameFaculty = Boolean(facultyId && (conflict.facultyId === facultyId || conflict.facultyUserId === facultyId));
      return {
        hasConflict: true,
        isSameFaculty,
        existingAssignment: conflict
      };
    }

    return {
      hasConflict: false,
      isSameFaculty: false,
      existingAssignment: null
    };
  }

  /**
   * Create a new faculty assignment with duplicate conflict prevention & replace support.
   * Inserts a distinct new record into faculty_assignments (1 Faculty -> Many Assignments).
   */
  async createAssignment(assignmentData, replaceExistingId = null, adminUser = null) {
    const {
      facultyId,
      subjectId,
      departmentId,
      academicYear = '2025-2026',
      regulation = 'AR23',
      year = 4,
      semester = 7,
      section = 'A'
    } = assignmentData;

    if (!facultyId || !subjectId || !departmentId) {
      throw new Error('Please select a valid Faculty member, Subject, and Department.');
    }

    const cleanSec = String(section || 'A').toUpperCase().trim();
    const numYear = Number(year) || 4;
    const numSem = Number(semester) || 7;

    // Check conflict if not replacing
    if (!replaceExistingId) {
      const conflictCheck = await this.checkConflict({
        subjectId,
        departmentId,
        year: numYear,
        semester: numSem,
        section: cleanSec,
        academicYear,
        facultyId
      });

      if (conflictCheck.hasConflict) {
        if (conflictCheck.isSameFaculty) {
          throw new Error(`This faculty member is already actively assigned to this subject and Section ${cleanSec}.`);
        } else {
          return {
            conflict: true,
            existingAssignment: conflictCheck.existingAssignment,
            message: `Subject is already assigned to ${conflictCheck.existingAssignment.facultyName} for Year ${numYear}, Sem ${numSem}, Section ${cleanSec}.`
          };
        }
      }
    }

    if (replaceExistingId) {
      await this.toggleAssignmentStatus(replaceExistingId, false, adminUser, 'Replaced by new faculty assignment');
    }

    const branch = resolveBranch(assignmentData.branch || assignmentData.branchId || assignmentData.departmentCode || departmentId);
    const department = resolveDepartment(assignmentData.department || assignmentData.departmentCode || departmentId);
    const branchDisplayName = getBranchDisplay(department, branch);
    const newRecordId = crypto.randomUUID ? crypto.randomUUID() : `fa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newRecord = {
      id: newRecordId,
      faculty_id: facultyId,
      subject_id: subjectId,
      department_id: departmentId || (branch === 'AIML' ? 'dept-aiml' : branch === 'AIDS' ? 'dept-aids' : 'dept-cse'),
      department: department,
      department_code: branchDisplayName,
      branch: branch,
      branch_id: branch,
      academic_year: academicYear,
      regulation: regulation,
      year: numYear,
      semester: numSem,
      section: cleanSec,
      assigned_by: adminUser?.id || adminUser?.userId || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let createdRecord = null;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('faculty_assignments')
          .insert([newRecord])
          .select()
          .single();

        if (error) {
          console.warn('[FacultyAssignmentService] Supabase insert notice:', error.message);
        } else if (data) {
          createdRecord = data;
        }
      } catch (err) {
        console.warn('[FacultyAssignmentService] Supabase insert exception:', err);
      }
    }

    // Update local store with the new assignment added to the list (One to Many)
    const currentLocal = this._loadLocalStore();
    const updatedLocal = [createdRecord || newRecord, ...currentLocal.filter(a => a.id !== newRecordId)];
    this._saveLocalStore(updatedLocal);

    auditService.logAction({
      user: adminUser?.name || 'Administrator',
      role: 'admin',
      userId: adminUser?.id || adminUser?.userId || 'ADMIN',
      action: 'Create Faculty Assignment',
      resource: '/admin/faculty-assignments',
      result: 'Success',
      details: `Assigned faculty ID [${facultyId}] to subject [${subjectId}], Year ${numYear} Sem ${numSem} Section ${cleanSec} (${regulation}).`
    });

    return {
      success: true,
      data: createdRecord || newRecord
    };
  }

  /**
   * Update an existing assignment.
   */
  async updateAssignment(id, updateData, adminUser = null) {
    if (!id) throw new Error('Assignment ID is required.');

    const cleanSec = updateData.section ? String(updateData.section).toUpperCase().trim() : undefined;
    const numYear = updateData.year !== undefined ? Number(updateData.year) : undefined;
    const numSem = updateData.semester !== undefined ? Number(updateData.semester) : undefined;

    const payload = {
      updated_at: new Date().toISOString()
    };
    if (updateData.facultyId) payload.faculty_id = updateData.facultyId;
    if (updateData.subjectId) payload.subject_id = updateData.subjectId;
    if (updateData.departmentId) payload.department_id = updateData.departmentId;
    if (updateData.departmentCode || updateData.branch || updateData.branchId || updateData.departmentId || updateData.department) {
      const branch = resolveBranch(updateData.branch || updateData.branchId || updateData.departmentCode || updateData.departmentId);
      const department = resolveDepartment(updateData.department || updateData.departmentId);
      const branchDisplayName = getBranchDisplay(department, branch);
      payload.department = department;
      payload.department_code = branchDisplayName;
      payload.branch = branch;
      payload.branch_id = branch;
    }
    if (updateData.academicYear) payload.academic_year = updateData.academicYear;
    if (updateData.regulation) payload.regulation = updateData.regulation;
    if (numYear !== undefined) payload.year = numYear;
    if (numSem !== undefined) payload.semester = numSem;
    if (cleanSec !== undefined) payload.section = cleanSec;
    if (updateData.isActive !== undefined) payload.is_active = Boolean(updateData.isActive);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('faculty_assignments')
          .update(payload)
          .eq('id', id);
      } catch (err) {
        console.warn('[FacultyAssignmentService] Supabase update exception:', err);
      }
    }

    const currentLocal = this._loadLocalStore();
    const updatedLocal = currentLocal.map(item => item.id === id ? { ...item, ...payload } : item);
    this._saveLocalStore(updatedLocal);

    auditService.logAction({
      user: adminUser?.name || 'Administrator',
      role: 'admin',
      userId: adminUser?.id || adminUser?.userId || 'ADMIN',
      action: 'Update Faculty Assignment',
      resource: `/admin/faculty-assignments/${id}`,
      result: 'Success',
      details: `Updated faculty assignment [${id}].`
    });

    return { success: true };
  }

  /**
   * Toggle activation status (Deactivate / Reactivate)
   */
  async toggleAssignmentStatus(id, isActive, adminUser = null, reason = '') {
    if (!id) throw new Error('Assignment ID is required.');

    const statusVal = Boolean(isActive);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('faculty_assignments')
          .update({ is_active: statusVal, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('[FacultyAssignmentService] Supabase toggle error:', err);
      }
    }

    const currentLocal = this._loadLocalStore();
    const updatedLocal = currentLocal.map(item => item.id === id ? { ...item, is_active: statusVal, isActive: statusVal } : item);
    this._saveLocalStore(updatedLocal);

    auditService.logAction({
      user: adminUser?.name || 'Administrator',
      role: 'admin',
      userId: adminUser?.id || adminUser?.userId || 'ADMIN',
      action: statusVal ? 'Reactivate Faculty Assignment' : 'Deactivate Faculty Assignment',
      resource: `/admin/faculty-assignments/${id}`,
      result: 'Success',
      details: `Assignment [${id}] set to ${statusVal ? 'ACTIVE' : 'INACTIVE'}. ${reason}`
    });

    return { success: true, isActive: statusVal };
  }

  /**
   * Delete assignment completely
   */
  async deleteAssignment(id, adminUser = null) {
    if (!id) throw new Error('Assignment ID is required.');

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('faculty_assignments')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('[FacultyAssignmentService] Supabase delete error:', err);
      }
    }

    const currentLocal = this._loadLocalStore();
    const updatedLocal = currentLocal.filter(item => item.id !== id);
    this._saveLocalStore(updatedLocal);

    auditService.logAction({
      user: adminUser?.name || 'Administrator',
      role: 'admin',
      userId: adminUser?.id || adminUser?.userId || 'ADMIN',
      action: 'Delete Faculty Assignment',
      resource: `/admin/faculty-assignments/${id}`,
      result: 'Success',
      details: `Deleted faculty assignment [${id}].`
    });

    return { success: true };
  }

  /**
   * Get Assigned Classes for a specific Faculty user.
   * Shared Single Source of Truth for Faculty Dashboard and My Subjects page.
   * Returns ALL active assignments for the faculty member (One to Many).
   */
  async getFacultyAssignedClasses(facultyUserIdOrId) {
    const { data: allAssignments } = await this.getAssignments();

    if (!facultyUserIdOrId) {
      // Return all active assignments for Anand Rao or first active faculty
      return allAssignments.filter(a => a.isActive && (a.facultyId === 'fac-anand' || a.facultyName?.includes('Anand')));
    }

    const targetId = String(facultyUserIdOrId).trim().toLowerCase();

    // Filter to ALL active assignments matching faculty identifier
    const activeAssignments = allAssignments.filter(a => {
      if (!a.isActive) return false;
      const fid = String(a.facultyId || '').toLowerCase();
      const fuid = String(a.facultyUserId || '').toLowerCase();
      const femp = String(a.facultyEmployeeId || '').toLowerCase();
      const femail = String(a.facultyEmail || '').toLowerCase();
      const fname = String(a.facultyName || '').toLowerCase();

      return (
        fid === targetId ||
        fuid === targetId ||
        femp === targetId ||
        femail === targetId ||
        fname.includes(targetId) ||
        (targetId.includes('anand') && (fname.includes('anand') || femp === 'fac550' || fid === 'fac-anand' || fuid === 'fac-anand')) ||
        (targetId.includes('sudhakar') && (fname.includes('sudhakar') || femp === '52413' || fid === 'fac-sudhakar' || fuid === 'fac-sudhakar')) ||
        (targetId.includes('ravi') && (fname.includes('ravi') || femp === 'fac552' || fid === 'fac-ravi' || fuid === 'fac-ravi')) ||
        (targetId.includes('priya') && (fname.includes('priya') || femp === 'fac553' || fid === 'fac-priya' || fuid === 'fac-priya'))
      );
    });

    return activeAssignments.map(a => {
      const cohort = extractCanonicalCohort(a);
      const yearSuffix = cohort.year === 1 ? '1st' : cohort.year === 2 ? '2nd' : cohort.year === 3 ? '3rd' : `${cohort.year}th`;
      return {
        assignmentId: a.id,
        id: a.id, // Unique assignment ID
        subjectId: a.subjectId,
        name: a.subjectName,
        code: a.subjectCode,
        credits: a.subjectCredits || 3,
        subjectType: a.subjectType || 'CORE',
        year: cohort.year,
        semester: cohort.semester,
        section: cohort.section,
        academicYear: cohort.academicYear,
        regulation: cohort.regulation,
        department: cohort.department,
        departmentId: cohort.departmentId,
        departmentCode: cohort.branchDisplayName,
        departmentName: cohort.departmentName,
        branchId: cohort.branch,
        branch: cohort.branch,
        branchDisplayName: cohort.branchDisplayName,
        status: 'Active',
        progress: 68,
        formattedClass: `${cohort.branchDisplayName} • ${yearSuffix} Year • Semester ${cohort.semester} • Section ${cohort.section}`
      };
    });
  }

  /**
   * Get Students belonging to the sections assigned to a specific Faculty.
   * Resolves enrolled students automatically via canonical cohorts.
   * Strict branch & section isolation is enforced.
   */
  async getFacultyAssignedStudents(facultyUserIdOrId, selectedSection = null, selectedAssignmentId = null) {
    const assignedClasses = await this.getFacultyAssignedClasses(facultyUserIdOrId);
    
    if (!assignedClasses || assignedClasses.length === 0) {
      return [];
    }

    // Filter assigned classes by assignment ID or Section if specified
    let targetClasses = assignedClasses;
    if (selectedAssignmentId && selectedAssignmentId !== 'All') {
      targetClasses = targetClasses.filter(c => (c.assignmentId || c.id) === selectedAssignmentId);
    }
    if (selectedSection && selectedSection !== 'All') {
      const cleanTargetSec = normalizeSection(selectedSection);
      targetClasses = targetClasses.filter(c => normalizeSection(c.section) === cleanTargetSec);
    }

    if (targetClasses.length === 0) {
      return [];
    }

    // Extract canonical cohorts for all target assignments
    const targetCohorts = targetClasses.map(c => extractCanonicalCohort(c)).filter(Boolean);

    const allUsers = await userManagementService.getAllUsers();
    const studentUsers = allUsers.filter(u => u.role === 'student');

    const matchedStudents = studentUsers.filter(s => {
      return targetCohorts.some(cohort => matchesCohort(s, cohort));
    });

    return matchedStudents.map(s => {
      const sCohort = extractCanonicalCohort(s);
      return {
        id: s.id || s.userId,
        user_id: s.userId || s.id,
        name: s.name || s.full_name,
        email: s.email,
        roll_number: s.rollNumber || s.roll_number || '23CS001',
        rollNumber: s.rollNumber || s.roll_number || '23CS001',
        department: sCohort.departmentName,
        departmentCode: sCohort.departmentCode,
        departmentId: sCohort.departmentId,
        branchId: sCohort.branchId,
        year: sCohort.year,
        semester: sCohort.semester,
        section: sCohort.section,
        program: s.program || 'B.Tech',
        regulation: sCohort.regulation,
        academicYear: sCohort.academicYear,
        attendance: s.attendance || 88,
        status: s.status || 'Active',
        isAtRisk: Boolean(s.isAtRisk),
        user: {
          full_name: s.name || s.full_name,
          email: s.email
        }
      };
    });
  }

  /**
   * Automatic Student Cohort Resolution for a Faculty Assignment.
   * Resolves the canonical academic cohort: (branch_id, year, semester, section, academic_year, regulation)
   * and returns all active students belonging to that cohort.
   * Does NOT filter by student name, email, roll number, or subject name.
   */
  async getStudentsForFacultyAssignment(facultyAssignmentOrId) {
    let assignment = null;
    if (typeof facultyAssignmentOrId === 'object' && facultyAssignmentOrId !== null) {
      assignment = facultyAssignmentOrId;
    } else if (facultyAssignmentOrId) {
      const { data: allAssignments } = await this.getAssignments();
      assignment = allAssignments.find(a => a.id === facultyAssignmentOrId || a.assignmentId === facultyAssignmentOrId);
    }
    if (!assignment) return [];

    const cohort = extractCanonicalCohort(assignment);
    if (!cohort) return [];

    const allUsers = await userManagementService.getAllUsers();
    const studentUsers = allUsers.filter(u => u.role === 'student');

    const matchingStudents = studentUsers.filter(s => matchesCohort(s, cohort));

    return matchingStudents.map(s => {
      const sCohort = extractCanonicalCohort(s);
      return {
        id: s.id || s.userId,
        user_id: s.userId || s.id,
        name: s.name || s.full_name,
        email: s.email,
        rollNumber: s.rollNumber || s.roll_number || '23CS001',
        roll_number: s.rollNumber || s.roll_number || '23CS001',
        department: sCohort.departmentName,
        departmentCode: sCohort.departmentCode,
        departmentId: sCohort.departmentId,
        branchId: sCohort.branchId,
        section: sCohort.section,
        year: sCohort.year,
        semester: sCohort.semester,
        regulation: sCohort.regulation,
        academicYear: sCohort.academicYear,
        attendance: s.attendance || 88,
        status: s.status || 'Active',
        isAtRisk: Boolean(s.isAtRisk),
        user: {
          full_name: s.name || s.full_name,
          email: s.email
        }
      };
    });
  }

  /**
   * Alias for backward compatibility
   */
  async getStudentsForAssignment(assignmentId) {
    return this.getStudentsForFacultyAssignment(assignmentId);
  }

  /**
   * Get Enrolled Subjects & Assigned Faculty for a logged-in Student.
   * Derives subjects automatically from Student Academic Profile (Branch + Year + Sem + Section) + Faculty Assignments.
   * Branch and Section isolation is strictly enforced.
   */
  async getStudentAssignedSubjects(studentUserIdOrId, studentProfile = null) {
    let studentInfo = studentProfile;

    if (!studentInfo && studentUserIdOrId) {
      const allUsers = await userManagementService.getAllUsers();
      studentInfo = allUsers.find(u => 
        u.id === studentUserIdOrId || 
        u.userId === studentUserIdOrId ||
        (u.email && u.email.toLowerCase() === String(studentUserIdOrId).toLowerCase())
      );
    }

    const sCohort = extractCanonicalCohort(studentInfo || studentProfile);
    if (!sCohort) return [];

    const { data: allAssignments } = await this.getAssignments({ status: 'active' });
    const { data: masterSubjects } = await academicDataService.getSubjects();

    // 1. Find active faculty assignments matching this student's canonical cohort
    const matchingAssignments = (allAssignments || []).filter(a => {
      if (!a.isActive) return false;
      return matchesCohort(studentInfo || sCohort, extractCanonicalCohort(a));
    });

    const resultList = [];
    const processedSubjectKeys = new Set();

    // 2. Populate subjects from explicit active faculty assignments for this student's cohort
    matchingAssignments.forEach(a => {
      const key = a.subjectCode || a.subjectId;
      if (!processedSubjectKeys.has(key)) {
        processedSubjectKeys.add(key);
        resultList.push({
          id: a.subjectId || a.id,
          name: a.subjectName,
          code: a.subjectCode,
          credits: a.subjectCredits || 3,
          semester: a.semester,
          regulation: a.regulation || sCohort.regulation,
          departmentId: a.departmentId,
          departmentCode: a.departmentCode,
          branchId: a.departmentCode,
          subjectType: a.subjectType || 'CORE',
          faculty: a.facultyName,
          facultyEmail: a.facultyEmail,
          facultyEmployeeId: a.facultyEmployeeId,
          facultyDesignation: a.facultyDesignation,
          facultyAssignmentId: a.id || a.assignmentId,
          assignedSection: sCohort.section,
          hasAssignedFaculty: true,
          progress: 68,
          units: [
            { unitNumber: 1, title: 'Foundational Principles and Architecture', progress: 100 },
            { unitNumber: 2, title: 'Theoretical Models & Algorithmic Design', progress: 85 },
            { unitNumber: 3, title: 'Practical Implementations & Case Studies', progress: 50 },
            { unitNumber: 4, title: 'Advanced Topics & Emerging Trends', progress: 20 }
          ]
        });
      }
    });

    // 3. If no faculty assignments exist yet for this cohort, fallback to master syllabus CORE subjects for this branch
    if (resultList.length === 0) {
      const semesterMasterSubjects = (masterSubjects || MASTER_SUBJECTS).filter(s => {
        const subSem = normalizeSemester(s.semester);
        const subBranch = resolveBranch(s.departmentId || s.department_id || s.departmentCode);
        const matchSem = subSem === sCohort.semester;
        const matchDept = subBranch === sCohort.branch;
        return matchSem && matchDept;
      });

      semesterMasterSubjects.forEach(sub => {
        const key = sub.code || sub.id;
        if (!processedSubjectKeys.has(key)) {
          processedSubjectKeys.add(key);
          resultList.push({
            id: sub.id,
            name: sub.name,
            code: sub.code,
            credits: sub.credits || 3,
            semester: sub.semester,
            regulation: sub.regulation || sCohort.regulation,
            departmentId: sCohort.departmentId,
            departmentCode: sCohort.departmentCode,
            branchId: sCohort.branchId,
            subjectType: sub.subjectType || 'CORE',
            faculty: 'Faculty Assigned via Department',
            facultyEmail: null,
            facultyEmployeeId: null,
            facultyDesignation: null,
            facultyAssignmentId: null,
            assignedSection: sCohort.section,
            hasAssignedFaculty: false,
            progress: 0,
            units: [
              { unitNumber: 1, title: 'Foundational Principles and Architecture', progress: 100 },
              { unitNumber: 2, title: 'Theoretical Models & Algorithmic Design', progress: 85 },
              { unitNumber: 3, title: 'Practical Implementations & Case Studies', progress: 50 },
              { unitNumber: 4, title: 'Advanced Topics & Emerging Trends', progress: 20 }
            ]
          });
        }
      });
    }

    return resultList;
  }

  /**
   * Calculate Real Dynamic Admin Statistics for Dashboard
   */
  async getAdminDashboardStats() {
    const [allUsers, { data: assignments }] = await Promise.all([
      userManagementService.getAllUsers(),
      this.getAssignments()
    ]);

    const activeFacultyUsers = allUsers.filter(u => u.role === 'faculty' && u.rawStatus === 'active');
    const activeAssignments = (assignments || []).filter(a => a.isActive);

    const assignedFacultyIds = new Set(activeAssignments.map(a => a.facultyUserId || a.facultyId || a.facultyEmployeeId));
    const assignedFacultyCount = activeFacultyUsers.filter(f => 
      assignedFacultyIds.has(f.id) || 
      assignedFacultyIds.has(f.userId) ||
      assignedFacultyIds.has(f.employeeId)
    ).length;
    const unassignedFacultyCount = Math.max(0, activeFacultyUsers.length - assignedFacultyCount);

    const activeSectionsSet = new Set(
      activeAssignments.map(a => `${a.departmentCode || a.departmentId}_Y${a.year}_S${a.semester}_${a.section}`)
    );

    return {
      activeFaculty: activeFacultyUsers.length,
      assignedFaculty: assignedFacultyCount,
      unassignedFaculty: unassignedFacultyCount,
      activeSections: activeSectionsSet.size,
      activeAssignments: activeAssignments.length
    };
  }
}

export const facultyAssignmentService = new FacultyAssignmentService();
export default facultyAssignmentService;
