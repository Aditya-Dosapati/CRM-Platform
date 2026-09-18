import React from 'react';
import { facultyClasses, facultyStudentRoster } from '../../data/mockData';
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
  FileText
} from 'lucide-react';

export default function FacultyDashboard({ onNavigate, onOpenRagQuery }) {
  const atRiskCount = facultyStudentRoster.filter(s => s.isAtRisk).length;

  return (
    <div className="page-content">
      {/* 4 Vibrant Pastel KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-label">Students</span>
            <div className="kpi-icon-wrap">
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value">184</div>
          <div className="kpi-trend neutral" style={{ color: 'var(--pastel-blue-text)' }}>
            <span>Across 3 Assigned Sections</span>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-label">Average Performance</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">78.6%</div>
          <div className="kpi-trend positive">
            <span>↑ 3.2% vs last cycle</span>
          </div>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-top">
            <span className="kpi-label">Attendance</span>
            <div className="kpi-icon-wrap">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">87.4%</div>
          <div className="kpi-trend positive" style={{ color: 'var(--pastel-orange-text)' }}>
            <span>Above 75% threshold</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-label">Active Assessments</span>
            <div className="kpi-icon-wrap">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="kpi-value">12</div>
          <div className="kpi-trend neutral" style={{ color: 'var(--pastel-purple-text)' }}>
            <span>Quiz 4 closing tomorrow</span>
          </div>
        </div>
      </div>

      {/* Quick Actions (Four Colorful Pastel Cards) */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.2px' }}>
          Quick Actions
        </h2>
        <div className="quick-actions-grid">
          <div
            className="quick-action-card"
            style={{ backgroundColor: 'var(--pastel-blue-bg)', borderColor: 'var(--pastel-blue-border)' }}
            onClick={() => onNavigate('assessments')}
          >
            <div className="quick-action-icon" style={{ color: 'var(--primary-blue)' }}>
              <Plus size={18} />
            </div>
            <div>
              <div className="quick-action-title">Create Assessment</div>
              <div className="quick-action-desc">Publish quizzes & tests</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            style={{ backgroundColor: 'var(--pastel-purple-bg)', borderColor: 'var(--pastel-purple-border)' }}
            onClick={() => onNavigate('resources')}
          >
            <div className="quick-action-icon" style={{ color: 'var(--pastel-purple-text)' }}>
              <FolderArchive size={18} />
            </div>
            <div>
              <div className="quick-action-title">Upload Resource</div>
              <div className="quick-action-desc">Handouts, notes & slides</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            style={{ backgroundColor: 'var(--pastel-green-bg)', borderColor: 'var(--pastel-green-border)' }}
            onClick={() => onNavigate('students')}
          >
            <div className="quick-action-icon" style={{ color: 'var(--success)' }}>
              <Users size={18} />
            </div>
            <div>
              <div className="quick-action-title">View Students</div>
              <div className="quick-action-desc">Track cohort attendance & marks</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            style={{ backgroundColor: 'var(--pastel-orange-bg)', borderColor: 'var(--pastel-orange-border)' }}
            onClick={() => onNavigate('analytics')}
          >
            <div className="quick-action-icon" style={{ color: 'var(--gmr-orange)' }}>
              <BarChart2 size={18} />
            </div>
            <div>
              <div className="quick-action-title">View Analytics</div>
              <div className="quick-action-desc">At-risk matrix & outcomes</div>
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Alert Banner */}
      <div
        className="card-interactive"
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--pastel-orange-bg)',
          border: '1px solid var(--pastel-orange-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px',
          transition: 'all 0.18s var(--ease-spring)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gmr-orange)',
            boxShadow: 'var(--shadow-xs)',
            flexShrink: 0
          }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              ⚠ {atRiskCount} students are below the academic performance threshold
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Attendance &lt; 75% or continuous assessment average &lt; 50%. Counseling advised.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('students')}
          className="btn btn-primary btn-sm"
          style={{ backgroundColor: 'var(--gmr-orange)', borderColor: 'var(--gmr-orange)' }}
        >
          <span>View Students</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Class & Section Overview */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.2px' }}>
          Class & Section Overview
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '14px'
        }}>
          {facultyClasses.map((cls, idx) => (
            <div key={cls.id} className={`card card-interactive stagger-${idx + 1}`} style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span className="badge badge-blue">{cls.subject}</span>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {cls.name}
                  </h3>
                </div>
                <span className={`badge ${cls.status === 'On Schedule' ? 'badge-green' : 'badge-yellow'}`}>
                  {cls.status}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: '10px',
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '14px'
              }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ENROLLED</span>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{cls.studentsCount}</p>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>AVERAGE</span>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-blue)' }}>{cls.averageMarks}</p>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ATTENDANCE</span>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)' }}>{cls.attendance}</p>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ASSESSMENTS</span>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{cls.assessmentsCount} Active</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => onNavigate('students')} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  View Roster
                </button>
                <button onClick={() => onNavigate('analytics')} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
