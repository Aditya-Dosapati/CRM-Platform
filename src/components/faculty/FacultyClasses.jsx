import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, Clock, Calendar, CheckCircle2, 
  Sparkles, Award, ArrowUpRight, Search, FileText, Plus, AlertCircle 
} from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import authService from '../../services/authService';
import EmptyState from '../common/EmptyState';

export default function FacultyClasses({ onOpenRagQuery }) {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [subRes, stdRes] = await Promise.all([
          academicDataService.getSubjects(),
          academicDataService.getStudents()
        ]);
        if (isMounted) {
          const loadedSubs = subRes?.data || [];
          setSubjects(loadedSubs);
          setStudents(stdRes?.data || []);
          if (loadedSubs.length > 0) {
            setSelectedSubjectId(loadedSubs[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load faculty class data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0] || null;

  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    return students.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const name = (s.name || s.user?.full_name || '').toLowerCase();
      const roll = (s.roll_number || s.rollNumber || s.user_id || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [students, searchQuery]);

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
            My Assigned Classes & Subjects
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Manage course sections, class attendance registries, syllabus schedules, and student rosters
          </p>
        </div>

        {currentSubject && (
          <button
            onClick={() => onOpenRagQuery(`Provide attendance and syllabus performance summary for ${currentSubject.name || currentSubject.code}`)}
            className="btn btn-primary"
          >
            <Sparkles size={14} />
            <span>AI Class Analytics</span>
          </button>
        )}
      </div>

      {/* Class Section Cards */}
      {isLoading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text)' }}>
          Loading course roster...
        </div>
      ) : subjects.length === 0 ? (
        <div className="card" style={{ marginBottom: '22px' }}>
          <EmptyState
            icon={BookOpen}
            title="No Assigned Classes"
            message="There are no academic subjects or classes currently assigned to your faculty profile."
          />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          marginBottom: '22px'
        }}>
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className="card"
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-surface)' : 'var(--color-surface)',
                  boxShadow: isSelected ? '0 4px 12px rgba(198, 93, 46, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge badge-blue">{sub.code}</span>
                  <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                    {sub.department_code || sub.department?.code || 'CSE'}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px' }}>
                  {sub.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, marginBottom: '12px' }}>
                  Credits: {sub.credits || 3} • Regulation: {sub.regulation || 'R20'}
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
                    <span style={{ color: 'var(--color-text)', opacity: 0.6 }}>Enrolled</span>
                    <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '13px' }}>
                      {students.length} Students
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text)', opacity: 0.6 }}>Semester</span>
                    <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '13px' }}>
                      Sem {sub.semester || 'V'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Class Deep-Dive Workspace */}
      {currentSubject && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-blue">{currentSubject.code}</span>
                <span className="badge badge-green">Active Course</span>
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                {currentSubject.name} — Student Roster
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
                Academic Course Roster • Regulation {currentSubject.regulation || 'R20'}
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
                  <th>Year / Semester</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Students Enrolled"
                    message="No student records match the active subject or search criteria."
                    isTableRow={true}
                    colSpan={5}
                  />
                ) : (
                  filteredStudents.map((std) => (
                    <tr key={std.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                          {std.user?.full_name || std.name || 'Student'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                        {std.roll_number || std.rollNumber || std.user?.user_metadata?.roll_number || '—'}
                      </td>
                      <td>
                        {std.department?.name || std.department_name || currentSubject.department_code || 'CSE'}
                      </td>
                      <td>
                        {std.academic_year || 'III Year'} • Sem {std.current_semester || currentSubject.semester || '5'}
                      </td>
                      <td>
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
