import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Mail, Shield, Lock, Building, GraduationCap, 
  Briefcase, Check, AlertCircle, RotateCw, Sparkles, BookOpen 
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import authService from '../../services/authService';

const FACULTY_DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Head of Department (HOD)',
  'Dean - Academics',
  'Dean - Student Affairs',
  'Dean - R&D',
  'Principal'
];

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  activeRole = 'student', 
  onProfileUpdated 
}) {
  useEscapeKey(onClose, isOpen);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Synchronize state when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setDesignation(currentUser.designation || 'Assistant Professor');
      setError('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const role = (activeRole || currentUser.role || 'student').toLowerCase().trim();
  const isStudent = role === 'student';
  const isFaculty = role === 'faculty';

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    console.log('[EditProfileModal] handleSubmit running with:', { name, email, designation });
    setError('');

    // Validation
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setError('Full Name must be at least 2 characters long.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid institutional email address.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: cleanName,
        email: cleanEmail
      };

      if (isFaculty && designation) {
        payload.designation = designation.trim();
      }

      const response = await authService.updateProfile(payload);
      
      if (response && response.success) {
        if (typeof onProfileUpdated === 'function') {
          onProfileUpdated(response.user || {
            ...currentUser,
            name: cleanName,
            email: cleanEmail,
            designation: isFaculty ? designation : currentUser.designation
          });
        }
        onClose();
      } else {
        throw new Error(response?.message || 'Could not update profile.');
      }
    } catch (err) {
      console.error('[EditProfileModal] Save error:', err);
      setError(err.message || 'An unexpected error occurred while saving profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
    >
      <div 
        className="modal-content"
        style={{
          maxWidth: '560px',
          width: '100%',
          background: 'var(--bg-modal, #FFFFFF)',
          borderRadius: '14px',
          boxShadow: '0 24px 48px -12px rgba(43, 33, 24, 0.22)',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface, #FAFAF9)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 
                id="edit-profile-modal-title"
                style={{ 
                  fontSize: '17px', 
                  fontWeight: 800, 
                  color: 'var(--text-primary, #1E293B)', 
                  margin: 0,
                  letterSpacing: '-0.3px'
                }}
              >
                Edit Profile Information
              </h3>
              <span className={`badge ${isStudent ? 'badge-blue' : isFaculty ? 'badge-green' : 'badge-purple'}`} style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                {role}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', margin: '3px 0 0 0' }}>
              Update your personal institutional details and display preferences
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted, #64748B)',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease'
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Error Banner */}
            {error && (
              <div 
                id="edit-profile-error-banner"
                data-testid="edit-profile-error"
                style={{
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  color: '#BE123C',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.4
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>{error}</div>
              </div>
            )}

            {/* Editable Field 1: Full Name */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="edit-profile-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Full Name</span>
                <span style={{ fontSize: '11px', color: 'var(--color-primary, #2563EB)', fontWeight: 600 }}>Editable</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="edit-profile-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSaving}
                  style={{ paddingLeft: '34px', fontSize: '13.5px' }}
                />
                <User size={15} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '11px', top: '12px' }} />
              </div>
            </div>

            {/* Editable Field 2: Email Address */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="edit-profile-email" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Institutional Email Address</span>
                <span style={{ fontSize: '11px', color: 'var(--color-primary, #2563EB)', fontWeight: 600 }}>Editable</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="edit-profile-email"
                  type="email"
                  className="input-field"
                  placeholder="e.g. user@gmrit.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSaving}
                  style={{ paddingLeft: '34px', fontSize: '13.5px', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Mail size={15} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '11px', top: '12px' }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', marginTop: '4px', display: 'block' }}>
                Used for platform authentication, academic notices, and exam schedules.
              </span>
            </div>

            {/* Editable Field 3 (Faculty only): Academic Designation */}
            {isFaculty && (
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="edit-profile-designation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Academic Designation</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary, #2563EB)', fontWeight: 600 }}>Editable</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="edit-profile-designation"
                    className="input-field"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    disabled={isSaving}
                    style={{ paddingLeft: '34px', fontSize: '13.5px', appearance: 'auto' }}
                  >
                    {FACULTY_DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                    {!FACULTY_DESIGNATIONS.includes(designation) && designation && (
                      <option value={designation}>{designation}</option>
                    )}
                  </select>
                  <Briefcase size={15} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '11px', top: '12px' }} />
                </div>
              </div>
            )}

            {/* Read-Only Academic & Institutional Identity Box */}
            <div style={{
              marginTop: '4px',
              padding: '14px 16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid var(--border-light, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted, #64748B)' }}>
                  <Lock size={13} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Institutional Records (Read-Only)
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', background: '#E2E8F0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  Admin Governed
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '11px', display: 'block' }}>
                    {isStudent ? 'Roll Number' : 'Employee ID'}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary, #1E293B)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {currentUser.rollNumber || currentUser.employeeId || currentUser.userId || '—'}
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '11px', display: 'block' }}>Department</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary, #1E293B)' }}>
                    {currentUser.department || 'Computer Science & Engineering'}
                  </span>
                </div>

                {isStudent && (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '11px', display: 'block' }}>Program & Cohort</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary, #1E293B)' }}>
                        {currentUser.program || 'B.Tech'} • {currentUser.year || 'II Year'} • {currentUser.section || 'Sec A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '11px', display: 'block' }}>Academic Cycle</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary, #1E293B)' }}>
                        {currentUser.regulation || 'AR23'} • {currentUser.academicYear || '2025-2026'}
                      </span>
                    </div>
                  </>
                )}

                {isFaculty && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '11px', display: 'block' }}>Assigned Courses</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary, #1E293B)' }}>
                      {Array.isArray(currentUser.subjects) ? currentUser.subjects.join(', ') : 'Machine Learning, Artificial Intelligence, Deep Learning'}
                    </span>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', margin: '4px 0 0 0', lineHeight: 1.35 }}>
                Academic cohorts, roll numbers, and course assignments are strictly managed by Academic IT Cell and Faculty Allocation governance.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'var(--bg-subtle, #F8FAFC)'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              id="save-profile-changes-btn"
              onClick={handleSubmit}
              disabled={isSaving}
              className="btn btn-primary"
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSaving ? (
                <>
                  <RotateCw size={14} className="spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
