/**
 * ================================================================
 * ExamEdge Pro — utils.js
 * PURE UTILITY FUNCTIONS
 *
 * Rules this file must always follow:
 *  ✅ Pure functions only — same input always gives same output
 *  ✅ Zero DOM manipulation — no document, window, or element access
 *  ✅ Zero side effects — nothing is modified outside the function
 *  ✅ Zero dependencies — imports nothing from the app
 *  ✅ Every function is exported — easy to import anywhere
 *  ✅ Every function is JSDoc documented with examples
 *
 * The one exception to "zero DOM" is the Toast and Storage
 * helpers at the bottom — those are UI/browser helpers that
 * are kept here for convenience and clearly marked.
 *
 * Import what you need:
 *  import { formatDate, debounce, deepClone } from './utils.js';
 *  import { generateId, formatXP, slugify }   from './utils.js';
 *
 * Section Map:
 *  §1  Date & Time
 *  §2  Number & Math
 *  §3  String
 *  §4  ID Generation
 *  §5  Deep Clone & Object
 *  §6  Array
 *  §7  Performance (debounce, throttle, memoize)
 *  §8  Validation
 *  §9  Type Checking
 *  §10 Score & XP (domain-specific formatters)
 *  §11 URL & Query String
 *  §12 Color
 *  §13 Storage Helpers   ← browser API, clearly marked
 *  §14 Toast Helper      ← DOM helper, clearly marked
 * ================================================================
 */


/* ================================================================
   §1  DATE & TIME
   ================================================================ */

/**
 * Format a Date or ISO string into a readable date string.
 * Uses Intl.DateTimeFormat — fully locale-aware.
 *
 * @param {Date|string|number} date    - Input date
 * @param {Intl.DateTimeFormatOptions} [options] - Format options
 * @param {string} [locale='en-IN']    - Locale string
 * @returns {string}
 *
 * @example
 * formatDate('2025-05-01')
 * // → '1 May 2025'
 *
 * formatDate(new Date(), { month: 'long', year: 'numeric' })
 * // → 'May 2025'
 *
 * formatDate('2025-05-01', { dateStyle: 'full' })
 * // → 'Thursday, 1 May 2025'
 */
