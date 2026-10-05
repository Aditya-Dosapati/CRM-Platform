import React, { useState, useEffect } from 'react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import authService from '../../services/authService';
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
  BookOpen,
  GraduationCap
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function FacultyDashboard({ onNavigate, onOpenRagQuery }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const facultyId = currentUser?.id || currentUser?.userId;
        const assigned = await facultyAssignmentService.getFacultyAssignedClasses(facultyId);
        if (isMounted) {
          setClasses(assigned || []);
        }
      } catch (e) {
        console.warn('FacultyDashboard: could not load faculty assignments:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?.userId]);

  const hasClasses = classes && classes.length > 0;

  return (
    <div className="page-content">
      {/* Faculty Profile Welcome Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px' }}>
            Faculty Academic Portal
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Welcome, {currentUser?.name || 'Faculty Member'} • Assigned Courses: <strong>{classes.length}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onNavigate('assessments')} className="btn btn-secondary btn-sm">
            <Plus size={14} />
            <span>Create Assessment</span>
          </button>
          <button onClick={() => onNavigate('resources')} className="btn btn-primary btn-sm">
            <FolderArchive size={14} />
            <span>Upload Resource</span>
          </button>
        </div>
      </div>

      {/* 4 Minimal Academic KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Assigned Courses</span>
            <div className="kpi-icon-wrap">
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : classes.length}</div>
          <div className="kpi-trend neutral">
            <span>{hasClasses ? 'Active Curriculum' : 'No Active Classes'}</span>
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
            <span>{hasClasses ? 'Continuous CIE Metric' : 'No Students Enrolled'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">ATTENDANCE</span>
            <div className="kpi-icon-wrap">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasClasses ? '87.4%' : '—'}</div>
          <div className="kpi-trend positive">
            <span>{hasClasses ? 'Above 75% threshold' : 'Pending Sessions'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasClasses ? '0' : '—'}</div>
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

      {/* My Subjects */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.2px', margin: 0 }}>
            My Subjects
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7 }}>
            {classes.length} assigned section{classes.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text)', opacity: 0.7 }}>
            Loading your assigned subjects from the database...
          </div>
        ) : !hasClasses ? (
          <EmptyState
            icon={BookOpen}
            title="No classes assigned"
            description="You do not have any subjects or sections currently assigned. Your assigned classes will appear here once scheduled by the administrator."
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '14px'
          }}>
            {classes.map((cls, idx) => (
              <div key={cls.assignmentId || cls.id || idx} className={`card card-interactive stagger-${idx + 1}`} style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-blue">{cls.code}</span>
                      <span className="badge badge-purple" style={{ fontWeight: 800 }}>
                        Sec {cls.section}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text)', marginTop: '6px' }}>
                      {cls.name}
                    </h3>
                  </div>
                  <span className="badge badge-green">
                    Active
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '12px' }}>
                  {cls.formattedClass || `${cls.year} Year • Semester ${cls.semester} • Section ${cls.section}`}
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
                    <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>{cls.credits || 3} Credits</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>REGULATION</span>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>{cls.regulation || 'AR23'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>DEPARTMENT</span>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>{cls.departmentCode || 'CSE'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>ACADEMIC YEAR</span>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>{cls.academicYear || '2025-2026'}</p>
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
