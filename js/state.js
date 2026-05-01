/**
 * ================================================================
 * ExamEdge Pro — state.js
 * CENTRAL STATE MANAGER
 *
 * Single source of truth for all application data.
 * Every module reads from here. Every module writes through here.
 *
 * Features:
 *  ✅ setState(key, value)   — Write any state key
 *  ✅ getState(key)          — Read any state key
 *  ✅ updateUser(data)       — Dedicated user profile updater
 *  ✅ subscribe/unsubscribe  — Reactive listeners per key
 *  ✅ Middleware pipeline     — Intercept writes (validation, logging)
 *  ✅ State history           — Undo support (last N changes)
 *  ✅ Computed values         — Derived state (accuracy %, level name)
 *  ✅ localStorage sync       — Auto-persist whitelisted keys
 *  ✅ Firebase-ready hooks    — onSync callbacks for cloud write
 *  ✅ Batch updates           — Multiple keys, single notification pass
 *  ✅ Deep clone on read      — Prevents accidental mutation
 *  ✅ Reset / partial reset   — Logout and session clear
 *  ✅ Zero DOM manipulation   — Pure data layer only
 *
 * Architecture:
 *  StateStore (class, private)
 *    ├── #data          — Raw state object
 *    ├── #subscribers   — Per-key listener sets
 *    ├── #middleware     — Write interceptors
 *    ├── #history       — Change log (last 50 mutations)
 *    └── #firebaseHooks — Cloud sync callbacks
 *
 * Usage:
 *  import { setState, getState, updateUser, subscribe } from './state.js';
 *  // OR
 *  import { state } from './state.js';
 *  state.setState('xp', 500);
 *
 * Section Map:
 *  §1  Config & Imports
 *  §2  Initial State Shape
 *  §3  Persistence Config
 *  §4  StateStore Class
 *    §4a  Constructor
 *    §4b  getState() / getAll() / getSnapshot()
 *    §4c  setState() / setMany()
 *    §4d  updateUser()
 *    §4e  updateAnalytics()
 *    §4f  subscribe() / unsubscribe()
 *    §4g  Middleware
 *    §4h  Firebase Sync Hooks
 *    §4i  History & Undo
 *    §4j  Reset
 *    §4k  Computed Values
 *    §4l  Private Helpers
 *  §5  Singleton Export
 *  §6  Named Function Exports (convenience API)
 * ================================================================
 */


/* ================================================================
   §1  IMPORTS & CONFIG
   ================================================================ */

import { CONFIG } from './config.js';


/* ================================================================
   §2  INITIAL STATE SHAPE
   This is the single source of truth for ALL app data.
   Every key that the app uses must be declared here.
   ================================================================ */

const INITIAL_STATE = Object.freeze({

  /* ── Auth ───────────────────────────────────────────────── */
  user: null,
  /*  User shape when logged in:
   *  {
   *    uid:         string,
   *    displayName: string,
   *    email:       string,
   *    photoURL:    string | null,
   *    role:        'student' | 'admin' | 'teacher',
   *    createdAt:   ISO string,
   *    lastLoginAt: ISO string,
   *  }
   */

  isAuthenticated: false,
  authLoading:     true,   // true while auth state is being resolved

  /* ── UI / Preferences ───────────────────────────────────── */
  theme:         'dark',   // 'dark' | 'light'
  sidebarOpen:   true,
  currentRoute:  '#dashboard',
  previousRoute: null,
  isPageLoading: false,
  language:      'en',     // future i18n support

  /* ── Gamification ───────────────────────────────────────── */
  xp:            0,
  level:         1,
  streak:        0,
  lastStudyDate: null,     // ISO date string 'YYYY-MM-DD'
  totalStudyDays: 0,

  /* ── Achievements ───────────────────────────────────────── */
  achievements: [],
  /*  Each item: { id: string, unlockedAt: ISO string } */

  /* ── Milestones ─────────────────────────────────────────── */
  milestones: [],
  /*  Each item: { id: string, completedAt: ISO string } */

  /* ── Practice Session ───────────────────────────────────── */
  practiceSession: null,
  /*  Active session shape:
   *  {
   *    id:           string,
   *    questions:    Question[],
   *    currentIndex: number,
   *    answers:      { [questionId]: { chosen: number, correct: boolean } },
   *    startedAt:    ISO string,
   *    endedAt:      ISO string | null,
   *    score:        number | null,
   *    subject:      string | null,
   *    difficulty:   string | null,
   *  }
   */

  /* ── Mock Exam Session ──────────────────────────────────── */
  mockSession: null,
  /*  Active mock exam shape:
   *  {
   *    examId:           string,
   *    questions:        Question[],
   *    currentIndex:     number,
   *    answers:          { [questionId]: number },
   *    startedAt:        ISO string,
   *    endedAt:          ISO string | null,
   *    durationSeconds:  number,
   *    remainingSeconds: number,
   *    score:            number | null,
   *    passed:           boolean | null,
   *    submitted:        boolean,
   *  }
   */

  /* ── Live Exam Session ──────────────────────────────────── */
  examSession: null,
  /*  {
   *    examId:    string,
   *    code:      string,
   *    status:    'waiting' | 'active' | 'submitted',
   *    startedAt: ISO string | null,
   *  }
   */

  /* ── Analytics ──────────────────────────────────────────── */
  analytics: {
    totalQuestionsAttempted: 0,
    totalCorrect:            0,
    totalWrong:              0,
    studyTimeMinutes:        0,
    subjectScores:           {},
    /*  subjectScores shape:
     *  { [subjectId]: { attempted: number, correct: number, accuracy: number } }
     */
    examHistory: [],
    /*  Each item:
     *  {
     *    type:      'mock' | 'live' | 'practice',
     *    examId:    string,
     *    score:     number,
     *    passed:    boolean,
     *    date:      ISO string,
     *    questions: number,
     *    correct:   number,
     *  }
     */
    lastActiveDate: null,
    weeklyActivity: {},
    /*  { 'YYYY-MM-DD': questionsAnswered } */
  },

  /* ── Leaderboard ────────────────────────────────────────── */
  leaderboard:            [],
  leaderboardLastFetched: null,   // timestamp (ms)

  /* ── Notifications ──────────────────────────────────────── */
  notifications:          [],
  unreadNotifications:    0,

  /* ── Internal (not persisted, not exposed) ──────────────── */
  _lastSessionScore:  null,   // used by achievement checks
  _firebaseSyncQueue: [],     // queued writes for Firebase
});


