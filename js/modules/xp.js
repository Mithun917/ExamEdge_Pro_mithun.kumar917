/**
 * ExamEdge Pro — modules/xp.js
 * XP & levelling system. Awards XP, tracks level-ups, streak bonuses.
 */

import { state }      from '../state.js';
import { CONFIG }     from '../config.js';
import { showToast, formatXP } from '../utils.js';

const LEVELS = CONFIG.XP.LEVEL_THRESHOLDS;

export function initXP() {
  // Recompute level from persisted XP on load
  const xp    = state.get('xp');
  const level = xpToLevel(xp);
  state.set('level', level);
  console.log(`[XP] Level ${level} | ${xp} XP`);
}

/**
 * Award XP to the current user.
 * @param {number} amount   - XP to award
 * @param {string} [reason] - display reason for the toast
 */
export function awardXP(amount, reason = '') {
  const current  = state.get('xp');
  const newXP    = current + amount;
  const prevLevel = xpToLevel(current);
  const newLevel  = xpToLevel(newXP);

  state.set('xp', newXP);

  // Level-up notification
  if (newLevel > prevLevel) {
    state.set('level', newLevel);
    showToast({
      title:   `🎉 Level Up! You're now Level ${newLevel}`,
      message: `Keep studying to reach Level ${newLevel + 1}!`,
      type:    'success',
      duration: 5000,
    });
    document.dispatchEvent(new CustomEvent('levelUp', { detail: { level: newLevel } }));
  } else {
    showToast({
      title:   `+${amount} XP`,
      message: reason || 'Keep it up!',
      type:    'info',
      duration: 2000,
    });
  }

  // TODO: sync to Firestore: updateDocument('users', uid, { xp: newXP, level: newLevel })
  return { xp: newXP, level: newLevel };
}

/**
 * Get the XP needed to reach the next level.
 * @returns {{ current: number, next: number, progress: number }}
 */
export function getLevelProgress() {
  const xp    = state.get('xp');
  const level = state.get('level');
  const floor = LEVELS[level - 1] ?? 0;
  const ceil  = LEVELS[level]     ?? Infinity;
  const range = ceil - floor;
  const done  = xp - floor;
  return {
    current:  xp,
    floor,
    ceil,
    progress: range > 0 ? Math.min(1, done / range) : 1,
    level,
  };
}

/**
 * Map an XP total to the corresponding level number.
 * @param {number} xp
 * @returns {number}
 */
export function xpToLevel(xp) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) level = i + 1;
  }
  return level;
}

/** Apply a daily streak bonus if the user hasn't studied today. */
export function applyStreakBonus() {
  const last   = state.get('lastStudyDate');
  const today  = new Date().toDateString();
  if (last === today) return;

  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const streak    = last === yesterday ? (state.get('streak') || 0) + 1 : 1;

  state.set('streak',        streak);
  state.set('lastStudyDate', today);

  const bonus = CONFIG.XP.STREAK_BONUS_PER_DAY * streak;
  awardXP(bonus, `🔥 ${streak}-day streak bonus!`);
}
