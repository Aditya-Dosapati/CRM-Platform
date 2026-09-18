import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, ArrowRight, UserCheck, Check } from 'lucide-react';
import authService from '../../services/authService';

export default function FirstLoginModal({ user, onComplete }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Password change, 2: Profile confirmation
  
  // Profile confirmation fields
  const [phone, setPhone] = useState('+91 98480 ');
  const [guardianName, setGuardianName] = useState('Parent / Guardian');
  const [specialization, setSpecialization] = useState(user.role === 'faculty' ? 'Machine Learning & Neural Networks' : 'Computer Science Core');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation password do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from your temporary password.");
      return;
    }

    try {
      // Validate current password match against user record
      if (user.password !== currentPassword) {
        setError("Temporary password entered does not match our records.");
        return;
      }
      // Move to profile confirmation step
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      const profileUpdates = {
        phoneNumber: phone,
        guardianName: user.role === 'student' ? guardianName : undefined,
        specialization: specialization
      };

      const updatedUser = authService.completeFirstLogin(user.userId, currentPassword, newPassword, profileUpdates);
      onComplete(updatedUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const isStudent = user.role === 'student';

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', background: 'rgba(15, 23, 42, 0.65)' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          animation: 'scaleIn 0.2s ease'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--pastel-blue-bg)',
            border: '1px solid var(--pastel-blue-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: 'var(--primary-blue)'
          }}>
            <KeyRound size={26} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            {step === 1 ? 'Initial Security Configuration' : 'Confirm Institutional Profile'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {step === 1
              ? `Welcome, ${user.name}! Please set your personal permanent password.`
              : `Review and confirm your academic details to activate your ${isStudent ? 'Student' : 'Faculty'} portal.`}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: step === 1 ? 'var(--primary-blue)' : 'var(--success)'
          }}>
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: step === 1 ? 'var(--primary-blue)' : 'var(--pastel-green-bg)',
              color: step === 1 ? '#FFFFFF' : 'var(--pastel-green-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px'
            }}>
              {step > 1 ? <Check size={12} /> : '1'}
            </span>
            <span>Set Password</span>
          </div>

          <div style={{ width: '30px', height: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: step === 2 ? 'var(--primary-blue)' : 'var(--text-muted)'
          }}>
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: step === 2 ? 'var(--primary-blue)' : '#F1F5F9',
              color: step === 2 ? '#FFFFFF' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px'
            }}>
              2
            </span>
            <span>Profile Confirmation</span>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            color: '#E11D48',
            fontSize: '12.5px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Password Form */}
        {step === 1 && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="input-group" style={{ marginBottom: '14px' }}>
              <label className="input-label">Temporary Password (from Admin)</label>
              <input
                type="password"
                className="input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password"
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '14px' }}>
              <label className="input-label">New Permanent Password</label>
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>

            <div style={{
              padding: '10px 12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '22px',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>Security Guidelines:</p>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li>Must be at least 8 characters in length</li>
                <li>Do not share institutional credentials with peers</li>
              </ul>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              <span>Continue to Profile Confirmation</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: Profile Confirmation Form */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit}>
            <div style={{
              backgroundColor: 'var(--pastel-blue-bg)',
              border: '1px solid var(--pastel-blue-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <p style={{ fontSize: '11.5px', color: 'var(--pastel-blue-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                Verified Institutional Identity
              </p>
              <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Account ID:</span>
                  <strong>{user.userId}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Department:</span>
                  <strong>{user.department}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Email:</span>
                  <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Role:</span>
                  <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '14px' }}>
              <label className="input-label">Emergency / Mobile Phone</label>
              <input
                type="text"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {isStudent ? (
              <div className="input-group" style={{ marginBottom: '22px' }}>
                <label className="input-label">Parent / Guardian Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="input-group" style={{ marginBottom: '22px' }}>
                <label className="input-label">Primary Teaching Focus / Specialization</label>
                <input
                  type="text"
                  className="input-field"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
              >
                <ShieldCheck size={16} />
                <span>Activate Account & Enter Dashboard</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
