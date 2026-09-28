import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, BarChart2, Sparkles, Users, BookOpen } from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import EmptyState from '../common/EmptyState';

export default function FacultyAnalytics({ onNavigate, onOpenRagQuery }) {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [subRes, stdRes] = await Promise.all([
          academicDataService.getSubjects(),
          academicDataService.getStudents()
        ]);
        if (isMounted) {
          setSubjects(subRes?.data || []);
          setStudents(stdRes?.data || []);
        }
      } catch (e) {
        console.warn('Failed to load faculty analytics data:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const atRiskStudents = students.filter(s => s.isAtRisk);

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
            Class performance distribution, unit-wise outcomes, and at-risk early detection
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Analyze overall cohort performance and generate remedial teaching recommendations")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Cohort Diagnostic</span>
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Class Overview Card */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Enrolled Cohort Summary</h3>
              <p className="card-subtitle">Active distribution across assigned courses</p>
            </div>
            <span className="badge badge-blue">{students.length} Students Total</span>
          </div>

          <div style={{ padding: '16px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase' }}>COURSES ASSIGNED</span>
                <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                  {subjects.length}
                </p>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase' }}>STUDENTS ENROLLED</span>
                <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                  {students.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '12px', color: 'var(--color-text)', opacity: 0.8 }}>
            <span>Active Curriculum: <strong>R20 / R23 Autonomous</strong></span>
            <span>RAG System: <strong>Operational</strong></span>
          </div>
        </div>

        {/* Assigned Subjects Overview */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Course Allocations</h3>
              <p className="card-subtitle">Academic subject list</p>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div style={{ padding: '20px 0' }}>
              <EmptyState
                icon={BookOpen}
                title="No Courses Assigned"
                message="No active subject records found."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {subjects.slice(0, 4).map((sub) => (
                <div key={sub.id} style={{
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
                    <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, display: 'block' }}>{sub.code}</span>
                  </div>
                  <span className="badge badge-blue">Credits: {sub.credits || 3}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* At-Risk Students Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
              Students Requiring Academic Attention
            </h3>
          </div>
          <button onClick={() => onNavigate('students')} className="btn btn-secondary btn-sm">
            View All Students
          </button>
        </div>

        {atRiskStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="All Students in Good Academic Standing"
            message="No students currently flagged below the minimum attendance or internal assessment thresholds."
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            marginTop: '12px'
          }}>
            {atRiskStudents.map((std) => (
              <div
                key={std.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text)' }}>
                    {std.user?.full_name || std.name} ({std.roll_number || std.rollNumber})
                  </h4>
                  <p style={{ fontSize: '11.5px', color: 'var(--color-primary)', marginTop: '2px' }}>
                    {std.riskReason || 'Attendance / CIE notice'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('students')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11.5px', padding: '4px 8px' }}
                >
                  Counsel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