export function formatDate(date, options = { day: 'numeric', month: 'short', year: 'numeric' }, locale = 'en-IN') {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Format a date to a short readable form.
 * @param {Date|string} date
 * @returns {string} e.g. '1 May 2025'
 */
export function formatDateShort(date) {
  return formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a date to a long readable form.
 * @param {Date|string} date
 * @returns {string} e.g. 'Thursday, 1 May 2025'
 */
export function formatDateLong(date) {
  return formatDate(date, { dateStyle: 'full' });
}

/**
 * Format a Date to time string (HH:MM).
 * @param {Date|string} date
 * @param {boolean} [showSeconds=false]
 * @returns {string} e.g. '09:30' or '09:30:45'
 */
export function formatTime(date, showSeconds = false) {
  try {
    const d = date instanceof Date ? date : new Date(date);
    const opts = {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(showSeconds ? { second: '2-digit' } : {}),
    };
    return new Intl.DateTimeFormat('en-IN', opts).format(d);
  } catch {
    return '—';
  }
}

/**
 * Format total seconds into MM:SS countdown string.
 * Commonly used for exam timers.
 *
 * @param {number} totalSeconds - Total seconds to display
 * @returns {string}
 *
 * @example
 * formatCountdown(125) // → '02:05'
 * formatCountdown(3661) // → '61:01'  (does not cap at 60 min)
 */
export function formatCountdown(totalSeconds) {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Format a duration in seconds to a human-readable string.
 *
 * @param {number} seconds
 * @returns {string}
 *
 * @example
 * formatDuration(45)    // → '45 sec'
 * formatDuration(90)    // → '1 min 30 sec'
 * formatDuration(3660)  // → '1 hr 1 min'
 */
export function formatDuration(seconds) {
  if (seconds < 60)   return `${seconds} sec`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m} min ${s} sec` : `${m} min`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

/**
 * Return a human-readable "time ago" string.
 *
 * @param {Date|string|number} date
 * @returns {string}
 *
 * @example
 * timeAgo(new Date(Date.now() - 30000))  // → 'Just now'
 * timeAgo(new Date(Date.now() - 90000))  // → '1 min ago'
 * timeAgo(new Date(Date.now() - 7200000))// → '2 hr ago'
 * timeAgo('2025-04-01')                  // → '30 days ago'
 */
export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(sec  / 60);
  const hr   = Math.floor(min  / 60);
  const day  = Math.floor(hr   / 24);
  const wk   = Math.floor(day  / 7);
  const mo   = Math.floor(day  / 30);
  const yr   = Math.floor(day  / 365);

  if (sec  <  60) return 'Just now';
  if (min  <  60) return `${min} min ago`;
  if (hr   <  24) return `${hr} hr ago`;
  if (day  <   7) return `${day} day${day > 1 ? 's' : ''} ago`;
  if (wk   <   4) return `${wk} week${wk > 1 ? 's' : ''} ago`;
  if (mo   <  12) return `${mo} month${mo > 1 ? 's' : ''} ago`;
  return `${yr} year${yr > 1 ? 's' : ''} ago`;
}

/**
 * Get today's date as a YYYY-MM-DD string.
 * Used for streak tracking and analytics.
 *
 * @returns {string}
 *
 * @example
 * getTodayString() // → '2025-05-01'
 */
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as a YYYY-MM-DD string.
 * @returns {string}
 */
export function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Check if two dates are the same calendar day.
 *
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  const d1 = new Date(date1).toISOString().split('T')[0];
  const d2 = new Date(date2).toISOString().split('T')[0];
  return d1 === d2;
}

/**
 * Get the number of calendar days between two dates.
 *
 * @param {Date|string} from
 * @param {Date|string} to
 * @returns {number} Positive if 'to' is after 'from'
 *
 * @example
 * daysBetween('2025-01-01', '2025-01-10') // → 9
 */
export function daysBetween(from, to) {
  const MS_PER_DAY = 86_400_000;
  const d1 = new Date(from);
  const d2 = new Date(to);
  // Normalize to midnight to avoid DST issues
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2.getTime() - d1.getTime()) / MS_PER_DAY);
}


/* ================================================================
   §2  NUMBER & MATH
   ================================================================ */

/**
 * Format a number with locale-appropriate thousands separators.
 *
 * @param {number} n
 * @param {string} [locale='en-IN']
 * @returns {string}
 *
 * @example
 * formatNumber(12345)   // → '12,345'
 * formatNumber(1000000) // → '10,00,000' (Indian format)
 */
export function formatNumber(n, locale = 'en-IN') {
  if (!isFinite(n)) return '—';
  return new Intl.NumberFormat(locale).format(n);
}

/**
 * Format a number as a compact string.
 *
 * @param {number} n
 * @returns {string}
 *
 * @example
 * formatCompact(1200)     // → '1.2K'
 * formatCompact(1500000)  // → '1.5M'
 * formatCompact(50)       // → '50'
 */
export function formatCompact(n) {
  if (!isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/**
 * Format a percentage value.
 *
 * @param {number} value   - Value (0–100)
 * @param {number} [decimals=0]
 * @returns {string}
 *
 * @example
 * formatPercent(88.5)    // → '89%'
 * formatPercent(88.5, 1) // → '88.5%'
 * formatPercent(0)       // → '0%'
 */
export function formatPercent(value, decimals = 0) {
  if (!isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate a score percentage.
 *
 * @param {number} correct
 * @param {number} total
 * @returns {number} Integer 0–100, or 0 if total is 0
 *
 * @example
 * calcPercent(45, 50) // → 90
 * calcPercent(0, 0)   // → 0
 */
export function calcPercent(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Clamp a number between a min and max value.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 *
 * @example
 * clamp(150, 0, 100) // → 100
 * clamp(-5,  0, 100) // → 0
 * clamp(42,  0, 100) // → 42
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round a number to N decimal places.
 *
 * @param {number} n
 * @param {number} [places=2]
 * @returns {number}
 *
 * @example
 * roundTo(3.14159, 2) // → 3.14
 * roundTo(2.5)        // → 2.5
 */
export function roundTo(n, places = 2) {
  const factor = Math.pow(10, places);
  return Math.round(n * factor) / factor;
}

/**
 * Check if a number is between min and max (inclusive).
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function isBetween(value, min, max) {
  return value >= min && value <= max;
}

/**
 * Generate a random integer between min and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 *
 * @example
 * randomInt(1, 6) // → 4 (dice roll)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* ================================================================
   §3  STRING
   ================================================================ */

/**
 * Capitalise the first letter of a string.
 *
 * @param {string} str
 * @returns {string}
 *
 * @example
 * capitalise('hello world') // → 'Hello world'
 */
export function capitalise(str) {
  if (!str) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

/**
 * Convert a string to Title Case.
 *
 * @param {string} str
 * @returns {string}
 *
 * @example
 * toTitleCase('general knowledge') // → 'General Knowledge'
 */
export function toTitleCase(str) {
  if (!str) return '';
  return String(str)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convert a string to a URL-safe slug.
 *
 * @param {string} str
 * @returns {string}
 *
 * @example
 * slugify('General Knowledge 2025') // → 'general-knowledge-2025'
 * slugify('What is C++?')           // → 'what-is-c'
 */
export function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')      // Remove special chars
    .replace(/[\s_-]+/g, '-')      // Spaces/underscores to hyphens
    .replace(/^-+|-+$/g, '');      // Trim leading/trailing hyphens
}

/**
 * Truncate a string to a max length and append ellipsis.
 *
 * @param {string} str
 * @param {number} maxLength
 * @param {string} [suffix='…']
 * @returns {string}
 *
 * @example
 * truncate('Hello World', 7)       // → 'Hello W…'
 * truncate('Short', 10)            // → 'Short'
 * truncate('Hello World', 7, '...')// → 'Hello W...'
 */
export function truncate(str, maxLength, suffix = '…') {
  const s = String(str ?? '');
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength) + suffix;
}

/**
 * Truncate a string by word boundary (no mid-word cuts).
 *
 * @param {string} str
 * @param {number} maxLength
 * @param {string} [suffix='…']
 * @returns {string}
 *
 * @example
 * truncateWords('The quick brown fox', 12) // → 'The quick…'
 */
export function truncateWords(str, maxLength, suffix = '…') {
  const s = String(str ?? '');
  if (s.length <= maxLength) return s;
  const trimmed = s.slice(0, maxLength).replace(/\s+\S*$/, '');
  return trimmed + suffix;
}

/**
 * Escape HTML special characters.
 * Prevents XSS when inserting user content into HTML.
 *
 * @param {string} str
 * @returns {string}
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
  };
  return String(str ?? '').replace(/[&<>"'`]/g, m => map[m]);
}

