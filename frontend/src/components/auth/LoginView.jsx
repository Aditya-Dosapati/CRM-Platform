import React, { useState, useEffect } from 'react';
import GmritLogo from '../common/GmritLogo';
import { 
  Lock, Mail, ShieldAlert, LogIn, KeyRound, AlertCircle, CheckCircle2, 
  ShieldCheck, ArrowRight, Eye, EyeOff, UserPlus, UserCheck, Building2, 
  GraduationCap, Briefcase, Info 
} from 'lucide-react';
import authService from '../../services/authService';
import academicDataService from '../../services/academicDataService';
import useEscapeKey from '../../hooks/useEscapeKey';

export default function LoginView({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register'
  
  // Dynamic Departments State from Supabase
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration State
  const [regRole, setRegRole] = useState('student'); // 'student' | 'faculty'
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regProgram, setRegProgram] = useState('B.Tech');
  const [regYear, setRegYear] = useState('II Year');
  const [regSection, setRegSection] = useState('Section A');
  const [regDesignation, setRegDesignation] = useState('Assistant Professor');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Load departments from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchDepts = async () => {
      setLoadingDepartments(true);
      try {
        const res = await academicDataService.getDepartments();
        if (isMounted && res.data && res.data.length > 0) {
          setDepartments(res.data);
          if (!regDepartment) {
            setRegDepartment(res.data[0].id || res.data[0].name);
          }
        }
      } catch (e) {
        console.warn('Could not fetch departments from database:', e);
      } finally {
        if (isMounted) setLoadingDepartments(false);
      }
    };
    fetchDepts();
    return () => { isMounted = false; };
  }, []);

  // Common UI State
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEscapeKey(() => setShowForgotModal(false), showForgotModal);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const authResult = await authService.login(identifier, password);
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(authResult.user, authResult.session, authResult.isFirstLogin);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Authentication failed. Please verify your credentials.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const registered = await authService.registerUser({
        role: regRole,
        name: regName,
        email: regEmail,
        department: regDepartment,
        rollNumber: regRole === 'student' ? regRollNumber : undefined,
        employeeId: regRole === 'faculty' ? regEmployeeId : undefined,
        program: regRole === 'student' ? regProgram : undefined,
        year: regRole === 'student' ? regYear : undefined,
        section: regRole === 'student' ? regSection : undefined,
        designation: regRole === 'faculty' ? regDesignation : undefined,
        password: regPassword
      });

      setIsLoading(false);
      setSuccessMessage("Registration submitted successfully. Your account is waiting for administrator approval.");
      
      setIdentifier(registered.email);
      setPassword('');
      setAuthMode('signin');
      
      setRegName('');
      setRegEmail('');
      setRegRollNumber('');
      setRegEmployeeId('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Registration failed. Please review your details.");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-canvas)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      overflowX: 'hidden'
    }}>
      {/* Branding Top */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '28px'
      }}>
        <GmritLogo size="large" showSubtitle={false} />
        
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          color: 'var(--text-primary)',
          marginTop: '14px'
        }}>
          GMR CRM
        </h1>
        <p style={{
          fontSize: '13.5px',
          color: 'var(--text-secondary)',
          fontWeight: 500,
          marginTop: '3px'
        }}>
          Academic Management & Learning Platform
        </p>
      </div>

      {/* Main Card */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: authMode === 'register' ? '540px' : '430px',
          padding: '28px 32px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '24px',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Navigation Switcher: Sign In vs Register */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
          marginBottom: '22px'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: authMode === 'signin' ? 'var(--bg-surface)' : 'transparent',
              color: authMode === 'signin' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: authMode === 'signin' ? '0 1px 3px rgba(43,33,24,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: authMode === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: authMode === 'register' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: authMode === 'register' ? '0 1px 3px rgba(43,33,24,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={15} />
            <span>Register Account</span>
          </button>
        </div>

        {/* Success Notice */}
        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: 'rgba(198, 93, 46, 0.08)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            color: 'var(--color-primary)',
            fontSize: '12.5px',
            lineHeight: 1.45
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '11px 13px',
            backgroundColor: 'rgba(169, 74, 42, 0.08)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            color: 'var(--color-accent)',
            fontSize: '12.5px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'signin' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Institutional Sign In
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Authenticate with your verified email and password
              </p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label className="input-label">
                  <span>Institutional Email Address</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. admin.gmrit@gmrit.edu.in"
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
                      color: 'var(--color-primary)',
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
              marginTop: '18px',
              padding: '10px 12px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35, margin: 0 }}>
                Role and permissions are derived strictly from your authenticated account record in the database.
              </p>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {authMode === 'register' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Create Institutional Account
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Fill out the application below. New accounts require Admin Approval.
              </p>
            </div>

            {/* Role Select Radio Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <div
                onClick={() => setRegRole('student')}
                style={{
                  border: regRole === 'student' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: regRole === 'student' ? 'rgba(198, 93, 46, 0.08)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <GraduationCap size={18} color={regRole === 'student' ? 'var(--color-primary)' : 'var(--text-secondary)'} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>Student</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Roll Number Verification</div>
                </div>
              </div>

              <div
                onClick={() => setRegRole('faculty')}
                style={{
                  border: regRole === 'faculty' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: regRole === 'faculty' ? 'rgba(198, 93, 46, 0.08)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Briefcase size={18} color={regRole === 'faculty' ? 'var(--color-primary)' : 'var(--text-secondary)'} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>Faculty</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Employee ID Verification</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              {/* Name & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Sravan Varma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder={regRole === 'student' ? 'sravan@gmrit.edu.in' : 'sravan.fac@gmrit.edu.in'}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Academic Department</span>
                  {loadingDepartments && <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>Loading...</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="input-field"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    style={{ paddingLeft: '34px' }}
                    required
                  >
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <option key={dept.id || dept.code} value={dept.id || dept.name}>
                          {dept.name} ({dept.code})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {loadingDepartments ? 'Loading academic departments...' : 'Select Academic Department'}
                      </option>
                    )}
                  </select>
                  <Building2 size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '13px' }} />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {regRole === 'student' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '10px' }}>
                  <div className="input-group">
                    <label className="input-label">Roll Number</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 23A81A0589"
                      value={regRollNumber}
                      onChange={(e) => setRegRollNumber(e.target.value)}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Year</label>
                    <select
                      className="input-field"
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                    >
                      <option value="I Year">I Year</option>
                      <option value="II Year">II Year</option>
                      <option value="III Year">III Year</option>
                      <option value="IV Year">IV Year</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Section</label>
                    <select
                      className="input-field"
                      value={regSection}
                      onChange={(e) => setRegSection(e.target.value)}
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                      <option value="Section D">Section D</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Employee ID</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. GMR-CSE-1088"
                      value={regEmployeeId}
                      onChange={(e) => setRegEmployeeId(e.target.value)}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Designation</label>
                    <select
                      className="input-field"
                      value={regDesignation}
                      onChange={(e) => setRegDesignation(e.target.value)}
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password & Confirmation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      className="input-field"
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      style={{ paddingLeft: '32px' }}
                    />
                    <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '13px' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      className="input-field"
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      style={{ paddingLeft: '32px' }}
                    />
                    <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '13px' }} />
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div style={{
                margin: '12px 0 16px 0',
                padding: '9px 12px',
                backgroundColor: 'rgba(198, 93, 46, 0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Info size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '11.5px', color: 'var(--color-primary)', lineHeight: 1.35 }}>
                  Newly registered accounts are placed in <strong>Pending Approval</strong> state until verified by the Academic IT Cell.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Submitting Registration...</span>
                ) : (
                  <>
                    <UserCheck size={16} />
                    <span>Submit Registration</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Password Assistance
                </h3>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                For security, password resets are processed by the Academic IT Cell. Please reach out to your department administrator or contact <code style={{ color: 'var(--color-primary)' }}>it.support@gmrit.edu.in</code> with your institutional ID.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setShowForgotModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
