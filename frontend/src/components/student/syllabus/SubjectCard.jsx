import React from 'react';
import { BookOpen, Sparkles, Award, Layers, Terminal } from 'lucide-react';

export default function SubjectCard({ subject, onAskAi }) {
  if (!subject) return null;

  const isCareerPath = subject.category === 'career_path' || subject.type === 'Career Path Elective';
  const isLab = subject.category === 'lab' || subject.type === 'Technical Lab';
  const isInternship = subject.category === 'internship' || subject.type === 'Internship';
  const isFsiSubject = subject.category === 'fsi_subject' || subject.type === 'Core / FSI Requirement';

  // Badge styles based on category/type
  const getBadgeClass = () => {
    if (isCareerPath) return 'badge-purple';
    if (isLab) return 'badge-green';
    if (isInternship) return 'badge-orange';
    if (isFsiSubject) return 'badge-blue';
    return 'badge-blue';
  };

  return (
    <div
      className="card"
      style={{
        padding: '16px 20px',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {subject.code && (
              <span className="badge badge-gray" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.4px' }}>
                {subject.code}
              </span>
            )}

            {subject.type && (
              <span className={`badge ${getBadgeClass()}`} style={{ fontSize: '11px' }}>
                {subject.type}
              </span>
            )}

            {subject.careerPathName && (
              <span className="badge badge-purple" style={{ fontSize: '11px', fontWeight: 700 }}>
                Track: {subject.careerPathName}
              </span>
            )}
          </div>

          {/* Credits ONLY shown if present in source data */}
          {typeof subject.credits !== 'undefined' && subject.credits !== null && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-canvas)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)'
              }}
            >
              {subject.credits} {subject.credits === 1 ? 'Credit' : 'Credits'}
            </span>
          )}
        </div>

        {/* Subject Title */}
        <h3
          style={{
            fontSize: '15.5px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 6px 0',
            lineHeight: 1.35
          }}
        >
          {subject.name}
        </h3>

        {/* Description / Summary if available */}
        {subject.description && (
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 12px 0'
            }}
          >
            {subject.description}
          </p>
        )}
      </div>

      {/* Footer / Actions */}
      {onAskAi && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-light)',
            marginTop: '8px'
          }}
        >
          <button
            onClick={() => onAskAi(subject)}
            className="btn btn-subtle btn-xs"
            style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title={`Ask AI Subject Tutor about ${subject.name}`}
          >
            <Sparkles size={12} color="var(--primary-blue)" />
            <span>Ask AI Tutor</span>
          </button>
        </div>
      )}
    </div>
  );
}
