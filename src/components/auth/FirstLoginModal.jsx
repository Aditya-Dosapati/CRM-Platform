import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, ArrowRight, Eye, EyeOff, LogOut, Check, X } from 'lucide-react';
import authService from '../../services/authService';

export default function FirstLoginModal({ user, onComplete, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password Policy Real-time Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = !currentPassword || newPassword !== currentPassword;

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch && isDifferentFromCurrent && currentPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError("Please enter your current temporary password provided by the administrator.");
      return;
    }

    if (!hasMinLength) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError("New password does not meet all complexity requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New permanent password must be different from your temporary password.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      
      setSuccess("Password updated successfully! Redirecting to your dashboard...");
      setIsLoading(false);

      setTimeout(() => {
        if (typeof onComplete === 'function') {
          onComplete({
            ...user,
            mustChangePassword: false
          });
        }
      }, 1200);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Failed to update password. Please check your temporary password.");
    }
  };

  const handleSignOut = async () => {
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      try {
        await authService.logout();
      } catch (_) {}
      window.location.reload();
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'scaleIn 0.25s var(--ease-spring)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--pastel-blue-bg)',
            border: '2px solid var(--pastel-blue-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--primary-blue)'
          }}>
            <KeyRound size={28} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
            Mandatory Password Change
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
            Your account was provisioned with a <strong>temporary password</strong> by an administrator. Please set a new permanent password to continue.
          </p>
        </div>

        {/* User Badge Info */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Signed in as: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{user?.name || user?.email}</strong>
          </div>
          <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
            {user?.role || 'User'}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            color: '#E11D48',
            fontSize: '12.5px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            color: '#16A34A',
            fontSize: '12.5px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Current Temporary Password */}
          <div className="input-group" style={{ marginBottom: '14px' }}>
            <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>
              Current Temporary Password <span style={{ color: '#E11D48' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                className="input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password (e.g. GMRIT@XXXX)"
                required
                disabled={isLoading || Boolean(success)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Permanent Password */}
          <div className="input-group" style={{ marginBottom: '14px' }}>
            <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>
              New Permanent Password <span style={{ color: '#E11D48' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? "text" : "password"}
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create new strong password"
                required
                disabled={isLoading || Boolean(success)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>
              Confirm New Password <span style={{ color: '#E11D48' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                disabled={isLoading || Boolean(success)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '20px',
            fontSize: '11.5px'
          }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Password Requirements:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#16A34A' : 'var(--text-muted)' }}>
                {hasMinLength ? <Check size={13} /> : <X size={13} />}
                <span>8+ Characters</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUpper ? '#16A34A' : 'var(--text-muted)' }}>
                {hasUpper ? <Check size={13} /> : <X size={13} />}
                <span>Uppercase (A-Z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasLower ? '#16A34A' : 'var(--text-muted)' }}>
                {hasLower ? <Check size={13} /> : <X size={13} />}
                <span>Lowercase (a-z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#16A34A' : 'var(--text-muted)' }}>
                {hasNumber ? <Check size={13} /> : <X size={13} />}
                <span>Number (0-9)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#16A34A' : 'var(--text-muted)' }}>
                {hasSpecial ? <Check size={13} /> : <X size={13} />}
                <span>Special Symbol</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordsMatch ? '#16A34A' : 'var(--text-muted)' }}>
                {passwordsMatch ? <Check size={13} /> : <X size={13} />}
                <span>Passwords Match</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSignOut}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
            
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={!isFormValid || isLoading || Boolean(success)}
            >
              <ShieldCheck size={18} />
              <span>{isLoading ? "Updating Password..." : "Update Password & Continue"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
