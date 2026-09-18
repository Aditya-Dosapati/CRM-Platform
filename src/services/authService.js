// GMRIT Academic Hub - Institutional Authentication Service (RBAC)
import auditService from './auditService.js';

const USERS_STORAGE_KEY = 'gmrit_users_db';
const SESSION_STORAGE_KEY = 'gmrit_auth_session';

// Canonical initial accounts meeting institutional specification
const initialUsers = [
  {
    userId: "STU001",
    rollNumber: "23A81A0501",
    name: "Rahul Kumar",
    email: "student@gmrit.edu.in",
    aliases: ["23a81a0501@gmrit.edu.in", "23A81A0501"],
    role: "student",
    password: "student123",
    department: "Computer Science & Engineering",
    program: "B.Tech",
    regulation: "R20",
    year: "II Year",
    semester: 4,
    section: "CSE-A",
    academicYear: "2025-2026",
    avatar: "RK",
    cgpa: 8.42,
    attendance: 91.0,
    overallPerformance: 82.4,
    isFirstLogin: false,
    permissions: [
      "student:read",
      "syllabus:read",
      "pyq:read",
      "assessments:read",
      "assessments:submit",
      "performance:read",
      "rag:query"
    ]
  },
  {
    userId: "FAC001",
    employeeId: "GMR-CSE-1042",
    name: "Dr. Priya Sharma",
    email: "faculty@gmrit.edu.in",
    aliases: ["priya.sharma@gmrit.edu.in", "GMR-CSE-1042"],
    role: "faculty",
    password: "faculty123",
    designation: "Associate Professor & Lead - AI Specialization",
    department: "Computer Science & Engineering",
    subjects: ["Machine Learning", "Artificial Intelligence", "Deep Learning"],
    totalStudents: 184,
    averagePerformance: 78.6,
    averageAttendance: 87.4,
    avatar: "PS",
    isFirstLogin: false,
    permissions: [
      "faculty:read",
      "classes:manage",
      "students:monitor",
      "assessments:manage",
      "resources:upload",
      "analytics:read",
      "rag:query"
    ]
  },
  {
    userId: "ADM001",
    name: "System Administrator",
    officialName: "Er. M. V. Subrahmanyam",
    email: "admin@gmrit.edu.in",
    aliases: ["dean.academics@gmrit.edu.in", "admin"],
    role: "admin",
    password: "admin123",
    designation: "Dean of Academic Computing & IT Operations",
    department: "Central Administrative IT Cell",
    avatar: "SA",
    isFirstLogin: false,
    permissions: ["*"]
  }
];

class AuthService {
  constructor() {
    this.users = this.loadUsers();
    this.currentSession = this.loadSession();
  }

  loadUsers() {
    try {
      const stored = sessionStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not load users from storage", e);
    }
    return [...initialUsers];
  }

  saveUsers() {
    try {
      sessionStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
    } catch (e) {
      console.warn("Could not save users to storage", e);
    }
  }

