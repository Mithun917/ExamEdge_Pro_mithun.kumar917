/**
 * ExamEdge Pro — modules/milestones.js
 * Study milestones: cumulative goals and progress tracking.
 */

import { state }     from '../state.js';
import { showToast } from '../utils.js';
import { awardXP }   from './xp.js';

export const MILESTONES = [
  { id: 'q50',    label: '50 Questions Answered',   target: 50,   metric: 'totalQuestionsAttempted', xp: 100, icon: '📝' },
  { id: 'q200',   label: '200 Questions Answered',  target: 200,  metric: 'totalQuestionsAttempted', xp: 300, icon: '📚' },
  { id: 'q500',   label: '500 Questions Answered',  target: 500,  metric: 'totalQuestionsAttempted', xp: 750, icon: '🏆' },
  { id: 'e5',     label: '5 Mock Exams Completed',  target: 5,    metric: 'examHistory.length',       xp: 250, icon: '🎓' },
  { id: 'acc70',  label: '70% Accuracy Reached',    target: 70,   metric: 'accuracy',                 xp: 200, icon: '🎯' },
  { id: 'acc90',  label: '90% Accuracy Reached',    target: 90,   metric: 'accuracy',                 xp: 500, icon: '💫' },
];

let _checked = new Set();

/**
 * Check all milestones against current analytics state.
 * Unlocks newly completed milestones.
 */
export function checkMilestones() {
  const analytics = state.get('analytics');
  const unlocked  = new Set(
    JSON.parse(localStorage.getItem('ee_milestones') ?? '[]')
  );

  MILESTONES.forEach(m => {
    if (unlocked.has(m.id) || _checked.has(m.id)) return;

    const value = getMetricValue(analytics, m.metric);
    if (value >= m.target) {
      unlocked.add(m.id);
      _checked.add(m.id);
      localStorage.setItem('ee_milestones', JSON.stringify([...unlocked]));
      awardXP(m.xp, `Milestone: ${m.label}`);
      showToast({
        title:   `${m.icon} Milestone Reached!`,
        message: `${m.label} — +${m.xp} XP`,
        type:    'success',
        duration: 5000,
      });
    }
  });
}

function getMetricValue(analytics, metric) {
  if (metric === 'accuracy') {
    const { totalQuestionsAttempted: t, totalCorrect: c } = analytics;
    return t > 0 ? Math.round((c / t) * 100) : 0;
  }
  if (metric === 'examHistory.length') {
    return analytics.examHistory?.length ?? 0;
  }
  return analytics[metric] ?? 0;
}

/** Return all milestones with current progress values. */
export function getMilestonesWithProgress() {
  const analytics = state.get('analytics');
  const unlocked  = new Set(
    JSON.parse(localStorage.getItem('ee_milestones') ?? '[]')
  );
  return MILESTONES.map(m => ({
    ...m,
    value:    getMetricValue(analytics, m.metric),
    unlocked: unlocked.has(m.id),
    progress: Math.min(1, getMetricValue(analytics, m.metric) / m.target),
  }));
}
