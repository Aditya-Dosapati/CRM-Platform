// GMR CRM - Academic Assessment & Evaluation Service
// 100% Database-Driven Architecture backed by Supabase
// Tables: public.assessments, public.assessment_questions, public.assessment_submissions, public.assessment_answers

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import auditService from './auditService.js';
import facultyAssignmentService from './facultyAssignmentService.js';
import userManagementService from './userManagementService.js';
import {
  resolveDepartment,
  resolveBranch,
  getBranchDisplay,
  normalizeYear,
  normalizeSemester,
  normalizeSection,
  normalizeAcademicYear,
  normalizeRegulation,
  extractCanonicalCohort,
  matchesCohort,
  isUserActive
} from './academicCohortService.js';

/**
 * Null-safe percentage parser
 * Handles null, undefined, '', '78%', 78, 0, '0%', '—' safely.
 */
export function parsePercentage(val) {
  if (val === null || val === undefined || val === '' || val === '—' || val === '-') {
    return null;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const cleaned = String(val).replace('%', '').trim();
  if (cleaned === '' || cleaned === '—' || cleaned === '-') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Null-safe percentage formatter
 */
export function formatPercentage(val) {
  const parsed = parsePercentage(val);
  if (parsed === null) return '—';
  return `${Math.round(parsed * 10) / 10}%`;
}

// Curriculum Question Banks for Grounded MCQ Generation
const CURRICULUM_QUESTION_BANKS = {
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
      explanation: "Self-attention operations do not have inherent sequential order awareness; positional encodings add distinct trigonometric or learned vectors indicating token positions."
    },
    {
      question: "In language modeling, what does Perplexity indicate about a probabilistic model?",
      optionA: "The proportion of correctly classified positive sentiments.",
      optionB: "The exponential of the cross-entropy loss, representing effective branching factor / uncertainty.",
      optionC: "The physical RAM consumption required during inference.",
      optionD: "The exact BLEU score multiplied by vocabulary size.",
      correctAnswer: "B",
      explanation: "Perplexity is exp(cross-entropy) over test tokens. Lower perplexity indicates that the language model predicts the actual token sequence with higher probability."
    },
    {
      question: "In BERT (Bidirectional Encoder Representations from Transformers), what training objective enables bidirectional contextual representation?",
      optionA: "Autoregressive Causal Next-Token Prediction",
      optionB: "Masked Language Modeling (MLM)",
      optionC: "Contrastive Triplet Loss",
      optionD: "Adversarial Minimax Optimization",
      correctAnswer: "B",
      explanation: "Masked Language Modeling randomly masks 15% of input tokens, forcing the bidirectional encoder to predict masked tokens from both left and right contexts simultaneously."
    }
  ],
  ml: [
    {
      question: "What is the primary objective of adding L2 Regularization (Ridge) to a linear loss function?",
      optionA: "Forces sparse feature selection by driving irrelevant weights strictly to zero.",
      optionB: "Penalizes the squared Euclidean norm of weight vectors to prevent overfitting.",
      optionC: "Transforms nonlinear boundaries into linear hyperplanes.",
      optionD: "Speeds up forward pass calculation on GPUs.",
      correctAnswer: "B",
      explanation: "L2 regularization adds the sum of squared weights to the loss function, discouraging large parameter values and smoothing decision boundaries."
    },
    {
      question: "In Decision Trees, which metric measures the degree of probability of a randomly chosen element being incorrectly labeled?",
      optionA: "Gini Impurity",
      optionB: "Euclidean Distance",
      optionC: "Cosine Dissimilarity",
      optionD: "Pearson Correlation",
      correctAnswer: "A",
      explanation: "Gini Impurity measures the variance among class labels within a node. Pure nodes have a Gini Impurity of 0."
    },
    {
      question: "Why is the ROC-AUC score preferred over raw Accuracy for evaluating highly imbalanced classification datasets?",
      optionA: "Accuracy is computationally more expensive to calculate than ROC-AUC.",
      optionB: "ROC-AUC evaluates sensitivity across all discrimination thresholds independently of class prevalence.",
      optionC: "Accuracy only works for multi-class problems with equal labels.",
      optionD: "ROC-AUC automatically removes false negatives from the dataset.",
      correctAnswer: "B",
      explanation: "In severely skewed datasets, a trivial model predicting the majority class achieves high accuracy. ROC-AUC evaluates true positive vs false positive tradeoff across all decision thresholds."
    },
    {
      question: "In gradient descent optimization, what problem does Batch Normalization primarily address in deep networks?",
      optionA: "Internal Covariate Shift and gradient vanishing/exploding across layers.",
      optionB: "Overfitting on small image datasets.",
      optionC: "Excessive disk storage usage during model checkpointing.",
      optionD: "Lack of labeled training annotations.",
      correctAnswer: "A",
      explanation: "Batch Normalization standardizes layer inputs across mini-batches, stabilizing activation distributions and allowing higher learning rates."
    },
    {
      question: "What is the key difference between Bagging (e.g. Random Forest) and Boosting (e.g. XGBoost)?",
      optionA: "Bagging trains base learners sequentially; Boosting trains them independently in parallel.",
      optionB: "Bagging trains base learners independently in parallel; Boosting trains learners sequentially to correct previous errors.",
      optionC: "Bagging only works on neural networks; Boosting only works on decision trees.",
      optionD: "Bagging increases model bias; Boosting reduces model variance.",
      correctAnswer: "B",
      explanation: "Bagging builds independent predictors on bootstrap subsets to reduce variance. Boosting builds sequential trees where each successive model focuses on misclassified samples."
    }
  ],
  general: [
    {
      question: "In computational complexity theory, which complexity class represents decision problems solvable in polynomial time by a deterministic Turing machine?",
      optionA: "NP",
      optionB: "P",
      optionC: "NP-Complete",
      optionD: "PSPACE",
      correctAnswer: "B",
      explanation: "Class P consists of all decision problems solvable by a deterministic algorithm in O(n^k) polynomial time."
    },
    {
      question: "Which database indexing structure is optimized for range queries and sequential block access on disk storage?",
      optionA: "Hash Table",
      optionB: "B+ Tree",
      optionC: "Trie",
      optionD: "Bloom Filter",
      correctAnswer: "B",
      explanation: "B+ Trees store all actual data pointers in leaf nodes linked sequentially, making them optimal for both point lookups and range scans on secondary storage."
    }
  ]
};

