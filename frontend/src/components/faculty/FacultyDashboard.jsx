import React, { useState, useEffect } from 'react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import assessmentService from '../../services/assessmentService';
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
  const [activeAsmtsCount, setActiveAsmtsCount] = useState(0);
  const [avgPerformance, setAvgPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const facultyId = currentUser?.id || currentUser?.userId;
        const [assigned, asmtRes, analytics] = await Promise.all([
          facultyAssignmentService.getFacultyAssignedClasses(facultyId),
          assessmentService.getAssessments({ facultyUserId: facultyId }),
          assessmentService.getFacultyAssessmentAnalytics(facultyId)
        ]);

        if (isMounted) {
          setClasses(assigned || []);
          const publishedAsmts = (asmtRes?.data || []).filter(a => a.status === 'published');
          setActiveAsmtsCount(publishedAsmts.length);

          const attempts = analytics?.allFacultyAttempts || [];
          if (attempts.length > 0) {
            const avg = Math.round(attempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) / attempts.length);
            setAvgPerformance(avg);
          } else {
            setAvgPerformance(null);
          }
        }
      } catch (e) {
        console.warn('FacultyDashboard: could not load dashboard data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboardData();

    const handleUpdate = () => {
      fetchDashboardData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('gmrit_assignments_updated', handleUpdate);
      window.addEventListener('gmrit_assessments_updated', handleUpdate);
    }

    return () => { 
      isMounted = false; 
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmrit_assignments_updated', handleUpdate);
        window.removeEventListener('gmrit_assessments_updated', handleUpdate);
      }
    };
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
          <div className="kpi-value">{avgPerformance !== null ? `${avgPerformance}%` : '—'}</div>
          <div className={`kpi-trend ${avgPerformance !== null ? 'positive' : 'neutral'}`}>
            <span>{avgPerformance !== null ? 'Continuous Evaluation' : 'No graded submissions'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">ATTENDANCE</span>
            <div className="kpi-icon-wrap">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">—</div>
          <div className="kpi-trend neutral">
            <span>Tracking in progress</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate('assessments')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Active Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : activeAsmtsCount}</div>
          <div className={`kpi-trend ${activeAsmtsCount > 0 ? 'positive' : 'neutral'}`}>
            <span>{activeAsmtsCount > 0 ? `${activeAsmtsCount} Active in Curriculum` : 'None Scheduled'}</span>
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
            gap: '16px'
          }}>
            {classes.map((cls, idx) => {
              const courseName = cls.name || cls.subjectName || 'Assigned Course';
              const courseCode = cls.code || cls.subjectCode || '—';
              const yearText = cls.year ? `${cls.year}${cls.year === 1 ? 'st' : cls.year === 2 ? 'nd' : cls.year === 3 ? 'rd' : 'th'} Year` : '4th Year';
              const branchDisplay = cls.branchDisplayName || cls.departmentCode || cls.branch || 'CSE';
              const cohortInfo = `${branchDisplay} · ${yearText} · Semester ${cls.semester || 7} · Section ${cls.section || 'A'}`;
              const creditsVal = cls.credits || cls.subjectCredits || 3;
              const regVal = cls.regulation || 'AR23';
              const acadYearVal = cls.academicYear || '2025–2026';
              const isActive = cls.isActive !== false;

              return (
                <div 
                  key={cls.assignmentId || cls.id || idx} 
                  className={`card card-interactive stagger-${idx + 1}`} 
                  style={{ 
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {/* 1. Course Name (prominent heading) & Course Code */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between', 
                    gap: '10px',
                    marginBottom: '8px' 
                  }}>
                    <h3 style={{ 
                      fontSize: '17px', 
                      fontWeight: 800, 
                      color: 'var(--color-text)', 
                      letterSpacing: '-0.3px',
                      margin: 0,
                      lineHeight: 1.3,
                      wordBreak: 'break-word'
                    }}>
                      {courseName}
                    </h3>
                    <span 
                      className="badge badge-blue"
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        padding: '3px 8px',
                        flexShrink: 0
                      }}
                    >
                      {courseCode}
                    </span>
                  </div>

                  {/* 2. Section & Status Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span className="badge badge-purple" style={{ fontWeight: 800, fontSize: '11px', padding: '2px 8px' }}>
                      Section {cls.section || 'A'}
                    </span>
                    <span 
                      className={isActive ? 'badge badge-green' : 'badge badge-gray'} 
                      style={{ fontWeight: 700, fontSize: '11px', padding: '2px 8px' }}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* 3. Cohort Information */}
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text)', 
                    opacity: 0.82, 
                    fontWeight: 600, 
                    marginBottom: '14px',
                    lineHeight: 1.4
                  }}>
                    {cohortInfo}
                  </div>

                  {/* 4. Course Details 2x2 Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px 12px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                    border: '1px solid var(--color-border)'
                  }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                        Credits
                      </span>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                        {creditsVal} Credits
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                        Regulation
                      </span>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                        {regVal}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                        Department / Branch
                      </span>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                        {branchDisplay}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                        Academic Year
                      </span>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                        {acadYearVal}
                      </p>
                    </div>
                  </div>

                  {/* 5. Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button 
                      type="button"
                      onClick={() => onNavigate('classes', { selectedAssignmentId: cls.assignmentId || cls.id, selectedSection: cls.section })} 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1, fontWeight: 700, justifyContent: 'center', fontSize: '12px', padding: '6px 10px' }}
                    >
                      <Users size={13} />
                      <span>View Students</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => onNavigate('analytics', { selectedAssignmentId: cls.assignmentId || cls.id, selectedSection: cls.section })} 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1, fontWeight: 700, justifyContent: 'center', fontSize: '12px', padding: '6px 10px' }}
                    >
                      <BarChart2 size={13} />
                      <span>Analytics</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
