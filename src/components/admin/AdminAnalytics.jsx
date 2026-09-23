import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Cpu, Users, Building, Activity, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import academicDataService from '../../services/academicDataService';
import ragDocumentService from '../../services/ragDocumentService';
import authService from '../../services/authService';
import EmptyState from '../common/EmptyState';

export default function AdminAnalytics({ onOpenRagQuery }) {
  const [departments, setDepartments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [deptRes, docRes, userList] = await Promise.all([
          academicDataService.getDepartments(),
          ragDocumentService.getDocuments(),
          Promise.resolve(authService.getAllUsers())
        ]);
        if (isMounted) {
          setDepartments(deptRes?.data || []);
          setDocuments(docRes?.data || []);
          setUsers(Array.isArray(userList) ? userList : []);
        }
      } catch (err) {
        console.warn('Error loading admin analytics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const studentCount = users.filter(u => u.role === 'student').length;
  const facultyCount = users.filter(u => u.role === 'faculty').length;
  const indexedDocs = documents.filter(d => (d.rawStatus || d.status) === 'indexed');

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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            Institution-Level Academic & AI Telemetry
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '4px' }}>
            Cross-departmental performance metrics, RAG semantic utilization, and campus learning velocity
          </p>
        </div>

        <button
          onClick={() => onOpenRagQuery("Synthesize an institution-wide academic diagnostic across engineering departments")}
          className="btn btn-primary"
        >
          <Sparkles size={15} />
          <span>Executive AI Report</span>
        </button>
      </div>

      {/* KPI Cards - 6-Color System */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL ENROLLED STUDENTS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            {isLoading ? '...' : studentCount}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            Across {departments.length} Engineering Depts
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TEACHING FACULTY
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            {isLoading ? '...' : facultyCount}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            Active Faculty Accounts
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              RAG VECTOR ASSETS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            {isLoading ? '...' : indexedDocs.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            Indexed Knowledge Documents
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DEPARTMENTS ACTIVE
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
            {isLoading ? '...' : departments.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
            Autonomous Regulations
          </div>
        </div>
      </div>

      {/* Departmental Comparison Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Department Comparison Chart */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Building size={16} color="var(--color-primary)" />
                <span>Academic Departments</span>
              </h3>
              <p className="card-subtitle">Active academic department directory</p>
            </div>
            <span className="badge badge-blue">{departments.length} Departments</span>
          </div>

          {departments.length === 0 ? (
            <div style={{ padding: '20px' }}>
              <EmptyState
                icon={Building}
                title="No Departments Configured"
                message="No academic department records found in database."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              {departments.map((d) => (
                <div key={d.id} style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '13.5px' }}>{d.name}</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.6, display: 'block' }}>Code: {d.code}</span>
                  </div>
                  <span className="badge badge-purple">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vector DB Architecture Info */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Activity size={16} color="var(--color-accent)" />
                <span>Vector DB Pipeline Telemetry</span>
              </h3>
              <p className="card-subtitle">pgvector embeddings & RLS storage policies</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>EMBEDDING MODEL</span>
              <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text)', marginTop: '2px' }}>
                intfloat/multilingual-e5-small (384 dim)
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>STORAGE BUCKET</span>
              <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
                rag-documents (Private, Strict RLS)
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>SEARCH RPC</span>
              <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text)', marginTop: '2px' }}>
                match_rag_chunks() (Cosine Distance)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Queried RAG Documents */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
              RAG Knowledge Assets Repository
            </h3>
          </div>
          <span className="badge badge-blue">{documents.length} Total Documents</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Documents Registered"
                  message="No knowledge documents currently ingested in RAG vector database."
                  isTableRow={true}
                  colSpan={4}
                />
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {doc.title || doc.document || doc.fileName}
                    </td>
                    <td>{doc.subject || 'Institutional'}</td>
                    <td>
                      <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                        {doc.documentType || 'Document'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-green">
                        {doc.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
