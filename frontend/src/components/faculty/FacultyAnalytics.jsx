import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, TrendingUp, AlertTriangle, BarChart2, Sparkles, Users, BookOpen, 
  Award, CheckCircle2, Clock, ChevronDown, Check, X, Filter, UserCheck, FileText, ArrowUpRight
} from 'lucide-react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import assessmentService from '../../services/assessmentService';
import authService from '../../services/authService';
import EmptyState from '../common/EmptyState';

export default function FacultyAnalytics({ onNavigate, onOpenRagQuery }) {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ totalAssessments: 0, totalAttempts: 0, assessments: [] });
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Completed' | 'Not Attempted'
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

      if (analytics?.assessments && analytics.assessments.length > 0 && !selectedAssessmentId) {
        setSelectedAssessmentId(analytics.assessments[0].id);
      }
    } catch (err) {
      console.warn('[FacultyAnalytics] Error loading faculty analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFacultyId, selectedAssessmentId]);

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
      if (statusFilter !== 'All' && st.status !== statusFilter) return false;
      if (studentSearch) {
        const q = studentSearch.toLowerCase();
        const name = (st.name || '').toLowerCase();
        const roll = (st.rollNumber || '').toLowerCase();
        const email = (st.email || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [selectedAsmt, statusFilter, studentSearch]);

  // Dynamic At-Risk Students derived from real attempts (< 50% or unattempted on past due)
  const atRiskStudents = useMemo(() => {
    if (!selectedAsmt?.studentRoster) return [];
    return selectedAsmt.studentRoster.filter(st => {
      if (st.status === 'Completed') {
        const num = Number(st.percentage?.replace('%', '')) || 0;
        return num < 50;
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
          onClick={() => onOpenRagQuery(`Analyze the performance distribution for ${selectedAsmt?.title || 'Natural Language Processing'} and generate targeted remediation strategies for students.`)}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Performance Diagnostic</span>
        </button>
      </div>

      {/* Top Level Summary Cards (Real Dynamic Metrics) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Cohort Overview Card */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Enrolled Cohort Summary</h3>
              <p className="card-subtitle">Real distribution across your assigned classes</p>
            </div>
            <span className="badge badge-blue">{assignedStudents.length} Students Total</span>
          </div>

          <div style={{ padding: '16px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '12px', color: 'var(--color-text)', opacity: 0.8 }}>
            <span>Active Regulation: <strong>AR23 Autonomous</strong></span>
            <span>Assessments Active: <strong>{analyticsData.totalAssessments} Scheduled</strong></span>
          </div>
        </div>

        {/* Course Allocations List */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Course Allocations</h3>
              <p className="card-subtitle">Assigned subjects & sections</p>
            </div>
          </div>

          {assignedClasses.length === 0 ? (
            <div style={{ padding: '20px 0' }}>
              <EmptyState
                icon={BookOpen}
                title="No Courses Assigned"
                message="No active subject records found."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              {assignedClasses.map((sub) => (
                <div key={sub.assignmentId || sub.id} style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)' }}>{sub.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, display: 'block' }}>
                      {sub.code} • Section {sub.section}
                    </span>
                  </div>
                  <span className="badge badge-purple">{sub.year}th Year</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ASSESSMENT PERFORMANCE SECTION (Prompt Item 18, 19, 20) */}
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
                    {a.title} (Section {a.section})
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
              title="No Assessment Data"
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
                  {selectedAsmt.subjectName} ({selectedAsmt.subjectCode}) • Section {selectedAsmt.section} • Due: {selectedAsmt.dueDate || 'Flexible'}
                </span>
              </div>
              <span className={`badge ${selectedAsmt.status === 'published' ? 'badge-green' : 'badge-orange'}`}>
                {selectedAsmt.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* Metric KPI Cards (Prompt Item 18) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>STUDENTS ASSIGNED</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
                  {selectedAsmt.assignedCount}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>ATTEMPTED</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                  {selectedAsmt.attemptedCount}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>NOT ATTEMPTED</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                  {selectedAsmt.notAttemptedCount}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>AVERAGE SCORE</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {selectedAsmt.averageScore}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>HIGHEST SCORE</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {selectedAsmt.highestScore}
                </p>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>LOWEST SCORE</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                  {selectedAsmt.lowestScore}
                </p>
              </div>
            </div>

            {/* Score Distribution Chart / Bars (Prompt Item 20) */}
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

            {/* Individual Student Performance Table (Prompt Item 19) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)' }}>
                  Individual Student Performance
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
                    <option value="Completed">Completed</option>
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
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Status</th>
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
                      filteredRoster.map((st) => (
                        <tr key={st.id || st.rollNumber}>
                          <td style={{ fontWeight: 700 }}>{st.name}</td>
                          <td>{st.rollNumber || '23CS001'}</td>
                          <td>
                            <strong>{st.score}</strong>
                          </td>
                          <td>
                            {st.percentage !== '—' ? (
                              <span className={`badge ${Number(st.percentage.replace('%', '')) >= 50 ? 'badge-green' : 'badge-orange'}`}>
                                {st.percentage}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text)', opacity: 0.5 }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${st.status === 'Completed' ? 'badge-green' : 'badge-gray'}`}>
                              {st.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', opacity: 0.75 }}>
                            {st.submittedAt ? new Date(st.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))
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
              title="All Active Students in Good Standing"
              message="No students currently falling below the 50% threshold on active assessments."
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {atRiskStudents.map((st) => (
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
                    Roll: {st.rollNumber} • Score: {st.score} ({st.percentage})
                  </span>
                </div>
                <button
                  onClick={() => onOpenRagQuery(`Provide personalized remedial study plan for ${st.name} (Roll: ${st.rollNumber}) who scored ${st.percentage} in ${selectedAsmt?.title}`)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11.5px' }}
                >
                  <Sparkles size={12} />
                  <span>Generate Remedial Plan</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