/**
 * Strip all HTML tags from a string.
 *
 * @param {string} html
 * @returns {string}
 *
 * @example
 * stripHtml('<b>Hello</b> <i>World</i>') // → 'Hello World'
 */
export function stripHtml(html) {
  return String(html ?? '').replace(/<[^>]*>/g, '');
}

/**
 * Get a user's initials from their display name (max 2 chars).
 *
 * @param {string} name
 * @returns {string}
 *
 * @example
 * getInitials('Arjun Sharma')   // → 'AS'
 * getInitials('Priya')          // → 'P'
 * getInitials('')               // → '?'
 */
export function getInitials(name) {
  if (!name || !name.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Get the first name from a full name string.
 *
 * @param {string} fullName
 * @returns {string}
 *
 * @example
 * getFirstName('Arjun Sharma') // → 'Arjun'
 * getFirstName('Priya')        // → 'Priya'
 */
export function getFirstName(fullName) {
  if (!fullName) return '';
  return String(fullName).trim().split(/\s+/)[0];
}

/**
 * Pad a string to a minimum length.
 *
 * @param {string|number} str
 * @param {number}        length
 * @param {string}        [char='0']  - Padding character
 * @returns {string}
 *
 * @example
 * padStart(5, 2)       // → '05'
 * padStart('A', 3, '-') // → '--A'
 */
export function padStart(str, length, char = '0') {
  return String(str).padStart(length, char);
}

/**
 * Count the number of words in a string.
 *
 * @param {string} str
 * @returns {number}
 *
 * @example
 * wordCount('The quick brown fox') // → 4
 */
export function wordCount(str) {
  return (String(str ?? '').trim().match(/\S+/g) || []).length;
}

/**
 * Check if a string contains another string (case-insensitive).
 *
 * @param {string} haystack
 * @param {string} needle
 * @returns {boolean}
 *
 * @example
 * containsText('General Knowledge', 'general') // → true
 */
export function containsText(haystack, needle) {
  return String(haystack).toLowerCase().includes(String(needle).toLowerCase());
}


/* ================================================================
   §4  ID GENERATION
   ================================================================ */

/**
 * Generate a unique ID string.
 * Uses crypto.randomUUID() when available (modern browsers),
 * falls back to Math.random() for older environments.
 *
 * @param {number} [length=8]   - Length of the returned ID
 * @param {string} [prefix='']  - Optional prefix (e.g. 'user_', 'q_')
 * @returns {string}
 *
 * @example
 * generateId()          // → 'a3f9c12b'
 * generateId(12)        // → 'a3f9c12b9d4e'
 * generateId(8, 'q_')   // → 'q_a3f9c12b'
 * generateId(8, 'user_')// → 'user_a3f9c12b'
 */
export function generateId(length = 8, prefix = '') {
  let id;

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    // Modern browsers — cryptographically secure
    id = crypto.randomUUID().replace(/-/g, '').slice(0, length);
  } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    // Older browsers with crypto.getRandomValues
    const arr  = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(arr);
    id = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
  } else {
    // Fallback — NOT cryptographically secure, for dev only
    id = Math.random().toString(36).slice(2, 2 + length)
       + Math.random().toString(36).slice(2, 2 + length);
    id = id.slice(0, length);
  }

  return prefix + id;
}

