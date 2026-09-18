import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { academicSubjects } from '../../data/mockData';

export default function StudentDashboard({ onNavigate, onOpenRagQuery }) {
  const [selectedSemester, setSelectedSemester] = useState('Sem 4');

  // Academic Performance Subject Scores (Current vs Previous)
  const performanceData = [
    { subject: 'Machine Learning', current: 91, previous: 84 },
    { subject: 'Data Structures', current: 86, previous: 80 },
    { subject: 'DBMS', current: 78, previous: 72 },
    { subject: 'Operating Systems', current: 76, previous: 70 },
    { subject: 'Computer Networks', current: 84, previous: 79 }
  ];

  return (
    <div className="page-content">
      {/* 5 Vibrant Pastel KPI Cards */}
      <div className="kpi-grid">
        {/* Overall Performance */}
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-label">Overall Performance</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">82.4%</div>
          <div className="kpi-trend positive">
            <span>↑ 6.2% this semester</span>
          </div>
        </div>

        {/* Attendance */}
        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-label">Attendance</span>
            <div className="kpi-icon-wrap">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">91%</div>
          <div className="kpi-trend positive">
            <span>Good Standing</span>
          </div>
        </div>

        {/* Assessments */}
        <div className="kpi-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-label">Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">18 / 22</div>
          <div className="kpi-trend neutral" style={{ color: 'var(--pastel-purple-text)' }}>
            <span>Completed</span>
          </div>
        </div>

        {/* Current CGPA */}
        <div className="kpi-card kpi-orange">
          <div className="kpi-top">
            <span className="kpi-label">Current CGPA</span>
            <div className="kpi-icon-wrap">
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value">8.42</div>
          <div className="kpi-trend positive" style={{ color: 'var(--pastel-orange-text)' }}>
            <span>↑ +0.34 Growth</span>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="kpi-card kpi-cyan">
          <div className="kpi-top">
            <span className="kpi-label">Learning Progress</span>
            <div className="kpi-icon-wrap">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="kpi-value">78%</div>
          <div className="kpi-trend neutral" style={{ color: 'var(--pastel-cyan-text)' }}>
            <span>This semester</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Section (Prominent Colorful Cards) */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.2px' }}>
          Quick Actions
        </h2>
        <div className="quick-actions-grid">
          {/* View Syllabus */}
          <div
            className="quick-action-card"
            style={{ backgroundColor: 'var(--pastel-blue-bg)', borderColor: 'var(--pastel-blue-border)' }}
            onClick={() => onNavigate('syllabus')}
          >
            <div className="quick-action-icon" style={{ color: 'var(--primary-blue)' }}>
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
            style={{ backgroundColor: 'var(--pastel-purple-bg)', borderColor: 'var(--pastel-purple-border)' }}
            onClick={() => onNavigate('pyqs')}
          >
            <div className="quick-action-icon" style={{ color: 'var(--pastel-purple-text)' }}>
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
            style={{ backgroundColor: 'var(--pastel-green-bg)', borderColor: 'var(--pastel-green-border)' }}
            onClick={() => onNavigate('assessments')}
          >
            <div className="quick-action-icon" style={{ color: 'var(--success)' }}>
              <CheckSquare size={18} />
            </div>
            <div>
              <div className="quick-action-title">Take Assessment</div>
              <div className="quick-action-desc">Check your upcoming assessments</div>
            </div>
          </div>

          {/* Ask GMRIT AI */}
          <div
            className="quick-action-card"
            style={{ backgroundColor: 'var(--pastel-orange-bg)', borderColor: 'var(--pastel-orange-border)' }}
            onClick={() => onOpenRagQuery("What should I study next to prepare for my upcoming Machine Learning quiz?")}
          >
            <div className="quick-action-icon" style={{ color: 'var(--gmr-orange)' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div className="quick-action-title">Ask GMRIT AI</div>
              <div className="quick-action-desc">Get instant RAG study assistance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Large Analytics Card + Right Sidebar (Recent Activity + Upcoming) */}
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
              <p className="card-subtitle">Your performance across subjects (Current vs Previous Evaluation)</p>
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

          {/* Clean Bar Visualization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {performanceData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.subject}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Previous: {item.previous}%</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
                      Current: {item.current}%
                    </span>
                  </div>
                </div>

                <div className="progress-bar-container" style={{ height: '7px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${item.current}%`, backgroundColor: 'var(--primary-blue)' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '18px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: 'var(--primary-blue)' }} />
                <span>Current Score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#CBD5E1' }} />
                <span>Previous Benchmark</span>
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
                <Clock size={15} color="var(--primary-blue)" />
                <span>Recent Activity</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: FileText, color: 'var(--primary-blue)', bg: 'var(--pastel-blue-bg)', text: 'Machine Learning Unit 3 syllabus viewed', time: '5m ago' },
                { icon: CheckSquare, color: 'var(--success)', bg: 'var(--pastel-green-bg)', text: 'DBMS Assessment completed', time: '1h ago' },
                { icon: BookOpen, color: 'var(--pastel-purple-text)', bg: 'var(--pastel-purple-bg)', text: 'New PYQ uploaded for Operating Systems', time: '3h ago' },
                { icon: Sparkles, color: 'var(--gmr-orange)', bg: 'var(--pastel-orange-bg)', text: 'Asked GMRIT AI about Neural Networks', time: 'Yesterday' }
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F8FAFC';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: act.bg,
                      color: act.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                      transition: 'transform 0.2s var(--ease-spring)'
                    }}>
                      <Icon size={13} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.3, fontWeight: 500 }}>
                        {act.text}
                      </p>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
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
                <Calendar size={15} color="var(--gmr-orange)" />
                <span>Upcoming</span>
              </h3>
              <span className="badge badge-orange" style={{ fontSize: '10px' }}>3 Pending</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {[
                { title: 'Machine Learning Quiz', time: 'Tomorrow — 10:00 AM', badge: 'Quiz', badgeColor: 'badge-purple' },
                { title: 'DBMS Assignment', time: 'Sep 14', badge: 'Assignment', badgeColor: 'badge-blue' },
                { title: 'Operating Systems Mid Exam', time: 'Sep 18', badge: 'Exam', badgeColor: 'badge-orange' }
              ].map((up, uIdx) => (
                <div
                  key={uIdx}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.18s var(--ease-spring)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--pastel-blue-border)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'none';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.985)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{up.title}</h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{up.time}</span>
                  </div>
                  <span className={`badge ${up.badgeColor}`} style={{ fontSize: '9.5px' }}>
                    {up.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coding Practice & Assessment Quick Action Banner */}
      <div
        className="card-interactive"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md, 14px)',
          border: '1px solid #E2E8F0',
          padding: '1.25rem 1.5rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          background: 'linear-gradient(to right, #EFF6FF, #FFFFFF)',
          transition: 'all 0.2s var(--ease-spring)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Code2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coding Hub
              </span>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: '700' }}>
                🔥 12-Day Streak Active
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>
              Solve Today's Coding Practice Challenges (128 Solved • 16 Topics)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Practice DSA with real-time test evaluations in Python, C++, Java, C, JS, R, &amp; Ruby
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
            <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
              Subject Performance & Enrolled Courses
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Comprehensive curriculum tracking and assessment velocity
            </p>
          </div>
          <button onClick={() => onNavigate('subjects')} className="btn btn-secondary btn-sm">
            View All Subjects
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {academicSubjects.slice(0, 3).map((sub, idx) => (
            <div
              key={sub.id}
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
                      backgroundColor: sub.id === 'sub_ml' ? 'var(--pastel-blue-bg)' : sub.id === 'sub_ds' ? 'var(--pastel-green-bg)' : 'var(--pastel-orange-bg)',
                      color: sub.id === 'sub_ml' ? 'var(--primary-blue)' : sub.id === 'sub_ds' ? 'var(--success)' : 'var(--gmr-orange)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      transition: 'transform 0.2s var(--ease-spring)'
                    }}>
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{sub.name}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub.code} • {sub.faculty}</span>
                    </div>
                  </div>
                  <span className="badge badge-blue">
                    {sub.score}%
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11.5px',
                  margin: '10px 0 14px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Progress</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{sub.progress}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Assessments</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{sub.assessmentsCompleted}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Syllabus</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{sub.syllabusProgress}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>PYQs</span>
                    <strong style={{ color: 'var(--success)' }}>Available</strong>
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
      </div>
    </div>
  );
}
