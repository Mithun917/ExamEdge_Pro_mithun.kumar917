/**
 * ================================================================
 * ExamEdge Pro — config.js
 * CENTRAL CONFIGURATION FILE
 *
 * This is the single source of truth for ALL app-wide constants.
 * No magic numbers anywhere else in the codebase — they live here.
 *
 * Rules:
 *  ✅ Only plain data (strings, numbers, booleans, arrays, objects)
 *  ✅ Fully frozen — nothing can be changed at runtime
 *  ✅ Imported by every module that needs constants
 *  ❌ No functions, no classes, no imports, no side effects
 *  ❌ Never put secrets here — Firebase keys go in .env
 *
 * How to use:
 *  import { CONFIG } from './config.js';
 *  CONFIG.APP_NAME          // → 'ExamEdge Pro'
 *  CONFIG.XP.CORRECT_ANSWER // → 10
 *  CONFIG.FEATURES.ANALYTICS// → true
 *
 * Section Map:
 *  §1  App Identity
 *  §2  Environment
 *  §3  Firebase Config  ← Fill this when Firebase is ready
 *  §4  API Endpoints
 *  §5  Feature Flags
 *  §6  Default Settings
 *  §7  XP & Gamification
 *  §8  Exam Settings
 *  §9  Practice Settings
 *  §10 Subjects & Topics
 *  §11 Difficulty Levels
 *  §12 Storage Keys
 *  §13 Route Definitions
 *  §14 UI / Appearance
 *  §15 Validation Rules
 *  §16 Error Messages
 *  §17 Success Messages
 *  §18 Limits & Thresholds
 *  §19 Regex Patterns
 *  §20 Date & Time
 * ================================================================
 */


