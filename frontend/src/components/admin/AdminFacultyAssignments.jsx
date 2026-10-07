import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Shield,
  Briefcase
} from 'lucide-react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import userManagementService from '../../services/userManagementService';
import academicDataService, { MASTER_DEPARTMENTS } from '../../services/academicDataService';
import {
  extractCanonicalCohort,
  matchesCohort,
  normalizeBranch,
  resolveBranch,
  resolveDepartment,
  getBranchDisplay
} from '../../services/academicCohortService';
import authService from '../../services/authService';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function AdminFacultyAssignments() {
  const [facultyList, setFacultyList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Assigned' | 'Unassigned'
  const [yearFilter, setYearFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');

  // Modals & Active Faculty State
  const [selectedFaculty, setSelectedFaculty] = useState(null); // When non-null, Modify modal is open
  const [studentList, setStudentList] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // assignment object to delete
  const [conflictData, setConflictData] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Sub-Form State for Add/Edit Assignment inside Modify Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [formData, setFormData] = useState({
    departmentId: 'dept-cse',
    department: 'CSE',
    branch: 'CSE',
    regulation: 'AR23',
    academicYear: '2025-2026',
    year: 4,
    semester: 7,
    section: 'A',
    subjectId: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const currentUser = authService.getCurrentUser();

  // Escape key handler for open modals
  useEscapeKey(() => {
    if (showConflictModal) setShowConflictModal(false);
    else if (showDeleteModal) setShowDeleteModal(null);
    else if (isFormOpen) {
      setIsFormOpen(false);
      setEditingAssignmentId(null);
    } else if (selectedFaculty) setSelectedFaculty(null);
  }, Boolean(selectedFaculty || showConflictModal || showDeleteModal));

  // Lock background page scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedFaculty || showConflictModal || showDeleteModal);
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, [selectedFaculty, showConflictModal, showDeleteModal]);

  // Load all Faculty, Assignments, Departments, and Subjects from Database
  const loadData = useCallback(async () => {
    setLoading(true);
    setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      const [assignRes, usersData, deptsRes, subsRes] = await Promise.all([
        facultyAssignmentService.getAssignments(),
        userManagementService.getAllUsers(),
        academicDataService.getDepartments(),
        academicDataService.getSubjects()
      ]);

      const allAssignments = assignRes.data || [];
      setAssignments(allAssignments);

      const allUsers = Array.isArray(usersData) ? usersData : [];
      const facultyUsers = allUsers.filter(u => u.role === 'faculty');
      const studentUsers = allUsers.filter(u => u.role === 'student');
      setFacultyList(facultyUsers);
      setStudentList(studentUsers);

      if (deptsRes?.data && deptsRes.data.length > 0) {
        setDepartments(deptsRes.data);
        setFormData(prev => (prev.departmentId.startsWith('dept-') ? {
          ...prev,
          departmentId: deptsRes.data[0].id,
          department: deptsRes.data[0].code || 'CSE',
          branch: deptsRes.data[0].code || 'CSE'
        } : prev));
      }
      if (subsRes?.error) {
        setSubjectsError(subsRes.error?.message || 'Unable to load subjects');
      } else if (subsRes?.data) {
        setSubjects(subsRes.data);
        setSubjectsError(null);
      }

      // If a faculty is currently open in modal, refresh their reference
      setSelectedFaculty(prev => {
        if (!prev) return null;
        return facultyUsers.find(f => (f.id || f.userId) === (prev.id || prev.userId)) || prev;
      });
    } catch (err) {
      console.error('[AdminFacultyAssignments] Error loading faculty data:', err);
      setSubjectsError('Unable to load subjects');
    } finally {
      setLoading(false);
      setSubjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map assignments per faculty for multi-key lookup
  const facultyAssignmentsMap = useMemo(() => {
    const map = new Map();
    assignments.forEach(a => {
      const keys = [
        a.facultyUserId,
        a.facultyId,
        a.facultyEmployeeId,
        a.facultyEmail
      ].filter(Boolean);

      keys.forEach(k => {
        if (!map.has(k)) {
          map.set(k, []);
        }
        if (!map.get(k).some(existing => existing.id === a.id)) {
          map.get(k).push(a);
        }
      });
    });
    return map;
  }, [assignments]);

  // Faculty enriched with assignment records & status
  const enrichedFacultyList = useMemo(() => {
    return facultyList.map(f => {
      const fId = f.id || f.userId;
      const fEmp = f.employeeId;
      const fEmail = f.email;

      const facAssignments = [
        ...(facultyAssignmentsMap.get(fId) || []),
        ...(fEmp ? (facultyAssignmentsMap.get(fEmp) || []) : []),
        ...(fEmail ? (facultyAssignmentsMap.get(fEmail) || []) : [])
      ];
      const uniqueAssignments = Array.from(new Map(facAssignments.map(a => [a.id, a])).values());
      const activeAssignments = uniqueAssignments.filter(a => a.isActive);
      const isAssigned = activeAssignments.length > 0;

      return {
        ...f,
        assignments: activeAssignments,
        allAssignments: uniqueAssignments,
        assignmentCount: activeAssignments.length,
        isAssigned,
        statusLabel: isAssigned ? `${activeAssignments.length} Assignment${activeAssignments.length === 1 ? '' : 's'}` : 'Unassigned'
      };
    });
  }, [facultyList, facultyAssignmentsMap]);

  // Top Dashboard Dynamic Statistics
  const stats = useMemo(() => {
    const totalFaculty = facultyList.length;
    const activeAssignments = assignments.filter(a => a.isActive);
    const assignedFacultyIds = new Set(activeAssignments.map(a => a.facultyUserId || a.facultyId));
    const assignedFacultyCount = facultyList.filter(f => assignedFacultyIds.has(f.id) || assignedFacultyIds.has(f.userId)).length;
    const unassignedFacultyCount = Math.max(0, totalFaculty - assignedFacultyCount);

    return {
      totalFaculty,
      assignedFaculty: assignedFacultyCount,
      unassignedFaculty: unassignedFacultyCount,
      subjectAssignments: activeAssignments.length
    };
  }, [facultyList, assignments]);

  // Main Table Filtered Faculty List
  const filteredFacultyList = useMemo(() => {
    return enrichedFacultyList.filter(f => {
      // 1. Department Filter
      if (departmentFilter !== 'All') {
        const matchesDept = f.departmentId === departmentFilter || 
                            (f.department && f.department.toLowerCase().includes(departmentFilter.toLowerCase()));
        if (!matchesDept) return false;
      }

      // 2. Assignment Status Filter
      if (statusFilter === 'Assigned' && !f.isAssigned) return false;
      if (statusFilter === 'Unassigned' && f.isAssigned) return false;

      // 3. Year Filter
      if (yearFilter !== 'All') {
        const teachesYear = f.assignments.some(a => String(a.year) === String(yearFilter));
        if (!teachesYear) return false;
      }

      // 4. Semester Filter
      if (semesterFilter !== 'All') {
        const teachesSem = f.assignments.some(a => String(a.semester) === String(semesterFilter));
        if (!teachesSem) return false;
      }

      // 5. Section Filter
      if (sectionFilter !== 'All') {
        const teachesSec = f.assignments.some(a => (a.section || 'A').toUpperCase() === sectionFilter.toUpperCase());
        if (!teachesSec) return false;
      }

      // 6. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const name = (f.name || f.full_name || '').toLowerCase();
        const emp = (f.employeeId || '').toLowerCase();
        const email = (f.email || '').toLowerCase();
        const dept = (f.department || '').toLowerCase();
        const subMatch = f.assignments.some(a => 
          (a.subjectName || '').toLowerCase().includes(q) || 
          (a.subjectCode || '').toLowerCase().includes(q) ||
          `section ${a.section}`.toLowerCase().includes(q)
        );
        return name.includes(q) || emp.includes(q) || email.includes(q) || dept.includes(q) || subMatch;
      }

      return true;
    });
  }, [enrichedFacultyList, departmentFilter, statusFilter, yearFilter, semesterFilter, sectionFilter, searchQuery]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('All');
    setStatusFilter('All');
    setYearFilter('All');
    setSemesterFilter('All');
    setSectionFilter('All');
  };

  // Open Modify Modal for a specific faculty
  const handleOpenModifyModal = (faculty) => {
    setSelectedFaculty(faculty);
    setIsFormOpen(false);
    setEditingAssignmentId(null);
    setFormError(null);
  };

  // Open "+ Add Assignment" sub-form inside Modify Modal
  const handleOpenAddForm = () => {
    setFormError(null);
    setEditingAssignmentId(null);
    setFormData({
      departmentId: 'dept-cse',
      department: 'CSE',
      branch: 'CSE',
      regulation: 'AR23',
      academicYear: '2025-2026',
      year: 4,
      semester: 7,
      section: 'A',
      subjectId: ''
    });
    setIsFormOpen(true);
  };

  // Open "Edit" sub-form for an existing assignment inside Modify Modal
  const handleOpenEditForm = (assignment) => {
    setFormError(null);
    setEditingAssignmentId(assignment.id);
    const branch = resolveBranch(assignment.branch || assignment.branchId || assignment.departmentCode || assignment.departmentId);
    const dept = resolveDepartment(assignment.department || assignment.departmentCode || assignment.departmentId);
    setFormData({
      departmentId: assignment.departmentId || (branch === 'AIML' ? 'dept-aiml' : branch === 'AIDS' ? 'dept-aids' : 'dept-cse'),
      department: dept,
      branch: branch,
      regulation: assignment.regulation || 'AR23',
      academicYear: assignment.academicYear || '2025-2026',
      year: Number(assignment.year) || 4,
      semester: Number(assignment.semester) || 7,
      section: assignment.section || 'A',
      subjectId: assignment.subjectId || ''
    });
    setIsFormOpen(true);
  };

  // Smart dropdown updates inside Add/Edit form
  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'year') {
        const numYear = Number(String(value).replace(/\D/g, '')) || 1;
        updated.semester = (numYear * 2) - 1; // e.g. Year 3 -> Semester 5
      }
      return updated;
    });
  };

  // Smart subjects filtered by Department, Semester, and Regulation
  const availableSubjectsForForm = useMemo(() => {
    if (subjectsError) return [];
    if (!subjects || subjects.length === 0) return [];

    // Resolve the selected department record
    const selectedDept = departments.find(d => 
      d.id === formData.departmentId || 
      d.code === formData.departmentId ||
      d.name === formData.departmentId
    ) || MASTER_DEPARTMENTS.find(d => 
      d.id === formData.departmentId || 
      d.code === formData.departmentId ||
      d.name === formData.departmentId
    );

    const selectedDeptCode = (selectedDept?.code || formData.departmentId || '').toUpperCase();
    const selectedDeptId = String(selectedDept?.id || formData.departmentId || '').toLowerCase();
    const selectedDeptName = (selectedDept?.name || '').toLowerCase();
    
    const isCse = 
      selectedDeptCode === 'CSE' ||
      selectedDeptCode === 'AIML' ||
      selectedDeptCode === 'AIDS' ||
      selectedDeptCode.includes('CSE') ||
      selectedDeptCode.includes('AIML') ||
      selectedDeptCode.includes('AIDS') ||
      selectedDeptCode.includes('CS') ||
      selectedDeptName.includes('cse') ||
      selectedDeptName.includes('computer') ||
      selectedDeptName.includes('artificial intelligence') ||
      selectedDeptName.includes('machine learning') ||
      selectedDeptName.includes('data science') ||
      selectedDeptId.includes('cse') ||
      selectedDeptId.includes('aiml') ||
      selectedDeptId.includes('aids');

    // Normalize Form Filters
    const formSem = Number(String(formData.semester || '').replace(/\D/g, '')) || null;
    const formYear = Number(String(formData.year || '').replace(/\D/g, '')) || (formSem ? Math.ceil(formSem / 2) : null);
    const formReg = String(formData.regulation || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');

    return subjects.filter(s => {
      // 1. Department Filter (Matches department ID, code, or CSE curriculum)
      if (formData.departmentId && formData.departmentId !== 'All') {
        const sDeptId = String(s.departmentId || s.department_id || '').toLowerCase();
        const sDeptCode = String(s.departmentCode || s.deptCode || '').toUpperCase();
        const sDeptName = String(s.department || s.departmentName || '').toLowerCase();

        const directIdMatch = sDeptId && (sDeptId === selectedDeptId || sDeptId === String(formData.departmentId).toLowerCase());
        const codeMatch = sDeptCode && (sDeptCode === selectedDeptCode);
        const nameMatch = sDeptName && selectedDeptName && (sDeptName.includes(selectedDeptName) || selectedDeptName.includes(sDeptName));

        // In GMRIT CSE syllabus, subjects include CORE CSE & approved curriculum electives
        const cseDeptMatch = isCse && (
          sDeptId === 'dept-cse' ||
          sDeptId === 'dept-aiml' ||
          sDeptId === 'dept-aids' ||
          sDeptId.includes('cse') ||
          sDeptId.includes('aiml') ||
          sDeptId.includes('aids') ||
          sDeptCode === 'CSE' ||
          sDeptCode === 'AIML' ||
          sDeptCode === 'AIDS' ||
          (!s.departmentId && !s.department_id && !s.department)
        );

        if (!directIdMatch && !codeMatch && !nameMatch && !cseDeptMatch) {
          return false;
        }
      }

      // 2. Semester Filter (Numeric normalized: "Semester 5" / "5" / 5)
      if (formSem) {
        const sSem = Number(String(s.semester || '').replace(/\D/g, '')) || null;
        if (sSem && sSem !== formSem) {
          return false;
        }
      }

      // 3. Year Filter (If subject explicitly defines a year field)
      if (formYear && s.year) {
        const sYear = Number(String(s.year).replace(/\D/g, '')) || null;
        if (sYear && sYear !== formYear) {
          return false;
        }
      }

      // 4. Regulation Filter (Normalized: AR23, R20, R23)
      if (formReg && s.regulation) {
        const sReg = String(s.regulation).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
        if (sReg) {
          const directRegMatch = sReg === formReg;
          const both23 = formReg.includes('23') && sReg.includes('23');
          const both20 = formReg.includes('20') && sReg.includes('20');
          if (!directRegMatch && !both23 && !both20) {
            return false;
          }
        }
      }

      return true;
    });
  }, [subjects, departments, formData.departmentId, formData.semester, formData.year, formData.regulation, subjectsError]);

  // Dynamic Mapped Students preview for the selected academic cohort
  const mappedStudentsPreview = useMemo(() => {
    const branch = resolveBranch(formData.branch || formData.departmentId);
    const department = resolveDepartment(formData.department || formData.departmentId);
    const branchDisplayName = getBranchDisplay(department, branch);

    const targetCohort = extractCanonicalCohort({
      department,
      branch,
      year: formData.year,
      semester: formData.semester,
      section: formData.section,
      academicYear: formData.academicYear,
      regulation: formData.regulation
    });

    if (!targetCohort) return null;

    const matching = studentList.filter(s => matchesCohort(s, targetCohort));
    const displayCount = matching.length;
    const yearSuffix = targetCohort.year === 1 ? '1st' : targetCohort.year === 2 ? '2nd' : targetCohort.year === 3 ? '3rd' : `${targetCohort.year}th`;
    return {
      count: displayCount,
      displayBranch: branchDisplayName,
      deptCode: branchDisplayName,
      yearText: `${yearSuffix} Year`,
      semester: targetCohort.semester,
      section: targetCohort.section,
      academicYear: targetCohort.academicYear
    };
  }, [studentList, formData]);

  // Submit Add or Edit Assignment Form
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (!formData.subjectId) {
        throw new Error('Please select a Subject.');
      }

      const facultyId = selectedFaculty.id || selectedFaculty.userId;
      const branch = resolveBranch(formData.branch || formData.departmentId);
      const department = resolveDepartment(formData.department || formData.departmentId);
      const branchDisplayName = getBranchDisplay(department, branch);

      // Resolve real department UUID from loaded departments
      const matchingDept = departments.find(d => 
        d.id === formData.departmentId ||
        d.code === branch ||
        (branch === 'AIML' && d.code === 'AIML') ||
        (branch === 'AIDS' && d.code === 'AIDS') ||
        (branch === 'CSE' && d.code === 'CSE')
      );
      const targetDeptId = matchingDept?.id || formData.departmentId;

      // 1. If EDITING existing assignment
      if (editingAssignmentId) {
        await facultyAssignmentService.updateAssignment(editingAssignmentId, {
          facultyId,
          departmentId: targetDeptId,
          department: department,
          departmentCode: branchDisplayName,
          branch: branch,
          branchId: branch,
          subjectId: formData.subjectId,
          year: Number(formData.year),
          semester: Number(formData.semester),
          section: formData.section,
          regulation: formData.regulation,
          academicYear: formData.academicYear
        }, currentUser);

        setIsFormOpen(false);
        setEditingAssignmentId(null);
        setFeedback({
          type: 'success',
          message: `Assignment updated for ${selectedFaculty.name || 'Faculty'}.`
        });
        await loadData();
        return;
      }

      // 2. If CREATING new assignment -> check conflict
      const conflictCheck = await facultyAssignmentService.checkConflict({
        subjectId: formData.subjectId,
        departmentId: targetDeptId,
        department: department,
        branch: branch,
        year: Number(formData.year),
        semester: Number(formData.semester),
        section: formData.section,
        academicYear: formData.academicYear,
        facultyId
      });

      if (conflictCheck.hasConflict) {
        if (conflictCheck.isSameFaculty) {
          throw new Error(`This faculty member is already actively assigned to this subject and Section ${formData.section}.`);
        } else {
          // Trigger conflict replace modal
          setConflictData({
            newAssignment: {
              ...formData,
              facultyId,
              departmentId: targetDeptId,
              department: department,
              departmentCode: branchDisplayName,
              branch: branch,
              branchId: branch
            },
            existingAssignment: conflictCheck.existingAssignment
          });
          setShowConflictModal(true);
          setFormSubmitting(false);
          return;
        }
      }

      // Direct create
      await facultyAssignmentService.createAssignment({
        ...formData,
        facultyId,
        departmentId: targetDeptId,
        department: department,
        departmentCode: branchDisplayName,
        branch: branch,
        branchId: branch
      }, null, currentUser);

      setIsFormOpen(false);
      setFeedback({
        type: 'success',
        message: `New subject assigned to ${selectedFaculty.name || 'Faculty'} successfully.`
      });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save assignment.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Conflict Replace
  const handleConfirmConflictReplace = async () => {
    if (!conflictData) return;
    setFormSubmitting(true);
    try {
      await facultyAssignmentService.createAssignment(
        conflictData.newAssignment,
        conflictData.existingAssignment.id,
        currentUser
      );
      setShowConflictModal(false);
      setConflictData(null);
      setIsFormOpen(false);
      setFeedback({
        type: 'success',
        message: `Previous assignment replaced. New subject assigned to ${selectedFaculty?.name || 'Faculty'}.`
      });
      await loadData();
    } catch (err) {
      alert(`Error replacing assignment: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Delete / Remove Assignment
  const handleConfirmRemoveAssignment = async () => {
    if (!showDeleteModal) return;
    setFormSubmitting(true);
    try {
      await facultyAssignmentService.deleteAssignment(showDeleteModal.id, currentUser);
      setShowDeleteModal(null);
      setFeedback({
        type: 'success',
        message: 'Assignment removed.'
      });
      await loadData();
    } catch (err) {
      alert(`Failed to remove assignment: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Current faculty's active assignments in open modal
  const activeModalFacultyAssignments = useMemo(() => {
    if (!selectedFaculty) return [];
    const fId = selectedFaculty.id || selectedFaculty.userId;
    const fEmp = selectedFaculty.employeeId;
    const fEmail = selectedFaculty.email;

    const facAssignments = [
      ...(facultyAssignmentsMap.get(fId) || []),
      ...(fEmp ? (facultyAssignmentsMap.get(fEmp) || []) : []),
      ...(fEmail ? (facultyAssignmentsMap.get(fEmail) || []) : [])
    ];
    const uniqueAssignments = Array.from(new Map(facAssignments.map(a => [a.id, a])).values());
    return uniqueAssignments.filter(a => a.isActive);
  }, [selectedFaculty, facultyAssignmentsMap]);

  return (
    <div className="page-content">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

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
            Faculty Assignments
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Assign faculty members to subjects, classes, and sections
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            title="Refresh faculty list"
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Database-Driven KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL FACULTY
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
              {loading ? '...' : stats.totalFaculty}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              Registered Staff Profiles
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ASSIGNED FACULTY
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
              {loading ? '...' : stats.assignedFaculty}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              Teaching ≥ 1 Subject
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              UNASSIGNED FACULTY
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserX size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#ea580c', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
              {loading ? '...' : stats.unassignedFaculty}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              0 Assigned Subjects
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              SUBJECT ASSIGNMENTS
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
              {loading ? '...' : stats.subjectAssignments}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px', fontWeight: 500 }}>
              Active Class Sections
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>Search Faculty</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)', opacity: 0.5 }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, emp ID, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>Department</label>
            <select
              className="input-field"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ fontSize: '12.5px' }}
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>Assignment Status</label>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '12.5px' }}
            >
              <option value="All">All Faculty</option>
              <option value="Assigned">Assigned (≥ 1 Subject)</option>
              <option value="Unassigned">Unassigned (0 Subjects)</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>Teaching Year</label>
            <select
              className="input-field"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ fontSize: '12.5px' }}
            >
              <option value="All">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="input-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>Teaching Section</label>
            <select
              className="input-field"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{ fontSize: '12.5px' }}
            >
              <option value="All">All Sections</option>
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', height: '36px', fontSize: '12px' }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Faculty-First Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              Faculty Assignment Registry
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.6, margin: '2px 0 0' }}>
              Showing {filteredFacultyList.length} of {facultyList.length} faculty members
            </p>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th style={{ textAlign: 'center' }}>Assignments</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && facultyList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text)', opacity: 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <RotateCw size={16} className="spin" />
                      <span>Loading faculty members from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFacultyList.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Faculty Members Found"
                  message={searchQuery || departmentFilter !== 'All' || statusFilter !== 'All'
                    ? "No faculty match your search and filter criteria. Try resetting filters."
                    : "No faculty accounts have been provisioned in the system yet."}
                  isTableRow={true}
                  colSpan={6}
                  actionText={searchQuery || departmentFilter !== 'All' ? "Reset Filters" : undefined}
                  onAction={searchQuery || departmentFilter !== 'All' ? handleResetFilters : undefined}
                />
              ) : (
                filteredFacultyList.map((fac) => {
                  const initials = (fac.name || fac.full_name || 'F').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={fac.id || fac.userId}>
                      {/* Faculty Info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '13.5px' }}>
                              {fac.name || fac.full_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.65 }}>
                              {fac.email} {fac.designation ? `• ${fac.designation}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '12.5px', color: 'var(--color-text)' }}>
                          {fac.employeeId || '—'}
                        </span>
                      </td>

                      {/* Department */}
                      <td>
                        <span className="badge" style={{ fontWeight: 600 }}>
                          {fac.department || 'CSE'}
                        </span>
                      </td>

                      {/* Assignments Count */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-purple" style={{ fontWeight: 700, fontSize: '11.5px', padding: '2px 8px' }}>
                          {fac.assignmentCount} {fac.assignmentCount === 1 ? 'Assignment' : 'Assignments'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: 'center' }}>
                        {fac.isAssigned ? (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            <CheckCircle2 size={11} /> Assigned
                          </span>
                        ) : (
                          <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}>
                            <AlertCircle size={11} /> Unassigned
                          </span>
                        )}
                      </td>

                      {/* Action -> Modify Button */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenModifyModal(fac)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 14px', fontSize: '12px', fontWeight: 600 }}
                        >
                          Modify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REDESIGNED FACULTY-SPECIFIC ASSIGNMENT MODAL (PROPER 3-SECTION MODAL) */}
      {/* ========================================================================= */}
      {selectedFaculty && (
        <div
          className="faculty-modal-overlay"
          onClick={() => setSelectedFaculty(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modify-faculty-title"
        >
          <div
            className="faculty-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. FIXED HEADER */}
            <div className="faculty-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-light, #fed7aa)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3
                    id="modify-faculty-title"
                    style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.3px' }}
                  >
                    Modify Faculty Assignment
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.7, margin: '2px 0 0 0' }}>
                    Manage subjects and sections for this faculty
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedFaculty(null)}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text)',
                  opacity: 0.6,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. SCROLLABLE CONTENT BODY */}
            <div className="faculty-modal-content">
              {/* Faculty Profile Section */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  FACULTY PROFILE
                </div>
                <div className="faculty-profile-banner">
                  <div>
                    <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                      {selectedFaculty.name || selectedFaculty.full_name}
                    </h4>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>Employee ID: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedFaculty.employeeId || '—'}</strong></span>
                      <span>•</span>
                      <span>{selectedFaculty.department || 'CSE'}{selectedFaculty.designation ? ` • ${selectedFaculty.designation}` : ''}</span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`badge ${activeModalFacultyAssignments.length > 0 ? 'badge-green' : 'badge-orange'}`}
                      style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 10px' }}
                    >
                      {activeModalFacultyAssignments.length} Active {activeModalFacultyAssignments.length === 1 ? 'Assignment' : 'Assignments'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Assignments Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                    Current Assignments
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.65 }}>
                    {activeModalFacultyAssignments.length} {activeModalFacultyAssignments.length === 1 ? 'course mapped' : 'courses mapped'}
                  </span>
                </div>

                {activeModalFacultyAssignments.length === 0 ? (
                  <div style={{
                    padding: '22px 18px',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px dashed var(--color-border)',
                    color: 'var(--color-text)'
                  }}>
                    <BookOpen size={24} style={{ margin: '0 auto 8px', opacity: 0.4, color: 'var(--color-primary)' }} />
                    <div style={{ fontWeight: 700, fontSize: '13.5px' }}>No assignments yet.</div>
                    <p style={{ fontSize: '12px', opacity: 0.65, margin: '4px 0 12px' }}>
                      Assign this faculty member to a subject and section.
                    </p>
                    {!isFormOpen && (
                      <button
                        type="button"
                        onClick={handleOpenAddForm}
                        className="btn btn-primary btn-sm"
                        style={{ margin: '0 auto', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Plus size={14} />
                        <span>+ Add Assignment</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeModalFacultyAssignments.map((a) => (
                      <div
                        key={a.id}
                        className="assignment-card-compact"
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-text)' }}>
                              {a.subjectName}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, fontWeight: 600 }}>
                              {a.subjectCode} • {a.subjectCredits || a.credits || 3} Credits
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.75, marginTop: '3px' }}>
                            {a.year === 1 ? '1st' : a.year === 2 ? '2nd' : a.year === 3 ? '3rd' : `${a.year}th`} Year • Semester {a.semester} • <strong>Section {a.section}</strong> • {a.regulation || 'AR23'}
                          </div>
                        </div>

                        <div className="card-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(a)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}
                            title="Edit this assignment"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteModal(a)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: '#dc2626' }}
                            title="Remove assignment"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add / Edit Assignment Collapsible Form */}
              <div>
                {!isFormOpen ? (
                  <button
                    type="button"
                    onClick={handleOpenAddForm}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px dashed var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={16} />
                    <span>+ Add New Assignment</span>
                  </button>
                ) : (
                  <div className="assignment-form-container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {editingAssignmentId ? <Edit2 size={12} /> : <Plus size={13} />}
                        </div>
                        <h5 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                          {editingAssignmentId ? 'Edit Assignment' : 'Add New Assignment'}
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsFormOpen(false); setEditingAssignmentId(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', opacity: 0.6, padding: '4px' }}
                        title="Close form"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {formError && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '12.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '14px'
                      }}>
                        <AlertTriangle size={15} />
                        <span>{formError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Row 1: Department (1fr), Branch (1fr), Academic Year (1fr) */}
                      <div className="form-grid-3col">
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>Department *</label>
                          <select
                            className="input-field"
                            value={formData.department || 'CSE'}
                            onChange={(e) => handleFormChange('department', e.target.value)}
                            required
                            style={{ fontSize: '12.5px', height: '38px' }}
                          >
                            <option value="CSE">CSE</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>Branch *</label>
                          <select
                            className="input-field"
                            value={formData.branch || 'CSE'}
                            onChange={(e) => handleFormChange('branch', e.target.value)}
                            required
                            style={{ fontSize: '12.5px', height: '38px' }}
                          >
                            <option value="CSE">CSE</option>
                            <option value="AIML">AIML</option>
                            <option value="AIDS">AIDS</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>Academic Year *</label>
                          <select
                            className="input-field"
                            value={formData.academicYear}
                            onChange={(e) => handleFormChange('academicYear', e.target.value)}
                            required
                            style={{ fontSize: '12.5px', height: '38px' }}
                          >
                            <option value="2025-2026">2025-2026 (Current)</option>
                            <option value="2024-2025">2024-2025</option>
                            <option value="2023-2024">2023-2024</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Year (1fr), Semester (1fr), Section (1fr) */}
                      <div className="form-grid-3col">
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>Year *</label>
                          <select
                            className="input-field"
                            value={formData.year}
                            onChange={(e) => handleFormChange('year', e.target.value)}
                            required
                            style={{ fontSize: '12.5px', height: '38px' }}
                          >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>Semester *</label>
                          <select
                            className="input-field"
                            value={formData.semester}
                            onChange={(e) => handleFormChange('semester', e.target.value)}
                            required
                            style={{ fontSize: '12.5px', height: '38px' }}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>Section *</label>
                          <select
                            className="input-field"
                            value={formData.section}
                            onChange={(e) => handleFormChange('section', e.target.value)}
                            required
                            style={{ fontSize: '12.5px', height: '38px' }}
                          >
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                            <option value="D">Section D</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 3: Regulation (1fr), Subject / Course (2fr) */}
                      <div className="form-grid-subject">
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700 }}>Regulation *</label>
                          <select
                            className="input-field"
                            value={formData.regulation}
                            onChange={(e) => handleFormChange('regulation', e.target.value)}
                            required
                            style={{ fontSize: '12.5px', height: '38px' }}
                          >
                            <option value="AR23">AR23</option>
                            <option value="R20">R20</option>
                            <option value="R23">R23</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>
                              Subject / Course *
                            </label>
                            <span style={{ 
                              fontSize: '11px', 
                              color: subjectsError ? '#ef4444' : 'var(--color-text)', 
                              opacity: subjectsError ? 1 : 0.6, 
                              fontWeight: subjectsError ? 600 : 400 
                            }}>
                              {subjectsLoading 
                                ? '(Loading...)' 
                                : subjectsError 
                                  ? '(Unable to load subjects)' 
                                  : `(${availableSubjectsForForm.length} available)`}
                            </span>
                          </div>
                          <select
                            className="input-field"
                            value={formData.subjectId}
                            onChange={(e) => handleFormChange('subjectId', e.target.value)}
                            required
                            disabled={subjectsLoading || Boolean(subjectsError)}
                            style={{ fontSize: '12.5px', height: '38px', borderColor: subjectsError ? '#ef4444' : undefined }}
                          >
                            {subjectsLoading ? (
                              <option value="" disabled>Loading subjects...</option>
                            ) : subjectsError ? (
                              <option value="" disabled>Unable to load subjects</option>
                            ) : (
                              <>
                                <option value="" disabled>Select Subject</option>
                                {availableSubjectsForForm.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.code} — {s.name} ({s.credits || 3} Credits)
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Dynamic Mapped Students Live Preview */}
                      {mappedStudentsPreview && (
                        <div style={{
                          padding: '10px 14px',
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          marginTop: '4px',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div>
                            <div style={{ fontSize: '10.5px', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Mapped Students
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text)' }}>
                              {mappedStudentsPreview.count} Students
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Automatically mapped from</span>{' '}
                            <strong style={{ color: 'var(--color-text)' }}>
                              {mappedStudentsPreview.deptCode} • {mappedStudentsPreview.yearText} • Sem {mappedStudentsPreview.semester} • Sec {mappedStudentsPreview.section}
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Form Footer Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setIsFormOpen(false); setEditingAssignmentId(null); }}
                          disabled={formSubmitting}
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={formSubmitting}
                          style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 700 }}
                        >
                          {formSubmitting ? 'Saving...' : editingAssignmentId ? 'Update Assignment' : 'Save Assignment'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* 3. FIXED FOOTER */}
            <div className="faculty-modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedFaculty(null)}
                style={{ padding: '7px 16px', fontSize: '12.5px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedFaculty(null)}
                style={{ padding: '7px 18px', fontSize: '12.5px', fontWeight: 700 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFLICT DETECTION & REPLACE WARNING MODAL */}
      {showConflictModal && conflictData && (
        <div className="modal-overlay" onClick={() => setShowConflictModal(false)}>
          <div className="modal-container" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottomColor: '#fed7aa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ffedd5'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '15.5px', fontWeight: 800, color: '#9a3412' }}>
                    Assignment Conflict Detected
                  </h3>
                  <p className="modal-subtitle" style={{ fontSize: '12px', color: '#c2410c' }}>
                    Section is already assigned to another faculty member
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowConflictModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: '12.5px',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                  {conflictData.existingAssignment.subjectName} ({conflictData.existingAssignment.subjectCode})
                </div>
                <div style={{ color: 'var(--color-text)', opacity: 0.8, marginTop: '2px' }}>
                  {conflictData.existingAssignment.departmentCode} • Year {conflictData.existingAssignment.year} • Semester {conflictData.existingAssignment.semester} • <strong>Section {conflictData.existingAssignment.section}</strong>
                </div>
                <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: '#fff7ed', borderRadius: 'var(--radius-xs)', border: '1px solid #ffedd5', color: '#9a3412', fontWeight: 600 }}>
                  Currently Assigned: {conflictData.existingAssignment.facultyName} ({conflictData.existingAssignment.facultyEmployeeId})
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.85, margin: 0 }}>
                Do you want to cancel or replace the existing assignment for {selectedFaculty?.name || 'this faculty'}?
              </p>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowConflictModal(false);
                  setConflictData(null);
                }}
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmConflictReplace}
                disabled={formSubmitting}
                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
              >
                {formSubmitting ? 'Replacing...' : 'Replace Existing Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE ASSIGNMENT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal-container" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '15px', fontWeight: 800 }}>
                    Remove Assignment?
                  </h3>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to remove <strong>{showDeleteModal.subjectName}</strong> (Section {showDeleteModal.section}) from <strong>{selectedFaculty?.name || showDeleteModal.facultyName}</strong>?
              </p>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowDeleteModal(null)}
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmRemoveAssignment}
                disabled={formSubmitting}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                {formSubmitting ? 'Removing...' : 'Remove Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
