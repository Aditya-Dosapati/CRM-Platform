import React, { useState } from 'react';
import { pyqList } from '../../data/mockData';
import { HelpCircle, Download, Sparkles, Filter, FileText } from 'lucide-react';

export default function StudentPYQs({ onOpenPdf, onOpenRagQuery }) {
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [examTypeFilter, setExamTypeFilter] = useState('All');

  const filteredPYQs = pyqList.filter(pyq => {
    if (subjectFilter !== 'All' && pyq.subject !== subjectFilter) return false;
    if (yearFilter !== 'All' && pyq.year !== yearFilter) return false;
    if (examTypeFilter !== 'All' && pyq.examType !== examTypeFilter) return false;
    return true;
  });

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
            Previous Year Questions
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Official GMRIT Autonomous examination question papers with model answers
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("What are the most repeated PYQ questions across Machine Learning and DBMS in the past 3 years?")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI PYQ Frequency Analysis</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px'
        }}>
          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Subject</label>
            <select
              className="input-field"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="All">All Subjects</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Data Structures & Algorithms">Data Structures</option>
              <option value="Database Management Systems">DBMS</option>
              <option value="Operating Systems">Operating Systems</option>
              <option value="Computer Networks">Computer Networks</option>
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Year</label>
            <select
              className="input-field"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="All">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Exam Type</label>
            <select
              className="input-field"
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
            >
              <option value="All">All Examinations</option>
              <option value="Semester End Examination">Semester End Examination</option>
              <option value="Mid Examination">Mid Examination</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean Table / List */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Exam Type</th>
              <th>Year</th>
              <th>Questions</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPYQs.map((pyq) => (
              <tr key={pyq.id}>
                <td>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{pyq.subject}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pyq.regulation} Regulation • Max {pyq.maxMarks} Marks</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${pyq.examType.includes('End') ? 'badge-purple' : 'badge-blue'}`}>
                    {pyq.examType}
                  </span>
                </td>
                <td>
                  <span className="badge badge-gray" style={{ fontWeight: 700 }}>
                    {pyq.year}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {pyq.questionCount} Questions
                </td>
                <td>
                  <span className="badge badge-green">Verified PDF</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onOpenPdf({ title: `${pyq.subject} — ${pyq.year} ${pyq.examType}`, doc: pyq.pdfUrl, page: 1 })}
                      className="btn btn-secondary btn-sm"
                    >
                      <FileText size={13} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => alert(`Downloading question paper ${pyq.pdfUrl}`)}
                      className="btn btn-secondary btn-sm"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => onOpenRagQuery(`Explain this PYQ from ${pyq.subject} (${pyq.year} ${pyq.examType}): ${pyq.sampleQuestions[0]}`)}
                      className="btn btn-subtle btn-sm"
                    >
                      <Sparkles size={13} />
                      <span>Ask AI</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
