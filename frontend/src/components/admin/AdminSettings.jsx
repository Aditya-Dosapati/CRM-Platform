import React, { useState } from 'react';
import { 
  Settings, Server, Shield, Database, Bell, Check, 
  Save, RefreshCw, AlertTriangle, Lock, Cpu, HardDrive 
} from 'lucide-react';
import authService from '../../services/authService';

export default function AdminSettings() {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [activeRegulation, setActiveRegulation] = useState('R20');
  const [passingThreshold, setPassingThreshold] = useState(40);
  const [attendanceMinThreshold, setAttendanceMinThreshold] = useState(75);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [requireAdminApproval, setRequireAdminApproval] = useState(true);
  const [saveNotice, setSaveNotice] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3500);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            General Institutional System Settings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure academic policies, authentication timeouts, regulatory parameters, and platform backups
          </p>
        </div>

        <button onClick={handleSaveSettings} className="btn btn-primary">
          <Save size={14} />
          <span>Save Changes</span>
        </button>
      </div>

      {saveNotice && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 'var(--radius-md)',
          color: '#166534',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} color="#16A34A" />
          <span>Institutional parameters and governance rules successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Academic & Regulation Rules */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Settings size={18} color="var(--primary-blue)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Academic & Examination Policies
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Current Academic Year</label>
              <select
                className="input-field"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="2025-2026">2025-2026 (Active)</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Active Institutional Regulation</label>
              <select
                className="input-field"
                value={activeRegulation}
                onChange={(e) => setActiveRegulation(e.target.value)}
              >
                <option value="R20">R20 Regulation (Autonomous)</option>
                <option value="R19">R19 Regulation</option>
                <option value="R23">R23 Regulation</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Minimum Attendance Threshold (%)</label>
              <input
                type="number"
                min={50}
                max={90}
                className="input-field"
                value={attendanceMinThreshold}
                onChange={(e) => setAttendanceMinThreshold(Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">End-Semester Passing Threshold (%)</label>
              <input
                type="number"
                min={35}
                max={60}
                className="input-field"
                value={passingThreshold}
                onChange={(e) => setPassingThreshold(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Security & Authentication Governance */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={18} color="var(--primary-blue)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Security, Auth & Registration Policies
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#F8FAFC',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={requireAdminApproval}
                onChange={(e) => setRequireAdminApproval(e.target.checked)}
                style={{ marginTop: '3px', accentColor: 'var(--primary-blue)' }}
              />
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Enforce Mandatory Admin Approval for Self-Registered Users
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  When enabled, all newly registered Student and Faculty accounts remain in 'Pending' state until approved in the Admin Users tab.
                </p>
              </div>
            </label>

            <div style={{ maxWidth: '300px' }}>
              <label className="input-label">Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                min={15}
                max={240}
                className="input-field"
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Infrastructure & Database Health */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Server size={18} color="var(--primary-blue)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Server & Database Infrastructure
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                <Cpu size={14} />
                <span>SANDBOX CLUSTER</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                4 / 4 Nodes Active
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Docker Engine 26.0 (Airgapped)</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                <Database size={14} />
                <span>DATABASE STATUS</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '4px' }}>
                Healthy (2.4 GB)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Auto-backup nightly at 02:00 AM</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                <HardDrive size={14} />
                <span>SYSTEM UPTIME</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--pastel-purple-text)', marginTop: '4px' }}>
                99.98%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Zero downtime deployments</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
