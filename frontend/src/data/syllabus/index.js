// GMR CRM - Academic Syllabus Registry
// Modular architecture allowing CSE, CSE-AIML, and CSE-AIDS to be loaded dynamically.

import { cseSyllabus } from './cse.js';
import { cseAIMLSyllabus } from './cse-aiml.js';
import { cseAIDSSyllabus } from './cse-aids.js';

// Syllabus catalog keyed by normalized branch codes
const SYLLABUS_REGISTRY = {
  CSE: cseSyllabus,
  'CSE-AIML': cseAIMLSyllabus,
  'CSE-AIDS': cseAIDSSyllabus
};

/**
 * Normalizes branch or department string into canonical branch codes:
 * 'CSE' | 'CSE-AIML' | 'CSE-AIDS'
 */
export function normalizeBranchCode(rawBranch) {
  if (!rawBranch) return 'CSE';
  const str = String(rawBranch).trim().toUpperCase();

  if (str.includes('AIML') || str.includes('MACHINE LEARNING')) {
    return 'CSE-AIML';
  }
  if (
    str.includes('AIDS') ||
    str.includes('DATA SCIENCE') ||
    str.includes('AI&DS') ||
    str.includes('AI & DS')
  ) {
    return 'CSE-AIDS';
  }
  if (str.includes('CSE') || str.includes('COMPUTER SCIENCE')) {
    return 'CSE';
  }

  // Default fallback to CSE
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

  // Current phase: only CSE is fully populated.
  // Gracefully fallback to CSE while preserving architecture
  return {
    syllabus: cseSyllabus,
    branchCode,
    isFallback: branchCode !== 'CSE'
  };
}

export default getSyllabusByBranch;
