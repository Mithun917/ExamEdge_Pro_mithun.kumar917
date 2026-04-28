/**
 * ExamEdge Pro — modules/leaderboard.js
 * Leaderboard: fetch, cache, and render ranked user data.
 */

import { state }    from '../state.js';
import { showToast } from '../utils.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/* ── Mock leaderboard data ────────────────────────────────── */
const MOCK_LEADERBOARD = [
  { uid: 'u1', displayName: 'Priya Nair',     xp: 12400, level: 10, streak: 21, accuracy: 94 },
  { uid: 'u2', displayName: 'Arjun Sharma',   xp: 9800,  level: 8,  streak: 14, accuracy: 88 },
  { uid: 'u3', displayName: 'Rahul Verma',    xp: 8200,  level: 7,  streak: 9,  accuracy: 82 },
  { uid: 'u4', displayName: 'Sneha Patel',    xp: 7600,  level: 7,  streak: 6,  accuracy: 79 },
  { uid: 'u5', displayName: 'Karan Mehta',    xp: 6900,  level: 6,  streak: 11, accuracy: 76 },
  { uid: 'u6', displayName: 'Ananya Singh',   xp: 5400,  level: 5,  streak: 4,  accuracy: 71 },
  { uid: 'u7', displayName: 'Vikram Rao',     xp: 4800,  level: 5,  streak: 2,  accuracy: 68 },
  { uid: 'u8', displayName: 'Deepika Nayar',  xp: 3200,  level: 4,  streak: 7,  accuracy: 65 },
  { uid: 'u9', displayName: 'Aditya Kumar',   xp: 2100,  level: 3,  streak: 1,  accuracy: 61 },
  { uid: 'u10',displayName: 'Meera Joshi',    xp: 1500,  level: 2,  streak: 3,  accuracy: 58 },
];

/* ── Init ────────────────────────────────────────────────── */

export function initLeaderboard() {
  console.log('[Leaderboard] Module ready.');
}

/* ── Fetch ───────────────────────────────────────────────── */

/**
 * Fetch the leaderboard. Uses cache if fresh.
 * @param {{ force?: boolean }} opts
 * @returns {Promise<Array>}
 */
export async function fetchLeaderboard({ force = false } = {}) {
  const lastFetched = state.get('leaderboardLastFetched');
  const cached      = state.get('leaderboard');

  if (!force && cached.length && lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) {
    return cached;
  }

  try {
    // TODO: query Firestore 'users' collection ordered by XP
    // const data = await queryCollection('users', orderBy('xp', 'desc'), limit(50));
    const data = MOCK_LEADERBOARD; // mock

    const ranked = data.map((entry, i) => ({ ...entry, rank: i + 1 }));
    state.patch({ leaderboard: ranked, leaderboardLastFetched: Date.now() });
    return ranked;
  } catch (err) {
    console.error('[Leaderboard] Fetch failed:', err);
    showToast({ title: 'Leaderboard unavailable', type: 'error' });
    return [];
  }
}

/**
 * Get the current user's rank from the leaderboard.
 * @returns {number|null}
 */
export function getCurrentUserRank() {
  const uid  = state.get('user')?.uid;
  const list = state.get('leaderboard');
  return list.find(e => e.uid === uid)?.rank ?? null;
}
