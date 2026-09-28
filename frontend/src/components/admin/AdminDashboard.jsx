import React, { useState, useEffect } from 'react';
import { 
  Shield, Cpu, Users, Award, BookOpen, FileText, Database, 
  Activity, CheckCircle2, AlertCircle, ArrowUpRight, Sparkles, 
  UserPlus, UploadCloud, RefreshCw, KeyRound 
} from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';

export default function AdminDashboard({ onNavigate, onOpenRagQuery }) {
  const [stats, setStats] = useState({
    usersCount: 0,
    studentsCount: 0,
    facultyCount: 0,
    departmentsCount: 0,
    subjectsCount: 0,
    documentsCount: 0,
    indexedDocs: 0,
    processingDocs: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      setIsLoading(true);
      try {
        const [users, deptsRes, subsRes, docsRes] = await Promise.all([
          Promise.resolve(authService.getAllUsers()),
          academicDataService.getDepartments(),
          academicDataService.getSubjects(),
          ragDocumentService.getDocuments()
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
            processingDocs: processing
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
            Manage the complete GMRIT academic ecosystem, user provisioning, and AI RAG knowledge infrastructure
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* Admin KPI Cards - 6-Color System */}
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
                color: 'var(--color-primary)',
                border: '1px solid var(--color-border)'
              }}>
                <Cpu size={16} />
              </div>
              <div>
                <h3 className="card-title">
                  GMRIT RAG Knowledge Vector Engine
                </h3>
                <p className="card-subtitle">
                  Engine: PostgreSQL pgvector (384 dim) • Model: intfloat/multilingual-e5-small
                </p>
              </div>
            </div>
            <span className="badge badge-green">
              <CheckCircle2 size={11} />
              Operational
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginTop: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '11px 13px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>EMBEDDING DIMENSIONS</span>
              <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                384-dim
              </p>
              <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.7 }}>HNSW Cosine Vector Index</span>
            </div>

            <div style={{
              padding: '11px 13px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>INDEXED ASSETS</span>
              <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {stats.indexedDocs} Docs
              </p>
              <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.7 }}>In Supabase Storage Bucket</span>
            </div>

            <div style={{
              padding: '11px 13px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>PIPELINE QUEUE</span>
              <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {stats.processingDocs} In-Flight
              </p>
              <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.7 }}>rag_ingestion_jobs</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onNavigate('rag-base')} className="btn btn-secondary btn-sm">
              <span>View RAG Documents</span>
              <ArrowUpRight size={13} />
            </button>
            <button onClick={() => onNavigate('rag-settings')} className="btn btn-primary btn-sm">
              <span>Configure Vector Settings</span>
            </button>
          </div>
        </div>

        {/* Security & Access Controls Box */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-header" style={{ marginBottom: '12px' }}>
            <h3 className="card-title">
              <Shield size={16} color="var(--color-primary)" />
              <span>Identity & Provisioning</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            <div style={{
              padding: '12px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <strong style={{ fontSize: '12px', color: 'var(--color-primary)', display: 'block', marginBottom: '2px' }}>
                Self-Registration: ADMIN CONTROLLED
              </strong>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.8, lineHeight: 1.4 }}>
                Accounts are provisioned by Admin IT with Supabase Authentication and row-level security.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--color-text)', padding: '4px 0' }}>
              <span>Total Provisioned Users:</span>
              <strong style={{ color: 'var(--color-primary)' }}>{stats.usersCount} Accounts</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--color-text)', padding: '4px 0' }}>
              <span>Role Permissions:</span>
              <span className="badge badge-purple">Strict RBAC</span>
            </div>

            <button onClick={() => onNavigate('users')} className="btn btn-secondary btn-sm" style={{ marginTop: '6px', width: '100%' }}>
              <KeyRound size={13} />
              <span>Manage User Credentials</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
