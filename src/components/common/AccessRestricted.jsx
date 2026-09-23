import React, { useEffect, useRef } from 'react';
import { ShieldAlert, ArrowLeft, Lock, FileWarning, UserCheck } from 'lucide-react';
import { VIEW_TITLES, accessControl } from '../../services/accessControl';

export default function AccessRestricted({ currentUser, attemptedView, onReturn }) {
  const loggedRef = useRef(false);

  // Log unauthorized access incident once per mounted incident
  useEffect(() => {
    if (!loggedRef.current && currentUser) {
      accessControl.logUnauthorizedAttempt(currentUser, attemptedView);
      loggedRef.current = true;
    }
  }, [currentUser?.userId, attemptedView]);

  const roleLabel = currentUser?.role === 'student' ? 'Student' : currentUser?.role === 'faculty' ? 'Faculty' : 'Administrator';
  const resourceTitle = VIEW_TITLES[attemptedView] || attemptedView;

  return (
    <div className="page-content" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '72vh',
      padding: '40px 20px'
    }}>
      <div className="card" style={{
        maxWidth: '540px',
        width: '100%',
        padding: '36px 32px',
        textAlign: 'center',
        border: '1px solid #FECDD3',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: '#FFFFFF',
        boxShadow: 'var(--shadow-md)',
        animation: 'fadeIn 0.25s ease'
      }}>
        {/* Security Shield Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#FFF1F2',
          border: '1px solid #FECDD3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          color: '#E11D48'
        }}>
          <ShieldAlert size={32} />
        </div>

        {/* Security Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', marginBottom: '12px' }}>
          <Lock size={12} color="#E11D48" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#E11D48', letterSpacing: '0.6px' }}>
            403 FORBIDDEN
          </span>
        </div>

        <h1 style={{
          fontSize: '22px',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          marginBottom: '8px'
        }}>
          Access Restricted
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#4B5563',
          lineHeight: 1.5,
          marginBottom: '24px'
        }}>
          You don't have permission to access this resource.
        </p>

        {/* Security Details Container */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'left',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Attempted Resource:</span>
            <span style={{ fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
              /{currentUser?.role}/{attemptedView}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Resource Description:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {resourceTitle}
            </span>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Authenticated User:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentUser?.name || 'Authorized Account'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Assigned Role:</span>
            <span className="badge" style={{
              backgroundColor: currentUser?.role === 'student' ? 'var(--pastel-blue-bg)' : currentUser?.role === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)',
              color: currentUser?.role === 'student' ? 'var(--pastel-blue-text)' : currentUser?.role === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              padding: '2px 8px'
            }}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Institutional Policy Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          textAlign: 'left',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '26px'
        }}>
          <FileWarning size={16} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '11.5px', color: '#1E40AF', lineHeight: 1.4, margin: 0 }}>
            Under GMRIT institutional data governance, system access is strictly scoped to your authorized role. This event has been recorded in the central security audit log.
          </p>
        </div>

        {/* Smart Dynamic Return Button */}
        <button
          onClick={onReturn}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} />
          <span>Return to {roleLabel} Dashboard</span>
        </button>
      </div>
    </div>
  );
}
