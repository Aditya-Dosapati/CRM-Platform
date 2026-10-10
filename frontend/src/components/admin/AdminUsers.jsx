import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Plus, Download, Upload, ShieldAlert, KeyRound, Check, X, Search, 
  Filter, ShieldCheck, Mail, UserX, FileSpreadsheet, AlertTriangle, CheckCircle2, 
  RotateCw, UserCheck, UserMinus, GraduationCap, Briefcase, ChevronRight, Shield,
  Trash2, Loader2
} from 'lucide-react';
import userManagementService from '../../services/userManagementService';
import academicDataService from '../../services/academicDataService';
import authService from '../../services/authService';
import { getBranchDisplay, resolveBranch, normalizeYear, normalizeSection } from '../../services/academicCohortService';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function AdminUsers() {
  const [authUsers, setAuthUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'students' | 'faculty' | 'admins'
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedAccount, setLastCreatedAccount] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [processingUserId, setProcessingUserId] = useState(null);

  // Close modals on Escape key
  useEscapeKey(() => {
    if (showDeleteModal) {
      handleCloseDeleteModal();
    } else if (showSuccessModal) {
      setShowSuccessModal(false);
    } else if (showCreateModal) {
      setShowCreateModal(false);
    } else if (showBulkImportModal) {
      setShowBulkImportModal(false);
    }
  }, showCreateModal || showSuccessModal || showBulkImportModal || showDeleteModal);

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

  // Dynamic Statistics
  const stats = useMemo(() => {
    const list = safeUsersList;
    const total = list.length;
    const pending = list.filter(u => (u.rawStatus || u.status || '').toLowerCase() === 'pending').length;
    const activeStudents = list.filter(u => u.role === 'student' && (u.rawStatus || u.status || '').toLowerCase() === 'active').length;
    const activeFaculty = list.filter(u => u.role === 'faculty' && (u.rawStatus || u.status || '').toLowerCase() === 'active').length;
    const activeAdmins = list.filter(u => u.role === 'admin' && (u.rawStatus || u.status || '').toLowerCase() === 'active').length;

    const allStudents = list.filter(u => u.role === 'student').length;
    const allFaculty = list.filter(u => u.role === 'faculty').length;
    const allAdmins = list.filter(u => u.role === 'admin').length;

    return { 
      total, 
      pending, 
      activeStudents, 
      activeFaculty, 
      activeAdmins,
      allStudents,
      allFaculty,
      allAdmins
    };
  }, [safeUsersList]);

  // Filtered list with multi-criteria AND logic
  const filteredUsers = useMemo(() => {
    return safeUsersList.filter(u => {
      const statusLower = (u.rawStatus || u.status || '').toLowerCase().trim();
      const roleLower = (u.role || '').toLowerCase().trim();

      // 1. Tab filter
      if (activeTab === 'pending' && statusLower !== 'pending') return false;
      if (activeTab === 'students' && (roleLower !== 'student' || statusLower === 'pending')) return false;
      if (activeTab === 'faculty' && (roleLower !== 'faculty' || statusLower === 'pending')) return false;
      if (activeTab === 'admins' && roleLower !== 'admin') return false;

      // 2. Department filter
      if (departmentFilter !== 'all') {
        const deptFilterLower = departmentFilter.toLowerCase().trim();
        const selDept = departments.find(d => d.id === departmentFilter);
        const selCodeLower = (selDept?.code || '').toLowerCase().trim();
        const selNameLower = (selDept?.name || '').toLowerCase().trim();

        const matchesDeptId = u.departmentId === departmentFilter;
        const matchesDeptCode = (u.departmentCode || '').toLowerCase().trim() === deptFilterLower || (selCodeLower && (u.departmentCode || '').toLowerCase().trim() === selCodeLower);
        const matchesBranch = (u.branch || '').toLowerCase().trim() === deptFilterLower || (selCodeLower && (u.branch || '').toLowerCase().trim() === selCodeLower);
        const matchesBranchDisplayName = (u.branchDisplayName || '').toLowerCase().trim() === deptFilterLower || (selCodeLower && (u.branchDisplayName || '').toLowerCase().trim() === selCodeLower);
        const matchesDeptName = (u.departmentName || u.department || '').toLowerCase().includes(deptFilterLower) || (selNameLower && (u.departmentName || u.department || '').toLowerCase().includes(selNameLower));

        if (!matchesDeptId && !matchesDeptCode && !matchesBranch && !matchesBranchDisplayName && !matchesDeptName) {
          return false;
        }
      }

      // 3. Year filter (All Years, 1st Year, 2nd Year, 3rd Year, 4th Year)
      if (yearFilter !== 'all') {
        if (roleLower !== 'student' && (!u.year || u.year === '—')) {
          return false;
        }

        const rawDigits = String(u.year || '').replace(/\D/g, '');
        const normalizedUserYear = rawDigits ? String(Number(rawDigits)) : (u.semester ? String(normalizeYear(u.year, u.semester)) : '');

        if (normalizedUserYear !== String(yearFilter)) {
          return false;
        }
      }

      // 4. Section filter (All Sections, Section A, Section B, Section C, Section D)
      if (sectionFilter !== 'all') {
        if (roleLower !== 'student' && (!u.section || u.section === '—')) {
          return false;
        }

        const normalizedUserSec = normalizeSection(u.section || '');
        const targetSec = String(sectionFilter).toUpperCase().trim();

        if (normalizedUserSec !== targetSec) {
          return false;
        }
      }

      // 5. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (u.name || '').toLowerCase().includes(q);
        const emailMatch = (u.email || '').toLowerCase().includes(q);
        const rollMatch = (u.rollNumber || '').toLowerCase().includes(q);
        const empMatch = (u.employeeId || '').toLowerCase().includes(q);
        const userMatch = (u.userId || u.id || '').toLowerCase().includes(q);
        const deptMatch = (u.department || '').toLowerCase().includes(q);
        const branchMatch = (u.branch || '').toLowerCase().includes(q);
        const branchDisplayMatch = (u.branchDisplayName || '').toLowerCase().includes(q);
        const deptCodeMatch = (u.departmentCode || '').toLowerCase().includes(q);
        const deptNameMatch = (u.departmentName || '').toLowerCase().includes(q);
        const secMatch = (u.section || '').toLowerCase() === q;
        const desigMatch = (u.designation || '').toLowerCase().includes(q);

        // Canonical combined branch display match (e.g., 'cse-aiml', 'cse-aids', 'cse')
        const combinedCanonical = `${u.department || 'CSE'}-${u.branch || 'CSE'}`.toLowerCase();
        const combinedMatch = combinedCanonical.includes(q);

        return (
          nameMatch ||
          emailMatch ||
          rollMatch ||
          empMatch ||
          userMatch ||
          deptMatch ||
          branchMatch ||
          branchDisplayMatch ||
          deptCodeMatch ||
          deptNameMatch ||
          secMatch ||
          desigMatch ||
          combinedMatch
        );
      }

      return true;
    });
  }, [safeUsersList, activeTab, departmentFilter, yearFilter, sectionFilter, searchQuery, departments]);

  // Current Admin Protection Checker
  const isCurrentAdminUser = useCallback((u) => {
    if (!u) return false;
    const current = authService.getCurrentUser() || authService.getCurrentSession();
    if (!current) return false;
    const curId = current.userId || current.id;
    const curEmail = (current.email || '').toLowerCase().trim();
    const targetId = u.id || u.userId;
    const targetEmail = (u.email || '').toLowerCase().trim();
    return (curId && targetId && curId === targetId) || (curEmail && targetEmail && curEmail === targetEmail);
  }, []);

  // Actions
  const handleApprove = async (u) => {
    setProcessingUserId(u.id);
    try {
      const current = authService.getCurrentUser() || authService.getCurrentSession();
      await userManagementService.approveUser(u.id, current?.name || 'Admin');
      await loadUsersAndDepartments();
      setActionFeedback({ type: 'success', message: `Registration for ${u.name} (${u.email}) approved and account activated.` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert(err.message || 'Could not approve user.');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (u) => {
    const reason = window.prompt(`Please enter rejection reason for ${u.name}:`, "Incomplete academic verification");
    if (reason !== null) {
      setProcessingUserId(u.id);
      try {
        const current = authService.getCurrentUser() || authService.getCurrentSession();
        await userManagementService.rejectUser(u.id, reason, current?.name || 'Admin');
        await loadUsersAndDepartments();
        setActionFeedback({ type: 'info', message: `Registration for ${u.name} was rejected.` });
        setTimeout(() => setActionFeedback(null), 4000);
      } catch (err) {
        alert(err.message || 'Could not reject user.');
      } finally {
        setProcessingUserId(null);
      }
    }
  };

  const handleToggleStatus = async (u) => {
    setProcessingUserId(u.id);
    const currentStatus = (u.rawStatus || u.status || 'active').toLowerCase();
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'active' ? 'activated' : 'deactivated';

    try {
      const current = authService.getCurrentUser() || authService.getCurrentSession();
      await userManagementService.setUserStatus(u.id, nextStatus, current?.name || 'Admin');
      await loadUsersAndDepartments();
      setActionFeedback({ type: 'success', message: `Account for ${u.name} (${u.email}) has been ${actionLabel}.` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert(err.message || `Could not update account status.`);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleInitiateDelete = (u) => {
    if (!u || isDeleting) return;
    setUserToDelete(u);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || isDeleting) return;
    if (isCurrentAdminUser(userToDelete)) {
      setDeleteError('Cannot delete your own active administrator account.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    const targetUser = { ...userToDelete };
    const cleanId = targetUser.id || targetUser.userId;
    const cleanEmail = targetUser.email;
    const cleanName = targetUser.name || 'User';

    try {
      const current = authService.getCurrentUser() || authService.getCurrentSession();
      const adminName = current?.name || 'Admin';

      // 1. Optimistic removal from currently displayed list & statistics
      setAuthUsers((prev) => {
        const arr = Array.isArray(prev) ? prev : (prev?.data ?? prev?.users ?? []);
        return arr.filter(
          (u) =>
            u.id !== cleanId &&
            u.userId !== cleanId &&
            (!cleanEmail || u.email?.toLowerCase() !== cleanEmail.toLowerCase())
        );
      });

      // 2. Perform deletion with timeout safety
      const deletePromise = userManagementService.deleteUser(cleanId, adminName);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Deletion operation timed out.')), 8000)
      );

      await Promise.race([deletePromise, timeoutPromise]);

      // 3. Clean up modal state on success
      setShowDeleteModal(false);
      setUserToDelete(null);
      setDeleteError('');

      // 4. Background refresh to stay synchronized with authoritative source
      loadUsersAndDepartments().catch((refreshErr) => {
        console.warn('[AdminUsers] Background refresh error after deletion:', refreshErr);
      });

      // 5. Toast feedback
      setActionFeedback({
        type: 'success',
        message: `Account for ${cleanName} (${cleanEmail || cleanId}) has been permanently deleted from database and authentication.`
      });
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err) {
      console.error('[AdminUsers] Error deleting user:', err);
      // Re-fetch users to restore state in case deletion failed
      loadUsersAndDepartments().catch(() => {});
      setDeleteError(err.message || 'Failed to delete user from database.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Provision Single User Modal State
  const [createRole, setCreateRole] = useState('student'); // 'student' | 'faculty' | 'admin'
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createIdentifier, setCreateIdentifier] = useState(''); // Roll Number or Employee ID
  const [createDeptId, setCreateDeptId] = useState('');
  const [createYear, setCreateYear] = useState('1');
  const [createSemester, setCreateSemester] = useState('1');
  const [createSection, setCreateSection] = useState('A');
  const [createDesignation, setCreateDesignation] = useState('Assistant Professor');
  const [createStatus, setCreateStatus] = useState('active'); // 'active' | 'pending'
  const [createPassword, setCreatePassword] = useState('GMRIT@' + Math.floor(1000 + Math.random() * 9000));
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createFormError, setCreateFormError] = useState('');

  // Auto-sync semester with year if year changes
  const handleYearChange = (yr) => {
    setCreateYear(yr);
    const numYr = parseInt(yr, 10) || 1;
    setCreateSemester(String(numYr * 2 - 1));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateFormError('');

    // Field validations
    if (!createName.trim() || createName.trim().length < 2) {
      setCreateFormError('Full Name must be at least 2 characters.');
      return;
    }

    if (!createEmail.trim() || !createEmail.includes('@') || !createEmail.includes('.')) {
      setCreateFormError('Please enter a valid institutional email address.');
      return;
    }

    if (createRole === 'student' && !createIdentifier.trim()) {
      setCreateFormError('Student Roll Number is required.');
      return;
    }

    if (createRole === 'faculty' && !createIdentifier.trim()) {
      setCreateFormError('Faculty Employee ID is required.');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const selectedDept = createDeptId || (departments[0]?.id || null);
      
      const res = await userManagementService.provisionUser({
        role: createRole,
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        rollNumber: createRole === 'student' ? createIdentifier.trim().toUpperCase() : undefined,
        employeeId: createRole === 'faculty' ? createIdentifier.trim().toUpperCase() : undefined,
        departmentId: createRole !== 'admin' ? selectedDept : null,
        year: createRole === 'student' ? Number(createYear) : undefined,
        semester: createRole === 'student' ? Number(createSemester) : undefined,
        section: createRole === 'student' ? createSection.trim().toUpperCase() : undefined,
        designation: createRole === 'faculty' ? createDesignation : undefined,
        password: createPassword,
        status: createStatus
      });

      setLastCreatedAccount({
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        role: createRole === 'student' ? 'Student' : (createRole === 'faculty' ? 'Faculty' : 'Admin'),
        identifier: createIdentifier.trim().toUpperCase(),
        tempPass: createPassword,
        status: createStatus === 'active' ? 'Active' : 'Pending Approval'
      });

      setShowCreateModal(false);
      setShowSuccessModal(true);
      await loadUsersAndDepartments();

      // Reset form
      setCreateName('');
      setCreateEmail('');
      setCreateIdentifier('');
      setCreateStatus('active');
      setCreatePassword('GMRIT@' + Math.floor(1000 + Math.random() * 9000));
      setCreateFormError('');
    } catch (err) {
      setCreateFormError(err.message || 'Failed to provision user.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // 2. Bulk CSV Import Modal State
  const [importRole, setImportRole] = useState('student'); // 'student' | 'faculty' | 'mixed'
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
        const report = userManagementService.validateCsv(parsedRows, departments, importRole === 'mixed' ? 'student' : importRole);
        setValidationReport(report);
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
      const report = userManagementService.validateCsv(parsedRows, departments, newRole === 'mixed' ? 'student' : newRole);
      setValidationReport(report);
    }
  };

  const downloadSampleTemplate = (roleType) => {
    let headers = '';
    let sampleRow = '';
    let filename = '';

    if (roleType === 'student') {
      headers = 'full_name,email,roll_number,department,year,semester,section,role\n';
      sampleRow = 'Rahul Kumar,rahul.23cs101@gmrit.edu.in,23CS101,Computer Science and Engineering,2,3,A,Student\nPriya Sharma,priya.23cs102@gmrit.edu.in,23CS102,Computer Science and Engineering,2,3,A,Student\n';
      filename = 'gmrit_student_template.csv';
    } else if (roleType === 'faculty') {
      headers = 'full_name,email,employee_id,department,designation,role\n';
      sampleRow = 'Dr. A. K. Verma,verma.ak@gmrit.edu.in,GMR-CSE-1022,Computer Science and Engineering,Associate Professor,Faculty\nDr. S. Priya,priya.s@gmrit.edu.in,GMR-AIDS-1044,Artificial Intelligence & Data Science,Assistant Professor,Faculty\n';
      filename = 'gmrit_faculty_template.csv';
    } else {
      headers = 'full_name,email,roll_number,employee_id,department,year,semester,section,designation,role\n';
      sampleRow = 'Rahul Kumar,rahul.23cs101@gmrit.edu.in,23CS101,,Computer Science and Engineering,2,3,A,,Student\nDr. A. K. Verma,verma.ak@gmrit.edu.in,,GMR-CSE-1022,Computer Science and Engineering,,,Associate Professor,Faculty\n';
      filename = 'gmrit_mixed_roster_template.csv';
    }

    const blob = new Blob([headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
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
      const result = await userManagementService.executeBulkImport(
        validationReport.validRows,
        fallbackDeptId || (departments[0]?.id || null),
        (p) => setImportProgress(p)
      );

      setImportResult(result);
      await loadUsersAndDepartments();
      setActionFeedback({
        type: 'success',
        message: `Successfully imported ${result.succeeded} accounts (${result.failed} failed).`
      });
      setTimeout(() => setActionFeedback(null), 5000);
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
            Admin-controlled registration approvals, credential provisioning, and bulk CSV ingestion for Students & Faculty
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
            { id: 'all', label: `All Users (${stats.total})` },
            { id: 'pending', label: `Pending Approvals (${stats.pending})`, highlight: stats.pending > 0 },
            { id: 'students', label: `Students (${stats.activeStudents})` },
            { id: 'faculty', label: `Faculty (${stats.activeFaculty})` },
            { id: 'admins', label: `Admins (${stats.allAdmins})` }
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {departments.length > 0 && (
            <select
              className="input-field"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ width: '165px', paddingBlock: '8px', fontSize: '12.5px' }}
              title="Filter by Department or Branch"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.displayCode || d.code} - {d.name}</option>
              ))}
            </select>
          )}

          {/* Year Filter */}
          <select
            className="input-field"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ width: '120px', paddingBlock: '8px', fontSize: '12.5px' }}
            title="Filter by Academic Year"
          >
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          {/* Section Filter */}
          <select
            className="input-field"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            style={{ width: '125px', paddingBlock: '8px', fontSize: '12.5px' }}
            title="Filter by Section"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>

          <div style={{ position: 'relative', width: '230px' }}>
            <input
              type="text"
              placeholder="Search name, roll no, email..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', paddingBlock: '8px', fontSize: '13px' }}
            />
            <Search size={15} color="var(--color-text)" style={{ position: 'absolute', left: '12px', top: '11px', opacity: 0.6 }} />
          </div>

          {(departmentFilter !== 'all' || yearFilter !== 'all' || sectionFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setDepartmentFilter('all');
                setYearFilter('all');
                setSectionFilter('all');
                setSearchQuery('');
              }}
              className="btn btn-secondary btn-sm"
              title="Reset all filters"
              style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--color-text)', opacity: 0.8 }}
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}

          <button 
            onClick={loadUsersAndDepartments} 
            className="btn btn-secondary btn-sm" 
            title="Refresh list from database"
            style={{ padding: '8px 10px' }}
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Active Filter Results Status Ribbon */}
      {(departmentFilter !== 'all' || yearFilter !== 'all' || sectionFilter !== 'all' || searchQuery) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          marginBottom: '12px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-surface-hover, rgba(0,0,0,0.02))',
          border: '1px solid var(--color-border)',
          fontSize: '12.5px',
          color: 'var(--color-text)'
        }}>
          <span style={{ opacity: 0.85 }}>
            Showing <strong>{filteredUsers.length}</strong> matching {filteredUsers.length === 1 ? 'user' : 'users'} (out of {safeUsersList.length} total)
          </span>
          <button
            onClick={() => {
              setDepartmentFilter('all');
              setYearFilter('all');
              setSectionFilter('all');
              setSearchQuery('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Full Name & Email</th>
              <th>Roll / Employee ID</th>
              <th>Role</th>
              <th>Department / Branch</th>
              <th>Academic Details / Designation</th>
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
                message={activeTab === 'pending' ? "All student and faculty registrations have been processed." : "No accounts match your current filter criteria or search query."}
                isTableRow={true}
                colSpan={7}
                actionText="Reset All Filters"
                onAction={() => {
                  setActiveTab('all');
                  setDepartmentFilter('all');
                  setYearFilter('all');
                  setSectionFilter('all');
                  setSearchQuery('');
                }}
              />
            ) : (
              filteredUsers.map((u) => {
                const isPending = (u.rawStatus || u.status || '').toLowerCase() === 'pending';
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
                    <td style={{ fontSize: '12.5px', fontWeight: 600 }}>
                      {u.branchDisplayName || getBranchDisplay(u.department || 'CSE', u.branch || 'CSE')}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.8 }}>
                      {u.role === 'student' ? (
                        <span>Year {u.year || 1} • Sem {u.semester || 1} • Sec {u.section || 'A'}</span>
                      ) : (
                        <span>{u.designation || (u.role === 'admin' ? 'System Administrator' : 'Faculty')}</span>
                      )}
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
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleApprove(u)}
                              disabled={processingUserId === u.id || isDeleting}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '11.5px' }}
                              title="Approve & Activate Account"
                            >
                              {processingUserId === u.id ? <RotateCw size={13} className="spin" /> : <Check size={13} />}
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(u)}
                              disabled={processingUserId === u.id || isDeleting}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '11.5px', color: '#DC2626' }}
                              title="Reject Registration"
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={processingUserId === u.id || isDeleting}
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              padding: '4px 10px',
                              fontSize: '11.5px',
                              color: isActive ? '#DC2626' : 'var(--color-primary)' 
                            }}
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {processingUserId === u.id ? (
                              <RotateCw size={12} className="spin" />
                            ) : isActive ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        )}

                        {/* Permanent Delete Button */}
                        <button
                          onClick={() => handleInitiateDelete(u)}
                          disabled={processingUserId === u.id || isDeleting || isCurrentAdminUser(u)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11.5px',
                            color: isCurrentAdminUser(u) ? 'var(--color-text-muted, #94a3b8)' : '#DC2626',
                            borderColor: isCurrentAdminUser(u) ? 'var(--color-border)' : '#FECDD3',
                            backgroundColor: isCurrentAdminUser(u) ? 'transparent' : 'rgba(239, 68, 68, 0.04)',
                            cursor: isCurrentAdminUser(u) ? 'not-allowed' : 'pointer'
                          }}
                          title={isCurrentAdminUser(u) ? "Cannot delete your own active administrator account" : `Permanently Delete ${u.name}`}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 1. Provision Single User Modal */}
      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '580px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                  Provision Institutional Account
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, margin: '2px 0 0 0' }}>
                  Admin Workflow: Create verified student, faculty, or admin accounts with instant activation.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {createFormError && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--pastel-red-bg, #FFF1F2)',
                    border: '1px solid var(--pastel-red-border, #FECDD3)',
                    borderRadius: '8px',
                    color: '#BE123C',
                    fontSize: '12.5px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={15} />
                    <span>{createFormError}</span>
                  </div>
                )}

                {/* Role Selector Tabs */}
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label className="input-label">Account Role / User Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setCreateRole('student')}
                      className={`btn ${createRole === 'student' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ justifyContent: 'center' }}
                    >
                      <GraduationCap size={14} />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateRole('faculty')}
                      className={`btn ${createRole === 'faculty' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ justifyContent: 'center' }}
                    >
                      <Briefcase size={14} />
                      <span>Faculty</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateRole('admin')}
                      className={`btn ${createRole === 'admin' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ justifyContent: 'center' }}
                    >
                      <Shield size={14} />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder={createRole === 'student' ? "e.g. Rahul Kumar" : (createRole === 'faculty' ? "e.g. Dr. A. K. Verma" : "e.g. Admin User")}
                      className="input-field"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                    />
                  </div>

                  {createRole !== 'admin' ? (
                    <div className="input-group">
                      <label className="input-label">
                        {createRole === 'student' ? 'Student / Roll Number *' : 'Faculty Employee ID *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={createRole === 'student' ? "e.g. 23CS101" : "e.g. GMR-CSE-1022"}
                        className="input-field"
                        value={createIdentifier}
                        onChange={(e) => setCreateIdentifier(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="input-group">
                      <label className="input-label">Account Status</label>
                      <select
                        className="input-field"
                        value={createStatus}
                        onChange={(e) => setCreateStatus(e.target.value)}
                      >
                        <option value="active">Active (Immediate Login)</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Institutional Email *</label>
                    <input
                      type="email"
                      required
                      placeholder={createRole === 'student' ? "student@gmrit.edu.in" : "user@gmrit.edu.in"}
                      className="input-field"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                    />
                  </div>

                  {createRole !== 'admin' ? (
                    <div className="input-group">
                      <label className="input-label">Academic Department *</label>
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
                  ) : (
                    <div className="input-group">
                      <label className="input-label">Scope</label>
                      <input type="text" disabled value="Institutional System" className="input-field" style={{ opacity: 0.8 }} />
                    </div>
                  )}
                </div>

                {/* Student specific fields */}
                {createRole === 'student' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <div className="input-group">
                        <label className="input-label">Academic Year</label>
                        <select className="input-field" value={createYear} onChange={(e) => handleYearChange(e.target.value)}>
                          <option value="1">I Year</option>
                          <option value="2">II Year</option>
                          <option value="3">III Year</option>
                          <option value="4">IV Year</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Semester</label>
                        <select className="input-field" value={createSemester} onChange={(e) => setCreateSemester(e.target.value)}>
                          <option value="1">Semester 1</option>
                          <option value="2">Semester 2</option>
                          <option value="3">Semester 3</option>
                          <option value="4">Semester 4</option>
                          <option value="5">Semester 5</option>
                          <option value="6">Semester 6</option>
                          <option value="7">Semester 7</option>
                          <option value="8">Semester 8</option>
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

                    <div className="input-group" style={{ marginBottom: '14px' }}>
                      <label className="input-label">Account Status</label>
                      <select
                        className="input-field"
                        value={createStatus}
                        onChange={(e) => setCreateStatus(e.target.value)}
                      >
                        <option value="active">Active (Immediate Login)</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Faculty specific fields */}
                {createRole === 'faculty' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div className="input-group">
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

                    <div className="input-group">
                      <label className="input-label">Account Status</label>
                      <select
                        className="input-field"
                        value={createStatus}
                        onChange={(e) => setCreateStatus(e.target.value)}
                      >
                        <option value="active">Active (Immediate Login)</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>
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
                  <span>{isSubmittingCreate ? 'Provisioning...' : `Provision & Save ${createRole.charAt(0).toUpperCase() + createRole.slice(1)}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Bulk CSV Import Modal */}
      {showBulkImportModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowBulkImportModal(false)}>
          <div className="modal-content" style={{ maxWidth: '680px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                  Bulk CSV Account Ingestion
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, margin: '2px 0 0 0' }}>
                  Import student or faculty rosters with pre-validation and safe batch provisioning.
                </p>
              </div>
              <button onClick={() => setShowBulkImportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Supported User Types Indicator */}
              <div style={{
                padding: '12px 14px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                  Supported User Types
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                    <GraduationCap size={15} color="var(--color-primary)" />
                    <span>👨‍🎓 Students</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                    <Briefcase size={15} color="var(--color-primary)" />
                    <span>👨‍🏫 Faculty</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                    <Users size={15} color="var(--color-primary)" />
                    <span>👥 Mixed Roster</span>
                  </div>
                </div>
              </div>

              {/* Import Role Mode Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => handleImportRoleChange('student')}
                  className={`btn ${importRole === 'student' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <GraduationCap size={14} />
                  <span>Student Roster</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleImportRoleChange('faculty')}
                  className={`btn ${importRole === 'faculty' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Briefcase size={14} />
                  <span>Faculty Roster</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleImportRoleChange('mixed')}
                  className={`btn ${importRole === 'mixed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Users size={14} />
                  <span>Mixed CSV</span>
                </button>
              </div>

              {/* Template Download & Format Guide */}
              <div style={{
                padding: '12px 14px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text)' }}>
                    {importRole === 'student' ? 'Student CSV Template & Format' : (importRole === 'faculty' ? 'Faculty CSV Template & Format' : 'Mixed Roster Template & Format')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7, fontFamily: 'monospace', marginTop: '2px' }}>
                    {importRole === 'student' 
                      ? 'full_name, email, roll_number, department, year, semester, section, role' 
                      : (importRole === 'faculty' 
                        ? 'full_name, email, employee_id, department, designation, role' 
                        : 'full_name, email, roll_number/employee_id, department, year, semester, section, role')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSampleTemplate(importRole)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11.5px', padding: '5px 12px' }}
                >
                  <Download size={13} />
                  <span>Download Template</span>
                </button>
              </div>

              {/* File Upload Field */}
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Select CSV File (.csv)</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="input-field"
                  style={{ padding: '8px' }}
                />
              </div>

              {/* Fallback Department */}
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Default Department (Fallback if empty in CSV)</label>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                      Pre-Import Validation Report
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-green">{validationReport.validCount} Valid</span>
                      {validationReport.studentCount > 0 && (
                        <span className="badge badge-blue">{validationReport.studentCount} Students</span>
                      )}
                      {validationReport.facultyCount > 0 && (
                        <span className="badge badge-purple">{validationReport.facultyCount} Faculty</span>
                      )}
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
                      <strong>Errors Found in CSV:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {validationReport.invalidRows.map((inv, i) => (
                          <li key={i}>
                            Row {inv.rowNumber}: {inv.errors.join('; ')}
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
                    <span>Importing accounts to database...</span>
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
        </div>,
        document.body
      )}

      {/* 3. Account Provisioned Success Modal */}
      {showSuccessModal && lastCreatedAccount && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" style={{ maxWidth: '460px', width: '100%', textAlign: 'center', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
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
              {lastCreatedAccount.identifier && (
                <div>
                  <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                    {lastCreatedAccount.role === 'Student' ? 'Roll Number: ' : 'Employee ID: '}
                  </span>
                  <strong style={{ fontFamily: 'monospace' }}>{lastCreatedAccount.identifier}</strong>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Email: </span>
                <strong style={{ fontFamily: 'monospace' }}>{lastCreatedAccount.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Temporary Password: </span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{lastCreatedAccount.tempPass}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Initial Status: </span>
                <span className="badge badge-green" style={{ display: 'inline-block', marginLeft: '4px' }}>
                  {lastCreatedAccount.status}
                </span>
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
        </div>,
        document.body
      )}

      {/* 4. Delete User Confirmation Modal */}
      {showDeleteModal && userToDelete && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(43, 33, 24, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={handleCloseDeleteModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: 'var(--color-surface, #FFFDF8)',
              borderRadius: 'var(--radius-xl, 12px)',
              boxShadow: 'var(--shadow-modal, 0 16px 36px -8px rgba(43, 33, 24, 0.16))',
              border: '1px solid var(--color-border)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 id="confirm-delete-title" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                    Confirm Permanent User Deletion
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, margin: '2px 0 0 0' }}>
                    Institutional Governance & RBAC
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: isDeleting ? 'not-allowed' : 'pointer', padding: '4px' }}
                title="Close dialog"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              {deleteError && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--pastel-red-bg, #FFF1F2)',
                  border: '1px solid var(--pastel-red-border, #FECDD3)',
                  borderRadius: '8px',
                  color: '#BE123C',
                  fontSize: '12.5px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} />
                    <span>{deleteError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteError('')}
                    style={{ background: 'none', border: 'none', color: '#BE123C', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <p style={{ fontSize: '13.5px', color: 'var(--color-text)', lineHeight: 1.5, marginBottom: '16px' }}>
                Are you sure you want to permanently delete this account? This action cannot be undone and will purge the authentication account, profile, and associated academic records from the database.
              </p>

              {/* User Details Box */}
              <div style={{
                background: 'var(--color-surface-hover, rgba(0,0,0,0.02))',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7 }}>Full Name:</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text)' }}>{userToDelete.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7 }}>Email Address:</span>
                  <span style={{ fontSize: '12.5px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--color-text)' }}>{userToDelete.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7 }}>Role:</span>
                  <span className={`badge ${
                    userToDelete.role === 'student' ? 'badge-blue' :
                    userToDelete.role === 'faculty' ? 'badge-green' : 'badge-purple'
                  }`}>
                    {userToDelete.displayRole || userToDelete.role}
                  </span>
                </div>
                {(userToDelete.rollNumber || userToDelete.employeeId) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7 }}>
                      {userToDelete.role === 'student' ? 'Roll Number:' : 'Employee ID:'}
                    </span>
                    <span style={{ fontSize: '12.5px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--color-text)' }}>
                      {userToDelete.rollNumber || userToDelete.employeeId}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7 }}>Department / Branch:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {userToDelete.branchDisplayName || userToDelete.department || 'CSE'}
                  </span>
                </div>
              </div>

              {isCurrentAdminUser(userToDelete) && (
                <div style={{
                  padding: '10px 14px',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  color: '#92400E',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>Administrator protection: You cannot delete your own active administrator account.</span>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--bg-subtle, #EFE8DC)' }}>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || isCurrentAdminUser(userToDelete)}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  backgroundColor: '#DC2626',
                  borderColor: '#DC2626',
                  color: '#ffffff',
                  opacity: (isDeleting || isCurrentAdminUser(userToDelete)) ? 0.6 : 1,
                  cursor: (isDeleting || isCurrentAdminUser(userToDelete)) ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? (
                  <>
                    <RotateCw size={14} className="spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
