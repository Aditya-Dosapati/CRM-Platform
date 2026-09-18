import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Header({
  currentUser,
  activeRole,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenProfile,
  notificationCount = 2,
  pageTitle = "Dashboard",
  pageSubtitle = "Welcome back! Here's what's happening with your academics."
}) {
  const roleLabel = activeRole === 'student' ? 'Student' : activeRole === 'faculty' ? 'Faculty' : 'Administrator';
  const roleDotColor = activeRole === 'student' ? 'var(--primary-blue)' : activeRole === 'faculty' ? '#059669' : '#7C3AED';

  return (
    <header className="header-bar">
      {/* Left: Page Title & Subtitle */}
      <div>
        <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
          {pageTitle}
        </h1>
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
          {pageSubtitle}
        </p>
      </div>

      {/* Right: Global Search, Notification & Read-Only Authenticated User Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Global Search Box */}
        <div
          onClick={onOpenCommandPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            cursor: 'pointer',
            width: '240px',
            transition: 'transform var(--transition-spring), border-color var(--transition-smooth), box-shadow var(--transition-spring)',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-blue)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 3px 8px rgba(37, 99, 235, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        >
          <Search size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1 }}>
            Search subjects, resources...
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
            padding: '1px 5px',
            fontSize: '9.5px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            ⌘K
          </div>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="btn-icon"
          style={{ position: 'relative', width: '32px', height: '32px' }}
          title="Notifications"
          onMouseEnter={(e) => {
            const icon = e.currentTarget.querySelector('svg');
            if (icon) icon.style.animation = 'bellJingle 0.6s ease';
          }}
          onAnimationEnd={(e) => {
            if (e.target) e.target.style.animation = '';
          }}
        >
          <Bell size={15} color="var(--text-secondary)" />
          {notificationCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-blue)',
              boxShadow: '0 0 0 2px #FFFFFF',
              animation: 'pulseSubtle 2.5s infinite ease-in-out'
            }} />
          )}
        </button>

        {/* Read-Only Authenticated User Identity Pill (Non-Editable) */}
        <div
          onClick={onOpenProfile}
          title="View authenticated institutional profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '4px 10px 4px 6px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform var(--transition-spring), border-color var(--transition-smooth), background-color var(--transition-smooth), box-shadow var(--transition-spring)',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 3px 8px rgba(15, 23, 42, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        >
          {/* Avatar Circle */}
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: activeRole === 'student' ? 'var(--pastel-blue-bg)' : activeRole === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)',
            border: `1px solid ${activeRole === 'student' ? 'var(--pastel-blue-border)' : activeRole === 'faculty' ? 'var(--pastel-green-border)' : 'var(--pastel-purple-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11.5px',
            color: activeRole === 'student' ? 'var(--primary-blue)' : activeRole === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)',
            flexShrink: 0
          }}>
            {currentUser?.avatar || 'RK'}
          </div>

          {/* User Name & Role indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {currentUser?.name || 'Rahul Kumar'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: roleDotColor
              }} />
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
