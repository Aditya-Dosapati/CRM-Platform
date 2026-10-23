import React, { useState, useEffect } from 'react';
import GmritLogo from '../common/GmritLogo';
import { 
  Lock, Mail, ShieldAlert, LogIn, KeyRound, AlertCircle, CheckCircle2, 
  ShieldCheck, ArrowRight, Eye, EyeOff, UserPlus, UserCheck, Building2, 
  GraduationCap, Briefcase, Sparkles, Code2, BookOpen, Layers, Check,
  ChevronRight, Shield, Award
} from 'lucide-react';
import authService from '../../services/authService';
import academicDataService from '../../services/academicDataService';
import useEscapeKey from '../../hooks/useEscapeKey';

const REGISTRATION_DEPARTMENT_FALLBACKS = [
  { id: 'CSE', code: 'CSE', name: 'Computer Science and Engineering' },
  { id: 'AIDS', code: 'AIDS', name: 'CSE - Artificial Intelligence and Data Science' },
  { id: 'AIML', code: 'AIML', name: 'CSE - Artificial Intelligence and Machine Learning' }
];

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
      backgroundColor: '#0F1219',
      backgroundImage: 'radial-gradient(ellipse 900px 500px at 15% 15%, rgba(234, 88, 12, 0.18) 0%, transparent 70%), radial-gradient(ellipse 700px 500px at 85% 85%, rgba(194, 65, 12, 0.15) 0%, transparent 65%), radial-gradient(circle 500px at 50% 50%, rgba(20, 23, 31, 0.7) 0%, transparent 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      color: '#FFFFFF'
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
            backgroundColor: 'rgba(234, 88, 12, 0.16)',
            border: '1px solid rgba(251, 146, 60, 0.35)',
            marginBottom: '22px',
            boxShadow: '0 0 20px -2px rgba(234, 88, 12, 0.2)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#34D399',
              boxShadow: '0 0 8px #34D399',
              display: 'inline-block'
            }} />
            <Sparkles size={13} color="#FB923C" />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#FED7AA', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Autonomous Institution • NAAC A+ Accredited
            </span>
          </div>

          <h1 style={{
            fontSize: '36px',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#FFFFFF',
            letterSpacing: '-0.9px',
            marginBottom: '16px'
          }}>
            GMRIT Academic Hub
            <span style={{
              display: 'block',
              background: 'linear-gradient(90deg, #FB923C 0%, #EA580C 60%, #F59E0B 100%)',
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
            color: '#94A3B8',
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
              backgroundColor: 'rgba(23, 32, 54, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 88, 12, 0.22)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB923C',
                flexShrink: 0
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                  AI Academic Copilot with RAG
                </h4>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                  Grounded strictly in official GMRIT R20/R23 syllabus books with page citations and vector search.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 18px',
              backgroundColor: 'rgba(23, 32, 54, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399',
                flexShrink: 0
              }}>
                <Code2 size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                  Sandboxed Coding Practice Engine
                </h4>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0 0', lineHeight: 1.45 }}>
                  Live JavaScript execution, algorithmic testcase evaluation, and cohort performance ranking.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 18px',
              backgroundColor: 'rgba(23, 32, 54, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C084FC',
                flexShrink: 0
              }}>
                <BookOpen size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                  Curriculum & PYQ Knowledge Base
                </h4>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0 0', lineHeight: 1.45 }}>
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
              Instant One-Click Demo Access:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                      backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.32)' : 'rgba(23, 32, 54, 0.85)',
                      border: `1.5px solid ${isSelected ? '#EA580C' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? '#FFFFFF' : '#CBD5E1',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 14px rgba(234, 88, 12, 0.35)' : 'none',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    <Icon size={14} color={isSelected ? '#FB923C' : '#94A3B8'} />
                    <span>{acc.label}: {acc.name.split(' ')[0]}</span>
                    {isSelected && <Check size={12} color="#FB923C" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE AUTHENTICATION CARD */}
        <div>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px 40px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12), 0 10px 20px -5px rgba(0, 0, 0, 0.25)',
            color: '#0F172A',
            position: 'relative'
          }}>
            
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

            {/* Segmented Mode Switcher */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              backgroundColor: '#F1F5F9',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError(''); setSuccessMessage(''); }}
                style={{
                  padding: '9px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  backgroundColor: authMode === 'signin' ? '#FFFFFF' : 'transparent',
                  color: authMode === 'signin' ? '#0F172A' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: authMode === 'signin' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(''); setSuccessMessage(''); }}
                style={{
                  padding: '9px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  backgroundColor: authMode === 'register' ? '#FFFFFF' : 'transparent',
                  color: authMode === 'register' ? '#0F172A' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: authMode === 'register' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                Register
              </button>
            </div>

            {/* Error & Success Notification Banners */}
            {error && (
              <div style={{
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
              <div style={{
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
                      placeholder="e.g. rahul.kumar@gmrit.edu.in"
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
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#EA580C'; e.target.style.boxShadow = '0 0 0 3px rgba(234,88,12,0.12)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
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
                        cursor: 'pointer'
                      }}
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
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#EA580C'; e.target.style.boxShadow = '0 0 0 3px rgba(234,88,12,0.12)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
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
                        padding: 0,
                        color: '#94A3B8',
                        cursor: 'pointer'
                      }}
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
                    transition: 'all 0.18s ease',
                    opacity: isLoading ? 0.75 : 1
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
                >
                  <LogIn size={16} />
                  <span>{isLoading ? 'Authenticating with Supabase...' : 'Sign In to Portal'}</span>
                  {!isLoading && <ArrowRight size={15} />}
                </button>
              </form>
            )}

            {/* ================= MODE 2: REGISTRATION ================= */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit}>
                {/* Role Selector Pill */}
                <div style={{ marginBottom: '14px' }}>
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
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '8px',
                        border: `1.5px solid ${regRole === 'student' ? '#EA580C' : '#E2E8F0'}`,
                        backgroundColor: regRole === 'student' ? '#FFF7ED' : '#FFFFFF',
                        color: regRole === 'student' ? '#C2410C' : '#64748B',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <GraduationCap size={15} />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('faculty')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '8px',
                        border: `1.5px solid ${regRole === 'faculty' ? '#059669' : '#E2E8F0'}`,
                        backgroundColor: regRole === 'faculty' ? '#ECFDF5' : '#FFFFFF',
                        color: regRole === 'faculty' ? '#047857' : '#64748B',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Award size={15} />
                      <span>Faculty</span>
                    </button>
                  </div>
                </div>

                {/* Name & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Kumar"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      GMRIT Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@gmrit.edu.in"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>
                </div>

                {/* Department & Identifier */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Department
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12px',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name || d.code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      {regRole === 'student' ? 'Roll Number / JNTU ID' : 'Employee ID'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={regRole === 'student' ? 'e.g. 21341A0588' : 'e.g. GMR-FAC-104'}
                      value={regRole === 'student' ? regRollNumber : regEmployeeId}
                      onChange={(e) => regRole === 'student' ? setRegRollNumber(e.target.value) : setRegEmployeeId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Create Password
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 chars"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Confirm Password
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>
                </div>

                {/* Password Strength Meter */}
                {regPassword && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>Password Strength:</span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: pwdStrength.color }}>{pwdStrength.label}</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(pwdStrength.score / 3) * 100}%`,
                        backgroundColor: pwdStrength.color,
                        transition: 'width 0.2s ease, background-color 0.2s ease'
                      }} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '11px',
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
                    marginTop: '10px'
                  }}
                >
                  <UserPlus size={15} />
                  <span>{isLoading ? 'Submitting Registration...' : 'Submit for Administrator Approval'}</span>
                </button>
              </form>
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
