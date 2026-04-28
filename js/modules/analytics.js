/**
 * ExamEdge Pro — modules/analytics.js
 * Study analytics: accuracy trends, subject breakdown, session history.
 */

import { state }      from '../state.js';
import { groupBy }    from '../utils.js';

/* ── Computed Analytics ──────────────────────────────────── */

/**
 * Return overall accuracy as a percentage (0–100).
 * @returns {number}
 */
export function getOverallAccuracy() {
  const { totalQuestionsAttempted: t, totalCorrect: c } = state.get('analytics');
  return t > 0 ? Math.round((c / t) * 100) : 0;
}

/**
 * Return accuracy grouped by subject.
 * @returns {Record<string, { attempted:number, correct:number, accuracy:number }>}
 */
export function getSubjectBreakdown() {
  return state.get('analytics').subjectScores ?? {};
}

/**
 * Record the result of a single question for analytics tracking.
 * @param {{ subject:string, correct:boolean }} result
 */
export function recordQuestionResult({ subject, correct }) {
  const analytics = state.get('analytics');
  const scores    = { ...analytics.subjectScores };

  if (!scores[subject]) scores[subject] = { attempted: 0, correct: 0 };
  scores[subject].attempted += 1;
  if (correct) scores[subject].correct += 1;
  scores[subject].accuracy = Math.round(
    (scores[subject].correct / scores[subject].attempted) * 100
  );

  state.set('analytics', {
    ...analytics,
    totalQuestionsAttempted: analytics.totalQuestionsAttempted + 1,
    totalCorrect:            analytics.totalCorrect + (correct ? 1 : 0),
    subjectScores:           scores,
  });
}

/**
 * Add study time to the running total.
 * @param {number} minutes
 */
export function addStudyTime(minutes) {
  const analytics = state.get('analytics');
  state.set('analytics', {
    ...analytics,
    studyTimeMinutes: (analytics.studyTimeMinutes ?? 0) + minutes,
  });
}

/**
 * Return a breakdown of exam history with pass/fail stats.
 * @returns {{ total:number, passed:number, averageScore:number, history:Array }}
 */
export function getExamHistorySummary() {
  const history = state.get('analytics').examHistory ?? [];
  const passed  = history.filter(e => e.passed).length;
  const avg     = history.length
    ? Math.round(history.reduce((s, e) => s + e.score, 0) / history.length)
    : 0;
  return { total: history.length, passed, averageScore: avg, history };
}

/**
 * Return the top N strongest subjects by accuracy.
 * @param {number} [n=3]
 * @returns {Array}
 */
export function getTopSubjects(n = 3) {
  const scores = getSubjectBreakdown();
  return Object.entries(scores)
    .map(([subject, data]) => ({ subject, ...data }))
    .filter(s => s.attempted >= 5)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, n);
}

/**
 * Return the weakest N subjects by accuracy.
 * @param {number} [n=3]
 * @returns {Array}
 */
export function getWeakSubjects(n = 3) {
  const scores = getSubjectBreakdown();
  return Object.entries(scores)
    .map(([subject, data]) => ({ subject, ...data }))
    .filter(s => s.attempted >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, n);
}
