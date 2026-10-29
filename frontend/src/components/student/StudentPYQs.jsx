import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ragDocumentService from '../../services/ragDocumentService';
import academicDataService from '../../services/academicDataService';
import { HelpCircle, Download, Sparkles, Filter, FileText, Search, RefreshCw, AlertCircle } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function StudentPYQs({ onOpenPdf, onOpenRagQuery }) {
  const [pyqs, setPyqs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, subRes] = await Promise.all([
        ragDocumentService.getDocuments({ documentType: 'pyq' }),
        academicDataService.getSubjects()
      ]);
      if (docRes?.error && (!docRes.data || docRes.data.length === 0)) {
        throw new Error(docRes.error);
      }
      const docs = Array.isArray(docRes) ? docRes : (docRes?.data || []);
      setPyqs(docs);
      if (subRes?.data) setSubjects(subRes.data);
    } catch (e) {
      console.warn('StudentPYQs: error loading data:', e);
      setError(e.message || 'Failed to retrieve previous question papers.');
      setPyqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPYQs = useMemo(() => {
    return pyqs.filter(pyq => {
      if (subjectFilter !== 'All' && pyq.subject_id !== subjectFilter && pyq.subjectId !== subjectFilter && pyq.subject !== subjectFilter) return false;
      if (yearFilter !== 'All' && String(pyq.year) !== String(yearFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = pyq.title && pyq.title.toLowerCase().includes(q);
        const fileMatch = pyq.file_name && pyq.file_name.toLowerCase().includes(q);
        const fileNameMatch = pyq.fileName && pyq.fileName.toLowerCase().includes(q);
        return titleMatch || fileMatch || fileNameMatch;
      }
      return true;
    });
  }, [pyqs, subjectFilter, yearFilter, searchQuery]);

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
            Previous Year Questions
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Official GMRIT Autonomous examination question papers with model answers
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery && onOpenRagQuery("What are the most repeated PYQ questions across engineering subjects in the past 3 years?")}
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
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
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
            <label className="input-label" style={{ fontSize: '11.5px' }}>Search Question Papers</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search PYQ papers..."
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="card" style={{ padding: '24px', backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertCircle size={22} color="#DC2626" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#991B1B' }}>Failed to Load Question Papers</h3>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#B91C1C' }}>{error}</p>
            </div>
          </div>
          <button onClick={loadData} className="btn btn-primary btn-sm" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px auto', color: 'var(--color-primary)' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Loading Previous Year Questions...</p>
        </div>
      )}

      {/* Clean Table / List */}
      {!loading && !error && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Paper Title</th>
                <th>Format</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPYQs.length === 0 ? (
                <EmptyState
                  icon={HelpCircle}
                  title="No previous question papers uploaded yet."
                  description="No past examination question papers have been uploaded for the selected academic filters."
                  isTableRow={true}
                  colSpan={4}
                  actionText={subjectFilter !== 'All' || yearFilter !== 'All' || searchQuery ? "Reset Filters" : undefined}
                  onAction={() => {
                    setSubjectFilter('All');
                    setYearFilter('All');
                    setSearchQuery('');
                  }}
                />
              ) : (
                filteredPYQs.map((pyq) => (
                  <tr key={pyq.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)', display: 'block' }}>{pyq.title || pyq.fileName || pyq.file_name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{pyq.regulation || 'AR23'} Regulation • Autonomous • {pyq.year || '2024'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge">
                        PDF Document
                      </span>
                    </td>
                    <td>
                      <span className="badge">{pyq.status || 'Indexed'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {onOpenPdf && (
                          <button
                            onClick={() => onOpenPdf({
                              title: pyq.title || pyq.fileName || pyq.file_name,
                              doc: pyq.storagePath || pyq.storage_path || pyq.fileName || pyq.file_name,
                              page: 1
                            })}
                            className="btn btn-secondary btn-sm"
                          >
                            <FileText size={13} />
                            <span>View</span>
                          </button>
                        )}
                        {onOpenRagQuery && (
                          <button
                            onClick={() => onOpenRagQuery(`Explain key questions and concepts from ${pyq.title || pyq.fileName || pyq.file_name}`)}
                            className="btn btn-subtle btn-sm"
                          >
                            <Sparkles size={13} />
                            <span>Ask AI</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
