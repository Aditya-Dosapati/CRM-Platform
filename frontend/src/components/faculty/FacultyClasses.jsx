import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, BookOpen, Clock, Calendar, CheckCircle2, 
  Sparkles, Award, ArrowUpRight, Search, FileText, Plus, AlertCircle, Layers, BarChart2
} from 'lucide-react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import authService from '../../services/authService';
import { extractCanonicalCohort, matchesCohort } from '../../services/academicCohortService';
import EmptyState from '../common/EmptyState';

export default function FacultyClasses({ onOpenRagQuery, onNavigate, initialAssignmentId = null, initialSection = null }) {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(initialAssignmentId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const rosterRef = useRef(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (initialAssignmentId) {
      setSelectedClassId(initialAssignmentId);
    }
  }, [initialAssignmentId]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const facultyId = currentUser?.id || currentUser?.userId;
        const [assignedClasses, assignedStudents] = await Promise.all([
          facultyAssignmentService.getFacultyAssignedClasses(facultyId),
          facultyAssignmentService.getFacultyAssignedStudents(facultyId)
        ]);

        if (isMounted) {
          setClasses(assignedClasses || []);
          setStudents(assignedStudents || []);
          if (assignedClasses && assignedClasses.length > 0) {
            setSelectedClassId(prevId => {
              if (initialAssignmentId && assignedClasses.some(c => (c.assignmentId || c.id) === initialAssignmentId)) {
                return initialAssignmentId;
              }
              if (prevId && assignedClasses.some(c => (c.assignmentId || c.id) === prevId)) {
                return prevId;
              }
              return assignedClasses[0].assignmentId || assignedClasses[0].id;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load faculty class data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();

    const handleUpdate = () => {
      loadData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('gmrit_assignments_updated', handleUpdate);
    }

    return () => { 
      isMounted = false; 
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmrit_assignments_updated', handleUpdate);
      }
    };
  }, [currentUser?.id, currentUser?.userId, initialAssignmentId]);

  const currentClass = classes.find(c => (c.assignmentId || c.id) === selectedClassId) || classes[0] || null;

  // Filter students for the selected class section
  const sectionStudents = useMemo(() => {
    if (!students || students.length === 0 || !currentClass) return [];
    const cCohort = extractCanonicalCohort(currentClass);
    return students.filter(s => {
      const directMatch = (
        (s.departmentId === currentClass.departmentId || s.departmentCode === currentClass.departmentCode || s.branchId === currentClass.branch) &&
        Number(s.year) === Number(currentClass.year) &&
        Number(s.semester) === Number(currentClass.semester) &&
        String(s.section).toUpperCase() === String(currentClass.section).toUpperCase()
      );
      return directMatch || (cCohort && matchesCohort(s, cCohort));
    });
  }, [students, currentClass]);

  const filteredStudents = useMemo(() => {
    if (!sectionStudents || sectionStudents.length === 0) return [];
    return sectionStudents.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const name = (s.name || s.user?.full_name || '').toLowerCase();
      const roll = (s.roll_number || s.rollNumber || s.user_id || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [sectionStudents, searchQuery]);

  const handleSelectClass = (cls) => {
    const id = cls.assignmentId || cls.id;
    setSelectedClassId(id);
  };

  const handleViewStudents = (cls) => {
    handleSelectClass(cls);
    if (rosterRef.current) {
      rosterRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleViewAnalytics = (cls) => {
    if (onNavigate) {
      onNavigate('analytics', { selectedAssignmentId: cls.assignmentId || cls.id, selectedSection: cls.section });
    } else if (onOpenRagQuery) {
      onOpenRagQuery(`Provide subject performance and attendance analytics for ${cls.name || cls.subjectName || 'course'} Section ${cls.section}`);
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px' }}>
            My Subjects
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Manage assigned course sections, syllabus coverage, and student rosters
          </p>
        </div>

        {currentClass && (
          <button
            onClick={() => onOpenRagQuery?.(`Provide attendance and syllabus performance summary for ${currentClass.name || currentClass.code} Section ${currentClass.section}`)}
            className="btn btn-primary"
          >
            <Sparkles size={14} />
            <span>AI Class Analytics</span>
          </button>
        )}
      </div>

      {/* Class Section Cards */}
      {isLoading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text)', opacity: 0.7 }}>
          Loading your assigned courses from the database...
        </div>
      ) : classes.length === 0 ? (
        <div className="card" style={{ marginBottom: '22px' }}>
          <EmptyState
            icon={BookOpen}
            title="No Assigned Classes"
            description="There are no academic subjects or classes currently assigned to your faculty profile. Contact your department administrator to schedule your subjects."
          />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {classes.map((cls, idx) => {
            const isSelected = (cls.assignmentId || cls.id) === selectedClassId;
            const courseName = cls.name || cls.subjectName || 'Assigned Course';
            const courseCode = cls.code || cls.subjectCode || '—';
            const yearText = cls.year ? `${cls.year}${cls.year === 1 ? 'st' : cls.year === 2 ? 'nd' : cls.year === 3 ? 'rd' : 'th'} Year` : '4th Year';
            const branchDisplay = cls.branchDisplayName || cls.departmentCode || cls.branch || 'CSE';
            const cohortInfo = `${branchDisplay} · ${yearText} · Semester ${cls.semester || 7} · Section ${cls.section || 'A'}`;
            const creditsVal = cls.credits || cls.subjectCredits || 3;
            const regVal = cls.regulation || 'AR23';
            const acadYearVal = cls.academicYear || '2025–2026';
            const isActive = cls.isActive !== false;

            return (
              <div
                key={cls.assignmentId || cls.id || idx}
                onClick={() => handleSelectClass(cls)}
                className={`card card-interactive ${isSelected ? 'card-selected' : ''}`}
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: isSelected ? '0 4px 16px rgba(198, 93, 46, 0.12)' : 'var(--shadow-xs)',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* 1. Course Name (prominent heading) & Course Code */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    letterSpacing: '-0.3px',
                    margin: 0,
                    lineHeight: 1.3,
                    wordBreak: 'break-word'
                  }}>
                    {courseName}
                  </h3>
                  <span
                    className="badge badge-blue"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      padding: '3px 8px',
                      flexShrink: 0
                    }}
                  >
                    {courseCode}
                  </span>
                </div>

                {/* 2. Section & Status Badges */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px'
                }}>
                  <span className="badge badge-purple" style={{ fontWeight: 800, fontSize: '11px', padding: '2px 8px' }}>
                    Section {cls.section || 'A'}
                  </span>
                  <span
                    className={isActive ? 'badge badge-green' : 'badge badge-gray'}
                    style={{ fontWeight: 700, fontSize: '11px', padding: '2px 8px' }}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* 3. Cohort Information */}
                <div style={{
                  fontSize: '12px',
                  color: 'var(--color-text)',
                  opacity: 0.82,
                  fontWeight: 600,
                  marginBottom: '14px',
                  lineHeight: 1.4
                }}>
                  {cohortInfo}
                </div>

                {/* 4. Course Details 2x2 Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 12px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  marginBottom: '16px'
                }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                      Credits
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>
                      {creditsVal} Credits
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                      Regulation
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>
                      {regVal}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                      Department / Branch
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>
                      {branchDisplay}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                      Academic Year
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {acadYearVal}
                    </span>
                  </div>
                </div>

                {/* 5. Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewStudents(cls);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontWeight: 700, justifyContent: 'center', fontSize: '12px', padding: '6px 10px' }}
                  >
                    <Users size={13} />
                    <span>View Students</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewAnalytics(cls);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontWeight: 700, justifyContent: 'center', fontSize: '12px', padding: '6px 10px' }}
                  >
                    <BarChart2 size={13} />
                    <span>Analytics</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Class Deep-Dive Workspace */}
      {currentClass && (
        <div ref={rosterRef} className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-blue" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                  {currentClass.code || currentClass.subjectCode || '—'}
                </span>
                <span className="badge badge-purple" style={{ fontWeight: 800 }}>
                  Section {currentClass.section || 'A'}
                </span>
                <span className={currentClass.isActive !== false ? 'badge badge-green' : 'badge badge-gray'} style={{ fontWeight: 700 }}>
                  {currentClass.isActive !== false ? 'Active Class' : 'Inactive Class'}
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px', letterSpacing: '-0.3px' }}>
                {currentClass.name || currentClass.subjectName || 'Assigned Course'} — Class Student Roster
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
                {currentClass.formattedClass || `${currentClass.branchDisplayName || 'CSE'} · ${currentClass.year || 4}th Year · Semester ${currentClass.semester || 7} · Section ${currentClass.section || 'A'}`} • {currentClass.departmentName || currentClass.departmentCode || 'Computer Science & Engineering'} • Academic Year {currentClass.academicYear || '2025–2026'}
              </p>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                placeholder="Search student or roll no..."
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', paddingBlock: '7px' }}
              />
              <Search size={14} color="var(--color-text)" style={{ position: 'absolute', left: '10px', top: '10px', opacity: 0.6 }} />
            </div>
          </div>

          {/* Student Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Section</th>
                  <th style={{ textAlign: 'center' }}>Year / Sem</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Students in this Section"
                    message={`No student records currently enrolled in Section ${currentClass.section || 'A'} for this subject.`}
                    isTableRow={true}
                    colSpan={6}
                  />
                ) : (
                  filteredStudents.map((std) => (
                    <tr key={std.id || std.user_id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                          {std.name || std.user?.full_name || 'Student'}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6 }}>
                          {std.email}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                        {std.roll_number || std.rollNumber || '—'}
                      </td>
                      <td>
                        {std.department || currentClass.departmentCode || 'CSE'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-purple" style={{ fontWeight: 800, fontSize: '11px' }}>
                          Sec {std.section || currentClass.section}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {std.year || currentClass.year} Year • Sem {std.semester || currentClass.semester}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-green">
                          Enrolled
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
