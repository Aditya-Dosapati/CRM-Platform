import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import ragDocumentService, { DOCUMENT_TYPES, isValidUuid } from '../../services/ragDocumentService';
import academicDataService from '../../services/academicDataService';
import useEscapeKey from '../../hooks/useEscapeKey';

export default function RagUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('syllabus');
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDeptCode, setSelectedDeptCode] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [semester, setSemester] = useState('Semester 4');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptError, setDeptError] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subError, setSubError] = useState(null);

  const fileInputRef = useRef(null);

  useEscapeKey(() => {
    if (!isUploading) onClose();
  }, isOpen);

  // Load Departments directly from Supabase on modal open
  useEffect(() => {
    let mounted = true;
    async function loadDepts() {
      setLoadingDepts(true);
      setDeptError(null);
      try {
        const { data, error } = await academicDataService.getDepartments();
        if (mounted) {
          if (error) {
            console.error('[RagUploadModal] Error loading departments:', error);
            setDeptError(error);
            setDepartments([]);
            setSelectedDeptId('');
            setSelectedDeptCode('');
          } else if (Array.isArray(data) && data.length > 0) {
            setDepartments(data);
            setSelectedDeptId(prev => {
              if (prev && data.some(d => d.id === prev)) return prev;
              return data[0].id || '';
            });
            setSelectedDeptCode(prev => {
              if (prev && data.some(d => d.code === prev)) return prev;
              return data[0].code || 'CSE';
            });
          } else {
            setDepartments([]);
            setSelectedDeptId('');
            setSelectedDeptCode('');
          }
        }
      } catch (e) {
        if (mounted) {
          console.error('[RagUploadModal] Exception loading departments:', e);
          setDeptError(e.message || 'Failed to load departments');
        }
      } finally {
        if (mounted) setLoadingDepts(false);
      }
    }
    if (isOpen) {
      loadDepts();
    }
    return () => { mounted = false; };
  }, [isOpen]);

  // Load Subjects when Department UUID changes
  useEffect(() => {
    let mounted = true;
    async function loadSubs() {
      if (!selectedDeptId || !isValidUuid(selectedDeptId)) {
        setSubjects([]);
        setSelectedSubjectId('');
        return;
      }
      setLoadingSubjects(true);
      setSubError(null);
      try {
        const { data, error } = await academicDataService.getSubjects(selectedDeptId);
        if (mounted) {
          if (error) {
            console.error('[RagUploadModal] Error loading subjects:', error);
            setSubError(error);
            setSubjects([]);
            setSelectedSubjectId('');
          } else if (Array.isArray(data) && data.length > 0) {
            setSubjects(data);
            setSelectedSubjectId(prev => {
              if (prev && data.some(s => s.id === prev)) return prev;
              return data[0].id || '';
            });
          } else {
            setSubjects([]);
            setSelectedSubjectId('');
          }
        }
      } catch (e) {
        if (mounted) {
          console.error('[RagUploadModal] Exception loading subjects:', e);
          setSubError(e.message || 'Failed to load subjects');
        }
      } finally {
        if (mounted) setLoadingSubjects(false);
      }
    }
    if (isOpen && selectedDeptId) {
      loadSubs();
    }
    return () => { mounted = false; };
  }, [isOpen, selectedDeptId]);

  const handleDeptChange = (e) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    const found = departments.find(d => String(d.id) === String(deptId));
    setSelectedDeptCode(found?.code || '');
  };

  const handleFileSelect = (selectedFile) => {
    setUploadError(null);
    if (!selectedFile) return;

    const validation = ragDocumentService.validatePdfFile(selectedFile);
    if (!validation.valid) {
      setUploadError(validation.error);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    if (!title) {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(baseName);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [title]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);

    // 1. File verification
    if (!file) {
      setUploadError('Please select a valid PDF document to upload.');
      return;
    }

    // 2. Title verification
    if (!title.trim()) {
      setUploadError('Please enter a descriptive document title.');
      return;
    }

    // 3. Department UUID verification (Strict: No mock IDs permitted)
    if (!selectedDeptId || !isValidUuid(selectedDeptId)) {
      setUploadError('Please select a valid academic department from the database.');
      return;
    }

    // 4. Subject UUID verification (If selected, must be valid UUID)
    if (selectedSubjectId && !isValidUuid(selectedSubjectId)) {
      setUploadError('The selected subject does not have a valid database UUID.');
      return;
    }

    setIsUploading(true);

    try {
      const res = await ragDocumentService.uploadDocument({
        file,
        title: title.trim(),
        description: description.trim(),
        documentType,
        departmentId: selectedDeptId,
        departmentCode: selectedDeptCode || 'GEN',
        subjectId: selectedSubjectId || null,
        semester,
        academicYear
      });

      setIsUploading(false);
      setUploadSuccess(true);

      if (onUploadSuccess) {
        onUploadSuccess(res.document);
      }

      setTimeout(() => {
        setUploadSuccess(false);
        setFile(null);
        setTitle('');
        setDescription('');
        onClose();
      }, 1400);

    } catch (err) {
      setIsUploading(false);
      console.error('[RagUploadModal] Upload error caught:', err);
      setUploadError(err.message || 'Failed to complete document upload. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isUploading && onClose()}>
      <div className="modal-content medium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--pastel-blue-bg)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--pastel-blue-border)'
            }}>
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Ingest Document to RAG Knowledge Base
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Secure PDF upload to private storage and asynchronous ingestion pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {uploadSuccess ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--pastel-green-bg)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid var(--pastel-green-border)'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Document Successfully Uploaded!
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Stored in private bucket <code style={{ color: 'var(--primary-blue)' }}>rag-documents</code> and queued in <code style={{ color: 'var(--primary-blue)' }}>rag_ingestion_jobs</code>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '16px 20px' }}>
              {(uploadError || deptError || subError) && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--pastel-red-bg, #FFF1F2)',
                  border: '1px solid var(--pastel-red-border, #FECDD3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  color: '#BE123C',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.45 }}>{uploadError || deptError || subError}</span>
                </div>
              )}

              {/* PDF Dropzone Area */}
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '28px 20px',
                    border: `2px dashed ${isDragging ? 'var(--primary-blue)' : 'var(--pastel-blue-border)'}`,
                    borderRadius: '10px',
                    textAlign: 'center',
                    background: isDragging ? 'var(--pastel-blue-bg)' : 'var(--bg-canvas)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: '18px'
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'var(--pastel-blue-bg)',
                    color: 'var(--primary-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px'
                  }}>
                    <FileText size={22} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drop course PDF here or <span style={{ color: 'var(--primary-blue)' }}>browse</span>
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supported format: PDF only • Maximum file size: 50 MB
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--pastel-blue-bg)',
                  border: '1px solid var(--pastel-blue-border)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#DBEAFE',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); }}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--error)', flexShrink: 0 }}
                    title="Remove file"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              {/* Form Metadata Fields */}
              <div className="input-group">
                <label className="input-label">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 4 - Support Vector Machines & Optimization"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Document Type *</label>
                  <select
                    className="input-field"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <span>Department *</span>
                    {loadingDepts && <span style={{ fontSize: '11px', color: 'var(--primary-blue)', marginLeft: '6px' }}>Loading...</span>}
                  </label>
                  <select
                    className="input-field"
                    value={selectedDeptId}
                    onChange={handleDeptChange}
                    disabled={loadingDepts}
                    required
                  >
                    {loadingDepts ? (
                      <option value="" disabled>Loading departments...</option>
                    ) : deptError ? (
                      <option value="" disabled>Database Error: {deptError}</option>
                    ) : departments.length === 0 ? (
                      <option value="" disabled>No departments configured</option>
                    ) : (
                      departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.code ? `${d.code} - ` : ''}{d.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">
                    <span>Subject</span>
                    {loadingSubjects && <span style={{ fontSize: '11px', color: 'var(--primary-blue)', marginLeft: '6px' }}>Loading...</span>}
                  </label>
                  <select
                    className="input-field"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={loadingSubjects || loadingDepts || departments.length === 0}
                  >
                    {loadingSubjects ? (
                      <option value="" disabled>Loading subjects for {selectedDeptCode || 'department'}...</option>
                    ) : subError ? (
                      <option value="" disabled>Database Error: {subError}</option>
                    ) : subjects.length === 0 ? (
                      <option value="">No subjects mapped to this department</option>
                    ) : (
                      <>
                        <option value="">General / None (Curriculum-wide)</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.code ? `${s.code} - ` : ''}{s.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Semester</label>
                  <select
                    className="input-field"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="Semester 1">Semester 1 (I Sem)</option>
                    <option value="Semester 2">Semester 2 (II Sem)</option>
                    <option value="Semester 3">Semester 3 (III Sem)</option>
                    <option value="Semester 4">Semester 4 (IV Sem)</option>
                    <option value="Semester 5">Semester 5 (V Sem)</option>
                    <option value="Semester 6">Semester 6 (VI Sem)</option>
                    <option value="Semester 7">Semester 7 (VII Sem)</option>
                    <option value="Semester 8">Semester 8 (VIII Sem)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Academic Year</label>
                  <select
                    className="input-field"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Storage Bucket</label>
                  <input
                    type="text"
                    className="input-field"
                    value="rag-documents (Private / RLS)"
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or notes regarding this curriculum asset..."
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Target: <code style={{ fontSize: '10.5px' }}>{selectedDeptCode || 'DEPT'}/{documentType}/*.pdf</code>
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isUploading || !file || !selectedDeptId}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Upload & Ingest</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
