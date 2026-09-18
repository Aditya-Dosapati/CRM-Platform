import React from 'react';
import { facultyStudentRoster } from '../../data/mockData';
import { Activity, TrendingUp, AlertTriangle, BarChart2, Sparkles } from 'lucide-react';

export default function FacultyAnalytics({ onNavigate, onOpenRagQuery }) {
  const atRiskStudents = facultyStudentRoster.filter(s => s.isAtRisk);

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
            Faculty Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Class performance distribution, unit-wise outcomes, and at-risk early detection
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Analyze overall cohort performance and generate remedial teaching recommendations for Machine Learning")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Cohort Diagnostic</span>
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Class Performance Card */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Class Performance Distribution</h3>
              <p className="card-subtitle">Normal score distribution across CSE-A & CSE-B (184 students)</p>
            </div>
            <span className="badge badge-blue">Class Avg: 78.6%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '16px 10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {[
              { bracket: '< 50%', count: 8, pct: 18, color: 'var(--error)' },
              { bracket: '50-60%', count: 18, pct: 35, color: 'var(--warning)' },
              { bracket: '60-70%', count: 38, pct: 65, color: '#3B82F6' },
              { bracket: '70-80%', count: 54, pct: 95, color: 'var(--primary-blue)' },
              { bracket: '80-90%', count: 46, pct: 80, color: 'var(--success)' },
              { bracket: '90-100%', count: 20, pct: 40, color: '#7C3AED' }
            ].map((b, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: b.color, fontFamily: 'JetBrains Mono, monospace' }}>
                  {b.count}
                </span>
                <div style={{
                  width: '38px',
                  height: `${b.pct * 1.0}px`,
                  backgroundColor: b.color,
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.9
                }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.bracket}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Median Score: <strong>76.5%</strong></span>
            <span>Standard Deviation: <strong>11.4</strong></span>
            <span>Pass Rate: <strong>95.6%</strong></span>
          </div>
        </div>

        {/* Unit-Wise Performance */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Subject Performance by Unit</h3>
              <p className="card-subtitle">Course outcome attainment</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {[
              { unit: 'Unit I — Intro to ML', score: 86, color: 'var(--success)' },
              { unit: 'Unit II — Regression', score: 81, color: 'var(--success)' },
              { unit: 'Unit III — Classification', score: 79, color: 'var(--primary-blue)' },
              { unit: 'Unit IV — Clustering', score: 74, color: 'var(--warning)' },
              { unit: 'Unit V — Neural Networks', score: 62, color: 'var(--error)' }
            ].map((u, uIdx) => (
              <div key={uIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.unit}</span>
                  <strong style={{ color: u.color, fontFamily: 'JetBrains Mono, monospace' }}>{u.score}%</strong>
                </div>
                <div className="progress-bar-container" style={{ height: '7px' }}>
                  <div className="progress-bar-fill" style={{ width: `${u.score}%`, backgroundColor: u.color }} />
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '14px' }}>
            Unit V (Backpropagation derivations) has the lowest comprehension score.
          </p>
        </div>
      </div>

      {/* At-Risk Students Card */}
      <div className="card" style={{ borderColor: 'var(--pastel-orange-border)' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--gmr-orange)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Students Requiring Attention
            </h3>
          </div>
          <button onClick={() => onNavigate('students')} className="btn btn-secondary btn-sm">
            View Students
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          ⚠ <strong>8 students</strong> below the performance threshold (&lt; 75% attendance or &lt; 50% continuous CIE).
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px'
        }}>
          {atRiskStudents.map((std) => (
            <div
              key={std.id}
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--pastel-orange-bg)',
                border: '1px solid var(--pastel-orange-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {std.name} ({std.rollNumber})
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--gmr-orange)', marginTop: '2px' }}>
                  {std.riskReason}
                </p>
              </div>
              <button
                onClick={() => onNavigate('students')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 8px' }}
              >
                Counsel
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
