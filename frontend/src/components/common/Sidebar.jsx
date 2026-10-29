import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  FileText,
  HelpCircle,
  FolderArchive,
  BarChart2,
  PieChart,
  Settings,
  Users,
  Layers,
  Activity,
  LogOut,
  LifeBuoy,
  Cpu,
  Sliders,
  GraduationCap,
  Award,
  Shield,
  ShieldAlert,
  Code2,
  Terminal,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import GmritLogo from './GmritLogo.jsx';

export default function Sidebar({
  activeRole,
  currentView,
  onNavigate,
  onLogout,
  onOpenRag,
  currentUser,
  isCollapsed = false,
  onToggleCollapse
}) {
  // Navigation sections configured by institutional role
  const navSections = useMemo(() => {
    switch (activeRole) {
      case 'student':
        return [
          {
            title: 'Learning & Practice',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'subjects', label: 'My Subjects', icon: BookOpen },
              { id: 'coding-practice', label: 'Coding Practice', icon: Code2 },
              { id: 'coding-assessments', label: 'Coding Assessments', icon: Terminal },
              { id: 'assessments', label: 'Assessments', icon: CheckSquare }
            ]
          },
          {
            title: 'Academic Resources',
            items: [
              { id: 'syllabus', label: 'Curriculum & Syllabus', icon: FileText },
              { id: 'pyqs', label: 'Previous Questions (PYQs)', icon: HelpCircle },
              { id: 'resources', label: 'Course Resources', icon: FolderArchive }
            ]
          },
          {
            title: 'Progress & Insights',
            items: [
              { id: 'performance', label: 'Academic Performance', icon: BarChart2 },
              { id: 'infographics', label: 'Academic Insights', icon: PieChart }
            ]
          },
          {
            title: 'Account',
            items: [
              { id: 'settings', label: 'Preferences & Settings', icon: Settings }
            ]
          }
        ];

      case 'faculty':
        return [
          {
            title: 'Teaching Overview',
            items: [
              { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
              { id: 'classes', label: 'My Classes & Subjects', icon: BookOpen },
              { id: 'students', label: 'Student Monitoring', icon: Users }
            ]
          },
          {
            title: 'Curriculum & Tests',
            items: [
              { id: 'assessments', label: 'Assessments Manager', icon: CheckSquare },
              { id: 'resources', label: 'Syllabus & Handouts', icon: FolderArchive }
            ]
          },
          {
            title: 'Coding Assessments',
            items: [
              { id: 'coding-assessments', label: 'Coding Challenges', icon: Terminal }
            ]
          },
          {
            title: 'Cohort Analytics',
            items: [
              { id: 'analytics', label: 'Performance & At-Risk', icon: Activity }
            ]
          },
          {
            title: 'Account',
            items: [
              { id: 'settings', label: 'Faculty Settings', icon: Settings }
            ]
          }
        ];

      case 'admin':
        return [
          {
            title: 'Overview',
            items: [
              { id: 'dashboard', label: 'Control Center', icon: LayoutDashboard }
            ]
          },
          {
            title: 'User Governance',
            items: [
              { id: 'users', label: 'User Provisioning', icon: Users },
              { id: 'faculty-assignments', label: 'Faculty Assignments', icon: UserCheck }
            ]
          },
          {
            title: 'Academic Catalog',
            items: [
              { id: 'syllabus', label: 'Syllabus Management', icon: FileText },
              { id: 'pyqs', label: 'Question Bank (PYQs)', icon: HelpCircle }
            ]
          },
          {
            title: 'AI & RAG Platform',
            items: [
              { id: 'rag-base', label: 'Vector Knowledge Base', icon: Cpu },
              { id: 'rag-settings', label: 'RAG Retrieval Tuning', icon: Sliders }
            ]
          },
          {
            title: 'Coding Runtime',
            items: [
              { id: 'coding-management', label: 'Execution & Problems', icon: Code2 },
              { id: 'coding-practice', label: 'Practice Preview', icon: Terminal }
            ]
          },
          {
            title: 'Security & System',
            items: [
              { id: 'analytics', label: 'System Analytics', icon: BarChart2 },
              { id: 'audit-logs', label: 'Security Audit Logs', icon: ShieldAlert },
              { id: 'settings', label: 'Platform Settings', icon: Settings }
            ]
          }
        ];

      default:
        return [];
    }
  }, [activeRole]);

  const roleLabel = activeRole === 'student' ? 'Student' : activeRole === 'faculty' ? 'Faculty' : 'Administrator';
  const roleBadgeBg = activeRole === 'student' ? 'var(--pastel-blue-bg)' : activeRole === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)';
  const roleBadgeText = activeRole === 'student' ? 'var(--pastel-blue-text)' : activeRole === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)';
  const roleBadgeBorder = activeRole === 'student' ? 'var(--pastel-blue-border)' : activeRole === 'faculty' ? 'var(--pastel-green-border)' : 'var(--pastel-purple-border)';
  const RoleIcon = activeRole === 'student' ? GraduationCap : activeRole === 'faculty' ? Award : Shield;

  const displayName = currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const displayAvatar = currentUser?.avatar || (displayName ? displayName.slice(0, 2).toUpperCase() : 'U');

  const handleItemClick = (item) => {
    if (item.id === 'ai-copilot') {
      if (onOpenRag) onOpenRag();
    } else {
      if (onNavigate) onNavigate(item.id);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Main Navigation Sidebar">
      {/* Top Header with Logo and Collapse Toggle */}
      <div 
        className="sidebar-header" 
        style={isCollapsed ? {
          padding: '12px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        } : {
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          minWidth: 0
        }}
      >
        <GmritLogo size="small" collapsed={isCollapsed} />
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="sidebar-toggle-btn"
            aria-label={isCollapsed ? "Expand sidebar (Ctrl+[)" : "Collapse sidebar (Ctrl+[)"}
            title={isCollapsed ? "Expand sidebar (Ctrl+[)" : "Collapse sidebar (Ctrl+[)"}
            aria-expanded={!isCollapsed}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: isCollapsed ? '32px' : '28px',
              height: isCollapsed ? '32px' : '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isCollapsed ? 'var(--color-primary)' : 'var(--text-secondary)',
              backgroundColor: isCollapsed ? 'var(--primary-light)' : 'var(--bg-canvas)',
              flexShrink: 0,
              transition: 'all var(--transition-smooth)'
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* Role Pill Banner */}
      {!isCollapsed ? (
        <div style={{
          margin: '8px 12px 6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: roleBadgeBg,
          border: `1px solid ${roleBadgeBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <RoleIcon size={14} color={roleBadgeText} style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: roleBadgeText,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {roleLabel} Portal
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.4px', backgroundColor: 'rgba(255, 255, 255, 0.65)', padding: '2px 6px', borderRadius: '4px' }}>
            AR23
          </span>
        </div>
      ) : (
        <div 
          title={`${roleLabel} Portal (AR23)`}
          style={{
            margin: '8px auto 4px',
            width: '36px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: roleBadgeBg,
            border: `1px solid ${roleBadgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default'
          }}
        >
          <RoleIcon size={15} color={roleBadgeText} />
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {navSections.map((section, sIdx) => (
          <div key={section.title || sIdx} style={{ marginBottom: isCollapsed ? '4px' : '8px' }}>
            {section.title && !isCollapsed && (
              <div className="sidebar-section-title">
                {section.title}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const isSpecial = item.id === 'ai-copilot';

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => handleItemClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(item);
                      }
                    }}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      ...(isSpecial ? {
                        backgroundColor: '#FFF7ED',
                        color: '#C2410C',
                        fontWeight: 600,
                        border: '1px solid #FED7AA'
                      } : {}),
                      ...(isCollapsed ? { justifyContent: 'center', padding: '9px 0' } : {})
                    }}
                  >
                    <Icon 
                      size={16} 
                      color={isActive ? 'var(--color-primary)' : (isSpecial ? '#EA580C' : 'var(--text-secondary)')} 
                      style={{ flexShrink: 0 }}
                    />
                    {!isCollapsed && (
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    )}
                    {isSpecial && !isCollapsed && (
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF'
                      }}>
                        AI
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer Profile Card */}
      {!isCollapsed ? (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(226, 232, 240, 0.85)',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: roleBadgeBg,
                border: `1.5px solid ${roleBadgeBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
                color: roleBadgeText
              }}>
                {displayAvatar}
              </div>
              <span style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '1.5px solid #FFFFFF'
              }} />
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <div style={{ 
                fontSize: '12.5px', 
                fontWeight: 700, 
                color: 'var(--text-primary)', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.email || roleLabel}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="btn-icon"
            style={{ width: '30px', height: '30px', border: '1px solid rgba(226, 232, 240, 0.9)', background: '#FFFFFF', borderRadius: '8px', flexShrink: 0 }}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={14} color="#DC2626" />
          </button>
        </div>
      ) : (
        <div style={{
          padding: '10px 4px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#FFFFFF'
        }}>
          <div 
            title={`${displayName} (${currentUser?.email || roleLabel})`}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: roleBadgeBg,
              border: `1px solid ${roleBadgeBorder}`,
              color: roleBadgeText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer'
            }}
            onClick={() => onNavigate('settings')}
          >
            {displayAvatar}
          </div>

          <button
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--error)',
              transition: 'background-color var(--transition-smooth), transform var(--transition-spring)'
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      )}
    </aside>
  );
}
