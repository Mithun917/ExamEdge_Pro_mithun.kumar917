/**
 * ExamEdge Pro — modules/achievements.js
 * Achievement definitions, unlock logic, and notifications.
 */

import { state }    from '../state.js';
import { showToast } from '../utils.js';
import { awardXP }  from './xp.js';

/* ── Achievement Definitions ─────────────────────────────── */

export const ACHIEVEMENTS = [
  {
    id:          'first_question',
    title:       'First Step',
    description: 'Answer your first question.',
    icon:        '🌱',
    xpReward:    25,
    condition:   s => (s.analytics?.totalQuestionsAttempted ?? 0) >= 1,
  },
  {
    id:          'ten_questions',
    title:       'Getting Warmed Up',
    description: 'Answer 10 questions.',
    icon:        '🔥',
    xpReward:    50,
    condition:   s => (s.analytics?.totalQuestionsAttempted ?? 0) >= 10,
  },
  {
    id:          'perfect_score',
    title:       'Perfectionist',
    description: 'Score 100% on a practice session.',
    icon:        '💯',
    xpReward:    100,
    condition:   s => s._lastSessionScore === 100,
  },
  {
    id:          'streak_3',
    title:       'On a Roll',
    description: 'Maintain a 3-day study streak.',
    icon:        '📅',
    xpReward:    75,
    condition:   s => (s.streak ?? 0) >= 3,
  },
  {
    id:          'streak_7',
    title:       'Week Warrior',
    description: 'Maintain a 7-day study streak.',
    icon:        '🗓️',
    xpReward:    200,
    condition:   s => (s.streak ?? 0) >= 7,
  },
  {
    id:          'level_5',
    title:       'Rising Star',
    description: 'Reach Level 5.',
    icon:        '⭐',
    xpReward:    150,
    condition:   s => (s.level ?? 1) >= 5,
  },
  {
    id:          'first_mock',
    title:       'Test Drive',
    description: 'Complete your first mock exam.',
    icon:        '🎓',
    xpReward:    100,
    condition:   s => (s.analytics?.examHistory?.length ?? 0) >= 1,
  },
  {
    id:          'hundred_questions',
    title:       'Century Club',
    description: 'Answer 100 questions.',
    icon:        '💪',
    xpReward:    200,
    condition:   s => (s.analytics?.totalQuestionsAttempted ?? 0) >= 100,
  },
];

/* ── Init ────────────────────────────────────────────────── */

export function initAchievements() {
  // Load unlocked achievements from state
  console.log('[Achievements] Module ready. Watching state for unlocks.');
}

/* ── Check & Unlock ──────────────────────────────────────── */

/**
 * Evaluate all achievement conditions against current state.
 * Unlocks any that are newly satisfied.
 */
export function checkAchievements() {
  const s       = state.getAll();
  const unlocked = new Set(state.get('achievements').map(a => a.id));

  ACHIEVEMENTS.forEach(achievement => {
    if (unlocked.has(achievement.id)) return; // already unlocked

    if (achievement.condition(s)) {
      unlockAchievement(achievement);
    }
  });
}

/**
 * Unlock a specific achievement by ID (manual override).
 * @param {string} achievementId
 */
export function unlockById(achievementId) {
  const def = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (def) unlockAchievement(def);
}

/* ── Internal ────────────────────────────────────────────── */

function unlockAchievement(achievement) {
  const current = state.get('achievements');
  const updated = [...current, { id: achievement.id, unlockedAt: new Date().toISOString() }];
  state.set('achievements', updated);

  // Award XP reward
  awardXP(achievement.xpReward, `Achievement unlocked: ${achievement.title}`);

  // Notify user
  showToast({
    title:   `🏆 Achievement Unlocked!`,
    message: `${achievement.icon} ${achievement.title} — +${achievement.xpReward} XP`,
    type:    'success',
    duration: 5000,
  });

  document.dispatchEvent(
    new CustomEvent('achievementUnlocked', { detail: achievement })
  );

  // TODO: persist to Firestore
}

/** Return all achievements with unlock status merged. */
export function getAchievementsWithStatus() {
  const unlockedMap = new Map(
    state.get('achievements').map(a => [a.id, a.unlockedAt])
  );
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked:   unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) ?? null,
  }));
}
