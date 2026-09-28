import React, { useState } from 'react';
import { Plus, BarChart2, X, CheckCircle, Award } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';

export default function FacultyAssessments({ onOpenRagQuery }) {
  const [assessments, setAssessments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(null);

  useEscapeKey(() => {
    if (showAnalyticsModal) {
      setShowAnalyticsModal(null);
    } else if (showCreateModal) {
      setShowCreateModal(false);
    }
  }, showCreateModal || Boolean(showAnalyticsModal));

  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Machine Learning');
  const [newQuestions, setNewQuestions] = useState(20);
  const [newDuration, setNewDuration] = useState('30 minutes');
  const [newDueDate, setNewDueDate] = useState('');

  const handleCreateAssessment = (e) => {
    e.preventDefault();
    const created = {
      id: `f_quiz_${Date.now()}`,
      title: newTitle,
      subject: newSubject,
      questionsCount: Number(newQuestions),
      studentsCount: 60,
      submittedCount: 0,
      averageScore: "0%",
      status: "Scheduled",
      dueDate: newDueDate || "Next Week"
    };
    setAssessments([created, ...assessments]);
    setShowCreateModal(false);
    setNewTitle('');
    alert(`Assessment "${newTitle}" created and scheduled for student portals.`);
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
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
            Faculty Assessments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
            Create, schedule, review, and analyze student assessment performances
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>Create Assessment</span>
        </button>
      </div>

      {/* Assessment Cards or Empty State */}
      {assessments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Award}
            title="No Assessments Created Yet"
            message="You haven't scheduled any continuous internal assessments or quizzes yet. Click 'Create Assessment' to schedule one."
            actionText="Create Assessment"
            onAction={() => setShowCreateModal(true)}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assessments.map((a) => (
            <div key={a.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-blue">{a.subject}</span>
                    <span className={`badge ${a.status === 'Completed' ? 'badge-green' : 'badge-orange'}`}>
                      {a.status}
                    </span>
                    <span className="badge badge-gray">Due: {a.dueDate}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                    {a.title}
                  </h3>

                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.8 }}>
                    <span>Questions: <strong>{a.questionsCount}</strong></span>
                    <span>Students: <strong>{a.studentsCount}</strong></span>
                    <span>Submitted: <strong>{a.submittedCount} / {a.studentsCount}</strong></span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      Average Score: {a.averageScore}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowAnalyticsModal(a)}
                    className="btn btn-secondary btn-sm"
                  >
                    <BarChart2 size={13} />
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                Create New Assessment
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Assessment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Machine Learning — Continuous Quiz 1"
                    className="input-field"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Questions</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="50"
                      className="input-field"
                      value={newQuestions}
                      onChange={(e) => setNewQuestions(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Duration</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Due Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Friday, 11:59 PM"
                    required
                    className="input-field"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Publish Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="modal-overlay" onClick={() => setShowAnalyticsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                {showAnalyticsModal.title} — Analytics
              </h3>
              <button onClick={() => setShowAnalyticsModal(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>SUBMITTED</span>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)' }}>
                    {showAnalyticsModal.submittedCount} / {showAnalyticsModal.studentsCount}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>AVERAGE SCORE</span>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {showAnalyticsModal.averageScore}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.8 }}>
                Item response analysis and automated score distributions will update once student submissions are processed.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAnalyticsModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