  loadSession() {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        // Verify user still exists
        const userExists = this.users.find(u => u.userId === session.userId);
        if (userExists) {
          return session;
        }
      }
    } catch (e) {
      console.warn("Could not load session from storage", e);
    }
    // Default initial session: Student (Rahul Kumar) for seamless experience,
    // but fully bound to STU001 account record
    const defaultUser = this.users[0];
    const initialSession = {
      sessionId: `sess_${Date.now()}_default`,
      userId: defaultUser.userId,
      role: defaultUser.role,
      name: defaultUser.name,
      email: defaultUser.email,
      loginTimestamp: new Date().toISOString()
    };
    return initialSession;
  }

  saveSession(session) {
    this.currentSession = session;
    try {
      if (session) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Could not save session to storage", e);
    }
  }

  // Pure credential authentication against database records
  login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      throw new Error("Please provide both User ID/Email and password.");
    }

    // Find account by institutional email, userId, rollNumber, employeeId, or alias
    const account = this.users.find(u => {
      if (u.email.toLowerCase() === cleanId) return true;
      if (u.userId.toLowerCase() === cleanId) return true;
      if (u.rollNumber && u.rollNumber.toLowerCase() === cleanId) return true;
      if (u.employeeId && u.employeeId.toLowerCase() === cleanId) return true;
      if (u.aliases && u.aliases.some(a => a.toLowerCase() === cleanId)) return true;
      return false;
    });

    if (!account) {
      auditService.logAction({
        user: identifier,
        role: "unauthenticated",
        userId: identifier,
        action: "Authentication Attempt",
        resource: "/auth/login",
        result: "Failed",
        details: "Account identifier not found in GMRIT institutional directory."
      });
      throw new Error("Invalid institutional credentials. Please verify your User ID or institutional email.");
    }

    // Verify password
    if (account.password !== cleanPass) {
      auditService.logAction({
        user: account.name,
        role: account.role,
        userId: account.userId,
        action: "Authentication Attempt",
        resource: "/auth/login",
        result: "Failed",
        details: "Password mismatch for verified institutional account."
      });
      throw new Error("Invalid institutional credentials. The password entered is incorrect.");
    }

    // Create authenticated session
    const session = {
      sessionId: `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      userId: account.userId,
      role: account.role,
      name: account.name,
      email: account.email,
      loginTimestamp: new Date().toISOString()
    };

    this.saveSession(session);

    // Audit log successful authentication
    auditService.logAction({
      user: account.name,
      role: account.role,
      userId: account.userId,
      action: "User Login",
      resource: `/${account.role}/dashboard`,
      result: "Success",
      details: `Successful credential authentication for role [${account.role.toUpperCase()}].`
    });

    return {
      user: account,
      session,
      isFirstLogin: Boolean(account.isFirstLogin)
    };
  }

  logout() {
    const user = this.getCurrentUser();
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
  }

  getCurrentSession() {
    return this.currentSession;
  }

  getCurrentUser() {
    if (!this.currentSession) return null;
    return this.users.find(u => u.userId === this.currentSession.userId) || null;
  }

  getAllUsers() {
    return [...this.users];
  }

  // Admin-Only User Provisioning
  provisionUser(userData) {
    const adminSession = this.getCurrentSession();
    if (!adminSession || adminSession.role !== 'admin') {
      auditService.logAction({
        user: adminSession?.name || "Unknown",
        role: adminSession?.role || "unauthorized",
        userId: adminSession?.userId || "UNAUTH",
        action: "Unauthorized Provisioning Attempt",
        resource: "/admin/users/provision",
        result: "Blocked (403)",
        details: "Non-admin attempted to provision institutional credentials."
      });
      throw new Error("403 Forbidden: Only administrators are authorized to provision user accounts.");
    }

    const newUser = {
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      role: userData.role.toLowerCase(), // 'student' or 'faculty'
      password: userData.temporaryPassword || `GMRIT@${Math.floor(1000 + Math.random() * 9000)}`,
      department: userData.department || 'CSE',
      program: userData.program || 'B.Tech',
      year: userData.year || 'I Year',
      section: userData.section || 'A',
      semester: userData.semester || 1,
      subjects: userData.subjects || [],
      rollNumber: userData.role.toLowerCase() === 'student' ? userData.userId : undefined,
      employeeId: userData.role.toLowerCase() === 'faculty' ? userData.userId : undefined,
      avatar: userData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      isFirstLogin: true, // Requires mandatory password reset on first login
      createdAt: new Date().toISOString(),
      permissions: userData.role.toLowerCase() === 'student'
        ? ["student:read", "syllabus:read", "pyq:read", "assessments:read", "assessments:submit", "performance:read", "rag:query"]
        : ["faculty:read", "classes:manage", "students:monitor", "assessments:manage", "resources:upload", "analytics:read", "rag:query"]
    };

    // Check duplicate
    const exists = this.users.some(u => u.userId.toLowerCase() === newUser.userId.toLowerCase() || u.email.toLowerCase() === newUser.email.toLowerCase());
    if (exists) {
      throw new Error(`An account with User ID "${newUser.userId}" or Email "${newUser.email}" already exists.`);
    }

    this.users.unshift(newUser);
    this.saveUsers();

    auditService.logAction({
      user: adminSession.name,
      role: "admin",
      userId: adminSession.userId,
      action: "Account Provisioned",
      resource: `/admin/users/${newUser.userId}`,
      result: "Success",
      details: `Provisioned new [${newUser.role.toUpperCase()}] account: ${newUser.name} (${newUser.userId}) with mandatory first-login password change.`
    });

    return newUser;
  }

  // Mandatory First Login Password Reset
  completeFirstLogin(userId, currentPassword, newPassword, profileUpdates = {}) {
    const userIndex = this.users.findIndex(u => u.userId === userId);
    if (userIndex === -1) {
      throw new Error("Account not found.");
    }

    const user = this.users[userIndex];
    if (user.password !== currentPassword) {
      throw new Error("Temporary password does not match.");
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    this.users[userIndex] = {
      ...user,
      ...profileUpdates,
      password: newPassword,
      isFirstLogin: false
    };

    this.saveUsers();

    // Update active session
    if (this.currentSession && this.currentSession.userId === userId) {
      this.currentSession.name = this.users[userIndex].name;
      this.saveSession(this.currentSession);
    }

    auditService.logAction({
      user: user.name,
      role: user.role,
      userId: user.userId,
      action: "First Login Password Reset",
      resource: "/auth/first-login",
      result: "Success",
      details: "User successfully configured personal permanent password and completed onboarding."
    });

    return this.users[userIndex];
  }

  // Admin Reset Password
  resetPassword(userId) {
    const adminSession = this.getCurrentSession();
    if (!adminSession || adminSession.role !== 'admin') {
      throw new Error("403 Forbidden: Administrator access required.");
    }

    const userIndex = this.users.findIndex(u => u.userId === userId);
    if (userIndex === -1) throw new Error("User not found.");

    const tempPassword = `GMRIT@${Math.floor(1000 + Math.random() * 9000)}`;
    this.users[userIndex].password = tempPassword;
    this.users[userIndex].isFirstLogin = true;
    this.saveUsers();

    auditService.logAction({
      user: adminSession.name,
      role: "admin",
      userId: adminSession.userId,
      action: "Password Reset Triggered",
      resource: `/admin/users/${userId}/reset`,
      result: "Success",
      details: `Generated temporary credentials for ${this.users[userIndex].name} (${userId}).`
    });

    return tempPassword;
  }
}

export const authService = new AuthService();
export default authService;