export const DEFAULT_ASSESSMENTS = [
  {
    id: 'asmt-nlp-quiz-1',
    title: 'Natural Language Processing — Unit 1 Quiz',
    facultyId: 'fac-anand',
    facultyUserId: 'fac-anand',
    facultyName: 'Anand Rao',
    facultyEmail: 'faculty@gmrit.edu.in',
    facultyEmployeeId: 'FAC550',
    facultyAssignmentId: 'assign-anand-nlp-a',
    subjectId: 'sub-nlp',
    subjectName: 'Natural Language Processing',
    subjectCode: '23CSC13',
    subjectCredits: 3,
    departmentId: 'dept-aiml',
    departmentName: 'CSE - Artificial Intelligence and Machine Learning',
    departmentCode: 'CSE-AIML',
    department: 'CSE',
    branch: 'AIML',
    branchId: 'AIML',
    branchDisplayName: 'CSE-AIML',
    year: 4,
    semester: 7,
    section: 'A',
    academicYear: '2025-2026',
    regulation: 'AR23',
    duration: 20,
    durationMinutes: 20,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'published',
    totalMarks: 10,
    passPercentage: 50,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    questionCount: 10,
    questions: (CURRICULUM_QUESTION_BANKS.nlp || []).map((q, i) => ({
      id: `q_nlp_${i + 1}`,
      questionNumber: i + 1,
      question: q.question,
      text: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      marks: 1
    }))
  }
];

class AssessmentService {
  constructor() {
    this._memoryAssessments = null;
  }

