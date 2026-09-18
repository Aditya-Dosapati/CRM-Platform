import React, { useState } from 'react';
import GmritLogo from '../common/GmritLogo';
import { Lock, Mail, ShieldAlert, LogIn, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';

export default function LoginView({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('student@gmrit.edu.in');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        const authResult = authService.login(identifier, password);
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(authResult.user, authResult.session, authResult.isFirstLogin);
        }
      } catch (err) {
        setIsLoading(false);
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    }, 250);
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#F8FAFC',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 20px',
      overflowX: 'hidden'
    }}>
      {/* Subtle Pastel Background Accent Shapes */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '10%',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(219, 234, 254, 0.6) 0%, rgba(248, 250, 252, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '180px',
        right: '12%',
        width: '360px',
        height: '360px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(237, 233, 254, 0.5) 0%, rgba(248, 250, 252, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Institutional Branding Top */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 1,
        marginBottom: '32px'
      }}>
        <GmritLogo size="large" showSubtitle={false} />
        
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          color: '#111827',
          marginTop: '14px',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          GMRIT Academic Hub
        </h1>
        <p style={{
          fontSize: '13.5px',
          color: '#4B5563',
          fontWeight: 500,
          marginTop: '3px'
        }}>
          AI-Powered Academic Management & Learning Platform
        </p>
      </div>

      {/* Clean White Login Card */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '32px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1,
          marginBottom: '28px'
        }}
      >
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Institutional Sign In
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Authenticate with your verified credentials
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '11px 13px',
            backgroundColor: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            color: '#E11D48',
            fontSize: '12.5px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Pure Credential Form - NO Role Selector Tabs */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">
              <span>User ID / Institutional Email</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. student@gmrit.edu.in or STU001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                style={{ paddingLeft: '36px' }}
              />
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <div className="input-group">
            <div className="input-label">
              <span>Password</span>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-blue)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input-field"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '36px', paddingRight: '36px' }}
              />
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '11px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '6px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Security Policy Notice */}
        <div style={{
          marginTop: '20px',
          padding: '12px 14px',
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldAlert size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.35, margin: 0 }}>
            Role and permissions are derived strictly from your authenticated account record.
          </p>
        </div>
      </div>

      {/* Demo Prototype Credentials Helper Card (Fills input fields for testing) */}
      <div style={{
        maxWidth: '430px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '18px 20px',
        boxShadow: 'var(--shadow-xs)',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldCheck size={16} color="var(--primary-blue)" />
          <h3 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Institutional Demo Accounts
          </h3>
        </div>
        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
          Click an account to populate credentials into the form above. The authentication system resolves your authorized role:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Student Account */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            backgroundColor: 'var(--pastel-blue-bg)',
            border: '1px solid var(--pastel-blue-border)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 5px' }}>STUDENT</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Rahul Kumar</strong>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>student@gmrit.edu.in</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFillDemo('student@gmrit.edu.in', 'student123')}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Fill Credentials
            </button>
          </div>

          {/* Faculty Account */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            backgroundColor: 'var(--pastel-green-bg)',
            border: '1px solid var(--pastel-green-border)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-green" style={{ fontSize: '9.5px', padding: '1px 5px' }}>FACULTY</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Dr. Priya Sharma</strong>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>faculty@gmrit.edu.in</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFillDemo('faculty@gmrit.edu.in', 'faculty123')}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Fill Credentials
            </button>
          </div>

          {/* Admin Account */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            backgroundColor: 'var(--pastel-purple-bg)',
            border: '1px solid var(--pastel-purple-border)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>ADMIN</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>System Administrator</strong>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>admin@gmrit.edu.in</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleFillDemo('admin@gmrit.edu.in', 'admin123')}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Fill Credentials
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="var(--primary-blue)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Password Assistance
                </h3>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                In accordance with GMRIT institutional security, account passwords are managed centrally.
              </p>
              <div style={{
                marginTop: '16px',
                padding: '14px',
                backgroundColor: 'var(--pastel-blue-bg)',
                border: '1px solid var(--pastel-blue-border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--primary-blue)', fontWeight: 700 }}>
                  Need a password reset?
                </p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Please contact the Academic Dean Office or email <strong>it-helpdesk@gmrit.edu.in</strong> with your Roll Number / Employee ID.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForgotModal(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
