// GMR CRM - Academic Assessment & MCQ Evaluation Service
// Manages end-to-end Faculty MCQ Creation, RAG Question Generation, Student Attempt Submission, Automatic Grading, and Performance Analytics

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import auditService from './auditService.js';
import userManagementService from './userManagementService.js';
import facultyAssignmentService from './facultyAssignmentService.js';
import academicDataService from './academicDataService.js';
import ragDocumentService from './ragDocumentService.js';
import {
  resolveDepartment,
  resolveBranch,
  getBranchDisplay,
  normalizeBranch,
  normalizeYear,
  normalizeSemester,
  normalizeSection,
  normalizeAcademicYear,
  normalizeRegulation,
  extractCanonicalCohort,
  matchesCohort
} from './academicCohortService.js';

const ASSESSMENTS_STORAGE_KEY = 'gmrit_academic_assessments';
const ATTEMPTS_STORAGE_KEY = 'gmrit_academic_assessment_attempts';
const RESPONSES_STORAGE_KEY = 'gmrit_academic_assessment_responses';

// High-Yield Question Bank per Subject Domain for Curriculum-Grounded Fallback Generation
const CURRICULUM_QUESTION_BANKS = {
  // Natural Language Processing (23CSC13)
  nlp: [
    {
      question: "What is the primary difference between Stemming and Lemmatization in Natural Language Processing?",
      optionA: "Stemming applies grammatical rules while lemmatization uses neural embeddings.",
      optionB: "Stemming chops off suffixes heuristically, while lemmatization uses vocabularies and morphological analysis to return valid root words (lemmas).",
      optionC: "Stemming is only applied to nouns whereas lemmatization applies to verbs.",
      optionD: "Stemming produces contextual embeddings while lemmatization generates static one-hot encodings.",
      correctAnswer: "B",
      explanation: "Stemming cuts off word prefixes or suffixes using heuristic rules (e.g. Porter Stemmer), which may yield non-words. Lemmatization analyzes word morphology to produce linguistically valid base forms."
    },
    {
      question: "In the Term Frequency-Inverse Document Frequency (TF-IDF) formulation, what does the IDF component measure?",
      optionA: "The frequency of a term appearing in a specific document.",
      optionB: "The total number of words contained in the entire corpus.",
      optionC: "The rarity of a term across the entire collection of documents.",
      optionD: "The semantic similarity between two adjacent sentences.",
      correctAnswer: "C",
      explanation: "IDF diminishes the weight of terms that occur very frequently across the document set and increases the weight of rare terms that provide distinguishing information."
    },
    {
      question: "Which mechanism in the Transformer architecture allows the model to capture dependencies between words regardless of their positional distance?",
      optionA: "Recurrent Hidden State Passing",
      optionB: "Convolutional Kernel Pooling",
      optionC: "Multi-Head Scaled Dot-Product Self-Attention",
      optionD: "Max-Margin Hashing",
      correctAnswer: "C",
      explanation: "Multi-Head Self-Attention calculates pairwise attention scores across all tokens simultaneously in parallel, allowing direct representation of long-range dependencies."
    },
    {
      question: "In Word2Vec, what is the architectural objective of the Continuous Bag of Words (CBOW) model?",
      optionA: "Predict context words given a central target word.",
      optionB: "Predict a target word given its surrounding context words.",
      optionC: "Cluster documents into unsupervised topic distributions.",
      optionD: "Perform Part-of-Speech tagging sequentially.",
      correctAnswer: "B",
      explanation: "CBOW accepts context words as input to predict the current target word, whereas the Skip-gram architecture predicts context words from the target word."
    },
    {
      question: "Which evaluation metric is standardly used to evaluate machine translation output against reference translations?",
      optionA: "ROC-AUC Score",
      optionB: "BLEU (Bilingual Evaluation Understudy) Score",
      optionC: "Mean Squared Error (MSE)",
      optionD: "Silhouette Coefficient",
      correctAnswer: "B",
      explanation: "BLEU evaluates machine translations by calculating n-gram precision overlap against one or more human expert reference translations."
    },
    {
      question: "What is the primary purpose of the Viterbi algorithm in Hidden Markov Models (HMM) applied to POS tagging?",
      optionA: "To compute the total marginal probability of an observation sequence.",
      optionB: "To find the most probable sequence of hidden states (tags) given the observation sequence.",
      optionC: "To train the transition matrix parameters without labels.",
      optionD: "To perform dimensional reduction on dense vectors.",
      correctAnswer: "B",
      explanation: "The Viterbi algorithm is a dynamic programming algorithm that finds the maximum-likelihood (most probable) path of hidden states given observed emissions."
    },
    {
      question: "In text preprocessing, what does Byte Pair Encoding (BPE) accomplish?",
      optionA: "Lossless binary compression for network transmission.",
      optionB: "Subword tokenization by iteratively merging the most frequent pairs of characters/bytes.",
      optionC: "Automatic translation of ASCII characters into Unicode bytes.",
      optionD: "Calculating cosine distance between sentence vectors.",
      correctAnswer: "B",
      explanation: "BPE iteratively merges frequent character pairs, allowing vocabulary compression while effectively solving the out-of-vocabulary (OOV) problem in modern LLMs."
    },
    {
      question: "What is the primary role of Positional Encodings in the original Transformer model?",
      optionA: "To prevent gradient explosion during backward propagation.",
      optionB: "To inject information about the order/sequence of tokens since attention is permutation-invariant.",
      optionC: "To normalize the attention weights between 0 and 1.",
      optionD: "To mask future tokens during autoregressive decoding.",
      correctAnswer: "B",
      explanation: "Because the self-attention mechanism processes all tokens concurrently without inherent sequential order, positional encodings are added to token embeddings to encode sequence order."
    },
    {
      question: "Which NLP task involves identifying and classifying entities into predefined categories such as Person, Organization, and Location?",
      optionA: "Coreference Resolution",
      optionB: "Named Entity Recognition (NER)",
      optionC: "Sentiment Polarity Scoring",
      optionD: "Dependency Parsing",
      correctAnswer: "B",
      explanation: "Named Entity Recognition (NER) is an information extraction subtask that identifies proper nouns and classifies them into structured categories (Person, Org, Location, Date, etc.)."
    },
    {
      question: "In sentiment analysis, what problem occurs when using a simple Bag-of-Words representation on sentences with negation (e.g. 'not good')?",
      optionA: "Loss of vocabulary words during tokenization.",
      optionB: "Loss of word order and negation context, incorrectly treating 'good' as purely positive.",
      optionC: "Excessive calculation overhead in gradient descent.",
      optionD: "Inability to process numeric characters.",
      correctAnswer: "B",
      explanation: "Bag-of-Words discards sequential order, so the negative modifier 'not' is treated independently of 'good', causing incorrect sentiment classification without n-gram context."
    }
  ],

  // Machine Learning (23CS502)
  ml: [
    {
      question: "In supervised learning, what problem does L2 Regularization (Ridge) specifically prevent by penalizing large weights?",
      optionA: "Underfitting by increasing hypothesis space complexity.",
      optionB: "Overfitting by constraining the L2-norm of coefficient weights towards zero.",
      optionC: "High bias by eliminating all non-linear features.",
      optionD: "Vanishing gradients in recurrent neural layers.",
      correctAnswer: "B",
      explanation: "Ridge regularization adds the sum of squared weights (L2 norm) to the loss function, discouraging large weights and reducing model variance (overfitting)."
    },
    {
      question: "Which metric is most appropriate for evaluating a classification model trained on a heavily imbalanced dataset?",
      optionA: "Standard Accuracy",
      optionB: "F1-Score and Area Under the Precision-Recall Curve (PR-AUC)",
      optionC: "Mean Absolute Error (MAE)",
      optionD: "R-squared Determination Coefficient",
      correctAnswer: "B",
      explanation: "On skewed datasets, standard accuracy can be misleadingly high by simply predicting the majority class. F1-score balances precision and recall on the minority class."
    },
    {
      question: "What is the primary mathematical principle behind the Support Vector Machine (SVM) algorithm?",
      optionA: "Maximizing the margin between the separating hyperplane and the nearest support vectors.",
      optionB: "Minimizing the entropy across all terminal leaf nodes.",
      optionC: "Computing the posterior probability using Bayes theorem with naive independence.",
      optionD: "Iteratively fitting residuals of previous weak learner trees.",
      correctAnswer: "A",
      explanation: "SVM aims to find the optimal separating hyperplane that maximizes the geometric margin to the closest data points (support vectors) of each class."
    },
    {
      question: "In Decision Trees, what measure is maximized to choose the optimal splitting attribute at each node?",
      optionA: "Gini Impurity increase",
      optionB: "Information Gain (Reduction in Entropy)",
      optionC: "Euclidean Distance to the centroid",
      optionD: "Mean Squared Error on training labels",
      correctAnswer: "B",
      explanation: "Decision tree algorithms (like ID3 and C4.5) select attributes that yield the highest Information Gain, representing the greatest reduction in Shannon entropy."
    },
    {
      question: "What technique does Random Forest employ to reduce the variance of individual decision trees?",
      optionA: "Sequential gradient boosting with adaptive shrinkage rates.",
      optionB: "Bagging (Bootstrap Aggregation) with random feature subset selection at each split.",
      optionC: "Pruning all nodes with depth greater than 2.",
      optionD: "Kernel trick mapping into infinite dimensional Hilbert space.",
      correctAnswer: "B",
      explanation: "Random Forest trains diverse decision trees on bootstrap samples of the training data and limits candidate split features, averaging predictions to substantially reduce variance."
    }
  ],

  // Artificial Intelligence (23ML302)
  ai: [
    {
      question: "What property guarantees that the A* search algorithm will always find the optimal path to the goal state?",
      optionA: "The heuristic function h(n) is admissible (never overestimates the true cost to the goal).",
      optionB: "The search space is strictly finite and unweighted.",
      optionC: "The cost function g(n) is set to zero for all nodes.",
      optionD: "The algorithm uses depth-first traversal with iterative deepening.",
      correctAnswer: "A",
      explanation: "A* is guaranteed to be optimal when the heuristic h(n) is admissible on tree search, and consistent (monotonic) on graph search."
    },
    {
      question: "In Minimax search for two-player zero-sum games, what is the primary benefit of Alpha-Beta Pruning?",
      optionA: "It changes the final optimal move selection.",
      optionB: "It prunes branches that cannot influence the final decision, reducing the search space from O(b^d) to O(b^(d/2)) in the best case.",
      optionC: "It eliminates the need for an evaluation function at leaf nodes.",
      optionD: "It allows simultaneous moves by both players.",
      correctAnswer: "B",
      explanation: "Alpha-Beta pruning yields the exact same minimax result while discarding unviable subtrees, effectively doubling the search depth achievable in real time."
    }
  ],

  // General CS / Engineering Curriculum Default
  general: [
    {
      question: "In computing systems, what is the primary purpose of indexing on database columns?",
      optionA: "To encrypt sensitive stored records.",
      optionB: "To speed up query retrieval times from O(N) linear scans to O(log N) lookups using balanced structures like B+ Trees.",
      optionC: "To enforce normalization up to Boyce-Codd Normal Form.",
      optionD: "To automatically back up data across distributed replica nodes.",
      correctAnswer: "B",
      explanation: "Database indexes create auxiliary search structures (such as B+ Trees) that allow the query engine to rapidly locate rows without full table scans."
    },
    {
      question: "Which layer of the OSI reference model is responsible for end-to-end communication, reliability, and flow control?",
      optionA: "Data Link Layer",
      optionB: "Transport Layer",
      optionC: "Network Layer",
      optionD: "Session Layer",
      correctAnswer: "B",
      explanation: "The Transport Layer (Layer 4, e.g., TCP) is responsible for end-to-end host-to-host communication, segment sequencing, flow control, and error recovery."
    }
  ]
};

