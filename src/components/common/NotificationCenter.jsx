import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, AlertCircle, FileText, Check } from 'lucide-react';
import { notificationsList } from '../../data/mockData';

export default function NotificationCenter({ isOpen, onClose, activeRole, onNavigate }) {
  if (!isOpen) return null;

  const notifications = notificationsList[activeRole] || [];

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={15} color="#EA580C" />;
      case 'danger': return <AlertCircle size={15} color="var(--error)" />;
      case 'rag': return <FileText size={15} color="var(--primary-blue)" />;
      default: return <Bell size={15} color="var(--primary-blue)" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0, backdropFilter: 'blur(3px)', background: 'rgba(15, 23, 42, 0.3)' }}>
      <div
        style={{
          width: '380px',
          height: '100vh',
          background: '#FFFFFF',
          borderLeft: '1px solid var(--border-light)',
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
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--primary-blue)" />
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Notifications
            </h3>
            <span className="badge badge-blue" style={{ fontSize: '11px', padding: '2px 8px' }}>
              {notifications.filter(n => !n.read).length} New
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
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
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: n.read ? '#FFFFFF' : 'var(--pastel-blue-bg)',
                border: n.read ? '1px solid var(--border-light)' : '1px solid var(--pastel-blue-border)',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.2s var(--ease-spring)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.985) translateX(-3px)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateX(-3px)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  padding: '7px',
                  borderRadius: '8px',
                  background: n.read ? '#F1F5F9' : '#DBEAFE',
                  marginTop: '1px',
                  transition: 'transform 0.2s var(--ease-spring)'
                }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {n.time}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                    {n.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-light)',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Mark all read
          </button>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            GMRIT Real-time Alert Relay
          </span>
        </div>
      </div>
    </div>
  );
}
