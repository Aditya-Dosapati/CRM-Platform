import React, { useState, useMemo, useEffect } from 'react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import { 
  FolderDown, BookOpen, FileText, Download, Sparkles, Filter, 
  Search, ExternalLink, Bookmark, CheckCircle2 
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function StudentResources({ onOpenPdf, onOpenRagQuery }) {
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'syllabus' | 'notes' | 'pyq' | 'lab_manual' | 'reference'
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subRes, docsRes] = await Promise.all([
          academicDataService.getSubjects(),
          ragDocumentService.getDocuments()
        ]);
        if (isMounted) {
          if (subRes.data) setSubjects(subRes.data);
          if (docsRes) setResources(docsRes);
        }
      } catch (err) {
        console.warn('StudentResources: could not fetch data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      if (selectedCategory !== 'All' && res.document_type !== selectedCategory) return false;
      if (selectedSubject !== 'All' && res.subject_id !== selectedSubject && res.subject !== selectedSubject) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = res.title && res.title.toLowerCase().includes(q);
        const fileMatch = res.file_name && res.file_name.toLowerCase().includes(q);
        return titleMatch || fileMatch;
      }
      return true;
    });
  }, [resources, selectedCategory, selectedSubject, searchQuery]);

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
            Academic Resources & Digital Library
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Verified textbooks, faculty lecture slides, laboratory manuals, and curriculum reference materials
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Recommend the best study materials and references for my current subjects based on GMRIT R20 regulation.")}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          <span>AI Resource Recommendations</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'center'
        }}>
          <div>
            <label className="input-label" style={{ fontSize: '11px' }}>Resource Type</label>
            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Resource Types</option>
              <option value="syllabus">Syllabus</option>
              <option value="notes">Lecture Notes</option>
              <option value="pyq">PYQ Questions</option>
              <option value="lab_manual">Lab Manual</option>
              <option value="reference">Reference Guide</option>
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11px' }}>Subject</label>
            <select
              className="input-field"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="All">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11px' }}>Search Resources</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search title, document..."
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

      {/* Resources Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {filteredResources.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={BookOpen}
              title="No Resources Found"
              description="No digital academic materials match your current category or search criteria."
              actionText="Reset Filters"
              onAction={() => {
                setSelectedCategory('All');
                setSelectedSubject('All');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          filteredResources.map((res) => (
            <div
              key={res.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '18px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="badge">
                    {res.document_type || 'Document'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{res.file_size ? `${(res.file_size / (1024*1024)).toFixed(1)} MB` : 'PDF'}</span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px', lineHeight: 1.3 }}>
                  {res.title || res.file_name}
                </h3>

                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11.5px',
                  color: 'var(--color-text-muted)',
                  marginBottom: '14px'
                }}>
                  <div><strong>File:</strong> {res.file_name}</div>
                  <div><strong>Status:</strong> {res.status || 'Indexed'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => onOpenPdf({
                    title: res.title || res.file_name,
                    doc: res.storage_path || res.file_name,
                    page: 1
                  })}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <FileText size={13} />
                  <span>Read PDF</span>
                </button>
                <button
                  onClick={() => onOpenRagQuery(`Summarize key concepts from "${res.title || res.file_name}".`)}
                  className="btn btn-subtle btn-sm"
                  title="Ask AI about this resource"
                >
                  <Sparkles size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

