// GMRIT Academic Hub - Centralized Coding Assessment & Persistence Service
// TEMPORARY LOCAL PERSISTENCE LAYER:
// Stores coding assessments and student examination attempts in browser localStorage.
// Note: Data is browser-specific and will not synchronize across different computers or browsers.

import { codingAssessmentsList } from '../data/codingData.js';
import { extractCanonicalCohort } from './academicCohortService.js';

export const STORAGE_KEY_ASSESSMENTS = 'gmrit_coding_assessments';
export const STORAGE_KEY_ATTEMPTS = 'gmrit_coding_exam_attempts';
export const ASSESSMENTS_UPDATED_EVENT = 'gmrit_coding_assessments_updated';

class CodingAssessmentService {
  constructor() {
    this._inMemoryCache = null;
  }

  /**
   * Safely parse JSON from localStorage without throwing
   */
  _safeParse(jsonString, fallback = null) {
    if (!jsonString || typeof jsonString !== 'string') return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('[CodingAssessmentService] Error parsing localStorage JSON:', e.message);
      return fallback;
    }
  }

  /**
   * Get all custom assessments stored in localStorage
   */
  getCustomAssessments() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY_ASSESSMENTS);
    const parsed = this._safeParse(raw, []);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out malformed entries
    return parsed.filter(item => item && typeof item === 'object' && item.id && item.title);
  }

  /**
   * Get student exam attempts map from localStorage
   */
  getExamAttempts() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {};
    }
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    const parsed = this._safeParse(raw, {});
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  }

  /**
   * Load full assessments list with custom assessments and exam attempts merged.
   * If options.user is provided and user is a student, applies cohort filtering.
   *
   * @param {Object} options
   * @param {Object} [options.user] - Current user for cohort filtering
   * @param {boolean} [options.includeBase=true] - Whether to include standard base assessments
   * @returns {Array} List of assessments
   */
  getAssessments(options = {}) {
    const { user = null, includeBase = true } = options;
    const customList = this.getCustomAssessments();
    const attemptsMap = this.getExamAttempts();

    // 1. Build combined assessments list
    let combined = [...customList];
    const seenIds = new Set(customList.map(a => a.id));

    if (includeBase && Array.isArray(codingAssessmentsList)) {
      codingAssessmentsList.forEach(baseItem => {
        if (!seenIds.has(baseItem.id)) {
          combined.push(baseItem);
          seenIds.add(baseItem.id);
        }
      });
    }

    // 2. Merge exam attempt results into assessments
    combined = combined.map(assessment => {
      const attempt = attemptsMap[assessment.id];
      if (attempt) {
        return {
          ...assessment,
          status: 'completed',
          score: attempt.score ?? assessment.score,
          solvedCount: attempt.solvedCount ?? assessment.solvedCount,
          testCasesPassed: attempt.testCasesPassed ?? assessment.testCasesPassed,
          runtimeScore: attempt.runtimeScore ?? assessment.runtimeScore,
          problemBreakdown: attempt.problemBreakdown ?? assessment.problemBreakdown,
          submittedAt: attempt.submittedAt ?? null
        };
      }
      return assessment;
    });

    // 3. Cohort / Authorization filtering for students
    if (user && (user.role === 'student' || user.role === undefined)) {
      const userCohort = extractCanonicalCohort(user);
      const studentDept = (userCohort?.department || user.department || '').toLowerCase().trim();
      const studentBranch = (userCohort?.branch || user.branch || '').toLowerCase().trim();
      const studentSec = (userCohort?.section || user.section || '').toUpperCase().trim();

      combined = combined.filter(a => {
        // If assessment has no specific department or class restriction, allow access
        if (!a.department && !a.className) return true;
        const aDept = (a.department || '').toLowerCase().trim();
        const aClass = (a.className || '').toLowerCase().trim();

        // Department/Branch match
        const deptMatches =
          !aDept ||
          !studentDept ||
          aDept.includes(studentDept) ||
          aDept.includes(studentBranch) ||
          studentDept.includes(aDept) ||
          (studentBranch && aDept.includes('computer science')) ||
          aDept.includes('all');

        // Section match if specified in className
        let secMatches = true;
        if (studentSec && aClass.includes('section')) {
          secMatches =
            aClass.includes(`section ${studentSec.toLowerCase()}`) ||
            aClass.includes(`section ${studentSec}`) ||
            aClass.includes(`& ${studentSec.toLowerCase()}`) ||
            aClass.includes(`& ${studentSec}`) ||
            aClass.includes('all');
        }

        return deptMatches && secMatches;
      });
    }

    return combined;
  }

  /**
   * Save a newly created assessment or update an existing one in localStorage.
   *
   * @param {Object} assessmentData
   * @returns {Object} The saved assessment
   */
  saveAssessment(assessmentData) {
    if (!assessmentData || typeof assessmentData !== 'object') {
      throw new Error('Assessment data must be an object.');
    }
    if (!assessmentData.title || !assessmentData.title.trim()) {
      throw new Error('Assessment title is required.');
    }

    const questionIds = Array.isArray(assessmentData.questionIds)
      ? assessmentData.questionIds
      : Array.isArray(assessmentData.selectedProblemIds)
        ? assessmentData.selectedProblemIds
        : ['prob-1', 'prob-2', 'prob-3'];

    const allowedLanguages = Array.isArray(assessmentData.allowedLanguages) && assessmentData.allowedLanguages.length > 0
      ? assessmentData.allowedLanguages
      : ['Python', 'C++', 'Java', 'C', 'JavaScript'];

    const formatted = {
      id: assessmentData.id || `assess-custom-${Date.now()}`,
      title: assessmentData.title.trim(),
      faculty: assessmentData.faculty || 'Institution Academic Office (Admin)',
      department: assessmentData.department || 'Computer Science & Engineering',
      className: assessmentData.className || 'B.Tech CSE — All Sections',
      questionsCount: Number(assessmentData.questionsCount || questionIds.length || 1),
      durationMinutes: Number(assessmentData.durationMinutes || 60),
      startTime: assessmentData.startTime || new Date().toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      endTime: assessmentData.endTime || 'Scheduled Examination Window',
      status: assessmentData.status || 'upcoming',
      allowedLanguages,
      totalMarks: Number(assessmentData.totalMarks || 100),
      difficulty: assessmentData.difficulty || 'Medium',
      instructions: assessmentData.instructions || [
        'Do not refresh or switch tabs during the assessment.',
        'Code editor runs inside isolated execution sandboxes.',
        'Submissions are automatically evaluated against hidden test cases.'
      ],
      questionIds,
      regulation: assessmentData.regulation || 'AR23',
      createdAt: assessmentData.createdAt || new Date().toISOString()
    };

    // Load existing custom assessments safely without overwriting
    const existing = this.getCustomAssessments();
    const existingIdx = existing.findIndex(a => a.id === formatted.id);

    let updated;
    if (existingIdx >= 0) {
      updated = [...existing];
      updated[existingIdx] = formatted;
    } else {
      updated = [formatted, ...existing];
    }

    try {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('[CodingAssessmentService] Failed to write to localStorage:', e);
      throw new Error('Storage write failed. Browser storage quota may be exceeded.');
    }

    // Notify same-tab listeners
    this.notifyUpdate(formatted);

    return formatted;
  }

  /**
   * Delete a custom assessment by ID
   */
  deleteAssessment(assessmentId) {
    if (!assessmentId) return false;
    const existing = this.getCustomAssessments();
    const updated = existing.filter(a => a.id !== assessmentId);

    try {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(updated));
      this.notifyUpdate({ deletedId: assessmentId });
      return true;
    } catch (e) {
      console.error('[CodingAssessmentService] Failed to delete from localStorage:', e);
      return false;
    }
  }

  /**
   * Save student exam attempt
   */
  saveExamAttempt(result) {
    if (!result || !result.assessmentId) {
      console.warn('[CodingAssessmentService] Invalid exam result payload');
      return false;
    }

    const attemptsMap = this.getExamAttempts();
    attemptsMap[result.assessmentId] = {
      score: result.score ?? 0,
      solvedCount: result.solvedCount ?? 0,
      testCasesPassed: result.testCasesPassed ?? '0 / 0',
      runtimeScore: result.runtimeScore || 'Good (36 ms avg)',
      problemBreakdown: Array.isArray(result.problemBreakdown) ? result.problemBreakdown : [],
      submittedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attemptsMap));
      this.notifyUpdate({ examAttempt: result });
      return true;
    } catch (e) {
      console.error('[CodingAssessmentService] Failed to save exam attempt:', e);
      return false;
    }
  }

  /**
   * Dispatch custom event for same-tab UI updates
   */
  notifyUpdate(detail = {}) {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent(ASSESSMENTS_UPDATED_EVENT, { detail }));
      } catch (_) {
        window.dispatchEvent(new Event(ASSESSMENTS_UPDATED_EVENT));
      }
    }
  }

  /**
   * Subscribe to assessment changes across same-tab and other tabs
   */
  subscribe(callback) {
    if (typeof window === 'undefined' || typeof callback !== 'function') {
      return () => {};
    }

    // Same-tab updates
    const handleLocal = (e) => {
      try {
        callback(e?.detail || null);
      } catch (err) {
        console.error('[CodingAssessmentService] Error in local subscriber:', err);
      }
    };

    // Cross-tab updates
    const handleStorage = (e) => {
      if (!e || e.key === STORAGE_KEY_ASSESSMENTS || e.key === STORAGE_KEY_ATTEMPTS) {
        try {
          callback({ storageKey: e?.key });
        } catch (err) {
          console.error('[CodingAssessmentService] Error in storage subscriber:', err);
        }
      }
    };

    window.addEventListener(ASSESSMENTS_UPDATED_EVENT, handleLocal);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(ASSESSMENTS_UPDATED_EVENT, handleLocal);
      window.removeEventListener('storage', handleStorage);
    };
  }
}

const codingAssessmentService = new CodingAssessmentService();
export default codingAssessmentService;

