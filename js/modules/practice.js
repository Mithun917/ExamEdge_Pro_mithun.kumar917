/**
 * ExamEdge Pro — modules/practice.js
 * Practice session logic: start, answer, score, end.
 */

import { state }          from '../state.js';
import { CONFIG }         from '../config.js';
import { awardXP, applyStreakBonus } from './xp.js';
import { checkAchievements }         from './achievements.js';
import { shuffle, sample, showToast } from '../utils.js';

/* ── Mock question bank (replace with Firestore) ──────────── */

const MOCK_QUESTIONS = [
  {
    id: 'q1', subject: 'math', difficulty: 'easy',
    text: 'What is 15% of 200?',
    options: ['25', '30', '35', '40'],
    answer: 1, explanation: '15% × 200 = 0.15 × 200 = 30.',
  },
  {
    id: 'q2', subject: 'general', difficulty: 'medium',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
    answer: 2, explanation: 'Mars appears red due to iron oxide (rust) on its surface.',
  },
  {
    id: 'q3', subject: 'science', difficulty: 'medium',
    text: 'What is the chemical symbol for Gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    answer: 2, explanation: 'Au comes from the Latin word "Aurum."',
  },
  {
    id: 'q4', subject: 'reasoning', difficulty: 'hard',
    text: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
    options: ['Yes', 'No', 'Cannot determine', 'Sometimes'],
    answer: 0, explanation: 'Transitive property of set inclusion.',
  },
];

/* ── Session API ─────────────────────────────────────────── */

/**
 * Start a new practice session.
 * @param {{ subject?:string, difficulty?:string, count?:number, shuffle?:boolean }} opts
 */
export function startPracticeSession(opts = {}) {
  const { subject = null, difficulty = null, count = 10, shuffle: doShuffle = true } = opts;

  // Filter and sample questions
  let pool = MOCK_QUESTIONS.filter(q => {
    if (subject    && q.subject    !== subject)    return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });

  if (pool.length === 0) {
    showToast({ title: 'No questions found', message: 'Try different filters.', type: 'warning' });
    return null;
  }

  const questions = doShuffle ? shuffle(pool).slice(0, count) : pool.slice(0, count);

  const session = {
    id:           crypto.randomUUID?.() ?? Date.now().toString(36),
    questions,
    currentIndex: 0,
    answers:      {},
    startedAt:    new Date().toISOString(),
    endedAt:      null,
    score:        null,
  };

  state.set('practiceSession', session);
  applyStreakBonus();
  document.dispatchEvent(new CustomEvent('practiceStarted', { detail: session }));
  return session;
}

/**
 * Submit an answer for the current question.
 * @param {number} optionIndex
 * @returns {{ correct: boolean, explanation: string }}
 */
export function submitAnswer(optionIndex) {
  const session = state.get('practiceSession');
  if (!session) return null;

  const q       = session.questions[session.currentIndex];
  const correct = optionIndex === q.answer;

  const updatedSession = {
    ...session,
    answers: { ...session.answers, [q.id]: { chosen: optionIndex, correct } },
  };
  state.set('practiceSession', updatedSession);

  // Award XP
  awardXP(
    correct ? CONFIG.XP.PRACTICE_QUESTION_CORRECT : CONFIG.XP.PRACTICE_QUESTION_WRONG,
    correct ? 'Correct answer! 🎯' : 'Keep going!'
  );

  // Update analytics
  const analytics = state.get('analytics');
  state.set('analytics', {
    ...analytics,
    totalQuestionsAttempted: analytics.totalQuestionsAttempted + 1,
    totalCorrect:            analytics.totalCorrect + (correct ? 1 : 0),
  });

  checkAchievements();

  return { correct, explanation: q.explanation };
}

/**
 * Move to the next question.
 * @returns {boolean} true if there is a next question
 */
export function nextQuestion() {
  const session = state.get('practiceSession');
  if (!session) return false;
  const next = session.currentIndex + 1;
  if (next >= session.questions.length) return false;
  state.set('practiceSession', { ...session, currentIndex: next });
  return true;
}

/** End the current session and return the score summary. */
export function endPracticeSession() {
  const session = state.get('practiceSession');
  if (!session) return null;

  const total   = session.questions.length;
  const correct = Object.values(session.answers).filter(a => a.correct).length;
  const score   = total > 0 ? Math.round((correct / total) * 100) : 0;

  const ended = { ...session, endedAt: new Date().toISOString(), score };
  state.set('practiceSession', ended);
  state.set('_lastSessionScore', score);
  checkAchievements();

  document.dispatchEvent(new CustomEvent('practiceEnded', { detail: ended }));
  return { correct, total, score };
}

/** Get the current question object. */
export function getCurrentQuestion() {
  const session = state.get('practiceSession');
  if (!session) return null;
  return session.questions[session.currentIndex] ?? null;
}
