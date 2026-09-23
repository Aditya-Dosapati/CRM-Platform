import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import CommandPalette from './components/common/CommandPalette';
import NotificationCenter from './components/common/NotificationCenter';
import UserProfileModal from './components/profile/UserProfileModal';
import SourceViewerModal from './components/ai/SourceViewerModal';
import RagChatbot from './components/ai/RagChatbot';
import LoginView from './components/auth/LoginView';
import AccessRestricted from './components/common/AccessRestricted';
import FirstLoginModal from './components/auth/FirstLoginModal';

// Student Views
import StudentDashboard from './components/student/StudentDashboard';
import StudentSubjects from './components/student/StudentSubjects';
import StudentSyllabus from './components/student/StudentSyllabus';
import StudentPYQs from './components/student/StudentPYQs';
import StudentAssessments from './components/student/StudentAssessments';
import StudentPerformance from './components/student/StudentPerformance';
import StudentInfographics from './components/student/StudentInfographics';
import StudentResources from './components/student/StudentResources';
import StudentSettings from './components/student/StudentSettings';

// Faculty Views
import FacultyDashboard from './components/faculty/FacultyDashboard';
import FacultyClasses from './components/faculty/FacultyClasses';
import FacultyStudents from './components/faculty/FacultyStudents';
import FacultyAnalytics from './components/faculty/FacultyAnalytics';
import FacultyAssessments from './components/faculty/FacultyAssessments';
import FacultyResources from './components/faculty/FacultyResources';
import FacultySettings from './components/faculty/FacultySettings';

// Admin Views
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminSyllabus from './components/admin/AdminSyllabus';
import AdminPYQs from './components/admin/AdminPYQs';
import AdminRagBase from './components/admin/AdminRagBase';
import AdminRagSettings from './components/admin/AdminRagSettings';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminAuditLogs from './components/admin/AdminAuditLogs';
import AdminCodingManagement from './components/admin/AdminCodingManagement';
import AdminSettings from './components/admin/AdminSettings';

// Coding Views
import CodingPracticeView from './components/coding/CodingPracticeView';
import CodingAssessmentsView from './components/coding/CodingAssessmentsView';
import FacultyCodingManagement from './components/faculty/FacultyCodingManagement';

// Institutional Error Boundary & Notifications
import ErrorBoundary from './components/common/ErrorBoundary';

// Institutional Services
import authService from './services/authService';
import accessControl from './services/accessControl';

const VIEW_METADATA = {
  dashboard: {
    title: 'Academic Dashboard',
    subtitle: "Welcome back! Here's what's happening with your academics."
  },
  subjects: {
    title: 'My Subjects',
    subtitle: 'Enrolled subjects, credit allocations, and course faculty'
  },
  syllabus: {
    title: 'My Syllabus',
    subtitle: 'Access your subject-wise academic syllabus and vectorized RAG course units'
  },
  pyqs: {
    title: 'Previous Year Questions',
    subtitle: 'Official GMRIT Autonomous examination question papers with model answers'
  },
  assessments: {
    title: 'Academic Assessments',
    subtitle: 'Continuous internal evaluations (CIE), lab quizzes, and practice assessments'
  },
  'coding-practice': {
    title: 'Coding Practice Workspace',
    subtitle: 'Solve DSA challenges with real-time multi-language evaluation'
  },
  'coding-assessments': {
    title: 'Coding Assessments & Exams',
    subtitle: 'Institutional proctored programming tests and evaluations'
  },
  performance: {
    title: 'Academic Performance',
    subtitle: 'Historical marks, GPA progression, and semester analytics'
  },
  infographics: {
    title: 'Academic Insights & Infographics',
    subtitle: 'Curriculum coverage velocity and comparative cohort analytics'
  },
  resources: {
    title: 'Course Resources & Handouts',
    subtitle: 'Reference textbooks, digital lecture notes, and lab manuals'
  },
  classes: {
    title: 'Faculty Classes & Sections',
    subtitle: 'Class schedules, assigned batches, and syllabus coverage tracking'
  },
  students: {
    title: 'Student Cohort Management',
    subtitle: 'Monitor student attendance, continuous marks, and assign interventions'
  },
  analytics: {
    title: 'Academic Analytics',
    subtitle: 'Cohort performance distributions and early intervention matrices'
  },
  'coding-management': {
    title: 'Coding Platform Management',
    subtitle: 'Compiler runtimes, sandbox resource limits, and institutional analytics'
  },
  users: {
    title: 'User Provisioning & RBAC',
    subtitle: 'Institutional accounts management and credential administration'
  },
  'rag-base': {
    title: 'RAG Knowledge Base',
    subtitle: 'Manage vectorized document collections powering GMRIT AI'
  },
  'rag-settings': {
    title: 'RAG Retrieval Settings',
    subtitle: 'Hybrid search tuning, top-k parameters, and similarity thresholds'
  },
  'audit-logs': {
    title: 'Security Audit Logs',
    subtitle: 'Immutable chronological record of authentication and access events'
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Platform configuration, academic year cycles, and data policies'
  }
};

