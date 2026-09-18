import React, { useState } from 'react';
import { academicSubjects } from '../../data/mockData';
import { FileText, Download, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function StudentSyllabus({ onOpenPdf, onOpenRagQuery }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('sub_ml');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSem, setSelectedSem] = useState('Sem 4');

  const selectedSubject = academicSubjects.find(s => s.id === selectedSubjectId) || academicSubjects[0];

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

        <button
          onClick={() => onOpenRagQuery(`Summarize the syllabus and provide high-yield revision topics for ${selectedSubject.name}`)}
          className="btn btn-primary"
        >
          <Sparkles size={15} />
          <span>Ask GMRIT AI: Syllabus Summary</span>
        </button>
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
              <option value="CSE">Computer Science & Engineering</option>
              <option value="IT">Information Technology</option>
              <option value="ECE">Electronics & Communication</option>
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
            <select className="input-field" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}>
              {academicSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Subject Overview Card */}
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
        {selectedSubject.units.map((unit, index) => (
          <div key={index} className="card" style={{ padding: '18px 22px' }}>
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
    </div>
  );
}