/**
 * Generate a full UUID v4 string.
 *
 * @returns {string} e.g. '110e8400-e29b-41d4-a716-446655440000'
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 UUID fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short human-readable exam/room code.
 * Uses uppercase letters and numbers — easy to read and type.
 *
 * @param {number} [length=6]
 * @returns {string}
 *
 * @example
 * generateCode()    // → 'EX4821'
 * generateCode(4)   // → 'A3B9'
 */
export function generateCode(length = 6) {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,1,I (ambiguous)
  const arr    = new Uint8Array(length);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(arr);
    return Array.from(arr, b => chars[b % chars.length]).join('');
  }

  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generate a timestamp-based ID (sortable by creation time).
 *
 * @param {string} [prefix='']
 * @returns {string}
 *
 * @example
 * generateTimestampId()       // → '1714551234567_a3f9'
 * generateTimestampId('sess') // → 'sess_1714551234567_a3f9'
 */
export function generateTimestampId(prefix = '') {
  const ts   = Date.now().toString();
  const rand = generateId(4);
  return prefix ? `${prefix}_${ts}_${rand}` : `${ts}_${rand}`;
}


/* ================================================================
   §5  DEEP CLONE & OBJECT UTILITIES
   ================================================================ */

/**
 * Create a deep clone of any value.
 * Handles nested objects, arrays, Dates, Maps, Sets.
 * Uses structuredClone() when available (modern browsers),
 * falls back to JSON round-trip for compatibility.
 *
 * ⚠️  Functions and undefined values are lost in the JSON fallback.
 *
 * @param {*} value - Value to clone
 * @returns {*} Deep clone
 *
 * @example
 * const original = { a: 1, b: { c: [1, 2, 3] } };
 * const clone    = deepClone(original);
 * clone.b.c.push(4);
 * original.b.c // → [1, 2, 3]  — not affected
 */
export function deepClone(value) {
  // Primitives — return as-is
  if (value === null || typeof value !== 'object') return value;

  // structuredClone — most accurate, handles Date, Map, Set, ArrayBuffer etc.
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Falls through to JSON fallback if value has non-cloneable properties
    }
  }

  // JSON round-trip fallback
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    // Last resort — shallow clone
    return Array.isArray(value) ? [...value] : { ...value };
  }
}

/**
 * Deep-merge two objects.
 * Recursively merges nested objects (not arrays — arrays are replaced).
 *
 * @param {object} target - Base object
 * @param {object} source - Object to merge into target
 * @returns {object} New merged object (target is NOT mutated)
 *
 * @example
 * deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 })
 * // → { a: 1, b: { c: 2, d: 3 }, e: 4 }
 */
export function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return deepClone(source);
  if (typeof source !== 'object' || source === null) return deepClone(target);

  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else {
      result[key] = deepClone(sourceVal);
    }
  }
  return result;
}

/**
 * Perform a shallow equality check between two values.
 * For objects, checks each top-level key's value.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 *
 * @example
 * shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) // → true
 * shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 }) // → false
 */
export function shallowEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
}

/**
 * Pick specific keys from an object.
 *
 * @param {object}   obj
 * @param {string[]} keys
 * @returns {object}
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // → { a: 1, c: 3 }
 */
export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
}

/**
 * Omit specific keys from an object.
 *
 * @param {object}   obj
 * @param {string[]} keys
 * @returns {object}
 *
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['b']) // → { a: 1, c: 3 }
 */
export function omit(obj, keys) {
  const excluded = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !excluded.has(k))
  );
}