export default function App() {
  // Institutional Authentication Session State
  const [session, setSession] = useState(() => authService.getCurrentSession());
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(authService.getCurrentSession()));
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  // Modals & Panels State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRagChatOpen, setIsRagChatOpen] = useState(false);
  const [ragInitialQuery, setRagInitialQuery] = useState('');
  const [activePdfSource, setActivePdfSource] = useState(null);

  // Live Notifications State
  const [allNotifications, setAllNotifications] = useState({ student: [], faculty: [], admin: [] });

  const activeRole = session?.role || 'student';
  const activeNotifications = allNotifications[activeRole] || [];
  const unreadNotificationCount = activeNotifications.filter(n => !n.read).length;

  const currentViewMeta = VIEW_METADATA[currentView] || VIEW_METADATA.dashboard;

  // Handle successful credential authentication
  const handleLoginSuccess = (user, sessionData, firstLoginFlag) => {
    setSession(sessionData);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setIsFirstLogin(Boolean(firstLoginFlag));
    setCurrentView('dashboard');
  };

  // Handle first-login password reset completion
  const handleFirstLoginComplete = (updatedUser) => {
    setCurrentUser(updatedUser);
    setIsFirstLogin(false);
    setCurrentView('dashboard');
  };

  // Handle secure logout
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setSession(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsFirstLogin(false);
    setCurrentView('dashboard');
  };

  const handleOpenRagQuery = (queryText) => {
    setRagInitialQuery(queryText);
    setIsRagChatOpen(true);
  };

  const handleOpenPdf = (sourceObj) => {
    setActivePdfSource(sourceObj);
  };

  const handleMarkAllNotificationsRead = () => {
    setAllNotifications(prev => ({
      ...prev,
      [activeRole]: (prev[activeRole] || []).map(n => ({ ...n, read: true }))
    }));
  };

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Supabase Auth State Synchronization
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((event, user, sessionData) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentUser(null);
        setIsLoggedIn(false);
        setCurrentView('dashboard');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (sessionData && user) {
          setSession(sessionData);
          setCurrentUser(user);
          setIsLoggedIn(true);
        }
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // If not logged in, render credential-based Login Experience
  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Render view with strict RBAC Route Guard
  const renderView = () => {
    // 1. Enforce Role-Based Route Authorization
    const isAuthorized = accessControl.isRouteAllowed(activeRole, currentView);
    if (!isAuthorized) {
      return (
        <AccessRestricted
          currentUser={currentUser}
          attemptedView={currentView}
          onReturn={() => setCurrentView('dashboard')}
        />
      );
    }

    // 2. Student Authorized Views
    if (activeRole === 'student') {
      switch (currentView) {
        case 'dashboard':
          return <StudentDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
        case 'subjects':
        case 'syllabus':
        case 'pyqs':
          return <StudentSubjects onOpenPdf={handleOpenPdf} onOpenRagQuery={handleOpenRagQuery} />;
        case 'assessments':
          return <StudentAssessments onOpenRagQuery={handleOpenRagQuery} />;
        case 'coding-practice':
          return <CodingPracticeView onOpenRagQuery={handleOpenRagQuery} />;
        case 'coding-assessments':
          return <CodingAssessmentsView />;
        case 'performance':
          return <StudentPerformance onOpenRagQuery={handleOpenRagQuery} />;
        case 'infographics':
          return <StudentInfographics onOpenRagQuery={handleOpenRagQuery} />;
        case 'resources':
          return <StudentResources onOpenPdf={handleOpenPdf} onOpenRagQuery={handleOpenRagQuery} />;
        case 'settings':
          return <StudentSettings />;
        default:
          return <StudentDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
      }
    }

    // 3. Faculty Authorized Views
    if (activeRole === 'faculty') {
      switch (currentView) {
        case 'dashboard':
          return <FacultyDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
        case 'classes':
          return <FacultyClasses onOpenRagQuery={handleOpenRagQuery} />;
        case 'students':
          return <FacultyStudents onOpenRagQuery={handleOpenRagQuery} />;
        case 'analytics':
        case 'performance':
          return <FacultyAnalytics onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
        case 'assessments':
          return <FacultyAssessments onOpenRagQuery={handleOpenRagQuery} />;
        case 'coding-assessments':
          return <FacultyCodingManagement onOpenRagQuery={handleOpenRagQuery} />;
        case 'resources':
        case 'syllabus':
          return <FacultyResources onOpenPdf={handleOpenPdf} />;
        case 'settings':
          return <FacultySettings />;
        default:
          return <FacultyDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
      }
    }

    // 4. Admin Authorized Views
    if (activeRole === 'admin') {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
        case 'users':
          return <AdminUsers />;
        case 'syllabus':
          return <AdminSyllabus onOpenPdf={handleOpenPdf} />;
        case 'pyqs':
          return <AdminPYQs onOpenPdf={handleOpenPdf} />;
        case 'coding-management':
          return <AdminCodingManagement />;
        case 'coding-practice':
          return <CodingPracticeView onOpenRagQuery={handleOpenRagQuery} />;
        case 'coding-assessments':
          return <CodingAssessmentsView />;
        case 'rag-base':
          return <AdminRagBase onOpenPdf={handleOpenPdf} onNavigate={setCurrentView} />;
        case 'rag-settings':
          return <AdminRagSettings />;
        case 'analytics':
          return <AdminAnalytics onOpenRagQuery={handleOpenRagQuery} />;
        case 'audit-logs':
          return <AdminAuditLogs />;
        case 'settings':
          return <AdminSettings />;
        default:
          return <AdminDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
      }
    }

    return <StudentDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
  };

  return (
    <div className="app-container">
      {/* Ambient Background Grid */}
      <div className="cyber-grid-bg" />

      {/* Left-Side Navigation Sidebar */}
      <Sidebar
        activeRole={activeRole}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        onOpenRag={() => setIsRagChatOpen(true)}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Header
          currentUser={currentUser}
          activeRole={activeRole}
          currentView={currentView}
          pageTitle={currentViewMeta.title}
          pageSubtitle={currentViewMeta.subtitle}
          notificationCount={unreadNotificationCount}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Dynamic Role-Guarded Page Content with Institutional Error Boundary */}
        <ErrorBoundary key={currentView}>
          {renderView()}
        </ErrorBoundary>
      </div>

      {/* Mandatory First-Login Password Reset Dialog */}
      {isFirstLogin && currentUser && (
        <FirstLoginModal
          user={currentUser}
          onComplete={handleFirstLoginComplete}
        />
      )}

      {/* Floating RAG AI Assistant Button & Panel */}
      <RagChatbot
        isOpen={isRagChatOpen}
        onToggle={() => setIsRagChatOpen(!isRagChatOpen)}
        initialQuery={ragInitialQuery}
        onSelectSource={handleOpenPdf}
        activeRole={activeRole}
        currentUser={currentUser}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
        onOpenRagQuery={handleOpenRagQuery}
        activeRole={activeRole}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        activeRole={activeRole}
        onNavigate={setCurrentView}
        notifications={activeNotifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        activeRole={activeRole}
      />

      {/* In-App PDF / Source Citation Document Viewer Modal */}
      <SourceViewerModal
        isOpen={Boolean(activePdfSource)}
        onClose={() => setActivePdfSource(null)}
        source={activePdfSource}
      />
    </div>
  );
}
