import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Code2,
  Cpu,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  BarChart2,
  Activity,
  Layers,
  Save,
  RefreshCw,
  Terminal,
  Zap,
  Globe,
  Plus,
  Search,
  Users,
  Clock,
  Calendar,
  Trash2,
  X,
  Check,
  BookOpen
} from 'lucide-react';
import {
  supportedLanguagesList,
  adminExecutionSettings,
  adminCodingAnalytics,
  codingAssessmentsList,
  codingProblemsList
} from '../../data/codingData.js';
import useSafeTimeout from '../../hooks/useSafeTimeout';
import useEscapeKey from '../../hooks/useEscapeKey';
import authService from '../../services/authService.js';
import codingAssessmentService from '../../services/codingAssessmentService.js';

export default function AdminCodingManagement() {
  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments' | 'sandbox' | 'analytics'
  const [languages, setLanguages] = useState(supportedLanguagesList);
  const [settings, setSettings] = useState(adminExecutionSettings);
  const [analytics, setAnalytics] = useState(adminCodingAnalytics);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [assessmentsSearch, setAssessmentsSearch] = useState('');
  const [isCreateAssessmentOpen, setIsCreateAssessmentOpen] = useState(false);

  const setSafeTimeout = useSafeTimeout();

  const [assessments, setAssessments] = useState(() => {
    return codingAssessmentService.getAssessments({ user: null });
  });

  useEffect(() => {
    const unsubscribe = codingAssessmentService.subscribe(() => {
      setAssessments(codingAssessmentService.getAssessments({ user: null }));
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const [newAssessment, setNewAssessment] = useState({
    title: '',
    department: 'Computer Science & Engineering',
    className: 'B.Tech CSE — Section A',
    durationMinutes: 90,
    startTime: 'Oct 30, 2026 • 10:00 AM',
    totalMarks: 100,
    allowedLanguages: ['Python', 'C++', 'Java', 'C'],
    selectedProblemIds: ['prob-1', 'prob-2', 'prob-3']
  });

  useEscapeKey(() => {
    if (isCreateAssessmentOpen) {
      setIsCreateAssessmentOpen(false);
    }
  }, isCreateAssessmentOpen);

  const handleToggleLanguage = useCallback((langId) => {
    setLanguages(prev =>
      prev.map(l => {
        if (l.id === langId) {
          const newStatus = l.status === 'enabled' ? 'disabled' : 'enabled';
          return { ...l, status: newStatus };
        }
        return l;
      })
    );
  }, []);

  const handleSaveSettings = useCallback((e) => {
    e.preventDefault();
    setIsSaving(true);
    setSafeTimeout(() => {
      setIsSaving(false);
      setSaveToast('Execution Sandbox Limits & Container Policies updated successfully.');
      setSafeTimeout(() => setSaveToast(null), 3500);
    }, 600);
  }, [setSafeTimeout]);

  const handleCreateAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!newAssessment.title.trim()) return;

    // Enforce backend admin check
    const currentUser = authService.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      setSaveToast('Access Denied: Only administrators can schedule institution assessments.');
      setSafeTimeout(() => setSaveToast(null), 3500);
      return;
    }

    const created = {
      id: `assess-custom-${Date.now()}`,
      title: newAssessment.title.trim(),
      faculty: 'Institution Academic Office (Admin)',
      department: newAssessment.department,
      className: newAssessment.className,
      questionsCount: newAssessment.selectedProblemIds.length,
      durationMinutes: Number(newAssessment.durationMinutes),
      startTime: newAssessment.startTime,
      endTime: 'Scheduled Examination Window',
      status: 'upcoming',
      allowedLanguages: newAssessment.allowedLanguages,
      totalMarks: Number(newAssessment.totalMarks),
      questionIds: newAssessment.selectedProblemIds,
      regulation: 'AR23'
    };

    // Persist via centralized codingAssessmentService (temporary local persistence layer)
    codingAssessmentService.saveAssessment(created);
    setAssessments(codingAssessmentService.getAssessments({ user: null }));

    setIsCreateAssessmentOpen(false);
    setSaveToast(`Assessment "${created.title}" published & dispatched to ${created.className}!`);
    setSafeTimeout(() => setSaveToast(null), 3500);
    setNewAssessment({
      title: '',
      department: 'Computer Science & Engineering',
      className: 'B.Tech CSE — Section A',
      durationMinutes: 90,
      startTime: 'Oct 30, 2026 • 10:00 AM',
      totalMarks: 100,
      allowedLanguages: ['Python', 'C++', 'Java', 'C'],
      selectedProblemIds: ['prob-1', 'prob-2', 'prob-3']
    });
  };

  const handleDeleteAssessment = (asmtId) => {
    codingAssessmentService.deleteAssessment(asmtId);
    setAssessments(codingAssessmentService.getAssessments({ user: null }));
    setSaveToast('Assessment removed successfully.');
    setSafeTimeout(() => setSaveToast(null), 3000);
  };

  const filteredAssessments = useMemo(() => {
    if (!assessmentsSearch.trim()) return assessments;
    const q = assessmentsSearch.toLowerCase();
    return assessments.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.className || '').toLowerCase().includes(q) ||
      (a.department || '').toLowerCase().includes(q)
    );
  }, [assessments, assessmentsSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}
        >
          <CheckCircle2 size={18} />
          {saveToast}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--pastel-purple-bg, #F5F3FF)',
                color: 'var(--pastel-purple-text, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--pastel-purple-border, #DDD6FE)'
              }}
            >
              <Code2 size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
              Coding Sandbox &amp; Assessment Management
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
            Schedule Cohort Coding Assessments, Configure Isolation Policies, and Oversee Compiler Runtimes (AR23 Regulation)
          </p>
        </div>

        {/* Sandbox Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '0.45rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: '700'
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span>4 / 4 Docker Sandbox Workers Active</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#FFFFFF',
          padding: '0.5rem',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          width: 'fit-content'
        }}
      >
        <button
          onClick={() => setActiveTab('assessments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeTab === 'assessments' ? '#7C3AED' : 'transparent',
            color: activeTab === 'assessments' ? '#FFFFFF' : '#64748B',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} />
          <span>Coding Assessments &amp; Cohort Delivery</span>
          <span
            style={{
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              backgroundColor: activeTab === 'assessments' ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
              color: activeTab === 'assessments' ? '#FFFFFF' : '#475569'
            }}
          >
            {assessments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeTab === 'sandbox' ? '#7C3AED' : 'transparent',
            color: activeTab === 'sandbox' ? '#FFFFFF' : '#64748B',
            transition: 'all 0.15s ease'
          }}
        >
          <Cpu size={16} />
          <span>Sandbox Policies &amp; Toolchains</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeTab === 'analytics' ? '#7C3AED' : 'transparent',
            color: activeTab === 'analytics' ? '#FFFFFF' : '#64748B',
            transition: 'all 0.15s ease'
          }}
        >
          <BarChart2 size={16} />
          <span>Execution Analytics</span>
        </button>
      </div>

      {/* ================= TAB 1: ASSESSMENTS ================= */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Row */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '440px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search assessments by title, class, or department..."
                value={assessmentsSearch}
                onChange={e => setAssessmentsSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem 0.55rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: '600' }}>
                Regulation: <strong style={{ color: '#0F172A' }}>AR23</strong>
              </span>
              <button
                onClick={() => setIsCreateAssessmentOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Plus size={16} />
                <span>Schedule Coding Assessment</span>
              </button>
            </div>
          </div>

          {/* Assessments Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredAssessments.map(asmt => {
              const isCustom = asmt.id.startsWith('assess-custom-');
              return (
                <div
                  key={asmt.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Top Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            backgroundColor: asmt.status === 'active' ? '#ECFDF5' : '#FFF7ED',
                            color: asmt.status === 'active' ? '#059669' : '#EA580C',
                            border: `1px solid ${asmt.status === 'active' ? '#A7F3D0' : '#FFEDD5'}`,
                            textTransform: 'uppercase'
                          }}
                        >
                          {asmt.status}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            backgroundColor: '#F5F3FF',
                            color: '#7C3AED',
                            border: '1px solid #DDD6FE'
                          }}
                        >
                          AR23 Regulation
                        </span>
                      </div>

                      {isCustom && (
                        <button
                          onClick={() => handleDeleteAssessment(asmt.id)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title="Delete Assessment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: '800', color: '#0F172A' }}>
                      {asmt.title}
                    </h3>

                    {/* Cohort & Department */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#475569' }}>
                        <Users size={14} color="#7C3AED" />
                        <span style={{ fontWeight: '600' }}>Target: {asmt.className || 'All Sections'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#64748B' }}>
                        <BookOpen size={14} color="#94A3B8" />
                        <span>{asmt.department || 'Engineering'}</span>
                      </div>
                    </div>

                    {/* Metadata Pills */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <Clock size={13} color="#64748B" />
                        <span><strong>{asmt.durationMinutes || 90}</strong> mins</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <CheckCircle2 size={13} color="#64748B" />
                        <span><strong>{asmt.totalMarks || 100}</strong> marks</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <Code2 size={13} color="#64748B" />
                        <span><strong>{asmt.questionsCount || asmt.questionIds?.length || 3}</strong> challenges</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <Calendar size={13} color="#64748B" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asmt.startTime?.split('•')[0] || 'Scheduled'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Languages Allowed Footer */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(asmt.allowedLanguages || ['Python', 'C++', 'Java']).map(lang => (
                        <span
                          key={lang}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px'
                          }}
                        >
                          {lang}
                        </span>
                      ))}
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '500' }}>
                      {asmt.faculty || 'Institution Admin'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SANDBOX POLICIES & TOOLCHAINS ================= */}
      {activeTab === 'sandbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Execution Settings Form */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sliders size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
                Container Isolation &amp; Execution Sandbox Policies
              </h2>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Default Time Limit
                  </label>
                  <input
                    type="text"
                    value={settings.defaultTimeLimit}
                    onChange={e => setSettings({ ...settings, defaultTimeLimit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>SIGKILL emitted if process exceeds duration</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Memory Cap per Container
                  </label>
                  <input
                    type="text"
                    value={settings.defaultMemoryLimit}
                    onChange={e => setSettings({ ...settings, defaultMemoryLimit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Cgroup memory limit enforced via Docker</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Concurrent Worker Threads
                  </label>
                  <input
                    type="number"
                    value={settings.concurrentExecutionsLimit}
                    onChange={e => setSettings({ ...settings, concurrentExecutionsLimit: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Parallel judge daemon instances</span>
                </div>
              </div>

              {/* Policy Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>Strict Network Isolation</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Disable egress sockets (no internet access inside container)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.networkAccessBlocked}
                    onChange={e => setSettings({ ...settings, networkAccessBlocked: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>Strict Seccomp System Call Filtering</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Block dangerous fork bomb, ptraces, and socket calls</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.strictSeccompPolicy}
                    onChange={e => setSettings({ ...settings, strictSeccompPolicy: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: isSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Applying Policies...' : 'Save Sandbox Configuration'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Supported Compilers & Toolchains Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>
                  Supported Compiler Toolchains
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Enable or disable compilers dynamically across the institution
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Language</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Toolchain Version</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Runtime Container</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Default Time</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Default Memory</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {languages.map(lang => {
                    const isEnabled = lang.status === 'enabled';
                    return (
                      <tr key={lang.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                              {lang.extension}
                            </span>
                            <span>{lang.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {lang.version}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>
                          {lang.runtime}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '600' }}>
                          {lang.timeLimit}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '600' }}>
                          {lang.memoryLimit}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '9999px',
                              backgroundColor: isEnabled ? '#ECFDF5' : '#F1F5F9',
                              color: isEnabled ? '#059669' : '#94A3B8',
                              border: `1px solid ${isEnabled ? '#A7F3D0' : '#CBD5E1'}`,
                              textTransform: 'uppercase'
                            }}
                          >
                            {lang.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleLanguage(lang.id)}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '6px',
                              border: `1px solid ${isEnabled ? '#FECACA' : '#FED7AA'}`,
                              backgroundColor: isEnabled ? '#FEF2F2' : '#FFF7ED',
                              color: isEnabled ? '#DC2626' : '#EA580C',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {isEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ANALYTICS ================= */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {/* Language Breakdown */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>
              Compiler Usage Breakdown (% of Total Submissions)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {analytics.languageUsage.map(item => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{item.name}</span>
                    <span style={{ fontWeight: '700', color: item.color }}>{item.percentage}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                        borderRadius: '9999px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Submissions Bar Chart */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>
                Weekly Execution Load
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Peak: Friday (2,850 runs)</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '160px',
                paddingTop: '1rem'
              }}
            >
              {analytics.weeklyActivity.map(day => {
                const maxSubmissions = 3000;
                const heightPercent = Math.round((day.submissions / maxSubmissions) * 100);

                return (
                  <div
                    key={day.day}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      flex: 1
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600' }}>
                      {day.submissions}
                    </span>
                    <div
                      style={{
                        width: '28px',
                        height: `${heightPercent}%`,
                        background: 'linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.3s ease'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#334155' }}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE CODING ASSESSMENT ================= */}
      {isCreateAssessmentOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={() => setIsCreateAssessmentOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#F5F3FF',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
                    Schedule Institution Coding Assessment
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Deploy challenge evaluation for targeted student cohort (AR23 Regulation)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateAssessmentOpen(false)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssessmentSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Assessment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEE Semester 3 Practical Coding Examination"
                  value={newAssessment.title}
                  onChange={e => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Target Department
                  </label>
                  <select
                    value={newAssessment.department}
                    onChange={e => setNewAssessment({ ...newAssessment, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Artificial Intelligence & Machine Learning">AI &amp; Machine Learning (AIML)</option>
                    <option value="Artificial Intelligence & Data Science">AI &amp; Data Science (AIDS)</option>
                    <option value="Information Technology">Information Technology (IT)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Target Class / Cohort
                  </label>
                  <select
                    value={newAssessment.className}
                    onChange={e => setNewAssessment({ ...newAssessment, className: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="B.Tech CSE — Section A">B.Tech CSE — Section A</option>
                    <option value="B.Tech CSE — Section B">B.Tech CSE — Section B</option>
                    <option value="B.Tech AIML — Section A">B.Tech AIML — Section A</option>
                    <option value="B.Tech AIDS — Section A">B.Tech AIDS — Section A</option>
                    <option value="B.Tech IT — Section A">B.Tech IT — Section A</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={newAssessment.durationMinutes}
                    onChange={e => setNewAssessment({ ...newAssessment, durationMinutes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={newAssessment.totalMarks}
                    onChange={e => setNewAssessment({ ...newAssessment, totalMarks: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Regulation
                  </label>
                  <div
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#475569'
                    }}
                  >
                    AR23 Autonomous
                  </div>
                </div>
              </div>

              {/* Allowed Languages Checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Allowed Programming Languages
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {['Python', 'C++', 'Java', 'C', 'JavaScript'].map(lang => {
                    const checked = newAssessment.allowedLanguages.includes(lang);
                    return (
                      <label
                        key={lang}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewAssessment({
                                ...newAssessment,
                                allowedLanguages: [...newAssessment.allowedLanguages, lang]
                              });
                            } else {
                              setNewAssessment({
                                ...newAssessment,
                                allowedLanguages: newAssessment.allowedLanguages.filter(l => l !== lang)
                              });
                            }
                          }}
                        />
                        {lang}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Problem Selection from Bank */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Select Problems from Repository Bank ({newAssessment.selectedProblemIds.length} Selected)
                </label>
                <div
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  {codingProblemsList.map(prob => {
                    const isSelected = newAssessment.selectedProblemIds.includes(prob.id);
                    return (
                      <div
                        key={prob.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewAssessment({
                              ...newAssessment,
                              selectedProblemIds: newAssessment.selectedProblemIds.filter(id => id !== prob.id)
                            });
                          } else {
                            setNewAssessment({
                              ...newAssessment,
                              selectedProblemIds: [...newAssessment.selectedProblemIds, prob.id]
                            });
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                          border: `1px solid ${isSelected ? '#DDD6FE' : 'transparent'}`,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0F172A' }}>
                            {prob.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: prob.difficulty === 'Easy' ? '#ECFDF5' : prob.difficulty === 'Medium' ? '#FFFBEB' : '#FEF2F2',
                            color: prob.difficulty === 'Easy' ? '#059669' : prob.difficulty === 'Medium' ? '#D97706' : '#DC2626'
                          }}
                        >
                          {prob.difficulty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateAssessmentOpen(false)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#7C3AED',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Publish &amp; Dispatch to Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