/**
 * Check if an object is empty (has no own enumerable keys).
 *
 * @param {object} obj
 * @returns {boolean}
 *
 * @example
 * isEmpty({})       // → true
 * isEmpty({ a: 1 }) // → false
 */
export function isEmpty(obj) {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
}


/* ================================================================
   §6  ARRAY UTILITIES
   ================================================================ */

/**
 * Shuffle an array using the Fisher-Yates algorithm.
 * Returns a NEW array — does not mutate the original.
 *
 * @param {Array} arr
 * @returns {Array}
 *
 * @example
 * shuffle([1, 2, 3, 4, 5]) // → [3, 1, 5, 2, 4] (random)
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick N random items from an array (without replacement).
 *
 * @param {Array}  arr
 * @param {number} n
 * @returns {Array}
 *
 * @example
 * sample([1, 2, 3, 4, 5], 3) // → [3, 1, 5] (random)
 */
export function sample(arr, n) {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

/**
 * Group an array of objects by a key or key function.
 *
 * @param {Array}            arr
 * @param {string|Function}  key - Key name or function returning group name
 * @returns {Object}
 *
 * @example
 * groupBy([{type:'a'},{type:'b'},{type:'a'}], 'type')
 * // → { a: [{type:'a'},{type:'a'}], b: [{type:'b'}] }
 *
 * groupBy([1,2,3,4], n => n % 2 === 0 ? 'even' : 'odd')
 * // → { odd: [1,3], even: [2,4] }
 */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = typeof key === 'function' ? key(item) : (item[key] ?? 'other');
    (acc[group] = acc[group] ?? []).push(item);
    return acc;
  }, {});
}

/**
 * Sort an array of objects by a key (ascending by default).
 *
 * @param {Array}   arr
 * @param {string}  key
 * @param {'asc'|'desc'} [order='asc']
 * @returns {Array} New sorted array
 *
 * @example
 * sortBy([{xp:50},{xp:100},{xp:30}], 'xp', 'desc')
 * // → [{xp:100},{xp:50},{xp:30}]
 */
export function sortBy(arr, key, order = 'asc') {
  return [...arr].sort((a, b) => {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    if (av < bv) return order === 'asc' ? -1 : 1;
    if (av > bv) return order === 'asc' ?  1 : -1;
    return 0;
  });
}

/**
 * Remove duplicate values from an array.
 *
 * @param {Array}    arr
 * @param {string}   [key] - For arrays of objects, deduplicate by this key
 * @returns {Array}
 *
 * @example
 * unique([1, 2, 2, 3, 3]) // → [1, 2, 3]
 * unique([{id:1},{id:2},{id:1}], 'id') // → [{id:1},{id:2}]
 */
export function unique(arr, key) {
  if (!key) return [...new Set(arr)];
  const seen = new Set();
  return arr.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/**
 * Split an array into chunks of a given size.
 *
 * @param {Array}  arr
 * @param {number} size
 * @returns {Array[]}
 *
 * @example
 * chunk([1,2,3,4,5], 2) // → [[1,2],[3,4],[5]]
 */
export function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Flatten a nested array one level deep.
 *
 * @param {Array} arr
 * @returns {Array}
 *
 * @example
 * flatten([[1,2],[3,[4,5]]]) // → [1,2,3,[4,5]]
 */
export function flatten(arr) {
  return arr.flat();
}

/**
 * Get the last N items of an array.
 *
 * @param {Array}  arr
 * @param {number} n
 * @returns {Array}
 *
 * @example
 * lastN([1,2,3,4,5], 3) // → [3,4,5]
 */
export function lastN(arr, n) {
  return arr.slice(Math.max(0, arr.length - n));
}


/* ================================================================
   §7  PERFORMANCE UTILITIES
   ================================================================ */

/**
 * Debounce a function — delays execution until N ms after last call.
 * Useful for search inputs, resize handlers, form validation.
 *
 * @param {Function} fn      - Function to debounce
 * @param {number}   delay   - Milliseconds to wait
 * @param {boolean}  [leading=false] - Also call on the leading edge
 * @returns {Function} Debounced function with a .cancel() method
 *
 * @example
 * const search = debounce((query) => fetchResults(query), 300);
 * searchInput.addEventListener('input', e => search(e.target.value));
 *
 * // Cancel pending call:
 * search.cancel();
 */
export function debounce(fn, delay, leading = false) {
  let timer;
  let hasLeadingCall = false;

  const debounced = function (...args) {
    const callNow = leading && !timer;

    clearTimeout(timer);

    timer = setTimeout(() => {
      timer             = null;
      hasLeadingCall    = false;
      if (!leading) fn.apply(this, args);
    }, delay);

    if (callNow) {
      hasLeadingCall = true;
      fn.apply(this, args);
    }
  };

  debounced.cancel = () => {
    clearTimeout(timer);
    timer          = null;
    hasLeadingCall = false;
  };

  return debounced;
}

/**
 * Throttle a function — fires at most once per N ms.
 * Useful for scroll handlers, mousemove, resize events.
 *
 * @param {Function} fn     - Function to throttle
 * @param {number}   limit  - Minimum ms between calls
 * @returns {Function} Throttled function
 *
 * @example
 * const onScroll = throttle(() => updateScrollProgress(), 100);
 * window.addEventListener('scroll', onScroll);
 */
export function throttle(fn, limit) {
  let lastRun  = 0;
  let timer    = null;

  return function (...args) {
    const now  = Date.now();
    const left = limit - (now - lastRun);

    if (left <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      lastRun = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer   = null;
        fn.apply(this, args);
      }, left);
    }
  };
}