/* ================================================================
   §3  PERSISTENCE CONFIGURATION
   Keys in PERSIST_KEYS are automatically saved to localStorage
   on every write and restored on startup.
   Keys in FIREBASE_SYNC_KEYS will be queued for Firestore
   when Firebase is connected.
   ================================================================ */

/** Keys auto-saved to localStorage */
const PERSIST_KEYS = new Set([
  'theme',
  'xp',
  'level',
  'streak',
  'lastStudyDate',
  'totalStudyDays',
  'analytics',
  'achievements',
  'milestones',
  'language',
]);

/** Keys that should sync to Firebase when connected */
const FIREBASE_SYNC_KEYS = new Set([
  'user',
  'xp',
  'level',
  'streak',
  'analytics',
  'achievements',
  'milestones',
]);

/** Keys that should NEVER be persisted (sensitive / transient) */
const EPHEMERAL_KEYS = new Set([
  'authLoading',
  'isPageLoading',
  'practiceSession',
  'mockSession',
  'examSession',
  '_lastSessionScore',
  '_firebaseSyncQueue',
]);

/** Maximum number of history entries to keep */
const MAX_HISTORY = 50;


/* ================================================================
   §4  STATE STORE CLASS
   ================================================================ */

class StateStore {

  /* ── §4a Constructor ────────────────────────────────────── */

  constructor() {
    /** Raw state data — never expose directly */
    this.#data = this.#deepClone(INITIAL_STATE);

    /** Per-key subscriber sets: Map<key, Set<Function>> */
    this.#subscribers = new Map();

    /** Middleware functions run before every setState */
    this.#middleware = [];

    /** Change history log */
    this.#history = [];

    /** Firebase sync callbacks registered by firebase.js */
    this.#firebaseHooks = [];

    /** Whether we are currently in a batch update */
    this.#batching = false;

    /** Keys changed during a batch — flushed at batch end */
    this.#batchQueue = new Map();

    // Restore persisted keys from localStorage
    this.#loadFromStorage();
  }

  // Private fields
  #data;
  #subscribers;
  #middleware;
  #history;
  #firebaseHooks;
  #batching;
  #batchQueue;


  /* ── §4b READ METHODS ───────────────────────────────────── */

