import React, { useState, useMemo } from 'react';
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
  Terminal,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({
  activeRole,
  currentView,
  onNavigate,
  onLogout,
  onOpenRag,
  currentUser
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
              { id: 'assessments', label: 'Assessments', icon: CheckSquare },
              { id: 'ai-copilot', label: 'AI Academic Copilot', icon: Sparkles, isAction: true }
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
              { id: 'classes', label: 'My Classes', icon: Layers },
              { id: 'students', label: 'Student Monitoring', icon: Users }
            ]
          },
          {
            title: 'Curriculum & Tests',
            items: [
              { id: 'assessments', label: 'Assessments Manager', icon: CheckSquare },
              { id: 'resources', label: 'Syllabus & Handouts', icon: FolderArchive },
              { id: 'ai-copilot', label: 'RAG Knowledge Assistant', icon: Sparkles, isAction: true }
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
              { id: 'users', label: 'User Directory & Approvals', icon: Users }
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
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <GmritLogo size="medium" />
      </div>

      {/* Role Indicator Banner */}
      <div style={{
        margin: '12px 14px 8px',
        padding: '9px 12px',
        borderRadius: '10px',
        backgroundColor: roleBadgeBg,
        border: `1px solid ${roleBadgeBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
            display: 'inline-block'
          }} />
          <RoleIcon size={14} color={roleBadgeText} />
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: roleBadgeText
          }}>
            {roleLabel} Portal
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.4px', backgroundColor: 'rgba(255, 255, 255, 0.65)', padding: '2px 6px', borderRadius: '4px' }}>
          R20/R23
        </span>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {navSections.map((section, sIdx) => (
          <div key={section.title || sIdx} style={{ marginBottom: '10px' }}>
            {section.title && (
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
                    onClick={() => handleItemClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(item);
                      }
                    }}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={isSpecial ? {
                      backgroundColor: 'rgba(37, 99, 235, 0.06)',
                      color: 'var(--color-primary)',
                      fontWeight: 600
                    } : undefined}
                  >
                    <Icon 
                      size={16} 
                      color={isActive ? 'var(--color-primary)' : (isSpecial ? 'var(--color-primary)' : 'var(--text-muted)')} 
                    />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                    {isSpecial && (
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-blue)',
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
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(226, 232, 240, 0.85)',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          <div style={{ position: 'relative' }}>
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
              color: roleBadgeText,
              flexShrink: 0
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
          <div style={{ minWidth: 0 }}>
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
          style={{ width: '30px', height: '30px', border: '1px solid rgba(226, 232, 240, 0.9)', background: '#FFFFFF', borderRadius: '8px' }}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={14} color="#DC2626" />
        </button>
      </div>
    </aside>
  );
}
