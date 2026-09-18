import React from 'react';
import { performanceAnalytics } from '../../data/mockData';
import { TrendingUp, Award, Calendar, CheckCircle, Activity, Sparkles, Zap, BookOpen } from 'lucide-react';

export default function StudentInfographics({ onOpenRagQuery }) {
  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Academic Insights
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Visual infographics representing 4 semesters of engineering progression at GMRIT
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Synthesize an academic executive summary of my engineering progression")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Growth Summary</span>
        </button>
      </div>

      {/* Section 1: Your Academic Journey */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-blue)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              MILESTONES & CGPA PROGRESSION
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              Your Academic Journey
            </h2>
          </div>
          <span className="badge badge-blue">4 Semesters Tracked</span>
        </div>

        {/* Progression Nodes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}>
          {performanceAnalytics.cgpaJourney.map((sem, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: idx === 3 ? 'var(--pastel-blue-bg)' : '#F8FAFC',
                border: `1px solid ${idx === 3 ? 'var(--pastel-blue-border)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                position: 'relative'
              }}
            >
              {idx === 3 && (
                <span className="badge badge-blue" style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px' }}>
                  CURRENT
                </span>
              )}

              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {sem.semester}
              </span>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0 10px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: idx === 3 ? 'var(--primary-blue)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {sem.cgpa}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  CGPA
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11.5px',
                color: 'var(--text-secondary)'
              }}>
                <span>SGPA: <strong>{sem.sgpa}</strong></span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  {idx > 0 ? `+${(sem.cgpa - performanceAnalytics.cgpaJourney[idx-1].cgpa).toFixed(2)}` : 'Baseline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Multidimensional Infographics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '20px'
      }}>
        {/* Attendance Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={16} color="var(--success)" />
              <span>Attendance Trend</span>
            </h3>
            <span className="badge badge-green">91% Consistent</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {[
              { month: 'Jun', val: 94 },
              { month: 'Jul', val: 89 },
              { month: 'Aug', val: 92 },
              { month: 'Sep', val: 91 }
            ].map((m, mIdx) => (
              <div key={mIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {m.val}%
                </span>
                <div style={{
                  width: '32px',
                  height: `${m.val * 0.7}px`,
                  backgroundColor: 'var(--pastel-green-bg)',
                  border: '1px solid var(--pastel-green-border)',
                  borderBottom: 'none',
                  borderRadius: '4px 4px 0 0'
                }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.month}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
            Zero condonation penalties applied. Well above 75% requirement.
          </p>
        </div>

        {/* Assessment Completion */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Zap size={16} color="var(--primary-blue)" />
              <span>Assessment Completion</span>
            </h3>
            <span className="badge badge-blue">18 / 22 Done</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>QUIZZES</span>
              <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>12/14</p>
              <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: 600 }}>86%</span>
            </div>
            <div style={{ width: '1px', height: '36px', backgroundColor: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LAB TESTS</span>
              <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>4/4</p>
              <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: 600 }}>100%</span>
            </div>
            <div style={{ width: '1px', height: '36px', backgroundColor: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MID EXAMS</span>
              <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>2/4</p>
              <span style={{ fontSize: '10.5px', color: 'var(--warning)', fontWeight: 600 }}>In Progress</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            High submission discipline with 0 late penalties recorded.
          </p>
        </div>

        {/* Learning Consistency */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={16} color="var(--pastel-purple-text)" />
              <span>Learning Consistency</span>
            </h3>
            <span className="badge badge-purple">94.2 / 100</span>
          </div>

          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>RAG Query Engagement</span>
              <strong style={{ color: 'var(--primary-blue)' }}>Daily Active</strong>
            </div>
            <div className="progress-bar-container" style={{ marginBottom: '14px' }}>
              <div className="progress-bar-fill progress-bar-blue" style={{ width: '92%' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>PYQ Practice Frequency</span>
              <strong style={{ color: 'var(--success)' }}>High</strong>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill progress-bar-green" style={{ width: '88%' }} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Strong regular study pattern detected by campus AI analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
