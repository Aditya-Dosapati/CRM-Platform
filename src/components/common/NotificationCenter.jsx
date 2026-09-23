import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, AlertCircle, FileText, Check } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from './EmptyState';

export default function NotificationCenter({
  isOpen,
  onClose,
  activeRole,
  onNavigate,
  notifications: propNotifications,
  onMarkAllRead
}) {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const notifications = propNotifications || [];

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={15} color="var(--color-primary)" />;
      case 'danger': return <AlertCircle size={15} color="var(--error)" />;
      case 'rag': return <FileText size={15} color="var(--color-accent)" />;
      default: return <Bell size={15} color="var(--color-primary)" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0, backdropFilter: 'blur(3px)', background: 'rgba(43, 33, 24, 0.4)' }}>
      <div
        style={{
          width: '380px',
          height: '100vh',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'drawerSlideInRight 0.24s var(--ease-spring)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--color-text)' }}>
              Notifications
            </h3>
            {notifications.length > 0 && (
              <span className="badge badge-blue" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {notifications.filter(n => !n.read).length} New
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text)',
              opacity: 0.6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Notifications list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 10px' }}>
              <EmptyState
                icon={Bell}
                title="No Notifications"
                message="You have no unread institutional alerts or messages at this time."
              />
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: n.read ? 'var(--color-surface)' : 'var(--color-bg)',
                  border: n.read ? '1px solid var(--color-border)' : '1px solid var(--color-primary)',
                  marginBottom: '12px',
                  transition: 'all 0.2s var(--ease-spring)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    padding: '7px',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    marginTop: '1px'
                  }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {n.title}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6 }}>
                        {n.time}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.8, marginTop: '4px', lineHeight: 1.45 }}>
                      {n.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onMarkAllRead) onMarkAllRead();
              }}
            >
              Mark all read
            </button>
            <span style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7 }}>
              GMRIT Real-time Alert Relay
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
