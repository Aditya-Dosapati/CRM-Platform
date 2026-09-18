import React, { useState } from 'react';
import { facultyResourcesList } from '../../data/mockData';
import { FolderArchive, Plus, FileText, Download, Trash2, Edit3, CheckCircle2, X, Upload } from 'lucide-react';

export default function FacultyResources({ onOpenPdf }) {
  const [resources, setResources] = useState(facultyResourcesList);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Machine Learning');
  const [unit, setUnit] = useState('Unit III');
  const [fileType, setFileType] = useState('PDF Document');
  const [visibility, setVisibility] = useState('Public to Students');

  const handleUpload = (e) => {
    e.preventDefault();
    const newRes = {
      id: `res_${Date.now()}`,
      title,
      subject,
      unit,
      fileType,
      size: '3.4 MB',
      uploadedDate: 'Just now',
      visibility,
      ragStatus: 'Indexed (56 chunks)',
      downloads: 0
    };
    setResources([newRes, ...resources]);
    setShowUploadModal(false);
    setTitle('');
    alert(`Resource "${title}" successfully uploaded and vectorized into GMRIT RAG Knowledge Base.`);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this academic resource from course repository and RAG index?")) {
      setResources(resources.filter(r => r.id !== id));
    }
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
            Faculty Resources
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Upload and manage lecture notes, handouts, PYQs, and reference PDFs
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>+ Upload Resource</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Subject & Unit</th>
              <th>Type</th>
              <th>Uploaded Date</th>
              <th>Visibility</th>
              <th>RAG Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((res) => (
              <tr key={res.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--pastel-blue-bg)',
                      color: 'var(--primary-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{res.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{res.size} • {res.downloads} Downloads</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{res.subject}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>{res.unit}</span>
                </td>
                <td>{res.fileType}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{res.uploadedDate}</td>
                <td>
                  <span className="badge badge-green">{res.visibility}</span>
                </td>
                <td>
                  <span className="badge badge-blue">
                    <CheckCircle2 size={11} />
                    {res.ragStatus}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onOpenPdf({ title: res.title, doc: `${res.title.replace(/\s+/g, '_')}.pdf`, page: 1 })}
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--error)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal with Clean Drag-and-Drop */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Upload Academic Resource
              </h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Resource Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Convolutional Neural Networks Architecture Notes"
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Subject</label>
                    <select className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)}>
                      <option value="Machine Learning">Machine Learning (20CS401)</option>
                      <option value="Data Structures">Data Structures (20CS402)</option>
                      <option value="DBMS">Database Systems (20CS403)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Unit</label>
                    <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                      <option value="Unit I">Unit I</option>
                      <option value="Unit II">Unit II</option>
                      <option value="Unit III">Unit III</option>
                      <option value="Unit IV">Unit IV</option>
                      <option value="Unit V">Unit V</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Resource Type</label>
                    <select className="input-field" value={fileType} onChange={(e) => setFileType(e.target.value)}>
                      <option value="PDF Document">PDF Document</option>
                      <option value="Lecture Notes">Lecture Notes</option>
                      <option value="PYQ Solutions">PYQ Solutions</option>
                      <option value="Infographic / Cheat Sheet">Infographic / Cheat Sheet</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Visibility</label>
                    <select className="input-field" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                      <option value="Public to Students">Public to Students</option>
                      <option value="Faculty Only">Faculty Only</option>
                    </select>
                  </div>
                </div>

                {/* Clean Drag-and-Drop Area */}
                <div style={{
                  padding: '24px',
                  border: '2px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  marginTop: '10px'
                }}>
                  <Upload size={24} color="var(--primary-blue)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Choose a file or drag & drop it here
                  </p>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    PDF, PPTX, or DOCX up to 50MB. Auto-indexed into RAG.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Upload Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
