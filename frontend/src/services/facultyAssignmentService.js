// GMR CRM - Faculty Assignment Management Service
// Fully Database-Driven Architecture backed by Supabase public.faculty_assignments
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import auditService from './auditService.js';
import authService from './authService.js';
import userManagementService from './userManagementService.js';
import {
  resolveDepartment,
  resolveBranch,
  getBranchDisplay,
  normalizeYear,
  normalizeSemester,
  normalizeSection,
  normalizeAcademicYear,
  normalizeRegulation,
  extractCanonicalCohort,
  matchesCohort,
  isUserActive
} from './academicCohortService.js';

export const DEFAULT_ASSIGNMENTS = [
  {
    id: 'assign-anand-cloud-a',
    assignmentId: 'assign-anand-cloud-a',
    facultyId: 'fac-anand',
    facultyUserId: 'fac-anand',
    facultyName: 'Anand Rao',
    facultyEmail: 'faculty@gmrit.edu.in',
    facultyEmployeeId: 'FAC550',
    facultyDesignation: 'Associate Professor',
    facultyStatus: 'Active',
    subjectId: 'sub-cloud-devops',
    subjectName: 'Cloud Computing & DevOps',
    subjectCode: '23CSC11',
    subjectCredits: 3,
    subjectType: 'CORE',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    departmentCode: 'CSE',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    branchDisplayName: 'CSE',
    academicYear: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'A',
    isActive: true
  },
  {
    id: 'assign-anand-nlp-a',
    assignmentId: 'assign-anand-nlp-a',
    facultyId: 'fac-anand',
    facultyUserId: 'fac-anand',
    facultyName: 'Anand Rao',
    facultyEmail: 'faculty@gmrit.edu.in',
    facultyEmployeeId: 'FAC550',
    facultyDesignation: 'Associate Professor',
    facultyStatus: 'Active',
    subjectId: 'sub-nlp',
    subjectName: 'Natural Language Processing',
    subjectCode: '23CSC13',
    subjectCredits: 3,
    subjectType: 'CORE',
    departmentId: 'dept-aiml',
    departmentName: 'CSE - Artificial Intelligence and Machine Learning',
    departmentCode: 'CSE-AIML',
    department: 'CSE',
    branch: 'AIML',
    branchId: 'AIML',
    branchDisplayName: 'CSE-AIML',
    academicYear: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'A',
    isActive: true
  },
  {
    id: 'assign-anand-ai-a',
    assignmentId: 'assign-anand-ai-a',
    facultyId: 'fac-anand',
    facultyUserId: 'fac-anand',
    facultyName: 'Anand Rao',
    facultyEmail: 'faculty@gmrit.edu.in',
    facultyEmployeeId: 'FAC550',
    facultyDesignation: 'Associate Professor',
    facultyStatus: 'Active',
    subjectId: 'sub-ai',
    subjectName: 'Artificial Intelligence',
    subjectCode: '23CSC15',
    subjectCredits: 3,
    subjectType: 'CORE',
    departmentId: 'dept-aiml',
    departmentName: 'CSE - Artificial Intelligence and Machine Learning',
    departmentCode: 'CSE-AIML',
    department: 'CSE',
    branch: 'AIML',
    branchId: 'AIML',
    branchDisplayName: 'CSE-AIML',
    academicYear: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'A',
    isActive: true
  },
  {
    id: 'assign-anand-ml-b',
    assignmentId: 'assign-anand-ml-b',
    facultyId: 'fac-anand',
    facultyUserId: 'fac-anand',
    facultyName: 'Anand Rao',
    facultyEmail: 'faculty@gmrit.edu.in',
    facultyEmployeeId: 'FAC550',
    facultyDesignation: 'Associate Professor',
    facultyStatus: 'Active',
    subjectId: 'sub-ml',
    subjectName: 'Machine Learning',
    subjectCode: '23CSC12',
    subjectCredits: 4,
    subjectType: 'CORE',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    departmentCode: 'CSE',
    department: 'CSE',
    branch: 'CSE',
    branchId: 'CSE',
    branchDisplayName: 'CSE',
    academicYear: '2025-2026',
    regulation: 'AR23',
    year: 4,
    semester: 7,
    section: 'B',
    isActive: true
  }
];

class FacultyAssignmentService {
  constructor() {
    this._listeners = new Set();
    this._memoryAssignments = null;
  }

