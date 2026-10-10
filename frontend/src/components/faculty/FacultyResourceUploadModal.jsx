import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, UploadCloud, FileText, CheckCircle2, AlertCircle, 
  Loader2, Trash2, Layers, BookOpen, Lock, Users, Search, Check, RefreshCw
} from 'lucide-react';
import ragDocumentService, { DOCUMENT_TYPES } from '../../services/ragDocumentService';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import authService from '../../services/authService';
import { extractCanonicalCohort, getBranchDisplay } from '../../services/academicCohortService';
import useEscapeKey from '../../hooks/useEscapeKey';

export default function FacultyResourceUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Audience State: 'cohort' | 'selected_students'
  const [audienceType, setAudienceType] = useState('cohort');
  const [cohortStudents, setCohortStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form Fields
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('notes');
  const [status, setStatus] = useState('published');

  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const requestIdRef = useRef(0);

  useEscapeKey(() => {
    if (!isUploading) onClose();
  }, isOpen);

  // Load faculty's assigned courses from database with timeout safeguard
  const loadFacultyAssignments = useCallback(async () => {
    if (!isOpen) return;
    const currentReqId = ++requestIdRef.current;

    setLoadingAssignments(true);
    setUploadError(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Course assignments request timed out. Please check your network and click Retry.')), 8000)
    );

    try {
      const fetchPromise = (async () => {
        const currentUser = authService.getCurrentUser();
        const uid = currentUser?.userId || currentUser?.id;
        
        let assignedClasses = await facultyAssignmentService.getFacultyAssignedClasses(uid);
        
        if (!Array.isArray(assignedClasses) || assignedClasses.length === 0) {
          const fallbackList = await facultyAssignmentService.getAssignments({ facultyId: uid });
          assignedClasses = Array.isArray(fallbackList) ? fallbackList : (fallbackList?.data || []);
        }
        return assignedClasses;
      })();

      const assignedClasses = await Promise.race([fetchPromise, timeoutPromise]);

      if (requestIdRef.current === currentReqId) {
        if (Array.isArray(assignedClasses)) {
          setAssignments(assignedClasses);
        } else {
          setAssignments([]);
        }
      }
    } catch (err) {
      console.warn('[FacultyResourceUploadModal] Error loading assignments:', err);
      if (requestIdRef.current === currentReqId) {
        setUploadError(err.message || 'Failed to load your assigned subjects from the database. Click Retry to reload.');
        setAssignments([]);
      }
    } finally {
      if (requestIdRef.current === currentReqId) {
        setLoadingAssignments(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedAssignmentId('');
      setSelectedAssignment(null);
      setAudienceType('cohort');
      setCohortStudents([]);
      setSelectedStudentIds([]);
      setStudentSearchQuery('');
      setFile(null);
      setTitle('');
      setDescription('');
      setUploadError(null);
      setUploadSuccess(false);
      loadFacultyAssignments();
    }
  }, [isOpen, loadFacultyAssignments]);

  // Load enrolled students when an assignment is selected
  useEffect(() => {
    let isMounted = true;
    async function loadStudentsForCohort() {
      if (!selectedAssignment) {
        setCohortStudents([]);
        setSelectedStudentIds([]);
        return;
      }

      setLoadingStudents(true);
      try {
        const currentUser = authService.getCurrentUser();
        const uid = currentUser?.userId || currentUser?.id;
        const targetAssignmentId = selectedAssignment.id || selectedAssignment.assignmentId;
        const targetSection = selectedAssignment.section;

        const students = await facultyAssignmentService.getFacultyAssignedStudents(
          uid,
          targetSection,
          targetAssignmentId
        );

        if (isMounted) {
          setCohortStudents(Array.isArray(students) ? students : []);
        }
      } catch (err) {
        console.warn('[FacultyResourceUploadModal] Error loading cohort students:', err);
        if (isMounted) setCohortStudents([]);
      } finally {
        if (isMounted) setLoadingStudents(false);
      }
    }

    loadStudentsForCohort();
    return () => { isMounted = false; };
  }, [selectedAssignment]);

  const handleAssignmentChange = (e) => {
    const aid = e.target.value;
    setSelectedAssignmentId(aid);
    const found = assignments.find(a => (a.id === aid || a.assignmentId === aid));
    setSelectedAssignment(found || null);
    setSelectedStudentIds([]);
    setStudentSearchQuery('');
  };

  const handleFileSelect = (selectedFile) => {
    setUploadError(null);
    if (!selectedFile) return;

    const validation = ragDocumentService.validatePdfFile(selectedFile);
    if (!validation.valid) {
      setUploadError(validation.error);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    if (!title) {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(baseName);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [title]);

  // Filter cohort students by search query
  const filteredCohortStudents = useMemo(() => {
    if (!cohortStudents || cohortStudents.length === 0) return [];
    if (!studentSearchQuery.trim()) return cohortStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return cohortStudents.filter(s => {
      const name = (s.name || s.user?.full_name || '').toLowerCase();
      const roll = (s.roll_number || s.rollNumber || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      return name.includes(q) || roll.includes(q) || email.includes(q);
    });
  }, [cohortStudents, studentSearchQuery]);

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAllStudents = () => {
    const allFilteredIds = filteredCohortStudents.map(s => s.userId || s.user_id || s.id);
    setSelectedStudentIds(prev => {
      const set = new Set([...prev, ...allFilteredIds]);
      return Array.from(set);
    });
  };

  const handleClearSelectedStudents = () => {
    setSelectedStudentIds([]);
  };

  const isFormValid = useMemo(() => {
    if (!file) return false;
    if (!title.trim()) return false;
    if (!selectedAssignment || !selectedAssignmentId) return false;
    if (audienceType === 'selected_students' && selectedStudentIds.length === 0) return false;
    return true;
  }, [file, title, selectedAssignment, selectedAssignmentId, audienceType, selectedStudentIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);

    if (!file) {
      setUploadError('Please select a valid PDF document to upload.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please enter a descriptive document title.');
      return;
    }
    if (!selectedAssignment) {
      setUploadError('Please select an assigned course and class cohort.');
      return;
    }
    if (audienceType === 'selected_students' && selectedStudentIds.length === 0) {
      setUploadError('Please select at least 1 student from the mapped cohort for this resource.');
      return;
    }

    setIsUploading(true);

    try {
      const currentUser = authService.getCurrentUser();
      const cohort = extractCanonicalCohort(selectedAssignment);

      const payload = {
        file,
        title: title.trim(),
        description: description.trim(),
        documentType,
        facultyAssignmentId: selectedAssignment.id || selectedAssignment.assignmentId,
        subjectId: selectedAssignment.subjectId || selectedAssignment.subject_id,
        subjectName: selectedAssignment.subjectName || selectedAssignment.name || selectedAssignment.subject,
        subjectCode: selectedAssignment.subjectCode || selectedAssignment.code,
        departmentId: selectedAssignment.departmentId || selectedAssignment.department_id || cohort.departmentId,
        department: cohort.department,
        branch: cohort.branch,
        year: cohort.year,
        semester: cohort.semester,
        section: cohort.section,
        academicYear: cohort.academicYear,
        status: status || 'published',
        audienceType,
        selectedStudentIds: audienceType === 'selected_students' ? selectedStudentIds : [],
        facultyUser: currentUser
      };

      const result = await ragDocumentService.uploadFacultyResource(payload);

      setIsUploading(false);
      setUploadSuccess(true);

      if (onUploadSuccess) {
        onUploadSuccess(result.document);
      }

      setTimeout(() => {
        setUploadSuccess(false);
        onClose();
      }, 1200);

    } catch (err) {
      setIsUploading(false);
      console.error('[FacultyResourceUploadModal] Upload error:', err);
      setUploadError(err.message || 'Failed to upload and share resource. Please try again.');
    }
  };

  if (!isOpen) return null;

  const cohortDetails = selectedAssignment ? extractCanonicalCohort(selectedAssignment) : null;

  const modalContent = (
    <div 
      className="modal-overlay" 
      onClick={() => !isUploading && onClose()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div 
        className="modal-content medium" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '680px',
          width: '100%',
          backgroundColor: 'var(--color-surface, #FFFDF8)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-modal, 0 16px 36px -8px rgba(43, 33, 24, 0.16))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(198, 93, 46, 0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.3px' }}>
                Upload Course Resource
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.75, margin: '2px 0 0 0' }}>
                Share lecture notes, syllabi, PYQs, and lab manuals with mapped student cohorts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text)',
              opacity: 0.6,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {uploadError && (
            <div 
              id="faculty-resource-error-banner"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '18px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{uploadError}</span>
              <button 
                type="button" 
                onClick={loadFacultyAssignments}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', fontSize: '11px', height: 'auto' }}
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {uploadSuccess && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#059669',
                fontSize: '13px',
                marginBottom: '18px'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>Resource published and shared with mapped students successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Assigned Subject & Cohort Selector */}
            <div>
              <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Select Assigned Course & Class Cohort <span style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              {loadingAssignments ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '13px', 
                  color: 'var(--color-text)', 
                  opacity: 0.7, 
                  padding: '10px 0' 
                }}>
                  <Loader2 size={15} className="animate-spin" color="var(--color-primary)" />
                  <span>Loading your assigned teaching courses from database...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div style={{
                  padding: '14px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <span>No faculty assignments found for your account. Please contact an administrator to map your teaching courses.</span>
                  <button 
                    type="button" 
                    onClick={loadFacultyAssignments}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', flexShrink: 0 }}
                  >
                    <RefreshCw size={12} />
                    <span>Retry</span>
                  </button>
                </div>
              ) : (
                <select
                  id="faculty-resource-assignment-select"
                  className="input-field"
                  value={selectedAssignmentId}
                  onChange={handleAssignmentChange}
                  disabled={isUploading}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontWeight: 600 }}
                >
                  <option value="">-- Select Assigned Course & Class Cohort --</option>
                  {assignments.map(a => {
                    const aid = a.id || a.assignmentId;
                    const subName = a.name || a.subjectName || a.subject || 'Subject';
                    const subCode = a.code || a.subjectCode || '';
                    const branchDisp = a.branchDisplayName || a.departmentCode || getBranchDisplay(a.department || 'CSE', a.branch || 'CSE');
                    const y = a.year || 4;
                    const s = a.semester || 7;
                    const sec = a.section || 'A';
                    const reg = a.regulation || 'AR23';
                    const ay = a.academicYear || a.academic_year || '2025-2026';
                    return (
                      <option key={aid} value={aid}>
                        {subName} {subCode ? `(${subCode})` : ''} — {branchDisp} Year {y} Sem {s} Sec {sec} ({ay} • {reg})
                      </option>
                    );
                  })}
                </select>
              )}

              {/* Locked Cohort Badge Summary */}
              {cohortDetails && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text)', opacity: 0.85 }}>
                    <Lock size={12} color="var(--color-primary)" />
                    <span><strong>Cohort:</strong></span>
                    <span className="badge badge-purple" style={{ fontWeight: 800 }}>
                      {cohortDetails.branchDisplayName || 'CSE'}
                    </span>
                    <span className="badge badge-blue">
                      Year {cohortDetails.year} • Sem {cohortDetails.semester} • Sec {cohortDetails.section}
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7 }}>
                    Academic Year: <strong>{cohortDetails.academicYear || '2025–2026'}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 2. Manual Audience Selection (Visible once course is selected) */}
            {selectedAssignment && (
              <div style={{
                padding: '14px 16px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 800, display: 'block', marginBottom: '8px', color: 'var(--color-text)' }}>
                  Target Audience & Visibility <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {/* Option A: Entire Mapped Class */}
                  <label 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: audienceType === 'cohort' ? 'var(--color-surface)' : 'transparent',
                      border: audienceType === 'cohort' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="audienceType"
                      value="cohort"
                      checked={audienceType === 'cohort'}
                      onChange={() => setAudienceType('cohort')}
                      style={{ marginTop: '3px', accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                        Entire Mapped Class
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
                        Share with all enrolled students in {cohortDetails?.branchDisplayName || 'CSE'} Section {cohortDetails?.section}
                      </div>
                    </div>
                  </label>

                  {/* Option B: Selected Students */}
                  <label 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: audienceType === 'selected_students' ? 'var(--color-surface)' : 'transparent',
                      border: audienceType === 'selected_students' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="audienceType"
                      value="selected_students"
                      checked={audienceType === 'selected_students'}
                      onChange={() => setAudienceType('selected_students')}
                      style={{ marginTop: '3px', accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                        Selected Students
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
                        Choose specific students in this class section who can view and download this resource
                      </div>
                    </div>
                  </label>
                </div>

                {/* Selected Students Multi-Select List */}
                {audienceType === 'selected_students' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)'
                  }}>
                    {/* Search & Bulk Actions Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ position: 'relative', width: '220px' }}>
                        <input
                          type="text"
                          placeholder="Search student or roll no..."
                          className="input-field"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          style={{ paddingLeft: '28px', paddingBlock: '5px', fontSize: '12px' }}
                        />
                        <Search size={13} color="var(--color-text)" style={{ position: 'absolute', left: '8px', top: '8px', opacity: 0.6 }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handleSelectAllStudents}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Select All ({filteredCohortStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleClearSelectedStudents}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Clear
                        </button>
                        <span className="badge badge-blue" style={{ fontSize: '11px', fontWeight: 800 }}>
                          {selectedStudentIds.length} Selected
                        </span>
                      </div>
                    </div>

                    {/* Student Checkbox List */}
                    {loadingStudents ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text)', opacity: 0.7, fontSize: '12.5px' }}>
                        <Loader2 size={16} className="animate-spin" style={{ margin: '0 auto 6px auto', color: 'var(--color-primary)' }} />
                        Loading mapped students for this section...
                      </div>
                    ) : filteredCohortStudents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text)', opacity: 0.7, fontSize: '12.5px' }}>
                        {cohortStudents.length === 0 
                          ? 'No enrolled student records found in this section.' 
                          : 'No students match your search criteria.'}
                      </div>
                    ) : (
                      <div style={{
                        maxHeight: '160px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingRight: '4px'
                      }}>
                        {filteredCohortStudents.map(std => {
                          const sid = std.userId || std.user_id || std.id;
                          const isChecked = selectedStudentIds.includes(sid);
                          const name = std.name || std.user?.full_name || 'Student';
                          const roll = std.roll_number || std.rollNumber || '—';
                          const dept = std.department || cohortDetails?.branchDisplayName || 'CSE';

                          return (
                            <div
                              key={sid}
                              onClick={() => handleToggleStudent(sid)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                backgroundColor: isChecked ? 'rgba(198, 93, 46, 0.08)' : 'var(--color-bg)',
                                border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleStudent(sid)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ accentColor: 'var(--color-primary)' }}
                                />
                                <div>
                                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text)' }}>
                                    {name}
                                  </span>
                                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, marginLeft: '6px' }}>
                                    {std.email}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="badge badge-blue" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px' }}>
                                  {roll}
                                </span>
                                <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                                  Sec {std.section || cohortDetails?.section}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Resource Title */}
            <div>
              <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Resource Title <span style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              <input
                id="faculty-resource-title-input"
                type="text"
                className="input-field"
                placeholder="e.g. Unit 3 — Convolutional Neural Networks & Optimization"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              />
            </div>

            {/* 4. Category / Document Type and Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Resource Category <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <select
                  id="faculty-resource-type-select"
                  className="input-field"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={isUploading}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                >
                  <option value="notes">Faculty Lecture Notes</option>
                  <option value="syllabus">Curriculum & Syllabus</option>
                  <option value="pyq">Previous Year Questions (PYQ)</option>
                  <option value="lab_manual">Laboratory Manual</option>
                  <option value="reference">Quick Reference Guide</option>
                  <option value="textbook">Reference Textbook</option>
                  <option value="other">Academic Material</option>
                </select>
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Publication Status
                </label>
                <select
                  id="faculty-resource-status-select"
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isUploading}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                >
                  <option value="published">Published (Visible to Target Audience)</option>
                  <option value="draft">Draft (Private to Faculty)</option>
                </select>
              </div>
            </div>

            {/* 5. Description (Optional) */}
            <div>
              <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Description / Instructions (Optional)
              </label>
              <textarea
                id="faculty-resource-desc-input"
                className="input-field"
                placeholder="Brief summary of lecture notes, module topics covered, or preparation guidelines for students..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', resize: 'vertical' }}
              />
            </div>

            {/* 6. File Drag & Drop Zone */}
            <div>
              <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Document PDF File <span style={{ color: 'var(--color-primary)' }}>*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                id="faculty-resource-file-input"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(198, 93, 46, 0.08)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={22} color="var(--color-primary)" />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)', display: 'block' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.65 }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Application/PDF
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--error, #ef4444)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isDragging ? 'rgba(198, 93, 46, 0.06)' : 'var(--color-bg)',
                    borderRadius: '8px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <UploadCloud size={28} color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                    Click to browse or drag and drop course PDF here
                  </p>
                  <p style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.65, margin: 0 }}>
                    PDF documents only (.pdf) up to 50 MB
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--color-border)'
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="btn btn-secondary"
                style={{ padding: '8px 18px' }}
              >
                Cancel
              </button>
              <button
                id="save-faculty-resource-btn"
                type="submit"
                disabled={!isFormValid || isUploading}
                className="btn btn-primary"
                style={{
                  padding: '8px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: (!isFormValid || isUploading) ? 'not-allowed' : 'pointer',
                  opacity: (!isFormValid || isUploading) ? 0.6 : 1
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Uploading & Sharing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} />
                    <span>Upload & Share</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
