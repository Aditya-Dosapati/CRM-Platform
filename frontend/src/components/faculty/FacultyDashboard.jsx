import React, { useState, useEffect } from 'react';
import academicDataService from '../../services/academicDataService';
import {
  Users,
  TrendingUp,
  UserCheck,
  CheckSquare,
  AlertTriangle,
  ChevronRight,
  Plus,
  FolderArchive,
  BarChart2,
  FileText,
  BookOpen
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function FacultyDashboard({ onNavigate, onOpenRagQuery }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await academicDataService.getSubjects();
        if (isMounted && res.data) {
          setClasses(res.data);
        }
      } catch (e) {
        console.warn('FacultyDashboard: could not load classes:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, []);

  const hasClasses = classes && classes.length > 0;

  return (
    <div className="page-content">
      {/* 4 Minimal Academic KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Assigned Courses</span>
            <div className="kpi-icon-wrap">
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value">{classes.length}</div>
          <div className="kpi-trend neutral">
            <span>Active Curriculum</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Average Performance</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasClasses ? '78.6%' : '—'}</div>
          <div className="kpi-trend positive">
            <span>Continuous CIE Metric</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Cohort Attendance</span>
            <div className="kpi-icon-wrap">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasClasses ? '87.4%' : '—'}</div>
          <div className="kpi-trend positive">
            <span>Above 75% threshold</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">0</div>
          <div className="kpi-trend neutral">
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px', letterSpacing: '-0.2px' }}>
          Quick Actions
        </h2>
        <div className="quick-actions-grid">
          <div
            className="quick-action-card"
            onClick={() => onNavigate('assessments')}
          >
            <div className="quick-action-icon">
              <Plus size={18} />
            </div>
            <div>
              <div className="quick-action-title">Create Assessment</div>
              <div className="quick-action-desc">Publish quizzes & tests</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('resources')}
          >
            <div className="quick-action-icon">
              <FolderArchive size={18} />
            </div>
            <div>
              <div className="quick-action-title">Upload Resource</div>
              <div className="quick-action-desc">Handouts, notes & slides</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('students')}
          >
            <div className="quick-action-icon">
              <Users size={18} />
            </div>
            <div>
              <div className="quick-action-title">View Students</div>
              <div className="quick-action-desc">Track cohort attendance & marks</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('analytics')}
          >
            <div className="quick-action-icon">
              <BarChart2 size={18} />
            </div>
            <div>
              <div className="quick-action-title">View Analytics</div>
              <div className="quick-action-desc">At-risk matrix & outcomes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Class & Section Overview */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px', letterSpacing: '-0.2px' }}>
          Class & Section Overview
        </h2>

        {!hasClasses ? (
          <EmptyState
            icon={BookOpen}
            title="No Course Sections Assigned"
            description="Assigned academic subjects will appear once scheduled by the department administrator."
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '14px'
          }}>
            {classes.map((cls, idx) => (
              <div key={cls.id || idx} className={`card card-interactive stagger-${idx + 1}`} style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span className="badge">{cls.code}</span>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text)', marginTop: '4px' }}>
                      {cls.name}
                    </h3>
                  </div>
                  <span className="badge">
                    Active
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '14px'
                }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>CREDITS</span>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>{cls.credits || 3}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>PROGRESS</span>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>{cls.progress || 0}%</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>REGULATION</span>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>R20</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>STATUS</span>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>Active</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onNavigate('students')} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    View Students
                  </button>
                  <button onClick={() => onNavigate('analytics')} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    Analytics
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