  _loadLocalStore() {
    if (this._memoryAssignments && this._memoryAssignments.length > 0) {
      return this._memoryAssignments;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('gmrit_assignments_store');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this._memoryAssignments = parsed;
            return parsed;
          }
        }
      } catch (e) {}
    }
    this._memoryAssignments = DEFAULT_ASSIGNMENTS;
    return DEFAULT_ASSIGNMENTS;
  }

  _saveLocalStore(list) {
    this._memoryAssignments = list;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gmrit_assignments_store', JSON.stringify(list));
      } catch (e) {}
    }
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

  /**
   * Helper to resolve a faculty member's row UUID in public.faculty
   * Accepts either faculty.id, users.id, or email/employeeId
   */
  async resolveFacultyId(facultyIdentifier) {
    if (!facultyIdentifier) return null;
    const clean = String(facultyIdentifier).trim();
    if (clean.startsWith('fac-') || clean.startsWith('admin-')) return clean;
    if (!isSupabaseConfigured()) return clean;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
    if (isUuid) {
      const { data: byId } = await supabase
        .from('faculty')
        .select('id, user_id, employee_id')
        .eq('id', clean)
        .maybeSingle();

      if (byId?.id) return byId.id;
    }

    // 2. Query in faculty table by user_id
    const { data: byUserId } = await supabase
      .from('faculty')
      .select('id, user_id, employee_id')
      .eq('user_id', clean)
      .maybeSingle();

    if (byUserId?.id) return byUserId.id;

    // 3. Query in faculty table by employee_id
    const { data: byEmp } = await supabase
      .from('faculty')
      .select('id, user_id, employee_id')
      .eq('employee_id', clean.toUpperCase())
      .maybeSingle();

    if (byEmp?.id) return byEmp.id;

    // 4. Query via users email
    const { data: userRow } = await supabase
      .from('users')
      .select('id, faculty:faculty(id)')
      .ilike('email', clean)
      .maybeSingle();

    if (userRow?.faculty?.[0]?.id) return userRow.faculty[0].id;
    if (userRow?.id) {
      const { data: facRow } = await supabase
        .from('faculty')
        .select('id')
        .eq('user_id', userRow.id)
        .maybeSingle();
      if (facRow?.id) return facRow.id;
    }

    // Fallback: return the raw identifier if it's already a UUID
    return clean;
  }

  /**
   * Helper to resolve department UUID in public.departments
   */
  async resolveDepartmentId(deptIdentifier) {
    if (!deptIdentifier) return null;
    const clean = String(deptIdentifier).trim();

    // Check by code (e.g. CSE, AIML, AIDS)
    const normalizedCode = clean.replace(/^dept-/i, '').replace(/^CSE-/i, '').toUpperCase();
    if (normalizedCode === 'AIML' || clean.toUpperCase().includes('AIML') || clean.toLowerCase() === '835f1428-d1ec-47b9-87e0-d281feba4234') {
      if (isSupabaseConfigured()) {
        try {
          const { data: aiml } = await supabase.from('departments').select('id').ilike('code', 'AIML').maybeSingle();
          if (aiml?.id) return aiml.id;
        } catch (e) {}
      }
      return '835f1428-d1ec-47b9-87e0-d281feba4234';
    }
    if (normalizedCode === 'AIDS' || clean.toUpperCase().includes('AIDS') || clean.toLowerCase() === 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c') {
      if (isSupabaseConfigured()) {
        try {
          const { data: aids } = await supabase.from('departments').select('id').ilike('code', 'AIDS').maybeSingle();
          if (aids?.id) return aids.id;
        } catch (e) {}
      }
      return 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c';
    }
    if (normalizedCode === 'CSE' || clean.toUpperCase().includes('CSE') || clean.toLowerCase() === 'b9cce72e-288c-4091-88a7-fcb31a08863f') {
      if (isSupabaseConfigured()) {
        try {
          const { data: cse } = await supabase.from('departments').select('id').ilike('code', 'CSE').maybeSingle();
          if (cse?.id) return cse.id;
        } catch (e) {}
      }
      return 'b9cce72e-288c-4091-88a7-fcb31a08863f';
    }

    if (!isSupabaseConfigured()) return clean;

    // Direct check by id if valid UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
    if (isUuid) {
      const { data: byId } = await supabase
        .from('departments')
        .select('id, code')
        .eq('id', clean)
        .maybeSingle();

      if (byId?.id) return byId.id;
    }

    const { data: byCode } = await supabase
      .from('departments')
      .select('id, code')
      .ilike('code', normalizedCode)
      .maybeSingle();

    if (byCode?.id) return byCode.id;

    return clean;
  }

  /**
   * Helper to resolve subject UUID in public.subjects
   */
  async resolveSubjectId(subjectIdentifier) {
    if (!subjectIdentifier) return null;
    const clean = String(subjectIdentifier).trim();
    if (clean.startsWith('sub-')) return clean;
    if (!isSupabaseConfigured()) return clean;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
    if (isUuid) {
      const { data: byId } = await supabase
        .from('subjects')
        .select('id, code')
        .eq('id', clean)
        .maybeSingle();

      if (byId?.id) return byId.id;
    }

    const { data: byCode } = await supabase
      .from('subjects')
      .select('id, code')
      .ilike('code', clean)
      .maybeSingle();

    if (byCode?.id) return byCode.id;

    return clean;
  }

  /**
   * Fetch all faculty assignments from Supabase public.faculty_assignments
   * Joined with Faculty, Subject, Department, and User details.
   */
  async getAssignments(filters = {}) {
    let rawList = [];

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
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

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          rawList = data.map(a => {
            const facObj = a.faculty || {};
            const userObj = facObj.users || {};
            const subObj = a.subjects || {};
            const deptObj = a.departments || {};

            const branchCode = deptObj.code || 'CSE';
            const departmentName = deptObj.name || 'Computer Science and Engineering';
            const branchDisplayName = branchCode === 'CSE' ? 'CSE' : `CSE-${branchCode}`;

            return {
              id: a.id,
              assignmentId: a.id,
              facultyId: a.faculty_id,
              facultyUserId: facObj.user_id || a.faculty_id,
              facultyName: userObj.full_name || 'Faculty Member',
              facultyEmail: userObj.email || '',
              facultyEmployeeId: facObj.employee_id || '',
              facultyDesignation: facObj.designation || 'Assistant Professor',
              facultyStatus: userObj.status || 'Active',

              subjectId: a.subject_id,
              name: subObj.name || a.subject_name || 'Assigned Course',
              subjectName: subObj.name || a.subject_name || 'Assigned Course',
              code: subObj.code || a.subject_code || '',
              subjectCode: subObj.code || a.subject_code || '',
              credits: Number(subObj.credits) || Number(a.credits) || 3,
              subjectCredits: Number(subObj.credits) || Number(a.credits) || 3,
              subjectType: subObj.subject_type || 'CORE',

              departmentId: a.department_id,
              departmentName: departmentName,
              departmentCode: branchDisplayName,
              department: branchCode,
              branch: branchCode,
              branchId: branchCode,
              branchDisplayName: branchDisplayName,

              academicYear: a.academic_year || '2025-2026',
              regulation: a.regulation || 'AR23',
              year: Number(a.year) || 4,
              semester: Number(a.semester) || 7,
              section: String(a.section || 'A').toUpperCase().trim(),
              isActive: Boolean(a.is_active),
              assignedBy: a.assigned_by,
              createdAt: a.created_at,
              updatedAt: a.updated_at
            };
          });
        }
      } catch (err) {
        console.warn('[FacultyAssignmentService] Error querying faculty_assignments from Supabase:', err.message);
      }
    }

    if (rawList.length === 0) {
      rawList = this._loadLocalStore();
    }

    let normalized = rawList;

    // Apply Filter Criteria
    if (filters.facultyId) {
      const fid = String(filters.facultyId).toLowerCase();
      normalized = normalized.filter(a =>
        a.facultyId?.toLowerCase() === fid ||
        a.facultyUserId?.toLowerCase() === fid ||
        a.facultyEmployeeId?.toLowerCase() === fid ||
        a.facultyEmail?.toLowerCase() === fid
      );
    }
    if (filters.departmentId && filters.departmentId !== 'All') {
      const did = String(filters.departmentId).toLowerCase();
      normalized = normalized.filter(a =>
        a.departmentId?.toLowerCase() === did ||
        a.departmentCode?.toLowerCase() === did ||
        a.branch?.toLowerCase() === did
      );
    }
    if (filters.year && filters.year !== 'All') {
      normalized = normalized.filter(a => String(a.year) === String(filters.year));
    }
    if (filters.semester && filters.semester !== 'All') {
      normalized = normalized.filter(a => String(a.semester) === String(filters.semester));
    }
    if (filters.section && filters.section !== 'All') {
      normalized = normalized.filter(a => a.section === String(filters.section).toUpperCase().trim());
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
        a.facultyName?.toLowerCase().includes(q) ||
        a.facultyEmployeeId?.toLowerCase().includes(q) ||
        a.facultyEmail?.toLowerCase().includes(q) ||
        a.subjectName?.toLowerCase().includes(q) ||
        a.subjectCode?.toLowerCase().includes(q) ||
        a.departmentName?.toLowerCase().includes(q) ||
        a.departmentCode?.toLowerCase().includes(q) ||
        `section ${a.section}`.toLowerCase().includes(q)
      );
    }

    return {
      data: normalized,
      source: isSupabaseConfigured() ? 'supabase' : 'local',
      totalCount: normalized.length
    };
  }

  /**
   * Check for conflicting active assignments in Supabase.
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
    const resolvedDeptId = await this.resolveDepartmentId(departmentId);
    const resolvedSubId = await this.resolveSubjectId(subjectId);
    const resolvedFacId = await this.resolveFacultyId(facultyId);

    const cleanSec = String(section || 'A').toUpperCase().trim();
    const numYear = Number(year) || 4;
    const numSem = Number(semester) || 7;

    const { data: allAssignments } = await this.getAssignments();

    const conflict = (allAssignments || []).find(a =>
      a.isActive &&
      (a.subjectId === resolvedSubId || a.subjectCode === subjectId) &&
      (a.departmentId === resolvedDeptId) &&
      a.year === numYear &&
      a.semester === numSem &&
      a.section === cleanSec &&
      a.academicYear === academicYear &&
      (!excludeAssignmentId || a.id !== excludeAssignmentId)
    );

    if (conflict) {
      const isSameFaculty = Boolean(
        resolvedFacId && (conflict.facultyId === resolvedFacId || conflict.facultyUserId === resolvedFacId)
      );
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
   * Create a new faculty assignment directly in Supabase public.faculty_assignments
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

    const targetBranch = resolveBranch(assignmentData.branch || assignmentData.branchId || assignmentData.departmentCode || assignmentData.department || departmentId);
    let resolvedDeptId = await this.resolveDepartmentId(departmentId);

    // Safeguard: strictly enforce correct department UUID according to selected branch
    if (targetBranch === 'AIML') {
      const aimlId = await this.resolveDepartmentId('AIML');
      if (aimlId) resolvedDeptId = aimlId;
    } else if (targetBranch === 'AIDS') {
      const aidsId = await this.resolveDepartmentId('AIDS');
      if (aidsId) resolvedDeptId = aidsId;
    } else if (targetBranch === 'CSE') {
      const cseId = await this.resolveDepartmentId('CSE');
      if (cseId) resolvedDeptId = cseId;
    }

    const resolvedFacId = await this.resolveFacultyId(facultyId);
    const resolvedSubId = await this.resolveSubjectId(subjectId);

    if (!resolvedFacId) throw new Error('Could not resolve faculty identifier in database.');
    if (!resolvedSubId) throw new Error('Could not resolve subject in database.');
    if (!resolvedDeptId) throw new Error('Could not resolve department in database.');

    const cleanSec = String(section || 'A').toUpperCase().trim();
    const numYear = Number(year) || 4;
    const numSem = Number(semester) || 7;

    // Check conflict if not replacing
    if (!replaceExistingId) {
      const conflictCheck = await this.checkConflict({
        subjectId: resolvedSubId,
        departmentId: resolvedDeptId,
        year: numYear,
        semester: numSem,
        section: cleanSec,
        academicYear,
        facultyId: resolvedFacId
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

    const newRecord = {
      faculty_id: resolvedFacId,
      subject_id: resolvedSubId,
      department_id: resolvedDeptId,
      academic_year: academicYear,
      regulation: regulation,
      year: numYear,
      semester: numSem,
      section: cleanSec,
      assigned_by: adminUser?.id || adminUser?.userId || null,
      is_active: true
    };

    const { data: created, error } = await supabase
      .from('faculty_assignments')
      .insert([newRecord])
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
        is_active,
        created_at
      `)
      .single();

    if (error) {
      console.error('[FacultyAssignmentService] Failed to insert faculty_assignment into Supabase:', error);
      throw new Error(`Failed to save assignment in database: ${error.message}`);
    }

    this._notifyChange();

    auditService.logAction({
      user: adminUser?.name || 'Administrator',
      role: 'admin',
      userId: adminUser?.id || adminUser?.userId || 'ADMIN',
      action: 'Create Faculty Assignment',
      resource: `/admin/faculty-assignments/${created.id}`,
      result: 'Success',
      details: `Assigned faculty [${resolvedFacId}] to subject [${resolvedSubId}] (Sec ${cleanSec}, Y${numYear} S${numSem}).`
    });

    return {
      success: true,
      data: created
    };
  }

  /**
   * Update existing assignment in Supabase
   */
  async updateAssignment(id, updateData, adminUser = null) {
    if (!id) throw new Error('Assignment ID is required.');

    const resolvedFacId = updateData.facultyId ? await this.resolveFacultyId(updateData.facultyId) : undefined;
    const resolvedSubId = updateData.subjectId ? await this.resolveSubjectId(updateData.subjectId) : undefined;
    let resolvedDeptId = updateData.departmentId ? await this.resolveDepartmentId(updateData.departmentId) : undefined;

    if (updateData.branch || updateData.department) {
      const targetBranch = resolveBranch(updateData.branch || updateData.department || updateData.departmentId);
      if (targetBranch === 'AIML') {
        const aimlId = await this.resolveDepartmentId('AIML');
        if (aimlId) resolvedDeptId = aimlId;
      } else if (targetBranch === 'AIDS') {
        const aidsId = await this.resolveDepartmentId('AIDS');
        if (aidsId) resolvedDeptId = aidsId;
      } else if (targetBranch === 'CSE') {
        const cseId = await this.resolveDepartmentId('CSE');
        if (cseId) resolvedDeptId = cseId;
      }
    }

    const patch = {
      updated_at: new Date().toISOString()
    };

    if (resolvedFacId) patch.faculty_id = resolvedFacId;
    if (resolvedSubId) patch.subject_id = resolvedSubId;
    if (resolvedDeptId) patch.department_id = resolvedDeptId;
    if (updateData.year) patch.year = Number(updateData.year);
    if (updateData.semester) patch.semester = Number(updateData.semester);
    if (updateData.section) patch.section = String(updateData.section).toUpperCase().trim();
    if (updateData.academicYear) patch.academic_year = updateData.academicYear;
    if (updateData.regulation) patch.regulation = updateData.regulation;
    if (typeof updateData.isActive === 'boolean') patch.is_active = updateData.isActive;

    const { data: updated, error } = await supabase
      .from('faculty_assignments')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[FacultyAssignmentService] Update failed in Supabase:', error);
      throw new Error(`Failed to update assignment: ${error.message}`);
    }

    this._notifyChange();

    auditService.logAction({
      user: adminUser?.name || 'Administrator',
      role: 'admin',
      userId: adminUser?.id || adminUser?.userId || 'ADMIN',
      action: 'Update Faculty Assignment',
      resource: `/admin/faculty-assignments/${id}`,
      result: 'Success',
      details: `Updated faculty assignment [${id}].`
    });

    return { success: true, data: updated };
  }

  /**
   * Toggle activation status (Deactivate / Reactivate) in Supabase
   */
  async toggleAssignmentStatus(id, isActive, adminUser = null, reason = '') {
    if (!id) throw new Error('Assignment ID is required.');

    const statusVal = Boolean(isActive);

    const { error } = await supabase
      .from('faculty_assignments')
      .update({ is_active: statusVal, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[FacultyAssignmentService] Supabase toggle error:', error);
      throw new Error(`Failed to toggle assignment status: ${error.message}`);
    }

    this._notifyChange();

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
   * Delete assignment completely from Supabase
   */
  async deleteAssignment(id, adminUser = null) {
    if (!id) throw new Error('Assignment ID is required.');

    const { error } = await supabase
      .from('faculty_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[FacultyAssignmentService] Supabase delete error:', error);
      throw new Error(`Failed to delete assignment: ${error.message}`);
    }

    this._notifyChange();

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
   * Single Source of Truth for Faculty Dashboard, My Subjects, and Resource Upload.
   * Returns ALL active assignments with full cohort and course metadata.
   */
  async getFacultyAssignedClasses(facultyUserIdOrId) {
    let targetUserId = facultyUserIdOrId;

    if (!targetUserId) {
      if (isSupabaseConfigured()) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.id) {
            targetUserId = authData.user.id;
          }
        } catch (e) {}
      }
      if (!targetUserId) {
        const curr = authService.getCurrentUser();
        targetUserId = curr?.userId || curr?.id;
      }
    }

    if (!targetUserId) return [];

    const currentUser = authService.getCurrentUser();
    let resolvedFacId = null;
    try {
      resolvedFacId = await this.resolveFacultyId(targetUserId);
    } catch (e) {
      console.warn('[FacultyAssignmentService] Could not resolve faculty ID:', e);
    }

    const { data: allAssignments } = await this.getAssignments({ status: 'active' });

    const cleanTarget = String(targetUserId).toLowerCase().trim();
    const cleanResolved = resolvedFacId ? String(resolvedFacId).toLowerCase().trim() : null;
    const userEmail = currentUser?.email ? String(currentUser.email).toLowerCase().trim() : null;
    const userEmpId = currentUser?.employeeId ? String(currentUser.employeeId).toLowerCase().trim() : null;
    const userName = currentUser?.name ? String(currentUser.name).toLowerCase().trim() : null;

    const activeAssignments = (allAssignments || []).filter(a => {
      if (!a.isActive) return false;
      const fId = String(a.facultyId || '').toLowerCase().trim();
      const uId = String(a.facultyUserId || '').toLowerCase().trim();
      const eId = String(a.facultyEmployeeId || '').toLowerCase().trim();
      const em = String(a.facultyEmail || '').toLowerCase().trim();
      const fn = String(a.facultyName || '').toLowerCase().trim();

      return (
        fId === cleanTarget ||
        uId === cleanTarget ||
        (cleanResolved && (fId === cleanResolved || uId === cleanResolved)) ||
        (userEmail && em && em === userEmail) ||
        (userEmpId && eId && eId === userEmpId) ||
        (userName && fn && fn === userName)
      );
    });

    const enriched = activeAssignments.map(a => {
      const yearSuffix = a.year === 1 ? '1st' : a.year === 2 ? '2nd' : a.year === 3 ? '3rd' : `${a.year}th`;
      const courseName = a.name || a.subjectName || 'Assigned Course';
      const courseCode = a.code || a.subjectCode || '—';
      const branchDisplay = a.branchDisplayName || a.departmentCode || a.branch || 'CSE';
      const reg = a.regulation || 'AR23';
      const acadYear = a.academicYear || '2025–2026';
      const creditsNum = Number(a.credits || a.subjectCredits || 3);
      const studentCount = typeof a.studentCount === 'number' ? a.studentCount : 0;

      return {
        ...a,
        id: a.id || a.assignmentId,
        assignmentId: a.id || a.assignmentId,
        name: courseName,
        subjectName: courseName,
        code: courseCode,
        subjectCode: courseCode,
        branchDisplayName: branchDisplay,
        departmentCode: branchDisplay,
        credits: creditsNum,
        subjectCredits: creditsNum,
        regulation: reg,
        academicYear: acadYear,
        studentCount,
        studentCountLabel: `${studentCount} Enrolled`,
        status: a.isActive !== false ? 'Active' : 'Inactive',
        progress: 0,
        formattedClass: `${branchDisplay} · ${yearSuffix} Year · Semester ${a.semester} · Section ${a.section}`
      };
    });

    return enriched;
  }

  /**
   * Get Students belonging to the sections assigned to a specific Faculty.
   * Queries real students matching the assignment's (department_id, year, semester, section).
   */
  async getFacultyAssignedStudents(facultyUserIdOrId, selectedSection = null, selectedAssignmentId = null) {
    const assignedClasses = await this.getFacultyAssignedClasses(facultyUserIdOrId);

    if (!assignedClasses || assignedClasses.length === 0) {
      return [];
    }

    let targetClasses = assignedClasses;
    if (selectedAssignmentId && selectedAssignmentId !== 'All') {
      targetClasses = targetClasses.filter(c => (c.assignmentId || c.id) === selectedAssignmentId);
    }
    if (selectedSection && selectedSection !== 'All') {
      const cleanTargetSec = normalizeSection(selectedSection);
      targetClasses = targetClasses.filter(c => normalizeSection(c.section) === cleanTargetSec);
    }

    if (targetClasses.length === 0) return [];

    const allMatchingStudents = [];
    const seenStudentIds = new Set();

    if (isSupabaseConfigured()) {
      for (const cls of targetClasses) {
        try {
          const deptId = cls.departmentId || cls.department_id;
          const isUuid = deptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(deptId).trim());
          if (isUuid) {
            const { data: students, error } = await supabase
              .from('students')
              .select(`
                id,
                user_id,
                roll_number,
                department_id,
                year,
                semester,
                section,
                program,
                departments:department_id ( id, name, code ),
                users:user_id ( id, full_name, email, status )
              `)
              .eq('department_id', deptId)
              .eq('year', cls.year)
              .eq('semester', cls.semester)
              .eq('section', cls.section);

            if (!error && Array.isArray(students)) {
              for (const s of students) {
                if (!seenStudentIds.has(s.id)) {
                  seenStudentIds.add(s.id);
                  const u = s.users || {};
                  const d = s.departments || {};
                  allMatchingStudents.push({
                    id: s.id,
                    user_id: s.user_id,
                    name: u.full_name || `Student ${s.roll_number}`,
                    email: u.email || '',
                    rollNumber: s.roll_number || '',
                    roll_number: s.roll_number || '',
                    department: d.name || cls.departmentName,
                    departmentCode: cls.branchDisplayName,
                    departmentId: s.department_id,
                    branchId: cls.branch,
                    year: s.year,
                    semester: s.semester,
                    section: s.section,
                    program: s.program || 'B.Tech',
                    regulation: cls.regulation,
                    academicYear: cls.academicYear,
                    attendance: 0,
                    status: u.status || 'Active',
                    isAtRisk: false,
                    user: {
                      full_name: u.full_name || `Student ${s.roll_number}`,
                      email: u.email || ''
                    }
                  });
                }
              }
            }
          }
        } catch (e) {}
      }
    }

    if (allMatchingStudents.length === 0) {
      try {
        const allUsers = await userManagementService.getAllUsers();
        const studentUsers = (allUsers || []).filter(u => u.role === 'student' && isUserActive(u));
        for (const cls of targetClasses) {
          const matched = studentUsers.filter(s => matchesCohort(s, cls));
          for (const s of matched) {
            const sid = String(s.id || s.userId || '').toLowerCase().trim();
            const sRoll = String(s.rollNumber || s.roll_number || '').toUpperCase().trim();
            const sEmail = String(s.email || '').toLowerCase().trim();
            const dedupKey = sid || sEmail || sRoll;
            if (dedupKey && !seenStudentIds.has(dedupKey)) {
              seenStudentIds.add(dedupKey);
              if (sEmail) seenStudentIds.add(`email_${sEmail}`);
              if (sRoll) seenStudentIds.add(`roll_${sRoll}`);
              allMatchingStudents.push({
                ...s,
                id: s.id || s.userId,
                user_id: s.userId || s.id,
                departmentCode: cls.branchDisplayName || s.branchDisplayName || 'CSE',
                branchId: cls.branch || s.branch || 'CSE',
                regulation: cls.regulation || s.regulation || 'AR23',
                academicYear: cls.academicYear || s.academicYear || '2025-2026',
                attendance: 0,
                isAtRisk: false,
                user: {
                  full_name: s.name,
                  email: s.email
                }
              });
            }
          }
        }
      } catch (e) {}
    }

    return allMatchingStudents;
  }

  /**
   * Dynamic Mapped Students query for a single faculty assignment.
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

    if (isSupabaseConfigured()) {
      try {
        const resolvedDeptId = await this.resolveDepartmentId(assignment.departmentId || assignment.department_id);
        const isUuid = resolvedDeptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(resolvedDeptId).trim());
        if (isUuid) {
          const { data: students, error } = await supabase
            .from('students')
            .select(`
              id,
              user_id,
              roll_number,
              department_id,
              year,
              semester,
              section,
              program,
              departments:department_id ( id, name, code ),
              users:user_id ( id, full_name, email, status )
            `)
            .eq('department_id', resolvedDeptId)
            .eq('year', Number(assignment.year))
            .eq('semester', Number(assignment.semester))
            .eq('section', String(assignment.section).toUpperCase().trim());

          if (!error && Array.isArray(students) && students.length > 0) {
            return students.map(s => {
              const u = s.users || {};
              const d = s.departments || {};
              return {
                id: s.id,
                user_id: s.user_id,
                name: u.full_name || `Student ${s.roll_number}`,
                email: u.email || '',
                rollNumber: s.roll_number || '',
                roll_number: s.roll_number || '',
                department: d.name || 'Computer Science and Engineering',
                departmentCode: d.code || 'CSE',
                departmentId: s.department_id,
                branchId: d.code || 'CSE',
                section: s.section,
                year: s.year,
                semester: s.semester,
                regulation: assignment.regulation || 'AR23',
                academicYear: assignment.academicYear || '2025-2026',
                attendance: 0,
                status: u.status || 'Active',
                isAtRisk: false,
                user: {
                  full_name: u.full_name || `Student ${s.roll_number}`,
                  email: u.email || ''
                }
              };
            });
          }
        }
      } catch (err) {
        console.warn('[FacultyAssignmentService] Error querying students for assignment:', err);
      }
    }

    try {
      const allUsers = await userManagementService.getAllUsers();
      const studentUsers = (allUsers || []).filter(u => u.role === 'student' && isUserActive(u));
      const matched = studentUsers.filter(s => matchesCohort(s, assignment));
      const seen = new Set();
      const result = [];
      for (const s of matched) {
        const sid = String(s.id || s.userId || '').toLowerCase().trim();
        const sRoll = String(s.rollNumber || s.roll_number || '').toUpperCase().trim();
        const sEmail = String(s.email || '').toLowerCase().trim();
        const dedupKey = sid || sEmail || sRoll;
        if (dedupKey && !seen.has(dedupKey)) {
          seen.add(dedupKey);
          if (sEmail) seen.add(`email_${sEmail}`);
          if (sRoll) seen.add(`roll_${sRoll}`);
          result.push({
            ...s,
            id: s.id || s.userId,
            user_id: s.userId || s.id,
            departmentCode: assignment.branchDisplayName || s.branchDisplayName || 'CSE',
            branchId: assignment.branch || s.branch || 'CSE',
            regulation: assignment.regulation || s.regulation || 'AR23',
            academicYear: assignment.academicYear || s.academicYear || '2025-2026',
            attendance: 0,
            isAtRisk: false,
            user: {
              full_name: s.name,
              email: s.email
            }
          });
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  }

  async getStudentsForAssignment(assignmentId) {
    return this.getStudentsForFacultyAssignment(assignmentId);
  }

  /**
   * Get Enrolled Subjects & Assigned Faculty for a logged-in Student.
   */
  async getStudentAssignedSubjects(studentUserIdOrId, studentProfile = null) {
    if (!studentUserIdOrId && !studentProfile) return [];

    let activeAssignments = [];

    if (isSupabaseConfigured()) {
      try {
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id, user_id, department_id, year, semester, section, roll_number, departments(id, name, code)')
          .or(`user_id.eq.${studentUserIdOrId},id.eq.${studentUserIdOrId}`)
          .maybeSingle();

        const deptId = studentRecord?.department_id || studentProfile?.departmentId;
        const year = studentRecord?.year || studentProfile?.year || 4;
        const semester = studentRecord?.semester || studentProfile?.semester || 7;
        const section = studentRecord?.section || studentProfile?.section || 'A';

        if (deptId) {
          const { data: assignments, error } = await supabase
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
              is_active,
              faculty:faculty_id (
                id,
                user_id,
                employee_id,
                designation,
                users:user_id ( id, full_name, email )
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
              departments:department_id ( id, name, code )
            `)
            .eq('department_id', deptId)
            .eq('year', year)
            .eq('semester', semester)
            .eq('section', section)
            .eq('is_active', true);

          if (!error && Array.isArray(assignments) && assignments.length > 0) {
            activeAssignments = assignments.map(a => {
              const facObj = a.faculty || {};
              const userObj = facObj.users || {};
              const subObj = a.subjects || {};
              const deptObj = a.departments || {};

              return {
                id: a.subject_id || a.id,
                name: subObj.name || 'Subject',
                code: subObj.code || '',
                credits: Number(subObj.credits) || 3,
                semester: a.semester,
                regulation: a.regulation || 'AR23',
                departmentId: a.department_id,
                departmentCode: deptObj.code || 'CSE',
                branchId: deptObj.code || 'CSE',
                subjectType: subObj.subject_type || 'CORE',
                faculty: userObj.full_name || 'Faculty Member',
                facultyEmail: userObj.email || null,
                facultyEmployeeId: facObj.employee_id || null,
                facultyDesignation: facObj.designation || 'Assistant Professor',
                facultyAssignmentId: a.id,
                assignedSection: a.section,
                hasAssignedFaculty: true,
                progress: 0,
                units: [
                  { unitNumber: 1, title: 'Unit 1: Foundational Principles and Concepts', progress: 0 },
                  { unitNumber: 2, title: 'Unit 2: Theoretical Models & Methodologies', progress: 0 },
                  { unitNumber: 3, title: 'Unit 3: Implementation & Practical Applications', progress: 0 },
                  { unitNumber: 4, title: 'Unit 4: Advanced Topics & State-of-the-Art', progress: 0 }
                ]
              };
            });
          }
        }
      } catch (err) {
        console.warn('[FacultyAssignmentService] Error querying student subjects:', err);
      }
    }

    if (activeAssignments.length === 0) {
      const { data: allAssignments } = await this.getAssignments({ status: 'active' });
      const matchedAsmts = (allAssignments || []).filter(a => matchesCohort(studentProfile || { id: studentUserIdOrId }, a));
      activeAssignments = matchedAsmts.map(a => ({
        id: a.subjectId || a.id,
        name: a.subjectName || 'Subject',
        code: a.subjectCode || '',
        credits: a.subjectCredits || 3,
        semester: a.semester,
        regulation: a.regulation || 'AR23',
        departmentId: a.departmentId,
        departmentCode: a.departmentCode || 'CSE',
        branchId: a.branch || 'CSE',
        subjectType: a.subjectType || 'CORE',
        faculty: a.facultyName || 'Faculty Member',
        facultyEmail: a.facultyEmail || null,
        facultyEmployeeId: a.facultyEmployeeId || null,
        facultyDesignation: a.facultyDesignation || 'Assistant Professor',
        facultyAssignmentId: a.id,
        assignedSection: a.section,
        hasAssignedFaculty: true,
        progress: 0,
        units: [
          { unitNumber: 1, title: 'Unit 1: Foundational Principles and Concepts', progress: 0 },
          { unitNumber: 2, title: 'Unit 2: Theoretical Models & Methodologies', progress: 0 },
          { unitNumber: 3, title: 'Unit 3: Implementation & Practical Applications', progress: 0 },
          { unitNumber: 4, title: 'Unit 4: Advanced Topics & State-of-the-Art', progress: 0 }
        ]
      }));
    }

    return activeAssignments;
  }

  /**
   * Real Dynamic Admin Statistics for Dashboard
   */
  async getAdminDashboardStats() {
    const [{ count: totalFaculty }, { count: totalStudents }, { count: activeAssignments }] = await Promise.all([
      supabase.from('faculty').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('faculty_assignments').select('id', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return {
      totalFaculty: totalFaculty || 0,
      totalStudents: totalStudents || 0,
      activeAssignments: activeAssignments || 0,
      systemStatus: 'Operational'
    };
  }
}

export const facultyAssignmentService = new FacultyAssignmentService();
export default facultyAssignmentService;
