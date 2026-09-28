import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, AlertTriangle, X, Send, Sparkles, UserX, Users } from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import authService from '../../services/authService';
import useEscapeKey from '../../hooks/useEscapeKey';
import useSafeTimeout from '../../hooks/useSafeTimeout';
import EmptyState from '../common/EmptyState';

export default function FacultyStudents({ onOpenRagQuery }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [counselingNote, setCounselingNote] = useState('');
  const [noteSent, setNoteSent] = useState(false);
  const setSafeTimeout = useSafeTimeout();

  useEscapeKey(() => {
    setSelectedStudent(null);
  }, Boolean(selectedStudent));

  useEffect(() => {
    let isMounted = true;
    async function loadStudents() {
      setIsLoading(true);
      try {
        const res = await academicDataService.getStudents();
        if (isMounted) {
          setStudents(res?.data || []);
        }
      } catch (err) {
        console.warn('Failed to load students:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadStudents();
    return () => { isMounted = false; };
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = (s.user?.full_name || s.name || '').toLowerCase();
      const roll = (s.roll_number || s.rollNumber || s.user_id || '').toLowerCase();
      const section = s.section || 'A';
      
      if (filterAtRiskOnly && !s.isAtRisk) return false;
      if (sectionFilter !== 'All' && section !== sectionFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return name.includes(q) || roll.includes(q);
      }
      return true;
    });
  }, [students, filterAtRiskOnly, sectionFilter, searchQuery]);

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
            Monitor student attendance, continuous marks, and assign interventions
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
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

            <select
              className="input-field"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{ width: '140px', paddingBlock: '7px' }}
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
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
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll Number</th>
              <th>Department</th>
              <th>Year / Sem</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text)' }}>
                  Loading enrolled students...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={UserX}
                title="No Students Found"
                message="No enrolled students match your search query or selected filters."
                isTableRow={true}
                colSpan={6}
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
                  <tr key={std.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(std)}>
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
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{stdName}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{roll}</td>
                    <td>{std.department?.name || std.department_name || 'CSE'}</td>
                    <td>{std.academic_year || 'III Year'} • Sem {std.current_semester || '5'}</td>
                    <td>
                      <span className="badge badge-green">
                        Active
                      </span>
                    </td>
                    <td>
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

      {/* Student Drawer */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                  {selectedStudent.user?.full_name || selectedStudent.name || 'Student Profile'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7 }}>
                  {selectedStudent.roll_number || selectedStudent.rollNumber || '—'} • {selectedStudent.department?.name || 'Computer Science & Engineering'}
                </p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>ACADEMIC YEAR</span>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                    {selectedStudent.academic_year || 'III Year'}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>CURRENT SEMESTER</span>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    Semester {selectedStudent.current_semester || '5'}
                  </p>
                </div>
              </div>

              <div>
                <label className="input-label">Dispatch Faculty Advisory Note:</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder={`Write an advisory note or remedial assignment for ${selectedStudent.user?.full_name || selectedStudent.name || 'this student'}...`}
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
