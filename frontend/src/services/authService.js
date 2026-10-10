// GMR CRM - Institutional Authentication Service (Supabase Auth & RBAC)
import auditService from './auditService.js';
import userManagementService from './userManagementService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const SESSION_STORAGE_KEY = 'gmrit_auth_session';

class AuthService {
  constructor() {
    this.currentSession = this.loadSession();
    this.authStateListeners = new Set();
    this.setupSupabaseListener();
  }

  setupSupabaseListener() {
    if (isSupabaseConfigured() && supabase?.auth?.onAuthStateChange) {
      try {
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT') {
            // Do not let a stale sign-out event clear the session just established by login.
            if (this.currentSession) return;

            this.saveSession(null);
            this.clearStaleStorage();
            this.notifyListeners('SIGNED_OUT', null, null);
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              const profile = await this.getBackendProfile(session.user.id, session.user.email);
              if (profile && profile.role) {
                const statusLower = String(profile.status || '').trim().toLowerCase();
                if (['inactive', 'deactivated', 'suspended', 'disabled', 'rejected', 'pending'].includes(statusLower)) {
                  await supabase.auth.signOut();
                  this.saveSession(null);
                  this.clearStaleStorage();
                  this.notifyListeners('SIGNED_OUT', null, null);
                  return;
                }

                const finalRole = String(profile.role).trim().toLowerCase();
                if (['admin', 'faculty', 'student'].includes(finalRole)) {
                  const userObj = {
                    userId: profile.id || session.user.id,
                    id: profile.id || session.user.id,
                    name: profile.name || profile.full_name || session.user.email.split('@')[0],
                    email: profile.email || session.user.email,
                    role: finalRole,
                    status: profile.status || 'Active',
                    department: profile.department || '',
                    mustChangePassword: Boolean(profile.must_change_password || profile.mustChangePassword),
                    avatar: (profile.name || profile.full_name || 'U').slice(0, 2).toUpperCase()
                  };

                  const updatedSession = {
                    sessionId: session.access_token ? `sess_${session.access_token.slice(-10)}` : `sess_${Date.now()}`,
                    userId: userObj.userId,
                    role: userObj.role,
                    name: userObj.name,
                    email: userObj.email,
                    mustChangePassword: userObj.mustChangePassword,
                    loginTimestamp: new Date().toISOString()
                  };
                  this.saveSession(updatedSession);
                  this.notifyListeners(event, userObj, updatedSession);
                }
              }
            }
          }
        });
      } catch (e) {
        console.warn('[AuthService] Could not attach Supabase auth state listener:', e);
      }
    }
  }

  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      this.authStateListeners.add(callback);
      return () => this.authStateListeners.delete(callback);
    }
    return () => {};
  }

  notifyListeners(event, user, session) {
    for (const listener of this.authStateListeners) {
      try {
        listener(event, user, session);
      } catch (e) {
        console.error('[AuthService] Listener error:', e);
      }
    }
  }

  clearStaleStorage() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem('gmrit_users_db');
        sessionStorage.removeItem('gmrit_user_profile');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gmrit_auth_session');
        localStorage.removeItem('gmrit_users_db');
        localStorage.removeItem('gmrit_user_profile');
      }
    } catch (e) {
      console.warn('[AuthService] Error clearing stale storage:', e);
    }
  }

  loadSession() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.userId && parsed.role && ['admin', 'faculty', 'student'].includes(parsed.role.toLowerCase())) {
            return {
              ...parsed,
              role: parsed.role.toLowerCase(),
              mustChangePassword: Boolean(parsed.mustChangePassword)
            };
          }
        }
      }
    } catch (e) {
      console.warn('[AuthService] Could not load session from storage:', e);
    }
    return null;
  }

  saveSession(session) {
    this.currentSession = session;
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (session) {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('[AuthService] Could not save session to storage:', e);
    }
  }

  /**
   * Enrich base user profile with real database records from public.students or public.faculty
   */
  async enrichUserWithAcademicData(baseUser) {
    if (!baseUser || !baseUser.id) return baseUser;
    const role = (baseUser.role || '').toLowerCase().trim();

    if (role === 'student') {
      try {
        const { data: stRow } = await supabase
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
            departments:department_id ( id, code, name )
          `)
          .eq('user_id', baseUser.id)
          .maybeSingle();

        if (stRow) {
          const deptCode = stRow.departments?.code || 'CSE';
          const deptName = stRow.departments?.name || '';
          return {
            ...baseUser,
            studentId: stRow.id,
            rollNumber: stRow.roll_number || '',
            departmentId: stRow.department_id,
            departmentCode: deptCode,
            departmentName: deptName,
            department: deptName || deptCode,
            branch: deptCode,
            branchId: deptCode,
            year: Number(stRow.year) || 4,
            semester: Number(stRow.semester) || 7,
            section: String(stRow.section || 'A').toUpperCase().trim(),
            program: stRow.program || 'B.Tech',
            academicYear: stRow.academic_year || '2025-2026',
            regulation: stRow.regulation || 'AR23'
          };
        }
      } catch (err) {
        console.warn('[AuthService] Could not enrich student profile from public.students:', err);
      }
    } else if (role === 'faculty') {
      try {
        const { data: facRow } = await supabase
          .from('faculty')
          .select(`
            id,
            user_id,
            employee_id,
            department_id,
            designation,
            departments:department_id ( id, code, name )
          `)
          .eq('user_id', baseUser.id)
          .maybeSingle();

        if (facRow) {
          const deptCode = facRow.departments?.code || 'CSE';
          const deptName = facRow.departments?.name || '';
          return {
            ...baseUser,
            facultyId: facRow.id,
            employeeId: facRow.employee_id || '',
            departmentId: facRow.department_id,
            departmentCode: deptCode,
            departmentName: deptName,
            department: deptName || deptCode,
            branch: deptCode,
            designation: facRow.designation || 'Assistant Professor'
          };
        }
      } catch (err) {
        console.warn('[AuthService] Could not enrich faculty profile from public.faculty:', err);
      }
    }

    return baseUser;
  }

  /**
   * Query user profile and verified backend role from public.users table.
   * STRICT: Resolves role directly from public.users and enriches from academic tables.
   */
  async getBackendProfile(userId, email) {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      // 1. Primary lookup by UUID
      if (userId) {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, status, created_at, last_login, must_change_password')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('[AuthService] Error querying public.users by ID:', error.message);
        } else if (data) {
          const base = {
            ...data,
            id: data.id,
            userId: data.id,
            name: data.full_name || (data.email ? data.email.split('@')[0] : 'User'),
            role: (data.role || '').toLowerCase().trim(),
            status: data.status || 'Active',
            mustChangePassword: Boolean(data.must_change_password)
          };
          return await this.enrichUserWithAcademicData(base);
        }
      }

      // 2. Secondary fallback lookup by Email if ID lookup did not match
      if (email) {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, status, created_at, last_login, must_change_password')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (error) {
          console.error('[AuthService] Error querying public.users by email:', error.message);
        } else if (data) {
          const base = {
            ...data,
            id: data.id,
            userId: data.id,
            name: data.full_name || (data.email ? data.email.split('@')[0] : 'User'),
            role: (data.role || '').toLowerCase().trim(),
            status: data.status || 'Active',
            mustChangePassword: Boolean(data.must_change_password)
          };
          return await this.enrichUserWithAcademicData(base);
        }
      }
    } catch (err) {
      console.error('[AuthService] Supabase profile fetch exception:', err);
    }

    return null;
  }

  /**
   * Authenticate user with Supabase Auth credentials.
   * Role is STRICTLY resolved from public.users.role.
   */
  async login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      throw new Error("Please provide both email address and password.");
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured. Please check your .env settings.");
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanId,
      password: cleanPass
    });

    if (authError) {
      auditService.logAction({
        user: identifier,
        role: "unauthenticated",
        userId: identifier,
        action: "Authentication Attempt",
        resource: "/auth/login",
        result: "Failed",
        details: authError.message
      });

      const msg = (authError.message || '').toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid grant') || msg.includes('invalid credentials')) {
        throw new Error("Invalid email or password. Please verify your credentials.");
      } else if (msg.includes('email not confirmed')) {
        throw new Error("Email address is not confirmed. Please verify your email or contact your administrator.");
      } else if (msg.includes('invalid api key') || msg.includes('apikey') || msg.includes('jwt')) {
        throw new Error(`Invalid Supabase API credentials: ${authError.message}`);
      } else if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('enotfound')) {
        throw new Error(`Supabase connection failed: Unable to connect to Supabase server. Please check your network or VITE_SUPABASE_URL.`);
      }

      throw new Error(authError.message || "Authentication failed. Please verify your credentials.");
    }

    if (!authData?.user) {
      throw new Error("Authentication failed: No user returned from Supabase Auth.");
    }

    // Diagnostic Step 3: Log immediately after signInWithPassword()
    console.log('[Auth Diagnostics] signInWithPassword returned:', {
      authDataUserId: authData.user.id,
      authDataUserEmail: authData.user.email,
      sessionExists: Boolean(authData.session)
    });

    // Diagnostic Step 4: Explicitly call supabase.auth.getUser() to verify session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const currentUserFromAuth = userData?.user;

    console.log('[Auth Diagnostics] supabase.auth.getUser() result:', {
      userId: currentUserFromAuth?.id || null,
      userEmail: currentUserFromAuth?.email || null,
      userErrorCode: userError?.code || null,
      userErrorMessage: userError?.message || null,
      isExpectedAdminUid: (currentUserFromAuth?.id === '35f15d86-f4db-4b0f-ba31-48a977a692f3')
    });

    const activeAuthUid = currentUserFromAuth?.id || authData.user.id;
    const activeAuthEmail = currentUserFromAuth?.email || authData.user.email;

    // Diagnostic Step 5: Perform profile query using the authenticated session
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, must_change_password')
      .eq('id', activeAuthUid)
      .maybeSingle();

    console.log('[Auth Diagnostics] Profile query by UID:', {
      returnedRowExists: Boolean(profileData),
      dataId: profileData?.id || null,
      dataEmail: profileData?.email || null,
      dataRole: profileData?.role || null,
      dataStatus: profileData?.status || null,
      mustChangePassword: profileData?.must_change_password ?? false,
      errorCode: profileError?.code || null,
      errorMessage: profileError?.message || null
    });

    let profile = profileData;

    // If ID lookup did not return a row, fallback to email lookup
    if (!profile && activeAuthEmail) {
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('id, email, full_name, role, status, must_change_password')
        .eq('email', activeAuthEmail.toLowerCase().trim())
        .maybeSingle();

      console.log('[Auth Diagnostics] Profile query by Email fallback:', {
        returnedRowExists: Boolean(emailData),
        dataId: emailData?.id || null,
        dataEmail: emailData?.email || null,
        dataRole: emailData?.role || null,
        dataStatus: emailData?.status || null,
        mustChangePassword: emailData?.must_change_password ?? false,
        errorCode: emailError?.code || null,
        errorMessage: emailError?.message || null
      });

      if (emailData) {
        profile = emailData;
      }
    }

    if (!profile || !profile.role) {
      await supabase.auth.signOut();
      this.clearStaleStorage();
      throw new Error(`Profile Authorization Error: No user profile or role found in public.users for account "${activeAuthEmail}". (Auth UID: ${activeAuthUid}). Please contact the administrator.`);
    }

    const finalRole = String(profile.role).trim().toLowerCase();
    if (!['admin', 'faculty', 'student'].includes(finalRole)) {
      await supabase.auth.signOut();
      this.clearStaleStorage();
      throw new Error(`Authorization Error: Unrecognized role "${profile.role}" in database for user "${authData.user.email}".`);
    }

    const accountStatus = (profile.status || 'Active').trim().toLowerCase();

    if (accountStatus === 'pending') {
      await supabase.auth.signOut();
      this.clearStaleStorage();
      throw new Error("Your account registration is currently pending administrator approval. Please wait for an administrator to activate your account.");
    }

    if (accountStatus === 'rejected') {
      await supabase.auth.signOut();
      this.clearStaleStorage();
      throw new Error("Your registration request was rejected by administrator. Please contact the academic administration.");
    }

    if (accountStatus === 'inactive' || accountStatus === 'deactivated' || accountStatus === 'suspended' || accountStatus === 'disabled') {
      await supabase.auth.signOut();
      this.clearStaleStorage();
      throw new Error("Your account has been deactivated. Please contact the administrator.");
    }

    const mustChangePassword = Boolean(profile.must_change_password);

    let userObj = {
      userId: profile.id || authData.user.id,
      id: profile.id || authData.user.id,
      name: profile.name || profile.full_name || authData.user.email.split('@')[0],
      email: profile.email || authData.user.email,
      role: finalRole,
      status: accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1),
      department: profile.department || '',
      mustChangePassword: mustChangePassword,
      avatar: (profile.name || profile.full_name || 'U').slice(0, 2).toUpperCase()
    };

    userObj = await this.enrichUserWithAcademicData(userObj);

    const session = {
      sessionId: authData.session?.access_token ? `sess_${authData.session.access_token.slice(-10)}` : `sess_${Date.now()}`,
      userId: userObj.userId,
      role: userObj.role,
      name: userObj.name,
      email: userObj.email,
      mustChangePassword: mustChangePassword,
      loginTimestamp: new Date().toISOString(),
      studentId: userObj.studentId || null,
      facultyId: userObj.facultyId || null,
      rollNumber: userObj.rollNumber || null,
      employeeId: userObj.employeeId || null,
      departmentId: userObj.departmentId || null,
      departmentCode: userObj.departmentCode || null,
      departmentName: userObj.departmentName || null,
      branch: userObj.branch || null,
      branchId: userObj.branchId || null,
      year: userObj.year || null,
      semester: userObj.semester || null,
      section: userObj.section || null,
      program: userObj.program || null,
      academicYear: userObj.academicYear || null,
      regulation: userObj.regulation || null,
      designation: userObj.designation || null
    };

    this.saveSession(session);

    auditService.logAction({
      user: userObj.name,
      role: userObj.role,
      userId: userObj.userId,
      action: "User Login",
      resource: `/${userObj.role}/dashboard`,
      result: "Success",
      details: `Supabase authenticated session established for role [${userObj.role.toUpperCase()}]. Must change password: ${mustChangePassword}.`
    });

    return {
      user: userObj,
      session,
      isFirstLogin: mustChangePassword,
      mustChangePassword: mustChangePassword
    };
  }

  /**
   * Securely update password for the authenticated user and clear must_change_password flag
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const cleanCurrent = (currentPassword || '').trim();
    const cleanNew = (newPassword || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    if (!cleanNew) {
      throw new Error("New password is required.");
    }

    if (cleanNew.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    if (cleanNew !== cleanConfirm) {
      throw new Error("New password and confirm password do not match.");
    }

    if (cleanCurrent && cleanNew === cleanCurrent) {
      throw new Error("New password must be different from your current temporary password.");
    }

    // Password policy checks
    const hasUpper = /[A-Z]/.test(cleanNew);
    const hasLower = /[a-z]/.test(cleanNew);
    const hasNum = /[0-9]/.test(cleanNew);
    const hasSpecial = /[^A-Za-z0-9]/.test(cleanNew);

    if (!hasUpper || !hasLower || !hasNum || !hasSpecial) {
      throw new Error("Password must include uppercase, lowercase, a number, and a special character.");
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    // Verify session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const activeUser = userData?.user;
    if (userError || !activeUser) {
      throw new Error("Authentication session required to change password. Please sign in again.");
    }

    // If current password provided, verify it first against Supabase Auth
    if (cleanCurrent) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: activeUser.email,
        password: cleanCurrent
      });
      if (signInErr) {
        throw new Error("Current temporary password is incorrect. Please verify and try again.");
      }
    }

    // Update password in Supabase Auth
    const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
      password: cleanNew
    });

    if (updateErr) {
      throw new Error(updateErr.message || "Failed to update password in authentication system.");
    }

    // Clear must_change_password flag via secure RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc('complete_password_change');
    if (rpcErr) {
      console.warn('[AuthService] RPC complete_password_change notice:', rpcErr.message);
      // Fallback update under RLS
      await supabase.from('users').update({ must_change_password: false }).eq('id', activeUser.id);
    }

    // Update local session state
    if (this.currentSession) {
      this.currentSession.mustChangePassword = false;
      this.saveSession(this.currentSession);
    }

    auditService.logAction({
      user: activeUser.email,
      role: this.currentSession?.role || 'user',
      userId: activeUser.id,
      action: "Password Change",
      resource: "/auth/change-password",
      result: "Success",
      details: "Temporary password successfully updated to permanent password."
    });

    return {
      success: true,
      message: "Password changed successfully."
    };
  }

  /**
   * Backwards-compatible wrapper for first login completion
   */
  async completeFirstLogin(userId, currentPassword, newPassword, profileUpdates = {}) {
    await this.changePassword(currentPassword, newPassword, newPassword);

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.mustChangePassword = false;
    }
    return currentUser;
  }

  /**
   * Update profile information for the currently authenticated user.
   * Synchronizes database, auth session, and local storage caches.
   */
  async updateProfile(profileData) {
    if (!this.currentSession) {
      throw new Error("Authentication session required to update profile. Please sign in again.");
    }

    const currentUid = this.currentSession.userId || this.currentSession.id;
    const currentRole = this.currentSession.role || 'student';

    const result = await userManagementService.updateUserProfile(currentUid, profileData, {
      callerRole: currentRole,
      callerId: currentUid
    });

    // Update active session with newly saved values
    const updatedSession = {
      ...this.currentSession,
      name: result.user?.name || this.currentSession.name,
      email: result.user?.email || this.currentSession.email,
      designation: result.user?.designation !== undefined ? result.user.designation : this.currentSession.designation,
      avatar: (result.user?.name || this.currentSession.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    };

    this.saveSession(updatedSession);
    const updatedUser = this.getCurrentUser();
    this.notifyListeners('PROFILE_UPDATED', updatedUser, updatedSession);

    return {
      success: true,
      user: updatedUser,
      message: result.message || "Profile updated successfully."
    };
  }

  /**
   * Registration for new students and faculty (Admin registration is strictly prohibited)
   * Uses atomic register_crm_user RPC to eliminate GoTrue SMTP rate-limit bottlenecks.
   */
  async registerUser(userData) {
    const rawRole = (userData.role || 'student').toLowerCase();
    
    // Strict RBAC Rule: Never allow self-registration as Admin
    if (rawRole === 'admin' || rawRole === 'administrator') {
      auditService.logAction({
        user: userData.name || "Anonymous",
        role: "unauthorized",
        userId: "ATTEMPT_ADMIN_REG",
        action: "Unauthorized Admin Registration Attempt",
        resource: "/auth/register",
        result: "Blocked (403)",
        details: "Attempted to register account with administrative privileges."
      });
      throw new Error("403 Forbidden: Administrator self-registration is strictly prohibited.");
    }

    const role = rawRole === 'faculty' ? 'faculty' : 'student';
    const name = (userData.name || '').trim();
    const email = (userData.email || '').trim().toLowerCase();
    const password = (userData.password || '').trim();
    const department = (userData.department || '').trim();
    const identifier = role === 'student'
      ? (userData.rollNumber || '').trim().toUpperCase()
      : (userData.employeeId || '').trim().toUpperCase();

    if (!name || name.length < 2) throw new Error("Full name is required (minimum 2 characters).");
    if (!email || !email.includes('@') || !email.includes('.')) throw new Error("A valid email address is required.");
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured. Please check your .env settings.");
    }

    // Resolve department_id from public.departments
    let resolvedDeptId = null;
    if (department) {
      try {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(department)) {
          resolvedDeptId = department;
        } else {
          const { data: deptRows } = await supabase
            .from('departments')
            .select('id, code, name')
            .or(`code.eq.${department},name.ilike.%${department}%`)
            .limit(1);
          if (deptRows && deptRows.length > 0) {
            resolvedDeptId = deptRows[0].id;
          }
        }
      } catch (deptErr) {
        console.warn('[AuthService] Department lookup notice:', deptErr);
      }
    }

    // PRIMARY SECURE PATH: Supabase Edge Function using Admin Auth API (email_confirm: true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('register-user', {
        body: {
          name,
          email,
          password,
          role,
          department,
          rollNumber: role === 'student' ? identifier : undefined,
          employeeId: role === 'faculty' ? identifier : undefined,
          program: role === 'student' ? (userData.program || 'B.Tech') : undefined,
          year: role === 'student' ? (() => {
            const y = userData.year;
            if (!y) return 1;
            if (typeof y === 'number') return y;
            const s = String(y).trim();
            const d = s.match(/\d+/);
            if (d) return parseInt(d[0], 10);
            if (s.includes('IV')) return 4;
            if (s.includes('III')) return 3;
            if (s.includes('II')) return 2;
            if (s.includes('I')) return 1;
            return 1;
          })() : undefined,
          section: role === 'student' ? (() => {
            const sec = userData.section;
            if (!sec) return 'A';
            const s = String(sec).trim();
            const match = s.match(/Section\s*([A-Za-z0-9]+)/i);
            return match ? match[1].toUpperCase() : s.toUpperCase();
          })() : undefined,
          designation: role === 'faculty' ? (userData.designation || 'Assistant Professor') : undefined
        }
      });

      if (!fnError && data?.success) {
        auditService.logAction({
          user: name,
          role,
          userId: data.userId || identifier,
          action: "Account Self-Registration",
          resource: "/auth/register",
          result: "Pending Approval",
          details: `New [${role.toUpperCase()}] registered: ${name} (${email}). Awaiting Admin Approval.`
        });

        return {
          name,
          email,
          role,
          status: 'pending',
          message: 'Registration submitted successfully. Your account is waiting for administrator approval.'
        };
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (fnError) {
        // Attempt to extract response error from edge function context
        let detailedMsg = fnError.message || '';
        try {
          if (fnError.context && typeof fnError.context.json === 'function') {
            const errBody = await fnError.context.json();
            if (errBody?.error) detailedMsg = errBody.error;
          }
        } catch (_) {}

        if (detailedMsg.includes('already exists') || detailedMsg.includes('duplicate')) {
          throw new Error("An account with this email address already exists. Please sign in instead.");
        } else if (detailedMsg && !detailedMsg.includes('FunctionsHttpError') && !detailedMsg.includes('non-2xx')) {
          throw new Error(detailedMsg);
        }
      }
    } catch (edgeEx) {
      const msg = edgeEx.message || '';
      if (msg && !msg.includes('FunctionsFetchError') && !msg.includes('Failed to send a request to Edge Function')) {
        throw edgeEx;
      }
      console.warn('[AuthService] Edge function invoke notice, trying fallback:', msg);
    }

    // FALLBACK PATH: Standard Supabase Auth signUp
    const { data: supaSignUp, error: supaErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name,
          role,
          department,
          roll_number: role === 'student' ? identifier : undefined,
          employee_id: role === 'faculty' ? identifier : undefined,
          program: role === 'student' ? (userData.program || 'B.Tech') : undefined,
          year: role === 'student' ? (userData.year || 1) : undefined,
          section: role === 'student' ? (userData.section || 'A') : undefined,
          designation: role === 'faculty' ? (userData.designation || 'Assistant Professor') : undefined,
          status: 'pending'
        }
      }
    });

    if (supaErr) {
      const errMsg = supaErr.message || '';
      if (errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('unique')) {
        throw new Error("An account with this email address already exists. Please sign in instead.");
      } else if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('rate_limit')) {
        throw new Error("Registration rate limit reached. Please wait a few moments or contact your administrator.");
      }
      throw new Error(supaErr.message || "Registration failed. Please review your details.");
    }

    if (supaSignUp?.user && Array.isArray(supaSignUp.user.identities) && supaSignUp.user.identities.length === 0) {
      throw new Error("An account with this email address already exists. Please sign in instead.");
    }

    const authUserId = supaSignUp?.user?.id;

    if (authUserId) {
      // Create/link public.users profile
      const userPayload = {
        id: authUserId,
        email,
        full_name: name,
        role,
        status: 'pending'
      };

      try {
        await supabase.from('users').insert([userPayload]);
      } catch (userErr) {
        console.warn('[AuthService] Exception during public.users insert:', userErr);
      }

      // Create role-specific record (students or faculty)
      if (role === 'student') {
        try {
          const studentPayload = {
            user_id: authUserId,
            roll_number: identifier || null,
            department_id: resolvedDeptId,
            semester: userData.year ? Number(userData.year) * 2 - 1 : 1,
            year: userData.year ? (isNaN(Number(userData.year)) ? userData.year : Number(userData.year)) : 1,
            section: userData.section || 'A',
            program: userData.program || 'B.Tech'
          };
          await supabase.from('students').insert([studentPayload]);
        } catch (studentErr) {
          console.warn('[AuthService] Exception during student record insert:', studentErr);
        }
      } else if (role === 'faculty') {
        try {
          const facultyPayload = {
            user_id: authUserId,
            employee_id: identifier || null,
            department_id: resolvedDeptId,
            designation: userData.designation || 'Assistant Professor'
          };
          await supabase.from('faculty').insert([facultyPayload]);
        } catch (facultyErr) {
          console.warn('[AuthService] Exception during faculty record insert:', facultyErr);
        }
      }
    }

    auditService.logAction({
      user: name,
      role,
      userId: authUserId || identifier,
      action: "Account Self-Registration",
      resource: "/auth/register",
      result: "Pending Approval",
      details: `New [${role.toUpperCase()}] registered: ${name} (${email}). Awaiting Admin Approval.`
    });

    return {
      name,
      email,
      role,
      status: 'pending',
      message: 'Registration submitted successfully. Your account is waiting for administrator approval.'
    };
  }

  async logout() {
    const user = this.getCurrentUser();
    if (isSupabaseConfigured() && supabase?.auth?.signOut) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[AuthService] Supabase signOut error:', e);
      }
    }
    if (user) {
      auditService.logAction({
        user: user.name,
        role: user.role,
        userId: user.userId,
        action: "User Logout",
        resource: "/auth/logout",
        result: "Success",
        details: "Authenticated session successfully terminated by user."
      });
    }
    this.saveSession(null);
    this.clearStaleStorage();
  }

  getCurrentSession() {
    return this.currentSession;
  }

  getCurrentUser() {
    if (!this.currentSession || !this.currentSession.role) return null;
    return {
      userId: this.currentSession.userId,
      id: this.currentSession.userId,
      name: this.currentSession.name,
      email: this.currentSession.email,
      role: this.currentSession.role,
      mustChangePassword: Boolean(this.currentSession.mustChangePassword),
      status: 'Active',
      studentId: this.currentSession.studentId || null,
      facultyId: this.currentSession.facultyId || null,
      rollNumber: this.currentSession.rollNumber || null,
      employeeId: this.currentSession.employeeId || null,
      department: this.currentSession.department || this.currentSession.departmentName || this.currentSession.departmentCode || null,
      departmentId: this.currentSession.departmentId || null,
      departmentCode: this.currentSession.departmentCode || null,
      departmentName: this.currentSession.departmentName || null,
      branch: this.currentSession.branch || null,
      branchId: this.currentSession.branchId || null,
      year: this.currentSession.year || null,
      semester: this.currentSession.semester || null,
      section: this.currentSession.section || null,
      program: this.currentSession.program || null,
      academicYear: this.currentSession.academicYear || null,
      regulation: this.currentSession.regulation || null,
      designation: this.currentSession.designation || null
    };
  }

  async getAllUsers() {
    if (!isSupabaseConfigured()) {
      return [];
    }
    try {
      return await userManagementService.getAllUsers();
    } catch (e) {
      console.warn('[AuthService] Error fetching users from userManagementService:', e);
      return [];
    }
  }
}

export const authService = new AuthService();
export default authService;


