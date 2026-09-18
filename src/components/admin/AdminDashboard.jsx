import React from 'react';
import { adminKPIs, adminSystemHealth } from '../../data/mockData';
import { Shield, Cpu, Users, Award, BookOpen, FileText, Database, Activity, CheckCircle2, AlertCircle, ArrowUpRight, Sparkles, UserPlus, UploadCloud, RefreshCw, KeyRound } from 'lucide-react';

export default function AdminDashboard({ onNavigate, onOpenRagQuery }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return <Users size={16} />;
      case 'Award': return <Award size={16} />;
      case 'BookOpen': return <BookOpen size={16} />;
      case 'FileText': return <FileText size={16} />;
      case 'Cpu': return <Cpu size={16} />;
      default: return <Shield size={16} />;
    }
  };

  const kpiConfigs = [
    { bg: 'var(--pastel-blue-bg)', text: 'var(--pastel-blue-text)', border: 'var(--pastel-blue-border)', iconBg: '#DBEAFE', iconColor: '#2563EB' },
    { bg: 'var(--pastel-green-bg)', text: 'var(--pastel-green-text)', border: 'var(--pastel-green-border)', iconBg: '#D1FAE5', iconColor: '#059669' },
    { bg: 'var(--pastel-purple-bg)', text: 'var(--pastel-purple-text)', border: 'var(--pastel-purple-border)', iconBg: '#EDE9FE', iconColor: '#7C3AED' },
    { bg: 'var(--pastel-orange-bg)', text: 'var(--pastel-orange-text)', border: 'var(--pastel-orange-border)', iconBg: '#FFEDD5', iconColor: '#EA580C' },
    { bg: 'var(--pastel-cyan-bg)', text: 'var(--pastel-cyan-text)', border: 'var(--pastel-cyan-border)', iconBg: '#CFFAFE', iconColor: '#0891B2' },
  ];

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
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            Administration Console
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
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

      {/* Admin Pastel KPI Cards - Compact & Vibrant */}
      <div className="kpi-grid">
        {adminKPIs.map((kpi, idx) => {
          const config = kpiConfigs[idx % kpiConfigs.length];
          return (
            <div key={kpi.id} style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              borderRadius: 'var(--radius-md)',
              padding: '13px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.12s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: config.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {kpi.label}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: config.iconBg,
                  color: config.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(kpi.icon)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                  {kpi.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.2px' }}>
          Administrative Quick Actions
        </h2>
        <div className="quick-actions-grid">
          <div
            className="quick-action-card"
            onClick={() => onNavigate('users')}
            style={{ background: 'var(--pastel-blue-bg)', borderColor: 'var(--pastel-blue-border)' }}
          >
            <div className="quick-action-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
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
            style={{ background: 'var(--pastel-green-bg)', borderColor: 'var(--pastel-green-border)' }}
          >
            <div className="quick-action-icon" style={{ background: '#D1FAE5', color: '#059669' }}>
              <UploadCloud size={18} />
            </div>
            <div>
              <div className="quick-action-title">Upload Syllabus</div>
              <div className="quick-action-desc">BOS curriculum R20 / R23 PDFs</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('rag-base')}
            style={{ background: 'var(--pastel-purple-bg)', borderColor: 'var(--pastel-purple-border)' }}
          >
            <div className="quick-action-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              <RefreshCw size={18} />
            </div>
            <div>
              <div className="quick-action-title">Sync Vector DB</div>
              <div className="quick-action-desc">Verify Qdrant 42.8k chunk embeddings</div>
            </div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => onNavigate('analytics')}
            style={{ background: 'var(--pastel-orange-bg)', borderColor: 'var(--pastel-orange-border)' }}
          >
            <div className="quick-action-icon" style={{ background: '#FFEDD5', color: '#EA580C' }}>
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
                background: 'var(--pastel-blue-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-blue)',
                border: '1px solid var(--pastel-blue-border)'
              }}>
                <Cpu size={16} />
              </div>
              <div>
                <h3 className="card-title">
                  GMRIT RAG Knowledge Vector Engine Telemetry
                </h3>
                <p className="card-subtitle">
                  Cluster: Qdrant Production Hybrid Search • Ingestion Pipeline Status: Normal
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
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginTop: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '11px 13px',
              background: 'var(--pastel-blue-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--pastel-blue-border)'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--pastel-blue-text)', textTransform: 'uppercase' }}>QUERY LATENCY</span>
              <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {adminSystemHealth.vectorLatency}
              </p>
              <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: 600 }}>p99 &lt; 25ms</span>
            </div>

            <div style={{
              padding: '11px 13px',
              background: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>STORAGE USED</span>
              <p style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {adminSystemHealth.storageUsed}
              </p>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>14.2% Capacity</span>
            </div>

            <div style={{
              padding: '11px 13px',
              background: 'var(--pastel-green-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--pastel-green-border)'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--pastel-green-text)', textTransform: 'uppercase' }}>INDEXED ASSETS</span>
              <p style={{ fontSize: '19px', fontWeight: 800, color: '#059669', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {adminSystemHealth.indexedDocs} Docs
              </p>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>42,800 Chunks</span>
            </div>

            <div style={{
              padding: '11px 13px',
              background: 'var(--pastel-orange-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--pastel-orange-border)'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--pastel-orange-text)', textTransform: 'uppercase' }}>QUEUE & ERRORS</span>
              <p style={{ fontSize: '19px', fontWeight: 800, color: '#EA580C', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {adminSystemHealth.processingDocs} In-Flight
              </p>
              <span style={{ fontSize: '10.5px', color: 'var(--error)', fontWeight: 600 }}>12 Corrupted PDFs</span>
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
              <Shield size={16} color="var(--primary-blue)" />
              <span>Identity & Provisioning</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            <div style={{
              padding: '12px',
              background: 'var(--pastel-orange-bg)',
              border: '1px solid var(--pastel-orange-border)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <strong style={{ fontSize: '12px', color: 'var(--pastel-orange-text)', display: 'block', marginBottom: '2px' }}>
                Self-Registration: DISABLED
              </strong>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Accounts must be provisioned by Admin IT. Passwords require dual-factor campus validation.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)', padding: '4px 0' }}>
              <span>Total Active Sessions:</span>
              <strong style={{ color: 'var(--text-primary)' }}>1,842 Live</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)', padding: '4px 0' }}>
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
