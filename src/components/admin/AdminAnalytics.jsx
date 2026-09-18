import React from 'react';
import { BarChart2, TrendingUp, Cpu, Users, Building, Activity, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminAnalytics({ onOpenRagQuery }) {
  const deptStats = [
    { name: 'CSE', students: 2480, avgMarks: 81.2, att: 89.4, aiQueries: 14200 },
    { name: 'IT', students: 1240, avgMarks: 79.8, att: 88.2, aiQueries: 8400 },
    { name: 'ECE', students: 1820, avgMarks: 77.4, att: 86.8, aiQueries: 9100 },
    { name: 'EEE', students: 1100, avgMarks: 75.2, att: 85.0, aiQueries: 5200 },
    { name: 'MECH', students: 980, avgMarks: 73.8, att: 84.6, aiQueries: 3800 },
    { name: 'CIVIL', students: 872, avgMarks: 74.5, att: 85.2, aiQueries: 3100 }
  ];

  const topRagDocs = [
    { doc: 'GMRIT_R20_CSE_ML_Unit3.pdf', subject: 'Machine Learning', queries: 2840, citedRatio: '94%' },
    { doc: 'GMRIT_DBMS_SEE_2025_AnswerKey.pdf', subject: 'DBMS', queries: 2180, citedRatio: '91%' },
    { doc: 'DSA_AVL_Trees_Prof_Ramesh.pdf', subject: 'Data Structures', queries: 1950, citedRatio: '88%' },
    { doc: 'OS_VirtualMemory_Paging.pdf', subject: 'Operating Systems', queries: 1620, citedRatio: '84%' },
    { doc: 'CN_SocketProgramming_Lab.pdf', subject: 'Computer Networks', queries: 1340, citedRatio: '82%' }
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Institution-Level Academic & AI Telemetry
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Cross-departmental performance metrics, RAG semantic utilization, and campus learning velocity
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Synthesize an institution-wide academic diagnostic across all 6 engineering departments")}
          className="btn btn-primary"
        >
          <Sparkles size={15} />
          <span>Executive AI Report</span>
        </button>
      </div>

      {/* Pastel KPI Cards - Compact & Vibrant */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL STUDENTS</span>
            <div className="kpi-icon-wrap">
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value">8,492</div>
          <div className="kpi-trend neutral">Across 6 B.Tech Depts</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-label">CAMPUS ATTENDANCE</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>87.1%</div>
          <div className="kpi-trend positive">↑ 1.4% vs last semester</div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-label">MONTHLY AI QUERIES</span>
            <div className="kpi-icon-wrap">
              <Cpu size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#7C3AED' }}>43,800</div>
          <div className="kpi-trend neutral" style={{ color: '#7C3AED' }}>↑ 34% Student Adoption</div>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-top">
            <span className="kpi-label">ASSESSMENT COMPLETION</span>
            <div className="kpi-icon-wrap">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value">93.4%</div>
          <div className="kpi-trend neutral">Across all CIE Quizzes</div>
        </div>
      </div>

      {/* Departmental Comparison Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Department Comparison Chart */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Building size={16} color="var(--primary-blue)" />
                <span>Department Performance & RAG Utilization</span>
              </h3>
              <p className="card-subtitle">Comparing academic marks against AI engagement</p>
            </div>
            <span className="badge badge-blue">6 Departments</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {deptStats.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>({d.students} Students)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--primary-blue)', fontWeight: 600 }}>{d.aiQueries.toLocaleString()} AI Queries</span>
                    <strong style={{ color: d.avgMarks >= 80 ? 'var(--primary-blue)' : '#059669', fontFamily: 'JetBrains Mono, monospace' }}>
                      {d.avgMarks}% Avg
                    </strong>
                  </div>
                </div>

                <div className="progress-bar-container" style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${d.avgMarks}%`,
                      background: d.name === 'CSE' ? 'linear-gradient(90deg, #2563EB, #60A5FA)' : 'linear-gradient(90deg, #3B82F6, #10B981)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Query Velocity Over Time */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Activity size={16} color="var(--purple)" />
                <span>AI Queries Over Time (Weekly)</span>
              </h3>
              <p className="card-subtitle">Surges correlate with Mid Exam schedules</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '20px 10px 0', borderBottom: '1px solid var(--border-light)' }}>
            {[
              { week: 'W1', queries: 4800, ht: 40 },
              { week: 'W2', queries: 6200, ht: 55 },
              { week: 'W3 (Mid 1)', queries: 14200, ht: 110, peak: true },
              { week: 'W4', queries: 7400, ht: 65 },
              { week: 'W5 (Current)', queries: 11200, ht: 95 }
            ].map((w, wIdx) => (
              <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: w.peak ? 'var(--primary-blue)' : 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {(w.queries / 1000).toFixed(1)}k
                </span>
                <div style={{
                  width: '32px',
                  height: `${w.ht}px`,
                  background: w.peak ? 'linear-gradient(180deg, #2563EB, #60A5FA)' : 'linear-gradient(180deg, #8B5CF6, #C4B5FD)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: w.peak ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
                }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{w.week}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '14px', lineHeight: 1.4 }}>
            Peak surge of 14,200 queries during Mid 1 exam week. 0 downtime recorded on Qdrant cluster.
          </p>
        </div>
      </div>

      {/* Top Queried RAG Documents */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="var(--primary-blue)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Most Queried Knowledge Documents & Citation Grounding
            </h3>
          </div>
          <span className="badge badge-blue">RAG Metrics</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Subject</th>
                <th>Monthly Queries</th>
                <th>Citation Grounding Accuracy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topRagDocs.map((doc, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.doc}</td>
                  <td>{doc.subject}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary-blue)', fontWeight: 600 }}>
                    {doc.queries.toLocaleString()} times
                  </td>
                  <td>
                    <span className="badge badge-green">{doc.citedRatio} Accuracy</span>
                  </td>
                  <td>
                    <span className="badge badge-blue">Active Vector</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
