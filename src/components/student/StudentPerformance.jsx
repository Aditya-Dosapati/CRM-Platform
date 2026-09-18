import React from 'react';
import { performanceAnalytics } from '../../data/mockData';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle2, Award, Sparkles, Activity, UserCheck, CheckSquare } from 'lucide-react';

export default function StudentPerformance({ onOpenRagQuery }) {
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
            Academic Performance
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Comprehensive analytics across continuous assessments, lab practicals, and mid evaluations
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Analyze my strengths and weaknesses across all semester 4 subjects")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Performance Diagnostic</span>
        </button>
      </div>

      {/* 4 Colorful KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-orange">
          <div className="kpi-top">
            <span className="kpi-label">CGPA</span>
            <div className="kpi-icon-wrap">
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value">8.42</div>
          <div className="kpi-trend positive" style={{ color: 'var(--pastel-orange-text)' }}>
            <span>↑ 0.34 Growth</span>
          </div>
        </div>

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

        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-label">Average Marks</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">82.4%</div>
          <div className="kpi-trend positive">
            <span>↑ 6.2% this semester</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-label">Completed Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">18 / 22</div>
          <div className="kpi-trend neutral" style={{ color: 'var(--pastel-purple-text)' }}>
            <span>82% Completion Rate</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Subject Performance & Competency Radar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Subject-Wise Performance Card */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Subject Performance</h3>
              <p className="card-subtitle">Continuous internal assessment vs class benchmark</p>
            </div>
            <span className="badge badge-blue">Sem 4</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            {performanceAnalytics.subjectPerformance.map((sub, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sub.subject}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Benchmark: {sub.benchmark}%</span>
                    <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>Grade {sub.grade}</span>
                    <strong style={{ color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {sub.score}%
                    </strong>
                  </div>
                </div>

                <div className="progress-bar-container" style={{ height: '8px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${sub.score}%`, backgroundColor: 'var(--primary-blue)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competency Radar Metrics */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Assessment Performance Dimensions</h3>
              <p className="card-subtitle">Holistic engineering student attributes</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {performanceAnalytics.radarMetrics.map((rm, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>{rm.attribute}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '160px' }}>
                  <div className="progress-bar-container" style={{ height: '7px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${rm.value}%`, backgroundColor: '#7C3AED' }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', width: '32px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                    {rm.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: 'var(--pastel-purple-bg)',
            border: '1px solid var(--pastel-purple-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--pastel-purple-text)',
            fontWeight: 500
          }}>
            🌟 Highest scores in <strong>RAG AI Engagement (94%)</strong> & <strong>Practicals (92%)</strong>
          </div>
        </div>
      </div>

      {/* Strengths & Needs Improvement Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Strengths Card */}
        <div className="card" style={{ borderColor: 'var(--pastel-green-border)' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--success)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Strengths
              </h3>
            </div>
            <span className="badge badge-green">Top Percentile</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--pastel-green-bg)',
              border: '1px solid var(--pastel-green-border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Data Structures — Trees</span>
                <strong style={{ fontSize: '14px', color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>94%</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mastery in balanced BST rotations and runtime complexity.</p>
            </div>

            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--pastel-green-bg)',
              border: '1px solid var(--pastel-green-border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Machine Learning — Regression</span>
                <strong style={{ fontSize: '14px', color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>91%</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Strong in gradient descent formulas and loss functions.</p>
            </div>
          </div>
        </div>

        {/* Needs Improvement Card */}
        <div className="card" style={{ borderColor: 'var(--pastel-orange-border)' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--gmr-orange)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Needs Improvement
              </h3>
            </div>
            <span className="badge badge-orange">Action Required</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--pastel-orange-bg)',
              border: '1px solid var(--pastel-orange-border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Operating Systems — Memory Management</span>
                <strong style={{ fontSize: '14px', color: 'var(--gmr-orange)', fontFamily: 'JetBrains Mono, monospace' }}>68%</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Solve paging table & TLB address calculation problems.</p>
            </div>

            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--pastel-orange-bg)',
              border: '1px solid var(--pastel-orange-border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>DBMS — Normalization</span>
                <strong style={{ fontSize: '14px', color: 'var(--gmr-orange)', fontFamily: 'JetBrains Mono, monospace' }}>71%</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Review BCNF decomposition and dependency preservation proofs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