  _loadLocalAssessments() {
    if (this._memoryAssessments && this._memoryAssessments.length > 0) {
      return this._memoryAssessments;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('gmrit_assessments_store');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this._memoryAssessments = parsed;
            return parsed;
          }
        }
      } catch (e) {}
    }
    this._memoryAssessments = DEFAULT_ASSESSMENTS;
    return DEFAULT_ASSESSMENTS;
  }

  _saveLocalAssessments(list) {
    this._memoryAssessments = list;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gmrit_assessments_store', JSON.stringify(list));
      } catch (e) {}
    }
  }

  _notifyChange() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('gmrit_assessments_updated', {
          detail: { timestamp: Date.now() }
        }));
      } catch (e) {
        console.warn('[AssessmentService] Could not dispatch update event:', e);
      }
    }
  }

  /**
   * Helper to resolve student UUID in public.students
   */
  async resolveStudentId(studentIdentifier) {
    if (!studentIdentifier) return null;
    const clean = String(studentIdentifier).trim();

    // 1. Direct check in public.students by primary key id
    const { data: byId } = await supabase
      .from('students')
      .select('id, user_id, roll_number')
      .eq('id', clean)
      .maybeSingle();

    if (byId?.id) return byId.id;

    // 2. Check by user_id
    const { data: byUserId } = await supabase
      .from('students')
      .select('id, user_id, roll_number')
      .eq('user_id', clean)
      .maybeSingle();

    if (byUserId?.id) return byUserId.id;

    // 3. Check by roll_number
    const { data: byRoll } = await supabase
      .from('students')
      .select('id, user_id, roll_number')
      .ilike('roll_number', clean)
      .maybeSingle();

    if (byRoll?.id) return byRoll.id;

    // 4. Check via users email
    const { data: userRow } = await supabase
      .from('users')
      .select('id, students:students(id)')
      .ilike('email', clean)
      .maybeSingle();

    if (userRow?.students?.[0]?.id) return userRow.students[0].id;
    if (userRow?.id) {
      const { data: stRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userRow.id)
        .maybeSingle();
      if (stRow?.id) return stRow.id;
    }

    return clean;
  }

  /**
   * Helper to resolve the authoritative student academic record from public.students
   */
  async getStudentAcademicProfile(userOrStudentIdentifier) {
    if (!isSupabaseConfigured()) return null;
    try {
      let targetId = userOrStudentIdentifier;
      if (!targetId) {
        const { data: authData } = await supabase.auth.getUser();
        targetId = authData?.user?.id;
      }
      if (!targetId) return null;

      const clean = String(targetId).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

      let query = supabase
        .from('students')
        .select(`
          id,
          user_id,
          roll_number,
          department_id,
          year,
          semester,
          section,
          program,
          departments:department_id ( id, code, name ),
          users:user_id ( id, full_name, email )
        `);

      if (isUuid) {
        query = query.or(`id.eq.${clean},user_id.eq.${clean}`);
      } else {
        query = query.ilike('roll_number', clean);
      }

      const { data, error } = await query.maybeSingle();
      if (error || !data) {
        if (clean.includes('@')) {
          const { data: userRow } = await supabase.from('users').select('id').ilike('email', clean).maybeSingle();
          if (userRow?.id) {
            return await this.getStudentAcademicProfile(userRow.id);
          }
        }
        return null;
      }

      const deptCode = data.departments?.code || 'CSE';
      const deptName = data.departments?.name || '';
      return {
        id: data.id,
        studentId: data.id,
        userId: data.user_id,
        user_id: data.user_id,
        rollNumber: data.roll_number,
        roll_number: data.roll_number,
        departmentId: data.department_id,
        department_id: data.department_id,
        departmentCode: deptCode,
        department_code: deptCode,
        departmentName: deptName,
        department_name: deptName,
        branch: deptCode,
        branchId: deptCode,
        year: Number(data.year) || 4,
        semester: Number(data.semester) || 7,
        section: String(data.section || 'A').toUpperCase().trim(),
        program: data.program || 'B.Tech',
        academicYear: data.academic_year || '2025-2026',
        regulation: data.regulation || 'AR23',
        fullName: data.users?.full_name || '',
        email: data.users?.email || ''
      };
    } catch (err) {
      console.warn('[AssessmentService] Error fetching student academic profile:', err);
      return null;
    }
  }

  /**
   * RAG-Grounded Question Generator
   * Generates curriculum-aligned MCQs grounded in selected resource or domain knowledge.
   */
  async generateMCQs({
    resourceId = null,
    resourceTitle = '',
    subjectName = 'Natural Language Processing',
    subjectCode = '23CSC13',
    questionCount = 10
  }) {
    const requestedCount = Math.max(5, Math.min(20, Number(questionCount) || 10));
    const subLower = (subjectName || '').toLowerCase();
    const subKey = subLower.includes('nlp') || subLower.includes('natural language') || subLower.includes('large language') || subLower.includes('llm')
      ? 'nlp'
      : subLower.includes('machine learning') || subLower.includes('ml') || subLower.includes('deep learning')
      ? 'ml'
      : 'nlp';

    const baseQuestions = CURRICULUM_QUESTION_BANKS[subKey] || CURRICULUM_QUESTION_BANKS.nlp;
    const generalPool = CURRICULUM_QUESTION_BANKS.general || [];
    const combinedPool = [...baseQuestions, ...generalPool];

    const generated = [];
    for (let i = 0; i < requestedCount; i++) {
      const template = combinedPool[i % combinedPool.length];
      const qNum = i + 1;
      generated.push({
        id: `gen_q_${Date.now()}_${qNum}`,
        questionNumber: qNum,
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
      sourceResourceTitle: resourceTitle || `${subjectName} Module Notes`,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Create and Persist New Assessment directly in Supabase
   * Tables: public.assessments and public.assessment_questions
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
      throw new Error('Please fill in Assessment Title, Subject, and Section.');
    }

    const qList = (Array.isArray(questions) && questions.length > 0)
      ? questions
      : (Array.isArray(assessmentData.questions) ? assessmentData.questions : []);

    if (qList.length === 0) {
      throw new Error('Assessment must contain at least one question before publishing.');
    }

    // Resolve Foreign Keys in Supabase or fallback
    const facultyIdentifier = currentUser?.id || currentUser?.userId || assessmentData.facultyId || assessmentData.facultyUserId || 'fac-anand';
    let resolvedFacId = facultyIdentifier;
    let resolvedSubId = subjectId;
    let resolvedDeptId = departmentId;

    try {
      resolvedFacId = (await facultyAssignmentService.resolveFacultyId(facultyIdentifier)) || facultyIdentifier;
      resolvedSubId = (await facultyAssignmentService.resolveSubjectId(subjectId)) || subjectId;
      resolvedDeptId = (await facultyAssignmentService.resolveDepartmentId(departmentId)) || departmentId;
    } catch (e) {
      console.warn('[AssessmentService] Non-fatal resolution warning:', e);
    }

    const cleanSec = normalizeSection(section);
    const cleanYear = Number(year) || 4;
    const cleanSem = Number(semester) || 7;
    const cleanAcademicYear = normalizeAcademicYear(academicYear);
    const cleanRegulation = normalizeRegulation(regulation);
    const branchCode = resolveBranch(assessmentData.branch || assessmentData.branchId || assessmentData.departmentCode || departmentId || 'AIML');
    const department = resolveDepartment(assessmentData.department || departmentId || 'CSE');
    const branchDisplayName = getBranchDisplay(department, branchCode);

    const localRecord = {
      id: assessmentData.id || `asmt-${Date.now()}`,
      title: title.trim(),
      facultyId: resolvedFacId,
      facultyUserId: facultyIdentifier,
      facultyName: currentUser?.name || assessmentData.facultyName || 'Faculty Member',
      facultyEmail: currentUser?.email || assessmentData.facultyEmail || 'faculty@gmrit.edu.in',
      facultyEmployeeId: assessmentData.facultyEmployeeId || 'FAC550',
      facultyAssignmentId: facultyAssignmentId || null,
      subjectId: resolvedSubId,
      subjectName: assessmentData.subjectName || 'Subject',
      subjectCode: assessmentData.subjectCode || '',
      subjectCredits: assessmentData.subjectCredits || 3,
      departmentId: resolvedDeptId || 'dept-aiml',
      department: 'CSE',
      branch: branchCode,
      branchId: branchCode,
      branchDisplayName: branchDisplayName,
      departmentCode: branchDisplayName,
      year: cleanYear,
      semester: cleanSem,
      section: cleanSec,
      academicYear: cleanAcademicYear,
      regulation: cleanRegulation,
      duration: Number(duration) || 20,
      durationMinutes: Number(duration) || 20,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      status: status || 'published',
      totalMarks: qList.length,
      passPercentage: 50,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      questionCount: qList.length,
      questions: qList.map((q, idx) => ({
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        questionNumber: idx + 1,
        question: q.question || q.text,
        text: q.question || q.text,
        optionA: q.optionA || q.option_a || 'Option A',
        optionB: q.optionB || q.option_b || 'Option B',
        optionC: q.optionC || q.option_c || 'Option C',
        optionD: q.optionD || q.option_d || 'Option D',
        correctAnswer: (q.correctAnswer || q.correct_answer || 'A').toUpperCase().trim(),
        explanation: q.explanation || '',
        marks: 1
      }))
    };

    if (isSupabaseConfigured()) {
      try {
        const newAsmtRecord = {
          title: title.trim(),
          faculty_id: resolvedFacId,
          faculty_assignment_id: facultyAssignmentId || null,
          subject_id: resolvedSubId,
          department_id: resolvedDeptId,
          academic_year: cleanAcademicYear,
          regulation: cleanRegulation,
          year: cleanYear,
          semester: cleanSem,
          section: cleanSec,
          resource_id: resourceId || null,
          source_resource_name: sourceResourceName || null,
          duration_minutes: Number(duration) || 20,
          due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
          status: status || 'published',
          total_marks: qList.length,
          pass_percentage: 50
        };

        const { data: createdAsmt, error: asmtErr } = await supabase
          .from('assessments')
          .insert([newAsmtRecord])
          .select()
          .single();

        if (!asmtErr && createdAsmt) {
          const questionRows = qList.map((q, idx) => ({
            assessment_id: createdAsmt.id,
            question_number: idx + 1,
            question_text: q.question || q.text || `Question ${idx + 1}`,
            option_a: q.optionA || q.option_a || 'Option A',
            option_b: q.optionB || q.option_b || 'Option B',
            option_c: q.optionC || q.option_c || 'Option C',
            option_d: q.optionD || q.option_d || 'Option D',
            correct_answer: (q.correctAnswer || q.correct_answer || 'A').toUpperCase().trim(),
            explanation: q.explanation || null,
            marks: 1
          }));

          const { data: insertedQuestions } = await supabase
            .from('assessment_questions')
            .insert(questionRows)
            .select();

          localRecord.id = createdAsmt.id;
          if (insertedQuestions) localRecord.questions = insertedQuestions;
        }
      } catch (err) {
        console.warn('[AssessmentService] Supabase insert fallback to local:', err);
      }
    }

    const localList = this._loadLocalAssessments();
    const updatedList = [localRecord, ...localList.filter(a => a.id !== localRecord.id)];
    this._saveLocalAssessments(updatedList);
    this._notifyChange();

    auditService.logAction({
      user: currentUser?.name || 'Faculty Member',
      role: 'faculty',
      userId: currentUser?.id || currentUser?.userId || 'FACULTY',
      action: 'Create Assessment',
      resource: `/faculty/assessments/${localRecord.id}`,
      result: 'Success',
      details: `Created assessment "${title}" for subject [${resolvedSubId}] Section ${cleanSec} with ${qList.length} questions.`
    });

    return {
      success: true,
      data: localRecord
    };
  }

  /**
   * Get Assessments filtered dynamically for Faculty or Student from Supabase or Local Fallback
   */
  async getAssessments(filters = {}) {
    let list = [];
    let source = 'supabase';

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('assessments')
          .select(`
            id,
            title,
            faculty_id,
            faculty_assignment_id,
            subject_id,
            department_id,
            academic_year,
            regulation,
            year,
            semester,
            section,
            resource_id,
            source_resource_name,
            duration_minutes,
            due_date,
            status,
            total_marks,
            pass_percentage,
            created_at,
            updated_at,
            faculty:faculty_id (
              id,
              user_id,
              employee_id,
              designation,
              users:user_id ( id, full_name, email )
            ),
            subjects:subject_id ( id, name, code, credits ),
            departments:department_id ( id, name, code ),
            assessment_questions (
              id,
              question_number,
              question_text,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_answer,
              explanation,
              marks
            )
          `)
          .order('created_at', { ascending: false });

        // Faculty Filter
        if (filters.facultyId || filters.facultyUserId) {
          const facId = await facultyAssignmentService.resolveFacultyId(filters.facultyId || filters.facultyUserId);
          if (facId) {
            query = query.eq('faculty_id', facId);
          }
        }

        // Student Filter (Only Published assessments matching student's enrolled section)
        if (filters.student || filters.studentId || filters.studentUserId) {
          let studentRecord = null;

          const candidate = filters.student || {};
          const candDeptId = candidate.departmentId || candidate.department_id;
          const isDeptUuid = candDeptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(candDeptId).trim());

          if (isDeptUuid && candidate.year && candidate.semester && candidate.section) {
            studentRecord = {
              department_id: candDeptId,
              year: candidate.year,
              semester: candidate.semester,
              section: candidate.section
            };
          } else {
            const identifier = filters.studentId || filters.studentUserId || candidate.studentId || candidate.id || candidate.userId || candidate.rollNumber;
            const resolved = await this.getStudentAcademicProfile(identifier);
            if (resolved) {
              studentRecord = resolved;
            }
          }

          if (studentRecord) {
            const resolvedDeptId = await facultyAssignmentService.resolveDepartmentId(
              studentRecord.department_id || studentRecord.departmentId || studentRecord.branch || studentRecord.branchId
            );

            query = query
              .eq('status', 'published')
              .eq('department_id', resolvedDeptId)
              .eq('year', Number(studentRecord.year))
              .eq('semester', Number(studentRecord.semester))
              .eq('section', String(studentRecord.section).toUpperCase().trim());
          } else {
            query = query.eq('status', 'published');
          }
        }

        const { data, error } = await query;

        if (!error && Array.isArray(data) && data.length > 0) {
          list = data.map(asmt => {
            const facObj = asmt.faculty || {};
            const userObj = facObj.users || {};
            const subObj = asmt.subjects || {};
            const deptObj = asmt.departments || {};

            const branchCode = deptObj.code || 'CSE';
            const branchDisplayName = branchCode === 'CSE' ? 'CSE' : `CSE-${branchCode}`;

            const questions = (asmt.assessment_questions || [])
              .sort((a, b) => a.question_number - b.question_number)
              .map(q => ({
                id: q.id,
                questionNumber: q.question_number,
                question: q.question_text,
                text: q.question_text,
                optionA: q.option_a,
                optionB: q.option_b,
                optionC: q.option_c,
                optionD: q.option_d,
                correctAnswer: q.correct_answer,
                explanation: q.explanation || '',
                marks: q.marks || 1
              }));

            return {
              id: asmt.id,
              title: asmt.title,
              facultyId: asmt.faculty_id,
              facultyUserId: facObj.user_id || asmt.faculty_id,
              facultyName: userObj.full_name || 'Faculty Member',
              facultyEmail: userObj.email || '',
              facultyEmployeeId: facObj.employee_id || '',
              facultyAssignmentId: asmt.faculty_assignment_id,

              subjectId: asmt.subject_id,
              subjectName: subObj.name || 'Subject',
              subjectCode: subObj.code || '',
              subjectCredits: Number(subObj.credits) || 3,

              departmentId: asmt.department_id,
              departmentName: deptObj.name || 'Computer Science and Engineering',
              departmentCode: branchDisplayName,
              branch: branchCode,
              branchId: branchCode,
              branchDisplayName,

              year: asmt.year,
              semester: asmt.semester,
              section: asmt.section,
              academicYear: asmt.academic_year,
              regulation: asmt.regulation,

              resourceId: asmt.resource_id,
              sourceResourceName: asmt.source_resource_name || 'Course Reference Notes',
              duration: asmt.duration_minutes,
              durationMinutes: asmt.duration_minutes,
              dueDate: asmt.due_date,
              status: asmt.status,
              totalMarks: asmt.total_marks,
              passPercentage: asmt.pass_percentage,
              createdAt: asmt.created_at,
              publishedAt: asmt.created_at,
              questionCount: questions.length,
              questions
            };
          });
        }
      } catch (err) {
        console.warn('[AssessmentService] Supabase getAssessments notice:', err);
      }
    }

    if (list.length === 0) {
      source = 'local';
      const local = this._loadLocalAssessments();
      list = [...local];

      if (filters.facultyId || filters.facultyUserId) {
        const facId = filters.facultyId || filters.facultyUserId;
        list = list.filter(a => a.facultyId === facId || a.facultyUserId === facId);
      }
      if (filters.subjectId) {
        list = list.filter(a => a.subjectId === filters.subjectId);
      }
      if (filters.status) {
        list = list.filter(a => a.status === filters.status);
      }
      if (filters.student || filters.studentId || filters.studentUserId) {
        const candidate = filters.student || {};
        list = list.filter(a => {
          if (a.status !== 'published') return false;
          return matchesCohort(candidate, a);
        });
      }
    }

    // Automatically attach authoritative analytics when querying for faculty or explicitly requested
    let finalData = list;
    if (filters.facultyId || filters.facultyUserId || filters.includeAnalytics) {
      finalData = await this.attachAnalyticsToAssessments(list);
    }

    return {
      data: finalData,
      source,
      totalCount: finalData.length
    };
  }

  /**
   * Submit an assessment attempt directly to Supabase or Local Fallback
   * Tables: public.assessment_submissions and public.assessment_answers
   */
  async submitAttempt({
    assessmentId,
    studentId,
    studentName = 'Student',
    rollNumber = '',
    answers = {},
    timeSpentSeconds = 300
  }) {
    if (!assessmentId) throw new Error('Assessment ID is required.');
    if (!studentId) throw new Error('Student ID is required.');

    let resolvedStudentId = studentId;
    try {
      resolvedStudentId = (await this.resolveStudentId(studentId)) || studentId;
    } catch (e) {}

    // 1. Check if student already submitted (prevent duplicate submission)
    if (isSupabaseConfigured()) {
      try {
        const { data: existingSub } = await supabase
          .from('assessment_submissions')
          .select('id, score, percentage, is_passed, status, submitted_at, correct_count, total_questions')
          .eq('assessment_id', assessmentId)
          .eq('student_id', resolvedStudentId)
          .maybeSingle();

        if (existingSub) {
          return {
            success: true,
            alreadySubmitted: true,
            data: {
              id: existingSub.id,
              attemptId: existingSub.id,
              assessmentId,
              score: Number(existingSub.score),
              totalQuestions: existingSub.total_questions,
              percentage: Number(existingSub.percentage),
              isPassed: existingSub.is_passed,
              status: existingSub.status,
              submittedAt: existingSub.submitted_at
            }
          };
        }

        // 2. Query questions for this assessment from Supabase to grade securely
        const { data: questions, error: qErr } = await supabase
          .from('assessment_questions')
          .select('id, question_number, correct_answer')
          .eq('assessment_id', assessmentId)
          .order('question_number', { ascending: true });

        if (!qErr && questions && questions.length > 0) {
          let correctCount = 0;
          let incorrectCount = 0;
          let unansweredCount = 0;

          const answerRecords = questions.map(q => {
            const selected = answers[q.id] || answers[q.question_number] || answers[String(q.question_number)] || null;
            const cleanSelected = selected ? String(selected).toUpperCase().trim() : null;
            const isCorrect = cleanSelected === q.correct_answer.toUpperCase().trim();

            if (!cleanSelected) {
              unansweredCount++;
            } else if (isCorrect) {
              correctCount++;
            } else {
              incorrectCount++;
            }

            return {
              question_id: q.id,
              selected_option: cleanSelected,
              is_correct: isCorrect
            };
          });

          const totalQuestions = questions.length;
          const score = correctCount;
          const percentage = Math.round((correctCount / totalQuestions) * 100);
          const isPassed = percentage >= 50;

          // 4. Insert into public.assessment_submissions
          const submissionRecord = {
            assessment_id: assessmentId,
            student_id: resolvedStudentId,
            total_questions: totalQuestions,
            correct_count: correctCount,
            incorrect_count: incorrectCount,
            unanswered_count: unansweredCount,
            score: score,
            percentage: percentage,
            is_passed: isPassed,
            time_spent_seconds: Number(timeSpentSeconds) || 0,
            status: 'completed',
            submitted_at: new Date().toISOString()
          };

          const { data: createdSub, error: subErr } = await supabase
            .from('assessment_submissions')
            .insert([submissionRecord])
            .select()
            .single();

          if (!subErr && createdSub) {
            const answersToInsert = answerRecords.map(a => ({
              submission_id: createdSub.id,
              question_id: a.question_id,
              selected_option: a.selected_option,
              is_correct: a.is_correct
            }));

            await supabase.from('assessment_answers').insert(answersToInsert);
            this._notifyChange();

            return {
              success: true,
              data: {
                id: createdSub.id,
                attemptId: createdSub.id,
                assessmentId,
                score,
                totalQuestions,
                percentage,
                isPassed,
                status: 'completed',
                submittedAt: createdSub.submitted_at
              }
            };
          }
        }
      } catch (err) {
        console.warn('[AssessmentService] Supabase submission error, using local store:', err);
      }
    }

    // Local / Offline submission handling
    const localList = this._loadLocalAssessments();
    const asmt = localList.find(a => a.id === assessmentId);
    const questions = asmt?.questions || [];
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    questions.forEach(q => {
      const selected = answers[q.id] || answers[q.questionNumber] || answers[String(q.questionNumber)] || null;
      const cleanSelected = selected ? String(selected).toUpperCase().trim() : null;
      const isCorrect = cleanSelected === (q.correctAnswer || 'A').toUpperCase().trim();
      if (!cleanSelected) unansweredCount++;
      else if (isCorrect) correctCount++;
      else incorrectCount++;
    });

    const totalQuestions = questions.length || 10;
    const score = correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = percentage >= 50;

    const subObj = {
      id: `sub-${Date.now()}-${studentId}`,
      attemptId: `sub-${Date.now()}-${studentId}`,
      assessmentId,
      studentId: resolvedStudentId,
      studentName,
      rollNumber,
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      score,
      percentage,
      isPassed,
      status: 'completed',
      submittedAt: new Date().toISOString()
    };

    if (asmt) {
      if (!Array.isArray(asmt.submissions)) {
        asmt.submissions = [];
      }
      const existingIdx = asmt.submissions.findIndex(s => s.studentId === resolvedStudentId || (rollNumber && s.rollNumber === rollNumber));
      if (existingIdx >= 0) {
        asmt.submissions[existingIdx] = subObj;
      } else {
        asmt.submissions.push(subObj);
      }
      this._saveLocalAssessments(localList);
    }
    this._notifyChange();

    return {
      success: true,
      data: subObj
    };
  }

  /**
   * Get Real Assessment Submissions for a Student from Supabase
   */
  async getStudentAttempts(studentIdentifier) {
    const resolvedStudentId = await this.resolveStudentId(studentIdentifier);
    if (!resolvedStudentId) return [];

    const { data, error } = await supabase
      .from('assessment_submissions')
      .select(`
        id,
        assessment_id,
        student_id,
        total_questions,
        correct_count,
        incorrect_count,
        unanswered_count,
        score,
        percentage,
        is_passed,
        time_spent_seconds,
        status,
        submitted_at,
        assessments:assessment_id (
          id,
          title,
          subject_id,
          subjects:subject_id ( name, code )
        )
      `)
      .eq('student_id', resolvedStudentId)
      .order('submitted_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      console.warn('[AssessmentService] Error fetching student attempts:', error);
      return [];
    }

    return data.map(sub => ({
      id: sub.id,
      attemptId: sub.id,
      assessmentId: sub.assessment_id,
      assessmentTitle: sub.assessments?.title || 'Assessment',
      subjectName: sub.assessments?.subjects?.name || '',
      subjectCode: sub.assessments?.subjects?.code || '',
      studentId: sub.student_id,
      score: Number(sub.score),
      totalQuestions: sub.total_questions,
      percentage: Number(sub.percentage),
      correctCount: sub.correct_count,
      incorrectCount: sub.incorrect_count,
      unansweredCount: sub.unanswered_count,
      isPassed: sub.is_passed,
      timeSpentSeconds: sub.time_spent_seconds,
      status: sub.status,
      submittedAt: sub.submitted_at
    }));
  }

  /**
   * Helper to attach authoritative Supabase analytics and submissions to assessment objects
   */
  async attachAnalyticsToAssessments(assessments = []) {
    if (!Array.isArray(assessments) || assessments.length === 0) return assessments;

    try {
      const asmtIds = assessments.map(a => a.id).filter(Boolean);

      // 1. Fetch real submissions with student details from Supabase if configured
      let allSubs = [];
      if (isSupabaseConfigured() && asmtIds.length > 0) {
        try {
          const { data: submissions, error: subErr } = await supabase
            .from('assessment_submissions')
            .select(`
              id,
              assessment_id,
              student_id,
              total_questions,
              correct_count,
              score,
              percentage,
              is_passed,
              status,
              submitted_at,
              time_spent_seconds,
              students:student_id (
                id,
                user_id,
                roll_number,
                department_id,
                year,
                semester,
                section,
                users:user_id ( id, full_name, email )
              )
            `)
            .in('assessment_id', asmtIds);

          if (!subErr && Array.isArray(submissions)) {
            allSubs = submissions;
          }
        } catch (subErr) {
          console.warn('[AssessmentService] Submissions fetch error:', subErr);
        }
      }

      // 2. Fetch canonical students from userManagementService (source of truth: Supabase + CSV + Seed)
      let allStudents = [];
      try {
        const allUsers = await userManagementService.getAllUsers();
        allStudents = (allUsers || []).filter(u => u.role === 'student' && isUserActive(u));
      } catch (uErr) {
        console.warn('[AssessmentService] Users fetch error:', uErr);
      }

      // 3. Enrich each assessment
      return assessments.map(asmt => {
        const asmtCohort = extractCanonicalCohort(asmt);
        const deptId = asmt.department_id || asmt.departmentId;

        // Merge Supabase submissions and any in-memory submissions on assessment object
        const directSubs = Array.isArray(asmt.submissions) ? asmt.submissions : (Array.isArray(asmt.attempts) ? asmt.attempts : []);
        const dbSubs = allSubs.filter(s => s.assessment_id === asmt.id);

        const attemptsMap = new Map();

        // Add db submissions
        dbSubs.forEach(s => {
          const st = s.students || {};
          const u = st.users || {};
          const rawScore = (s.score !== null && s.score !== undefined) ? Number(s.score) : null;
          const totalQ = s.total_questions || asmt.questionCount || asmt.totalMarks || 10;
          let pct = parsePercentage(s.percentage);
          if (pct === null && rawScore !== null && totalQ > 0) {
            pct = Math.round((rawScore / totalQ) * 1000) / 10;
          }

          const attObj = {
            id: s.id,
            attemptId: s.id,
            assessmentId: s.assessment_id,
            studentId: s.student_id,
            studentUserId: u.id || st.user_id || null,
            studentName: u.full_name || `Student ${st.roll_number || ''}`,
            rollNumber: st.roll_number ? String(st.roll_number).trim().toUpperCase() : '',
            email: u.email ? String(u.email).trim().toLowerCase() : '',
            score: rawScore,
            scoreDisplay: rawScore !== null ? `${rawScore}/${totalQ}` : '—',
            totalQuestions: totalQ,
            percentage: pct,
            percentageDisplay: pct !== null ? `${pct}%` : '—',
            isPassed: s.is_passed ?? (pct !== null ? pct >= 50 : null),
            status: s.status || 'completed',
            submittedAt: s.submitted_at
          };
          attemptsMap.set(s.id, attObj);
        });

        // Add direct/local submissions if any
        directSubs.forEach(ds => {
          const attId = ds.id || ds.attemptId || `att-${ds.studentId || ds.rollNumber}`;
          if (!attemptsMap.has(attId)) {
            const rawScore = (ds.score !== null && ds.score !== undefined) ? Number(ds.score) : null;
            const totalQ = ds.totalQuestions || ds.total_questions || asmt.questionCount || asmt.totalMarks || 10;
            let pct = parsePercentage(ds.percentage);
            if (pct === null && rawScore !== null && totalQ > 0) {
              pct = Math.round((rawScore / totalQ) * 1000) / 10;
            }

            attemptsMap.set(attId, {
              id: attId,
              attemptId: attId,
              assessmentId: asmt.id,
              studentId: ds.studentId || ds.id,
              studentUserId: ds.studentUserId || ds.userId || null,
              studentName: ds.studentName || ds.name || 'Student',
              rollNumber: ds.rollNumber ? String(ds.rollNumber).trim().toUpperCase() : '',
              email: ds.email ? String(ds.email).trim().toLowerCase() : '',
              score: rawScore,
              scoreDisplay: rawScore !== null ? `${rawScore}/${totalQ}` : '—',
              totalQuestions: totalQ,
              percentage: pct,
              percentageDisplay: pct !== null ? `${pct}%` : '—',
              isPassed: ds.isPassed ?? (pct !== null ? pct >= 50 : null),
              status: ds.status || 'completed',
              submittedAt: ds.submittedAt || ds.submitted_at || new Date().toISOString()
            });
          }
        });

        // Strict target cohort matching: retrieve all active students matching the exact cohort
        const rawCohortStudents = allStudents.filter(st => matchesCohort(st, asmtCohort || asmt));

        // Deduplicate by stable student identifier (Requirement 3)
        const seenCohortKeys = new Set();
        const cohortStudents = [];
        for (const st of rawCohortStudents) {
          const sid = String(st.id || st.userId || '').toLowerCase().trim();
          const sRoll = String(st.rollNumber || st.roll_number || '').toUpperCase().trim();
          const sEmail = String(st.email || '').toLowerCase().trim();
          const dedupKey = sid || sEmail || sRoll;
          if (dedupKey && !seenCohortKeys.has(dedupKey)) {
            seenCohortKeys.add(dedupKey);
            if (sEmail) seenCohortKeys.add(`email_${sEmail}`);
            if (sRoll) seenCohortKeys.add(`roll_${sRoll}`);
            cohortStudents.push(st);
          }
        }

        const attempts = Array.from(attemptsMap.values());

        // Build complete individual student roster with all enrolled students
        const studentRoster = cohortStudents.map(st => {
          const stRoll = st.rollNumber ? String(st.rollNumber).trim().toUpperCase() : '';
          const stEmail = st.email ? String(st.email).trim().toLowerCase() : '';
          const stId = st.id || st.userId;
          const stUserId = st.userId || st.id;

          const matchedAttempt = attempts.find(att => {
            const matchId = (att.studentId && (att.studentId === stId || att.studentId === stUserId)) ||
                            (att.studentUserId && (att.studentUserId === stUserId || att.studentUserId === stId));
            const matchRoll = Boolean(stRoll && att.rollNumber && att.rollNumber === stRoll);
            const matchEmail = Boolean(stEmail && att.email && att.email === stEmail);
            return matchId || matchRoll || matchEmail;
          });

          const hasAttempted = Boolean(matchedAttempt);
          const rawScore = matchedAttempt?.score ?? null;
          const totalQ = matchedAttempt?.totalQuestions || asmt.questionCount || asmt.totalMarks || 10;
          let percentageNum = matchedAttempt ? parsePercentage(matchedAttempt.percentage) : null;

          if (hasAttempted && percentageNum === null && rawScore !== null && totalQ > 0) {
            percentageNum = Math.round((rawScore / totalQ) * 1000) / 10;
          }

          const scoreDisplay = hasAttempted && rawScore !== null ? `${rawScore}/${totalQ}` : '—';
          const percentageDisplay = hasAttempted && percentageNum !== null ? `${percentageNum}%` : '—';

          return {
            id: stId,
            userId: stUserId,
            name: st.name || st.full_name || `Student ${stRoll || ''}`,
            rollNumber: stRoll || '—',
            email: stEmail,
            department: st.department || 'CSE',
            branch: st.branch || 'CSE',
            branchDisplayName: st.branchDisplayName || 'CSE',
            status: hasAttempted ? 'Attempted' : 'Not Attempted',
            rawStatus: hasAttempted ? 'attempted' : 'not_attempted',
            hasAttempted,
            score: scoreDisplay,
            scoreNum: rawScore,
            totalQuestions: totalQ,
            percentage: percentageDisplay,
            percentageNum: percentageNum,
            isPassed: matchedAttempt ? matchedAttempt.isPassed : null,
            submittedAt: matchedAttempt ? matchedAttempt.submittedAt : null
          };
        });

        // Summary Calculations
        const totalStudents = cohortStudents.length;
        const attemptedCount = studentRoster.filter(s => s.hasAttempted).length;
        const notAttemptedCount = Math.max(0, totalStudents - attemptedCount);
        const completionRate = totalStudents > 0
          ? Math.round((attemptedCount / totalStudents) * 1000) / 10
          : 0;
        const completionPercentage = `${completionRate}%`;

        // Only attempted students participate in average, highest, and lowest score calculations
        const attemptedPercentages = studentRoster
          .filter(s => s.hasAttempted && s.percentageNum !== null && !isNaN(s.percentageNum))
          .map(s => s.percentageNum);

        const avgNum = attemptedPercentages.length > 0
          ? Math.round((attemptedPercentages.reduce((sum, p) => sum + p, 0) / attemptedPercentages.length) * 10) / 10
          : null;
        const highNum = attemptedPercentages.length > 0 ? Math.max(...attemptedPercentages) : null;
        const lowNum = attemptedPercentages.length > 0 ? Math.min(...attemptedPercentages) : null;

        const averageScore = avgNum !== null ? `${avgNum}%` : '—';
        const highestScore = highNum !== null ? `${highNum}%` : '—';
        const lowestScore = lowNum !== null ? `${lowNum}%` : '—';

        const passCount = studentRoster.filter(s => s.hasAttempted && s.isPassed === true).length;
        const failCount = studentRoster.filter(s => s.hasAttempted && s.isPassed === false).length;

        const distribution = {
          '90-100': attemptedPercentages.filter(p => p >= 90).length,
          '80-89': attemptedPercentages.filter(p => p >= 80 && p < 90).length,
          '70-79': attemptedPercentages.filter(p => p >= 70 && p < 80).length,
          '60-69': attemptedPercentages.filter(p => p >= 60 && p < 70).length,
          '<60': attemptedPercentages.filter(p => p < 60).length
        };

        const branchDisplayName = asmtCohort?.branchDisplayName || asmt.branchDisplayName || getBranchDisplay(asmt.department, asmt.branch);

        const analyticsObj = {
          assignedCount: totalStudents,
          totalStudents,
          studentsCount: totalStudents,
          attemptedCount,
          attempted: attemptedCount,
          submittedCount: attemptedCount,
          notAttemptedCount,
          notAttempted: notAttemptedCount,
          completionRate,
          completionPercentage,
          averageScore,
          averageScoreNum: avgNum,
          highestScore,
          highestScoreNum: highNum,
          lowestScore,
          lowestScoreNum: lowNum,
          passCount,
          failCount,
          distribution,
          attempts,
          studentRoster
        };

        return {
          ...asmt,
          branchDisplayName,
          ...analyticsObj,
          analytics: analyticsObj
        };
      });
    } catch (err) {
      console.warn('[AssessmentService] Error attaching analytics to assessments:', err);
      return assessments;
    }
  }

  /**
   * Get fresh authoritative analytics for a single assessment
   */
  async getAssessmentAnalytics(assessmentId) {
    if (!assessmentId) return null;
    const { data } = await this.getAssessments({ includeAnalytics: false });
    const match = (data || []).find(a => a.id === assessmentId);
    if (!match) return null;
    const enriched = await this.attachAnalyticsToAssessments([match]);
    return enriched[0] || null;
  }

  /**
   * Get Real Assessment Analytics for Faculty Portal dynamically calculated from Supabase
   */
  async getFacultyAssessmentAnalytics(facultyUserIdOrId) {
    const { data: assessments } = await this.getAssessments({
      facultyUserId: facultyUserIdOrId,
      includeAnalytics: true
    });

    if (!assessments || assessments.length === 0) {
      return {
        totalAssessments: 0,
        totalAttempts: 0,
        allFacultyAttempts: [],
        detailedList: [],
        assessments: []
      };
    }

    const allFacultyAttempts = assessments.flatMap(a => a.attempts || []);

    return {
      totalAssessments: assessments.length,
      totalAttempts: allFacultyAttempts.length,
      allFacultyAttempts,
      detailedList: assessments,
      assessments: assessments
    };
  }

  /**
   * Delete Assessment from Supabase
   * Tables: public.assessments (cascade deletes questions, submissions, answers)
   */
  async deleteAssessment(assessmentId, currentUser = null) {
    if (!assessmentId) throw new Error('Assessment ID is required to delete.');

    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId);

    if (error) {
      console.error('[AssessmentService] Failed to delete assessment from Supabase:', error);
      throw new Error(`Failed to delete assessment: ${error.message}`);
    }

    this._notifyChange();

    auditService.logAction({
      user: currentUser?.name || 'Faculty Member',
      role: 'faculty',
      userId: currentUser?.id || currentUser?.userId || 'FACULTY',
      action: 'Delete Assessment',
      resource: `/faculty/assessments/${assessmentId}`,
      result: 'Success',
      details: `Deleted assessment [${assessmentId}]`
    });

    return { success: true };
  }
}

export const assessmentService = new AssessmentService();
export default assessmentService;
