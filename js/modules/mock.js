/**
 * ExamEdge Pro — modules/mock.js
 * Mock exam logic: timed full-length exam simulation.
 */

import { state }   from '../state.js';
import { CONFIG }  from '../config.js';
import { awardXP } from './xp.js';
import { checkAchievements } from './achievements.js';
import { formatTime, showToast } from '../utils.js';

let _timerInterval = null;

/* ── Mock Exam API ───────────────────────────────────────── */

/**
 * Start a new mock exam session.
 * @param {{ examId:string, questions:Array, durationMinutes?:number }} opts
 */
export function startMockExam({ examId, questions, durationMinutes = CONFIG.EXAM.DEFAULT_DURATION_MINUTES }) {
  stopTimer();

  const session = {
    examId,
    questions,
    currentIndex:   0,
    answers:        {},
    startedAt:      new Date().toISOString(),
    endedAt:        null,
    durationSeconds: durationMinutes * 60,
    remainingSeconds: durationMinutes * 60,
    score:           null,
    submitted:       false,
  };

  state.set('mockSession', session);
  startTimer();
  document.dispatchEvent(new CustomEvent('mockStarted', { detail: session }));
  return session;
}

/**
 * Record an answer for a specific question (mock exam allows navigation).
 * @param {string} questionId
 * @param {number} optionIndex
 */
export function recordAnswer(questionId, optionIndex) {
  const session = state.get('mockSession');
  if (!session || session.submitted) return;
  state.set('mockSession', {
    ...session,
    answers: { ...session.answers, [questionId]: optionIndex },
  });
}

/** Navigate to a question by index. */
export function goToQuestion(index) {
  const session = state.get('mockSession');
  if (!session || index < 0 || index >= session.questions.length) return;
  state.set('mockSession', { ...session, currentIndex: index });
}

/** Submit the mock exam and calculate results. */
export function submitMockExam() {
  const session = state.get('mockSession');
  if (!session || session.submitted) return null;
  stopTimer();

  const total   = session.questions.length;
  const correct = session.questions.filter(q => session.answers[q.id] === q.answer).length;
  const score   = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed  = score >= CONFIG.EXAM.PASSING_SCORE_PERCENT;

  const result = { correct, total, score, passed };
  const ended  = {
    ...session,
    endedAt:   new Date().toISOString(),
    score,
    passed,
    submitted: true,
  };

  state.set('mockSession', ended);

  // Update exam history
  const analytics = state.get('analytics');
  state.set('analytics', {
    ...analytics,
    examHistory: [...(analytics.examHistory ?? []), {
      type:      'mock',
      examId:    session.examId,
      score,
      passed,
      date:      ended.endedAt,
      questions: total,
      correct,
    }],
  });

  awardXP(CONFIG.XP.MOCK_EXAM_COMPLETION, 'Mock exam completed!');
  checkAchievements();

  showToast({
    title:   passed ? '🎉 Exam Passed!' : '📚 Keep Studying',
    message: `You scored ${score}% (${correct}/${total})`,
    type:    passed ? 'success' : 'warning',
    duration: 6000,
  });

  document.dispatchEvent(new CustomEvent('mockEnded', { detail: { ...ended, result } }));
  return result;
}

/* ── Timer ───────────────────────────────────────────────── */

function startTimer() {
  _timerInterval = setInterval(() => {
    const session = state.get('mockSession');
    if (!session || session.submitted) { stopTimer(); return; }

    const remaining = session.remainingSeconds - 1;

    if (remaining <= 0) {
      state.set('mockSession', { ...session, remainingSeconds: 0 });
      stopTimer();
      submitMockExam();
      showToast({ title: "⏰ Time's Up!", message: 'Your exam has been auto-submitted.', type: 'warning' });
      return;
    }

    // Warn at threshold
    if (remaining === CONFIG.EXAM.WARNING_TIME_SECONDS) {
      showToast({ title: '⚠️ 5 minutes remaining!', type: 'warning' });
    }
    if (remaining === CONFIG.EXAM.DANGER_TIME_SECONDS) {
      showToast({ title: '🚨 1 minute remaining!', type: 'error' });
    }

    state.set('mockSession', { ...session, remainingSeconds: remaining });
    document.dispatchEvent(new CustomEvent('timerTick', { detail: { remaining } }));
  }, 1000);
}

function stopTimer() {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
}

/** Get the formatted remaining time string for display. */
export function getRemainingTime() {
  return formatTime(state.get('mockSession')?.remainingSeconds ?? 0);
}
