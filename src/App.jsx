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
import StudentSyllabus from './components/student/StudentSyllabus';
import StudentPYQs from './components/student/StudentPYQs';
import StudentAssessments from './components/student/StudentAssessments';
import StudentPerformance from './components/student/StudentPerformance';
import StudentInfographics from './components/student/StudentInfographics';

// Faculty Views
import FacultyDashboard from './components/faculty/FacultyDashboard';
import FacultyStudents from './components/faculty/FacultyStudents';
import FacultyAnalytics from './components/faculty/FacultyAnalytics';
import FacultyAssessments from './components/faculty/FacultyAssessments';
import FacultyResources from './components/faculty/FacultyResources';

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

// Coding Views
import CodingPracticeView from './components/coding/CodingPracticeView';
import CodingAssessmentsView from './components/coding/CodingAssessmentsView';
import FacultyCodingManagement from './components/faculty/FacultyCodingManagement';

// Institutional Services
import authService from './services/authService';
import accessControl from './services/accessControl';

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

  const activeRole = session?.role || 'student';

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
  const handleLogout = () => {
    authService.logout();
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
          return <StudentSyllabus onOpenPdf={handleOpenPdf} onOpenRagQuery={handleOpenRagQuery} />;
        case 'pyqs':
          return <StudentPYQs onOpenPdf={handleOpenPdf} onOpenRagQuery={handleOpenRagQuery} />;
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
          return <StudentSyllabus onOpenPdf={handleOpenPdf} onOpenRagQuery={handleOpenRagQuery} />;
        default:
          return <StudentDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
      }
    }

    // 3. Faculty Authorized Views
    if (activeRole === 'faculty') {
      switch (currentView) {
        case 'dashboard':
        case 'classes':
          return <FacultyDashboard onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
        case 'students':
          return <FacultyStudents onOpenRagQuery={handleOpenRagQuery} />;
        case 'analytics':
          return <FacultyAnalytics onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
        case 'assessments':
          return <FacultyAssessments onOpenRagQuery={handleOpenRagQuery} />;
        case 'coding-practice':
          return <CodingPracticeView onOpenRagQuery={handleOpenRagQuery} />;
        case 'coding-assessments':
          return <FacultyCodingManagement onOpenRagQuery={handleOpenRagQuery} />;
        case 'resources':
          return <FacultyResources onOpenPdf={handleOpenPdf} />;
        case 'syllabus':
          return <StudentSyllabus onOpenPdf={handleOpenPdf} onOpenRagQuery={handleOpenRagQuery} />;
        case 'pyqs':
          return <StudentPYQs onOpenPdf={handleOpenPdf} onOpenRagQuery={handleOpenRagQuery} />;
        case 'performance':
          return <FacultyAnalytics onNavigate={setCurrentView} onOpenRagQuery={handleOpenRagQuery} />;
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
          return <AdminRagSettings />;
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
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Dynamic Role-Guarded Page Content */}
        {renderView()}
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
