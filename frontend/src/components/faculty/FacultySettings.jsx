import React, { useState, useEffect } from 'react';
import { 
  User, Bell, KeyRound, CheckCircle2, AlertCircle, 
  Building2, Briefcase, Mail, BookOpen, Shield, Edit2 
} from 'lucide-react';
import authService from '../../services/authService';
import EditProfileModal from '../profile/EditProfileModal';

export default function FacultySettings() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser() || {
    name: "Dr. Priya Sharma",
    userId: "FAC001",
    employeeId: "GMR-CSE-1042",
    email: "faculty@gmrit.edu.in",
    department: "Computer Science & Engineering",
    designation: "Associate Professor & Lead - AI Specialization",
    subjects: ["Machine Learning", "Artificial Intelligence", "Deep Learning"],
    role: "faculty"
  });

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const [notifications, setNotifications] = useState({
    submissionAlerts: true,
    atRiskThresholdAlerts: true,
    examSchedulingNotices: true,
    departmentAnnouncements: true
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Sync profile when global events or auth changes fire
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e?.detail?.user) {
        setCurrentUser(e.detail.user);
      } else {
        const fresh = authService.getCurrentUser();
        if (fresh) setCurrentUser(fresh);
      }
    };

    window.addEventListener('gmrit_user_profile_updated', handleProfileUpdate);
    const unsub = authService.onAuthStateChange((event, user) => {
      if (user) setCurrentUser(user);
    });

    return () => {
      window.removeEventListener('gmrit_user_profile_updated', handleProfileUpdate);
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    try {
      authService.completeFirstLogin(currentUser.userId, currentPassword, newPassword);
      setPasswordFeedback({ type: 'success', message: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Faculty Account & System Preferences
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Manage your verified faculty profile, evaluation preferences, and security credentials
        </p>
      </div>

      {profileFeedback && (
        <div style={{
          padding: '11px 16px',
          borderRadius: 'var(--radius-md, 8px)',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          color: '#166534',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <CheckCircle2 size={16} color="#166534" />
          <span style={{ fontWeight: 600 }}>{profileFeedback.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: Profile & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Faculty Profile Card */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--pastel-green-bg)',
                  color: 'var(--pastel-green-text)',
                  fontWeight: 800,
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--pastel-green-border)'
                }}>
                  {currentUser.avatar || (currentUser.name || 'PS').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </h3>
                  <span className="badge badge-green" style={{ marginTop: '2px' }}>
                    {currentUser.designation || 'Associate Professor'}
                  </span>
                </div>
              </div>

              {/* Edit Profile Button */}
              <button
                type="button"
                id="faculty-edit-profile-btn"
                onClick={() => setShowEditProfileModal(true)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  padding: '6px 12px',
                  fontWeight: 600
                }}
              >
                <Edit2 size={13} />
                <span>Edit Profile</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '14px',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: '12.5px'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Employee ID</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{currentUser.employeeId || currentUser.userId}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Institutional Email</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{currentUser.email}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: 'var(--text-muted)' }}>Department</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.department}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: 'var(--text-muted)' }}>Assigned Courses</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {Array.isArray(currentUser.subjects) ? currentUser.subjects.join(', ') : 'Machine Learning, Artificial Intelligence, Deep Learning'}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <KeyRound size={18} color="var(--primary-blue)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Security & Password
              </h3>
            </div>

            {passwordFeedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: passwordFeedback.type === 'success' ? '#F0FDF4' : '#FFF1F2',
                border: `1px solid ${passwordFeedback.type === 'success' ? '#BBF7D0' : '#FECDD3'}`,
                color: passwordFeedback.type === 'success' ? '#166534' : '#E11D48',
                fontSize: '12.5px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {passwordFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate}>
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Notification Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bell size={18} color="var(--primary-blue)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Faculty Notifications
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { id: 'submissionAlerts', label: 'Assessment & Coding Submissions', desc: 'Alerts when a batch of students completes a coding test or assignment' },
                { id: 'atRiskThresholdAlerts', label: 'At-Risk Early Warning Alerts', desc: 'Automated notification when any student falls below 75% attendance or 50% score' },
                { id: 'examSchedulingNotices', label: 'Mid Exam Scheduling Confirmations', desc: 'Confirmations when assessment slots are approved by the IT Cell' },
                { id: 'departmentAnnouncements', label: 'Departmental Notices', desc: 'Direct circulars from the Head of Department and Dean Academics' }
              ].map(item => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={notifications[item.id]}
                    onChange={(e) => setNotifications({ ...notifications, [item.id]: e.target.checked })}
                    style={{ marginTop: '3px', accentColor: 'var(--primary-blue)' }}
                  />
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.label}</strong>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--pastel-green-bg)', borderColor: 'var(--pastel-green-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={16} color="var(--pastel-green-text)" />
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--pastel-green-text)', margin: 0 }}>
                Faculty Authorization Scope
              </h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Faculty accounts possess administrative rights to publish assessments, upload curriculum resources, and monitor cohort progression for assigned sections.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        currentUser={currentUser}
        activeRole="faculty"
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          setProfileFeedback({ type: 'success', message: 'Your faculty profile has been updated successfully.' });
          setTimeout(() => setProfileFeedback(null), 4000);
        }}
      />
    </div>
  );
}