export const CONFIG = Object.freeze({

  /* ================================================================
     §1  APP IDENTITY
     Basic information about the application itself.
     Update VERSION on every release.
     ================================================================ */

  APP_NAME:      'ExamEdge Pro',
  APP_TAGLINE:   'Study Smarter. Score Higher.',
  APP_SHORT_NAME:'EEP',          // Used for PWA, notifications
  VERSION:       '1.0.0',        // Semantic versioning: MAJOR.MINOR.PATCH
  BUILD_DATE:    '2025-05-01',   // Update on each production build
  AUTHOR:        'ExamEdge Pro Team',
  SUPPORT_EMAIL: 'support@examedgepro.app',
  WEBSITE_URL:   'https://examedgepro.app',
  DOCS_URL:      'https://docs.examedgepro.app',
  GITHUB_URL:    'https://github.com/Mithun917/ExamEdge_Pro_mithun.kumar917',


  /* ================================================================
     §2  ENVIRONMENT
     Controls behavior based on where the app is running.
     Change ENV to 'production' before deploying live.

     'development' → verbose logging, debug tools, no-cache
     'staging'     → moderate logging, error tracking on
     'production'  → silent logs, caching on, error tracking on
     ================================================================ */

  ENV: 'development',
  // ⚠️ CHANGE TO 'production' BEFORE GOING LIVE

  /**
   * Computed flags based on ENV — use these instead of comparing ENV directly.
   * Example: CONFIG.IS_DEV instead of CONFIG.ENV === 'development'
   */
  IS_DEV:        true,   // Set false in production
  IS_STAGING:    false,
  IS_PROD:       false,

  /** Enable verbose console logging */
  DEBUG_MODE:    true,   // Set false in production

  /** Show error details to users in UI */
  SHOW_ERROR_DETAILS: true,  // Set false in production


  /* ================================================================
     §3  FIREBASE CONFIGURATION
     ⚠️  DO NOT commit real API keys to GitHub.
     ⚠️  In production, load these from environment variables.

     HOW TO FILL THIS SECTION:
     Step 1 → Go to https://console.firebase.google.com
     Step 2 → Create / open your project
     Step 3 → Project Settings → Your Apps → Web App
     Step 4 → Copy firebaseConfig values here
     Step 5 → Uncomment js/firebase.js and connect

     OR (recommended for production):
     Create a .env file at project root:
       FIREBASE_API_KEY=your_api_key_here
       FIREBASE_PROJECT_ID=your_project_id
     Then load them dynamically in firebase.js
     ================================================================ */

  FIREBASE: Object.freeze({

    /* ── Core Config (paste from Firebase Console) ─────────── */
    API_KEY:             '',      // e.g. 'AIzaSyXXXXXXXXX'
    AUTH_DOMAIN:         '',      // e.g. 'your-app.firebaseapp.com'
    PROJECT_ID:          '',      // e.g. 'examedge-pro'
    STORAGE_BUCKET:      '',      // e.g. 'examedge-pro.appspot.com'
    MESSAGING_SENDER_ID: '',      // e.g. '123456789012'
    APP_ID:              '',      // e.g. '1:123456789:web:abcdef'
    MEASUREMENT_ID:      '',      // e.g. 'G-XXXXXXXXXX' (Analytics)
    DATABASE_URL:        '',      // e.g. 'https://examedge-pro-default-rtdb.firebaseio.com'

    /* ── Firestore Collection Names ─────────────────────────── */
    // Change these if you want different collection names in Firestore
    COLLECTIONS: Object.freeze({
      USERS:         'users',
      QUESTIONS:     'questions',
      EXAMS:         'exams',
      RESULTS:       'results',
      LEADERBOARD:   'leaderboard',
      ACHIEVEMENTS:  'achievements',
      NOTIFICATIONS: 'notifications',
      ANALYTICS:     'analytics',
    }),

    /* ── Auth Providers ──────────────────────────────────────── */
    // Toggle which auth methods are enabled
    AUTH_PROVIDERS: Object.freeze({
      EMAIL_PASSWORD: true,
      GOOGLE:         true,
      GITHUB:         false,   // Enable later
      PHONE_OTP:      false,   // Enable later
    }),

    /* ── Firebase Feature Toggles ────────────────────────────── */
    USE_EMULATOR:     false,   // true → use local Firebase Emulator Suite
    EMULATOR_HOST:    'localhost',
    EMULATOR_PORTS: Object.freeze({
      AUTH:      9099,
      FIRESTORE: 8080,
      STORAGE:   9199,
      FUNCTIONS: 5001,
    }),

    /* ── Firestore Settings ───────────────────────────────────── */
    ENABLE_OFFLINE_PERSISTENCE: true,   // Cache data for offline use
    CACHE_SIZE_MB:              40,     // Firestore local cache size

    /* ── Status ──────────────────────────────────────────────── */
    // Auto-detected in firebase.js — do not edit manually
    IS_CONFIGURED: false,   // Set to true automatically when keys are filled
  }),


  /* ================================================================
     §4  API ENDPOINTS
     Backend URLs for REST API calls (non-Firebase).
     For future use if you add a custom Node/Express backend.
     ================================================================ */

  API: Object.freeze({
    BASE_URL:     'https://api.examedgepro.app/v1',
    TIMEOUT_MS:   10000,    // 10 seconds before request times out
    RETRY_LIMIT:  3,        // Retry failed requests this many times
    RETRY_DELAY_MS: 1000,   // Wait 1 second between retries

    /* ── Endpoint Paths ─────────────────────────────────────── */
    ENDPOINTS: Object.freeze({
      QUESTIONS:    '/questions',
      EXAMS:        '/exams',
      RESULTS:      '/results',
      LEADERBOARD:  '/leaderboard',
      USER_PROFILE: '/users/profile',
      ANALYTICS:    '/analytics',
    }),
  }),


  /* ================================================================
     §5  FEATURE FLAGS
     Turn features ON or OFF without changing code.
     Set to false to disable, true to enable.

     Use in code:
       if (CONFIG.FEATURES.LEADERBOARD) { ... }
     ================================================================ */

  FEATURES: Object.freeze({

    /* ── Core Features ──────────────────────────────────────── */
    PRACTICE_MODE:    true,    // Practice question sessions
    MOCK_EXAM:        true,    // Full timed mock exams
    LIVE_EXAM:        true,    // Join live scheduled exams
    LEADERBOARD:      true,    // Global rankings
    ACHIEVEMENTS:     true,    // Achievement badges
    MILESTONES:       true,    // Study milestones
    ANALYTICS:        true,    // Performance analytics
    STREAK_TRACKING:  true,    // Daily study streak

    /* ── Auth Features ──────────────────────────────────────── */
    GOOGLE_LOGIN:     true,    // Google OAuth login
    EMAIL_LOGIN:      true,    // Email + password login
    GUEST_MODE:       false,   // Allow using app without login

    /* ── Premium / Future Features ──────────────────────────── */
    AI_HINTS:         false,   // AI-powered question hints
    AI_ANALYSIS:      false,   // AI-powered performance analysis
    SOCIAL_SHARE:     false,   // Share results on social media
    REFERRAL_PROGRAM: false,   // Refer friends feature
    PREMIUM_CONTENT:  false,   // Paid premium question packs
    OFFLINE_MODE:     false,   // Full offline support
    PUSH_NOTIFICATIONS: false, // Browser push notifications
    PDF_EXPORT:       false,   // Export results as PDF
    DARK_MODE_TOGGLE: true,    // Manual dark/light theme switch
    SOUND_EFFECTS:    false,   // UI sound effects
  }),


  /* ================================================================
     §6  DEFAULT SETTINGS
     Starting values for user preferences.
     Used when no saved preference exists in localStorage.
     ================================================================ */

  DEFAULTS: Object.freeze({

    /* ── Appearance ─────────────────────────────────────────── */
    THEME:          'dark',    // 'dark' | 'light'
    LANGUAGE:       'en',      // Language code
    FONT_SIZE:      'medium',  // 'small' | 'medium' | 'large'

    /* ── Practice Defaults ───────────────────────────────────── */
    PRACTICE_QUESTION_COUNT: 10,
    PRACTICE_SUBJECT:        null,    // null = all subjects
    PRACTICE_DIFFICULTY:     null,    // null = all difficulties
    SHUFFLE_QUESTIONS:       true,
    SHUFFLE_OPTIONS:         false,   // Shuffle answer options

    /* ── Exam Defaults ───────────────────────────────────────── */
    EXAM_DURATION_MINUTES:   60,
    EXAM_QUESTION_COUNT:     50,
    NEGATIVE_MARKING:        false,
    NEGATIVE_MARK_VALUE:     0.25,    // Points deducted per wrong answer

    /* ── Notification Defaults ───────────────────────────────── */
    EMAIL_NOTIFICATIONS:     true,
    PUSH_NOTIFICATIONS:      false,
    DAILY_REMINDER:          true,
    REMINDER_TIME:           '09:00', // 24h format

    /* ── Display Preferences ─────────────────────────────────── */
    SHOW_TIMER:              true,    // Show countdown timer in exams
    SHOW_PROGRESS_BAR:       true,    // Show progress bar in practice
    AUTO_NEXT_QUESTION:      false,   // Auto-advance after answering
    SHOW_EXPLANATIONS:       true,    // Show answer explanations
    CONFIRM_SUBMIT:          true,    // Show confirm dialog before submit
  }),


  /* ================================================================
     §7  XP & GAMIFICATION
     All numbers related to the XP and levelling system.
     ================================================================ */

  XP: Object.freeze({

    /* ── XP Awards ──────────────────────────────────────────── */
    CORRECT_ANSWER:          10,    // Practice: correct answer
    WRONG_ANSWER:             2,    // Practice: wrong but attempted
    MOCK_EXAM_COMPLETE:      50,    // Completing a mock exam
    MOCK_EXAM_PASS:          75,    // Passing a mock exam
    LIVE_EXAM_COMPLETE:      80,    // Completing a live exam
    LIVE_EXAM_PASS:         120,    // Passing a live exam
    PERFECT_SCORE_BONUS:     50,    // 100% on any session
    FIRST_EXAM_BONUS:        25,    // First ever exam
    STREAK_DAY_BONUS:         5,    // Per streak day bonus
    ACHIEVEMENT_UNLOCK:     null,   // Varies per achievement (set in achievements.js)
    MILESTONE_COMPLETE:     null,   // Varies per milestone

    /* ── Level Thresholds ────────────────────────────────────── */
    // Index = level number, value = XP needed to REACH that level
    // Level 1 = 0 XP (starting level)
    // Level 2 = 100 XP needed, etc.
    LEVEL_THRESHOLDS: Object.freeze([
        0,      // Level 1  — Beginner
        100,    // Level 2  — Learner
        250,    // Level 3  — Explorer
        500,    // Level 4  — Practitioner
        900,    // Level 5  — Achiever
       1400,    // Level 6  — Scholar
       2100,    // Level 7  — Expert
       3000,    // Level 8  — Master
       4200,    // Level 9  — Champion
       5800,    // Level 10 — Legend
       8000,    // Level 11 — Elite
      11000,    // Level 12 — Grand Master
      15000,    // Level 13 — Prodigy
      20000,    // Level 14 — Virtuoso
      27000,    // Level 15 — Apex Scholar ← max displayed level
    ]),

    /* ── Level Titles ────────────────────────────────────────── */
    LEVEL_TITLES: Object.freeze([
      '',              // 0 — unused
      'Beginner',      // 1
      'Learner',       // 2
      'Explorer',      // 3
      'Practitioner',  // 4
      'Achiever',      // 5
      'Scholar',       // 6
      'Expert',        // 7
      'Master',        // 8
      'Champion',      // 9
      'Legend',        // 10
      'Elite',         // 11
      'Grand Master',  // 12
      'Prodigy',       // 13
      'Virtuoso',      // 14
      'Apex Scholar',  // 15
    ]),

    /* ── Streak Config ───────────────────────────────────────── */
    STREAK_RESET_HOUR:     4,    // Reset streak at 4 AM (not midnight)
    MAX_STREAK_BONUS_DAYS: 30,   // Bonus caps at 30-day streak
  }),


  /* ================================================================
     §8  EXAM SETTINGS
     Controls for mock and live exams.
     ================================================================ */

  EXAM: Object.freeze({

    /* ── Timing ──────────────────────────────────────────────── */
    DEFAULT_DURATION_MINUTES:  60,     // Default exam duration
    MIN_DURATION_MINUTES:      15,     // Shortest allowed exam
    MAX_DURATION_MINUTES:      240,    // Longest allowed exam (4h)
    WARNING_TIME_SECONDS:      300,    // Show warning at 5 min left
    DANGER_TIME_SECONDS:       60,     // Red timer at 1 min left
    TIMER_TICK_MS:             1000,   // Timer update interval

    /* ── Question Counts ─────────────────────────────────────── */
    DEFAULT_QUESTION_COUNT:    50,
    MIN_QUESTION_COUNT:        10,
    MAX_QUESTION_COUNT:        200,

    /* ── Scoring ─────────────────────────────────────────────── */
    PASSING_SCORE_PERCENT:     60,     // 60% to pass
    MARKS_PER_CORRECT:         1,      // Marks awarded per correct answer
    NEGATIVE_MARK_FRACTIONS: Object.freeze([
      { label: 'None',   value: 0    },
      { label: '¼ mark', value: 0.25 },
      { label: '⅓ mark', value: 0.33 },
      { label: '½ mark', value: 0.5  },
      { label: '1 mark', value: 1    },
    ]),

    /* ── Exam Types ──────────────────────────────────────────── */
    TYPES: Object.freeze([
      { id: 'general',  label: 'General Aptitude',  icon: '🧠', duration: 60,  questions: 50  },
      { id: 'upsc',     label: 'UPSC Prelims',       icon: '🏛️', duration: 120, questions: 100 },
      { id: 'ssc',      label: 'SSC CGL',            icon: '📋', duration: 60,  questions: 100 },
      { id: 'banking',  label: 'Banking PO',         icon: '🏦', duration: 60,  questions: 100 },
      { id: 'cat',      label: 'CAT',                icon: '🐱', duration: 120, questions: 66  },
      { id: 'jee',      label: 'JEE Mains',          icon: '⚛️', duration: 180, questions: 90  },
      { id: 'neet',     label: 'NEET',               icon: '🩺', duration: 200, questions: 180 },
      { id: 'gate',     label: 'GATE',               icon: '🔧', duration: 180, questions: 65  },
      { id: 'custom',   label: 'Custom Exam',        icon: '⚙️', duration: 60,  questions: 50  },
    ]),
  }),


  /* ================================================================
     §9  PRACTICE SETTINGS
     Controls for practice mode sessions.
     ================================================================ */

  PRACTICE: Object.freeze({

    /* ── Session Limits ──────────────────────────────────────── */
    DEFAULT_QUESTION_COUNT:    10,
    MIN_QUESTION_COUNT:        5,
    MAX_QUESTION_COUNT:        50,
    QUICK_SESSION_COUNT:       5,    // Quick 5-question session

    /* ── Session Modes ───────────────────────────────────────── */
    MODES: Object.freeze([
      { id: 'standard',   label: 'Standard',     icon: '📝', desc: 'Answer at your own pace' },
      { id: 'timed',      label: 'Timed',         icon: '⏱️', desc: 'Race against the clock' },
      { id: 'flashcard',  label: 'Flashcard',     icon: '🃏', desc: 'Quick review mode' },
    ]),

    /* ── Answer Feedback ─────────────────────────────────────── */
    SHOW_CORRECT_ANSWER:    true,   // Highlight correct answer after submit
    SHOW_EXPLANATION:       true,   // Show explanation after each answer
    EXPLANATION_DELAY_MS:   300,    // Delay before showing explanation
  }),


  /* ================================================================
     §10 SUBJECTS & TOPICS
     All subjects available in the app.
     Add more here and they automatically appear in filters.
     ================================================================ */

  SUBJECTS: Object.freeze([
    { id: 'general',    label: 'General Knowledge', icon: '🌐', color: '#6c63ff' },
    { id: 'math',       label: 'Mathematics',        icon: '📐', color: '#00e5a0' },
    { id: 'science',    label: 'Science',            icon: '🔬', color: '#38bdf8' },
    { id: 'english',    label: 'English',            icon: '📖', color: '#ffd166' },
    { id: 'reasoning',  label: 'Logical Reasoning',  icon: '🧩', color: '#ff6b6b' },
    { id: 'current',    label: 'Current Affairs',    icon: '📰', color: '#a78bfa' },
    { id: 'computers',  label: 'Computer Science',   icon: '💻', color: '#34d399' },
    { id: 'economics',  label: 'Economics',          icon: '📊', color: '#fb923c' },
    { id: 'history',    label: 'History',            icon: '🏛️', color: '#e879f9' },
    { id: 'geography',  label: 'Geography',          icon: '🗺️', color: '#4ade80' },
    { id: 'polity',     label: 'Polity',             icon: '⚖️', color: '#60a5fa' },
    { id: 'environment',label: 'Environment',        icon: '🌿', color: '#86efac' },
    { id: 'physics',    label: 'Physics',            icon: '⚛️', color: '#93c5fd' },
    { id: 'chemistry',  label: 'Chemistry',          icon: '🧪', color: '#fca5a5' },
    { id: 'biology',    label: 'Biology',            icon: '🧬', color: '#6ee7b7' },
  ]),


  /* ================================================================
     §11 DIFFICULTY LEVELS
     ================================================================ */

  DIFFICULTY: Object.freeze([
    {
      id:          'easy',
      label:       'Easy',
      icon:        '🟢',
      color:       'success',   // Matches CSS badge class
      xpMultiplier: 1.0,        // XP earned is multiplied by this
      description: 'Fundamental concepts and basic recall',
    },
    {
      id:          'medium',
      label:       'Medium',
      icon:        '🟡',
      color:       'warning',
      xpMultiplier: 1.5,
      description: 'Application and moderate analysis',
    },
    {
      id:          'hard',
      label:       'Hard',
      icon:        '🔴',
      color:       'danger',
      xpMultiplier: 2.0,
      description: 'Complex reasoning and evaluation',
    },
  ]),


  /* ================================================================
     §12 STORAGE KEYS
     All localStorage key names in one place.
     Prefix 'ee_' = ExamEdge, prevents collision with other apps.
     ================================================================ */

  STORAGE_KEYS: Object.freeze({
    // User & Auth
    USER:            'ee_user',
    SESSION:         'ee_session',
    AUTH_TOKEN:      'ee_auth_token',

    // Preferences
    THEME:           'ee_theme',
    LANGUAGE:        'ee_language',
    FONT_SIZE:       'ee_font_size',

    // Gamification
    XP:              'ee_xp',
    LEVEL:           'ee_level',
    STREAK:          'ee_streak',
    LAST_STUDY_DATE: 'ee_last_study_date',
    TOTAL_STUDY_DAYS:'ee_study_days',
    ACHIEVEMENTS:    'ee_achievements',
    MILESTONES:      'ee_milestones',

    // Sessions (cleared after exam)
    PRACTICE_STATE:  'ee_practice',
    MOCK_STATE:      'ee_mock',
    EXAM_STATE:      'ee_exam',

    // Analytics
    ANALYTICS:       'ee_analytics',

    // App state
    SIDEBAR_STATE:   'ee_sidebar',
    LAST_ROUTE:      'ee_last_route',
    NOTIFICATIONS:   'ee_notifications',
  }),


  /* ================================================================
     §13 ROUTE DEFINITIONS
     All app routes in one place.
     Must match ROUTES in app.js.
     ================================================================ */

  ROUTES: Object.freeze({
    HOME:        '#dashboard',
    DASHBOARD:   '#dashboard',
    PRACTICE:    '#practice',
    MOCK:        '#mock',
    EXAM:        '#exam',
    LEADERBOARD: '#leaderboard',
    PROFILE:     '#profile',
    AUTH:        '#auth',
    SETTINGS:    '#settings',   // Future
    RESULTS:     '#results',    // Future
    ANALYTICS:   '#analytics',  // Future
  }),


  /* ================================================================
     §14 UI / APPEARANCE
     Design system values used across the app.
     ================================================================ */

  UI: Object.freeze({

    /* ── Layout ──────────────────────────────────────────────── */
    NAVBAR_HEIGHT_PX:    62,
    SIDEBAR_WIDTH_PX:    248,
    SIDEBAR_COLLAPSED_PX:66,
    CONTENT_MAX_WIDTH_PX:1280,
    PAGE_PADDING_PX:     40,

    /* ── Animation Durations (ms) ────────────────────────────── */
    ANIMATION: Object.freeze({
      FAST:    120,
      BASE:    200,
      SLOW:    350,
      SLOWER:  500,
      PAGE_TRANSITION: 400,
    }),

    /* ── Toast Config ────────────────────────────────────────── */
    TOAST: Object.freeze({
      DEFAULT_DURATION_MS: 3500,
      SUCCESS_DURATION_MS: 3000,
      ERROR_DURATION_MS:   6000,
      WARNING_DURATION_MS: 4500,
      MAX_VISIBLE:         3,      // Max toasts shown at once
    }),

    /* ── Breakpoints (match CSS) ─────────────────────────────── */
    BREAKPOINTS: Object.freeze({
      SM:  480,
      MD:  768,
      LG:  1024,
      XL:  1280,
      XXL: 1440,
    }),

    /* ── Leaderboard ──────────────────────────────────────────── */
    LEADERBOARD: Object.freeze({
      ITEMS_PER_PAGE:     20,
      CACHE_TTL_MS:       300000,   // 5 minutes
      TOP_RANKS_SHOWN:    3,        // Podium display
    }),
  }),


  /* ================================================================
     §15 VALIDATION RULES
     Used in forms, inputs, and data entry throughout the app.
     ================================================================ */

  VALIDATION: Object.freeze({

    /* ── User Fields ─────────────────────────────────────────── */
    NAME: Object.freeze({
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      PATTERN:    /^[a-zA-Z\s'-]+$/,   // Letters, spaces, hyphens, apostrophes
    }),

    EMAIL: Object.freeze({
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      MAX_LENGTH: 254,
    }),

    PASSWORD: Object.freeze({
      MIN_LENGTH:        8,
      MAX_LENGTH:        128,
      REQUIRE_UPPERCASE: false,
      REQUIRE_NUMBER:    false,
      REQUIRE_SPECIAL:   false,
      // Strength levels 0-4 (0=very weak, 4=very strong)
      STRENGTH_LABELS: Object.freeze(['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']),
      STRENGTH_COLORS: Object.freeze(['#ff6b6b', '#ff6b6b', '#ffd166', '#00e5a0', '#00e5a0']),
    }),

    EXAM_CODE: Object.freeze({
      MIN_LENGTH: 4,
      MAX_LENGTH: 8,
      PATTERN:    /^[A-Z0-9]+$/,
    }),
  }),


  /* ================================================================
     §16 ERROR MESSAGES
     Centralized user-facing error strings.
     Keeps all copy in one place — easy to update or translate.
     ================================================================ */

  ERRORS: Object.freeze({
    // Auth
    AUTH_FAILED:          'Login failed. Please check your credentials.',
    AUTH_EMAIL_TAKEN:     'This email is already registered.',
    AUTH_INVALID_EMAIL:   'Please enter a valid email address.',
    AUTH_WEAK_PASSWORD:   'Password must be at least 8 characters.',
    AUTH_USER_NOT_FOUND:  'No account found with this email.',
    AUTH_WRONG_PASSWORD:  'Incorrect password. Please try again.',
    AUTH_NETWORK:         'Network error. Please check your connection.',
    AUTH_TOO_MANY:        'Too many attempts. Please try again later.',

    // General
    NETWORK_ERROR:        'Connection failed. Please check your internet.',
    SERVER_ERROR:         'Something went wrong. Please try again.',
    NOT_FOUND:            'The requested content could not be found.',
    PERMISSION_DENIED:    'You do not have permission to do that.',
    SESSION_EXPIRED:      'Your session has expired. Please log in again.',
    LOAD_FAILED:          'Failed to load. Please refresh the page.',

    // Exam
    EXAM_CODE_INVALID:    'Invalid exam code. Please check and try again.',
    EXAM_NOT_STARTED:     'This exam has not started yet.',
    EXAM_ENDED:           'This exam has already ended.',
    EXAM_FULL:            'This exam is full. No more seats available.',

    // Validation
    FIELD_REQUIRED:       'This field is required.',
    FIELD_TOO_SHORT:      'This field is too short.',
    FIELD_TOO_LONG:       'This field is too long.',
    FIELD_INVALID:        'Please enter a valid value.',
    TERMS_REQUIRED:       'Please accept the Terms of Service to continue.',
  }),


  /* ================================================================
     §17 SUCCESS MESSAGES
     Centralized user-facing success strings.
     ================================================================ */

  MESSAGES: Object.freeze({
    // Auth
    LOGIN_SUCCESS:        'Welcome back! 👋',
    SIGNUP_SUCCESS:       'Account created! Welcome to ExamEdge Pro 🎉',
    LOGOUT_SUCCESS:       'Logged out successfully.',
    PASSWORD_RESET_SENT:  'Password reset link sent to your email.',
    PROFILE_UPDATED:      'Profile updated successfully.',

    // Exam
    EXAM_SUBMITTED:       'Exam submitted successfully!',
    EXAM_PASSED:          'Congratulations! You passed! 🎉',
    EXAM_FAILED:          'Keep studying — you\'ll get it next time! 💪',

    // Practice
    SESSION_COMPLETE:     'Session complete! Great work!',
    PERFECT_SCORE:        'Perfect score! Incredible! 🏆',

    // General
    SAVED:                'Saved successfully.',
    COPIED:               'Copied to clipboard.',
    SETTINGS_SAVED:       'Settings saved.',
  }),


  /* ================================================================
     §18 LIMITS & THRESHOLDS
     Performance, rate limiting, and caching boundaries.
     ================================================================ */

  LIMITS: Object.freeze({

    /* ── Rate Limiting ───────────────────────────────────────── */
    MAX_LOGIN_ATTEMPTS:   5,      // Lock out after this many fails
    LOGIN_LOCKOUT_MIN:    15,     // Lock duration in minutes
    SEARCH_DEBOUNCE_MS:   300,    // Debounce search input

    /* ── Caching ─────────────────────────────────────────────── */
    LEADERBOARD_CACHE_MS: 300000, // 5 min
    QUESTIONS_CACHE_MS:   600000, // 10 min
    ANALYTICS_CACHE_MS:   60000,  // 1 min

    /* ── Pagination ──────────────────────────────────────────── */
    ITEMS_PER_PAGE:       20,
    MAX_HISTORY_ITEMS:    50,
    MAX_NOTIFICATIONS:    50,

    /* ── Upload Limits ───────────────────────────────────────── */
    AVATAR_MAX_SIZE_MB:   2,
    AVATAR_FORMATS:       Object.freeze(['image/jpeg', 'image/png', 'image/webp']),

    /* ── State History ───────────────────────────────────────── */
    STATE_HISTORY_MAX:    50,     // Max undo steps in state.js
  }),


  /* ================================================================
     §19 REGEX PATTERNS
     Common patterns reused across validation and parsing.
     ================================================================ */

  REGEX: Object.freeze({
    EMAIL:      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL:        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
    PHONE_IN:   /^[6-9]\d{9}$/,             // Indian phone numbers
    EXAM_CODE:  /^[A-Z0-9]{4,8}$/,          // Exam join codes
    USERNAME:   /^[a-zA-Z0-9_-]{3,30}$/,
    STRONG_PW:  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
    ISO_DATE:   /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/,
    HEX_COLOR:  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  }),


  /* ================================================================
     §20 DATE & TIME
     Formatting and timezone settings.
     ================================================================ */

  DATE_TIME: Object.freeze({

    TIMEZONE:            'Asia/Kolkata',   // IST — Indian Standard Time
    LOCALE:              'en-IN',          // Indian English locale

    /* ── Intl Format Options ─────────────────────────────────── */
    FORMATS: Object.freeze({
      DATE_SHORT:   { day: 'numeric', month: 'short', year: 'numeric' },
      DATE_LONG:    { day: 'numeric', month: 'long',  year: 'numeric' },
      TIME_SHORT:   { hour: '2-digit', minute: '2-digit' },
      DATE_TIME:    { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
      MONTH_YEAR:   { month: 'long', year: 'numeric' },
    }),

    /* ── Study Calendar ──────────────────────────────────────── */
    WEEK_STARTS_ON:       1,    // 1 = Monday (ISO standard)
    STUDY_RESET_HOUR:     4,    // Streak resets at 4:00 AM
    HEATMAP_WEEKS:        10,   // Activity heatmap shows 10 weeks
  }),

}); // End CONFIG


/* ================================================================
   QUICK REFERENCE GUIDE
   ================================================================

   Import config:
     import { CONFIG } from './config.js';

   Common uses:
     CONFIG.APP_NAME                     → 'ExamEdge Pro'
     CONFIG.VERSION                      → '1.0.0'
     CONFIG.ENV                          → 'development'
     CONFIG.IS_DEV                       → true
     CONFIG.DEBUG_MODE                   → true

     CONFIG.FIREBASE.PROJECT_ID          → '' (fill when ready)
     CONFIG.FIREBASE.COLLECTIONS.USERS   → 'users'
     CONFIG.FIREBASE.AUTH_PROVIDERS.GOOGLE → true

     CONFIG.FEATURES.LEADERBOARD         → true
     CONFIG.FEATURES.AI_HINTS            → false

     CONFIG.DEFAULTS.THEME               → 'dark'
     CONFIG.DEFAULTS.PRACTICE_QUESTION_COUNT → 10

     CONFIG.XP.CORRECT_ANSWER            → 10
     CONFIG.XP.LEVEL_THRESHOLDS[5]       → 1400
     CONFIG.XP.LEVEL_TITLES[6]           → 'Scholar'

     CONFIG.EXAM.PASSING_SCORE_PERCENT   → 60
     CONFIG.EXAM.WARNING_TIME_SECONDS    → 300

     CONFIG.SUBJECTS[0].id               → 'general'
     CONFIG.SUBJECTS[0].icon             → '🌐'

     CONFIG.STORAGE_KEYS.USER            → 'ee_user'
     CONFIG.STORAGE_KEYS.THEME           → 'ee_theme'

     CONFIG.ERRORS.AUTH_FAILED           → 'Login failed...'
     CONFIG.MESSAGES.LOGIN_SUCCESS       → 'Welcome back! 👋'

     CONFIG.VALIDATION.PASSWORD.MIN_LENGTH → 8
     CONFIG.LIMITS.SEARCH_DEBOUNCE_MS    → 300
     CONFIG.REGEX.EMAIL.test('a@b.com')  → true

   ================================================================ */