  /**
   * Get a state value by key.
   * Returns a deep clone to prevent accidental mutation.
   *
   * @param {string} key - Top-level state key
   * @returns {*} Deep clone of the value, or undefined
   *
   * @example
   * const xp = getState('xp');
   * const user = getState('user');
   */
  getState(key) {
    if (!(key in this.#data)) {
      console.warn(`[State] getState("${key}") — key does not exist in state.`);
      return undefined;
    }
    const val = this.#data[key];
    // Return primitives as-is, clone objects/arrays
    return (val !== null && typeof val === 'object') ? this.#deepClone(val) : val;
  }

  /**
   * Alias for getState — keeps compatibility with older modules.
   * @param {string} key
   */
  get(key) {
    return this.getState(key);
  }

  /**
   * Get the entire state as a snapshot.
   * Returns a deep clone — safe for reading, not for mutation.
   *
   * @returns {object} Full state snapshot
   */
  getAll() {
    return this.#deepClone(this.#data);
  }

  /**
   * Get a snapshot for debugging — includes metadata.
   * @returns {object}
   */
  getSnapshot() {
    return {
      state:     this.#deepClone(this.#data),
      historyLength: this.#history.length,
      subscribers: Object.fromEntries(
        [...this.#subscribers.entries()].map(([k, v]) => [k, v.size])
      ),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if a key exists in state.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return key in this.#data;
  }


  /* ── §4c WRITE METHODS ──────────────────────────────────── */

  /**
   * Set a state value.
   * Runs middleware, records history, persists, and notifies subscribers.
   *
   * @param {string} key   - Top-level state key
   * @param {*}      value - New value
   * @param {object} [opts]
   * @param {boolean} [opts.silent=false]    — Skip subscriber notification
   * @param {boolean} [opts.skipHistory=false] — Skip history recording
   * @param {string}  [opts.source='app']    — Who set this (for debugging)
   * @returns {boolean} true if state was changed
   *
   * @example
   * setState('xp', 500);
   * setState('theme', 'light', { source: 'ThemeManager' });
   */
  setState(key, value, opts = {}) {
    const { silent = false, skipHistory = false, source = 'app' } = opts;

    // Reject ephemeral keys from being persisted (they can still be set)
    // Reject completely unknown keys in strict mode
    if (CONFIG.ENV === 'development' && !(key in this.#data)) {
      console.warn(`[State] setState("${key}") — key not in INITIAL_STATE. Add it first.`);
    }

    const prev = this.#data[key];

    // ── Run middleware pipeline ──────────────────────────────
    const context = { key, value, prev, source };
    for (const mw of this.#middleware) {
      const result = mw(context);
      if (result === false) {
        // Middleware rejected this write
        console.warn(`[State] Write to "${key}" blocked by middleware.`);
        return false;
      }
      // Middleware may transform the value
      if (result !== undefined && result !== true) {
        context.value = result;
      }
    }

    const nextValue = context.value;

    // Skip if value hasn't changed (shallow comparison for primitives)
    if (nextValue === prev) return false;

    // ── Write ────────────────────────────────────────────────
    this.#data[key] = nextValue;

    // ── Record history ───────────────────────────────────────
    if (!skipHistory && !EPHEMERAL_KEYS.has(key)) {
      this.#pushHistory({ key, value: nextValue, prev, source, ts: Date.now() });
    }

    // ── Persist to localStorage ──────────────────────────────
    if (PERSIST_KEYS.has(key) && !EPHEMERAL_KEYS.has(key)) {
      this.#saveToStorage(key, nextValue);
    }

    // ── Queue Firebase sync ──────────────────────────────────
    if (FIREBASE_SYNC_KEYS.has(key)) {
      this.#queueFirebaseSync(key, nextValue);
    }

    // ── Notify subscribers ───────────────────────────────────
    if (!silent) {
      if (this.#batching) {
        // Defer notification until batch ends
        this.#batchQueue.set(key, { value: nextValue, prev });
      } else {
        this.#notify(key, nextValue, prev);
      }
    }

    return true;
  }

  /**
   * Alias for setState — keeps compatibility with older modules.
   */
  set(key, value) {
    return this.setState(key, value);
  }

  /**
   * Set multiple keys at once.
   * All notifications are batched and fired after all writes complete.
   *
   * @param {object} updates - { key: value, ... }
   * @param {object} [opts]
   *
   * @example
   * setMany({ xp: 500, level: 3, streak: 7 });
   */
  setMany(updates, opts = {}) {
    this.batch(() => {
      Object.entries(updates).forEach(([key, value]) => {
        this.setState(key, value, { ...opts, silent: false });
      });
    });
  }

  /**
   * Alias for setMany — keeps compatibility.
   * @param {object} patch
   */
  patch(patch) {
    return this.setMany(patch);
  }

  /**
   * Deep-merge a partial object into a nested state key.
   * Useful for updating nested objects like analytics.
   *
   * @param {string} key     - Top-level state key (must be an object)
   * @param {object} partial - Partial object to merge in
   *
   * @example
   * merge('analytics', { totalCorrect: 50 });
   * merge('user', { displayName: 'New Name' });
   */
  merge(key, partial) {
    const current = this.#data[key];
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      console.warn(`[State] merge("${key}") — target must be a plain object.`);
      this.setState(key, partial);
      return;
    }
    this.setState(key, { ...current, ...partial });
  }

  /**
   * Run multiple state writes in a batch.
   * Subscribers are notified only ONCE after all writes finish,
   * not after each individual write.
   *
   * @param {Function} fn - Function containing multiple setState calls
   *
   * @example
   * batch(() => {
   *   setState('xp', 500);
   *   setState('level', 3);
   *   setState('streak', 7);
   * });
   * // Subscribers notified once with all 3 changes
   */
  batch(fn) {
    this.#batching = true;
    this.#batchQueue.clear();

    try {
      fn();
    } finally {
      this.#batching = false;
      // Flush all queued notifications
      this.#batchQueue.forEach(({ value, prev }, key) => {
        this.#notify(key, value, prev);
      });
      this.#batchQueue.clear();
    }
  }


  /* ── §4d USER METHODS ───────────────────────────────────── */

  /**
   * Update the current user's profile.
   * Merges partial data into the existing user object.
   * Does NOT perform any auth operations — purely state update.
   *
   * @param {object} data - Partial user fields to update
   * @param {object} [opts]
   * @param {boolean} [opts.replace=false] — Replace entire user object instead of merging
   *
   * @example
   * updateUser({ displayName: 'Arjun Sharma', photoURL: '...' });
   * updateUser({ role: 'premium' });
   */
  updateUser(data, opts = {}) {
    const { replace = false } = opts;

    if (!data || typeof data !== 'object') {
      console.warn('[State] updateUser() — data must be a plain object.');
      return;
    }

    if (replace) {
      this.setState('user', data, { source: 'updateUser' });
      this.setState('isAuthenticated', !!data?.uid, { source: 'updateUser' });
      return;
    }

    const current = this.#data.user || {};
    const updated  = {
      ...current,
      ...data,
      // Always stamp lastUpdatedAt
      lastUpdatedAt: new Date().toISOString(),
    };

    this.batch(() => {
      this.setState('user',            updated,       { source: 'updateUser' });
      this.setState('isAuthenticated', !!updated.uid, { source: 'updateUser' });
    });

    // Persist user to localStorage (not in PERSIST_KEYS above,
    // handled manually here so sensitive fields can be filtered)
    this.#saveUserToStorage(updated);
  }

  /**
   * Clear the current user (logout).
   * Wipes user-related state but keeps preferences (theme, etc.)
   */
  clearUser() {
    this.batch(() => {
      this.setState('user',            null,  { source: 'clearUser' });
      this.setState('isAuthenticated', false, { source: 'clearUser' });
      this.setState('authLoading',     false, { source: 'clearUser' });
    });
    try { localStorage.removeItem(CONFIG.STORAGE_KEYS.USER); } catch {}
  }

  /**
   * Get the currently logged-in user.
   * Convenience wrapper around getState('user').
   *
   * @returns {{ uid, displayName, email, role, ... } | null}
   */
  getUser() {
    return this.getState('user');
  }

  /**
   * Check if a user is currently authenticated.
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.#data.isAuthenticated === true && !!this.#data.user?.uid;
  }


  /* ── §4e ANALYTICS METHODS ──────────────────────────────── */

  /**
   * Update analytics data.
   * Deep-merges into the analytics object — safe to call with partial data.
   *
   * @param {object} updates - Partial analytics fields
   *
   * @example
   * updateAnalytics({ totalQuestionsAttempted: 101, totalCorrect: 85 });
   */
  updateAnalytics(updates) {
    const current = this.#data.analytics || {};
    const next    = this.#deepMerge(current, updates);
    this.setState('analytics', next, { source: 'updateAnalytics' });
  }

  /**
   * Record a single question result into analytics.
   *
   * @param {{ subject: string, correct: boolean, timeSpentSeconds?: number }} result
   */
  recordQuestion({ subject, correct, timeSpentSeconds = 0 }) {
    const a      = this.#deepClone(this.#data.analytics);
    const today  = new Date().toISOString().split('T')[0];

    a.totalQuestionsAttempted += 1;
    if (correct) a.totalCorrect += 1;
    else         a.totalWrong   += 1;

    a.studyTimeMinutes += Math.round(timeSpentSeconds / 60);
    a.lastActiveDate    = today;

    // Weekly activity heatmap
    a.weeklyActivity         = a.weeklyActivity || {};
    a.weeklyActivity[today]  = (a.weeklyActivity[today] || 0) + 1;

    // Subject breakdown
    if (subject) {
      a.subjectScores         = a.subjectScores || {};
      const s                 = a.subjectScores[subject] || { attempted: 0, correct: 0, accuracy: 0 };
      s.attempted            += 1;
      if (correct) s.correct += 1;
      s.accuracy              = Math.round((s.correct / s.attempted) * 100);
      a.subjectScores[subject] = s;
    }

    this.setState('analytics', a, { source: 'recordQuestion' });
  }

  /**
   * Append an exam result to the history.
   *
   * @param {{ type, examId, score, passed, questions, correct }} result
   */
  recordExamResult(result) {
    const a = this.#deepClone(this.#data.analytics);
    a.examHistory = [
      ...(a.examHistory || []),
      { ...result, date: new Date().toISOString() },
    ];
    this.setState('analytics', a, { source: 'recordExamResult' });
  }


  /* ── §4f SUBSCRIPTION METHODS ───────────────────────────── */

  /**
   * Subscribe to state changes for a specific key.
   * Returns an unsubscribe function — call it to stop listening.
   *
   * Special key '*' subscribes to ALL state changes.
   *
   * @param {string}   key      - State key to watch (or '*' for all)
   * @param {Function} callback - Called with (newValue, prevValue)
   * @returns {Function} Unsubscribe function
   *
   * @example
   * const unsub = subscribe('xp', (newXP, oldXP) => {
   *   console.log(`XP changed: ${oldXP} → ${newXP}`);
   * });
   * // Later:
   * unsub(); // stop listening
   *
   * // Watch ALL changes:
   * subscribe('*', ({ key, value, prev }) => {
   *   console.log(`State["${key}"] changed`);
   * });
   */
  subscribe(key, callback) {
    if (typeof callback !== 'function') {
      console.warn('[State] subscribe() — callback must be a function.');
      return () => {};
    }

    if (!this.#subscribers.has(key)) {
      this.#subscribers.set(key, new Set());
    }

    this.#subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.#subscribers.get(key)?.delete(callback);
      // Clean up empty subscriber sets
      if (this.#subscribers.get(key)?.size === 0) {
        this.#subscribers.delete(key);
      }
    };
  }

