import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, Clock, Calendar, CheckCircle2, 
  Sparkles, Award, ArrowUpRight, Search, FileText, Plus, AlertCircle, Layers
} from 'lucide-react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import authService from '../../services/authService';
import { extractCanonicalCohort, matchesCohort } from '../../services/academicCohortService';
import EmptyState from '../common/EmptyState';

export default function FacultyClasses({ onOpenRagQuery }) {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = authService.getCurrentUser();

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
  }, [currentUser?.id, currentUser?.userId]);

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
            onClick={() => onOpenRagQuery(`Provide attendance and syllabus performance summary for ${currentClass.name || currentClass.code} Section ${currentClass.section}`)}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          marginBottom: '22px'
        }}>
          {classes.map((cls) => {
            const isSelected = (cls.assignmentId || cls.id) === selectedClassId;
            const clsCohort = extractCanonicalCohort(cls);
            const clsStudentCount = students.filter(s => matchesCohort(s, clsCohort)).length;

            return (
              <div
                key={cls.assignmentId || cls.id}
                onClick={() => setSelectedClassId(cls.assignmentId || cls.id)}
                className="card"
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: isSelected ? '0 4px 12px rgba(198, 93, 46, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-blue">{cls.code}</span>
                    <span className="badge badge-purple" style={{ fontWeight: 800 }}>
                      Sec {cls.section}
                    </span>
                  </div>
                  <span className="badge badge-green" style={{ fontWeight: 700 }}>
                    Active
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px' }}>
                  {cls.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.75, marginBottom: '12px' }}>
                  {cls.formattedClass || `${cls.year} Year • Sem ${cls.semester} • Section ${cls.section}`}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--color-border)',
                  fontSize: '11.5px'
                }}>
                  <div>
                    <span style={{ color: 'var(--color-text)', opacity: 0.6 }}>Enrolled Students</span>
                    <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '13px' }}>
                      {clsStudentCount} Students
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text)', opacity: 0.6 }}>Credits & Reg</span>
                    <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '13px' }}>
                      {cls.credits || 3} Cr • {cls.regulation || 'AR23'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Class Deep-Dive Workspace */}
      {currentClass && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-blue">{currentClass.code}</span>
                <span className="badge badge-purple" style={{ fontWeight: 800 }}>Section {currentClass.section}</span>
                <span className="badge badge-green">Active Class</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                {currentClass.name} — Class Student Roster
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
                {currentClass.formattedClass} • {currentClass.departmentName || currentClass.departmentCode} • Academic Year {currentClass.academicYear}
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
                    message={`No student records currently enrolled in Section ${currentClass.section} for this subject.`}
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
