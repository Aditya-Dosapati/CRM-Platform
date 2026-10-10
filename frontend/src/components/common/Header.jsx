import React from 'react';
import { Bell } from 'lucide-react';

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
      {/* Left: Page Title & Subtitle with Robust Overflow Protection */}
      <div className="header-title-container" style={{ minWidth: 0, flex: 1, marginRight: '16px' }}>
        <h1 
          style={{ 
            fontSize: '17px', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            letterSpacing: '-0.3px', 
            margin: 0,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={pageTitle}
        >
          {pageTitle}
        </h1>
        <p 
          style={{ 
            fontSize: '11.5px', 
            color: 'var(--text-muted)', 
            margin: '2px 0 0 0',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={pageSubtitle}
        >
          {pageSubtitle}
        </p>
      </div>

      {/* Right: Notification & Read-Only Authenticated User Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="btn-icon"
          style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}
          title="Notifications"
          aria-label={`Notifications (${notificationCount} unread)`}
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
              animation: 'pulseSubtle 2s infinite'
            }} />
          )}
        </button>

        {/* Read-Only Authenticated User Identity Pill (Non-Editable) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="View authenticated institutional profile"
          onClick={onOpenProfile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenProfile();
            }
          }}
          title="View authenticated institutional profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            cursor: 'pointer',
            padding: '4px 10px 4px 6px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform var(--transition-spring), border-color var(--transition-smooth), background-color var(--transition-smooth), box-shadow var(--transition-spring)',
            userSelect: 'none',
            maxWidth: '220px',
            minWidth: 0
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
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: activeRole === 'student' ? 'var(--pastel-blue-bg)' : activeRole === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)',
            border: `1px solid ${activeRole === 'student' ? 'var(--pastel-blue-border)' : activeRole === 'faculty' ? 'var(--pastel-green-border)' : 'var(--pastel-purple-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11px',
            color: activeRole === 'student' ? 'var(--primary-blue)' : activeRole === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)',
            flexShrink: 0
          }}>
            {currentUser?.avatar || (currentUser?.name || currentUser?.email || 'U').slice(0, 2).toUpperCase()}
          </div>

          {/* User Name & Role indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2, minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: 'var(--text-primary)', 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', minWidth: 0 }}>
              <span style={{
                width: '5.5px',
                height: '5.5px',
                borderRadius: '50%',
                backgroundColor: roleDotColor,
                flexShrink: 0
              }} />
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 600, 
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