  /**
   * Subscribe to multiple keys at once.
   *
   * @param {string[]} keys     - Array of state keys
   * @param {Function} callback - Called with (key, newValue, prevValue)
   * @returns {Function} Unsubscribe function (unsubscribes from all)
   *
   * @example
   * const unsub = subscribeMany(['xp', 'level', 'streak'], (key, val) => {
   *   updateUI(key, val);
   * });
   */
  subscribeMany(keys, callback) {
    const unsubs = keys.map(key =>
      this.subscribe(key, (val, prev) => callback(key, val, prev))
    );
    return () => unsubs.forEach(fn => fn());
  }

  /**
   * Subscribe to a key and immediately call callback with current value.
   * Useful for initializing UI from current state.
   *
   * @param {string}   key
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   *
   * @example
   * subscribeImmediate('xp', (xp) => renderXPBar(xp));
   * // Called immediately with current XP, then on every change
   */
  subscribeImmediate(key, callback) {
    // Call once immediately with current value
    try { callback(this.getState(key), undefined); } catch {}
    // Then subscribe normally
    return this.subscribe(key, callback);
  }


  /* ── §4g MIDDLEWARE ─────────────────────────────────────── */

  /**
   * Add a middleware function to the write pipeline.
   * Middleware runs before every setState call.
   *
   * Return values from middleware:
   *   undefined / true  → allow write with original value
   *   false             → block the write entirely
   *   any other value   → use as the new transformed value
   *
   * @param {Function} fn - Middleware: ({ key, value, prev, source }) => result
   * @returns {Function}  Remove-middleware function
   *
   * @example
   * // Validation middleware
   * addMiddleware(({ key, value }) => {
   *   if (key === 'xp' && value < 0) return 0; // clamp to 0
   *   if (key === 'level' && value > 100) return false; // block
   * });
   */
  addMiddleware(fn) {
    this.#middleware.push(fn);
    return () => {
      this.#middleware = this.#middleware.filter(m => m !== fn);
    };
  }


