import React, { useState } from 'react';
import { 
  Bell, Search, Sparkles, User, LogOut, Settings as SettingsIcon, 
  Menu, ChevronDown, ShieldCheck, GraduationCap, Award, Shield, 
  ExternalLink, BookOpen, Code2 
} from 'lucide-react';

export default function Header({
  currentUser,
  activeRole,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenProfile,
  onOpenRagQuery,
  onLogout,
  onNavigate,
  onToggleMobileSidebar,
  notificationCount = 0,
  pageTitle = "Dashboard",
  pageSubtitle = "Welcome back! Here's what's happening with your academics."
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const roleLabel = activeRole === 'student' ? 'Student' : activeRole === 'faculty' ? 'Faculty' : 'Administrator';
  const roleBadgeBg = activeRole === 'student' ? 'var(--pastel-blue-bg)' : activeRole === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)';
  const roleBadgeBorder = activeRole === 'student' ? 'var(--pastel-blue-border)' : activeRole === 'faculty' ? 'var(--pastel-green-border)' : 'var(--pastel-purple-border)';
  const roleBadgeText = activeRole === 'student' ? 'var(--pastel-blue-text)' : activeRole === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)';
  const RoleIcon = activeRole === 'student' ? GraduationCap : activeRole === 'faculty' ? Award : Shield;

  const displayName = currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const displayAvatar = currentUser?.avatar || (displayName ? displayName.slice(0, 2).toUpperCase() : 'U');

  return (
    <header className="header-bar" style={{ gap: '16px' }}>
      
      {/* Left: Mobile Toggle & Breadcrumb / Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="btn-icon mobile-sidebar-toggle"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="header-title-container" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            <span>GMRIT</span>
            <span style={{ color: 'var(--border-medium)' }}>/</span>
            <span style={{ color: roleBadgeText }}>{roleLabel} Portal</span>
            <span style={{ color: 'var(--border-medium)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>{pageTitle}</span>
          </div>
          <h1 style={{ 
            fontSize: '16.5px', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            letterSpacing: '-0.3px', 
            margin: '1px 0 0 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={pageTitle}
          >
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar (Ctrl + K) */}
      <div style={{ flex: 1, maxWidth: '440px', minWidth: '180px' }}>
        <button
          type="button"
          onClick={onOpenCommandPalette}
          style={{
            width: '100%',
            height: '38px',
            backgroundColor: '#F8FAFC',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: '10px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-muted)',
            fontSize: '12.5px',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 1px rgba(15, 23, 42, 0.02)',
            transition: 'border-color var(--transition-smooth), box-shadow var(--transition-smooth), background-color var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(15, 23, 42, 0.02)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={15} color="var(--text-muted)" />
            <span>Search subjects, problems, notes, PYQs...</span>
          </div>
          <kbd style={{
            padding: '2px 7px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: '5px',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            fontFamily: 'inherit',
            boxShadow: '0 1px 1px rgba(0,0,0,0.04)'
          }}>
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: AI Copilot Trigger, Notifications & Profile Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        
        {/* Quick AI Assistant Trigger (Restricted from faculty) */}
        {activeRole !== 'faculty' && (
          <button
            onClick={() => onOpenRagQuery && onOpenRagQuery('')}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              color: '#C2410C',
              border: '1px solid #FED7AA',
              fontWeight: 700,
              padding: '6px 13px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(234, 88, 12, 0.12)'
            }}
            title="Open AI Academic Copilot"
          >
            <Sparkles size={14} color="#EA580C" />
            <span className="hide-on-mobile">Ask AI</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="btn-icon"
          style={{ position: 'relative' }}
          title="View Notifications"
          aria-label={`Notifications (${notificationCount} unread)`}
        >
          <Bell size={16} color="var(--text-secondary)" />
          {notificationCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              boxShadow: '0 0 0 2px #FFFFFF'
            }} />
          )}
        </button>

        {/* Profile Pill & Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              cursor: 'pointer',
              padding: '4px 8px 4px 5px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-xs)',
              userSelect: 'none',
              transition: 'border-color var(--transition-smooth), background-color var(--transition-smooth)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: roleBadgeBg,
              border: `1px solid ${roleBadgeBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '11px',
              color: roleBadgeText
            }}>
              {displayAvatar}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: roleBadgeText }}>
                {roleLabel}
              </span>
            </div>

            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </div>

          {/* User Quick Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 100 }} 
                onClick={() => setIsDropdownOpen(false)} 
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '240px',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-light)',
                padding: '6px',
                zIndex: 101,
                animation: 'slideUp 0.15s var(--ease-spring)'
              }}>
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{displayName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: '1px' }}>
                    {currentUser?.email}
                  </div>
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    marginTop: '6px', 
                    padding: '2px 7px', 
                    borderRadius: '4px', 
                    backgroundColor: roleBadgeBg, 
                    color: roleBadgeText, 
                    fontSize: '10.5px', 
                    fontWeight: 700 
                  }}>
                    <RoleIcon size={12} />
                    <span>{roleLabel}</span>
                  </div>
                </div>

                <div 
                  role="button"
                  onClick={() => { setIsDropdownOpen(false); onOpenProfile && onOpenProfile(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <User size={15} />
                  <span>Academic Profile</span>
                </div>

                <div 
                  role="button"
                  onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('settings'); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <SettingsIcon size={15} />
                  <span>Portal Preferences</span>
                </div>

                {activeRole !== 'faculty' && (
                  <div 
                    role="button"
                    onClick={() => { setIsDropdownOpen(false); onOpenRagQuery && onOpenRagQuery(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#C2410C',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFF7ED'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Sparkles size={15} color="#EA580C" />
                    <span>Ask GMRIT Copilot</span>
                  </div>
                )}

                <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '4px 0' }} />

                <div 
                  role="button"
                  onClick={() => { setIsDropdownOpen(false); onLogout && onLogout(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#DC2626',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <LogOut size={15} />
                  <span>Sign Out of Hub</span>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
