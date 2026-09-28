import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  UserCheck,
  CheckSquare,
  Award,
  Sparkles,
  FileText,
  HelpCircle,
  Clock,
  Calendar,
  ChevronRight,
  BookOpen,
  Code2,
  Terminal,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import EmptyState from '../common/EmptyState';

export default function StudentDashboard({ onNavigate, onOpenRagQuery }) {
  const [selectedSemester, setSelectedSemester] = useState('Sem 4');
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await academicDataService.getSubjects();
        if (isMounted && res.data) {
          setSubjects(res.data);
        }
      } catch (err) {
        console.warn('StudentDashboard: could not load dynamic subjects:', err);
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    };
    fetchDashboardSubjects();
    return () => { isMounted = false; };
  }, []);

  const hasSubjects = subjects && subjects.length > 0;

  return (
    <div className="page-content">
      {/* 5 Minimal Academic KPI Cards */}
      <div className="kpi-grid">
        {/* Overall Performance */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Overall Performance</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? '82.4%' : '—'}</div>
          <div className="kpi-trend positive">
            <span>{hasSubjects ? '↑ Active Semester' : 'No graded evaluations yet'}</span>
          </div>
        </div>

        {/* Attendance */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Attendance</span>
            <div className="kpi-icon-wrap">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? '91%' : '—'}</div>
          <div className="kpi-trend positive">
            <span>{hasSubjects ? 'Good Standing' : 'Tracking pending'}</span>
          </div>
        </div>

        {/* Assessments */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? '0 / 0' : '0'}</div>
          <div className="kpi-trend neutral">
            <span>Scheduled</span>
          </div>
        </div>

        {/* Current CGPA */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Current CGPA</span>
            <div className="kpi-icon-wrap">
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? '8.42' : '—'}</div>
          <div className="kpi-trend positive">
            <span>{hasSubjects ? 'Institutional Scale' : 'Cumulative'}</span>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Learning Progress</span>
            <div className="kpi-icon-wrap">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? `${subjects.length} Subjects` : '0 Courses'}</div>
          <div className="kpi-trend neutral">
            <span>R20 Regulation</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px', letterSpacing: '-0.2px' }}>
          Quick Actions
        </h2>
        <div className="quick-actions-grid">
          {/* View Syllabus */}
          <div
            className="quick-action-card"
            onClick={() => onNavigate('syllabus')}
          >
            <div className="quick-action-icon">
              <FileText size={18} />
            </div>
            <div>
              <div className="quick-action-title">View Syllabus</div>
              <div className="quick-action-desc">Explore subject-wise curriculum</div>
            </div>
          </div>

          {/* Practice PYQs */}
          <div
            className="quick-action-card"
            onClick={() => onNavigate('pyqs')}
          >
            <div className="quick-action-icon">
              <HelpCircle size={18} />
            </div>
            <div>
              <div className="quick-action-title">Practice PYQs</div>
              <div className="quick-action-desc">Solve previous year questions</div>
            </div>
          </div>

          {/* Take Assessment */}
          <div
            className="quick-action-card"
            onClick={() => onNavigate('assessments')}
          >
            <div className="quick-action-icon">
              <CheckSquare size={18} />
            </div>
            <div>
              <div className="quick-action-title">Assessments</div>
              <div className="quick-action-desc">Check your course evaluations</div>
            </div>
          </div>

          {/* Ask GMRIT AI */}
          <div
            className="quick-action-card"
            onClick={() => onOpenRagQuery("What should I study next to prepare for my upcoming academic assessments?")}
          >
            <div className="quick-action-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="quick-action-title">Ask GMRIT AI</div>
              <div className="quick-action-desc">Get instant RAG study assistance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Large Analytics Card + Right Sidebar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '18px',
        marginBottom: '22px'
      }}>
        {/* Large Academic Performance Chart Card */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <span>Academic Performance</span>
              </h3>
              <p className="card-subtitle">Enrolled subject mastery & evaluation benchmarks</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="input-field"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                style={{ paddingBlock: '4px', paddingLeft: '8px', fontSize: '11.5px', width: 'auto' }}
              >
                <option value="Sem 4">Semester 4 (Current)</option>
                <option value="Sem 3">Semester 3</option>
                <option value="Sem 2">Semester 2</option>
              </select>
            </div>
          </div>

          {!hasSubjects ? (
            <EmptyState
              icon={BookOpen}
              title="No Performance Metrics Available"
              description="Subject evaluations will appear here once academic scores are posted."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              {subjects.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Code: {item.code}</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.progress || 0}% Progress
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar-container" style={{ height: '7px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${item.progress || 0}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '18px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: 'var(--color-primary)' }} />
                <span>Curriculum Progress</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('performance')}
              className="btn btn-secondary btn-sm"
            >
              <span>Full Analytics</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Right Column: Recent Activity + Upcoming Compact Cards */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Recent Activity Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <h3 className="card-title" style={{ fontSize: '13.5px' }}>
                <Clock size={15} color="var(--color-primary)" />
                <span>Recent Activity</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: Sparkles, text: 'GMRIT AI Knowledge Base active', time: 'Online' },
                { icon: FileText, text: 'R20 Academic Regulation curriculum loaded', time: 'Active' },
                { icon: BookOpen, text: 'Digital course library connected', time: 'Ready' }
              ].map((act, aIdx) => {
                const Icon = act.icon;
                return (
                  <div
                    key={aIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '9px',
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-xs)',
                      transition: 'all 0.16s ease',
                      cursor: 'default'
                    }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px'
                    }}>
                      <Icon size={13} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.3, fontWeight: 500, margin: 0 }}>
                        {act.text}
                      </p>
                      <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                        {act.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <h3 className="card-title" style={{ fontSize: '13.5px' }}>
                <Calendar size={15} color="var(--color-primary)" />
                <span>Upcoming</span>
              </h3>
              <span className="badge" style={{ fontSize: '10px' }}>0 Pending</span>
            </div>

            <div style={{ padding: '12px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                No pending assessments or submission deadlines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coding Practice & Assessment Quick Action Banner */}
      <div
        className="card-interactive"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md, 14px)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem 1.5rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Code2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coding Hub
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-text)' }}>
              Interactive Coding & Algorithm Practice
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Practice DSA in Python, C++, Java, C, and JS with automated test evaluation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => onNavigate('coding-assessments')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Terminal size={14} />
            Assessments
          </button>
          <button
            onClick={() => onNavigate('coding-practice')}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            Practice Workspace
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Subject Performance Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.2px' }}>
              Subject Performance & Enrolled Courses
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Comprehensive curriculum tracking and assessment velocity
            </p>
          </div>
          <button onClick={() => onNavigate('subjects')} className="btn btn-secondary btn-sm">
            View All Subjects
          </button>
        </div>

        {!hasSubjects ? (
          <EmptyState
            icon={BookOpen}
            title="No Courses Enrolled"
            description="No course subjects registered for this semester yet."
            actionText="Browse Curriculum"
            onAction={() => onNavigate('syllabus')}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px'
          }}>
            {subjects.slice(0, 3).map((sub, idx) => (
              <div
                key={sub.id || idx}
                className={`card card-interactive stagger-${idx + 1}`}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-primary)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{sub.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{sub.code} • {sub.faculty || 'Department Faculty'}</span>
                      </div>
                    </div>
                    <span className="badge">
                      {sub.progress || 0}%
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11.5px',
                    margin: '10px 0 14px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '10.5px' }}>Progress</span>
                      <strong style={{ color: 'var(--color-text)' }}>{sub.progress || 0}%</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '10.5px' }}>Credits</span>
                      <strong style={{ color: 'var(--color-text)' }}>{sub.credits || 3}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '10.5px' }}>Syllabus</span>
                      <strong style={{ color: 'var(--color-text)' }}>R20 Regulation</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '10.5px' }}>Status</span>
                      <strong style={{ color: 'var(--color-primary)' }}>Active</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onNavigate('subjects')}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    View Subject
                  </button>
                  <button
                    onClick={() => onNavigate('syllabus')}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    View Syllabus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

