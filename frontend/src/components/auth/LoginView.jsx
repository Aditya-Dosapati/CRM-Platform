import React, { useState, useEffect } from 'react';
import GmritLogo from '../common/GmritLogo';
import {
  Lock, Mail, ShieldAlert, LogIn, KeyRound, AlertCircle, CheckCircle2,
  ShieldCheck, ArrowRight, Eye, EyeOff, UserPlus, UserCheck, Building2,
  GraduationCap, Briefcase, Sparkles, Code2, BookOpen, Layers, Check,
  ChevronRight, Shield, Award, Loader2
} from 'lucide-react';
import authService from '../../services/authService';
import academicDataService from '../../services/academicDataService';
import useEscapeKey from '../../hooks/useEscapeKey';

const REGISTRATION_DEPARTMENT_FALLBACKS = [
  { id: 'CSE', code: 'CSE', name: 'Computer Science and Engineering' },
  { id: 'AIDS', code: 'AIDS', name: 'CSE - Artificial Intelligence and Data Science' },
  { id: 'AIML', code: 'AIML', name: 'CSE - Artificial Intelligence and Machine Learning' }
];

export const MASTER_BRANCH_OPTIONS = [
  { branch: 'CSE', displayName: 'CSE', name: 'Computer Science and Engineering', dbId: 'b9cce72e-288c-4091-88a7-fcb31a08863f' },
  { branch: 'AIML', displayName: 'CSE-AIML', name: 'CSE - Artificial Intelligence and Machine Learning', dbId: '835f1428-d1ec-47b9-87e0-d281feba4234' },
  { branch: 'AIDS', displayName: 'CSE-AIDS', name: 'CSE - Artificial Intelligence and Data Science', dbId: 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c' }
];

const regLabelStyle = {
  display: 'block',
  fontSize: '11.5px',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '4px'
};

const regInputStyle = {
  width: '100%',
  padding: '8.5px 11px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '12.5px',
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease'
};

const handleInputFocus = (e, role = 'student') => {
  const accentColor = role === 'faculty' ? '#059669' : '#EA580C';
  const shadowColor = role === 'faculty' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(234, 88, 12, 0.15)';
  e.target.style.borderColor = accentColor;
  e.target.style.boxShadow = `0 0 0 3px ${shadowColor}`;
};

const handleInputBlur = (e) => {
  e.target.style.borderColor = '#CBD5E1';
  e.target.style.boxShadow = 'none';
};

const DEMO_ACCOUNTS = [
  {
    role: 'student',
    label: 'Student',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@gmrit.edu.in',
    pass: 'Student@123',
    badgeColor: 'var(--pastel-blue-bg)',
    textColor: 'var(--pastel-blue-text)',
    borderColor: 'var(--pastel-blue-border)',
    icon: GraduationCap
  },
  {
    role: 'faculty',
    label: 'Faculty',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@gmrit.edu.in',
    pass: 'Faculty@123',
    badgeColor: 'var(--pastel-green-bg)',
    textColor: 'var(--pastel-green-text)',
    borderColor: 'var(--pastel-green-border)',
    icon: Award
  },
  {
    role: 'admin',
    label: 'Admin',
    name: 'Administrator',
    email: 'admin@gmrit.edu.in',
    pass: 'Admin@123',
    badgeColor: 'var(--pastel-purple-bg)',
    textColor: 'var(--pastel-purple-text)',
    borderColor: 'var(--pastel-purple-border)',
    icon: Shield
  }
];

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
  const [regDepartment, setRegDepartment] = useState('CSE');
  const [regBranch, setRegBranch] = useState('CSE');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regProgram, setRegProgram] = useState('B.Tech');
  const [regYear, setRegYear] = useState('1');
  const [regSemester, setRegSemester] = useState('1');
  const [regSection, setRegSection] = useState('A');
  const [regDesignation, setRegDesignation] = useState('Assistant Professor');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Load departments from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchDepts = async () => {
      setLoadingDepartments(true);
      try {
        const res = await academicDataService.getDepartments();
        if (isMounted) {
          const availableDepartments = res.data?.length > 0
            ? res.data
            : REGISTRATION_DEPARTMENT_FALLBACKS;
          setDepartments(availableDepartments);
          setRegDepartment(current => current || availableDepartments[0].id);
        }
      } catch (e) {
        console.warn('Could not fetch departments from database:', e);
        if (isMounted) {
          setDepartments(REGISTRATION_DEPARTMENT_FALLBACKS);
          setRegDepartment(current => current || REGISTRATION_DEPARTMENT_FALLBACKS[0].id);
        }
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

  // Quick-fill credentials helper
  const handleQuickFill = (account) => {
    setIdentifier(account.email);
    setPassword(account.pass);
    setAuthMode('signin');
    setError('');
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#CBD5E1' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 4) return { score: 2, label: 'Good', color: '#F59E0B' };
    return { score: 3, label: 'Strong', color: '#10B981' };
  };

  const pwdStrength = getPasswordStrength(regPassword);

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
      setError("Passwords do not match. Please verify both password entries.");
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (regRole === 'student') {
      if (!regRollNumber || regRollNumber.trim().length < 4) {
        setError("Please enter a valid Roll Number / JNTU ID.");
        return;
      }
    } else {
      if (!regEmployeeId || regEmployeeId.trim().length < 2) {
        setError("Please enter a valid Faculty Employee ID.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const registered = await authService.registerUser({
        role: regRole,
        name: regName,
        email: regEmail,
        department: regDepartment,
        branch: regRole === 'student' ? regBranch : undefined,
        rollNumber: regRole === 'student' ? regRollNumber : undefined,
        employeeId: regRole === 'faculty' ? regEmployeeId : undefined,
        program: regRole === 'student' ? regProgram : undefined,
        year: regRole === 'student' ? Number(regYear) : undefined,
        semester: regRole === 'student' ? Number(regSemester) : undefined,
        section: regRole === 'student' ? regSection : undefined,
        designation: regRole === 'faculty' ? regDesignation : undefined,
        password: regPassword
      });

      setIsLoading(false);
      setSuccessMessage("Registration submitted successfully. Your account is pending administrator verification.");

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
      backgroundColor: '#FAF8F5',
      backgroundImage: 'radial-gradient(ellipse 900px 500px at 15% 15%, rgba(234, 88, 12, 0.08) 0%, transparent 70%), radial-gradient(ellipse 700px 500px at 85% 85%, rgba(194, 65, 12, 0.06) 0%, transparent 65%), radial-gradient(circle 600px at 50% 50%, rgba(241, 245, 249, 0.6) 0%, transparent 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      color: '#0F172A'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>

        {/* LEFT COLUMN: HERO SHOWCASE & PLATFORM HIGHLIGHTS */}
        <div style={{ padding: '8px 12px' }}>
          {/* Institution Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: '#FFF7ED',
            border: '1px solid #FED7AA',
            marginBottom: '22px',
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              boxShadow: '0 0 8px rgba(5, 150, 105, 0.4)',
              display: 'inline-block'
            }} />
            <Sparkles size={13} color="#EA580C" />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#C2410C', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Deemed to be University
            </span>
          </div>

          <h1 style={{
            fontSize: '36px',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#0F172A',
            letterSpacing: '-0.9px',
            marginBottom: '16px'
          }}>
            GMRIT Academic Hub
            <span style={{
              display: 'block',
              background: 'linear-gradient(90deg, #EA580C 0%, #C2410C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '28px',
              fontWeight: 800,
              marginTop: '6px',
              letterSpacing: '-0.5px'
            }}>
              AI-Powered Academic Operating System
            </span>
          </h1>

          <p style={{
            fontSize: '14.5px',
            color: '#64748B',
            lineHeight: 1.65,
            marginBottom: '28px',
            maxWidth: '500px'
          }}>
            A unified institutional intelligence platform uniting curriculum RAG intelligence, sandboxed coding assessments, and role-based learning for CSE & Allied branches.
          </p>

          {/* 3 Interactive Feature Tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EA580C',
                flexShrink: 0
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  AI Academic Copilot with RAG
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                  Grounded strictly in official GMRIT AR23 syllabus books with page citations and vector search.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                flexShrink: 0
              }}>
                <Code2 size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Sandboxed Coding Practice Engine
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                  Live JavaScript execution, algorithmic testcase evaluation, and cohort performance ranking.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FAF5FF',
                border: '1px solid #E9D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C3AED',
                flexShrink: 0
              }}>
                <BookOpen size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Curriculum & PYQ Knowledge Base
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                  Comprehensive repository of autonomous examination question papers, unit handouts, and regulations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick-Fill Demo Credentials Selector */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: '#64748B',
              marginBottom: '10px'
            }}>
              {/* Instant One-Click Demo Access: */}
            </div>
            {/* <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = identifier === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? '#FFF7ED' : '#FFFFFF',
                      border: `1.5px solid ${isSelected ? '#EA580C' : '#E2E8F0'}`,
                      color: isSelected ? '#C2410C' : '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 12px rgba(234, 88, 12, 0.18)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    <Icon size={14} color={isSelected ? '#EA580C' : '#64748B'} />
                    <span>{acc.label}: {acc.name.split(' ')[0]}</span>
                    {isSelected && <Check size={12} color="#EA580C" />}
                  </button>
                );
              })}
            </div> */}
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE AUTHENTICATION CARD */}
        <div
          className="auth-card-wrapper"
          style={{
            maxWidth: authMode === 'register' ? '680px' : '480px',
            width: '100%',
            margin: '0 auto',
            transition: authMode === 'register'
              ? 'max-width 520ms cubic-bezier(0.22, 1, 0.36, 1)'
              : 'max-width 360ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'max-width'
          }}
        >
          <div
            className="auth-card-surface"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: authMode === 'register' ? '28px 32px' : '36px 40px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
              color: '#0F172A',
              position: 'relative',
              transition: authMode === 'register'
                ? 'padding 520ms cubic-bezier(0.22, 1, 0.36, 1)'
                : 'padding 360ms cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'padding'
            }}
          >

            {/* Header with Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <GmritLogo size="medium" />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                color: '#C2410C',
                fontSize: '11px',
                fontWeight: 700
              }}>
                <ShieldCheck size={13} />
                <span>Verified Portal</span>
              </div>
            </div>

            {/* Segmented Mode Switcher with Fluid Sliding Active Pill */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              backgroundColor: '#F1F5F9',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #E2E8F0',
              position: 'relative',
              userSelect: 'none'
            }}>
              {/* Sliding active pill indicator */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '4px',
                  bottom: '4px',
                  left: '4px',
                  width: 'calc(50% - 4px)',
                  borderRadius: '9px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
                  transform: authMode === 'signin' ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />
              <button
                type="button"
                id="tab-signin"
                onClick={() => { setAuthMode('signin'); setError(''); setSuccessMessage(''); }}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '9px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: authMode === 'signin' ? '#0F172A' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-register"
                onClick={() => { setAuthMode('register'); setError(''); setSuccessMessage(''); }}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '9px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: authMode === 'register' ? '#0F172A' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none'
                }}
              >
                Register
              </button>
            </div>

            {/* Error & Success Notification Banners */}
            {error && (
              <div className="animate-notice-down" style={{
                padding: '11px 14px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '18px',
                lineHeight: 1.4
              }}>
                <AlertCircle size={16} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="animate-notice-down" style={{
                padding: '11px 14px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '18px',
                lineHeight: 1.4
              }}>
                <CheckCircle2 size={16} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ================= MODE 1: SIGN IN ================= */}
            {authMode === 'signin' && (
              <div key="signin-form" className="signin-form-enter">
                <form onSubmit={handleLoginSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Institutional Email / Identifier
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="email"
                        required
                        placeholder="e.g. 23341a4231@gmrit.edu.in"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 38px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13.5px',
                          color: '#0F172A',
                          outline: 'none',
                          transition: 'border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onFocus={(e) => handleInputFocus(e, 'student')}
                        onBlur={handleInputBlur}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#EA580C',
                          cursor: 'pointer',
                          transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#C2410C'; e.currentTarget.style.textDecoration = 'underline'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#EA580C'; e.currentTarget.style.textDecoration = 'none'; }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 38px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13.5px',
                          color: '#0F172A',
                          outline: 'none',
                          transition: 'border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onFocus={(e) => handleInputFocus(e, 'student')}
                        onBlur={handleInputBlur}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          padding: '3px',
                          borderRadius: '4px',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), color 0.18s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                          e.currentTarget.style.color = '#EA580C';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          e.currentTarget.style.color = '#94A3B8';
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.92)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      background: 'linear-gradient(180deg, #EA580C 0%, #C2410C 100%)',
                      color: '#FFFFFF',
                      border: '1px solid #C2410C',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '9px',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
                      transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease',
                      opacity: isLoading ? 0.78 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #C2410C 0%, #9A3412 100%)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(234, 88, 12, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #EA580C 0%, #C2410C 100%)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(234, 88, 12, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.22)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                    onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.985) translateY(0)'; }}
                    onMouseUp={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={16} />
                        <span>Sign In to Portal</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ================= MODE 2: REGISTRATION ================= */}
            {authMode === 'register' && (
              <div key="register-form" className="reg-form-container">
                <form onSubmit={handleRegisterSubmit}>
                  {/* Role Selector Pill */}
                  <div className="reg-stagger-1" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Registering As:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setRegRole('student')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '7px',
                          padding: '9px 12px',
                          borderRadius: '9px',
                          border: `1.5px solid ${regRole === 'student' ? '#EA580C' : '#E2E8F0'}`,
                          backgroundColor: regRole === 'student' ? '#FFF7ED' : '#FFFFFF',
                          color: regRole === 'student' ? '#C2410C' : '#64748B',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: regRole === 'student' ? '0 2px 8px rgba(234, 88, 12, 0.15)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => {
                          if (regRole !== 'student') {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (regRole !== 'student') {
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = regRole === 'student' ? 'none' : 'translateY(-1px)'}
                      >
                        <GraduationCap
                          size={15}
                          style={{
                            transform: regRole === 'student' ? 'scale(1.14)' : 'scale(1)',
                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        />
                        <span>Student</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('faculty')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '7px',
                          padding: '9px 12px',
                          borderRadius: '9px',
                          border: `1.5px solid ${regRole === 'faculty' ? '#059669' : '#E2E8F0'}`,
                          backgroundColor: regRole === 'faculty' ? '#ECFDF5' : '#FFFFFF',
                          color: regRole === 'faculty' ? '#047857' : '#64748B',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: regRole === 'faculty' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => {
                          if (regRole !== 'faculty') {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (regRole !== 'faculty') {
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = regRole === 'faculty' ? 'none' : 'translateY(-1px)'}
                      >
                        <Award
                          size={15}
                          style={{
                            transform: regRole === 'faculty' ? 'scale(1.14)' : 'scale(1)',
                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        />
                        <span>Faculty</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 1: Full Name & Institutional GMRIT Email */}
                  <div className="reg-grid-2col reg-stagger-2">
                    <div>
                      <label style={regLabelStyle}>
                        Full Name <span style={{ color: regRole === 'student' ? '#EA580C' : '#059669' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Kumar"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        style={regInputStyle}
                        onFocus={(e) => handleInputFocus(e, regRole)}
                        onBlur={handleInputBlur}
                      />
                    </div>
                    <div>
                      <label style={regLabelStyle}>
                        Institutional GMRIT Email <span style={{ color: regRole === 'student' ? '#EA580C' : '#059669' }}>*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="name@gmrit.edu.in"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        style={regInputStyle}
                        onFocus={(e) => handleInputFocus(e, regRole)}
                        onBlur={handleInputBlur}
                      />
                    </div>
                  </div>

                  {/* Conditional Fields based on Role */}
                  <div key={regRole} className="reg-role-container">
                    {regRole === 'student' ? (
                      <>
                        {/* Student Row 2: Department & Branch / Specialization */}
                        <div className="reg-grid-2col reg-stagger-3">
                          <div>
                            <label style={regLabelStyle}>
                              Department <span style={{ color: '#EA580C' }}>*</span>
                            </label>
                            <select
                              value={regDepartment}
                              onChange={(e) => setRegDepartment(e.target.value)}
                              style={regInputStyle}
                              onFocus={(e) => handleInputFocus(e, 'student')}
                              onBlur={handleInputBlur}
                            >
                              <option value="CSE">Computer Science and Engineering (CSE)</option>
                              {departments
                                .filter(d => d.code && d.code !== 'CSE' && !['AIML', 'AIDS', 'CSE-AIML', 'CSE-AIDS'].includes(d.code))
                                .map(d => (
                                  <option key={d.id} value={d.id}>{d.name || d.code}</option>
                                ))
                              }
                            </select>
                          </div>
                          <div>
                            <label style={regLabelStyle}>
                              Branch / Specialization <span style={{ color: '#EA580C' }}>*</span>
                            </label>
                            <select
                              value={regBranch}
                              onChange={(e) => setRegBranch(e.target.value)}
                              style={regInputStyle}
                              onFocus={(e) => handleInputFocus(e, 'student')}
                              onBlur={handleInputBlur}
                            >
                              {MASTER_BRANCH_OPTIONS.map(b => (
                                <option key={b.branch} value={b.branch}>
                                  {b.displayName} — {b.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Student Row 3: Roll Number / JNTU ID & Academic Year */}
                        <div className="reg-grid-2col reg-stagger-4">
                          <div>
                            <label style={regLabelStyle}>
                              Roll Number / JNTU ID <span style={{ color: '#EA580C' }}>*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 23341A4206"
                              value={regRollNumber}
                              onChange={(e) => setRegRollNumber(e.target.value.toUpperCase())}
                              style={{ ...regInputStyle, textTransform: 'uppercase' }}
                              onFocus={(e) => handleInputFocus(e, 'student')}
                              onBlur={handleInputBlur}
                            />
                          </div>
                          <div>
                            <label style={regLabelStyle}>
                              Current Academic Year of Study <span style={{ color: '#EA580C' }}>*</span>
                            </label>
                            <select
                              value={regYear}
                              onChange={(e) => {
                                const newYear = e.target.value;
                                setRegYear(newYear);
                                const n = Number(newYear) || 1;
                                setRegSemester(String(n * 2 - 1));
                              }}
                              style={regInputStyle}
                              onFocus={(e) => handleInputFocus(e, 'student')}
                              onBlur={handleInputBlur}
                            >
                              <option value="1">I Year (First Year)</option>
                              <option value="2">II Year (Second Year)</option>
                              <option value="3">III Year (Third Year)</option>
                              <option value="4">IV Year (Final Year)</option>
                            </select>
                          </div>
                        </div>

                        {/* Student Row 4: Current Semester & Section */}
                        <div className="reg-grid-2col reg-stagger-5">
                          <div>
                            <label style={regLabelStyle}>
                              Current Semester <span style={{ color: '#EA580C' }}>*</span>
                            </label>
                            <select
                              value={regSemester}
                              onChange={(e) => setRegSemester(e.target.value)}
                              style={regInputStyle}
                              onFocus={(e) => handleInputFocus(e, 'student')}
                              onBlur={handleInputBlur}
                            >
                              <option value="1">Semester 1 (I-1)</option>
                              <option value="2">Semester 2 (I-2)</option>
                              <option value="3">Semester 3 (II-1)</option>
                              <option value="4">Semester 4 (II-2)</option>
                              <option value="5">Semester 5 (III-1)</option>
                              <option value="6">Semester 6 (III-2)</option>
                              <option value="7">Semester 7 (IV-1)</option>
                              <option value="8">Semester 8 (IV-2)</option>
                            </select>
                          </div>
                          <div>
                            <label style={regLabelStyle}>
                              Section <span style={{ color: '#EA580C' }}>*</span>
                            </label>
                            <select
                              value={regSection}
                              onChange={(e) => setRegSection(e.target.value)}
                              style={regInputStyle}
                              onFocus={(e) => handleInputFocus(e, 'student')}
                              onBlur={handleInputBlur}
                            >
                              <option value="A">Section A</option>
                              <option value="B">Section B</option>
                              <option value="C">Section C</option>
                              <option value="D">Section D</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Faculty Row 2: Department & Employee ID */}
                        <div className="reg-grid-2col reg-stagger-3">
                          <div>
                            <label style={regLabelStyle}>
                              Department <span style={{ color: '#059669' }}>*</span>
                            </label>
                            <select
                              value={regDepartment}
                              onChange={(e) => setRegDepartment(e.target.value)}
                              style={regInputStyle}
                              onFocus={(e) => handleInputFocus(e, 'faculty')}
                              onBlur={handleInputBlur}
                            >
                              <option value="CSE">Computer Science and Engineering (CSE)</option>
                              {departments
                                .filter(d => d.code && d.code !== 'CSE')
                                .map(d => (
                                  <option key={d.id} value={d.id}>{d.name || d.code}</option>
                                ))
                              }
                            </select>
                          </div>
                          <div>
                            <label style={regLabelStyle}>
                              Employee ID <span style={{ color: '#059669' }}>*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. GMR-FAC-104"
                              value={regEmployeeId}
                              onChange={(e) => setRegEmployeeId(e.target.value.toUpperCase())}
                              style={{ ...regInputStyle, textTransform: 'uppercase' }}
                              onFocus={(e) => handleInputFocus(e, 'faculty')}
                              onBlur={handleInputBlur}
                            />
                          </div>
                        </div>

                        {/* Faculty Row 3: Designation & Institutional Unit */}
                        <div className="reg-grid-2col reg-stagger-4">
                          <div>
                            <label style={regLabelStyle}>
                              Designation <span style={{ color: '#059669' }}>*</span>
                            </label>
                            <select
                              value={regDesignation}
                              onChange={(e) => setRegDesignation(e.target.value)}
                              style={regInputStyle}
                              onFocus={(e) => handleInputFocus(e, 'faculty')}
                              onBlur={handleInputBlur}
                            >
                              <option value="Assistant Professor">Assistant Professor</option>
                              <option value="Associate Professor">Associate Professor</option>
                              <option value="Professor">Professor</option>
                              <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                            </select>
                          </div>
                          <div>
                            <label style={regLabelStyle}>
                              Academic Assignment Scope
                            </label>
                            <input
                              type="text"
                              disabled
                              value="Teaching & Mentorship"
                              style={{
                                ...regInputStyle,
                                backgroundColor: '#F8FAFC',
                                color: '#64748B',
                                cursor: 'not-allowed'
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="reg-grid-2col reg-stagger-6" style={{ marginBottom: '10px' }}>
                    <div>
                      <label style={regLabelStyle}>
                        Create Password <span style={{ color: regRole === 'student' ? '#EA580C' : '#059669' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Min 6 characters"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          style={{ ...regInputStyle, paddingRight: '36px' }}
                          onFocus={(e) => handleInputFocus(e, regRole)}
                          onBlur={handleInputBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            borderRadius: '4px',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), color 0.16s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                            e.currentTarget.style.color = regRole === 'student' ? '#EA580C' : '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                            e.currentTarget.style.color = '#94A3B8';
                          }}
                          aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                        >
                          {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={regLabelStyle}>
                        Confirm Password <span style={{ color: regRole === 'student' ? '#EA580C' : '#059669' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-enter password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          style={{ ...regInputStyle, paddingRight: '36px' }}
                          onFocus={(e) => handleInputFocus(e, regRole)}
                          onBlur={handleInputBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            borderRadius: '4px',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), color 0.16s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                            e.currentTarget.style.color = regRole === 'student' ? '#EA580C' : '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                            e.currentTarget.style.color = '#94A3B8';
                          }}
                          aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showRegConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {regPassword && (
                    <div className="animate-notice-down" style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Password Strength:</span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: pwdStrength.color,
                          transition: 'color 0.25s ease'
                        }}>
                          {pwdStrength.label}
                        </span>
                      </div>
                      <div style={{ height: '4.5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(pwdStrength.score / 3) * 100}%`,
                          backgroundColor: pwdStrength.color,
                          boxShadow: pwdStrength.score > 0 ? `0 0 6px ${pwdStrength.color}88` : 'none',
                          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, box-shadow 0.25s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Status Notice */}
                  <div className="reg-stagger-7" style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    backgroundColor: regRole === 'student' ? '#FFF7ED' : '#ECFDF5',
                    border: `1px solid ${regRole === 'student' ? '#FED7AA' : '#A7F3D0'}`,
                    color: regRole === 'student' ? '#9A3412' : '#065F46',
                    fontSize: '11px',
                    lineHeight: 1.4,
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease'
                  }}>
                    <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                    <span>
                      Newly registered accounts are placed in <strong>Pending Approval</strong> state until verified by the Academic IT Cell.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="reg-stagger-8"
                    style={{
                      width: '100%',
                      padding: '11.5px',
                      borderRadius: '10px',
                      backgroundColor: regRole === 'student' ? '#EA580C' : '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: regRole === 'student'
                        ? '0 4px 14px rgba(234, 88, 12, 0.3)'
                        : '0 4px 14px rgba(5, 150, 105, 0.3)',
                      transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease',
                      opacity: isLoading ? 0.78 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = regRole === 'student' ? '#C2410C' : '#047857';
                        e.currentTarget.style.boxShadow = regRole === 'student'
                          ? '0 6px 18px rgba(234, 88, 12, 0.45)'
                          : '0 6px 18px rgba(5, 150, 105, 0.45)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = regRole === 'student' ? '#EA580C' : '#059669';
                        e.currentTarget.style.boxShadow = regRole === 'student'
                          ? '0 4px 14px rgba(234, 88, 12, 0.3)'
                          : '0 4px 14px rgba(5, 150, 105, 0.3)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                    onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.985) translateY(0)'; }}
                    onMouseUp={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting Registration...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={15} />
                        <span>Submit for Administrator Approval</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Footer Trust Guarantee */}
            <div style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center',
              fontSize: '11.5px',
              color: '#94A3B8'
            }}>
              Protected by Supabase Auth with PostgreSQL Row Level Security (RLS)
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={18} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Reset Institutional Access
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '18px' }}>
              For institutional credential reset or account unlock, please reach out to the GMRIT Systems Administrator or your department HOD office with your official Roll Number or Employee ID.
            </p>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
              color: '#334155',
              marginBottom: '20px'
            }}>
              <strong>Admin Helpdesk:</strong> admin@gmrit.edu.in • Block 4 (Central IT Lab)
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="btn btn-primary btn-sm"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
