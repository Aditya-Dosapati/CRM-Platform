import React, { useState, useCallback } from 'react';
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
  Globe
} from 'lucide-react';
import {
  supportedLanguagesList,
  adminExecutionSettings,
  adminCodingAnalytics
} from '../../data/codingData.js';
import useSafeTimeout from '../../hooks/useSafeTimeout';

export default function AdminCodingManagement() {
  const [languages, setLanguages] = useState(supportedLanguagesList);
  const [settings, setSettings] = useState(adminExecutionSettings);
  const [analytics, setAnalytics] = useState(adminCodingAnalytics);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const setSafeTimeout = useSafeTimeout();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Save Toast */}
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
              Coding Sandbox &amp; Compiler Management
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
            Configure Container Isolation, Memory &amp; CPU Limits, Compiler Toolchains, and Institution Analytics
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

      {/* Top 4 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Code2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>TOTAL PROBLEMS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
              {analytics.totalProblems}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>16 Topic Categories</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>TOTAL SUBMISSIONS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
              {analytics.totalSubmissions.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>+2,850 this week</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#F5F3FF',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>ACTIVE STUDENTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
              {analytics.totalStudentsPracticing.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: '600' }}>Across 6 Departments</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#FFF7ED',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>AVERAGE PASS RATE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
              {analytics.averageSuccessRate}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#EA580C', fontWeight: '600' }}>42 Assessments Executed</div>
          </div>
        </div>
      </div>

      {/* Sandbox Isolation & Security Limits Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <ShieldCheck size={20} color="#2563EB" />
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
            Container Resource Limits &amp; Airgap Security Configuration
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem'
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                Per-Container CPU Limit
              </label>
              <input
                type="text"
                value={settings.cpuLimit}
                onChange={e => setSettings({ ...settings, cpuLimit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>e.g. 1.0 vCPU per child sandbox</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                Max Memory Limit (RAM)
              </label>
              <input
                type="text"
                value={settings.memoryLimit}
                onChange={e => setSettings({ ...settings, memoryLimit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Hard ceiling before SIGKILL</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                Default Execution Timeout
              </label>
              <input
                type="text"
                value={settings.executionTimeout}
                onChange={e => setSettings({ ...settings, executionTimeout: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Termination trigger for infinite loops</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                Max Stdout Output Buffer
              </label>
              <input
                type="text"
                value={settings.maxOutputSize}
                onChange={e => setSettings({ ...settings, maxOutputSize: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Truncates excessive print loops</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              padding: '1rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>Network Isolation Policy:</span>
              <span style={{ color: '#059669', fontWeight: '700', backgroundColor: '#ECFDF5', padding: '0.15rem 0.6rem', borderRadius: '9999px', border: '1px solid #A7F3D0' }}>
                {settings.networkAccess}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>Filesystem Jail:</span>
              <span style={{ color: '#334155', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {settings.filesystemAccess}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--primary-blue, #2563EB)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: isSaving ? 'wait' : 'pointer'
              }}
            >
              <Save size={15} />
              {isSaving ? 'Updating Policies...' : 'Save Sandbox Policy'}
            </button>
          </div>
        </form>
      </div>

      {/* Supported Languages & Compilers Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>
              Supported Compiler &amp; Runtime Environments
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Enable or disable specific languages for students and assessments
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #F1F5F9', color: '#64748B' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Language</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Compiler Version</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Runtime Environment</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Time Limit</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Memory Limit</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((lang, idx) => {
                const isEnabled = lang.status === 'enabled';
                return (
                  <tr
                    key={lang.id}
                    style={{
                      borderBottom: idx === languages.length - 1 ? 'none' : '1px solid #F1F5F9'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#1E293B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#F1F5F9',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.78rem'
                          }}
                        >
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
                          border: `1px solid ${isEnabled ? '#FECACA' : '#BFDBFE'}`,
                          backgroundColor: isEnabled ? '#FEF2F2' : '#EFF6FF',
                          color: isEnabled ? '#DC2626' : '#2563EB',
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

      {/* Analytics: Language Distribution & Weekly Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Language Popularity Distribution */}
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
                      backgroundColor: '#2563EB',
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
    </div>
  );
}