  /* ── §4h FIREBASE SYNC HOOKS ────────────────────────────── */

  /**
   * Register a Firebase sync hook.
   * Called automatically whenever a FIREBASE_SYNC_KEY is updated.
   * firebase.js registers this hook to push changes to Firestore.
   *
   * @param {Function} fn - ({ key, value, uid }) => Promise<void>
   * @returns {Function} Unregister function
   *
   * @example
   * // In firebase.js:
   * state.onFirebaseSync(async ({ key, value, uid }) => {
   *   await updateDocument('users', uid, { [key]: value });
   * });
   */
  onFirebaseSync(fn) {
    this.#firebaseHooks.push(fn);
    return () => {
      this.#firebaseHooks = this.#firebaseHooks.filter(h => h !== fn);
    };
  }

  /**
   * Manually trigger a Firebase sync for a specific key.
   * Used after reconnecting or when offline queue needs flushing.
   *
   * @param {string} key
   */
  async syncToFirebase(key) {
    const value = this.#data[key];
    const uid   = this.#data.user?.uid;

    if (!uid) return;

    for (const hook of this.#firebaseHooks) {
      try {
        await hook({ key, value, uid });
      } catch (err) {
        console.error(`[State] Firebase sync failed for "${key}":`, err);
      }
    }
  }

