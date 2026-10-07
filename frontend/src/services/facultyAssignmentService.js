// GMR CRM - Faculty Assignment Management Service
// Fully Database-Driven Architecture backed by Supabase public.faculty_assignments
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import auditService from './auditService.js';
import {
  resolveDepartment,
  resolveBranch,
  getBranchDisplay,
  normalizeYear,
  normalizeSemester,
  normalizeSection,
  normalizeAcademicYear,
  normalizeRegulation,
  extractCanonicalCohort
} from './academicCohortService.js';

class FacultyAssignmentService {
  constructor() {
    this._listeners = new Set();
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

    // 1. Direct query in faculty table by primary key id
    const { data: byId } = await supabase
      .from('faculty')
      .select('id, user_id, employee_id')
      .eq('id', clean)
      .maybeSingle();

    if (byId?.id) return byId.id;

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

    // Check by code (e.g. CSE, AIML, AIDS)
    const normalizedCode = clean.replace(/^dept-/i, '').replace(/^CSE-/i, '').toUpperCase();
    const { data: byCode } = await supabase
      .from('departments')
      .select('id, code')
      .ilike('code', normalizedCode)
      .maybeSingle();

    if (byCode?.id) return byCode.id;

    // If searching for CSE-AIML or AIML
    if (normalizedCode === 'AIML' || clean.includes('AIML')) {
      const { data: aiml } = await supabase.from('departments').select('id').ilike('code', 'AIML').maybeSingle();
      if (aiml?.id) return aiml.id;
    }
    if (normalizedCode === 'AIDS' || clean.includes('AIDS')) {
      const { data: aids } = await supabase.from('departments').select('id').ilike('code', 'AIDS').maybeSingle();
      if (aids?.id) return aids.id;
    }
    if (normalizedCode === 'CSE' || clean.includes('CSE')) {
      const { data: cse } = await supabase.from('departments').select('id').ilike('code', 'CSE').maybeSingle();
      if (cse?.id) return cse.id;
    }

    return clean;
  }

  /**
   * Helper to resolve subject UUID in public.subjects
   */
  async resolveSubjectId(subjectIdentifier) {
    if (!subjectIdentifier) return null;
    const clean = String(subjectIdentifier).trim();
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
    if (!isSupabaseConfigured()) {
      return { data: [], source: 'supabase', totalCount: 0 };
    }

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

      if (error) {
        console.error('[FacultyAssignmentService] Error querying faculty_assignments from Supabase:', error.message);
        return { data: [], error: error.message, totalCount: 0 };
      }

      // Normalize records
      let normalized = (data || []).map(a => {
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
          subjectName: subObj.name || 'Subject',
          subjectCode: subObj.code || '',
          subjectCredits: Number(subObj.credits) || 3,
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
        source: 'supabase',
        totalCount: normalized.length
      };
    } catch (err) {
      console.error('[FacultyAssignmentService] Exception in getAssignments:', err);
      return { data: [], error: err.message, totalCount: 0 };
    }
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

    const resolvedFacId = await this.resolveFacultyId(facultyId);
    const resolvedSubId = await this.resolveSubjectId(subjectId);
    const resolvedDeptId = await this.resolveDepartmentId(departmentId);

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
    const resolvedDeptId = updateData.departmentId ? await this.resolveDepartmentId(updateData.departmentId) : undefined;

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
   * Single Source of Truth for Faculty Dashboard and My Subjects page.
   * Returns ALL active assignments with real database-calculated student counts.
   */
  async getFacultyAssignedClasses(facultyUserIdOrId) {
    if (!facultyUserIdOrId) return [];

    const resolvedFacId = await this.resolveFacultyId(facultyUserIdOrId);
    const { data: allAssignments } = await this.getAssignments({ status: 'active' });

    const activeAssignments = (allAssignments || []).filter(a => {
      if (!a.isActive) return false;
      return (
        a.facultyId === resolvedFacId ||
        a.facultyUserId === facultyUserIdOrId ||
        a.facultyId === facultyUserIdOrId
      );
    });

    // Query real student counts from Supabase public.students for each assigned section
    const enriched = await Promise.all(activeAssignments.map(async (a) => {
      let studentCount = 0;
      try {
        const { count, error } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', a.departmentId)
          .eq('year', a.year)
          .eq('semester', a.semester)
          .eq('section', a.section);

        if (!error && typeof count === 'number') {
          studentCount = count;
        }
      } catch (err) {
        console.warn('[FacultyAssignmentService] Count fetch error:', err);
      }

      const yearSuffix = a.year === 1 ? '1st' : a.year === 2 ? '2nd' : a.year === 3 ? '3rd' : `${a.year}th`;

      return {
        ...a,
        studentCount,
        studentCountLabel: `${studentCount} Enrolled`,
        status: 'Active',
        progress: 0,
        formattedClass: `${a.branchDisplayName} • ${yearSuffix} Year • Semester ${a.semester} • Section ${a.section}`
      };
    }));

    return enriched;
  }

  /**
   * Get Students belonging to the sections assigned to a specific Faculty.
   * Queries real students from Supabase public.students matching the assignment's (department_id, year, semester, section).
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

    // Query students for each target class from Supabase
    const allMatchingStudents = [];
    const seenStudentIds = new Set();

    for (const cls of targetClasses) {
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
        .eq('department_id', cls.departmentId)
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

    return allMatchingStudents;
  }

  /**
   * Dynamic Mapped Students query for a single faculty assignment.
   * Loads live students directly from Supabase public.students.
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

    const resolvedDeptId = await this.resolveDepartmentId(assignment.departmentId || assignment.department_id);

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

    if (error || !Array.isArray(students)) {
      console.warn('[FacultyAssignmentService] Error querying students for assignment:', error);
      return [];
    }

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

  async getStudentsForAssignment(assignmentId) {
    return this.getStudentsForFacultyAssignment(assignmentId);
  }

  /**
   * Get Enrolled Subjects & Assigned Faculty for a logged-in Student.
   * Dynamically loads from Supabase public.faculty_assignments where student cohort matches.
   */
  async getStudentAssignedSubjects(studentUserIdOrId, studentProfile = null) {
    if (!studentUserIdOrId) return [];

    // Query student's record from public.students to get their exact department_id, year, semester, section
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id, user_id, department_id, year, semester, section, roll_number, departments(id, name, code)')
      .or(`user_id.eq.${studentUserIdOrId},id.eq.${studentUserIdOrId}`)
      .maybeSingle();

    const deptId = studentRecord?.department_id || studentProfile?.departmentId;
    const year = studentRecord?.year || studentProfile?.year || 4;
    const semester = studentRecord?.semester || studentProfile?.semester || 7;
    const section = studentRecord?.section || studentProfile?.section || 'A';

    if (!deptId) return [];

    // Query active faculty assignments for this student's exact department, year, semester, section
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

    if (error || !Array.isArray(assignments)) {
      console.warn('[FacultyAssignmentService] Error querying student subjects:', error);
      return [];
    }

    return assignments.map(a => {
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
