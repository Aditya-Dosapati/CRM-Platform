import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, ShieldAlert, FileText, Search, Filter, Download, RefreshCw, CheckCircle, AlertTriangle, Lock, Clock, FileQuestion } from 'lucide-react';
import auditService from '../../services/auditService';
import EmptyState from '../common/EmptyState';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshLogs = useCallback(() => {
    setLogs(auditService.getLogs());
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (roleFilter !== 'all' && log.role.toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }
      if (resultFilter !== 'all' && log.result.toLowerCase() !== resultFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.user.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.resource.toLowerCase().includes(q) ||
          (log.details && log.details.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, roleFilter, resultFilter, searchQuery]);

  const { totalEvents, blockedCount, adminOps } = useMemo(() => {
    return {
      totalEvents: logs.length,
      blockedCount: logs.filter(l => l.result.includes('Blocked') || l.result.includes('403')).length,
      adminOps: logs.filter(l => l.role === 'admin').length
    };
  }, [logs]);

  const handleExport = useCallback(() => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute("download", `gmrit_security_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [logs]);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
              SECURITY & COMPLIANCE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ISO/IEC 27001 Certified Audit Trail</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Institutional Security Audit Logs
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Immutable chronological record of authentication events, user provisioning, RAG changes, and security authorization checks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={refreshLogs} className="btn btn-secondary">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button onClick={handleExport} className="btn btn-primary">
            <Download size={14} />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--pastel-blue-bg)',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Recorded Events</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalEvents}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFF1F2',
            color: '#E11D48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Blocked Incidents (403)</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#E11D48' }}>{blockedCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--pastel-purple-bg)',
            color: 'var(--pastel-purple-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Admin Operations</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{adminOps}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--pastel-green-bg)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Tamper Protection</span>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--success)' }}>Active & Enforced</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by user, action, resource, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
              <select
                className="input-field"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: '110px', height: '38px', fontSize: '12.5px', padding: '4px 8px' }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Result:</span>
              <select
                className="input-field"
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                style={{ width: '130px', height: '38px', fontSize: '12.5px', padding: '4px 8px' }}
              >
                <option value="all">All Results</option>
                <option value="success">Success</option>
                <option value="blocked (403)">Blocked (403)</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Timestamp</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>User & Identity</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Action</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Target Resource</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Result</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Details / Origin</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <EmptyState
                  icon={FileQuestion}
                  title="No Audit Records Found"
                  message="No institutional security events match the selected role or status filters."
                  isTableRow={true}
                  colSpan={6}
                  actionText="Reset Filters"
                  onAction={() => {
                    setRoleFilter('all');
                    setResultFilter('all');
                    setSearchQuery('');
                  }}
                />
              ) : (
                filteredLogs.map(log => {
                  const isBlocked = log.result.includes('Blocked') || log.result.includes('403');
                  const isFailed = log.result === 'Failed';
                  const isSuccess = log.result === 'Success';

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.12s' }}>
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="var(--text-muted)" />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.formattedTime}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.user}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <span className="badge" style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            backgroundColor: log.role === 'student' ? 'var(--pastel-blue-bg)' : log.role === 'faculty' ? 'var(--pastel-green-bg)' : 'var(--pastel-purple-bg)',
                            color: log.role === 'student' ? 'var(--pastel-blue-text)' : log.role === 'faculty' ? 'var(--pastel-green-text)' : 'var(--pastel-purple-text)',
                            border: '1px solid var(--border-subtle)',
                            textTransform: 'uppercase'
                          }}>
                            {log.role}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {log.userId}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          padding: '3px 7px',
                          backgroundColor: '#F1F5F9',
                          borderRadius: '4px',
                          color: '#334155'
                        }}>
                          {log.resource}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {isBlocked && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#FFF1F2',
                            color: '#E11D48',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            border: '1px solid #FECDD3'
                          }}>
                            <Lock size={12} />
                            <span>Blocked (403)</span>
                          </span>
                        )}
                        {isFailed && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFBEB',
                            color: '#D97706',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            border: '1px solid #FDE68A'
                          }}>
                            <AlertTriangle size={12} />
                            <span>Failed</span>
                          </span>
                        )}
                        {isSuccess && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--pastel-green-bg)',
                            color: 'var(--pastel-green-text)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            border: '1px solid var(--pastel-green-border)'
                          }}>
                            <CheckCircle size={12} />
                            <span>Success</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', maxWidth: '300px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {log.details}
                        </p>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginTop: '3px', fontFamily: 'monospace' }}>
                          IP: {log.ipAddress}
                        </span>
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
  );
}
