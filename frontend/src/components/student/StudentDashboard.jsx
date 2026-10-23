import React, { useState, useEffect } from 'react';
import {
  TrendingUp, UserCheck, CheckSquare, Award, Sparkles, FileText, 
  HelpCircle, Clock, Calendar, ChevronRight, BookOpen, Code2, 
  Terminal, ArrowRight, Play, CheckCircle2, AlertCircle, Bookmark,
  Layers, ExternalLink
} from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import authService from '../../services/authService';
import codeExecutionService from '../../services/codeExecutionService';
import auditService from '../../services/auditService';
import { codingProblemsList } from '../../data/codingData';
import EmptyState from '../common/EmptyState';

export default function StudentDashboard({ onNavigate, onOpenRagQuery }) {
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [facultyAssessments, setFacultyAssessments] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await academicDataService.getSubjects();
        if (isMounted && res.data) {
          setSubjects(res.data);
        }
      } catch (err) {
        console.warn('StudentDashboard: could not load dynamic subjects:', err);
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    };

    // Load user and assessment stats
    setCurrentUser(authService.getCurrentUser());
    const solved = codeExecutionService.getSolvedProblems();
    setSolvedProblems(solved);

    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('gmrit_faculty_assessments');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setFacultyAssessments(parsed);
        }
      }
    } catch (e) {
      console.warn('StudentDashboard: error reading assessments:', e);
    }

    // Load recent activity from audit service
    const logs = auditService.getLogs();
    setRecentLogs(logs.slice(0, 4));

    fetchDashboardSubjects();
    return () => { isMounted = false; };
  }, []);

  const hasSubjects = subjects && subjects.length > 0;
  const activeSubject = hasSubjects ? subjects[0] : null;
  const studentCgpa = currentUser?.cgpa || (hasSubjects ? '8.42' : '—');
  const studentAttendance = currentUser?.attendance ? `${currentUser.attendance}%` : (hasSubjects ? '91%' : '—');
  const studentAttendanceStatus = currentUser?.attendanceStatus || (hasSubjects ? 'Good Standing' : 'Tracking Pending');
  const overallPerformance = studentCgpa !== '—'
    ? `${(parseFloat(studentCgpa) * 9.75).toFixed(1)}%`
    : (hasSubjects ? '82.4%' : '—');

  const scheduledAssessments = facultyAssessments.filter(a => a.status === 'Scheduled');
  const assessmentsDisplay = scheduledAssessments.length > 0
    ? `${scheduledAssessments.length} Scheduled`
    : (solvedProblems.length > 0 ? `${solvedProblems.length} Solved` : '0 Scheduled');

  const displayName = currentUser?.name || 'Rahul Kumar';
  const recommendedProblem = codingProblemsList[0] || {
    id: 'prob-1',
    title: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy'
  };

  return (
    <div className="page-content">
      
      {/* 1. WELCOME HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Portal • Semester 4 Active
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
            Good day, {displayName} 👋
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Continue your academic curriculum and coding assessment journey.
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery && onOpenRagQuery("Help me prepare revision notes for my upcoming Semester 4 assessments")}
          className="btn btn-sm"
          style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            color: '#C2410C',
            border: '1px solid #FED7AA',
            fontWeight: 700,
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '9px',
            boxShadow: '0 1px 3px rgba(234, 88, 12, 0.12)'
          }}
        >
          <Sparkles size={15} color="#EA580C" />
          <span>Ask AI Study Copilot</span>
        </button>
      </div>

      {/* 2. CONTINUE LEARNING HERO BANNER */}
      {activeSubject && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          padding: '22px 26px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            bottom: 0,
            background: 'linear-gradient(180deg, #EA580C 0%, #C2410C 100%)'
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-blue">
                Active Course
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activeSubject.code} • Unit 3
              </span>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: '0 0 6px' }}>
              {activeSubject.name}
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Next Unit Topic: <strong>Dynamic Programming & Optimal Substructure</strong>
            </p>

            <div style={{ marginTop: '12px', maxWidth: '380px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Curriculum Completion</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>68% Completed</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: '68%' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => onNavigate('subjects')}
              className="btn btn-primary"
              style={{ padding: '10px 20px', gap: '8px' }}
            >
              <Play size={15} fill="#FFFFFF" />
              <span>Continue Learning →</span>
            </button>
            <button
              onClick={() => onNavigate('syllabus')}
              className="btn btn-secondary"
            >
              <FileText size={15} />
              <span>Syllabus</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. 5 ACADEMIC KPI CARDS */}
      <div className="kpi-grid">
        {/* Overall Performance */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Overall Performance</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? overallPerformance : '—'}</div>
          <div className="kpi-trend positive">
            <span>{hasSubjects ? '↑ Active Semester (CIE)' : 'No graded evaluations'}</span>
          </div>
        </div>

        {/* Attendance */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Attendance</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)', borderColor: 'var(--pastel-green-border)' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? studentAttendance : '—'}</div>
          <div className="kpi-trend positive">
            <span>{studentAttendanceStatus}</span>
          </div>
        </div>

        {/* Assessments */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Assessments</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--pastel-yellow-bg)', color: 'var(--pastel-yellow-text)', borderColor: 'var(--pastel-yellow-border)' }}>
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">{assessmentsDisplay}</div>
          <div className="kpi-trend neutral">
            <span>{scheduledAssessments.length > 0 ? 'Due Next Week' : 'Continuous CIE'}</span>
          </div>
        </div>

        {/* Current CGPA */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Current CGPA</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)', borderColor: 'var(--pastel-purple-border)' }}>
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? studentCgpa : '—'}</div>
          <div className="kpi-trend positive">
            <span>{hasSubjects ? 'Institutional Scale' : 'Cumulative'}</span>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Registered Courses</span>
            <div className="kpi-icon-wrap">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="kpi-value">{hasSubjects ? `${subjects.length} Subjects` : '0 Courses'}</div>
          <div className="kpi-trend neutral">
            <span>R20 Regulation</span>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTION SHORTCUT TILES */}
      <div style={{ marginBottom: '26px' }}>
        <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Quick Workspaces
        </h3>
        <div className="quick-actions-grid">
          <div className="quick-action-card" onClick={() => onNavigate('subjects')}>
            <div className="quick-action-icon">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="quick-action-title">My Subjects</div>
              <div className="quick-action-desc">Explore units & lecture notes</div>
            </div>
          </div>

          <div className="quick-action-card" onClick={() => onNavigate('coding-practice')}>
            <div className="quick-action-icon" style={{ backgroundColor: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)', borderColor: 'var(--pastel-green-border)' }}>
              <Code2 size={18} />
            </div>
            <div>
              <div className="quick-action-title">Coding Practice</div>
              <div className="quick-action-desc">{solvedProblems.length} Problems Solved</div>
            </div>
          </div>

          <div className="quick-action-card" onClick={() => onNavigate('pyqs')}>
            <div className="quick-action-icon" style={{ backgroundColor: 'var(--pastel-yellow-bg)', color: 'var(--pastel-yellow-text)', borderColor: 'var(--pastel-yellow-border)' }}>
              <HelpCircle size={18} />
            </div>
            <div>
              <div className="quick-action-title">PYQ Question Bank</div>
              <div className="quick-action-desc">Previous semester exam papers</div>
            </div>
          </div>

          <div className="quick-action-card" onClick={() => onNavigate('assessments')}>
            <div className="quick-action-icon" style={{ backgroundColor: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)', borderColor: 'var(--pastel-purple-border)' }}>
              <CheckSquare size={18} />
            </div>
            <div>
              <div className="quick-action-title">Assessments</div>
              <div className="quick-action-desc">CIE quizzes & lab practicals</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SPLIT SECTION: TODAY'S LEARNING & RECENT ACTIVITY */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        
        {/* LEFT: Today's Recommendations */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Sparkles size={16} color="var(--primary-blue)" />
                <span>Today's Learning Focus</span>
              </h3>
              <p className="card-subtitle">Personalized algorithmic & curriculum tasks</p>
            </div>
          </div>

          {/* Recommended Problem Tile */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-light)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--pastel-green-bg)',
                color: 'var(--pastel-green-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Code2 size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {recommendedProblem.title}
                  </span>
                  <span className="badge badge-green" style={{ fontSize: '10.5px' }}>
                    {recommendedProblem.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Topic: {recommendedProblem.topic} • Core DSA Practice
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('coding-practice')}
              className="btn btn-secondary btn-sm"
            >
              <span>Solve →</span>
            </button>
          </div>

          {/* AI Quick Inquiry Chip */}
          <div 
            onClick={() => onOpenRagQuery && onOpenRagQuery("What are the most frequent 10-mark questions in Design and Analysis of Algorithms?")}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--pastel-blue-bg)',
              border: '1px solid var(--pastel-blue-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--pastel-blue-text)', fontWeight: 600 }}>
              <Sparkles size={16} />
              <span>Ask AI: Frequent 10-mark questions in DAA</span>
            </div>
            <ChevronRight size={15} color="var(--primary-blue)" />
          </div>
        </div>

        {/* RIGHT: Recent Activity Timeline */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Clock size={16} color="var(--primary-blue)" />
                <span>Recent Academic Activity</span>
              </h3>
              <p className="card-subtitle">Your submissions, logins, and test events</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentLogs.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '10px 0' }}>
                No recent activity recorded yet.
              </p>
            ) : (
              recentLogs.map((log) => (
                <div 
                  key={log.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: log.result === 'Success' ? 'var(--pastel-green-bg)' : 'var(--pastel-blue-bg)',
                    color: log.result === 'Success' ? 'var(--pastel-green-text)' : 'var(--pastel-blue-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {log.result === 'Success' ? <CheckCircle2 size={14} /> : <Bookmark size={14} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {log.formattedTime}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                      {log.details || log.resource}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
