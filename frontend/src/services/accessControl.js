// GMRIT Academic Hub - Role-Based Access Control (RBAC) & Security Policies
import auditService from './auditService.js';

export const ROLE_ROUTE_MATRIX = {
  student: [
    'dashboard',
    'subjects',
    'syllabus',
    'pyqs',
    'assessments',
    'coding-practice',
    'coding-assessments',
    'performance',
    'infographics',
    'resources',
    'settings'
  ],
  faculty: [
    'dashboard',
    'classes',
    'students',
    'assessments',
    'coding-assessments',
    'performance',
    'syllabus',
    'resources',
    'analytics',
    'settings'
  ],
  admin: [
    'dashboard',
    'users',
    'syllabus',
    'pyqs',
    'coding-management',
    'coding-practice',
    'coding-assessments',
    'rag-base',
    'rag-settings',
    'analytics',
    'audit-logs',
    'settings'
  ]
};

export const VIEW_TITLES = {
  dashboard: 'Academic Dashboard',
  subjects: 'My Subjects',
  syllabus: 'Curriculum & Syllabus',
  pyqs: 'Previous Question Papers',
  assessments: 'Assessments & Examinations',
  'coding-practice': 'Coding Practice & Problem Solving',
  'coding-assessments': 'Coding Assessments & Examinations',
  'coding-management': 'Coding Execution & Runtime Management',
  performance: 'Academic Performance & CGPA',
  infographics: 'Academic Intelligence Infographics',
  resources: 'Course Resources & Handouts',
  settings: 'System & Profile Preferences',
  classes: 'Assigned Academic Classes',
  students: 'Student Roster & Monitoring',
  analytics: 'Department Academic Analytics',
  users: 'User Provisioning & Credentials',
  'rag-base': 'RAG Knowledge Documents',
  'rag-settings': 'RAG Vector Infrastructure Settings',
  'audit-logs': 'Institutional Security Audit Logs'
};

export const accessControl = {
  /**
   * Check if a given view/route is authorized for the given role
   */
  isRouteAllowed(role, viewId) {
    if (!role) return false;
    const allowedViews = ROLE_ROUTE_MATRIX[role.toLowerCase()] || [];
    return allowedViews.includes(viewId);
  },

  /**
   * Log an unauthorized access attempt to the institutional audit log
   */
  logUnauthorizedAttempt(currentUser, attemptedView) {
    const role = currentUser?.role || 'unauthenticated';
    const userName = currentUser?.name || 'Anonymous User';
    const userId = currentUser?.userId || 'UNKNOWN';

    auditService.logAction({
      user: userName,
      role: role,
      userId: userId,
      action: "Unauthorized Access Attempt",
      resource: `/${role}/${attemptedView}`,
      result: "Blocked (403)",
      details: `Role [${role.toUpperCase()}] denied access to restricted view [${VIEW_TITLES[attemptedView] || attemptedView}]. 403 Forbidden generated.`
    });
  },

  /**
   * Verify if current user can view a specific student's private data
   */
  canAccessStudentData(currentUser, targetUserId) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'faculty') return true; // Faculty can monitor students in department
    if (currentUser.role === 'student') {
      // Student can ONLY access their own records
      return currentUser.userId === targetUserId || currentUser.rollNumber === targetUserId;
    }
    return false;
  },

  /**
   * Verify administrative rights
   */
  isAdmin(currentUser) {
    return currentUser?.role === 'admin';
  }
};

export default accessControl;
