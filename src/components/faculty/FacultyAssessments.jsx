import React, { useState } from 'react';
import { Plus, BarChart2, X, CheckCircle } from 'lucide-react';

export default function FacultyAssessments({ onOpenRagQuery }) {
  const [assessments, setAssessments] = useState([
    {
      id: "f_quiz_05",
      title: "Machine Learning — Quiz 5",
      subject: "Machine Learning (20CS401)",
      questionsCount: 20,
      studentsCount: 62,
      submittedCount: 58,
      averageScore: "76%",
      status: "Completed",
      dueDate: "05 Sept 2025"
    },
    {
      id: "f_quiz_04",
      title: "Machine Learning — Quiz 4",
      subject: "Machine Learning (20CS401)",
      questionsCount: 20,
      studentsCount: 62,
      submittedCount: 38,
      averageScore: "Pending",
      status: "Active",
      dueDate: "Tomorrow, 11:59 PM"
    },
    {
      id: "f_quiz_ai_02",
      title: "Artificial Intelligence — Assessment 2",
      subject: "Artificial Intelligence (20CS602)",
      questionsCount: 25,
      studentsCount: 64,
      submittedCount: 61,
      averageScore: "81.2%",
      status: "Completed",
      dueDate: "28 Aug 2025"
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Machine Learning (20CS401)');
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
      studentsCount: 62,
      submittedCount: 0,
      averageScore: "0%",
      status: "Scheduled",
      dueDate: newDueDate || "Next Week"
    };
    setAssessments([created, ...assessments]);
    setShowCreateModal(false);
    setNewTitle('');
    alert(`Assessment "${newTitle}" created and published to student portals.`);
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
            Faculty Assessments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Create, schedule, review, and analyze student assessment performances
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>Create Assessment</span>
        </button>
      </div>

      {/* Assessment Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {assessments.map((a) => (
          <div key={a.id} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-blue">{a.subject}</span>
                  <span className={`badge ${a.status === 'Completed' ? 'badge-green' : 'badge-yellow'}`}>
                    {a.status}
                  </span>
                  <span className="badge badge-gray">Due: {a.dueDate}</span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {a.title}
                </h3>

                <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <span>Questions: <strong>{a.questionsCount}</strong></span>
                  <span>Students: <strong>{a.studentsCount}</strong></span>
                  <span>Submitted: <strong>{a.submittedCount} / {a.studentsCount}</strong></span>
                  <span style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Create New Assessment
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
                    placeholder="e.g. Machine Learning — Quiz 6"
                    className="input-field"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <select
                    className="input-field"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  >
                    <option value="Machine Learning (20CS401)">Machine Learning (20CS401)</option>
                    <option value="Artificial Intelligence (20CS602)">Artificial Intelligence (20CS602)</option>
                  </select>
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
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {showAnalyticsModal.title} — Analytics
              </h3>
              <button onClick={() => setShowAnalyticsModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SUBMITTED</span>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {showAnalyticsModal.submittedCount} / {showAnalyticsModal.studentsCount}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AVERAGE SCORE</span>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-blue)' }}>
                    {showAnalyticsModal.averageScore}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Automated item analysis indicates highest proficiency in Classification metrics and greatest variance in Backpropagation derivations.
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
