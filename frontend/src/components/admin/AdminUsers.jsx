import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, Plus, Download, Upload, ShieldAlert, KeyRound, Check, X, Search, 
  Filter, ShieldCheck, Mail, UserX, FileSpreadsheet, AlertTriangle, CheckCircle2, 
  RotateCw, UserCheck, UserMinus, GraduationCap, Briefcase, ChevronRight 
} from 'lucide-react';
import userManagementService from '../../services/userManagementService';
import academicDataService from '../../services/academicDataService';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function AdminUsers() {
  const [authUsers, setAuthUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'students' | 'faculty' | 'admins'
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedAccount, setLastCreatedAccount] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Close modals on Escape key
  useEscapeKey(() => {
    if (showSuccessModal) setShowSuccessModal(false);
    else if (showCreateModal) setShowCreateModal(false);
    else if (showBulkImportModal) setShowBulkImportModal(false);
  }, showCreateModal || showSuccessModal || showBulkImportModal);

  // Fetch live users and departments from Supabase
  const loadUsersAndDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        userManagementService.getAllUsers(),
        academicDataService.getDepartments()
      ]);

      const safeUsers = Array.isArray(usersData) ? usersData : (usersData?.data ?? usersData?.users ?? []);
      setAuthUsers(safeUsers);

      if (deptsData?.data) {
        setDepartments(deptsData.data);
      }
    } catch (err) {
      console.error('[AdminUsers] Error loading users or departments:', err);
      setAuthUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsersAndDepartments();
  }, [loadUsersAndDepartments]);

  // Safe data extraction
  const safeUsersList = useMemo(() => {
    return Array.isArray(authUsers) ? authUsers : (authUsers?.data ?? authUsers?.users ?? []);
  }, [authUsers]);

  // Statistics
  const stats = useMemo(() => {
    const total = safeUsersList.length;
    const pending = safeUsersList.filter(u => (u.rawStatus || u.status || '').toLowerCase() === 'pending').length;
    const activeStudents = safeUsersList.filter(u => u.role === 'student' && (u.rawStatus || u.status || '').toLowerCase() === 'active').length;
    const activeFaculty = safeUsersList.filter(u => u.role === 'faculty' && (u.rawStatus || u.status || '').toLowerCase() === 'active').length;
    const inactive = safeUsersList.filter(u => ['inactive', 'deactivated', 'rejected'].includes((u.rawStatus || u.status || '').toLowerCase())).length;

    return { total, pending, activeStudents, activeFaculty, inactive };
  }, [safeUsersList]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return safeUsersList.filter(u => {
      const statusLower = (u.rawStatus || u.status || '').toLowerCase();
      const roleLower = (u.role || '').toLowerCase();

      // Tab filter
      if (activeTab === 'pending' && statusLower !== 'pending') return false;
      if (activeTab === 'students' && (roleLower !== 'student' || statusLower === 'pending')) return false;
      if (activeTab === 'faculty' && (roleLower !== 'faculty' || statusLower === 'pending')) return false;
      if (activeTab === 'admins' && roleLower !== 'admin') return false;

      // Department filter
      if (departmentFilter !== 'all') {
        if (u.departmentId && u.departmentId !== departmentFilter) return false;
        if (!u.departmentId && u.department && !u.department.toLowerCase().includes(departmentFilter.toLowerCase())) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (u.name || '').toLowerCase().includes(q);
        const emailMatch = (u.email || '').toLowerCase().includes(q);
        const rollMatch = (u.rollNumber || u.employeeId || u.userId || '').toLowerCase().includes(q);
        const deptMatch = (u.department || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || rollMatch || deptMatch;
      }

      return true;
    });
  }, [safeUsersList, activeTab, departmentFilter, searchQuery]);

  // Actions
  const handleApprove = async (u) => {
    try {
      await userManagementService.approveUser(u.id);
      await loadUsersAndDepartments();
      setActionFeedback({ type: 'success', message: `Registration for ${u.name} (${u.email}) approved and account activated.` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert(err.message || 'Could not approve user.');
    }
  };

  const handleReject = async (u) => {
    const reason = window.prompt(`Please enter rejection reason for ${u.name}:`, "Incomplete academic verification");
    if (reason !== null) {
      try {
        await userManagementService.rejectUser(u.id, reason);
        await loadUsersAndDepartments();
        setActionFeedback({ type: 'info', message: `Registration for ${u.name} was rejected.` });
        setTimeout(() => setActionFeedback(null), 4000);
      } catch (err) {
        alert(err.message || 'Could not reject user.');
      }
    }
  };

  const handleToggleStatus = async (u) => {
    const current = (u.rawStatus || u.status || 'active').toLowerCase();
    const nextStatus = current === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'active' ? 'activated' : 'deactivated';

    try {
      await userManagementService.setUserStatus(u.id, nextStatus);
      await loadUsersAndDepartments();
      setActionFeedback({ type: 'success', message: `Account for ${u.name} has been ${actionLabel}.` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert(err.message || `Could not update account status.`);
    }
  };

  // Create Single User Modal State
  const [createRole, setCreateRole] = useState('student');
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createIdentifier, setCreateIdentifier] = useState('');
  const [createDeptId, setCreateDeptId] = useState('');
  const [createYear, setCreateYear] = useState('1');
  const [createSection, setCreateSection] = useState('A');
  const [createDesignation, setCreateDesignation] = useState('Assistant Professor');
  const [createPassword, setCreatePassword] = useState('GMRIT@' + Math.floor(1000 + Math.random() * 9000));
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    try {
      const res = await userManagementService.provisionUser({
        role: createRole,
        name: createName,
        email: createEmail,
        rollNumber: createRole === 'student' ? createIdentifier : undefined,
        employeeId: createRole === 'faculty' ? createIdentifier : undefined,
        departmentId: createDeptId || (departments[0]?.id || null),
        year: createRole === 'student' ? Number(createYear) : undefined,
        section: createRole === 'student' ? createSection : undefined,
        designation: createRole === 'faculty' ? createDesignation : undefined,
        password: createPassword,
        status: 'active'
      });

      setLastCreatedAccount({
        name: createName,
        email: createEmail,
        role: createRole === 'student' ? 'Student' : 'Faculty',
        tempPass: createPassword
      });

      setShowCreateModal(false);
      setShowSuccessModal(true);
      await loadUsersAndDepartments();

      // Reset form
      setCreateName('');
      setCreateEmail('');
      setCreateIdentifier('');
      setCreatePassword('GMRIT@' + Math.floor(1000 + Math.random() * 9000));
    } catch (err) {
      alert(err.message || 'Failed to provision user.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Bulk CSV Import Modal State
  const [importRole, setImportRole] = useState('student');
  const [csvFile, setCsvFile] = useState(null);
  const [csvRawText, setCsvRawText] = useState('');
  const [validationReport, setValidationReport] = useState(null);
  const [fallbackDeptId, setFallbackDeptId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setImportResult(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result || '';
        setCsvRawText(text);
        const parsedRows = userManagementService.parseCsv(text);
        if (importRole === 'student') {
          const report = userManagementService.validateStudentCsv(parsedRows, departments);
          setValidationReport(report);
        } else {
          const report = userManagementService.validateFacultyCsv(parsedRows, departments);
          setValidationReport(report);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportRoleChange = (newRole) => {
    setImportRole(newRole);
    setValidationReport(null);
    setImportResult(null);
    if (csvRawText) {
      const parsedRows = userManagementService.parseCsv(csvRawText);
      if (newRole === 'student') {
        setValidationReport(userManagementService.validateStudentCsv(parsedRows, departments));
      } else {
        setValidationReport(userManagementService.validateFacultyCsv(parsedRows, departments));
      }
    }
  };

  const downloadSampleTemplate = (roleType) => {
    let headers = '';
    let sampleRow = '';
    if (roleType === 'student') {
      headers = 'full_name,email,roll_number,department_code,year,section,program\n';
      sampleRow = 'Kavya Reddy,kavya.23cs001@gmrit.edu.in,23A81A0501,CSE,2,A,B.Tech\nRahul Sharma,rahul.23aiml002@gmrit.edu.in,23A81A4202,AIML,2,B,B.Tech\n';
    } else {
      headers = 'full_name,email,employee_id,department_code,designation\n';
      sampleRow = 'Dr. A. K. Verma,verma.ak@gmrit.edu.in,GMR-CSE-1022,CSE,Associate Professor\nDr. S. Priya,priya.s@gmrit.edu.in,GMR-AIDS-1044,AIDS,Assistant Professor\n';
    }

    const blob = new Blob([headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gmrit_${roleType}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (!validationReport || validationReport.validCount === 0) {
      alert('No valid records to import.');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      let result;
      if (importRole === 'student') {
        result = await userManagementService.executeStudentBulkImport(
          validationReport.validRows,
          fallbackDeptId || (departments[0]?.id || null),
          (p) => setImportProgress(p)
        );
      } else {
        result = await userManagementService.executeFacultyBulkImport(
          validationReport.validRows,
          fallbackDeptId || (departments[0]?.id || null),
          (p) => setImportProgress(p)
        );
      }

      setImportResult(result);
      await loadUsersAndDepartments();
      setActionFeedback({
        type: 'success',
        message: `Successfully imported ${result.succeeded} ${importRole} records.`
      });
    } catch (err) {
      alert(err.message || 'Bulk import failed.');
    } finally {
      setIsImporting(false);
    }
  };

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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            User Provisioning & Access Governance
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '4px' }}>
            Admin-controlled registration approvals, credential provisioning, and bulk CSV ingestion
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowBulkImportModal(true)} className="btn btn-secondary">
            <Upload size={14} />
            <span>Bulk CSV Import</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={14} />
            <span>Provision New User</span>
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} color="var(--color-primary)" />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Overview Stats Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div className="stat-card" style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, fontWeight: 600 }}>Total Accounts</span>
            <Users size={16} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>{stats.total}</div>
        </div>

        <div 
          className="stat-card" 
          onClick={() => setActiveTab('pending')}
          style={{ 
            padding: '16px', 
            background: stats.pending > 0 ? 'rgba(198, 93, 46, 0.08)' : 'var(--color-surface)', 
            borderRadius: 'var(--radius-lg)', 
            border: stats.pending > 0 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: stats.pending > 0 ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: 700 }}>Pending Approvals</span>
            <ShieldAlert size={16} color={stats.pending > 0 ? 'var(--color-primary)' : 'var(--color-text)'} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: stats.pending > 0 ? 'var(--color-primary)' : 'var(--color-text)' }}>
            {stats.pending}
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, fontWeight: 600 }}>Active Students</span>
            <GraduationCap size={16} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>{stats.activeStudents}</div>
        </div>

        <div className="stat-card" style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, fontWeight: 600 }}>Active Faculty</span>
            <Briefcase size={16} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>{stats.activeFaculty}</div>
        </div>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="tabs-nav" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {[
            { id: 'all', label: 'All Users' },
            { id: 'pending', label: `Pending Approvals (${stats.pending})`, highlight: stats.pending > 0 },
            { id: 'students', label: `Students (${stats.activeStudents})` },
            { id: 'faculty', label: `Faculty (${stats.activeFaculty})` },
            { id: 'admins', label: 'Admins' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                color: tab.highlight && activeTab !== tab.id ? 'var(--color-primary)' : undefined,
                fontWeight: tab.highlight ? 800 : undefined
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {departments.length > 0 && (
            <select
              className="input-field"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ width: '180px', paddingBlock: '8px', fontSize: '12.5px' }}
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', paddingBlock: '8px', fontSize: '13px' }}
            />
            <Search size={15} color="var(--color-text)" style={{ position: 'absolute', left: '12px', top: '11px', opacity: 0.6 }} />
          </div>

          <button 
            onClick={loadUsersAndDepartments} 
            className="btn btn-secondary btn-sm" 
            title="Refresh list"
            style={{ padding: '8px 10px' }}
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Full Name & Email</th>
              <th>Roll / Employee ID</th>
              <th>Role</th>
              <th>Department</th>
              <th>Year / Sem</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <RotateCw size={20} className="spin" color="var(--color-primary)" />
                    <span style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.7 }}>Loading institutional users from database...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={UserX}
                title={activeTab === 'pending' ? "No Pending Approvals" : "No Accounts Found"}
                message={activeTab === 'pending' ? "All student and faculty registrations have been processed." : "No accounts match your current tab selection or search criteria."}
                isTableRow={true}
                colSpan={7}
                actionText="Show All Users"
                onAction={() => {
                  setActiveTab('all');
                  setDepartmentFilter('all');
                  setSearchQuery('');
                }}
              />
            ) : (
              filteredUsers.map((u) => {
                const isPending = (u.rawStatus || u.status || '').toLowerCase() === 'pending';
                const isRejected = (u.rawStatus || u.status || '').toLowerCase() === 'rejected';
                const isActive = (u.rawStatus || u.status || '').toLowerCase() === 'active';

                return (
                  <tr key={u.id} style={{ backgroundColor: isPending ? 'rgba(198, 93, 46, 0.04)' : undefined }}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{u.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.65 }}>{u.email}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', fontWeight: 600 }}>
                      {u.rollNumber || u.employeeId || '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'student' ? 'badge-blue' :
                        u.role === 'faculty' ? 'badge-green' : 'badge-purple'
                      }`}>
                        {u.displayRole}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>{u.department}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.8 }}>
                      {u.role === 'student' ? `${u.year} • ${u.semester}` : (u.designation || 'Faculty')}
                    </td>
                    <td>
                      <span className={`badge ${
                        isActive ? 'badge-green' : 
                        isPending ? 'badge-orange' : 'badge-danger'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleApprove(u)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11.5px' }}
                            title="Approve & Activate Account"
                          >
                            <Check size={13} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11.5px', color: 'var(--error)' }}
                            title="Reject Registration"
                          >
                            <X size={13} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              padding: '4px 10px',
                              fontSize: '11.5px',
                              color: isActive ? 'var(--error)' : 'var(--color-primary)' 
                            }}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Provision Single User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                  Provision Institutional Account
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, margin: '2px 0 0 0' }}>
                  Admin Workflow: Create verified student or faculty accounts with instant activation.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label className="input-label">Account Role</label>
                  <select
                    className="input-field"
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="student">Student Account</option>
                    <option value="faculty">Faculty / Teaching Staff Account</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder={createRole === 'student' ? "e.g. Kavya Reddy" : "e.g. Dr. A. K. Verma"}
                      className="input-field"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      {createRole === 'student' ? 'Roll Number' : 'Employee ID'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={createRole === 'student' ? "e.g. 23A81A0501" : "e.g. GMR-CSE-1022"}
                      className="input-field"
                      value={createIdentifier}
                      onChange={(e) => setCreateIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Institutional Email</label>
                    <input
                      type="email"
                      required
                      placeholder="user@gmrit.edu.in"
                      className="input-field"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Academic Department</label>
                    <select
                      className="input-field"
                      value={createDeptId}
                      onChange={(e) => setCreateDeptId(e.target.value)}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {createRole === 'student' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Academic Year</label>
                      <select className="input-field" value={createYear} onChange={(e) => setCreateYear(e.target.value)}>
                        <option value="1">I Year</option>
                        <option value="2">II Year</option>
                        <option value="3">III Year</option>
                        <option value="4">IV Year</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Section</label>
                      <select className="input-field" value={createSection} onChange={(e) => setCreateSection(e.target.value)}>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
                  </div>
                )}

                {createRole === 'faculty' && (
                  <div className="input-group" style={{ marginBottom: '14px' }}>
                    <label className="input-label">Designation</label>
                    <select
                      className="input-field"
                      value={createDesignation}
                      onChange={(e) => setCreateDesignation(e.target.value)}
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Head of Department">Head of Department</option>
                    </select>
                  </div>
                )}

                <div style={{
                  padding: '12px 14px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div className="input-group" style={{ marginBottom: '4px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Initial Account Password</span>
                      <button
                        type="button"
                        onClick={() => setCreatePassword('GMRIT@' + Math.floor(1000 + Math.random() * 9000))}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Regenerate
                      </button>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      style={{ fontFamily: 'monospace', fontWeight: 700 }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingCreate}>
                  <ShieldCheck size={14} />
                  <span>{isSubmittingCreate ? 'Provisioning...' : 'Provision & Activate Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkImportModal && (
        <div className="modal-overlay" onClick={() => setShowBulkImportModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                  Bulk CSV Account Ingestion
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, margin: '2px 0 0 0' }}>
                  Import student or faculty rosters with pre-validation and safe batch creation.
                </p>
              </div>
              <button onClick={() => setShowBulkImportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Import Role Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleImportRoleChange('student')}
                  className={`btn ${importRole === 'student' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1 }}
                >
                  <GraduationCap size={14} />
                  <span>Student Roster</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleImportRoleChange('faculty')}
                  className={`btn ${importRole === 'faculty' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1 }}
                >
                  <Briefcase size={14} />
                  <span>Faculty Roster</span>
                </button>
              </div>

              {/* Template Download Option */}
              <div style={{
                padding: '12px 14px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text)' }}>
                    Download CSV Template
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>
                    Includes formatted headers ({importRole === 'student' ? 'full_name, email, roll_number, department_code, year, section' : 'full_name, email, employee_id, department_code, designation'})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSampleTemplate(importRole)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  <Download size={13} />
                  <span>Template</span>
                </button>
              </div>

              {/* File Upload Field */}
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="input-field"
                  style={{ padding: '8px' }}
                />
              </div>

              {/* Fallback Department */}
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label">Default Department (Fallback if not in CSV)</label>
                <select
                  className="input-field"
                  value={fallbackDeptId}
                  onChange={(e) => setFallbackDeptId(e.target.value)}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>

              {/* Validation Report */}
              {validationReport && (
                <div style={{
                  padding: '14px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                      Pre-Import Validation Report
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge badge-green">{validationReport.validCount} Valid</span>
                      {validationReport.invalidCount > 0 && (
                        <span className="badge badge-danger">{validationReport.invalidCount} Invalid</span>
                      )}
                    </div>
                  </div>

                  {validationReport.invalidCount > 0 ? (
                    <div style={{
                      maxHeight: '130px',
                      overflowY: 'auto',
                      padding: '8px',
                      background: 'rgba(169, 74, 42, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      color: 'var(--color-accent)'
                    }}>
                      <strong>Errors Found:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {validationReport.invalidRows.map((inv, i) => (
                          <li key={i}>
                            Row {inv.rowNumber}: {inv.errors.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-primary)' }}>
                      <CheckCircle2 size={15} />
                      <span>All {validationReport.validCount} rows passed schema and integrity verification.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {isImporting && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Importing accounts...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${importProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s ease' }} />
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {importResult && (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(198, 93, 46, 0.08)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  color: 'var(--color-primary)'
                }}>
                  <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  <strong>Import Complete:</strong> Created {importResult.succeeded} active accounts. {importResult.failed > 0 ? `(${importResult.failed} failed)` : ''}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBulkImportModal(false)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExecuteImport}
                disabled={isImporting || !validationReport || validationReport.validCount === 0}
              >
                <FileSpreadsheet size={14} />
                <span>{isImporting ? 'Processing Batch...' : `Import ${validationReport ? validationReport.validCount : 0} Records`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Provisioned Success Modal */}
      {showSuccessModal && lastCreatedAccount && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px', textAlign: 'center', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(198, 93, 46, 0.1)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Check size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px' }}>
              Account Provisioned & Activated
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginBottom: '16px' }}>
              New {lastCreatedAccount.role} record is live and immediately authorized for login.
            </p>

            <div style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              textAlign: 'left',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12.5px'
            }}>
              <div>
                <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Name: </span>
                <strong>{lastCreatedAccount.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Email: </span>
                <strong style={{ fontFamily: 'monospace' }}>{lastCreatedAccount.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Temporary Password: </span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{lastCreatedAccount.tempPass}</strong>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowSuccessModal(false)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
