/**
 * ExamEdge Pro — state.js
 * Lightweight reactive state manager.
 * Supports get/set/subscribe/unsubscribe.
 * Persists whitelisted keys to localStorage automatically.
 */

import { CONFIG } from './config.js';

/* ── Initial State Shape ─────────────────────────────────── */

const INITIAL_STATE = {
  // Auth
  user:           null,     // { uid, displayName, email, photoURL, role }
  isAuthenticated: false,

  // UI
  theme:          'dark',   // 'dark' | 'light'
  sidebarOpen:    true,
  currentRoute:   '#dashboard',

  // Gamification
  xp:             0,
  level:          1,
  streak:         0,
  lastStudyDate:  null,

  // Practice session
  practiceSession: null,
  // { questions:[], currentIndex:0, answers:{}, startedAt, mode }

  // Mock exam session
  mockSession: null,
  // { examId, questions:[], currentIndex:0, answers:{}, startedAt, duration }

  // Live exam session
  examSession: null,

  // Achievements
  achievements:   [],

  // Leaderboard cache
  leaderboard:    [],
  leaderboardLastFetched: null,

  // Analytics
  analytics: {
    totalQuestionsAttempted: 0,
    totalCorrect:            0,
    subjectScores:           {},
    studyTimeMinutes:        0,
    examHistory:             [],
  },
};

/* ── Persistence whitelist ────────────────────────────────── */
const PERSIST_KEYS = new Set([
  'theme', 'xp', 'level', 'streak', 'lastStudyDate', 'analytics',
]);

/* ── State Store ─────────────────────────────────────────── */

class StateStore {
  #data        = { ...INITIAL_STATE };
  #subscribers = new Map(); // key → Set<callback>

  constructor() {
    this.#loadPersisted();
  }

  // ── Read ─────────────────────────────────────────────── //

  /**
   * Get a top-level state value.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this.#data[key];
  }

  /** Return a shallow copy of the entire state (read-only use). */
  getAll() {
    return { ...this.#data };
  }

  // ── Write ─────────────────────────────────────────────── //

  /**
   * Set a top-level state value and notify subscribers.
   * @param {string} key
   * @param {*}      value
   */
  set(key, value) {
    const prev = this.#data[key];
    this.#data[key] = value;

    if (PERSIST_KEYS.has(key)) {
      this.#persist(key, value);
    }

    this.#notify(key, value, prev);
  }

  /**
   * Shallow-merge an object into state (top-level keys only).
   * @param {object} patch
   */
  patch(patch) {
    Object.entries(patch).forEach(([k, v]) => this.set(k, v));
  }

  /**
   * Deep-merge a partial object into a nested state key.
   * @param {string} key
   * @param {object} partial
   */
  merge(key, partial) {
    const current = this.#data[key];
    if (typeof current !== 'object' || current === null) {
      this.set(key, partial);
    } else {
      this.set(key, { ...current, ...partial });
    }
  }

  /** Reset state to initial values (useful for logout). */
  reset() {
    this.#data = { ...INITIAL_STATE };
    // Clear persisted keys
    PERSIST_KEYS.forEach(k => {
      try { localStorage.removeItem(CONFIG.STORAGE_KEYS[k.toUpperCase()] ?? `ee_${k}`); } catch {}
    });
    // Notify all subscribers
    Object.keys(this.#data).forEach(k => this.#notify(k, this.#data[k], undefined));
  }

  // ── Subscriptions ─────────────────────────────────────── //

  /**
   * Subscribe to changes on a specific key.
   * @param {string}   key
   * @param {Function} callback  - called with (newValue, prevValue)
   * @returns {Function} unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.#subscribers.has(key)) {
      this.#subscribers.set(key, new Set());
    }
    this.#subscribers.get(key).add(callback);
    // Return unsubscribe fn
    return () => this.#subscribers.get(key)?.delete(callback);
  }

  // ── Private ───────────────────────────────────────────── //

  #notify(key, newVal, prevVal) {
    this.#subscribers.get(key)?.forEach(cb => {
      try { cb(newVal, prevVal); } catch (e) {
        console.error(`[State] Subscriber error for key "${key}":`, e);
      }
    });
    // Wildcard subscribers
    this.#subscribers.get('*')?.forEach(cb => {
      try { cb({ key, value: newVal, prev: prevVal }); } catch {}
    });
  }

  #persist(key, value) {
    try {
      const storageKey = CONFIG.STORAGE_KEYS[key.toUpperCase()] ?? `ee_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      console.warn('[State] Could not persist key:', key, e);
    }
  }

  #loadPersisted() {
    PERSIST_KEYS.forEach(key => {
      try {
        const storageKey = CONFIG.STORAGE_KEYS[key.toUpperCase()] ?? `ee_${key}`;
        const raw        = localStorage.getItem(storageKey);
        if (raw !== null) {
          this.#data[key] = JSON.parse(raw);
        }
      } catch {}
    });
  }
}

/** Singleton state instance — import this everywhere. */
export const state = new StateStore();