/**
 * Memoize a function — caches results by arguments.
 * Only use for pure functions with serialisable arguments.
 *
 * @param {Function} fn
 * @returns {Function} Memoized function with a .clear() method
 *
 * @example
 * const expensiveCalc = memoize((n) => fib(n));
 * expensiveCalc(40); // computed
 * expensiveCalc(40); // from cache — instant
 */
export function memoize(fn) {
  const cache = new Map();

  const memoized = function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };

  memoized.clear = () => cache.clear();
  memoized.size  = () => cache.size;

  return memoized;
}

/**
 * Execute a function once and cache the result.
 * Subsequent calls always return the cached result.
 *
 * @param {Function} fn
 * @returns {Function}
 *
 * @example
 * const initFirebase = once(() => setupFirebase());
 * initFirebase(); // runs
 * initFirebase(); // returns cached result — does NOT run again
 */
export function once(fn) {
  let called  = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

/**
 * Return a Promise that resolves after N milliseconds.
 * Use with await for simple delays.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 *
 * @example
 * await sleep(500); // wait 500ms
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function up to N times with delay between attempts.
 *
 * @param {Function} fn          - Async function to retry
 * @param {number}   [attempts=3]
 * @param {number}   [delayMs=1000]
 * @returns {Promise<*>}
 *
 * @example
 * const data = await retry(() => fetchFromServer(), 3, 1000);
 */
export async function retry(fn, attempts = 3, delayMs = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await sleep(delayMs);
    }
  }
}


/* ================================================================
   §8  VALIDATION
   ================================================================ */

/**
 * Validate an email address format.
 * @param {string} email
 * @returns {boolean}
 *
 * @example
 * isValidEmail('arjun@example.com') // → true
 * isValidEmail('not-an-email')      // → false
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? ''));
}

/**
 * Validate a password meets minimum requirements.
 * @param {string} password
 * @param {number} [minLength=8]
 * @returns {boolean}
 */
export function isValidPassword(password, minLength = 8) {
  return String(password ?? '').length >= minLength;
}

/**
 * Get the strength score of a password (0–4).
 * 0 = very weak, 4 = very strong
 *
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 *
 * @example
 * getPasswordStrength('abc')        // → { score: 0, label: 'Very Weak', color: '#ff6b6b' }
 * getPasswordStrength('MyP@ssw0rd') // → { score: 4, label: 'Very Strong', color: '#00e5a0' }
 */
export function getPasswordStrength(password) {
  const pw = String(password ?? '');
  let score = 0;

  if (pw.length >= 8)               score++;
  if (pw.length >= 12)              score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;

  const LEVELS = [
    { score: 0, label: 'Very Weak',  color: '#ff6b6b' },
    { score: 1, label: 'Weak',       color: '#ff6b6b' },
    { score: 2, label: 'Fair',       color: '#ffd166' },
    { score: 3, label: 'Strong',     color: '#00e5a0' },
    { score: 4, label: 'Very Strong',color: '#00e5a0' },
  ];

  return LEVELS[Math.min(score, 4)];
}

/**
 * Validate a phone number (Indian format: 10 digits starting with 6-9).
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone ?? '').replace(/\s/g, ''));
}

/**
 * Check if a URL is valid.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is non-empty (not null, undefined, empty string, or empty array/object).
 * @param {*} value
 * @returns {boolean}
 */