  /**
   * Flush all queued Firebase syncs.
   * Call this after reconnecting to internet.
   */
  async flushFirebaseQueue() {
    const queue = [...(this.#data._firebaseSyncQueue || [])];
    if (!queue.length) return;

    this.setState('_firebaseSyncQueue', [], { silent: true, skipHistory: true });

    for (const { key, value } of queue) {
      await this.syncToFirebase(key);
    }
  }


  /* ── §4i HISTORY & UNDO ─────────────────────────────────── */

  /**
   * Get the change history log.
   * @param {number} [limit] - Max entries to return (default: all)
   * @returns {Array<{ key, value, prev, source, ts }>}
   */
  getHistory(limit) {
    const h = [...this.#history].reverse(); // newest first
    return limit ? h.slice(0, limit) : h;
  }

  /**
   * Undo the last state change.
   * Restores the previous value for the most recently changed key.
   *
   * @returns {boolean} true if undo was successful
   *
   * @example
   * setState('xp', 0);     // accidentally reset XP
   * undo();                 // XP restored to previous value
   */
  undo() {
    const last = this.#history.pop();
    if (!last) return false;

    this.setState(last.key, last.prev, {
      source:      'undo',
      skipHistory: true, // don't record the undo in history
    });

    return true;
  }

  /**
   * Clear the history log.
   */
  clearHistory() {
    this.#history = [];
  }


  /* ── §4j RESET METHODS ──────────────────────────────────── */

  /**
   * Full reset — wipes ALL state back to initial values.
   * Clears localStorage and notifies all subscribers.
   * Use on logout.
   */
  reset() {
    const prev = this.#deepClone(this.#data);

    // Reset to initial
    this.#data = this.#deepClone(INITIAL_STATE);

    // Clear all persisted storage
    PERSIST_KEYS.forEach(key => {
      const storageKey = this.#getStorageKey(key);
      try { localStorage.removeItem(storageKey); } catch {}
    });
    try { localStorage.removeItem(CONFIG.STORAGE_KEYS.USER); } catch {}

    // Clear history
    this.#history = [];

    // Notify all active subscribers
    this.#subscribers.forEach((callbacks, key) => {
      if (key === '*') return;
      callbacks.forEach(cb => {
        try { cb(this.#data[key], prev[key]); } catch {}
      });
    });

    console.info('[State] Full reset complete.');
  }

  /**
   * Partial reset — resets only session-related state.
   * Keeps user preferences (theme, language) and achievements.
   * Use between exam sessions.
   */
  resetSession() {
    this.batch(() => {
      this.setState('practiceSession', null, { skipHistory: true });
      this.setState('mockSession',     null, { skipHistory: true });
      this.setState('examSession',     null, { skipHistory: true });
      this.setState('_lastSessionScore', null, { skipHistory: true });
    });
  }

  /**
   * Reset only analytics data.
   */
  resetAnalytics() {
    this.setState('analytics', this.#deepClone(INITIAL_STATE.analytics));
  }


  /* ── §4k COMPUTED VALUES ────────────────────────────────── */

  /**
   * Computed values — derived from raw state.
   * These are NOT stored in state; they are calculated on the fly.
   * Access via state.computed.xxx
   */
  get computed() {
    const data = this.#data;

    return {
      /**
       * Overall accuracy as a percentage (0–100).
       * @returns {number}
       */
      get accuracy() {
        const { totalQuestionsAttempted: t, totalCorrect: c } = data.analytics;
        return t > 0 ? Math.round((c / t) * 100) : 0;
      },

      /**
       * XP progress within the current level.
       * @returns {{ floor, ceil, progress, xpToNext }}
       */
      get levelProgress() {
        const xp     = data.xp;
        const levels = CONFIG.XP.LEVEL_THRESHOLDS;
        const lv     = data.level;
        const floor  = levels[lv - 1] ?? 0;
        const ceil   = levels[lv]     ?? Infinity;
        const range  = ceil === Infinity ? 1 : ceil - floor;
        const done   = xp - floor;
        return {
          floor,
          ceil,
          progress:  Math.min(1, range > 0 ? done / range : 1),
          xpToNext:  ceil === Infinity ? 0 : Math.max(0, ceil - xp),
        };
      },

      /**
       * Level name / title based on current level.
       * @returns {string}
       */
      get levelTitle() {
        const titles = [
          '', 'Beginner', 'Learner', 'Explorer', 'Practitioner',
          'Achiever', 'Scholar', 'Expert', 'Master', 'Champion', 'Legend',
        ];
        return titles[data.level] ?? `Level ${data.level}`;
      },

      /**
       * Whether the user studied today (streak is alive).
       * @returns {boolean}
       */
      get studiedToday() {
        const today = new Date().toISOString().split('T')[0];
        return data.lastStudyDate === today;
      },

      /**
       * Number of exam attempts.
       * @returns {number}
       */
      get totalExams() {
        return data.analytics.examHistory?.length ?? 0;
      },

      /**
       * Pass rate across all exams.
       * @returns {number} percentage 0–100
       */
      get passRate() {
        const history = data.analytics.examHistory ?? [];
        if (!history.length) return 0;
        const passed = history.filter(e => e.passed).length;
        return Math.round((passed / history.length) * 100);
      },

      /**
       * User's strongest subject by accuracy.
       * @returns {string | null}
       */
      get strongestSubject() {
        const scores = data.analytics.subjectScores ?? {};
        const entries = Object.entries(scores)
          .filter(([, s]) => s.attempted >= 5)
          .sort(([, a], [, b]) => b.accuracy - a.accuracy);
        return entries[0]?.[0] ?? null;
      },

      /**
       * User's weakest subject by accuracy.
       * @returns {string | null}
       */
      get weakestSubject() {
        const scores = data.analytics.subjectScores ?? {};
        const entries = Object.entries(scores)
          .filter(([, s]) => s.attempted >= 5)
          .sort(([, a], [, b]) => a.accuracy - b.accuracy);
        return entries[0]?.[0] ?? null;
      },

      /**
       * Display name — first name only.
       * @returns {string}
       */
      get firstName() {
        return data.user?.displayName?.split(' ')[0] ?? 'Student';
      },

      /**
       * Avatar initials (max 2 chars).
       * @returns {string}
       */
      get initials() {
        const name = data.user?.displayName ?? '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      },

      /**
       * Is this a premium user?
       * @returns {boolean}
       */
      get isPremium() {
        return data.user?.role === 'premium' || data.user?.role === 'admin';
      },
    };
  }


  /* ── §4l PRIVATE HELPERS ────────────────────────────────── */

  /** Fire all subscribers for a key */
  #notify(key, newVal, prevVal) {
    // Key-specific subscribers
    this.#subscribers.get(key)?.forEach(cb => {
      try { cb(newVal, prevVal); } catch (err) {
        console.error(`[State] Subscriber error on key "${key}":`, err);
      }
    });

    // Wildcard subscribers (called with full context object)
    this.#subscribers.get('*')?.forEach(cb => {
      try { cb({ key, value: newVal, prev: prevVal }); } catch {}
    });
  }

