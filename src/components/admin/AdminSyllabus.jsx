import React, { useState } from 'react';
import { FileText, Plus, Filter, CheckCircle2, Clock, AlertCircle, Cpu, Download, Trash2, BookOpen, Layers } from 'lucide-react';

export default function AdminSyllabus({ onOpenPdf }) {
  const [syllabi, setSyllabi] = useState([
    { id: 'syl_1', subject: 'Machine Learning', code: '20CS401', dept: 'CSE', regulation: 'R20', sem: 'IV Sem', status: 'Indexed', chunks: 314, date: '10 Sept 2025' },
    { id: 'syl_2', subject: 'Data Structures & Algorithms', code: '20CS402', dept: 'CSE', regulation: 'R20', sem: 'IV Sem', status: 'Indexed', chunks: 268, date: '08 Sept 2025' },
    { id: 'syl_3', subject: 'Database Management Systems', code: '20CS403', dept: 'CSE', regulation: 'R20', sem: 'IV Sem', status: 'Indexed', chunks: 254, date: '08 Sept 2025' },
    { id: 'syl_4', subject: 'Operating Systems', code: '20CS404', dept: 'CSE', regulation: 'R20', sem: 'IV Sem', status: 'Processing', chunks: 0, date: 'Just now' },
    { id: 'syl_5', subject: 'Computer Networks', code: '20CS405', dept: 'CSE', regulation: 'R20', sem: 'IV Sem', status: 'Indexed', chunks: 251, date: '04 Sept 2025' },
    { id: 'syl_6', subject: 'Digital Logic Design', code: '23EC201', dept: 'ECE', regulation: 'R23', sem: 'II Sem', status: 'Failed', chunks: 0, date: '01 Sept 2025' }
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [dept, setDept] = useState('CSE');
  const [regulation, setRegulation] = useState('R20');

  const handleUpload = (e) => {
    e.preventDefault();
    const newSyl = {
      id: `syl_${Date.now()}`,
      subject: subName,
      code: subCode,
      dept,
      regulation,
      sem: 'IV Sem',
      status: 'Processing',
      chunks: 0,
      date: 'Just now'
    };
    setSyllabi([newSyl, ...syllabi]);
    setShowUploadModal(false);
    setSubName('');
    setSubCode('');

    // Simulate automatic RAG indexing completion
    setTimeout(() => {
      setSyllabi(prev => prev.map(s => s.id === newSyl.id ? { ...s, status: 'Indexed', chunks: 240 } : s));
    }, 2500);
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
            Institutional Syllabus Management
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Curriculum document indexing, BOS approvals, and automated RAG embedding pipelines
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>Upload Syllabus</span>
        </button>
      </div>

      {/* RAG Ingestion Pipeline Status Summary */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL CURRICULA</span>
            <div className="kpi-icon-wrap">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="kpi-value">{syllabi.length} Courses</div>
          <div className="kpi-trend neutral">R20 & R23 Regulations</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-label">INDEXED IN RAG</span>
            <div className="kpi-icon-wrap">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>
            {syllabi.filter(s => s.status === 'Indexed').length} Active
          </div>
          <div className="kpi-trend positive">Instant AI Search Ready</div>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-top">
            <span className="kpi-label">PROCESSING CHUNKS</span>
            <div className="kpi-icon-wrap">
              <Clock size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#EA580C' }}>
            {syllabi.filter(s => s.status === 'Processing').length} In-Queue
          </div>
          <div className="kpi-trend warning">Embedding with OpenAI API</div>
        </div>

        <div className="kpi-card" style={{ background: '#FFF1F2', borderColor: '#FECDD3' }}>
          <div className="kpi-top">
            <span className="kpi-label" style={{ color: '#BE123C' }}>FAILED VALIDATION</span>
            <div className="kpi-icon-wrap" style={{ background: '#FFE4E6', color: '#E11D48' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#E11D48' }}>
            {syllabi.filter(s => s.status === 'Failed').length} Error
          </div>
          <div className="kpi-trend neutral" style={{ color: '#BE123C' }}>PDF OCR Retry Needed</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course / Subject</th>
              <th>Code</th>
              <th>Department</th>
              <th>Regulation</th>
              <th>Semester</th>
              <th>RAG Chunks</th>
              <th>Pipeline Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {syllabi.map((s) => (
              <tr key={s.id}>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.subject}</span>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.code}</td>
                <td>{s.dept}</td>
                <td>
                  <span className="badge badge-purple">{s.regulation}</span>
                </td>
                <td>{s.sem}</td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary-blue)', fontWeight: 600 }}>
                  {s.chunks > 0 ? `${s.chunks} vectors` : '—'}
                </td>
                <td>
                  <span className={`badge ${
                    s.status === 'Indexed' ? 'badge-green' :
                    s.status === 'Processing' ? 'badge-orange' : 'badge-danger'
                  }`}>
                    {s.status === 'Indexed' && <CheckCircle2 size={12} />}
                    {s.status === 'Processing' && <Clock size={12} />}
                    {s.status === 'Failed' && <AlertCircle size={12} />}
                    {s.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onOpenPdf({ title: `${s.subject} Syllabus`, doc: `${s.code}_Syllabus.pdf`, page: 1 })}
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => alert(`Re-indexing trigger dispatched for ${s.subject}`)}
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
                Upload & Auto-Index Course Syllabus
              </h3>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Computing & Distributed Systems"
                    className="input-field"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Subject Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20CS501"
                      className="input-field"
                      value={subCode}
                      onChange={(e) => setSubCode(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Department</label>
                    <select className="input-field" value={dept} onChange={(e) => setDept(e.target.value)}>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Regulation</label>
                    <select className="input-field" value={regulation} onChange={(e) => setRegulation(e.target.value)}>
                      <option value="R20">R20 Regulation (Autonomous)</option>
                      <option value="R23">R23 Regulation (Autonomous)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Academic Year</label>
                    <input type="text" className="input-field" defaultValue="2025-26" readOnly />
                  </div>
                </div>

                <div style={{
                  padding: '24px 20px',
                  border: '2px dashed var(--pastel-blue-border)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  background: 'var(--pastel-blue-bg)',
                  marginTop: '12px',
                  cursor: 'pointer'
                }}>
                  <Cpu size={24} color="var(--primary-blue)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Select or drop Syllabus PDF</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Document is automatically chunked and registered in Qdrant Vector Store</p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