export function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string')  return value.trim().length > 0;
  if (Array.isArray(value))       return value.length > 0;
  if (typeof value === 'object')  return Object.keys(value).length > 0;
  return true;
}


/* ================================================================
   §9  TYPE CHECKING
   ================================================================ */

/** @param {*} v @returns {boolean} */
export const isString  = v => typeof v === 'string';
/** @param {*} v @returns {boolean} */
export const isNumber  = v => typeof v === 'number' && isFinite(v);
/** @param {*} v @returns {boolean} */
export const isBoolean = v => typeof v === 'boolean';
/** @param {*} v @returns {boolean} */
export const isArray   = v => Array.isArray(v);
/** @param {*} v @returns {boolean} */
export const isObject  = v => v !== null && typeof v === 'object' && !Array.isArray(v);
/** @param {*} v @returns {boolean} */
export const isFunction= v => typeof v === 'function';
/** @param {*} v @returns {boolean} */
export const isNull    = v => v === null;
/** @param {*} v @returns {boolean} */
export const isUndefined=v => v === undefined;
/** @param {*} v @returns {boolean} */
export const isNullOrUndefined = v => v === null || v === undefined;
/** @param {*} v @returns {boolean} */
export const isDate    = v => v instanceof Date && !isNaN(v.getTime());

/**
 * Get the type of a value as a readable string.
 * @param {*} v
 * @returns {string}
 *
 * @example
 * typeOf([1,2,3])   // → 'array'
 * typeOf(null)      // → 'null'
 * typeOf(new Date())// → 'date'
 */
export function typeOf(v) {
  if (v === null)      return 'null';
  if (Array.isArray(v))return 'array';
  if (v instanceof Date) return 'date';
  return typeof v;
}


/* ================================================================
   §10 SCORE & XP FORMATTERS  (domain-specific)
   ================================================================ */

/**
 * Format an XP amount with K/M suffix.
 *
 * @param {number} xp
 * @returns {string}
 *
 * @example
 * formatXP(500)      // → '500 XP'
 * formatXP(1500)     // → '1.5K XP'
 * formatXP(2000000)  // → '2M XP'
 */
