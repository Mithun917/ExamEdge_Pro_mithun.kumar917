/**
 * ExamEdge Pro — config.js
 * App-wide constants, feature flags, and configuration values.
 * Replace placeholders before deploying to production.
 */

export const CONFIG = Object.freeze({
  /* ── App Meta ─────────────────────────────────────────── */
  APP_NAME:    'ExamEdge Pro',
  VERSION:     '1.0.0',
  ENV:         'development', // 'development' | 'staging' | 'production'

  /* ── API / Firebase (filled in by firebase.js) ────────── */
  FIREBASE: {
    API_KEY:             '',
    AUTH_DOMAIN:         '',
    PROJECT_ID:          '',
    STORAGE_BUCKET:      '',
    MESSAGING_SENDER_ID: '',
    APP_ID:              '',
  },

  /* ── Feature Flags ────────────────────────────────────── */
  FEATURES: {
    LEADERBOARD:   true,
    ACHIEVEMENTS:  true,
    ANALYTICS:     true,
    MOCK_EXAM:     true,
    AI_HINTS:      false,  // future: AI-powered hints
    SOCIAL_SHARE:  false,
  },

  /* ── XP / Gamification ────────────────────────────────── */
  XP: {
    PRACTICE_QUESTION_CORRECT: 10,
    PRACTICE_QUESTION_WRONG:    2,
    MOCK_EXAM_COMPLETION:      50,
    STREAK_BONUS_PER_DAY:       5,
    LEVEL_THRESHOLDS: [
      0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5800,
    ],
  },

  /* ── Exam / Practice defaults ─────────────────────────── */
  EXAM: {
    DEFAULT_DURATION_MINUTES: 60,
    MAX_QUESTIONS_PER_SESSION: 50,
    PASSING_SCORE_PERCENT:     60,
    WARNING_TIME_SECONDS:     300, // 5 min warning
    DANGER_TIME_SECONDS:       60,
  },

  /* ── Local storage keys ───────────────────────────────── */
  STORAGE_KEYS: {
    USER:          'ee_user',
    SESSION:       'ee_session',
    PRACTICE_STATE:'ee_practice',
    MOCK_STATE:    'ee_mock',
    THEME:         'ee_theme',
    STREAK:        'ee_streak',
  },

  /* ── Subjects / Exam types ────────────────────────────── */
  SUBJECTS: [
    { id: 'general',    label: 'General Knowledge', icon: '🌐' },
    { id: 'math',       label: 'Mathematics',        icon: '📐' },
    { id: 'science',    label: 'Science',             icon: '🔬' },
    { id: 'english',    label: 'English',             icon: '📖' },
    { id: 'reasoning',  label: 'Logical Reasoning',  icon: '🧩' },
    { id: 'current',    label: 'Current Affairs',    icon: '📰' },
    { id: 'computers',  label: 'Computer Science',   icon: '💻' },
    { id: 'economics',  label: 'Economics',          icon: '📊' },
  ],

  DIFFICULTY_LEVELS: [
    { id: 'easy',   label: 'Easy',   color: 'success' },
    { id: 'medium', label: 'Medium', color: 'warning' },
    { id: 'hard',   label: 'Hard',   color: 'danger'  },
  ],
});
