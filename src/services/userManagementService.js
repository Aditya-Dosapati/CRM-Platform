// GMR CRM - User Management & Admin Governance Service
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import auditService from './auditService.js';

class UserManagementService {
  /**
   * Fetch all users joined with students, faculty, and department metadata.
   * Normalizes output into a safe, clean array.
   */
  async getAllUsers() {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      // 1. Fetch users from public.users
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, full_name, role, status, created_at, last_login')
        .order('created_at', { ascending: false });

      if (uErr) {
        console.error('[UserManagementService] Error fetching users:', uErr.message);
        return [];
      }

      if (!Array.isArray(users) || users.length === 0) {
        return [];
      }

      // 2. Fetch student records with department details
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

      // 3. Fetch faculty records with department details
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

      const studentMap = new Map((students || []).map(s => [s.user_id, s]));
      const facultyMap = new Map((faculty || []).map(f => [f.user_id, f]));

      // 4. Merge records into unified shape
      return users.map(u => {
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
          departmentName = studentInfo.departments?.name || studentInfo.departments?.code || '—';
          departmentId = studentInfo.department_id;
          rollNumber = studentInfo.roll_number || '';
          year = studentInfo.year ? (typeof studentInfo.year === 'number' ? `Year ${studentInfo.year}` : studentInfo.year) : '—';
          semester = studentInfo.semester ? `Sem ${studentInfo.semester}` : '—';
          section = studentInfo.section || 'A';
          program = studentInfo.program || 'B.Tech';
        } else if (facultyInfo) {
          departmentName = facultyInfo.departments?.name || facultyInfo.departments?.code || '—';
          departmentId = facultyInfo.department_id;
          employeeId = facultyInfo.employee_id || '';
          designation = facultyInfo.designation || 'Faculty';
        } else if (rawRole === 'admin') {
          departmentName = 'Institutional Administration';
        }

        const normalizedStatus = (u.status || 'Active').trim();
        const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1).toLowerCase();

        return {
          id: u.id,
          userId: u.id,
          email: u.email || '',
          name: u.full_name || (u.email ? u.email.split('@')[0] : 'User'),
          role: rawRole,
          displayRole: rawRole ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1) : 'Unknown',
          status: displayStatus,
          rawStatus: normalizedStatus.toLowerCase(),
          department: departmentName,
          departmentId,
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
    } catch (err) {
      console.error('[UserManagementService] Exception fetching users:', err);
      return [];
    }
  }

  /**
   * Fetch all pending user registration requests for Admin approval.
   */
  async getPendingRegistrations() {
    const all = await this.getAllUsers();
    return all.filter(u => u.rawStatus === 'pending');
  }

  /**
   * Admin approves a user registration (transitions status: pending -> active)
   */
  async approveUser(userId, adminName = 'Admin') {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error('Supabase client not configured or invalid User ID.');
    }

    try {
      // 1. Try RPC function first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_approve_user', {
        p_user_id: userId
      });

      if (!rpcErr && rpcRes?.success) {
        auditService.logAction({
          user: adminName,
          role: 'admin',
          userId,
          action: 'Approve User Registration',
          resource: '/admin/users',
          result: 'Success',
          details: `User ID [${userId}] registration approved and account activated.`
        });
        return rpcRes;
      }

      // 2. Direct Table Update fallback
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
        details: `User ID [${userId}] registration approved and account activated.`
      });

      return { success: true, userId, status: 'active' };
    } catch (err) {
      console.error('[UserManagementService] Error approving user:', err);
      throw new Error(err.message || 'Failed to approve user registration.');
    }
  }

  /**
   * Admin rejects a user registration (transitions status: pending -> rejected)
   */
  async rejectUser(userId, reason = 'Administrative verification rejected', adminName = 'Admin') {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error('Supabase client not configured or invalid User ID.');
    }

    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_reject_user', {
        p_user_id: userId,
        p_reason: reason
      });

      if (!rpcErr && rpcRes?.success) {
        auditService.logAction({
          user: adminName,
          role: 'admin',
          userId,
          action: 'Reject User Registration',
          resource: '/admin/users',
          result: 'Rejected',
          details: `User ID [${userId}] registration rejected. Reason: ${reason}`
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
        details: `User ID [${userId}] registration rejected. Reason: ${reason}`
      });

      return { success: true, userId, status: 'rejected' };
    } catch (err) {
      console.error('[UserManagementService] Error rejecting user:', err);
      throw new Error(err.message || 'Failed to reject user registration.');
    }
  }

  /**
   * Toggle or set status (active, inactive, pending, rejected)
   */
  async setUserStatus(userId, status, adminName = 'Admin') {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error('Supabase client not configured or invalid User ID.');
    }

    const cleanStatus = (status || '').toLowerCase().trim();
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_set_user_status', {
        p_user_id: userId,
        p_status: cleanStatus
      });

      if (!rpcErr && rpcRes?.success) {
        auditService.logAction({
          user: adminName,
          role: 'admin',
          userId,
          action: 'Update User Status',
          resource: '/admin/users',
          result: 'Success',
          details: `User ID [${userId}] status updated to [${cleanStatus.toUpperCase()}].`
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
        details: `User ID [${userId}] status updated to [${cleanStatus.toUpperCase()}].`
      });

      return { success: true, userId, status: cleanStatus };
    } catch (err) {
      console.error('[UserManagementService] Error updating user status:', err);
      throw new Error(err.message || 'Failed to update user status.');
    }
  }

  /**
   * Single user provisioning by Admin using secure Edge Function
   */
  async provisionUser(userData) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client not configured.');
    }

    const role = (userData.role || 'student').toLowerCase().trim();
    const email = (userData.email || '').toLowerCase().trim();
    const name = (userData.name || '').trim();
    const password = (userData.password || userData.temporaryPassword || 'GMRIT@' + Math.floor(1000 + Math.random() * 9000)).trim();

    try {
      // 1. Invoke admin-provision-user Edge Function
      const { data, error: fnErr } = await supabase.functions.invoke('admin-provision-user', {
        body: {
          action: 'single',
          role,
          name,
          email,
          password,
          departmentId: userData.departmentId || null,
          rollNumber: userData.rollNumber || null,
          employeeId: userData.employeeId || null,
          program: userData.program || 'B.Tech',
          year: userData.year ? Number(userData.year) : 1,
          section: userData.section || 'A',
          designation: userData.designation || 'Assistant Professor',
          status: userData.status || 'active'
        }
      });

      if (!fnErr && data?.success) {
        auditService.logAction({
          user: 'Admin',
          role: 'admin',
          userId: data.userId || email,
          action: 'Provision User Account',
          resource: '/admin/users',
          result: 'Success',
          details: `Provisioned new [${role.toUpperCase()}] account for ${name} (${email}).`
        });

        return {
          ...data,
          tempPass: password
        };
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (fnErr) {
        let detailedMsg = fnErr.message || '';
        try {
          if (fnErr.context && typeof fnErr.context.json === 'function') {
            const errBody = await fnErr.context.json();
            if (errBody?.error) detailedMsg = errBody.error;
          }
        } catch (_) {}
        if (detailedMsg && !detailedMsg.includes('FunctionsHttpError')) {
          throw new Error(detailedMsg);
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (!msg.includes('FunctionsFetchError') && !msg.includes('Failed to send a request to Edge Function')) {
        throw err;
      }
      console.warn('[UserManagementService] admin-provision-user Edge Function offline notice:', msg);
    }

    // Direct table upsert fallback for Admin
    try {
      const { data: userProfile, error: uErr } = await supabase
        .from('users')
        .insert([{
          email,
          full_name: name,
          role,
          status: userData.status || 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (uErr) throw uErr;

      if (role === 'student') {
        const numYear = userData.year ? Number(userData.year) : 1;
        await supabase.from('students').insert([{
          user_id: userProfile.id,
          roll_number: userData.rollNumber ? userData.rollNumber.trim().toUpperCase() : null,
          department_id: userData.departmentId || null,
          year: numYear,
          semester: numYear * 2 - 1,
          section: userData.section || 'A',
          program: userData.program || 'B.Tech'
        }]);
      } else if (role === 'faculty') {
        await supabase.from('faculty').insert([{
          user_id: userProfile.id,
          employee_id: userData.employeeId ? userData.employeeId.trim().toUpperCase() : null,
          department_id: userData.departmentId || null,
          designation: userData.designation || 'Assistant Professor'
        }]);
      }

      auditService.logAction({
        user: 'Admin',
        role: 'admin',
        userId: userProfile.id,
        action: 'Provision User Account',
        resource: '/admin/users',
        result: 'Success',
        details: `Provisioned new [${role.toUpperCase()}] profile for ${name} (${email}).`
      });

      return {
        success: true,
        userId: userProfile.id,
        email,
        name,
        role,
        status: userData.status || 'active',
        tempPass: password
      };
    } catch (dbErr) {
      throw new Error(dbErr.message || 'Failed to provision user profile.');
    }
  }

  /**
   * RFC-4180 Compliant CSV Text Parser
   */
  parseCsv(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];
    
    const lines = [];
    let row = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
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
        } else if (char === '\r' || char === '\n') {
          row.push(currentField.trim());
          currentField = '';
          if (row.some(f => f.length > 0)) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++; // Skip \r\n
          }
        } else {
          currentField += char;
        }
      }
    }

    if (currentField.length > 0 || row.length > 0) {
      row.push(currentField.trim());
      if (row.some(f => f.length > 0)) {
        lines.push(row);
      }
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.toLowerCase().replace(/[\s_-]+/g, '_').trim());
    const dataRows = [];

    for (let i = 1; i < lines.length; i++) {
      const rowValues = lines[i];
      const rowObj = { _rowNumber: i + 1 };
      headers.forEach((h, colIdx) => {
        rowObj[h] = rowValues[colIdx] !== undefined ? rowValues[colIdx] : '';
      });
      dataRows.push(rowObj);
    }

    return dataRows;
  }

  /**
   * Pre-import Student CSV Validation Engine
   */
  validateStudentCsv(dataRows, departments = []) {
    const validRows = [];
    const invalidRows = [];
    const seenRollNumbers = new Set();
    const seenEmails = new Set();

    const deptCodeMap = new Map();
    departments.forEach(d => {
      deptCodeMap.set((d.code || '').toUpperCase(), d.id);
      deptCodeMap.set((d.name || '').toUpperCase(), d.id);
    });

    dataRows.forEach((row, idx) => {
      const errors = [];
      const rowNum = row._rowNumber || idx + 2;

      // Extract fields with aliases
      const name = (row.full_name || row.name || row.student_name || '').trim();
      const email = (row.email || row.institutional_email || row.email_address || '').trim().toLowerCase();
      const rollNumber = (row.roll_number || row.roll_no || row.student_id || row.htno || '').trim().toUpperCase();
      const deptVal = (row.department || row.department_code || row.branch || '').trim().toUpperCase();
      const yearVal = row.year || row.academic_year_number || '1';
      const section = (row.section || 'A').trim().toUpperCase();
      const program = (row.program || 'B.Tech').trim();

      // Validations
      if (!name || name.length < 2) {
        errors.push('Full Name is required (minimum 2 characters).');
      }

      if (!email || !email.includes('@') || !email.includes('.')) {
        errors.push('Valid email address is required.');
      } else if (seenEmails.has(email)) {
        errors.push(`Duplicate email "${email}" found in CSV.`);
      } else {
        seenEmails.add(email);
      }

      if (!rollNumber) {
        errors.push('Roll Number is required.');
      } else if (seenRollNumbers.has(rollNumber)) {
        errors.push(`Duplicate Roll Number "${rollNumber}" found in CSV.`);
      } else {
        seenRollNumbers.add(rollNumber);
      }

      let departmentId = null;
      if (deptVal) {
        departmentId = deptCodeMap.get(deptVal) || null;
      }

      const validatedRecord = {
        _rowNumber: rowNum,
        name,
        email,
        rollNumber,
        departmentVal: deptVal,
        departmentId,
        year: parseInt(yearVal, 10) || 1,
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
        validRows.push(validatedRecord);
      }
    });

    return {
      totalRows: dataRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      isValid: invalidRows.length === 0,
      validRows,
      invalidRows
    };
  }

  /**
   * Pre-import Faculty CSV Validation Engine
   */
  validateFacultyCsv(dataRows, departments = []) {
    const validRows = [];
    const invalidRows = [];
    const seenEmployeeIds = new Set();
    const seenEmails = new Set();

    const deptCodeMap = new Map();
    departments.forEach(d => {
      deptCodeMap.set((d.code || '').toUpperCase(), d.id);
      deptCodeMap.set((d.name || '').toUpperCase(), d.id);
    });

    dataRows.forEach((row, idx) => {
      const errors = [];
      const rowNum = row._rowNumber || idx + 2;

      const name = (row.full_name || row.name || row.faculty_name || '').trim();
      const email = (row.email || row.institutional_email || row.email_address || '').trim().toLowerCase();
      const employeeId = (row.employee_id || row.emp_id || row.faculty_id || '').trim().toUpperCase();
      const deptVal = (row.department || row.department_code || row.branch || '').trim().toUpperCase();
      const designation = (row.designation || 'Assistant Professor').trim();

      if (!name || name.length < 2) {
        errors.push('Full Name is required.');
      }

      if (!email || !email.includes('@')) {
        errors.push('Valid email address is required.');
      } else if (seenEmails.has(email)) {
        errors.push(`Duplicate email "${email}" found in CSV.`);
      } else {
        seenEmails.add(email);
      }

      if (!employeeId) {
        errors.push('Employee ID is required.');
      } else if (seenEmployeeIds.has(employeeId)) {
        errors.push(`Duplicate Employee ID "${employeeId}" found in CSV.`);
      } else {
        seenEmployeeIds.add(employeeId);
      }

      let departmentId = null;
      if (deptVal) {
        departmentId = deptCodeMap.get(deptVal) || null;
      }

      const validatedRecord = {
        _rowNumber: rowNum,
        name,
        email,
        employeeId,
        departmentVal: deptVal,
        departmentId,
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
        validRows.push(validatedRecord);
      }
    });

    return {
      totalRows: dataRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      isValid: invalidRows.length === 0,
      validRows,
      invalidRows
    };
  }

  /**
   * Execute Bulk Import for Students with rollback safety
   */
  async executeStudentBulkImport(validRows, fallbackDeptId = null, onProgress = null) {
    if (!Array.isArray(validRows) || validRows.length === 0) {
      return { total: 0, succeeded: 0, failed: 0, errors: [] };
    }

    const errors = [];
    let succeeded = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const deptId = row.departmentId || fallbackDeptId;
        const tempPass = 'GMRIT@' + Math.floor(1000 + Math.random() * 9000);

        await this.provisionUser({
          role: 'student',
          name: row.name,
          email: row.email,
          rollNumber: row.rollNumber,
          departmentId: deptId,
          year: row.year || 1,
          section: row.section || 'A',
          program: row.program || 'B.Tech',
          temporaryPassword: tempPass,
          status: 'active'
        });

        succeeded++;
      } catch (err) {
        errors.push(`Row ${row._rowNumber} (${row.email}): ${err.message}`);
      }

      if (typeof onProgress === 'function') {
        onProgress(Math.round(((i + 1) / validRows.length) * 100));
      }
    }

    auditService.logAction({
      user: 'Admin',
      role: 'admin',
      userId: 'BULK_IMPORT',
      action: 'Bulk Student Import',
      resource: '/admin/users/import',
      result: errors.length === 0 ? 'Success' : 'Partial Success',
      details: `Bulk imported ${succeeded}/${validRows.length} student records.`
    });

    return {
      total: validRows.length,
      succeeded,
      failed: errors.length,
      errors
    };
  }

  /**
   * Execute Bulk Import for Faculty
   */
  async executeFacultyBulkImport(validRows, fallbackDeptId = null, onProgress = null) {
    if (!Array.isArray(validRows) || validRows.length === 0) {
      return { total: 0, succeeded: 0, failed: 0, errors: [] };
    }

    const errors = [];
    let succeeded = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const deptId = row.departmentId || fallbackDeptId;
        const tempPass = 'GMRIT@' + Math.floor(1000 + Math.random() * 9000);

        await this.provisionUser({
          role: 'faculty',
          name: row.name,
          email: row.email,
          employeeId: row.employeeId,
          departmentId: deptId,
          designation: row.designation || 'Assistant Professor',
          temporaryPassword: tempPass,
          status: 'active'
        });

        succeeded++;
      } catch (err) {
        errors.push(`Row ${row._rowNumber} (${row.email}): ${err.message}`);
      }

      if (typeof onProgress === 'function') {
        onProgress(Math.round(((i + 1) / validRows.length) * 100));
      }
    }

    auditService.logAction({
      user: 'Admin',
      role: 'admin',
      userId: 'BULK_IMPORT',
      action: 'Bulk Faculty Import',
      resource: '/admin/users/import',
      result: errors.length === 0 ? 'Success' : 'Partial Success',
      details: `Bulk imported ${succeeded}/${validRows.length} faculty records.`
    });

    return {
      total: validRows.length,
      succeeded,
      failed: errors.length,
      errors
    };
  }
}

export const userManagementService = new UserManagementService();
export default userManagementService;
