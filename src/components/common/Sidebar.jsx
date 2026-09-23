import React, { useMemo } from 'react';
import GmritLogo from './GmritLogo';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  CheckSquare,
  BarChart2,
  PieChart,
  FolderArchive,
  Sparkles,
  Settings,
  LifeBuoy,
  Users,
  Layers,
  Activity,
  Cpu,
  Sliders,
  LogOut,
  GraduationCap,
  Award,
  Shield,
  ShieldAlert,
  Code2,
  Terminal
} from 'lucide-react';

export default function Sidebar({
  activeRole,
  currentView,
  onNavigate,
  onLogout,
  onOpenRag,
  currentUser
}) {
  const navItems = useMemo(() => {
    switch (activeRole) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'subjects', label: 'My Subjects', icon: BookOpen },
          { id: 'assessments', label: 'Assessments', icon: CheckSquare },
          { id: 'coding-practice', label: 'Coding Practice', icon: Code2 },
          { id: 'coding-assessments', label: 'Coding Assessments', icon: Terminal },
          { id: 'performance', label: 'Performance', icon: BarChart2 },
          { id: 'infographics', label: 'Academic Insights', icon: PieChart },
          { id: 'resources', label: 'Resources', icon: FolderArchive }
        ];
      case 'faculty':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'classes', label: 'My Classes', icon: Layers },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'assessments', label: 'Assessments', icon: CheckSquare },
          { id: 'coding-assessments', label: 'Coding Assessments', icon: Terminal },
          { id: 'resources', label: 'Resources', icon: FolderArchive },
          { id: 'analytics', label: 'Analytics', icon: Activity }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'User Provisioning', icon: Users },
          { id: 'syllabus', label: 'Syllabus Management', icon: FileText },
          { id: 'pyqs', label: 'PYQ Management', icon: HelpCircle },
          { id: 'coding-management', label: 'Coding Management', icon: Code2 },
          { id: 'rag-base', label: 'RAG Knowledge Base', icon: Cpu },
          { id: 'rag-settings', label: 'RAG Vector Settings', icon: Sliders },
          { id: 'analytics', label: 'System Analytics', icon: BarChart2 },
          { id: 'audit-logs', label: 'Security Audit Logs', icon: ShieldAlert },
          { id: 'settings', label: 'System Settings', icon: Settings }
        ];
      default:
        return [];
    }
  }, [activeRole]);

  const roleThemeBg = activeRole === 'student' ? 'var(--pastel-blue-bg)' : activeRole === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)';
  const roleThemeBorder = activeRole === 'student' ? 'var(--pastel-blue-border)' : activeRole === 'faculty' ? 'var(--pastel-green-border)' : 'var(--pastel-purple-border)';
  const roleThemeColor = activeRole === 'student' ? 'var(--primary-blue)' : activeRole === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)';
  const roleLabel = activeRole === 'student' ? 'Student' : activeRole === 'faculty' ? 'Faculty' : 'Admin';

  const displayName = currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const displayEmail = currentUser?.email || '';
  const displayAvatar = currentUser?.avatar || (displayName ? displayName.slice(0, 2).toUpperCase() : 'U');

  return (
    <aside className="sidebar">
      {/* Top Header */}
      <div className="sidebar-header">
        <GmritLogo size="medium" />
      </div>

      {/* Role Pill Banner */}
      <div style={{
        margin: '10px 10px 4px',
        padding: '5px 10px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: activeRole === 'student' ? 'var(--pastel-blue-bg)' : activeRole === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)',
        border: `1px solid ${activeRole === 'student' ? 'var(--pastel-blue-border)' : activeRole === 'faculty' ? 'var(--pastel-green-border)' : 'var(--pastel-purple-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeRole === 'student' && <GraduationCap size={13} color="var(--pastel-blue-text)" />}
          {activeRole === 'faculty' && <Award size={13} color="var(--pastel-green-text)" />}
          {activeRole === 'admin' && <Shield size={13} color="var(--pastel-purple-text)" />}
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            color: activeRole === 'student' ? 'var(--pastel-blue-text)' : activeRole === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)'
          }}>
            {activeRole} Portal
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>R20/R23</span>
      </div>

      {/* Main Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(item.id);
                }
              }}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} color={isActive ? 'var(--primary-blue)' : 'var(--text-secondary)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </div>
          );
        })}

        {/* Divider */}
        <div className="sidebar-divider" />

        <div className="sidebar-section-title">Support & Intelligence</div>

        {/* AI Assistant shortcut */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Open GMRIT AI Assistant"
          onClick={onOpenRag}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenRag();
            }
          }}
          className="nav-item"
          style={{
            color: 'var(--pastel-blue-text)',
            backgroundColor: 'var(--pastel-blue-bg)',
            border: '1px solid var(--pastel-blue-border)',
            fontWeight: 600,
            margin: '2px 0 4px',
            transition: 'transform var(--transition-spring), box-shadow var(--transition-spring), background-color var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 3px 10px rgba(37, 99, 235, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Sparkles size={16} color="var(--primary-blue)" />
          <span style={{ flex: 1 }}>AI Assistant</span>
          <span className="badge badge-blue" style={{ fontSize: '9px', padding: '1px 5px' }}>RAG</span>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-current={currentView === 'settings' ? 'page' : undefined}
          onClick={() => onNavigate('settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('settings');
            }
          }}
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
        >
          <Settings size={16} color="var(--text-secondary)" />
          <span style={{ flex: 1 }}>Settings</span>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => alert("GMRIT Academic Helpdesk: helpdesk@gmrit.edu.in • Ext: 4402")}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              alert("GMRIT Academic Helpdesk: helpdesk@gmrit.edu.in • Ext: 4402");
            }
          }}
          className="nav-item"
        >
          <LifeBuoy size={16} color="var(--text-secondary)" />
          <span style={{ flex: 1 }}>Help & Support</span>
        </div>
      </nav>

      {/* Bottom Profile & Logout Footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: roleThemeBg,
            border: `1px solid ${roleThemeBorder}`,
            color: roleThemeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11.5px',
            flexShrink: 0
          }}>
            {displayAvatar}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayEmail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px', fontSize: '11px' }}>
          <span
            onClick={() => onNavigate('settings')}
            style={{ color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, transition: 'color var(--transition-smooth)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-blue)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Settings
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--error)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'transform var(--transition-spring), opacity var(--transition-smooth)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'none'}
          >
            <LogOut size={11} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