  /** Get localStorage key for a state key */
  #getStorageKey(key) {
    return CONFIG.STORAGE_KEYS[key.toUpperCase()] ?? `ee_${key}`;
  }

  /** Save a single key to localStorage */
  #saveToStorage(key, value) {
    try {
      const storageKey = this.#getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (err) {
      console.warn(`[State] Could not persist "${key}":`, err);
    }
  }

  /** Save user to localStorage (filtering sensitive fields if needed) */
  #saveUserToStorage(user) {
    if (!user) return;
    try {
      // Do NOT store passwords or tokens in localStorage
      const safe = { ...user };
      delete safe.password;
      delete safe.token;
      delete safe.refreshToken;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(safe));
    } catch {}
  }

  /** Load all persisted keys from localStorage on startup */
  #loadFromStorage() {
    // Load PERSIST_KEYS
    PERSIST_KEYS.forEach(key => {
      try {
        const storageKey = this.#getStorageKey(key);
        const raw        = localStorage.getItem(storageKey);
        if (raw !== null) {
          this.#data[key] = JSON.parse(raw);
        }
      } catch {}
    });

    // Load user separately
    try {
      const rawUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
      if (rawUser) {
        const user = JSON.parse(rawUser);
        this.#data.user            = user;
        this.#data.isAuthenticated = !!user?.uid;
      }
    } catch {}

    // Mark auth as resolved (not loading from storage)
    this.#data.authLoading = false;
  }

  /** Queue a key for Firebase sync */
  #queueFirebaseSync(key, value) {
    const uid = this.#data.user?.uid;

    if (this.#firebaseHooks.length > 0 && uid) {
      // Firebase is connected — sync immediately (async, fire-and-forget)
      Promise.all(
        this.#firebaseHooks.map(hook =>
          hook({ key, value, uid }).catch(err =>
            console.error(`[State] Firebase hook error for "${key}":`, err)
          )
        )
      );
    } else if (uid) {
      // Firebase not connected yet — queue for later
      const queue = this.#data._firebaseSyncQueue || [];
      this.#data._firebaseSyncQueue = [...queue, { key, value, uid, ts: Date.now() }];
    }
  }

  /** Push to history log, trim if over limit */
  #pushHistory(entry) {
    this.#history.push(entry);
    if (this.#history.length > MAX_HISTORY) {
      this.#history.shift(); // Remove oldest
    }
  }

  /** Deep clone a value (handles nested objects and arrays) */
  #deepClone(value) {
    if (value === null || typeof value !== 'object') return value;
    try {
      return structuredClone(value);
    } catch {
      // Fallback for environments without structuredClone
      return JSON.parse(JSON.stringify(value));
    }
  }

  /** Deep merge two plain objects */
  #deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        result[key] = this.#deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}


