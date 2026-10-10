import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, TrendingUp, AlertTriangle, BarChart2, Sparkles, Users, BookOpen, 
  Award, CheckCircle2, Clock, ChevronDown, Check, X, Filter, UserCheck, FileText, ArrowUpRight
} from 'lucide-react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import assessmentService from '../../services/assessmentService';
import authService from '../../services/authService';
import EmptyState from '../common/EmptyState';

/**
 * Null-safe percentage parser
 * Handles null, undefined, '', '78%', 78, 0, '0%', '—' safely.
 */
function parsePercentage(val) {
  if (val === null || val === undefined || val === '' || val === '—' || val === '-') {
    return null;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const cleaned = String(val).replace('%', '').trim();
  if (cleaned === '' || cleaned === '—' || cleaned === '-') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Null-safe percentage formatter
 */
function formatPercentage(val) {
  const parsed = parsePercentage(val);
  if (parsed === null) return '—';
  return `${Math.round(parsed * 10) / 10}%`;
}

export default function FacultyAnalytics({ onNavigate, onOpenRagQuery }) {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ totalAssessments: 0, totalAttempts: 0, assessments: [] });
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Attempted' | 'Not Attempted'
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = authService.getCurrentUser();
  const activeFacultyId = currentUser?.id || currentUser?.userId || 'fac-anand';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classes, students, analytics] = await Promise.all([
        facultyAssignmentService.getFacultyAssignedClasses(activeFacultyId),
        facultyAssignmentService.getFacultyAssignedStudents(activeFacultyId),
        assessmentService.getFacultyAssessmentAnalytics(activeFacultyId)
      ]);

      setAssignedClasses(classes || []);
      setAssignedStudents(students || []);
      setAnalyticsData(analytics || { totalAssessments: 0, totalAttempts: 0, assessments: [] });

      if (analytics?.assessments && analytics.assessments.length > 0) {
        setSelectedAssessmentId(prev => {
          const exists = analytics.assessments.some(a => a.id === prev);
          return exists ? prev : analytics.assessments[0].id;
        });
      }
    } catch (err) {
      console.warn('[FacultyAnalytics] Error loading faculty analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFacultyId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('gmrit_assessments_updated', handleUpdate);
      window.addEventListener('gmrit_assignments_updated', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmrit_assessments_updated', handleUpdate);
        window.removeEventListener('gmrit_assignments_updated', handleUpdate);
      }
    };
  }, [loadData]);

  // Selected assessment object for detailed analytics breakdown
  const selectedAsmt = useMemo(() => {
    if (!analyticsData.assessments || analyticsData.assessments.length === 0) return null;
    return analyticsData.assessments.find(a => a.id === selectedAssessmentId) || analyticsData.assessments[0];
  }, [analyticsData, selectedAssessmentId]);

  // Filtered Student Roster for the selected assessment
  const filteredRoster = useMemo(() => {
    if (!selectedAsmt?.studentRoster) return [];
    return selectedAsmt.studentRoster.filter(st => {
      const isAttempted = Boolean(st.hasAttempted || st.status === 'Attempted' || st.status === 'Completed');
      if (statusFilter === 'Attempted' && !isAttempted) return false;
      if (statusFilter === 'Not Attempted' && isAttempted) return false;
      if (studentSearch) {
        const q = studentSearch.toLowerCase().trim();
        const name = (st.name || '').toLowerCase();
        const roll = (st.rollNumber || '').toLowerCase();
        const email = (st.email || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [selectedAsmt, statusFilter, studentSearch]);

  // Dynamic At-Risk Students derived from real attempts (< 50% on attempted assessments)
  const atRiskStudents = useMemo(() => {
    if (!selectedAsmt?.studentRoster) return [];
    return selectedAsmt.studentRoster.filter(st => {
      const isAttempted = Boolean(st.hasAttempted || st.status === 'Attempted' || st.status === 'Completed');
      if (isAttempted) {
        const pct = parsePercentage(st.percentageNum ?? st.percentage);
        return pct !== null && pct < 50;
      }
      return false;
    });
  }, [selectedAsmt]);

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
            Faculty Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Real-time assessment grading, student score distributions, and section performance diagnostics
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery?.(`Analyze the performance distribution for ${selectedAsmt?.title || 'Natural Language Processing'} and generate targeted remediation strategies for students.`)}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Performance Diagnostic</span>
        </button>
      </div>

      {/* Top Level Summary Card (Enrolled Cohort Summary) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Enrolled Cohort Summary</h3>
            <p className="card-subtitle">Real distribution across your assigned classes and academic cohorts</p>
          </div>
          <span className="badge badge-blue">{assignedStudents.length} Students Total</span>
        </div>

        <div style={{ padding: '16px 10px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase' }}>COURSES ASSIGNED</span>
              <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                {assignedClasses.length}
              </p>
            </div>
            <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase' }}>STUDENTS ENROLLED</span>
              <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                {assignedStudents.length}
              </p>
            </div>
            <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase' }}>ASSESSMENTS ACTIVE</span>
              <p style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {analyticsData.totalAssessments}
              </p>
            </div>
            <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase' }}>CURRICULUM REGULATION</span>
              <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                AR23 Autonomous
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ASSESSMENT PERFORMANCE SECTION */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={20} color="var(--color-primary)" />
              Assessment Performance
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
              Select an assessment to view detailed section evaluation and individual student scorecards
            </p>
          </div>

          {/* Assessment Selector Dropdown */}
          {analyticsData.assessments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text)' }}>Assessment:</label>
              <select
                className="input-field"
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                style={{ fontSize: '13px', minWidth: '280px', height: '38px', fontWeight: 600 }}
              >
                {analyticsData.assessments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.branchDisplayName || 'CSE'} • Sec {a.section})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!selectedAsmt ? (
          <div style={{ padding: '30px 0' }}>
            <EmptyState
              icon={Award}
              title="No Published Assessments"
              message="Create and publish an assessment in the Faculty Assessments module to view live performance diagnostics."
              actionText="Go to Assessments"
              onAction={() => onNavigate('assessments')}
            />
          </div>
        ) : (
          <div>
            {/* Assessment Meta Header */}
            <div style={{
              backgroundColor: 'var(--color-bg)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)' }}>
                  {selectedAsmt.title}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.75 }}>
                  Subject: <strong>{selectedAsmt.subjectName}</strong> ({selectedAsmt.subjectCode}) • Target: <strong>{selectedAsmt.branchDisplayName || selectedAsmt.departmentCode || 'CSE'} • {selectedAsmt.year}th Year • Sem {selectedAsmt.semester} • Sec {selectedAsmt.section}</strong> • Due: {selectedAsmt.dueDate ? new Date(selectedAsmt.dueDate).toLocaleDateString() : 'Flexible'}
                </span>
              </div>
              <span className={`badge ${selectedAsmt.status === 'published' ? 'badge-green' : 'badge-orange'}`}>
                {selectedAsmt.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* Metric KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>TOTAL STUDENTS</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
                  {selectedAsmt.totalStudents ?? selectedAsmt.assignedCount ?? 0}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>ATTEMPTED</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                  {selectedAsmt.attemptedCount ?? selectedAsmt.attempted ?? 0}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>NOT ATTEMPTED</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                  {selectedAsmt.notAttemptedCount ?? selectedAsmt.notAttempted ?? 0}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>COMPLETION %</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
                  {selectedAsmt.completionPercentage || (selectedAsmt.completionRate !== undefined ? `${selectedAsmt.completionRate}%` : '0%')}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>AVERAGE SCORE</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {selectedAsmt.averageScore || '—'}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>HIGHEST / LOWEST</span>
                <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                  <span style={{ color: '#10b981' }}>{selectedAsmt.highestScore || '—'}</span> / <span style={{ color: '#ef4444' }}>{selectedAsmt.lowestScore || '—'}</span>
                </p>
              </div>
            </div>

            {/* Score Distribution Chart / Bars */}
            <div style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '16px 20px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '14px' }}>
                Score Distribution
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {[
                  { range: '90–100%', count: selectedAsmt.distribution?.['90-100'] || 0, color: '#10b981' },
                  { range: '80–89%', count: selectedAsmt.distribution?.['80-89'] || 0, color: '#3b82f6' },
                  { range: '70–79%', count: selectedAsmt.distribution?.['70-79'] || 0, color: '#6366f1' },
                  { range: '60–69%', count: selectedAsmt.distribution?.['60-69'] || 0, color: '#f59e0b' },
                  { range: '<60%', count: selectedAsmt.distribution?.['<60'] || 0, color: '#ef4444' }
                ].map(b => (
                  <div key={b.range} style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>{b.range}</span>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: b.color, marginTop: '2px' }}>
                      {b.count} <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7 }}>students</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Student Performance Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)' }}>
                  Individual Student Performance ({filteredRoster.length} Students)
                </h4>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search student or roll number..."
                    className="input-field"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{ fontSize: '12.5px', height: '34px', width: '220px' }}
                  />

                  <select
                    className="input-field"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ fontSize: '12.5px', height: '34px', width: '150px' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Attempted">Attempted</option>
                    <option value="Not Attempted">Not Attempted</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Attempted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoster.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text)', opacity: 0.7 }}>
                          No students matched your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRoster.map((st) => {
                        const isAttempted = Boolean(st.hasAttempted || st.status === 'Attempted' || st.status === 'Completed');
                        const pctVal = parsePercentage(st.percentageNum ?? st.percentage);

                        return (
                          <tr key={st.id || st.userId || st.rollNumber}>
                            <td style={{ fontWeight: 700 }}>{st.name || 'Student'}</td>
                            <td>{st.rollNumber || '—'}</td>
                            <td>
                              <span className={`badge ${isAttempted ? 'badge-green' : 'badge-gray'}`}>
                                {isAttempted ? 'Attempted' : 'Not Attempted'}
                              </span>
                            </td>
                            <td>
                              <strong>{isAttempted ? (st.score || '—') : '—'}</strong>
                            </td>
                            <td>
                              {pctVal !== null ? (
                                <span className={`badge ${pctVal >= 50 ? 'badge-green' : 'badge-orange'}`}>
                                  {formatPercentage(pctVal)}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text)', opacity: 0.5 }}>—</span>
                              )}
                            </td>
                            <td style={{ fontSize: '12px', opacity: 0.75 }}>
                              {st.submittedAt ? new Date(st.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Students Requiring Academic Attention */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
              Students Requiring Academic Attention ({atRiskStudents.length})
            </h3>
          </div>
          <button onClick={() => onNavigate('students')} className="btn btn-secondary btn-sm">
            View All Students
          </button>
        </div>

        {atRiskStudents.length === 0 ? (
          <div style={{ padding: '20px 0' }}>
            <EmptyState
              icon={Award}
              title="All Attempted Students in Good Standing"
              message="No students currently falling below the 50% threshold on active assessments."
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {atRiskStudents.map((st) => {
              const pctFormatted = formatPercentage(st.percentageNum ?? st.percentage);
              return (
                <div key={st.id || st.rollNumber} style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)' }}>{st.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, display: 'block' }}>
                      Roll: {st.rollNumber} • Score: {st.score || '—'} ({pctFormatted})
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenRagQuery?.(`Provide personalized remedial study plan for ${st.name} (Roll: ${st.rollNumber}) who scored ${pctFormatted} in ${selectedAsmt?.title || 'assessment'}`)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11.5px' }}
                  >
                    <Sparkles size={12} />
                    <span>Generate Remedial Plan</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
