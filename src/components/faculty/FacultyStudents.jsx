import React, { useState } from 'react';
import { facultyStudentRoster } from '../../data/mockData';
import { Search, Filter, AlertTriangle, X, Send, Sparkles } from 'lucide-react';

export default function FacultyStudents({ onOpenRagQuery }) {
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [counselingNote, setCounselingNote] = useState('');
  const [noteSent, setNoteSent] = useState(false);

  const filteredStudents = facultyStudentRoster.filter(s => {
    if (filterAtRiskOnly && !s.isAtRisk) return false;
    if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSendNote = () => {
    if (!counselingNote.trim()) return;
    setNoteSent(true);
    setTimeout(() => {
      setNoteSent(false);
      setCounselingNote('');
      alert(`Academic advisory note dispatched to ${selectedStudent.name} (${selectedStudent.rollNumber}).`);
    }, 600);
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
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Students Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Monitor student attendance, continuous marks, and assign interventions
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Analyze at-risk students in Dr. Priya's class and suggest personalized remediation")}
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
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            </div>

            <select
              className="input-field"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{ width: '140px', paddingBlock: '7px' }}
            >
              <option value="All">All Sections</option>
              <option value="CSE-A">Section A</option>
              <option value="CSE-B">Section B</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setFilterAtRiskOnly(!filterAtRiskOnly)}
              className={`btn btn-sm ${filterAtRiskOnly ? 'btn-primary' : 'btn-secondary'}`}
              style={filterAtRiskOnly ? { backgroundColor: 'var(--gmr-orange)', borderColor: 'var(--gmr-orange)' } : {}}
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
              <th>Attendance</th>
              <th>Average</th>
              <th>Assessments</th>
              <th>Performance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((std) => (
              <tr key={std.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(std)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: std.isAtRisk ? 'var(--pastel-orange-bg)' : 'var(--pastel-blue-bg)',
                      color: std.isAtRisk ? 'var(--gmr-orange)' : 'var(--primary-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}>
                      {std.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{std.name}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{std.rollNumber}</td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: std.attendance >= 85 ? 'var(--success)' : std.attendance >= 75 ? 'var(--warning)' : 'var(--error)',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {std.attendance}%
                  </span>
                </td>
                <td>
                  <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                    {std.averageMarks}%
                  </strong>
                </td>
                <td>{std.assessments}</td>
                <td>
                  <span className={`badge ${
                    std.performance === 'Excellent' ? 'badge-blue' :
                    std.performance === 'Good' ? 'badge-green' : 'badge-orange'
                  }`}>
                    {std.performance}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: std.isAtRisk ? 'var(--gmr-orange)' : 'var(--text-muted)', fontWeight: std.isAtRisk ? 600 : 400 }}>
                    {std.status}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Drawer */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedStudent.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedStudent.rollNumber} • {selectedStudent.section}
                </p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {selectedStudent.isAtRisk && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--pastel-orange-bg)',
                  border: '1px solid var(--pastel-orange-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertTriangle size={18} color="var(--gmr-orange)" />
                  <div>
                    <strong style={{ fontSize: '12.5px', color: 'var(--gmr-orange)' }}>At-Risk Notice</strong>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedStudent.riskReason}</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ATTENDANCE</span>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: selectedStudent.attendance >= 75 ? 'var(--success)' : 'var(--error)' }}>
                    {selectedStudent.attendance}%
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AVERAGE MARKS</span>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-blue)' }}>
                    {selectedStudent.averageMarks}%
                  </p>
                </div>
              </div>

              <div>
                <label className="input-label">Dispatch Faculty Advisory Note:</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder={`Write an advisory note or remedial assignment for ${selectedStudent.name}...`}
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
