import React from 'react';
import { X, FileText, Download, ShieldCheck, Cpu } from 'lucide-react';

export default function SourceViewerModal({ isOpen, onClose, source }) {
  if (!isOpen || !source) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content large"
        style={{ padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--pastel-blue-bg)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {source.title || source.doc || 'Verified Academic Document'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Official GMRIT Autonomous Curriculum • Page {source.page || 1} • RAG Chunk Ref
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-green">
              <ShieldCheck size={12} />
              Verified Authentic
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', maxHeight: '65vh', overflowY: 'auto' }}>
          {/* Metadata Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <span><strong>File:</strong> {source.doc || 'Course_Document.pdf'}</span>
              <span><strong>Regulation:</strong> R20 Autonomous</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => alert("Document downloaded.")}>
              <Download size={13} />
              <span>Download PDF</span>
            </button>
          </div>

          {/* RAG Snippet Callout */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--pastel-blue-bg)',
            border: '1px solid var(--pastel-blue-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Cpu size={15} color="var(--primary-blue)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)' }}>
                RETRIEVED RAG VECTOR CHUNK (Page {source.page || 1})
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{source.excerpt || 'Normalization minimizes redundancy and eliminates update anomalies. For third normal form (3NF), in relation R with functional dependency X -> A, either X is a superkey or A is a prime attribute. In Boyce-Codd Normal Form (BCNF), X must strictly be a superkey.'}"
            </p>
          </div>

          {/* Document Sheet Simulation */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                GMR INSTITUTE OF TECHNOLOGY (AUTONOMOUS)
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Department of Computer Science & Engineering • Academic Year 2025-26
              </p>
            </div>

            <div style={{ lineHeight: 1.7, fontSize: '13px', color: 'var(--text-secondary)' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                COURSE OUTCOMES & TOPIC SPECIFICATION
              </p>
              <p style={{ marginBottom: '14px' }}>
                Students will be able to formulate mathematical models and evaluate empirical performance on high-dimensional feature spaces. Continuous assessment criteria ensure alignment with NAAC and NBA criteria.
              </p>

              <div style={{
                backgroundColor: 'var(--pastel-blue-bg)',
                borderLeft: '3px solid var(--primary-blue)',
                padding: '10px 14px',
                margin: '14px 0',
                color: 'var(--text-primary)'
              }}>
                Optimization objective: min 1/2 ||w||² + C Σ ξ_i subject to y_i(w·x_i + b) ≥ 1 - ξ_i. This convex quadratic programming formulation guarantees a unique global minimum without local optima.
              </div>

              <p>
                Approved by Board of Studies (BOS) • Affiliated to JNTUGV
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
