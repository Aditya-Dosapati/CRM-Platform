import React, { useState } from 'react';
import { pyqList } from '../../data/mockData';
import { HelpCircle, Plus, FileText, Download, CheckCircle2, Filter, Trash2, Sparkles, BookOpen } from 'lucide-react';

export default function AdminPYQs({ onOpenPdf }) {
  const [papers, setPapers] = useState(pyqList);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [subject, setSubject] = useState('Machine Learning');
  const [year, setYear] = useState('2025');
  const [examType, setExamType] = useState('Semester End Examination');
  const [regulation, setRegulation] = useState('R20');
  const [questionsCount, setQuestionsCount] = useState(15);

  const handleUpload = (e) => {
    e.preventDefault();
    const newPaper = {
      id: `pyq_${Date.now()}`,
      subject,
      subjectCode: '20CS401',
      year,
      regulation,
      examType,
      questionCount: Number(questionsCount),
      maxMarks: 70,
      difficulty: 'Moderate',
      pdfUrl: `${subject.replace(/\s+/g, '_')}_${year}_Paper.pdf`,
      keyTopics: ['Model Questions', 'Course Outcome Mapped'],
      sampleQuestions: ['Examine core principles and algorithmic formulation.']
    };
    setPapers([newPaper, ...papers]);
    setShowUploadModal(false);
    alert(`PYQ question paper for ${subject} (${year}) uploaded and indexed for RAG solution assistance.`);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Institutional PYQ Examination Repository
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage Semester End Examinations (SEE), Mid assessments, and model answer key indexing
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>Upload Question Paper</span>
        </button>
      </div>

      {/* Papers Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Year</th>
              <th>Regulation</th>
              <th>Exam Type</th>
              <th>Questions</th>
              <th>Max Marks</th>
              <th>RAG Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id}>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.subject}</span>
                </td>
                <td>
                  <span className="badge badge-blue">{p.year}</span>
                </td>
                <td>{p.regulation}</td>
                <td>
                  <span className="badge badge-purple">{p.examType}</span>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.questionCount} Questions</td>
                <td>{p.maxMarks} Marks</td>
                <td>
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={12} />
                    Solution Vectorized
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onOpenPdf({ title: `${p.subject} — ${p.year} ${p.examType}`, doc: p.pdfUrl, page: 1 })}
                      className="btn btn-secondary btn-sm"
                    >
                      View Paper
                    </button>
                    <button
                      onClick={() => alert(`Re-indexing solutions for ${p.subject}`)}
                      className="btn btn-secondary btn-sm"
                    >
                      Re-index
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Upload Previous Examination Paper
              </h3>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <select className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="Machine Learning">Machine Learning (20CS401)</option>
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms (20CS402)</option>
                    <option value="Database Management Systems">Database Management Systems (20CS403)</option>
                    <option value="Operating Systems">Operating Systems (20CS404)</option>
                    <option value="Computer Networks">Computer Networks (20CS405)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Examination Year</label>
                    <select className="input-field" value={year} onChange={(e) => setYear(e.target.value)}>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Regulation</label>
                    <select className="input-field" value={regulation} onChange={(e) => setRegulation(e.target.value)}>
                      <option value="R20">R20 Regulation</option>
                      <option value="R23">R23 Regulation</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Exam Classification</label>
                  <select className="input-field" value={examType} onChange={(e) => setExamType(e.target.value)}>
                    <option value="Semester End Examination">Semester End Examination (SEE)</option>
                    <option value="Mid Examination">Mid Examination 1 / Mid 2</option>
                    <option value="Model Paper">Institutional Model Paper</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Upload & Vectorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
