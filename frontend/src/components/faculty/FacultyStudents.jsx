import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, AlertTriangle, X, Send, Sparkles, UserX, Users, BookOpen } from 'lucide-react';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import authService from '../../services/authService';
import { extractCanonicalCohort, matchesCohort, normalizeSection } from '../../services/academicCohortService';
import useEscapeKey from '../../hooks/useEscapeKey';
import useSafeTimeout from '../../hooks/useSafeTimeout';
import EmptyState from '../common/EmptyState';

export default function FacultyStudents({ onOpenRagQuery, initialAssignmentId = null, initialSection = null }) {
  const [students, setStudents] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState(initialAssignmentId || 'All');
  const [sectionFilter, setSectionFilter] = useState(initialSection || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [counselingNote, setCounselingNote] = useState('');
  const [noteSent, setNoteSent] = useState(false);
  const setSafeTimeout = useSafeTimeout();

  const currentUser = authService.getCurrentUser();

  useEscapeKey(() => {
    setSelectedStudent(null);
  }, Boolean(selectedStudent));

  useEffect(() => {
    if (initialAssignmentId) {
      setAssignmentFilter(initialAssignmentId);
    }
    if (initialSection) {
      setSectionFilter(initialSection);
    }
  }, [initialAssignmentId, initialSection]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const facultyId = currentUser?.id || currentUser?.userId;
        const [classes, stdList] = await Promise.all([
          facultyAssignmentService.getFacultyAssignedClasses(facultyId),
          facultyAssignmentService.getFacultyAssignedStudents(facultyId)
        ]);

        if (isMounted) {
          setAssignedClasses(classes || []);
          setStudents(stdList || []);
        }
      } catch (err) {
        console.warn('Failed to load students:', err);
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

  // Active assignment object if filtered
  const activeSelectedAssignment = useMemo(() => {
    if (!assignmentFilter || assignmentFilter === 'All') return null;
    return assignedClasses.find(c => (c.assignmentId || c.id) === assignmentFilter) || null;
  }, [assignedClasses, assignmentFilter]);

  // Distinct sections assigned to this faculty
  const availableSections = useMemo(() => {
    const secSet = new Set(assignedClasses.map(c => c.section).filter(Boolean));
    return Array.from(secSet).sort();
  }, [assignedClasses]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = (s.user?.full_name || s.name || '').toLowerCase();
      const roll = (s.roll_number || s.rollNumber || s.user_id || '').toLowerCase();
      const sCohort = extractCanonicalCohort(s);
      
      if (filterAtRiskOnly && !s.isAtRisk) return false;
      if (sectionFilter !== 'All') {
        const cleanTargetSec = normalizeSection(sectionFilter);
        if (sCohort.section !== cleanTargetSec) return false;
      }

      // Filter strictly by active assignment canonical cohort
      if (activeSelectedAssignment) {
        const aCohort = extractCanonicalCohort(activeSelectedAssignment);
        if (!matchesCohort(s, aCohort)) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return name.includes(q) || roll.includes(q);
      }
      return true;
    });
  }, [students, filterAtRiskOnly, sectionFilter, assignmentFilter, activeSelectedAssignment, searchQuery]);

  const handleSendNote = useCallback(() => {
    if (!counselingNote.trim() || !selectedStudent) return;
    setNoteSent(true);
    const targetStudentName = selectedStudent.user?.full_name || selectedStudent.name || 'Student';
    const targetRollNumber = selectedStudent.roll_number || selectedStudent.rollNumber || 'ID';
    setSafeTimeout(() => {
      setNoteSent(false);
      setCounselingNote('');
      alert(`Academic advisory note dispatched to ${targetStudentName} (${targetRollNumber}).`);
    }, 600);
  }, [counselingNote, selectedStudent, setSafeTimeout]);

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
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
            Students Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Monitor student attendance, continuous marks, and assign interventions for your assigned cohorts
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Analyze student performance trends and suggest personalized remediation")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Cohort Insights</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <input
                type="text"
                placeholder="Search student or roll no..."
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', paddingBlock: '7px' }}
              />
              <Search size={15} color="var(--color-text)" style={{ position: 'absolute', left: '12px', top: '10px', opacity: 0.6 }} />
            </div>

            {/* Assignment / Subject Filter */}
            <select
              className="input-field"
              value={assignmentFilter}
              onChange={(e) => {
                setAssignmentFilter(e.target.value);
                if (e.target.value !== 'All') {
                  const match = assignedClasses.find(c => (c.assignmentId || c.id) === e.target.value);
                  if (match) setSectionFilter(match.section);
                }
              }}
              style={{ minWidth: '220px', paddingBlock: '7px' }}
            >
              <option value="All">All Assigned Classes ({assignedClasses.length})</option>
              {assignedClasses.map(c => (
                <option key={c.assignmentId || c.id} value={c.assignmentId || c.id}>
                  {c.name} ({c.departmentCode || 'CSE'} • Sec {c.section})
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              className="input-field"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{ width: '140px', paddingBlock: '7px' }}
            >
              <option value="All">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setFilterAtRiskOnly(!filterAtRiskOnly)}
              className={`btn btn-sm ${filterAtRiskOnly ? 'btn-primary' : 'btn-secondary'}`}
            >
              <AlertTriangle size={13} />
              <span>{filterAtRiskOnly ? 'Showing At-Risk Only' : 'Filter At-Risk'}</span>
            </button>
          </div>
        </div>

        {/* Active Class Context Banner */}
        {activeSelectedAssignment && (
          <div style={{
            marginTop: '12px',
            padding: '8px 14px',
            backgroundColor: 'rgba(198, 93, 46, 0.08)',
            border: '1px solid rgba(198, 93, 46, 0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong>Cohort Context:</strong> {activeSelectedAssignment.name} ({activeSelectedAssignment.code}) • <strong>{activeSelectedAssignment.departmentCode || 'CSE'}</strong> • {activeSelectedAssignment.year}th Year Sem {activeSelectedAssignment.semester} • <strong>Section {activeSelectedAssignment.section}</strong> ({filteredStudents.length} Students)
            </div>
            <button
              onClick={() => { setAssignmentFilter('All'); setSectionFilter('All'); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
            >
              Clear Filter ✕
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll Number</th>
              <th>Department</th>
              <th style={{ textAlign: 'center' }}>Section</th>
              <th style={{ textAlign: 'center' }}>Year / Sem</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text)' }}>
                  Loading enrolled students from assigned sections...
                </td>
              </tr>
            ) : assignedClasses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Assigned Classes"
                message="You do not have any active subject or section assignments. Student rosters will appear once classes are assigned by the administrator."
                isTableRow={true}
                colSpan={7}
              />
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={UserX}
                title="No Students Found"
                message="No enrolled students match your search query or selected section filter."
                isTableRow={true}
                colSpan={7}
                actionText="Reset Filters"
                onAction={() => {
                  setFilterAtRiskOnly(false);
                  setSectionFilter('All');
                  setSearchQuery('');
                }}
              />
            ) : (
              filteredStudents.map((std) => {
                const stdName = std.user?.full_name || std.name || 'Student';
                const roll = std.roll_number || std.rollNumber || std.user_id || '—';
                const initials = stdName.split(' ').map(n => n[0]).join('').slice(0, 2);
                return (
                  <tr key={std.id || std.user_id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(std)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11.5px',
                          fontWeight: 700
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{stdName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6 }}>{std.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{roll}</td>
                    <td>{std.department || 'CSE'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-purple" style={{ fontWeight: 800, fontSize: '11px' }}>
                        Sec {std.section || 'A'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {std.year || 3} Year • Sem {std.semester || 5}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-green">
                        Active
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(std); }}
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Student Profile & Advisory Drawer */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                  {selectedStudent.user?.full_name || selectedStudent.name || 'Student Profile'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, margin: '2px 0 0' }}>
                  {selectedStudent.roll_number || selectedStudent.rollNumber || '—'} • Section {selectedStudent.section || 'A'} • {selectedStudent.department || 'CSE'}
                </p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', fontWeight: 600 }}>ACADEMIC YEAR</span>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0 0' }}>
                    {selectedStudent.year || 3} Year
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--color-text)', opacity: 0.65, textTransform: 'uppercase', fontWeight: 600 }}>ENROLLED SECTION</span>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)', margin: '4px 0 0' }}>
                    Section {selectedStudent.section || 'A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, fontSize: '12px' }}>Dispatch Faculty Advisory Note:</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder={`Write an advisory note or remedial feedback for ${selectedStudent.user?.full_name || selectedStudent.name || 'this student'}...`}
                  value={counselingNote}
                  onChange={(e) => setCounselingNote(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    onClick={handleSendNote}
                    disabled={!counselingNote.trim() || noteSent}
                    className="btn btn-primary btn-sm"
                  >
                    <Send size={13} />
                    <span>{noteSent ? 'Dispatched...' : 'Send Advisory Note'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
