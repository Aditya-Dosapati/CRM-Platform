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

    const handleUpdate = () => {
      if (isMounted) loadStats();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gmrit_users_updated', handleUpdate);
      window.addEventListener('gmrit_assignments_updated', handleUpdate);
    }

    return () => { 
      isMounted = false; 
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmrit_users_updated', handleUpdate);
        window.removeEventListener('gmrit_assignments_updated', handleUpdate);
      }
    };
  }, []);

  return (
    <div className="page-content admin-dashboard-page" style={{ paddingBottom: '60px' }}>
      {/* Prominent Admin Header Section */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '32px',
        paddingTop: '6px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ minWidth: 0, flex: 1, maxWidth: '820px' }}>
          <h1 style={{ 
            fontSize: 'clamp(28px, 3.4vw, 38px)', 
            fontWeight: 800, 
            color: 'var(--color-text)', 
            letterSpacing: '-0.8px',
            lineHeight: 1.15,
            margin: 0 
          }}>
            Administration Console
          </h1>
          <p style={{ 
            fontSize: 'clamp(14.5px, 1.35vw, 17px)', 
            color: 'var(--color-text)', 
            opacity: 0.75, 
            marginTop: '8px',
            lineHeight: 1.55,
            fontWeight: 450
          }}>
            Manage the complete GMRIT academic ecosystem, faculty assignments, and AI RAG knowledge infrastructure
          </p>
        </div>

        {/* Action Buttons with Comfortable Sizing & Clear Hierarchy */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={() => onNavigate('faculty-assignments')} 
            className="btn btn-secondary"
            style={{ 
              padding: '10px 18px', 
              fontSize: '13.5px', 
              fontWeight: 600, 
              gap: '8px',
              minHeight: '40px' 
            }}
          >
            <UserCheck size={16} />
            <span>Faculty Assignments</span>
          </button>
          <button 
            onClick={() => onNavigate('users')} 
            className="btn btn-secondary"
            style={{ 
              padding: '10px 18px', 
              fontSize: '13.5px', 
              fontWeight: 600, 
              gap: '8px',
              minHeight: '40px' 
            }}
          >
            <Users size={16} />
            <span>Provision Users</span>
          </button>
          <button 
            onClick={() => onNavigate('rag-base')} 
            className="btn btn-primary"
            style={{ 
              padding: '10px 20px', 
              fontSize: '13.5px', 
              fontWeight: 600, 
              gap: '8px',
              minHeight: '40px' 
            }}
          >
            <Cpu size={16} />
            <span>RAG Control Center</span>
          </button>
        </div>
      </div>

      {/* Section 1: Admin Assignment Statistics Banner */}
      <div style={{ marginBottom: '34px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ 
            fontSize: 'clamp(18px, 1.8vw, 23px)', 
            fontWeight: 700, 
            color: 'var(--color-text)', 
            letterSpacing: '-0.4px', 
            margin: 0 
          }}>
            Faculty & Class Assignment Metrics
          </h2>
          <button
            onClick={() => onNavigate('faculty-assignments')}
            className="btn btn-secondary btn-sm"
            style={{ 
              fontSize: '13px', 
              padding: '6px 14px', 
              fontWeight: 600,
              gap: '6px' 
            }}
          >
            Manage Assignments →
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}>
          {/* Active Faculty */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ACTIVE FACULTY
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(26px, 2.4vw, 32px)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.activeFaculty}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.65, marginTop: '6px', fontWeight: 500 }}>
              Verified Staff
            </div>
          </div>

          {/* Assigned Faculty */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ASSIGNED FACULTY
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(5, 150, 105, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}>
                <UserCheck size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(26px, 2.4vw, 32px)', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.assignedFaculty}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.65, marginTop: '6px', fontWeight: 500 }}>
              Teaching ≥ 1 Section
            </div>
          </div>

          {/* Unassigned Faculty */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                UNASSIGNED FACULTY
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(234, 88, 12, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c'
              }}>
                <UserX size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(26px, 2.4vw, 32px)', fontWeight: 800, color: '#ea580c', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.unassignedFaculty}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.65, marginTop: '6px', fontWeight: 500 }}>
              Available for Schedule
            </div>
          </div>

          {/* Active Sections */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ACTIVE SECTIONS
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(124, 58, 237, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed'
              }}>
                <Layers size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(26px, 2.4vw, 32px)', fontWeight: 800, color: '#7c3aed', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.activeSections}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.65, marginTop: '6px', fontWeight: 500 }}>
              Scheduled Cohorts
            </div>
          </div>

          {/* Subject Assignments */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SUBJECT ASSIGNMENTS
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <BookOpen size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(26px, 2.4vw, 32px)', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.1 }}>
              {isLoading ? '...' : stats.activeAssignments}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.65, marginTop: '6px', fontWeight: 500 }}>
              Active Database Records
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Main System KPI Cards - 4 Overview Metrics */}
      <div style={{ marginBottom: '34px' }}>
        <h2 style={{ 
          fontSize: 'clamp(18px, 1.8vw, 23px)', 
          fontWeight: 700, 
          color: 'var(--color-text)', 
          marginBottom: '16px', 
          letterSpacing: '-0.4px' 
        }}>
          System Architecture & Resource Telemetry
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {/* Total Users Card */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                TOTAL USERS
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(28px, 2.8vw, 35px)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {isLoading ? '...' : stats.usersCount}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '6px', fontWeight: 500 }}>
                {stats.studentsCount} Students • {stats.facultyCount} Faculty
              </div>
            </div>
          </div>

          {/* Departments Card */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                DEPARTMENTS
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(169, 74, 42, 0.08)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(28px, 2.8vw, 35px)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {isLoading ? '...' : stats.departmentsCount}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '6px', fontWeight: 500 }}>
                Active Engineering Branches
              </div>
            </div>
          </div>

          {/* Courses & Subjects Card */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                COURSES & SUBJECTS
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(28px, 2.8vw, 35px)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {isLoading ? '...' : stats.subjectsCount}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '6px', fontWeight: 500 }}>
                R20 & R23 Regulations
              </div>
            </div>
          </div>

          {/* RAG Documents Card */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                RAG DOCUMENTS
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(169, 74, 42, 0.08)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(28px, 2.8vw, 35px)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {isLoading ? '...' : stats.documentsCount}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '6px', fontWeight: 500 }}>
                {stats.indexedDocs} Indexed • {stats.processingDocs} In-Flight
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Admin Quick Actions */}
      <div style={{ marginBottom: '34px' }}>
        <h2 style={{ 
          fontSize: 'clamp(18px, 1.8vw, 23px)', 
          fontWeight: 700, 
          color: 'var(--color-text)', 
          marginBottom: '16px', 
          letterSpacing: '-0.4px' 
        }}>
          Administrative Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px'
        }}>
          <div
            className="quick-action-card"
            onClick={() => onNavigate('faculty-assignments')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', padding: '16px 18px' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--primary-light)', color: 'var(--color-primary)', width: '42px', height: '42px' }}>
              <UserCheck size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="quick-action-title" style={{ fontSize: '14.5px', fontWeight: 700 }}>Assign Faculty</div>
              <div className="quick-action-desc" style={{ fontSize: '12.5px', marginTop: '3px' }}>Map faculty to subjects & sections</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('users')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', padding: '16px 18px' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--primary-light)', color: 'var(--color-primary)', width: '42px', height: '42px' }}>
              <UserPlus size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="quick-action-title" style={{ fontSize: '14.5px', fontWeight: 700 }}>Provision User</div>
              <div className="quick-action-desc" style={{ fontSize: '12.5px', marginTop: '3px' }}>Issue credentials for students & staff</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('syllabus')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', padding: '16px 18px' }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(169, 74, 42, 0.08)', color: 'var(--color-accent)', width: '42px', height: '42px' }}>
              <UploadCloud size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="quick-action-title" style={{ fontSize: '14.5px', fontWeight: 700 }}>Manage Syllabus</div>
              <div className="quick-action-desc" style={{ fontSize: '12.5px', marginTop: '3px' }}>BOS curriculum R20 / R23 PDFs</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('rag-base')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', padding: '16px 18px' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--primary-light)', color: 'var(--color-primary)', width: '42px', height: '42px' }}>
              <RefreshCw size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="quick-action-title" style={{ fontSize: '14.5px', fontWeight: 700 }}>RAG Ingestion Center</div>
              <div className="quick-action-desc" style={{ fontSize: '12.5px', marginTop: '3px' }}>Upload & vectorize knowledge docs</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('analytics')}
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', padding: '16px 18px' }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(169, 74, 42, 0.08)', color: 'var(--color-accent)', width: '42px', height: '42px' }}>
              <Activity size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="quick-action-title" style={{ fontSize: '14.5px', fontWeight: 700 }}>Campus Telemetry</div>
              <div className="quick-action-desc" style={{ fontSize: '12.5px', marginTop: '3px' }}>Cross-department analytics & adoption</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Real-time System Telemetry & Vector DB Infrastructure */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px'
      }}>
        {/* Vector DB & AI Pipeline Health */}
        <div className="card admin-telemetry-col-main" style={{ gridColumn: 'span 8', padding: '24px 26px' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="card-title" style={{ fontSize: '17px', fontWeight: 700 }}>Vector Knowledge Infrastructure</h3>
                <p className="card-subtitle" style={{ fontSize: '13px', marginTop: '3px' }}>IntFloat Multilingual-E5 • HNSW Cosine Distance (384d)</p>
              </div>
            </div>

            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '4px 10px' }}>
              <CheckCircle2 size={13} />
              <span>Operational</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginTop: '16px' }}>
            <div style={{ padding: '16px 18px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, fontWeight: 600 }}>Indexed Knowledge</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px', lineHeight: 1.1 }}>
                {stats.indexedDocs} Docs
              </div>
              <div style={{ fontSize: '11.5px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>✓ RAG Active</div>
            </div>

            <div style={{ padding: '16px 18px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, fontWeight: 600 }}>In-Flight Embeddings</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px', lineHeight: 1.1 }}>
                {stats.processingDocs} Jobs
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.55, marginTop: '4px', fontWeight: 500 }}>Background worker</div>
            </div>

            <div style={{ padding: '16px 18px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, fontWeight: 600 }}>Vector DB Dimensions</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)', marginTop: '4px', lineHeight: 1.1 }}>
                384 Dim
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.55, marginTop: '4px', fontWeight: 500 }}>HNSW indexing</div>
            </div>
          </div>
        </div>

        {/* Security & Access Summary */}
        <div className="card admin-telemetry-col-side" style={{ gridColumn: 'span 4', padding: '24px 26px' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={19} style={{ color: 'var(--color-primary)' }} />
              <h3 className="card-title" style={{ fontSize: '17px', fontWeight: 700 }}>Governance & RBAC</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>Auth Provider</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Supabase Auth</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>RLS Security</span>
              <span className="badge badge-green" style={{ fontSize: '11.5px', padding: '3px 8px' }}>Enforced</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>Audit Logging</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Active (Immutable)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', padding: '8px 0' }}>
              <span style={{ color: 'var(--color-text)', opacity: 0.75 }}>Curriculum Engine</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>AR23 / R20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
