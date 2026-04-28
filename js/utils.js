/**
 * ExamEdge Pro — utils.js
 * Shared utility functions: DOM helpers, formatters, toast,
 * debounce/throttle, validators, etc.
 */

/* ── DOM Helpers ─────────────────────────────────────────── */

/**
 * Shorthand querySelector.
 * @param {string}               selector
 * @param {Document|Element}     [ctx=document]
 * @returns {Element|null}
 */
export const $  = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Shorthand querySelectorAll (returns Array).
 * @param {string}               selector
 * @param {Document|Element}     [ctx=document]
 * @returns {Element[]}
 */
export const $$ = (selector, ctx = document) =>
  Array.from(ctx.querySelectorAll(selector));

/**
 * Create a DOM element with optional attrs and children.
 * @param {string} tag
 * @param {object} [attrs]
 * @param {...string|Element} [children]
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class')         el.className = v;
    else if (k === 'dataset')  Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else                       el.setAttribute(k, v);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.insertAdjacentHTML('beforeend', child);
    else if (child instanceof Element) el.appendChild(child);
  });
  return el;
}

/** Empty a DOM element's children. */
export function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/* ── Toast Notifications ─────────────────────────────────── */

const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

/**
 * Show a toast notification.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.message]
 * @param {'success'|'error'|'warning'|'info'} [opts.type='info']
 * @param {number} [opts.duration=3500]
 */
export function showToast({ title, message = '', type = 'info', duration = 3500 }) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast__icon">${TOAST_ICONS[type] ?? '💬'}</div>
    <div class="toast__content">
      <div class="toast__title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast__message">${escapeHtml(message)}</div>` : ''}
    </div>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('exiting');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

/* ── Formatters ──────────────────────────────────────────── */

/**
 * Format seconds to mm:ss string.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Format a Date (or ISO string) to a readable date.
 * @param {Date|string} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDate(date, options = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(date));
}

/**
 * Format a large number with locale separators.
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  return new Intl.NumberFormat('en-IN').format(n);
}

/**
 * Format XP amount (e.g. 1250 → "1.25K XP").
 * @param {number} xp
 * @returns {string}
 */
export function formatXP(xp) {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M XP`;
  if (xp >= 1_000)     return `${(xp / 1_000).toFixed(1)}K XP`;
  return `${xp} XP`;
}

/**
 * Format a percentage score.
 * @param {number} correct
 * @param {number} total
 * @returns {string}
 */
export function formatScore(correct, total) {
  if (total === 0) return '—';
  return `${Math.round((correct / total) * 100)}%`;
}

/**
 * Return elapsed time string (e.g. "3 min ago").
 * @param {Date|string} date
 * @returns {string}
 */
export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m    = Math.floor(diff / 60_000);
  const h    = Math.floor(m / 60);
  const d    = Math.floor(h / 24);
  if (d  > 0)  return `${d}d ago`;
  if (h  > 0)  return `${h}h ago`;
  if (m  > 0)  return `${m}m ago`;
  return 'Just now';
}

/* ── String Utilities ────────────────────────────────────── */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Capitalise the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a random ID string.
 * @param {number} [length=8]
 * @returns {string}
 */
export function generateId(length = 8) {
  return crypto.randomUUID?.().replace(/-/g,'').slice(0, length)
    ?? Math.random().toString(36).slice(2, 2 + length);
}

/* ── Performance Helpers ─────────────────────────────────── */

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number}   delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function.
 * @param {Function} fn
 * @param {number}   limit
 * @returns {Function}
 */
export function throttle(fn, limit) {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun >= limit) {
      lastRun = now;
      fn(...args);
    }
  };
}

/* ── Array / Data Helpers ─────────────────────────────────── */

/**
 * Shuffle an array in place (Fisher-Yates).
 * @param {Array} arr
 * @returns {Array}
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
 * Pick `n` random items from an array.
 * @param {Array}  arr
 * @param {number} n
 * @returns {Array}
 */
export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

/**
 * Group an array of objects by a key.
 * @param {Array}  arr
 * @param {string} key
 * @returns {Object}
 */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key] ?? 'other';
    (acc[group] = acc[group] ?? []).push(item);
    return acc;
  }, {});
}

/* ── Validation Helpers ──────────────────────────────────── */

export const validators = {
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  minLen:  (v, n) => String(v).length >= n,
  maxLen:  (v, n) => String(v).length <= n,
  nonEmpty: v => String(v).trim().length > 0,
  numeric:  v => !isNaN(Number(v)),
};

/* ── LocalStorage Helpers ─────────────────────────────────── */

export const storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};