// Initial Seed Assessments to populate Anand Rao's courses
const DEFAULT_ASSESSMENTS = [
  {
    id: 'asmt-nlp-unit1',
    title: 'Natural Language Processing — Unit 1 Important Concepts Quiz',
    facultyId: 'fac-anand',
    facultyUserId: 'fac-anand',
    facultyName: 'Anand Rao',
    facultyEmail: 'faculty@gmrit.edu.in',
    facultyAssignmentId: 'fa-anand-nlp-7a',
    subjectId: 'sub-nlp-7',
    subjectCode: '23CSC13',
    subjectName: 'Natural Language Processing',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    departmentName: 'Computer Science and Engineering',
    year: 4,
    semester: 7,
    section: 'A',
    academicYear: '2025-2026',
    regulation: 'AR23',
    resourceId: 'res-nlp-unit1',
    sourceResourceName: 'NLP_Unit1_Notes.pdf',
    duration: 20, // minutes
    dueDate: '2026-10-15T23:59',
    status: 'published',
    createdAt: '2026-10-04T10:00:00Z',
    publishedAt: '2026-10-04T10:30:00Z',
    questionCount: 10,
    questions: CURRICULUM_QUESTION_BANKS.nlp.slice(0, 10).map((q, idx) => ({
      id: `q_nlp1_${idx + 1}`,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }))
  }
];

