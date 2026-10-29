// GMR CRM - Academic Syllabus Registry
// Modular architecture allowing CSE, CSE-AIML, and CSE-AIDS to be loaded dynamically.

import { cseSyllabus } from './cse.js';
import { cseAIMLSyllabus } from './cse-aiml.js';
import { cseAIDSSyllabus } from './cse-aids.js';
import { resolveBranch } from '../../services/academicCohortService.js';

// Syllabus catalog keyed by normalized canonical branch codes
const SYLLABUS_REGISTRY = {
  CSE: cseSyllabus,
  'CSE-AIML': cseAIMLSyllabus,
  'CSE-AIDS': cseAIDSSyllabus
};

/**
 * Normalizes branch or department string into canonical branch codes:
 * 'CSE' | 'CSE-AIML' | 'CSE-AIDS'
 * Uses canonical academic cohort service without string splitting.
 */
export function normalizeBranchCode(rawBranch) {
  if (!rawBranch) return 'CSE';
  const b = resolveBranch(rawBranch);
  if (b === 'AIML') return 'CSE-AIML';
  if (b === 'AIDS') return 'CSE-AIDS';
  return 'CSE';
}

/**
 * Retrieves the syllabus dataset for a given branch.
 * Falls back to CSE if the requested branch syllabus is not yet populated.
 */
export function getSyllabusByBranch(rawBranch) {
  const branchCode = normalizeBranchCode(rawBranch);
  const syllabus = SYLLABUS_REGISTRY[branchCode];

  if (syllabus) {
    return {
      syllabus,
      branchCode,
      isFallback: false
    };
  }

  // Gracefully fallback to CSE while preserving architecture
  return {
    syllabus: cseSyllabus,
    branchCode,
    isFallback: branchCode !== 'CSE'
  };
}

export default getSyllabusByBranch;
