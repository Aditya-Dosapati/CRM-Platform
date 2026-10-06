import React, { useState, useEffect } from 'react';
import { 
  Shield, Cpu, Users, Award, BookOpen, FileText, Database, 
  Activity, CheckCircle2, AlertCircle, ArrowUpRight, Sparkles, 
  UserPlus, UploadCloud, RefreshCw, KeyRound, UserCheck, UserX, Layers, Calendar
} from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';
import facultyAssignmentService from '../../services/facultyAssignmentService';

export default function AdminDashboard({ onNavigate, onOpenRagQuery }) {
  const [stats, setStats] = useState({
    usersCount: 0,
    studentsCount: 0,
    facultyCount: 0,
    departmentsCount: 0,
    subjectsCount: 0,
    documentsCount: 0,
    indexedDocs: 0,
    processingDocs: 0,
    activeFaculty: 0,
    assignedFaculty: 0,
    unassignedFaculty: 0,
    activeSections: 0,
    activeAssignments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      setIsLoading(true);
      try {
        const [users, deptsRes, subsRes, docsRes, assignStats] = await Promise.all([
          Promise.resolve(authService.getAllUsers()),
          academicDataService.getDepartments(),
          academicDataService.getSubjects(),
          ragDocumentService.getDocuments(),
          facultyAssignmentService.getAdminDashboardStats()
        ]);

        if (isMounted) {
          const userList = Array.isArray(users) ? users : [];
          const docs = docsRes?.data || [];
          const depts = deptsRes?.data || [];
          const subs = subsRes?.data || [];

          const stdCount = userList.filter(u => u.role === 'student').length;
          const facCount = userList.filter(u => u.role === 'faculty').length;
          const indexed = docs.filter(d => (d.rawStatus || d.status) === 'indexed').length;
          const processing = docs.filter(d => (d.rawStatus || d.status) === 'processing').length;

          setStats({
            usersCount: userList.length,
            studentsCount: stdCount,
            facultyCount: facCount,
            departmentsCount: depts.length,
            subjectsCount: subs.length,
            documentsCount: docs.length,
            indexedDocs: indexed,
            processingDocs: processing,
            activeFaculty: assignStats.activeFaculty,
            assignedFaculty: assignStats.assignedFaculty,
            unassignedFaculty: assignStats.unassignedFaculty,
            activeSections: assignStats.activeSections,
            activeAssignments: assignStats.activeAssignments
          });
        }
      } catch (err) {
        console.warn('Error loading admin dashboard stats:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="page-content">
      {/* Header */}
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
            Administration Console
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Manage the complete GMRIT academic ecosystem, faculty assignments, and AI RAG knowledge infrastructure
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('faculty-assignments')} className="btn btn-secondary btn-sm">
            <UserCheck size={14} />
            <span>Faculty Assignments</span>
          </button>
          <button onClick={() => onNavigate('users')} className="btn btn-secondary btn-sm">
            <Users size={14} />
            <span>Provision Users</span>
          </button>
          <button onClick={() => onNavigate('rag-base')} className="btn btn-primary btn-sm">
            <Cpu size={14} />
            <span>RAG Control Center</span>
          </button>
        </div>
      </div>

      {/* Admin Assignment Statistics Banner */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.2px', margin: 0 }}>
            Faculty & Class Assignment Metrics
          </h2>
          <button
            onClick={() => onNavigate('faculty-assignments')}
            className="btn btn-subtle btn-sm"
            style={{ fontSize: '11.5px', padding: '2px 8px' }}
          >
            Manage Assignments →
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Active Faculty */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                ACTIVE FACULTY
              </span>
              <Users size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.activeFaculty}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, marginTop: '3px' }}>
              Verified Staff
            </div>
          </div>

          {/* Assigned Faculty */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                ASSIGNED FACULTY
              </span>
              <UserCheck size={14} style={{ color: '#059669' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.assignedFaculty}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, marginTop: '3px' }}>
              Teaching ≥ 1 Section
            </div>
          </div>

          {/* Unassigned Faculty */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                UNASSIGNED FACULTY
              </span>
              <UserX size={14} style={{ color: '#ea580c' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.unassignedFaculty}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, marginTop: '3px' }}>
              Available for Schedule
            </div>
          </div>

          {/* Active Sections */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                ACTIVE SECTIONS
              </span>
              <Layers size={14} style={{ color: '#7c3aed' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.activeSections}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, marginTop: '3px' }}>
              Scheduled Cohorts
            </div>
          </div>

          {/* Subject Assignments */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                SUBJECT ASSIGNMENTS
              </span>
              <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.activeAssignments}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, marginTop: '3px' }}>
              Active Database Records
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards - 4 System Metrics */}
      <div className="kpi-grid">
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL USERS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
              {isLoading ? '...' : stats.usersCount}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              {stats.studentsCount} Students • {stats.facultyCount} Faculty
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DEPARTMENTS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
              {isLoading ? '...' : stats.departmentsCount}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              Active Engineering Branches
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              COURSES & SUBJECTS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
              {isLoading ? '...' : stats.subjectsCount}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              R20 & R23 Regulations
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              RAG DOCUMENTS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
              {isLoading ? '...' : stats.documentsCount}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              {stats.indexedDocs} Indexed • {stats.processingDocs} In-Flight
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px', letterSpacing: '-0.2px' }}>
          Administrative Quick Actions
        </h2>
        <div className="quick-actions-grid">
          <div
            className="quick-action-card"
            onClick={() => onNavigate('faculty-assignments')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--color-bg)', color: 'var(--color-primary)' }}>
              <UserCheck size={18} />
            </div>
            <div>
              <div className="quick-action-title">Assign Faculty</div>
              <div className="quick-action-desc">Map faculty to subjects & sections</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('users')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--color-bg)', color: 'var(--color-primary)' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <div className="quick-action-title">Provision User</div>
              <div className="quick-action-desc">Issue credentials for students & staff</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('syllabus')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--color-bg)', color: 'var(--color-accent)' }}>
              <UploadCloud size={18} />
            </div>
            <div>
              <div className="quick-action-title">Manage Syllabus</div>
              <div className="quick-action-desc">BOS curriculum R20 / R23 PDFs</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('rag-base')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--color-bg)', color: 'var(--color-primary)' }}>
              <RefreshCw size={18} />
            </div>
            <div>
              <div className="quick-action-title">RAG Ingestion Center</div>
              <div className="quick-action-desc">Upload & manage documents in Supabase</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('analytics')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--color-bg)', color: 'var(--color-accent)' }}>
              <Activity size={18} />
            </div>
            <div>
              <div className="quick-action-title">Campus Telemetry</div>
              <div className="quick-action-desc">Cross-department analytics & adoption</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time System Telemetry & Vector DB Infrastructure */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '18px',
        marginBottom: '22px'
      }}>
        {/* Vector DB & AI Pipeline Health */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-header" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <Cpu size={16} />
              </div>
              <div>
                <h3 className="card-title">Vector Knowledge Infrastructure</h3>
                <p className="card-subtitle">IntFloat Multilingual-E5 • HNSW Cosine Distance (384d)</p>
              </div>
            </div>

            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} />
              <span>Operational</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '14px' }}>
            <div style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.65 }}>Indexed Knowledge</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                {stats.indexedDocs} Docs
              </div>
              <div style={{ fontSize: '10.5px', color: '#059669', marginTop: '2px' }}>✓ RAG Active</div>
            </div>

            <div style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.65 }}>In-Flight Embeddings</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
                {stats.processingDocs} Jobs
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.5, marginTop: '2px' }}>Background worker</div>
            </div>

            <div style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.65 }}>Vector DB Dimensions</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-accent)', marginTop: '2px' }}>
                384 Dim
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.5, marginTop: '2px' }}>HNSW indexing</div>
            </div>
          </div>
        </div>

        {/* Security & Access Summary */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-header" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: 'var(--color-primary)' }} />
              <h3 className="card-title">Governance & RBAC</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>Auth Provider</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Supabase Auth</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>RLS Security</span>
              <span className="badge badge-green" style={{ fontSize: '10.5px' }}>Enforced</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>Audit Logging</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Active (Immutable)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '6px 0' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>Curriculum Engine</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>AR23 / R20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