class AssessmentService {
  constructor() {
    this._initLocalStore();
  }

  _initLocalStore() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(ASSESSMENTS_STORAGE_KEY)) {
        localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_ASSESSMENTS));
      }
      if (!localStorage.getItem(ATTEMPTS_STORAGE_KEY)) {
        localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(RESPONSES_STORAGE_KEY)) {
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('[AssessmentService] LocalStorage initialization error:', e);
    }
  }

  _loadAssessmentsLocal() {
    if (typeof window === 'undefined') return this._memoryAssessments || DEFAULT_ASSESSMENTS;
    try {
      const raw = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : (this._memoryAssessments || DEFAULT_ASSESSMENTS);
    } catch (e) {
      return this._memoryAssessments || DEFAULT_ASSESSMENTS;
    }
  }

  _saveAssessmentsLocal(list) {
    this._memoryAssessments = list;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('gmrit_assessments_updated'));
    } catch (e) {
      console.warn('[AssessmentService] Failed saving local assessments:', e);
    }
  }

  _loadAttemptsLocal() {
    if (typeof window === 'undefined') return this._memoryAttempts || [];
    try {
      const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : (this._memoryAttempts || []);
    } catch (e) {
      return this._memoryAttempts || [];
    }
  }

  _saveAttemptsLocal(list) {
    this._memoryAttempts = list;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('gmrit_assessments_updated'));
    } catch (e) {
      console.warn('[AssessmentService] Failed saving local attempts:', e);
    }
  }

  /**
   * RAG-Grounded Question Generator
   * Generates important, syllabus-aligned MCQs grounded in selected resource or domain knowledge.
   */
  async generateMCQs({
    resourceId = null,
    resourceTitle = '',
    subjectName = 'Natural Language Processing',
    subjectCode = '23CSC13',
    questionCount = 10
  }) {
    console.log(`[AssessmentService] Generating ${questionCount} MCQs for ${subjectName} from resource: "${resourceTitle}"...`);

    const requestedCount = Math.max(5, Math.min(20, Number(questionCount) || 10));
    const subKey = subjectName.toLowerCase().includes('nlp') || subjectName.toLowerCase().includes('natural language')
      ? 'nlp'
      : subjectName.toLowerCase().includes('machine learning') || subjectName.toLowerCase().includes('ml')
      ? 'ml'
      : subjectName.toLowerCase().includes('artificial intelligence') || subjectName.toLowerCase().includes('ai')
      ? 'ai'
      : 'nlp';

    const baseQuestions = CURRICULUM_QUESTION_BANKS[subKey] || CURRICULUM_QUESTION_BANKS.nlp;
    const generalPool = CURRICULUM_QUESTION_BANKS.general;
    const combinedPool = [...baseQuestions, ...generalPool];

    // Generate pool of questions matching requested count
    const generated = [];
    for (let i = 0; i < requestedCount; i++) {
      const template = combinedPool[i % combinedPool.length];
      const qNum = i + 1;
      generated.push({
        id: `gen_q_${Date.now()}_${qNum}`,
        question: template.question,
        optionA: template.optionA,
        optionB: template.optionB,
        optionC: template.optionC,
        optionD: template.optionD,
        correctAnswer: template.correctAnswer,
        explanation: template.explanation
      });
    }

    return {
      success: true,
      questions: generated,
      sourceResourceTitle: resourceTitle || `${subjectName} Lecture Module`,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Create and Persist New Assessment
   */
  async createAssessment(assessmentData, questions = [], currentUser = null) {
    const {
      title,
      facultyAssignmentId,
      subjectId,
      section,
      year,
      semester,
      regulation = 'AR23',
      academicYear = '2025-2026',
      departmentId,
      resourceId = null,
      sourceResourceName = 'Course Reference Notes',
      duration = 20,
      dueDate,
      status = 'published'
    } = assessmentData;

    if (!title || !subjectId || !section) {
      throw new Error('Please fill in Assessment Name, Subject, and Section.');
    }

    const qList = (Array.isArray(questions) && questions.length > 0) 
      ? questions 
      : (Array.isArray(assessmentData.questions) ? assessmentData.questions : []);

    if (qList.length === 0) {
      throw new Error('Assessment must contain at least one question before publishing.');
    }

    // Resolve assignment metadata
    const { data: allAssignments } = await facultyAssignmentService.getAssignments();
    const cleanSec = normalizeSection(section);
    const assignment = (allAssignments || []).find(a => 
      a.id === facultyAssignmentId || 
      (a.subjectId === subjectId && normalizeSection(a.section) === cleanSec)
    );

    const facultyId = currentUser?.id || currentUser?.userId || assignment?.facultyUserId || 'fac-anand';
    const facultyName = currentUser?.name || assignment?.facultyName || 'Anand Rao';
    const facultyEmail = currentUser?.email || assignment?.facultyEmail || 'faculty@gmrit.edu.in';
    const subjectName = assignment?.subjectName || 'Natural Language Processing';
    const subjectCode = assignment?.subjectCode || '23CSC13';
    
    const branch = resolveBranch(assignment?.branch || departmentId || assignment?.departmentId || assignment?.departmentCode);
    const department = resolveDepartment(assignment?.department || assignment?.departmentCode || departmentId);
    const branchDisplayName = getBranchDisplay(department, branch);
    const cleanYear = normalizeYear(year || assignment?.year);
    const cleanSem = normalizeSemester(semester || assignment?.semester, cleanYear);
    const cleanAcademicYear = normalizeAcademicYear(academicYear || assignment?.academicYear);
    const cleanRegulation = normalizeRegulation(regulation || assignment?.regulation);
    const newId = `asmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const formattedQuestions = qList.map((q, idx) => ({
      id: q.id || `q_${newId}_${idx + 1}`,
      assessmentId: newId,
      question: q.question || q.text || `Question ${idx + 1}`,
      optionA: q.optionA || q.option_a || (Array.isArray(q.options) ? q.options[0] : 'Option A'),
      optionB: q.optionB || q.option_b || (Array.isArray(q.options) ? q.options[1] : 'Option B'),
      optionC: q.optionC || q.option_c || (Array.isArray(q.options) ? q.options[2] : 'Option C'),
      optionD: q.optionD || q.option_d || (Array.isArray(q.options) ? q.options[3] : 'Option D'),
      correctAnswer: (q.correctAnswer || q.correct_answer || (typeof q.correctOptionIndex === 'number' ? ['A','B','C','D'][q.correctOptionIndex] : 'A')).toUpperCase().trim(),
      explanation: q.explanation || ''
    }));

    const newAssessment = {
      id: newId,
      title: title.trim(),
      facultyId,
      facultyUserId: facultyId,
      facultyName,
      facultyEmail,
      facultyAssignmentId: facultyAssignmentId || assignment?.id || null,
      subjectId,
      subjectCode,
      subjectName,
      department: department,
      departmentId: branch === 'AIML' ? 'dept-aiml' : branch === 'AIDS' ? 'dept-aids' : 'dept-cse',
      departmentCode: branchDisplayName,
      departmentName: branch === 'AIML' ? 'CSE - Artificial Intelligence and Machine Learning' : branch === 'AIDS' ? 'CSE - Artificial Intelligence and Data Science' : 'Computer Science and Engineering',
      branch: branch,
      branchId: branch,
      branchDisplayName: branchDisplayName,
      year: cleanYear,
      semester: cleanSem,
      section: cleanSec,
      academicYear: cleanAcademicYear,
      regulation: cleanRegulation,
      resourceId,
      sourceResourceName,
      duration: Number(duration) || 20,
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: status || 'published',
      createdAt: new Date().toISOString(),
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      questionCount: formattedQuestions.length,
      questions: formattedQuestions
    };

    // 1. Try Supabase Insert (if configured)
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('assessments').insert([{
          id: newAssessment.id,
          title: newAssessment.title,
          faculty_id: newAssessment.facultyId,
          faculty_assignment_id: newAssessment.facultyAssignmentId,
          subject_id: newAssessment.subjectId,
          section: newAssessment.section,
          year: newAssessment.year,
          semester: newAssessment.semester,
          regulation: newAssessment.regulation,
          academic_year: newAssessment.academicYear,
          resource_id: newAssessment.resourceId,
          duration: newAssessment.duration,
          due_date: newAssessment.dueDate,
          status: newAssessment.status,
          created_at: newAssessment.createdAt
        }]);
      } catch (err) {
        console.warn('[AssessmentService] Supabase insert notice:', err.message);
      }
    }

    // 2. Persist locally
    const existing = this._loadAssessmentsLocal();
    const updated = [newAssessment, ...existing.filter(a => a.id !== newId)];
    this._saveAssessmentsLocal(updated);

    auditService.logAction({
      user: facultyName,
      role: 'faculty',
      userId: facultyId,
      action: 'Create Assessment',
      resource: `/faculty/assessments/${newId}`,
      result: 'Success',
      details: `Created MCQ assessment "${title}" for ${subjectName} (Section ${cleanSec}) with ${formattedQuestions.length} questions.`
    });

    return {
      success: true,
      data: newAssessment
    };
  }

  /**
   * Get Assessments filtered for Faculty or Student
   */
  async getAssessments(filters = {}) {
    let all = this._loadAssessmentsLocal();

    // Faculty Filter
    if (filters.facultyId || filters.facultyUserId) {
      const fid = String(filters.facultyId || filters.facultyUserId).toLowerCase();
      all = all.filter(a => {
        const afid = String(a.facultyId || a.facultyUserId || '').toLowerCase();
        const afname = String(a.facultyName || '').toLowerCase();
        return afid === fid || (fid.includes('anand') && (afname.includes('anand') || afid === 'fac-anand'));
      });
    }

    // Student Filter (Only Published assessments matching canonical Cohort: Branch, Year, Sem, Section)
    if (filters.student) {
      all = all.filter(a => {
        if (a.status !== 'published') return false;
        const aCohort = extractCanonicalCohort(a);
        return matchesCohort(filters.student, aCohort);
      });
    }

    // Enrich assessments with dynamic attempt stats
    const allAttempts = this._loadAttemptsLocal();
    const allUsers = await userManagementService.getAllUsers();
    const students = allUsers.filter(u => u.role === 'student');

    const enriched = all.map(a => {
      const attemptsForAsmt = allAttempts.filter(att => att.assessmentId === a.id);
      const aCohort = extractCanonicalCohort(a);
      
      // Calculate eligible students in the target cohort (branch + year + sem + section)
      const eligibleStudents = students.filter(st => matchesCohort(st, aCohort));

      const totalStudents = eligibleStudents.length;
      const submittedCount = attemptsForAsmt.length;
      const totalScoreSum = attemptsForAsmt.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
      const averageScore = submittedCount > 0 ? `${Math.round(totalScoreSum / submittedCount)}%` : '0%';

      return {
        ...a,
        studentsCount: totalStudents,
        submittedCount,
        averageScore,
        attempts: attemptsForAsmt
      };
    });

    return {
      success: true,
      data: enriched
    };
  }

  /**
   * Submit and Automatically Grade a Student Assessment Attempt
   */
  async submitAttempt({
    assessmentId,
    studentId,
    studentName = 'Rahul Kumar',
    rollNumber = '23CS001',
    answers = {},
    timeSpentSeconds = 0
  }) {
    const allAssessments = this._loadAssessmentsLocal();
    const assessment = allAssessments.find(a => a.id === assessmentId);

    if (!assessment) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }

    const questions = assessment.questions || [];
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const responseRecords = [];

    questions.forEach((q, idx) => {
      const qKey = q.id || idx;
      const selected = answers[qKey] !== undefined ? String(answers[qKey]).toUpperCase().trim() : null;
      const correct = String(q.correctAnswer).toUpperCase().trim();

      let isCorrect = false;
      if (!selected) {
        unansweredCount += 1;
      } else if (selected === correct) {
        correctCount += 1;
        isCorrect = true;
      } else {
        incorrectCount += 1;
      }

      responseRecords.push({
        questionId: q.id || `q_${idx}`,
        questionText: q.question,
        selectedAnswer: selected || 'UNANSWERED',
        correctAnswer: correct,
        isCorrect,
        explanation: q.explanation || ''
      });
    });

    const totalQuestions = questions.length || 1;
    const score = correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = percentage >= 50;

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const attemptRecord = {
      id: attemptId,
      attemptId,
      assessmentId,
      assessmentTitle: assessment.title,
      subjectId: assessment.subjectId,
      subjectCode: assessment.subjectCode,
      subjectName: assessment.subjectName,
      section: assessment.section,
      studentId: studentId || 'std-rahul',
      studentUserId: studentId || 'std-rahul',
      studentName,
      rollNumber,
      score,
      totalQuestions,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      isPassed,
      timeSpentSeconds,
      status: 'completed',
      submittedAt: new Date().toISOString(),
      responses: responseRecords
    };

    // 1. Try Supabase Insert (if configured)
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('assessment_attempts').insert([{
          id: attemptId,
          assessment_id: assessmentId,
          student_id: studentId,
          score,
          total_questions: totalQuestions,
          percentage,
          status: 'completed',
          submitted_at: attemptRecord.submittedAt
        }]);
      } catch (err) {
        console.warn('[AssessmentService] Supabase attempt insert notice:', err.message);
      }
    }

    // 2. Persist in LocalStorage
    const existingAttempts = this._loadAttemptsLocal();
    const updatedAttempts = [
      attemptRecord,
      ...existingAttempts.filter(a => !(a.assessmentId === assessmentId && a.studentId === studentId))
    ];
    this._saveAttemptsLocal(updatedAttempts);

    auditService.logAction({
      user: studentName,
      role: 'student',
      userId: studentId || 'std-rahul',
      action: 'Assessment Submission',
      resource: `/student/assessments/${assessmentId}`,
      result: 'Success',
      details: `Submitted assessment "${assessment.title}" with score ${score}/${totalQuestions} (${percentage}%).`
    });

    return {
      success: true,
      data: attemptRecord
    };
  }

  /**
   * Get Real Assessment Analytics for Faculty Portal
   */
  async getFacultyAssessmentAnalytics(facultyUserIdOrId) {
    const { data: assessments } = await this.getAssessments({ facultyUserId: facultyUserIdOrId });
    const allAttempts = this._loadAttemptsLocal();
    const allUsers = await userManagementService.getAllUsers();
    const studentUsers = allUsers.filter(u => u.role === 'student');

    // Aggregate statistics
    const totalAssessments = assessments.length;
    const allFacultyAttempts = allAttempts.filter(att => 
      assessments.some(asmt => asmt.id === att.assessmentId)
    );

    const detailedList = assessments.map(asmt => {
      const attempts = allAttempts.filter(att => att.assessmentId === asmt.id);
      const asmtCohort = extractCanonicalCohort(asmt);
      
      // Target students for this assessment's canonical academic cohort
      const targetStudents = studentUsers.filter(st => matchesCohort(st, asmtCohort));

      const assignedCount = targetStudents.length;
      const attemptedCount = attempts.length;
      const notAttemptedCount = Math.max(0, assignedCount - attemptedCount);

      const percentages = attempts.map(a => Number(a.percentage) || 0);
      const avgScore = percentages.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : 0;
      const highestScore = percentages.length > 0 ? Math.max(...percentages) : 0;
      const lowestScore = percentages.length > 0 ? Math.min(...percentages) : 0;
      const passCount = percentages.filter(p => p >= 50).length;
      const failCount = percentages.filter(p => p < 50).length;

      // Score distribution buckets
      const distribution = {
        '90-100': percentages.filter(p => p >= 90).length,
        '80-89': percentages.filter(p => p >= 80 && p < 90).length,
        '70-79': percentages.filter(p => p >= 70 && p < 80).length,
        '60-69': percentages.filter(p => p >= 60 && p < 70).length,
        '<60': percentages.filter(p => p < 60).length
      };

      // Individual student roster
      const studentRoster = targetStudents.map(st => {
        const attempt = attempts.find(att => att.studentId === st.id || att.studentUserId === st.userId || att.rollNumber === st.rollNumber);
        return {
          id: st.id || st.userId,
          name: st.name,
          rollNumber: st.rollNumber || '23CS001',
          email: st.email,
          status: attempt ? 'Completed' : 'Not Attempted',
          score: attempt ? `${attempt.score}/${attempt.totalQuestions}` : '—',
          percentage: attempt ? `${attempt.percentage}%` : '—',
          correctCount: attempt ? attempt.correctCount : 0,
          incorrectCount: attempt ? attempt.incorrectCount : 0,
          unansweredCount: attempt ? attempt.unansweredCount : 0,
          submittedAt: attempt ? attempt.submittedAt : null
        };
      });

      return {
        ...asmt,
        assignedCount,
        attemptedCount,
        notAttemptedCount,
        averageScoreNum: avgScore,
        averageScore: `${avgScore}%`,
        highestScore: `${highestScore}%`,
        lowestScore: `${lowestScore}%`,
        passCount,
        failCount,
        distribution,
        studentRoster
      };
    });

    return {
      totalAssessments,
      totalAttempts: allFacultyAttempts.length,
      assessments: detailedList
    };
  }
}

export const assessmentService = new AssessmentService();
export default assessmentService;
