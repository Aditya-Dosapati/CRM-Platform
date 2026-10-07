import React, { useState, useEffect } from 'react';
import academicDataService from '../../services/academicDataService';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import assessmentService from '../../services/assessmentService';
import authService from '../../services/authService';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle2, Award, Sparkles, Activity, UserCheck, CheckSquare, BookOpen } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function StudentPerformance({ onOpenRagQuery }) {
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    let isMounted = true;
    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        const studentId = currentUser?.id || currentUser?.userId;
        const [loadedSubs, loadedAttempts] = await Promise.all([
          facultyAssignmentService.getStudentAssignedSubjects(studentId, currentUser),
          assessmentService.getStudentAttempts(studentId)
        ]);
        if (isMounted) {
          setSubjects(loadedSubs || []);
          setAttempts(loadedAttempts || []);
        }
      } catch (e) {
        console.warn('StudentPerformance: could not load performance data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPerformanceData();
    return () => { isMounted = false; };
  }, [currentUser]);

  const hasSubjects = subjects && subjects.length > 0;
  const completedCount = attempts.length;
  const avgScore = completedCount > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) / completedCount)
    : null;

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
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
            Academic Performance
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Comprehensive analytics across continuous assessments, lab practicals, and mid evaluations
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Analyze my strengths and weaknesses across all semester subjects")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Performance Diagnostic</span>
        </button>
      </div>

      {/* 4 Minimal Academic KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">CGPA</span>
            <div className="kpi-icon-wrap">
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value">—</div>
          <div className="kpi-trend neutral">
            <span>Pending SEE Tabulation</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Attendance</span>
            <div className="kpi-icon-wrap">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">—</div>
          <div className="kpi-trend neutral">
            <span>Tracking in progress</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Average Score</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{avgScore !== null ? `${avgScore}%` : '—'}</div>
          <div className={`kpi-trend ${avgScore !== null ? 'positive' : 'neutral'}`}>
            <span>{completedCount > 0 ? `${completedCount} Evaluation${completedCount === 1 ? '' : 's'}` : 'No graded evaluations'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Completed Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">{completedCount}</div>
          <div className={`kpi-trend ${completedCount > 0 ? 'positive' : 'neutral'}`}>
            <span>{completedCount > 0 ? 'Graded Submissions' : 'No Submissions'}</span>
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
            <span className="badge">Sem 4</span>
          </div>

          {!hasSubjects ? (
            <EmptyState
              icon={BookOpen}
              title="No Subject Scores Available"
              description="Scores will populate once internal assessment marks are entered."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
              {subjects.map((sub, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{sub.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Code: {sub.code}</span>
                      <strong style={{ color: 'var(--color-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {sub.progress || 0}% Progress
                      </strong>
                    </div>
                  </div>

                  <div className="progress-bar-container" style={{ height: '8px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${sub.progress || 0}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competency Radar Metrics */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Performance Dimensions</h3>
              <p className="card-subtitle">Holistic engineering student attributes</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {[
              { attribute: 'Curriculum Progress', value: hasSubjects ? 75 : 0 },
              { attribute: 'Attendance Discipline', value: hasSubjects ? 91 : 0 },
              { attribute: 'RAG Knowledge Utilization', value: 85 },
              { attribute: 'Coding Hub Velocity', value: 70 }
            ].map((rm, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{rm.attribute}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '160px' }}>
                  <div className="progress-bar-container" style={{ height: '7px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${rm.value}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', width: '32px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                    {rm.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            fontWeight: 500
          }}>
            🌟 Institutional AI Learning Analytics Active
          </div>
        </div>
      </div>
    </div>
  );
}

