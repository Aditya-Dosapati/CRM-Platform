import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, BarChart2, X, CheckCircle, Award, Sparkles, BookOpen, Clock, 
  Calendar, Layers, FileText, CheckCircle2, AlertCircle, Edit3, Trash2, 
  ArrowRight, RefreshCw, Eye, ChevronRight, UserCheck, AlertTriangle, UploadCloud
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import EmptyState from '../common/EmptyState';
import facultyAssignmentService from '../../services/facultyAssignmentService';
import ragDocumentService from '../../services/ragDocumentService';
import assessmentService from '../../services/assessmentService';
import authService from '../../services/authService';
import RagUploadModal from '../admin/RagUploadModal';

export default function FacultyAssessments({ onOpenRagQuery }) {
  const [assessments, setAssessments] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Create Assessment Flow State (Step 1: Configure, Step 2: Review Questions)
  const [createStep, setCreateStep] = useState('config'); // 'config' | 'review'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(''); // subjectId or subjectCode
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedResourceName, setSelectedResourceName] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(20);
  const [dueDate, setDueDate] = useState('');
  const [mappedStudentCount, setMappedStudentCount] = useState(0);

  // Generated / Review Questions State
  const [questionsList, setQuestionsList] = useState([]);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState(null);

  const currentUser = authService.getCurrentUser();
  const activeFacultyId = currentUser?.facultyId || currentUser?.id || currentUser?.userId || 'fac-anand';

  useEscapeKey(() => {
    if (showAnalyticsModal) {
      setShowAnalyticsModal(null);
    } else if (showCreateModal) {
      setShowCreateModal(false);
    }
  }, showCreateModal || Boolean(showAnalyticsModal));

  // Open Analytics modal and refresh fresh analytics in background
  const handleOpenAnalytics = async (asmt) => {
    setShowAnalyticsModal(asmt);
    try {
      const fresh = await assessmentService.getAssessmentAnalytics(asmt.id);
      if (fresh) {
        setShowAnalyticsModal(prev => (prev && prev.id === asmt.id ? { ...prev, ...fresh } : prev));
      }
    } catch (err) {
      console.warn('[FacultyAssessments] Error refreshing assessment analytics:', err);
    }
  };

  // Load Faculty Assignments, Resources, and Existing Assessments
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesData, asmtRes, resData] = await Promise.all([
        facultyAssignmentService.getFacultyAssignedClasses(activeFacultyId),
        assessmentService.getAssessments({ facultyUserId: activeFacultyId, includeAnalytics: true }),
        ragDocumentService.getDocuments({ uploadedBy: activeFacultyId })
      ]);

      const activeClasses = classesData || [];
      setAssignedClasses(activeClasses);
      setAssessments(asmtRes?.data || []);
      
      const docs = resData?.data || [];
      setResources(docs);

      // Set default branch, subject, and assignment selection if available
      if (activeClasses.length > 0 && !selectedSubjectKey) {
        const first = activeClasses[0];
        const branchCode = (first.departmentCode || 'CSE').toUpperCase().trim();
        setSelectedBranch(branchCode);
        setSelectedSubjectKey(first.subjectCode || first.subjectId);
        setSelectedAssignmentId(first.assignmentId || first.id);
      }
    } catch (err) {
      console.warn('[FacultyAssessments] Error loading assessment data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFacultyId, selectedSubjectKey]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('gmrit_assessments_updated', handleUpdate);
      window.addEventListener('gmrit_assignments_updated', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmrit_assessments_updated', handleUpdate);
        window.removeEventListener('gmrit_assignments_updated', handleUpdate);
      }
    };
  }, [loadData]);

  // Distinct branches taught by this faculty (Dynamic from assignments, not hardcoded)
  const availableBranches = useMemo(() => {
    const map = new Map();
    assignedClasses.forEach(c => {
      const code = (c.departmentCode || c.branchId || c.branch || 'CSE').toUpperCase().trim();
      const name = c.departmentName || (code === 'CSE' ? 'Computer Science and Engineering' : (code === 'AIML' || code === 'CSE-AIML') ? 'CSE - Artificial Intelligence and Machine Learning' : (code === 'AIDS' || code === 'CSE-AIDS') ? 'CSE - Artificial Intelligence and Data Science' : code);
      if (!map.has(code)) {
        map.set(code, {
          code,
          name,
          departmentId: c.departmentId
        });
      }
    });
    return Array.from(map.values());
  }, [assignedClasses]);

  // Distinct subjects taught by this faculty for the selected branch
  const availableSubjects = useMemo(() => {
    if (!selectedBranch) return [];
    const branchClasses = assignedClasses.filter(c => {
      const bCode = (c.departmentCode || c.branchId || c.branch || 'CSE').toUpperCase().trim();
      return bCode === selectedBranch.toUpperCase().trim() || 
             (selectedBranch === 'CSE-AIML' && bCode === 'AIML') ||
             (selectedBranch === 'CSE-AIDS' && bCode === 'AIDS');
    });
    const map = new Map();
    branchClasses.forEach(c => {
      const key = c.subjectCode || c.subjectId || c.code;
      if (!map.has(key)) {
        map.set(key, {
          key,
          subjectId: c.subjectId,
          code: c.code || c.subjectCode,
          name: c.name || c.subjectName,
          credits: c.credits || 3,
          departmentCode: c.departmentCode || selectedBranch
        });
      }
    });
    return Array.from(map.values());
  }, [assignedClasses, selectedBranch]);

  // Valid sections taught for the currently selected branch + subject
  const availableSections = useMemo(() => {
    if (!selectedBranch || !selectedSubjectKey) return [];
    return assignedClasses.filter(c => 
      (c.departmentCode || 'CSE').toUpperCase().trim() === selectedBranch.toUpperCase().trim() &&
      (c.subjectCode === selectedSubjectKey || c.subjectId === selectedSubjectKey || c.code === selectedSubjectKey)
    );
  }, [assignedClasses, selectedBranch, selectedSubjectKey]);

  // Currently active assignment object (faculty_assignment_id as the Single Source of Truth)
  const activeAssignment = useMemo(() => {
    if (!selectedAssignmentId) return availableSections[0] || null;
    return assignedClasses.find(c => (c.assignmentId || c.id) === selectedAssignmentId) || availableSections[0] || null;
  }, [assignedClasses, selectedAssignmentId, availableSections]);

  // Dynamically calculate enrolled student count for the active assignment
  useEffect(() => {
    let isMounted = true;
    async function computeCount() {
      if (activeAssignment) {
        try {
          const stds = await facultyAssignmentService.getStudentsForAssignment(activeAssignment);
          if (isMounted) {
            setMappedStudentCount(stds ? stds.length : 0);
          }
        } catch (err) {
          if (isMounted) setMappedStudentCount(0);
        }
      } else {
        if (isMounted) setMappedStudentCount(0);
      }
    }
    computeCount();
    return () => { isMounted = false; };
  }, [activeAssignment]);

  // Resources relevant to the selected subject
  const availableResources = useMemo(() => {
    if (!activeAssignment) return resources;
    const subId = activeAssignment.subjectId;
    const subCode = (activeAssignment.code || activeAssignment.subjectCode || '').toLowerCase();
    const subName = (activeAssignment.name || activeAssignment.subjectName || '').toLowerCase();

    const filtered = resources.filter(r => {
      const rSub = (r.subjectId || '').toLowerCase();
      const rTitle = (r.title || r.fileName || '').toLowerCase();
      return rSub === subId || rTitle.includes(subCode) || rTitle.includes(subName) || r.uploadedBy === activeFacultyId;
    });

    return filtered.length > 0 ? filtered : [
      { id: 'res-default-unit1', title: `${activeAssignment.name || 'Course'} — Unit 1 Lecture Notes.pdf`, fileName: 'Unit1_Notes.pdf' },
      { id: 'res-default-unit2', title: `${activeAssignment.name || 'Course'} — Unit 2 Concept Guide.pdf`, fileName: 'Unit2_Guide.pdf' }
    ];
  }, [resources, activeAssignment, activeFacultyId]);

  // Handle Branch Dropdown Change (Cascades to Subject & Section)
  const handleBranchChange = (branchCode) => {
    const cleanBranch = String(branchCode).toUpperCase().trim();
    setSelectedBranch(cleanBranch);

    const branchClasses = assignedClasses.filter(c => (c.departmentCode || 'CSE').toUpperCase().trim() === cleanBranch);
    if (branchClasses.length > 0) {
      const firstCls = branchClasses[0];
      const newSubKey = firstCls.subjectCode || firstCls.subjectId || firstCls.code;
      setSelectedSubjectKey(newSubKey);
      setSelectedAssignmentId(firstCls.assignmentId || firstCls.id);
      if (!title || title.includes('Quiz') || title.includes('Concepts') || title.includes('Assessment')) {
        setTitle(`${firstCls.subjectName || firstCls.name || 'Subject'} — Unit 1 Important Concepts Quiz`);
      }
    } else {
      setSelectedSubjectKey('');
      setSelectedAssignmentId('');
    }
  };

  // Handle Subject Dropdown Change (Cascades to Section)
  const handleSubjectChange = (key) => {
    setSelectedSubjectKey(key);
    const matching = assignedClasses.filter(c => 
      (c.departmentCode || 'CSE').toUpperCase().trim() === selectedBranch.toUpperCase().trim() &&
      (c.subjectCode === key || c.subjectId === key || c.code === key)
    );
    if (matching.length > 0) {
      const firstMatch = matching[0];
      setSelectedAssignmentId(firstMatch.assignmentId || firstMatch.id);
      if (!title || title.includes('Quiz') || title.includes('Concepts') || title.includes('Assessment')) {
        setTitle(`${firstMatch.subjectName || firstMatch.name || 'Subject'} — Unit 1 Important Concepts Quiz`);
      }
    } else {
      setSelectedAssignmentId('');
    }
  };

  // Handle Section Dropdown Change (Binds exact faculty_assignment_id)
  const handleSectionChange = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
  };

  // Open Create Assessment Modal
  const handleOpenCreateModal = () => {
    setCreateStep('config');
    setGenerationError(null);
    setQuestionCount(10);
    setDuration(20);
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

    if (assignedClasses.length > 0) {
      const first = assignedClasses[0];
      const branchCode = (first.departmentCode || 'CSE').toUpperCase().trim();
      setSelectedBranch(branchCode);
      setSelectedSubjectKey(first.subjectCode || first.subjectId || first.code);
      setSelectedAssignmentId(first.assignmentId || first.id);
      setTitle(`${first.name || 'Subject'} — Unit 1 Important Concepts Quiz`);
    } else {
      setTitle('');
    }

    setShowCreateModal(true);
  };

  // Step 1 -> Step 2: Generate Questions via RAG Pipeline
  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    if (!activeAssignment) {
      setGenerationError('Please select a valid branch, subject, and section from your assignments.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const selectedRes = availableResources.find(r => r.id === selectedResourceId) || availableResources[0];
      const resName = selectedRes?.title || selectedRes?.fileName || `${activeAssignment.name} Module Notes.pdf`;
      setSelectedResourceName(resName);

      const genRes = await assessmentService.generateMCQs({
        resourceId: selectedResourceId || selectedRes?.id,
        resourceTitle: resName,
        subjectName: activeAssignment.name,
        subjectCode: activeAssignment.code,
        questionCount: Number(questionCount)
      });

      if (genRes.success && genRes.questions) {
        setQuestionsList(genRes.questions);
        setCreateStep('review');
      } else {
        throw new Error('Could not synthesize MCQs from the selected resource.');
      }
    } catch (err) {
      console.error('[FacultyAssessments] Generation error:', err);
      setGenerationError(err.message || 'Error generating questions from resource.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Review Actions
  const handleUpdateQuestion = (idx, field, value) => {
    setQuestionsList(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleDeleteQuestion = (idx) => {
    if (questionsList.length <= 1) {
      alert('An assessment must have at least one question.');
      return;
    }
    setQuestionsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddBlankQuestion = () => {
    const newQ = {
      id: `man_q_${Date.now()}_${questionsList.length + 1}`,
      question: 'New Question: Enter problem statement here...',
      optionA: 'Option A statement',
      optionB: 'Option B statement',
      optionC: 'Option C statement',
      optionD: 'Option D statement',
      correctAnswer: 'A',
      explanation: 'Explanation for why Option A is correct.'
    };
    setQuestionsList(prev => [...prev, newQ]);
    setEditingQuestionIdx(questionsList.length);
  };

  // Final Publish Action (Uses faculty_assignment_id as single source of truth)
  const handlePublishAssessment = async () => {
    if (!activeAssignment) return;
    try {
      await assessmentService.createAssessment({
        title: title || `${activeAssignment.name} Continuous Assessment`,
        facultyAssignmentId: activeAssignment.assignmentId || activeAssignment.id,
        subjectId: activeAssignment.subjectId,
        subjectCode: activeAssignment.code,
        subjectName: activeAssignment.name,
        section: activeAssignment.section,
        year: activeAssignment.year,
        semester: activeAssignment.semester,
        regulation: activeAssignment.regulation || 'AR23',
        academicYear: activeAssignment.academicYear || '2025-2026',
        departmentId: activeAssignment.departmentId,
        departmentCode: activeAssignment.departmentCode || selectedBranch,
        resourceId: selectedResourceId || availableResources[0]?.id,
        sourceResourceName: selectedResourceName,
        duration: Number(duration),
        dueDate: dueDate,
        status: 'published'
      }, questionsList, currentUser);

      setShowCreateModal(false);
      await loadData();
      alert(`Assessment "${title}" published successfully! Students in Section ${activeAssignment.section} (${activeAssignment.departmentCode || selectedBranch}) can now attempt it.`);
    } catch (err) {
      alert(`Failed to publish assessment: ${err.message}`);
    }
  };

  // Form Validation State
  const isFormValid = Boolean(
    title.trim() &&
    selectedBranch &&
    selectedSubjectKey &&
    selectedAssignmentId &&
    activeAssignment &&
    (selectedResourceId || (availableResources && availableResources.length > 0)) &&
    Number(questionCount) > 0 &&
    Number(duration) > 0 &&
    dueDate
  );

  // Delete Assessment
  const handleDeleteAssessment = async (id, asmtTitle) => {
    if (confirm(`Delete assessment "${asmtTitle}"? This cannot be undone.`)) {
      try {
        await assessmentService.deleteAssessment(id, currentUser);
        const remaining = assessments.filter(a => a.id !== id);
        setAssessments(remaining);
      } catch (err) {
        alert(`Error deleting assessment: ${err.message}`);
      }
    }
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
            Generate RAG-grounded MCQs from course notes, schedule evaluations, and review student grading
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={15} />
          <span>+ Create Assessment</span>
        </button>
      </div>

      {/* Assessments List or Empty State */}
      {assessments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Award}
            title="No Assessments Created Yet"
            message="You haven't scheduled any continuous internal assessments or quizzes yet. Click '+ Create Assessment' to generate an MCQ quiz from your assigned course resources."
            actionText="Create Assessment"
            onAction={handleOpenCreateModal}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {assessments.map((a) => (
            <div key={a.id} className="card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">{a.subjectName || a.subject} ({a.subjectCode || 'SUB'})</span>
                    <span className="badge badge-orange">{a.departmentCode || 'CSE'}</span>
                    <span className="badge badge-purple">Section {a.section}</span>
                    <span className={`badge ${a.status === 'published' ? 'badge-green' : 'badge-orange'}`}>
                      {a.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="badge badge-gray">Due: {a.dueDate || 'Flexible'}</span>
                    {a.sourceResourceName && (
                      <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={11} /> {a.sourceResourceName}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '6px' }}>
                    {a.title}
                  </h3>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.85, flexWrap: 'wrap' }}>
                    <span>Questions: <strong>{a.questionCount || (a.questions?.length || 10)} MCQs</strong></span>
                    <span>Duration: <strong>{a.duration || 20} Mins</strong></span>
                    <span>Students: <strong>{a.studentsCount || a.assignedCount || a.totalStudents || 0}</strong></span>
                    <span>Attempted: <strong>{a.submittedCount || a.attemptedCount || 0} / {a.studentsCount || a.assignedCount || a.totalStudents || 0}</strong></span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      Avg Score: {a.averageScore || '0%'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleOpenAnalytics(a)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 600 }}
                  >
                    <BarChart2 size={14} />
                    <span>View Analytics</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment(a.id, a.title)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#ef4444', padding: '6px 10px' }}
                    title="Delete Assessment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL (4 Sections Layout + Cascading Branch->Subject->Section) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !isGenerating && setShowCreateModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: createStep === 'review' ? '860px' : '680px', width: '95%' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '18px 24px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--color-primary)" />
                  {createStep === 'config' ? 'Create New Assessment' : 'Review & Finalize MCQs'}
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text)', opacity: 0.75, marginTop: '2px' }}>
                  {createStep === 'config' 
                    ? 'Generate an AI-powered MCQ assessment from your course resources.' 
                    : `Review and refine ${questionsList.length} generated questions before publishing`}
                </p>
              </div>
              <button 
                onClick={() => !isGenerating && setShowCreateModal(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* STEP 1: CONFIGURATION FORM (4 SECTIONS) */}
            {createStep === 'config' && (
              <form onSubmit={handleGenerateQuestions}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxHeight: '74vh', overflowY: 'auto', padding: '20px 24px' }}>
                  {generationError && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca', color: '#991b1b', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} />
                      <span>{generationError}</span>
                    </div>
                  )}

                  {/* SECTION 1 — BASIC INFORMATION */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      SECTION 1 — BASIC INFORMATION
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                        Assessment Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cloud Computing & DevOps — Unit 1 Important Concepts"
                        className="input-field"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ fontSize: '13px', height: '40px' }}
                      />
                    </div>
                  </div>

                  {/* SECTION 2 — TARGET CLASS (Cascading: Branch -> Subject -> Section) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                      SECTION 2 — TARGET CLASS
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1.1fr', gap: '12px' }}>
                      {/* Branch Dropdown */}
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          Branch *
                        </label>
                        <select
                          className="input-field"
                          value={selectedBranch}
                          onChange={(e) => handleBranchChange(e.target.value)}
                          required
                          style={{ fontSize: '13px', height: '40px' }}
                        >
                          {availableBranches.length === 0 ? (
                            <option value="" disabled>Select Branch</option>
                          ) : (
                            availableBranches.map(b => (
                              <option key={b.code} value={b.code}>
                                {b.code}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Subject Dropdown */}
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          Subject / Course *
                        </label>
                        <select
                          className="input-field"
                          value={selectedSubjectKey}
                          onChange={(e) => handleSubjectChange(e.target.value)}
                          required
                          disabled={availableSubjects.length === 0}
                          style={{ fontSize: '13px', height: '40px' }}
                        >
                          {availableSubjects.length === 0 ? (
                            <option value="" disabled>No subjects found for {selectedBranch || 'branch'}</option>
                          ) : (
                            availableSubjects.map(s => (
                              <option key={s.key} value={s.key}>
                                {s.name} ({s.code} • {s.departmentCode})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Section Dropdown */}
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          Section *
                        </label>
                        <select
                          className="input-field"
                          value={selectedAssignmentId}
                          onChange={(e) => handleSectionChange(e.target.value)}
                          required
                          disabled={availableSections.length === 0}
                          style={{ fontSize: '13px', height: '40px' }}
                        >
                          {availableSections.length === 0 ? (
                            <option value="" disabled>No section</option>
                          ) : (
                            availableSections.map(sec => (
                              <option key={sec.assignmentId || sec.id} value={sec.assignmentId || sec.id}>
                                Section {sec.section}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Visually Structured Class Details Card */}
                    {activeAssignment && (
                      <div style={{
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 18px',
                        fontSize: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.8px',
                          color: 'var(--color-text)',
                          opacity: 0.7,
                          marginBottom: '12px',
                          borderBottom: '1px dashed var(--color-border)',
                          paddingBottom: '6px'
                        }}>
                          CLASS DETAILS
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                          <div>
                            <span style={{ color: 'var(--color-text)', opacity: 0.65, display: 'block', fontSize: '11px', marginBottom: '2px' }}>Branch</span>
                            <strong style={{ color: 'var(--color-text)', fontSize: '13px' }}>
                              {activeAssignment.departmentCode || selectedBranch || 'CSE'}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text)', opacity: 0.65, display: 'block', fontSize: '11px', marginBottom: '2px' }}>Subject</span>
                            <strong style={{ color: 'var(--color-text)', fontSize: '13px' }}>
                              {activeAssignment.name || activeAssignment.subjectName}
                            </strong>
                          </div>

                          <div>
                            <span style={{ color: 'var(--color-text)', opacity: 0.65, display: 'block', fontSize: '11px', marginBottom: '2px' }}>Course Code</span>
                            <strong style={{ color: 'var(--color-text)', fontSize: '13px' }}>
                              {activeAssignment.code || activeAssignment.subjectCode}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text)', opacity: 0.65, display: 'block', fontSize: '11px', marginBottom: '2px' }}>Section</span>
                            <strong style={{ color: 'var(--color-primary)', fontSize: '13px' }}>
                              Section {activeAssignment.section}
                            </strong>
                          </div>

                          <div>
                            <span style={{ color: 'var(--color-text)', opacity: 0.65, display: 'block', fontSize: '11px', marginBottom: '2px' }}>Year / Semester</span>
                            <strong style={{ color: 'var(--color-text)', fontSize: '13px' }}>
                              {activeAssignment.year}{activeAssignment.year === 1 ? 'st' : activeAssignment.year === 2 ? 'nd' : activeAssignment.year === 3 ? 'rd' : 'th'} Year / Sem {activeAssignment.semester}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text)', opacity: 0.65, display: 'block', fontSize: '11px', marginBottom: '2px' }}>Regulation</span>
                            <strong style={{ color: 'var(--color-text)', fontSize: '13px' }}>
                              {activeAssignment.regulation || 'AR23'}
                            </strong>
                          </div>
                        </div>

                        {/* Automatic Student Count Banner */}
                        <div style={{
                          marginTop: '14px',
                          padding: '10px 14px',
                          backgroundColor: 'rgba(198, 93, 46, 0.07)',
                          border: '1px solid rgba(198, 93, 46, 0.18)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <UserCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary)', display: 'block' }}>
                              👥 {mappedStudentCount} Students
                            </span>
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text)', opacity: 0.8 }}>
                              Automatically mapped to this section
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3 — SOURCE MATERIAL */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                      SECTION 3 — SOURCE MATERIAL
                    </div>

                    {/* Resource Selection */}
                    <div className="input-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>
                          Resource / Notes *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowUploadModal(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <UploadCloud size={13} />
                          <span>+ Upload New Resource</span>
                        </button>
                      </div>
                      <select
                        className="input-field"
                        value={selectedResourceId}
                        onChange={(e) => setSelectedResourceId(e.target.value)}
                        style={{ fontSize: '13px', height: '40px' }}
                      >
                        {availableResources.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.title || r.fileName || 'Course Material.pdf'}
                          </option>
                        ))}
                      </select>

                      {/* Small AI Generation Indicator */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '9px 12px',
                        backgroundColor: 'rgba(198, 93, 46, 0.06)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(198, 93, 46, 0.15)',
                        fontSize: '11.5px',
                        color: 'var(--color-text)',
                        marginTop: '8px'
                      }}>
                        <Sparkles size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: 'var(--color-primary)', display: 'block', fontSize: '11.5px', fontWeight: 700 }}>
                            ✨ AI-powered generation
                          </strong>
                          <span style={{ opacity: 0.85 }}>
                            Questions will be generated from the selected resource using the academic RAG system.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row: Number of Questions, Duration, Due Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          Questions *
                        </label>
                        <select
                          className="input-field"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(e.target.value)}
                          style={{ fontSize: '13px', height: '40px' }}
                        >
                          <option value={5}>5 MCQs</option>
                          <option value={10}>10 MCQs</option>
                          <option value={15}>15 MCQs</option>
                          <option value={20}>20 MCQs</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          Duration *
                        </label>
                        <select
                          className="input-field"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          style={{ fontSize: '13px', height: '40px' }}
                        >
                          <option value={15}>15 Minutes</option>
                          <option value={20}>20 Minutes</option>
                          <option value={30}>30 Minutes</option>
                          <option value={45}>45 Minutes</option>
                          <option value={60}>60 Minutes</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          Due Date *
                        </label>
                        <input
                          type="date"
                          required
                          className="input-field"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          style={{ fontSize: '13px', height: '40px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4 — GENERATION (FOOTER ACTIONS) */}
                <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!isFormValid || isGenerating}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      opacity: (!isFormValid || isGenerating) ? 0.6 : 1,
                      cursor: (!isFormValid || isGenerating) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={14} className="spin-slow" />
                        <span>Generating Questions via RAG...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>✨ Generate Important Questions</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: REVIEW & EDIT GENERATED MCQS */}
            {createStep === 'review' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.8 }}>
                        Target Class: <strong>{activeAssignment?.name}</strong> • <strong>Section {activeAssignment?.section}</strong>
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.6, display: 'block' }}>
                        Source: {selectedResourceName} ({questionsList.length} Questions)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBlankQuestion}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      <Plus size={13} />
                      <span>+ Add Question</span>
                    </button>
                  </div>

                  {/* Question Cards */}
                  {questionsList.map((q, idx) => (
                    <div 
                      key={q.id || idx} 
                      style={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary)' }}>
                          Question {idx + 1}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingQuestionIdx(editingQuestionIdx === idx ? null : idx)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            <Edit3 size={12} />
                            <span>{editingQuestionIdx === idx ? 'Collapse' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(idx)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px', color: '#ef4444' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      {editingQuestionIdx === idx ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <textarea
                            className="input-field"
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(idx, 'question', e.target.value)}
                            rows={2}
                            style={{ fontSize: '12.5px' }}
                          />

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '12px', minWidth: '20px' }}>{opt}:</span>
                                <input
                                  type="text"
                                  className="input-field"
                                  value={q[`option${opt}`]}
                                  onChange={(e) => handleUpdateQuestion(idx, `option${opt}`, e.target.value)}
                                  style={{ fontSize: '12px', height: '32px' }}
                                />
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700 }}>Correct Answer:</label>
                            <select
                              className="input-field"
                              value={q.correctAnswer}
                              onChange={(e) => handleUpdateQuestion(idx, 'correctAnswer', e.target.value)}
                              style={{ width: '80px', height: '32px', fontSize: '12px' }}
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '11.5px', fontWeight: 600, opacity: 0.8 }}>Explanation:</label>
                            <input
                              type="text"
                              className="input-field"
                              value={q.explanation}
                              onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                              style={{ fontSize: '12px', height: '32px' }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px' }}>
                            {q.question}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginBottom: '8px' }}>
                            {['A', 'B', 'C', 'D'].map(opt => {
                              const isCorrect = q.correctAnswer === opt;
                              return (
                                <div 
                                  key={opt}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg)',
                                    border: isCorrect ? '1px solid #10b981' : '1px solid var(--color-border)',
                                    color: isCorrect ? '#065f46' : 'var(--color-text)',
                                    fontWeight: isCorrect ? 700 : 400
                                  }}
                                >
                                  <strong>{opt}.</strong> {q[`option${opt}`]}
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', opacity: 0.75 }}>
                            <span>Correct Answer: <strong style={{ color: '#059669' }}>Option {q.correctAnswer}</strong></span>
                            {q.explanation && <span>{q.explanation}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Review Footer */}
                <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCreateStep('config')}
                  >
                    ← Back to Settings
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handlePublishAssessment}
                      style={{ fontWeight: 800, padding: '6px 18px' }}
                    >
                      <CheckCircle size={14} />
                      <span>Publish Assignment</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMISSIONS & ANALYTICS MODAL */}
      {showAnalyticsModal && (
        <div className="modal-overlay" onClick={() => setShowAnalyticsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '95%' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
                  {showAnalyticsModal.title} — Performance Analytics
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.7, marginTop: '2px' }}>
                  {showAnalyticsModal.subjectName || showAnalyticsModal.subject} • Section {showAnalyticsModal.section}
                </p>
              </div>
              <button onClick={() => setShowAnalyticsModal(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>ASSIGNED</span>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
                    {showAnalyticsModal.studentsCount || showAnalyticsModal.assignedCount || 0} Students
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>ATTEMPTED</span>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                    {showAnalyticsModal.submittedCount || showAnalyticsModal.attemptedCount || showAnalyticsModal.attempts?.length || 0}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>NOT ATTEMPTED</span>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', opacity: 0.8, marginTop: '2px' }}>
                    {Math.max(0, (showAnalyticsModal.studentsCount || showAnalyticsModal.assignedCount || 0) - (showAnalyticsModal.submittedCount || showAnalyticsModal.attemptedCount || showAnalyticsModal.attempts?.length || 0))}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text)', opacity: 0.7 }}>AVERAGE SCORE</span>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {showAnalyticsModal.averageScore || '0%'}
                  </p>
                </div>
              </div>

              {/* Individual Student Submissions Table */}
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '10px' }}>
                Student Assessment Attempts
              </h4>

              {(!showAnalyticsModal.attempts || showAnalyticsModal.attempts.length === 0) ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <EmptyState
                    icon={Clock}
                    title="No Submissions Yet"
                    message="Students in Section A are currently scheduled to attempt this assessment."
                  />
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Status</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showAnalyticsModal.attempts.map((att) => (
                        <tr key={att.id || att.attemptId}>
                          <td style={{ fontWeight: 700 }}>{att.studentName}</td>
                          <td>{att.rollNumber || '23CS001'}</td>
                          <td>
                            <strong>{att.score}</strong> / {att.totalQuestions}
                          </td>
                          <td>
                            <span className={`badge ${att.percentage >= 50 ? 'badge-green' : 'badge-orange'}`}>
                              {att.percentage}%
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-green">Completed</span>
                          </td>
                          <td style={{ fontSize: '12px', opacity: 0.75 }}>
                            {att.submittedAt ? new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAnalyticsModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAG Document Upload Modal Integration */}
      <RagUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={async () => {
          setShowUploadModal(false);
          await loadData();
        }}
      />
    </div>
  );
}
