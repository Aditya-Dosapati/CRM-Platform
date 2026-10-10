import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, User, Mail, Shield, BookOpen, Award, CheckCircle2, Calendar, 
  Hash, Building, GraduationCap, Clock, Layers, Users, AlertCircle, 
  Loader2, Activity, Check, Briefcase, FileText
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import authService from '../../services/authService';
import userManagementService from '../../services/userManagementService';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import academicCohortService, { 
  getBranchDisplay, 
  resolveBranch, 
  resolveDepartment,
  extractCanonicalCohort 
} from '../../services/academicCohortService';
import { isValidUuid } from '../../services/ragDocumentService';

export default function UserProfileModal({ isOpen, onClose, currentUser, activeRole }) {
  const [profile, setProfile] = useState(null);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const requestIdRef = useRef(0);

  // Close on Escape key with clean listener unmount
  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (!isOpen) {
      setProfile(null);
      setFacultyAssignments([]);
      setIsLoading(true);
      setLoadError(null);
      return;
    }

    let isMounted = true;
    const currentReqId = ++requestIdRef.current;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const uid = currentUser?.userId || currentUser?.id;
        const uEmail = currentUser?.email;
        const role = String(activeRole || currentUser?.role || 'student').toLowerCase().trim();

        // 1. Fetch verified backend profile
        let enriched = null;
        if (uid || uEmail) {
          try {
            enriched = await authService.getBackendProfile(uid, uEmail);
          } catch (e) {
            console.warn('[UserProfileModal] Backend profile fetch notice:', e);
          }
        }

        if (!enriched && uid) {
          try {
            enriched = await userManagementService.getUserById(uid);
          } catch (e) {
            console.warn('[UserProfileModal] userManagementService fetch notice:', e);
          }
        }

        if (!enriched) {
          enriched = authService.enrichUserWithAcademicData(currentUser) || currentUser;
        }

        // Merge full details
        const finalProfile = {
          ...currentUser,
          ...enriched,
          role: role
        };

        // 2. If faculty, dynamically load assigned classes & cohorts
        let assignments = [];
        if (role === 'faculty') {
          try {
            assignments = await facultyAssignmentService.getFacultyAssignedClasses(uid);
            if (!Array.isArray(assignments) || assignments.length === 0) {
              const fallback = await facultyAssignmentService.getAssignments({ facultyId: uid });
              assignments = Array.isArray(fallback) ? fallback : (fallback?.data || []);
            }
          } catch (e) {
            console.warn('[UserProfileModal] Notice fetching faculty assignments:', e);
          }
        }

        if (isMounted && requestIdRef.current === currentReqId) {
          setProfile(finalProfile);
          setFacultyAssignments(Array.isArray(assignments) ? assignments : []);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[UserProfileModal] Error loading profile details:', err);
        if (isMounted && requestIdRef.current === currentReqId) {
          setProfile(currentUser);
          setLoadError(err.message || 'Could not load complete profile details.');
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser, activeRole]);

  if (!isOpen) return null;

  const activeUser = profile || currentUser || {};
  const currentRole = String(activeUser.role || activeRole || 'student').toLowerCase().trim();

  // Normalized Display Metadata
  const displayName = activeUser.name || activeUser.full_name || (activeUser.email ? activeUser.email.split('@')[0] : 'GMRIT Member');
  const displayEmail = activeUser.email || 'Not available';
  const avatarText = (displayName || 'U').slice(0, 2).toUpperCase();

  const deptRaw = activeUser.department || activeUser.departmentName || activeUser.departmentCode || 'CSE';
  const branchRaw = activeUser.branch || activeUser.branchId || resolveBranch(deptRaw);
  const branchDisplay = getBranchDisplay(deptRaw, branchRaw);

  // Identifier Resolution (Avoid displaying raw UUIDs)
  let displayIdentifier = 'Not available';
  let identifierLabel = 'Roll Number';

  if (currentRole === 'student') {
    identifierLabel = 'Student Roll Number';
    const rawRoll = activeUser.rollNumber || activeUser.roll_number;
    if (rawRoll && !isValidUuid(rawRoll)) {
      displayIdentifier = String(rawRoll).trim();
    } else if (rawRoll) {
      displayIdentifier = String(rawRoll).trim();
    } else {
      displayIdentifier = 'Not available';
    }
  } else if (currentRole === 'faculty') {
    identifierLabel = 'Faculty Employee ID';
    const rawEmp = activeUser.employeeId || activeUser.employee_id;
    if (rawEmp && !isValidUuid(rawEmp)) {
      displayIdentifier = String(rawEmp).trim();
    } else if (rawEmp) {
      displayIdentifier = String(rawEmp).trim();
    } else {
      displayIdentifier = 'Not available';
    }
  } else {
    identifierLabel = 'System Identifier';
    const rawId = activeUser.employeeId || activeUser.userId || activeUser.id;
    displayIdentifier = rawId ? String(rawId).trim() : 'GMR-ADM-001';
  }

  // Academic Cohort Resolution
  const yearNumber = Number(activeUser.year) || null;
  const yearDisplay = yearNumber
    ? (yearNumber === 1 ? '1st Year' : yearNumber === 2 ? '2nd Year' : yearNumber === 3 ? '3rd Year' : `${yearNumber}th Year`)
    : (activeUser.year ? `${activeUser.year}` : 'Not available');

  const semesterNumber = Number(activeUser.semester) || null;
  const semesterDisplay = semesterNumber
    ? `Semester ${semesterNumber}`
    : (activeUser.semester ? `${activeUser.semester}` : 'Not available');

  const sectionDisplay = activeUser.section ? `Section ${String(activeUser.section).toUpperCase().trim()}` : 'Not available';
  const academicYearDisplay = activeUser.academicYear || activeUser.academic_year || '2025-2026';
  const regulationDisplay = activeUser.regulation || 'AR23';
  const programDisplay = activeUser.program || 'B.Tech';

  // Subtitle Resolution
  let subtitle = '';
  if (currentRole === 'student') {
    subtitle = `${programDisplay} in ${branchDisplay} • ${yearDisplay}`;
  } else if (currentRole === 'faculty') {
    subtitle = `${activeUser.designation || 'Faculty Instructor'} • Department of ${branchDisplay}`;
  } else {
    subtitle = `${activeUser.designation || 'System Administrator'} • Central Academic Cell`;
  }

  // Faculty summary stats
  const totalCourses = facultyAssignments.length;
  const totalStudents = facultyAssignments.reduce((acc, curr) => acc + (Number(curr.studentCount) || 0), 0);

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
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
        padding: '16px'
      }}
    >
      <div 
        className="modal-content"
        style={{
          maxWidth: '580px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface, #FFFDF8)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--color-border, #DED3C2)',
          boxShadow: '0 20px 45px -10px rgba(43, 33, 24, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with clean gradient and distinct close button */}
        <div style={{
          height: '100px',
          background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '12px 16px',
          flexShrink: 0
        }}>
          <button
            id="profile-modal-close-x-btn"
            onClick={onClose}
            aria-label="Close Profile Modal"
            title="Close (Esc)"
            style={{
              background: 'rgba(255, 255, 255, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.15s ease, transform 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Avatar & Identity Header (Positioned with zero overlap) */}
        <div style={{
          padding: '0 24px',
          marginTop: '-44px',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
            border: '4px solid var(--color-surface, #FFFDF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 800,
            color: '#FFFFFF',
            boxShadow: '0 8px 18px -4px rgba(37, 99, 235, 0.35)',
            flexShrink: 0
          }}>
            {avatarText}
          </div>

          <div style={{ flex: 1, minWidth: '200px', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span className={`badge ${
                currentRole === 'student' ? 'badge-blue' :
                currentRole === 'faculty' ? 'badge-green' : 'badge-purple'
              }`} style={{ textTransform: 'capitalize', fontSize: '11.5px', fontWeight: 700, padding: '3px 10px' }}>
                {currentRole} Profile
              </span>

              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
                Active Account
              </span>
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--color-text, #2B2118)',
              letterSpacing: '-0.3px',
              margin: 0,
              lineHeight: 1.25,
              wordBreak: 'break-word'
            }}>
              {displayName}
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-muted, #786C5E)',
              marginTop: '3px',
              marginBottom: 0,
              wordBreak: 'break-word'
            }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--color-text-muted)' }}>
              <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-primary)' }} />
              <p style={{ fontSize: '13.5px', fontWeight: 600, margin: 0 }}>Fetching verified academic records from database...</p>
            </div>
          ) : (
            <>
              {loadError && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#b91c1c'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{loadError}</span>
                </div>
              )}

              {/* Core Information Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px'
              }}>
                {/* 1. Identifier Card */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card, #FFFDF8)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border, #DED3C2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Hash size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>{identifierLabel}</p>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      margin: '2px 0 0 0',
                      fontFamily: 'JetBrains Mono, monospace',
                      wordBreak: 'break-all'
                    }}>
                      {displayIdentifier}
                    </p>
                  </div>
                </div>

                {/* 2. Department & Branch Card */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card, #FFFDF8)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border, #DED3C2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Building size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Department / Branch</p>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      margin: '2px 0 0 0',
                      wordBreak: 'break-word'
                    }}>
                      {branchDisplay}
                    </p>
                  </div>
                </div>

                {/* 3. GMRIT Institutional Email Card */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card, #FFFDF8)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border, #DED3C2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Mail size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Institutional Email</p>
                    <p style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      margin: '2px 0 0 0',
                      wordBreak: 'break-all'
                    }}>
                      {displayEmail}
                    </p>
                  </div>
                </div>

                {/* 4. Academic Cycle & Regulation Card */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card, #FFFDF8)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border, #DED3C2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Calendar size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Academic Year & Regulation</p>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      margin: '2px 0 0 0'
                    }}>
                      {academicYearDisplay} • {regulationDisplay}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Academic & Attendance Highlights */}
              {currentRole === 'student' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Cohort Details */}
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-subtle, #EFE8DC)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border, #DED3C2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <GraduationCap size={15} color="var(--color-primary)" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase' }}>
                        Enrolled Cohort Structure
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Academic Year</span>
                        <strong style={{ color: 'var(--color-text)' }}>{yearDisplay}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Semester</span>
                        <strong style={{ color: 'var(--color-text)' }}>{semesterDisplay}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Assigned Section</span>
                        <strong style={{ color: 'var(--color-primary)' }}>{sectionDisplay}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Academic Metrics (CGPA & Attendance) */}
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    border: '1px solid rgba(37, 99, 235, 0.18)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                        Cumulative CGPA
                      </p>
                      <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', margin: '2px 0 0 0' }}>
                        {activeUser.cgpa !== undefined && activeUser.cgpa !== null && activeUser.cgpa !== '' ? activeUser.cgpa : 'Not available'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                        Attendance Standing
                      </p>
                      <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#059669', margin: '2px 0 0 0' }}>
                        {activeUser.attendance !== undefined && activeUser.attendance !== null && activeUser.attendance !== ''
                          ? `${activeUser.attendanceStatus || 'Good'} (${activeUser.attendance}%)`
                          : (activeUser.attendance_percentage ? `${activeUser.attendance_percentage}%` : 'Not available')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Faculty Teaching Assignments & Stats */}
              {currentRole === 'faculty' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Faculty Overview Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}>
                    <div style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(5, 150, 105, 0.06)',
                      border: '1px solid rgba(5, 150, 105, 0.2)',
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                        Active Teaching Courses
                      </span>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: '3px 0 0 0' }}>
                        {totalCourses > 0 ? `${totalCourses} Subjects` : 'Not available'}
                      </p>
                    </div>

                    <div style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(37, 99, 235, 0.06)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                        Assigned Students
                      </span>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: '3px 0 0 0' }}>
                        {totalStudents > 0 ? `${totalStudents} Students` : (totalCourses > 0 ? 'Mapped Sections' : 'Not available')}
                      </p>
                    </div>
                  </div>

                  {/* Course Assignment List */}
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-subtle, #EFE8DC)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border, #DED3C2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={15} color="var(--color-primary)" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase' }}>
                          Assigned Teaching Courses ({regulationDisplay})
                        </span>
                      </div>
                      <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>
                        {totalCourses} Active
                      </span>
                    </div>

                    {facultyAssignments.length === 0 ? (
                      <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
                        No teaching courses are currently assigned in the database.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {facultyAssignments.map((assign, idx) => {
                          const courseName = assign.name || assign.subjectName || 'Assigned Course';
                          const courseCode = assign.code || assign.subjectCode || '';
                          const classCohort = assign.formattedClass || `${assign.branchDisplayName || assign.branch || 'CSE'} · Year ${assign.year || 4} · Sem ${assign.semester || 7} · Sec ${assign.section || 'A'}`;
                          const enrolledCount = assign.studentCount ? `${assign.studentCount} Students` : null;

                          return (
                            <div 
                              key={assign.id || assign.assignmentId || idx}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: 'var(--color-surface, #FFFDF8)',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border, #DED3C2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                                    {courseName}
                                  </strong>
                                  {courseCode && (
                                    <span className="badge badge-blue" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                      {courseCode}
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                                  {classCohort}
                                </span>
                              </div>

                              {enrolledCount && (
                                <span className="badge badge-purple" style={{ fontSize: '11px', flexShrink: 0 }}>
                                  <Users size={11} style={{ marginRight: '4px' }} />
                                  {enrolledCount}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Privileges */}
              {currentRole === 'admin' && (
                <div style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(169, 74, 42, 0.06)',
                  border: '1px solid rgba(169, 74, 42, 0.2)',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={15} color="var(--color-accent)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                      Administrator Governance Privileges
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--color-text)', margin: 0, lineHeight: 1.5 }}>
                    Full Institutional Control • User Provisioning & Deactivation • RAG Vector Database Ingestion • Faculty Course Assignments • System Audit Logs.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div 
          className="modal-footer" 
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--bg-subtle, #EFE8DC)',
            borderTop: '1px solid var(--color-border, #DED3C2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
            Press <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', fontSize: '10.5px' }}>Esc</kbd> to close
          </span>

          <button 
            id="profile-modal-close-btn"
            className="btn btn-secondary btn-sm" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
