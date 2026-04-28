/**
 * ExamEdge Pro — modules/exam.js
 * Live / scheduled exam session management.
 */

import { state }   from '../state.js';
import { showToast } from '../utils.js';

export function initExam() {
  console.log('[Exam] Live exam module ready.');
}

/**
 * Load and start a live scheduled exam.
 * @param {string} examId
 */
export async function loadExam(examId) {
  // TODO: fetch exam from Firestore
  // const examData = await getDocument('exams', examId);
  showToast({ title: 'Exam loading…', type: 'info' });
}

export function submitExam() {
  const session = state.get('examSession');
  if (!session) return null;
  // Similar to mock submit; enforces server-side validation in production
  document.dispatchEvent(new CustomEvent('examSubmitted', { detail: session }));
}
