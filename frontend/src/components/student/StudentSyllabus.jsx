import React, { useState, useMemo, useEffect, useCallback } from 'react';
import academicDataService from '../../services/academicDataService';
import { FileText, Download, Sparkles, BookOpen, Layers, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function StudentSyllabus({ onOpenPdf, onOpenRagQuery }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('Sem 4');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch departments on mount
  useEffect(() => {
    let isMounted = true;
    const loadDepts = async () => {
      try {
        const res = await academicDataService.getDepartments();
        if (isMounted && res.data && res.data.length > 0) {
          setDepartments(res.data);
          setSelectedDept(prev => prev || res.data[0].code);
        }
      } catch (e) {
        console.warn('Failed to load departments list in syllabus:', e);
      }
    };
    loadDepts();
    return () => { isMounted = false; };
  }, []);

  // Fetch subjects whenever selectedDept changes
  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await academicDataService.getSubjects(selectedDept);
      if (res.data && res.data.length > 0) {
        setSubjects(res.data);
        setSelectedSubjectId(prev => {
          if (prev && res.data.some(s => s.id === prev)) return prev;
          return res.data[0].id;
        });
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error('Failed to load subjects for syllabus:', err);
      setError(err.message || 'Unable to retrieve syllabus subjects.');
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const selectedSubject = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

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
            My Syllabus
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Access your subject-wise academic syllabus and vectorized RAG course units
          </p>
        </div>

        {selectedSubject && (
          <button
            onClick={() => onOpenRagQuery(`Summarize the syllabus and provide high-yield revision topics for ${selectedSubject.name}`)}
            className="btn btn-primary"
          >
            <Sparkles size={15} />
            <span>Ask GMRIT AI: Syllabus Summary</span>
          </button>
        )}
      </div>

      {/* Filter Bar: Department, Semester, Subject */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}>
          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Department</label>
            <select className="input-field" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              {departments.map((dept) => (
                <option key={dept.code || dept.id} value={dept.code}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Semester</label>
            <select className="input-field" value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)}>
              <option value="Sem 4">Semester 4 (Active)</option>
              <option value="Sem 3">Semester 3</option>
              <option value="Sem 2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Subject</label>
            <select 
              className="input-field" 
              value={selectedSubjectId} 
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={loading || subjects.length === 0}
            >
              {loading ? (
                <option>Loading subjects...</option>
              ) : subjects.length === 0 ? (
                <option>No subjects available</option>
              ) : (
                subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && subjects.length === 0 && (
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px', color: 'var(--primary-blue)' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Loading Syllabus Data</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Querying curriculum repository...</p>
        </div>
      )}

      {/* Error State */}
      {error && subjects.length === 0 && (
        <div className="card" style={{ padding: '24px', backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertCircle size={22} color="#DC2626" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#991B1B' }}>Failed to Load Syllabus</h3>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#B91C1C' }}>{error}</p>
            </div>
          </div>
          <button onClick={loadSubjects} className="btn btn-primary btn-sm" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && subjects.length === 0 && !error && (
        <EmptyState
          icon={BookOpen}
          title="No Syllabus Available"
          message={`No subjects found for ${selectedDept} in ${selectedSem}.`}
          actionText="Refresh"
          onAction={loadSubjects}
        />
      )}

      {/* Selected Subject Overview Card & Units */}
      {selectedSubject && (
        <>
          <div className="card" style={{
            marginBottom: '20px',
            backgroundColor: 'var(--pastel-blue-bg)',
            borderColor: 'var(--pastel-blue-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-blue)'
                }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-blue">{selectedSubject.code}</span>
                    <span className="badge badge-gray">R20 Regulation</span>
                    <span className="badge badge-purple">{selectedSubject.credits} Credits</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedSubject.name}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Course Coordinator: <strong>{selectedSubject.faculty}</strong> • Progress: <strong>{selectedSubject.progress}%</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenPdf({ title: `${selectedSubject.name} — Full Course Syllabus`, doc: `${selectedSubject.code}_Full_Syllabus.pdf`, page: 1 })}
                className="btn btn-secondary btn-sm"
              >
                <FileText size={14} />
                <span>View Full PDF</span>
              </button>
            </div>
          </div>

          {/* Units List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(selectedSubject.units || []).map((unit) => (
              <div key={`${selectedSubject.id}_${unit.number}`} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span className="badge badge-blue" style={{ fontWeight: 800 }}>
                        {unit.number}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {unit.title}
                      </h4>
                      <span className="badge badge-green" style={{ fontSize: '11px' }}>
                        <CheckCircle2 size={12} />
                        RAG Indexed
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: '6px' }}>
                      {unit.summary || `Covers core theoretical concepts, problem formulations, and applications for ${unit.title}.`}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <span>📄 {unit.pdfName}</span>
                      <span>📚 {unit.notesCount || 3} Handouts</span>
                      <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>⚡ {unit.ragChunks || 48} Vector Chunks</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onOpenPdf({ title: `${selectedSubject.name}: ${unit.number} — ${unit.title}`, doc: unit.pdfName, page: 1 })}
                      className="btn btn-secondary btn-sm"
                    >
                      <FileText size={13} />
                      <span>View PDF</span>
                    </button>
                    <button
                      onClick={() => onOpenRagQuery(`Explain ${unit.number} of ${selectedSubject.name}. Detail key formulas and exam questions.`)}
                      className="btn btn-subtle btn-sm"
                    >
                      <Sparkles size={13} />
                      <span>Ask AI</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