/* ================================================================
   §5  SINGLETON EXPORT
   One instance shared across the entire app.
   Import `state` everywhere — never create a new StateStore.
   ================================================================ */

/** @type {StateStore} */
export const state = new StateStore();

// Expose to window in development for debugging in browser console
if (CONFIG.ENV === 'development' && typeof window !== 'undefined') {
  window.__examEdgeState = {
    get:      (k)    => state.getState(k),
    getAll:   ()     => state.getAll(),
    set:      (k, v) => state.setState(k, v),
    snapshot: ()     => state.getSnapshot(),
    history:  (n)    => state.getHistory(n),
    reset:    ()     => state.reset(),
    computed: state.computed,
  };
  console.info('[State] Debug API: window.__examEdgeState');
}


/* ================================================================
   §6  NAMED FUNCTION EXPORTS  (Convenience / Shorthand API)
   Modules can import these directly instead of using state.xxx()
   Both styles work:
     import { setState } from './state.js';
     setState('xp', 500);
   OR:
     import { state } from './state.js';
     state.setState('xp', 500);
   ================================================================ */

/**
 * Get a state value by key.
 * @param {string} key
 * @returns {*}
 */
export function getState(key) {
  return state.getState(key);
}

/**
 * Set a state value.
 * @param {string} key
 * @param {*}      value
 * @param {object} [opts]
 */
export function setState(key, value, opts) {
  return state.setState(key, value, opts);
}

/**
 * Set multiple state values at once (batched notifications).
 * @param {object} updates
 */
export function setMany(updates) {
  return state.setMany(updates);
}

/**
 * Merge partial data into a nested state key.
 * @param {string} key
 * @param {object} partial
 */
export function mergeState(key, partial) {
  return state.merge(key, partial);
}

/**
 * Update the current user's profile.
 * @param {object}  data
 * @param {object}  [opts]
 */
export function updateUser(data, opts) {
  return state.updateUser(data, opts);
}

/**
 * Clear the current user (logout).
 */
export function clearUser() {
  return state.clearUser();
}

/**
 * Get the current user object.
 * @returns {{ uid, displayName, email, role } | null}
 */
export function getUser() {
  return state.getUser();
}

/**
 * Subscribe to a state key.
 * @param {string}   key
 * @param {Function} callback
 * @returns {Function} Unsubscribe
 */
export function subscribe(key, callback) {
  return state.subscribe(key, callback);
}

/**
 * Subscribe to multiple state keys.
 * @param {string[]} keys
 * @param {Function} callback - (key, newValue, prevValue) => void
 * @returns {Function} Unsubscribe all
 */
export function subscribeMany(keys, callback) {
  return state.subscribeMany(keys, callback);
}

/**
 * Subscribe to a key and fire immediately with current value.
 * @param {string}   key
 * @param {Function} callback
 * @returns {Function} Unsubscribe
 */
export function subscribeImmediate(key, callback) {
  return state.subscribeImmediate(key, callback);
}

/**
 * Update analytics data (deep merge).
 * @param {object} updates
 */
export function updateAnalytics(updates) {
  return state.updateAnalytics(updates);
}

/**
 * Record a single question result.
 * @param {{ subject, correct, timeSpentSeconds }} result
 */
export function recordQuestion(result) {
  return state.recordQuestion(result);
}

/**
 * Record an exam completion result.
 * @param {object} result
 */
export function recordExamResult(result) {
  return state.recordExamResult(result);
}

/**
 * Batch multiple state updates.
 * @param {Function} fn
 */
export function batch(fn) {
  return state.batch(fn);
}

/**
 * Full state reset (logout).
 */
export function resetState() {
  return state.reset();
}

/**
 * Reset only session state.
 */
export function resetSession() {
  return state.resetSession();
}

/**
 * Undo the last state change.
 * @returns {boolean}
 */
export function undo() {
  return state.undo();
}

/**
 * Access computed/derived values.
 * @example
 * import { computed } from './state.js';
 * computed.accuracy    // → 88
 * computed.levelTitle  // → 'Scholar'
 * computed.firstName   // → 'Arjun'
 */
export const computed = new Proxy({}, {
  get(_, prop) {
    return state.computed[prop];
  },
});
