import React from 'react';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Layers,
  Zap,
  TrendingUp,
  FileCheck,
  ChevronRight
} from 'lucide-react';

export default function CodingAssessmentResultModal({ assessment, onClose }) {
  if (!assessment) return null;

  const score = assessment.score ?? 82;
  const totalMarks = assessment.totalMarks || 100;
  const percentage = Math.round((score / totalMarks) * 100);
  const solvedCount = assessment.solvedCount ?? 4;
  const questionsCount = assessment.questionsCount || 5;
  const testCasesPassed = assessment.testCasesPassed || '38 / 42';
  const runtimeScore = assessment.runtimeScore || 'Good (42 ms avg)';

  const problemBreakdown = assessment.problemBreakdown || [
    { id: 'Q1', title: 'Vector Dot Product', marks: '20 / 20', status: 'Passed', testCases: '10/10' },
    { id: 'Q2', title: 'Matrix Transpose & Inversion', marks: '20 / 20', status: 'Passed', testCases: '8/8' },
    { id: 'Q3', title: 'Two Sum Variant', marks: '18 / 20', status: 'Partial', testCases: '9/10' },
    { id: 'Q4', title: 'Kadane Max Contiguous Slice', marks: '24 / 30', status: 'Partial', testCases: '11/14' },
    { id: 'Q5', title: 'Graph Cycle Verification', marks: '0 / 10', status: 'Failed', testCases: '0/10' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--pastel-blue-bg, #EFF6FF)',
                color: 'var(--primary-blue, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--pastel-blue-border, #BFDBFE)'
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#0F172A' }}>
                  Official Assessment Scorecard
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0'
                  }}
                >
                  Completed
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                {assessment.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* Score Card */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#1D4ED8', textTransform: 'uppercase' }}>
                Total Score
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.65rem', fontWeight: '800', color: '#1E40AF' }}>
                  {score}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#3B82F6', fontWeight: '600' }}>
                  / {totalMarks}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '600' }}>
                {percentage}% overall mark
              </div>
            </div>

            {/* Solved Count */}
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#047857', textTransform: 'uppercase' }}>
                Problems Solved
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.65rem', fontWeight: '800', color: '#065F46' }}>
                  {solvedCount}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: '600' }}>
                  / {questionsCount}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                {Math.round((solvedCount / questionsCount) * 100)}% problems cleared
              </div>
            </div>

            {/* Test Cases Passed */}
            <div
              style={{
                backgroundColor: '#F5F3FF',
                border: '1px solid #DDD6FE',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#6D28D9', textTransform: 'uppercase' }}>
                Test Cases
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: '800', color: '#5B21B6' }}>
                  {testCasesPassed}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: '600' }}>
                Sample & Hidden cases
              </div>
            </div>

            {/* Runtime Performance */}
            <div
              style={{
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#C2410C', textTransform: 'uppercase' }}>
                Execution Speed
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#9A3412' }}>
                  {runtimeScore}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#EA580C', fontWeight: '600' }}>
                Optimized complexity
              </div>
            </div>
          </div>

          {/* Problem-wise Breakdown Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '0.875rem 1.25rem',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>
                Question-Wise Evaluation Breakdown
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Evaluated against server sandbox
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: '600' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Question Title</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Test Cases Passed</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {problemBreakdown.map((item, idx) => {
                    const isPassed = item.status === 'Passed';
                    const isPartial = item.status === 'Partial';
                    const isFailed = item.status === 'Failed';

                    return (
                      <tr
                        key={item.id || idx}
                        style={{
                          borderBottom: idx === problemBreakdown.length - 1 ? 'none' : '1px solid #F1F5F9'
                        }}
                      >
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: '700', color: '#2563EB' }}>
                          {item.id}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: '600', color: '#1E293B' }}>
                          {item.title}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              backgroundColor: '#F1F5F9',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            {item.testCases}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: isPassed ? '#ECFDF5' : isPartial ? '#FEF3C7' : '#FEF2F2',
                              color: isPassed ? '#059669' : isPartial ? '#D97706' : '#DC2626',
                              border: `1px solid ${isPassed ? '#A7F3D0' : isPartial ? '#FDE68A' : '#FECACA'}`
                            }}
                          >
                            {isPassed && <CheckCircle2 size={13} />}
                            {isPartial && <AlertCircle size={13} />}
                            {isFailed && <XCircle size={13} />}
                            {item.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '0.875rem 1.25rem',
                            textAlign: 'right',
                            fontWeight: '700',
                            color: isPassed ? '#059669' : isPartial ? '#D97706' : '#DC2626'
                          }}
                        >
                          {item.marks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Instructor Feedback & Recommendation */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              gap: '0.875rem',
              alignItems: 'flex-start'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>
                Faculty Assessment Feedback
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#475569', lineHeight: '1.45' }}>
                Excellent overall problem-solving pace on array transformations and Kadane slicing. You missed 2 edge cases on Q3 and encountered a recursion stack depth issue on Q5 (Graph Cycle Verification). We recommend practicing topological sorting and 3-color DFS under the <strong>Coding Practice &gt; Graphs</strong> module before the final SEE practical.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Official GMRIT Autonomous SEE Examination Record • Validated
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary-blue, #2563EB)',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Close Scorecard
          </button>
        </div>
      </div>
    </div>
  );
}