export function formatXP(xp) {
  if (!isFinite(xp)) return '0 XP';
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1).replace(/\.0$/, '')}M XP`;
  if (xp >= 1_000)     return `${(xp / 1_000).toFixed(1).replace(/\.0$/, '')}K XP`;
  return `${xp} XP`;
}

/**
 * Format a score as "X/Y (Z%)".
 *
 * @param {number} correct
 * @param {number} total
 * @returns {string}
 *
 * @example
 * formatScore(45, 50) // → '45/50 (90%)'
 * formatScore(0, 0)   // → '—'
 */
export function formatScore(correct, total) {
  if (!total) return '—';
  const pct = calcPercent(correct, total);
  return `${correct}/${total} (${pct}%)`;
}

/**
 * Get the grade label for a score percentage.
 *
 * @param {number} score - 0 to 100
 * @returns {{ grade: string, label: string, color: string }}
 *
 * @example
 * getGrade(95) // → { grade: 'A+', label: 'Outstanding', color: '#00e5a0' }
 * getGrade(55) // → { grade: 'D',  label: 'Below Average', color: '#ff6b6b' }
 */
export function getGrade(score) {
  const GRADES = [
    { min: 95, grade: 'A+', label: 'Outstanding',   color: '#00e5a0' },
    { min: 85, grade: 'A',  label: 'Excellent',     color: '#00e5a0' },
    { min: 75, grade: 'B+', label: 'Very Good',     color: '#6c63ff' },
    { min: 65, grade: 'B',  label: 'Good',          color: '#6c63ff' },
    { min: 55, grade: 'C',  label: 'Average',       color: '#ffd166' },
    { min: 40, grade: 'D',  label: 'Below Average', color: '#ff6b6b' },
    { min:  0, grade: 'F',  label: 'Fail',          color: '#ff6b6b' },
  ];
  return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1];
}


/* ================================================================
   §11 URL & QUERY STRING
   ================================================================ */

/**
 * Parse a URL query string into a plain object.
 *
 * @param {string} [queryString=location.search]
 * @returns {object}
 *
 * @example
 * parseQuery('?page=2&subject=math') // → { page: '2', subject: 'math' }
 */
export function parseQuery(queryString) {
  const qs = (queryString ?? '').replace(/^\?/, '');
  if (!qs) return {};
  return Object.fromEntries(new URLSearchParams(qs));
}

/**
 * Build a query string from a plain object.
 *
 * @param {object} params
 * @returns {string} e.g. '?page=2&subject=math'
 *
 * @example
 * buildQuery({ page: 2, subject: 'math' }) // → '?page=2&subject=math'
 */
export function buildQuery(params) {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}


/* ================================================================
   §12 COLOR UTILITIES
   ================================================================ */

/**
 * Convert a hex color to RGB components.
 *
 * @param {string} hex - '#rrggbb' or '#rgb'
 * @returns {{ r: number, g: number, b: number } | null}
 *
 * @example
 * hexToRgb('#6c63ff') // → { r: 108, g: 99, b: 255 }
 */
export function hexToRgb(hex) {
  const clean  = hex.replace('#', '');
  const full   = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num    = parseInt(full, 16);
  if (isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/**
 * Convert RGB components to a hex string.
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string} e.g. '#6c63ff'
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(n => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')).join('');
}

/**
 * Add alpha to a hex color → rgba string.
 *
 * @param {string} hex   - '#rrggbb'
 * @param {number} alpha - 0 to 1
 * @returns {string} e.g. 'rgba(108, 99, 255, 0.2)'
 *
 * @example
 * hexToRgba('#6c63ff', 0.2) // → 'rgba(108, 99, 255, 0.2)'
 */
export function hexToRgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}


/* ================================================================
   §13 STORAGE HELPERS
   ⚠️  These interact with the browser localStorage API.
       Still no DOM manipulation, but they are browser-only.
   ================================================================ */

/**
 * localStorage wrapper with JSON serialization and error handling.
 * All operations fail silently (no throws).
 */
export const storage = {
  /**
   * Get a value from localStorage.
   * @param {string} key
   * @param {*}      [fallback=null]
   * @returns {*}
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Set a value in localStorage (JSON serialized).
   * @param {string} key
   * @param {*}      value
   * @returns {boolean} true if successful
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },

  /**
   * Remove multiple keys from localStorage.
   * @param {string[]} keys
   */
  removeMany(keys) {
    keys.forEach(k => this.remove(k));
  },

  /**
   * Check if a key exists in localStorage.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    try { return localStorage.getItem(key) !== null; } catch { return false; }
  },

  /**
   * Get all localStorage keys matching a prefix.
   * @param {string} prefix
   * @returns {string[]}
   */
  keys(prefix = '') {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith(prefix));
    } catch {
      return [];
    }
  },

  /**
   * Clear all ExamEdge Pro keys (prefixed with 'ee_').
   * Does NOT clear unrelated localStorage keys.
   */
  clearApp() {
    this.keys('ee_').forEach(k => this.remove(k));
  },
};


/* ================================================================
   §14 TOAST HELPER
   ⚠️  This accesses the DOM (#toast-container element).
       It is here for convenience but is NOT a pure function.
       In strict architecture, this belongs in app.js.
   ================================================================ */

const TOAST_ICONS = Object.freeze({
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
});

/**
 * Show a toast notification.
 * Requires a #toast-container element in the DOM.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.message='']
 * @param {'success'|'error'|'warning'|'info'} [opts.type='info']
 * @param {number} [opts.duration=3500]
 *
 * @example
 * showToast({ title: 'Saved!', type: 'success' });
 * showToast({ title: 'Error', message: 'Try again', type: 'error', duration: 5000 });
 */
export function showToast({ title, message = '', type = 'info', duration = 3500 }) {
  if (typeof document === 'undefined') return;

  const container = document.getElementById('toast-container');
  if (!container) {
    console.warn('[Toast] #toast-container not found in DOM.');
    return;
  }

  // Enforce max visible toasts
  const MAX_TOASTS = 3;
  while (container.children.length >= MAX_TOASTS) {
    container.firstElementChild?.remove();
  }

  const toast      = document.createElement('div');
  const typeClass  = `toast--${type}`;
  toast.className  = `toast ${typeClass}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML  = `
    <span class="toast__icon" aria-hidden="true">${TOAST_ICONS[type] ?? 'ℹ️'}</span>
    <div class="toast__body">
      <div class="toast__title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast__msg">${escapeHtml(message)}</div>` : ''}
    </div>
    <button class="toast__close" aria-label="Dismiss notification">✕</button>
  `;

  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('is-exiting');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // Fallback removal if animationend doesn't fire
    setTimeout(() => toast.remove(), 500);
  };

  const timer = setTimeout(dismiss, duration);
  toast.querySelector('.toast__close')?.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss();
  });
}
