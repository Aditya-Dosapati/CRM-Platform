import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Plus,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  FileCode,
  Sparkles,
  Search,
  Filter,
  Eye,
  Trash2,
  BookOpen,
  ArrowRight,
  X,
  Check
} from 'lucide-react';
import {
  codingAssessmentsList,
  codingProblemsList,
  facultyStruggleAnalytics,
  codingTopicCategories,
  supportedLanguagesList
} from '../../data/codingData.js';
import CodingWorkspaceModal from '../coding/CodingWorkspaceModal.jsx';
import useSafeTimeout from '../../hooks/useSafeTimeout';
import useEscapeKey from '../../hooks/useEscapeKey';

export default function FacultyCodingManagement({ onOpenRagQuery }) {
  const [assessments, setAssessments] = useState(codingAssessmentsList);
  const [problems, setProblems] = useState(codingProblemsList);
  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments' | 'problems' | 'struggles'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateProblemOpen, setIsCreateProblemOpen] = useState(false);
  const [isCreateAssessmentOpen, setIsCreateAssessmentOpen] = useState(false);
  const [previewProblem, setPreviewProblem] = useState(null);
  const [actionSuccessToast, setActionSuccessToast] = useState(null);
  const setSafeTimeout = useSafeTimeout();

  useEscapeKey(() => {
    if (previewProblem) {
      setPreviewProblem(null);
    } else if (isCreateProblemOpen) {
      setIsCreateProblemOpen(false);
    } else if (isCreateAssessmentOpen) {
      setIsCreateAssessmentOpen(false);
    }
  }, Boolean(previewProblem) || isCreateProblemOpen || isCreateAssessmentOpen);

  const showToast = (msg) => {
    setActionSuccessToast(msg);
    setSafeTimeout(() => setActionSuccessToast(null), 3000);
  };

  // New Problem Form State
  const [newProblem, setNewProblem] = useState({
    title: '',
    difficulty: 'Medium',
    topic: 'Arrays',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: '',
    sampleInput: '',
    sampleOutput: '',
    hiddenInput: '',
    hiddenExpected: '',
    hint: ''
  });

  // New Assessment Form State
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    className: 'B.Tech CSE — Section A',
    durationMinutes: 90,
    startTime: 'Sep 22, 2025 • 10:00 AM',
    totalMarks: 100,
    allowedLanguages: ['Python', 'C++', 'Java', 'C'],
    selectedProblemIds: ['prob-1', 'prob-2', 'prob-3']
  });

  const handleCreateProblemSubmit = (e) => {
    e.preventDefault();
    if (!newProblem.title) return;

    const created = {
      id: `prob-custom-${Date.now()}`,
      title: newProblem.title,
      difficulty: newProblem.difficulty,
      topic: newProblem.topic,
      acceptance: '100%',
      attempts: '0',
      status: 'Not Attempted',
      timeLimit: newProblem.timeLimit,
      memoryLimit: newProblem.memoryLimit,
      description: newProblem.description || 'Custom challenge authored by Faculty.',
      examples: [
        {
          input: newProblem.sampleInput || '1 2 3',
          output: newProblem.sampleOutput || '6',
          explanation: 'Sample evaluation test case.'
        }
      ],
      constraints: ['1 <= N <= 10^5'],
      sampleTestCases: [
        { id: 1, input: newProblem.sampleInput || '1 2 3', expected: newProblem.sampleOutput || '6' }
      ],
      hiddenTestCases: [
        { id: 'h1', input: newProblem.hiddenInput || '4 5 6', expected: newProblem.hiddenExpected || '15' }
      ],
      hints: [newProblem.hint || 'Review data structure constraints.']
    };

    setProblems(prev => [created, ...prev]);
    setIsCreateProblemOpen(false);
    showToast(`Created challenge "${newProblem.title}" successfully!`);
    setNewProblem({
      title: '',
      difficulty: 'Medium',
      topic: 'Arrays',
      timeLimit: '2.0s',
      memoryLimit: '128 MB',
      description: '',
      sampleInput: '',
      sampleOutput: '',
      hiddenInput: '',
      hiddenExpected: '',
      hint: ''
    });
  };

  const handleCreateAssessmentSubmit = (e) => {
    e.preventDefault();
    if (!newAssessment.title) return;

    const created = {
      id: `assess-custom-${Date.now()}`,
      title: newAssessment.title,
      faculty: 'Dr. Priya Sharma',
      department: 'Computer Science & Engineering',
      className: newAssessment.className,
      questionsCount: newAssessment.selectedProblemIds.length,
      durationMinutes: Number(newAssessment.durationMinutes),
      startTime: newAssessment.startTime,
      endTime: 'Sep 22, 2025 • 11:30 AM',
      status: 'upcoming',
      allowedLanguages: newAssessment.allowedLanguages,
      totalMarks: Number(newAssessment.totalMarks),
      questionIds: newAssessment.selectedProblemIds
    };

    setAssessments(prev => [created, ...prev]);
    setIsCreateAssessmentOpen(false);
    showToast(`Assessment "${newAssessment.title}" created & scheduled!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Toast */}
      {actionSuccessToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}
        >
          <CheckCircle2 size={18} />
          {actionSuccessToast}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--pastel-green-bg, #ECFDF5)',
                  color: 'var(--pastel-green-text, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--pastel-green-border, #A7F3D0)'
                }}
              >
                <Code2 size={20} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
                Coding Assessment &amp; Problem Studio
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
              Design Coding Challenges, Schedule Automated Sandbox Evaluations &amp; Track Student Struggles
            </p>
          </div>

          {/* Primary Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsCreateProblemOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#FFFFFF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} />
              Create Coding Problem
            </button>
            <button
              onClick={() => setIsCreateAssessmentOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--primary-blue, #2563EB)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                transition: 'background-color 0.15s'
              }}
            >
              <Plus size={16} />
              Create Coding Assessment
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button
            onClick={() => setActiveTab('assessments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'assessments' ? 'var(--primary-blue, #2563EB)' : '#F1F5F9',
              color: activeTab === 'assessments' ? '#FFFFFF' : '#475569',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span>Assessments</span>
            <span
              style={{
                backgroundColor: activeTab === 'assessments' ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                color: activeTab === 'assessments' ? '#FFFFFF' : '#334155',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.75rem'
              }}
            >
              {assessments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'problems' ? 'var(--primary-blue, #2563EB)' : '#F1F5F9',
              color: activeTab === 'problems' ? '#FFFFFF' : '#475569',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span>Problem Repository</span>
            <span
              style={{
                backgroundColor: activeTab === 'problems' ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                color: activeTab === 'problems' ? '#FFFFFF' : '#334155',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.75rem'
              }}
            >
              {problems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('struggles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'struggles' ? 'var(--primary-blue, #2563EB)' : '#F1F5F9',
              color: activeTab === 'struggles' ? '#FFFFFF' : '#475569',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span>Struggle Analytics</span>
            <span
              style={{
                backgroundColor: activeTab === 'struggles' ? '#FEF2F2' : '#FEE2E2',
                color: '#DC2626',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}
            >
              {facultyStruggleAnalytics.length} Flagged
            </span>
          </button>
        </div>
      </div>

      {/* Student Struggle Analytics Banners */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#EA580C" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0F172A' }}>
              Student Struggle Alerts (Algorithmic Misconceptions Detected)
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Flagged via submission compiler fail rates &gt; 50%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          {facultyStruggleAnalytics.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      color: '#B45309',
                      backgroundColor: '#FEF3C7',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Question {item.questionId}
                  </span>
                  <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1rem', fontWeight: '700', color: '#92400E' }}>
                    {item.title}
                  </h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#DC2626' }}>
                    {item.successRate}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: '600' }}>Pass Rate</div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350F', lineHeight: '1.45' }}>
                {item.flag}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(253, 230, 138, 0.6)',
                  paddingTop: '0.65rem',
                  fontSize: '0.78rem',
                  color: '#92400E'
                }}
              >
                <span><strong>{item.strugglingCount}</strong> of {item.totalAssigned} students struggling</span>
                <span>Avg: <strong>{item.averageAttempts}</strong> submissions</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>
            Scheduled Coding Assessments
          </h3>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Assessment Title</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Class / Section</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Schedule</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Questions</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Marks</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a, idx) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: idx === assessments.length - 1 ? 'none' : '1px solid #F1F5F9'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#1E293B' }}>
                      {a.title}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      {a.className}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontSize: '0.8rem' }}>
                      {a.startTime} ({a.durationMinutes}m)
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '600' }}>
                      {a.questionsCount}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#2563EB', fontWeight: '700' }}>
                      {a.totalMarks}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: a.status === 'completed' ? '#ECFDF5' : '#EFF6FF',
                          color: a.status === 'completed' ? '#059669' : '#2563EB',
                          border: `1px solid ${a.status === 'completed' ? '#A7F3D0' : '#BFDBFE'}`
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => showToast(`Opening submissions roster for "${a.title}"`)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          color: '#2563EB',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Problem Repository Tab */}
      {activeTab === 'problems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0F172A' }}>
              Coding Challenges Bank ({problems.length})
            </h3>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search problems..."
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                outline: 'none',
                width: '240px'
              }}
            />
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Title</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Topic</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Difficulty</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Acceptance</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Test Cases</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {problems
                  .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.topic.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((prob, idx) => (
                    <tr
                      key={prob.id}
                      style={{
                        borderBottom: idx === problems.length - 1 ? 'none' : '1px solid #F1F5F9'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: '700', color: '#1E293B' }}>
                        {prob.title}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                        {prob.topic}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: prob.difficulty === 'Easy' ? '#ECFDF5' : prob.difficulty === 'Medium' ? '#FFFBEB' : '#FEF2F2',
                            color: prob.difficulty === 'Easy' ? '#059669' : prob.difficulty === 'Medium' ? '#D97706' : '#DC2626',
                            border: `1px solid ${prob.difficulty === 'Easy' ? '#A7F3D0' : prob.difficulty === 'Medium' ? '#FDE68A' : '#FECACA'}`
                          }}
                        >
                          {prob.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: '600' }}>
                        {prob.acceptance}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>
                        {prob.sampleTestCases?.length || 2} Sample • {prob.hiddenTestCases?.length || 2} Hidden
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setPreviewProblem(prob)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Test in Sandbox
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Coding Problem */}
      {isCreateProblemOpen && (
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
          onClick={() => setIsCreateProblemOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Code2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
                    Author New Coding Problem
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Define problem statement, limits, sample &amp; hidden test cases
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateProblemOpen(false)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProblemSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Problem Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Find Kth Largest Element in Stream"
                  value={newProblem.title}
                  onChange={e => setNewProblem({ ...newProblem, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Topic Category
                  </label>
                  <select
                    value={newProblem.topic}
                    onChange={e => setNewProblem({ ...newProblem, topic: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    {codingTopicCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Difficulty
                  </label>
                  <select
                    value={newProblem.difficulty}
                    onChange={e => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Execution Limit
                  </label>
                  <input
                    type="text"
                    value={newProblem.timeLimit}
                    onChange={e => setNewProblem({ ...newProblem, timeLimit: e.target.value })}
                    placeholder="2.0s"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Problem Description (Markdown / Text) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the mathematical or computational task..."
                  value={newProblem.description}
                  onChange={e => setNewProblem({ ...newProblem, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Sample Test Case */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase' }}>
                  Sample Test Case (Visible to Students)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>Sample Input</label>
                    <input
                      type="text"
                      placeholder="e.g. nums = [2,7,11,15], target = 9"
                      value={newProblem.sampleInput}
                      onChange={e => setNewProblem({ ...newProblem, sampleInput: e.target.value })}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>Expected Output</label>
                    <input
                      type="text"
                      placeholder="e.g. [0, 1]"
                      value={newProblem.sampleOutput}
                      onChange={e => setNewProblem({ ...newProblem, sampleOutput: e.target.value })}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Hidden Test Case */}
              <div style={{ backgroundColor: '#FEF2F2', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#991B1B', textTransform: 'uppercase' }}>
                  Hidden Evaluation Test Case (Locked for Grading)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>Hidden Input</label>
                    <input
                      type="text"
                      placeholder="e.g. Edge case test input"
                      value={newProblem.hiddenInput}
                      onChange={e => setNewProblem({ ...newProblem, hiddenInput: e.target.value })}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>Hidden Expected Output</label>
                    <input
                      type="text"
                      placeholder="e.g. Expected answer"
                      value={newProblem.hiddenExpected}
                      onChange={e => setNewProblem({ ...newProblem, hiddenExpected: e.target.value })}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Progressive Hint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Consider using a two-pointer approach or hashmap"
                  value={newProblem.hint}
                  onChange={e => setNewProblem({ ...newProblem, hint: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateProblemOpen(false)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Publish to Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Coding Assessment */}
      {isCreateAssessmentOpen && (
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
          onClick={() => setIsCreateAssessmentOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0F172A' }}>
                    Schedule New Coding Assessment
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Configure timing, class assignment &amp; select questions from bank
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateAssessmentOpen(false)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssessmentSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Assessment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEE Practical Mid-Term Coding Exam"
                  value={newAssessment.title}
                  onChange={e => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Target Class / Section
                  </label>
                  <select
                    value={newAssessment.className}
                    onChange={e => setNewAssessment({ ...newAssessment, className: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="B.Tech CSE — Section A">B.Tech CSE — Section A</option>
                    <option value="B.Tech CSE — Section B">B.Tech CSE — Section B</option>
                    <option value="B.Tech IT — Section A">B.Tech IT — Section A</option>
                    <option value="B.Tech AIML — Section A">B.Tech AIML — Section A</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={newAssessment.durationMinutes}
                    onChange={e => setNewAssessment({ ...newAssessment, durationMinutes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Questions Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Select Coding Problems from Repository ({newAssessment.selectedProblemIds.length} Selected)
                </label>
                <div
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  {problems.map(p => {
                    const isChecked = newAssessment.selectedProblemIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          padding: '0.3rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: isChecked ? '#EFF6FF' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setNewAssessment(prev => ({
                              ...prev,
                              selectedProblemIds: isChecked
                                ? prev.selectedProblemIds.filter(id => id !== p.id)
                                : [...prev.selectedProblemIds, p.id]
                            }));
                          }}
                        />
                        <span style={{ fontWeight: '600', color: '#1E293B' }}>{p.title}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({p.topic} • {p.difficulty})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateAssessmentOpen(false)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Schedule &amp; Publish Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sandbox Workspace Preview Modal */}
      {previewProblem && (
        <CodingWorkspaceModal
          problem={previewProblem}
          onClose={() => setPreviewProblem(null)}
          onOpenRagQuery={onOpenRagQuery}
        />
      )}
    </div>
  );
}
