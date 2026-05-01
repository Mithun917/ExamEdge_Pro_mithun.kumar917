/**
 * ================================================================
 * ExamEdge Pro — app.js
 * MAIN ENTRY POINT
 *
 * Responsibilities:
 *  1. initApp()      — Bootstrap the entire application
 *  2. loadPage()     — Dynamic page loading (SPA router)
 *  3. attachEvents() — Global event delegation
 *
 * Architecture:
 *  - Zero global scope pollution (everything inside IIFE + module)
 *  - All state flows through state.js
 *  - All constants live in config.js
 *  - Modules are lazy-loaded per page when needed
 *  - Each section is clearly labelled for easy navigation
 *
 * Section Map:
 *  §1  Imports
 *  §2  Route Registry
 *  §3  Component Registry
 *  §4  App State (internal)
 *  §5  initApp()
 *  §6  Component Loader
 *  §7  Router / loadPage()
 *  §8  Page Lifecycle
 *  §9  attachEvents()
 *  §10 Theme Manager
 *  §11 Sidebar Manager
 *  §12 Search Handler
 *  §13 Modal Manager
 *  §14 Toast System
 *  §15 Error Boundary
 *  §16 Performance Helpers
 *  §17 Public API (exports)
 *  §18 Boot
 * ================================================================
 */


/* ================================================================
   §1  IMPORTS
   ================================================================ */

import { CONFIG }           from './config.js';
import { state }            from './state.js';
import { showToast,
         debounce,
         formatXP,
         storage }          from './utils.js';

// Core modules — always loaded
import { initAuth,
         isAuthenticated }  from './modules/auth.js';
import { initUser,
         getUserInitials }  from './modules/user.js';
import { initXP,
         getLevelProgress } from './modules/xp.js';


/* ================================================================
   §2  ROUTE REGISTRY
   Maps URL hash → page HTML file path
   Add new pages here only — no other file needs changing.
   ================================================================ */

const ROUTES = Object.freeze({
  '#dashboard':   'pages/dashboard.html',
  '#practice':    'pages/practice.html',
  '#mock':        'pages/mock.html',
  '#exam':        'pages/exam.html',
  '#profile':     'pages/profile.html',
  '#leaderboard': 'pages/leaderboard.html',
  '#auth':        'auth.html',

  // Future routes — add here when pages are created:
  // '#settings':  'pages/settings.html',
  // '#results':   'pages/results.html',
  // '#analytics': 'pages/analytics.html',
});

/** Default route when hash is empty or not found */
const DEFAULT_ROUTE = '#dashboard';

/** Routes that require authentication to access */
const PROTECTED_ROUTES = new Set([
  '#dashboard', '#practice', '#mock',
  '#exam', '#profile', '#leaderboard',
]);

/** Routes accessible WITHOUT authentication */
const PUBLIC_ROUTES = new Set(['#auth']);


/* ================================================================
   §3  COMPONENT REGISTRY
   Maps mount-point ID → HTML component file path
   ================================================================ */

const COMPONENTS = Object.freeze({
  'navbar-mount':  'components/navbar.html',
  'sidebar-mount': 'components/sidebar.html',
  'modal-mount':   'components/modal.html',
});


/* ================================================================
   §4  APP INTERNAL STATE
   Private to this module — not exposed globally
   ================================================================ */

const _app = {
  /** Whether initApp() has already run */
  initialized: false,

  /** Currently active route hash */
  currentRoute: null,

  /** Previously active route hash (for back-navigation logic) */
  previousRoute: null,

  /** Track pending page fetch so we can abort on fast navigation */
  abortController: null,

  /** Page-level cleanup functions registered by loadPage() */
  pageCleanupFns: [],

  /** Whether the sidebar is open on mobile */
  sidebarMobileOpen: false,

  /** Active search debounce timer (internal) */
  _searchTimer: null,
};


/* ================================================================
   §5  initApp()
   Main bootstrap function — called once on DOMContentLoaded.
   Everything starts here.
   ================================================================ */

/**
 * Initialize the ExamEdge Pro application.
 *
 * Sequence:
 *  1. Restore persisted theme immediately (before paint)
 *  2. Load shared HTML components (navbar, sidebar, modal)
 *  3. Initialize core JS modules (auth, user, XP)
 *  4. Set up global event listeners
 *  5. Start the router
 *  6. Update navbar UI with current user data
 *
 * @returns {Promise<void>}
 */
async function initApp() {
  if (_app.initialized) {
    console.warn('[App] initApp() called more than once — skipping.');
    return;
  }

  _logger.time('App Bootstrap');
  _logger.info(`Starting ${CONFIG.APP_NAME} v${CONFIG.VERSION} [${CONFIG.ENV}]`);

  try {
    // ── Step 1: Theme (sync — must happen before first paint) ──
    _themeManager.restore();

    // ── Step 2: Load shared components in parallel ─────────────
    _logger.info('Loading components…');
    await _loadAllComponents();

    // ── Step 3: Initialize core modules ────────────────────────
    _logger.info('Initializing modules…');
    await _initCoreModules();

    // ── Step 4: Attach all global events ───────────────────────
    attachEvents();

    // ── Step 5: Start router ────────────────────────────────────
    _router.start();

    // ── Step 6: Sync navbar with current user/state ─────────────
    _navbarUI.sync();

    // ── Step 7: Subscribe to state changes ──────────────────────
    _subscribeToState();

    _app.initialized = true;
    _logger.timeEnd('App Bootstrap');
    _logger.info('Bootstrap complete ✅');

    // Dispatch global ready event — page modules can listen to this
    document.dispatchEvent(new CustomEvent('appReady', {
      detail: { version: CONFIG.VERSION },
    }));

  } catch (err) {
    _errorBoundary.handle(err, 'initApp');
  }
}


/* ================================================================
   §6  COMPONENT LOADER
   Fetches HTML components and injects them into mount points.
   ================================================================ */

/**
 * Load a single HTML component into a DOM mount point.
 *
 * @param {string} mountId  - The ID of the target element
 * @param {string} filePath - Path to the HTML component file
 * @returns {Promise<boolean>} - true if successful
 */
async function loadComponent(mountId, filePath) {
  const mountEl = document.getElementById(mountId);

  if (!mountEl) {
    _logger.warn(`Mount point #${mountId} not found — skipping component.`);
    return false;
  }

  try {
    const res = await fetch(filePath, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — Could not load ${filePath}`);
    }

    const html = await res.text();
    mountEl.innerHTML = html;

    // Re-execute any <script type="module"> tags inside the component
    _executeScripts(mountEl);

    _logger.info(`Component loaded: ${filePath} → #${mountId}`);
    return true;

  } catch (err) {
    _logger.error(`Failed to load component "${filePath}"`, err);
    mountEl.innerHTML = `<!-- Component failed to load: ${filePath} -->`;
    return false;
  }
}

/**
 * Load ALL registered components in parallel.
 * @returns {Promise<void>}
 */
async function _loadAllComponents() {
  const promises = Object.entries(COMPONENTS).map(
    ([mountId, filePath]) => loadComponent(mountId, filePath)
  );

  const results = await Promise.allSettled(promises);
  const failed  = results.filter(r => r.status === 'rejected');

  if (failed.length > 0) {
    _logger.warn(`${failed.length} component(s) failed to load.`);
  }
}

/**
 * Re-execute <script> tags inside dynamically injected HTML.
 * Browsers don't auto-execute scripts in innerHTML.
 *
 * @param {Element} container - The element containing injected HTML
 */
function _executeScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach(oldScript => {
    const newScript = document.createElement('script');

    // Copy all attributes (type, src, etc.)
    Array.from(oldScript.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });

    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}


/* ================================================================
   §7  ROUTER / loadPage()
   Hash-based SPA router.
   ================================================================ */

/**
 * Load a page by name or hash into #page-content.
 *
 * Can be called with:
 *   loadPage('dashboard')        → loads #dashboard
 *   loadPage('#practice')        → loads #practice
 *   loadPage()                   → reads location.hash
 *
 * @param {string} [pageNameOrHash] - Page name or hash string
 * @returns {Promise<void>}
 */
async function loadPage(pageNameOrHash) {
  // Normalize input → always a hash string
  let hash = pageNameOrHash ?? location.hash;
  if (hash && !hash.startsWith('#')) hash = `#${hash}`;
  if (!hash) hash = DEFAULT_ROUTE;

  // Guard: don't reload the same page (unless forced)
  if (hash === _app.currentRoute) return;

  // Auth guard: redirect unauthenticated users to auth page
  if (PROTECTED_ROUTES.has(hash) && !isAuthenticated()) {
    _logger.info(`[Router] Auth required for ${hash} — redirecting to #auth`);
    location.hash = '#auth';
    return;
  }

  // Resolve file path from route registry
  const filePath = ROUTES[hash];

  if (!filePath) {
    _logger.warn(`[Router] Unknown route: "${hash}" — showing 404`);
    _render404();
    return;
  }

  // ── Abort any in-flight page request ────────────────────────
  if (_app.abortController) {
    _app.abortController.abort();
  }
  _app.abortController = new AbortController();

  // ── Run cleanup from previous page ──────────────────────────
  _pageLifecycle.cleanup();

  // ── Track route history ──────────────────────────────────────
  _app.previousRoute = _app.currentRoute;
  _app.currentRoute  = hash;
  state.set('currentRoute', hash);

  // ── Show loading state ───────────────────────────────────────
  _renderLoader();

  // ── Fetch and inject page HTML ───────────────────────────────
  try {
    const res = await fetch(filePath, {
      signal: _app.abortController.signal,
      cache:  CONFIG.ENV === 'production' ? 'default' : 'no-store',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html    = await res.text();
    const content = document.getElementById('page-content');
    if (!content) return;

    content.innerHTML = html;
    content.scrollTop = 0;

    // Re-execute page-level scripts
    _executeScripts(content);

    // Update sidebar active state
    _sidebarManager.setActive(hash);

    // Close mobile sidebar after navigation
    _sidebarManager.closeMobile();

    // Dispatch pageLoaded event — page modules listen to this
    document.dispatchEvent(new CustomEvent('pageLoaded', {
      detail: {
        route:    hash,
        filePath: filePath,
        previous: _app.previousRoute,
      },
    }));

    _logger.info(`[Router] Loaded: ${hash} → ${filePath}`);

  } catch (err) {
    if (err.name === 'AbortError') {
      _logger.info('[Router] Page fetch aborted (faster navigation).');
      return;
    }
    _logger.error('[Router] Page load failed:', err);
    _renderPageError(hash, filePath);
  }
}

/** Internal router namespace */
const _router = {
  /** Start listening to hash changes and load initial route */
  start() {
    window.addEventListener('hashchange', () => {
      loadPage(location.hash);
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      loadPage(location.hash);
    });

    // Load the initial route
    loadPage(location.hash || DEFAULT_ROUTE);
  },

  /** Navigate programmatically */
  go(hash) {
    location.hash = hash;
  },

  /** Go back to previous route */
  back() {
    if (_app.previousRoute) {
      location.hash = _app.previousRoute;
    } else {
      location.hash = DEFAULT_ROUTE;
    }
  },
};


/* ================================================================
   §8  PAGE LIFECYCLE
   Manages per-page setup and teardown.
   ================================================================ */

const _pageLifecycle = {
  /**
   * Register a cleanup function that runs before the next page loads.
   * Call this from page-level scripts to avoid memory leaks.
   *
   * Usage (inside a page's <script type="module">):
   *   import { onPageUnload } from '../js/app.js';
   *   onPageUnload(() => clearInterval(myTimer));
   *
   * @param {Function} fn - Cleanup function
   */
  register(fn) {
    if (typeof fn === 'function') {
      _app.pageCleanupFns.push(fn);
    }
  },

  /** Run all registered cleanup functions and clear the list */
  cleanup() {
    _app.pageCleanupFns.forEach(fn => {
      try { fn(); } catch (e) { _logger.warn('Page cleanup error:', e); }
    });
    _app.pageCleanupFns = [];
  },
};


/* ================================================================
   §9  attachEvents()
   Global event delegation — ONE listener for all interactions.
   All page-specific events are handled here via data attributes.
   ================================================================ */

/**
 * Attach all global event listeners.
 * Uses event delegation where possible — a single listener
 * on document handles all clicks, keyboard, and form events.
 *
 * Convention: HTML elements use data-action="action-name"
 * to trigger handlers without inline JavaScript.
 */
function attachEvents() {

  // ── Global click delegation ────────────────────────────────
  document.addEventListener('click', _handleGlobalClick);

  // ── Keyboard shortcuts ─────────────────────────────────────
  document.addEventListener('keydown', _handleKeydown);

  // ── Hash navigation links ──────────────────────────────────
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      const hash = link.getAttribute('href');
      if (ROUTES[hash]) {
        e.preventDefault();
        loadPage(hash);
        history.pushState(null, '', hash);
      }
    }
  });

  // ── Global search input ────────────────────────────────────
  document.addEventListener('input', e => {
    if (e.target.id === 'global-search') {
      _searchHandler.onInput(e.target.value);
    }
  });

  // ── State subscriptions for UI updates ────────────────────
  // (handled separately in _subscribeToState)

  _logger.info('Global events attached.');
}

/**
 * Central click handler — matches data-action attributes.
 * @param {MouseEvent} e
 */
function _handleGlobalClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch (action) {

    case 'toggle-theme':
      _themeManager.toggle();
      break;

    case 'toggle-sidebar':
      _sidebarManager.toggleMobile();
      break;

    case 'close-sidebar':
      _sidebarManager.closeMobile();
      break;

    case 'close-modal':
      modalManager.close();
      break;

    case 'logout':
      _handleLogout();
      break;

    case 'go-back':
      _router.back();
      break;

    case 'navigate':
      if (target.dataset.route) loadPage(target.dataset.route);
      break;

    default:
      // Unknown action — do nothing, let page-level handlers deal with it
      break;
  }
}

/**
 * Global keyboard shortcuts handler.
 * @param {KeyboardEvent} e
 */
function _handleKeydown(e) {
  // ⌘K / Ctrl+K — focus search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('global-search')?.focus();
    return;
  }

  // Escape — close modal or sidebar
  if (e.key === 'Escape') {
    if (modalManager.isOpen()) {
      modalManager.close();
      return;
    }
    if (_app.sidebarMobileOpen) {
      _sidebarManager.closeMobile();
      return;
    }
  }

  // Alt+← — go back
  if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    _router.back();
    return;
  }

  // Number keys 1–6 — quick navigation (when not in input)
  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

  const shortcuts = { '1':'#dashboard','2':'#practice','3':'#mock','4':'#exam','5':'#leaderboard','6':'#profile' };
  if (e.altKey && shortcuts[e.key]) {
    e.preventDefault();
    loadPage(shortcuts[e.key]);
  }
}


/* ================================================================
   §10 THEME MANAGER
   Handles dark/light theme toggle and persistence.
   ================================================================ */

const _themeManager = {
  /** Restore theme from localStorage before first paint */
  restore() {
    const saved = storage.get(CONFIG.STORAGE_KEYS.THEME) || 'dark';
    this.apply(saved);
  },

  /** Toggle between dark and light */
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next    = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    state.set('theme', next);

    showToast({
      title:    next === 'dark' ? '🌙 Dark mode' : '☀️ Light mode',
      type:     'info',
      duration: 1500,
    });
  },

  /** Apply a specific theme */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    storage.set(CONFIG.STORAGE_KEYS.THEME, theme);
    this._syncIcons(theme);
  },

  /** Sync the sun/moon icons in the navbar */
  _syncIcons(theme) {
    const sun  = document.getElementById('i-sun')  || document.getElementById('icon-sun');
    const moon = document.getElementById('i-moon') || document.getElementById('icon-moon');
    if (sun)  sun.style.display  = theme === 'dark'  ? '' : 'none';
    if (moon) moon.style.display = theme === 'light' ? '' : 'none';
  },
};


/* ================================================================
   §11 SIDEBAR MANAGER
   Controls sidebar open/close/active state.
   ================================================================ */

const _sidebarManager = {
  /** Get the sidebar element */
  _el() {
    return (
      document.getElementById('sidebar') ||
      document.getElementById('sidebar-mount')?.querySelector('.sidebar')
    );
  },

  /** Get the overlay element */
  _overlay() {
    return document.getElementById('sidebar-overlay');
  },

  /** Toggle mobile sidebar open/closed */
  toggleMobile() {
    _app.sidebarMobileOpen ? this.closeMobile() : this.openMobile();
  },

  /** Open the sidebar on mobile */
  openMobile() {
    this._el()?.classList.add('mobile-open');
    const overlay = this._overlay();
    if (overlay) overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    _app.sidebarMobileOpen = true;
    document.getElementById('mobile-menu-btn')?.setAttribute('aria-expanded', 'true');
  },

  /** Close the sidebar on mobile */
  closeMobile() {
    this._el()?.classList.remove('mobile-open');
    const overlay = this._overlay();
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    _app.sidebarMobileOpen = false;
    document.getElementById('mobile-menu-btn')?.setAttribute('aria-expanded', 'false');
  },

  /** Set the active nav link based on current route */
  setActive(hash) {
    document.querySelectorAll('.nav-link[data-route]').forEach(link => {
      link.classList.toggle('active', link.dataset.route === hash);
    });
  },

  /** Update the XP meter in the sidebar footer */
  updateXPMeter() {
    const lp = getLevelProgress();

    const levelEl  = document.getElementById('sb-level') || document.getElementById('sidebar-level');
    const xpEl     = document.getElementById('sb-xp')    || document.getElementById('sidebar-xp-pts');
    const barEl    = document.getElementById('sb-bar')   || document.getElementById('sidebar-xp-bar');
    const nextEl   = document.getElementById('sb-next');

    if (levelEl) levelEl.textContent = `Lv. ${lp.level}`;
    if (xpEl)    xpEl.textContent    = formatXP(lp.current);
    if (barEl)   barEl.style.width   = `${Math.round(lp.progress * 100)}%`;
    if (nextEl)  nextEl.textContent  = `Next level in ${Math.max(0, lp.ceil === Infinity ? 0 : lp.ceil - lp.current)} XP`;
  },
};


/* ================================================================
   §12 SEARCH HANDLER
   Handles global search input with debouncing.
   ================================================================ */

const _searchHandler = {
  /** Debounced search — fires 300ms after user stops typing */
  onInput: debounce(function(query) {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Clear any search overlay
      document.dispatchEvent(new CustomEvent('searchCleared'));
      return;
    }

    if (q.length < 2) return;

    _logger.info(`[Search] Query: "${q}"`);

    // Dispatch search event — page modules can listen and filter
    document.dispatchEvent(new CustomEvent('globalSearch', {
      detail: { query: q },
    }));
  }, 300),
};


/* ================================================================
   §13 MODAL MANAGER
   Controls the global modal mount point.
   ================================================================ */

const modalManager = {
  _mount() {
    return document.getElementById('modal-mount');
  },

  /** Check if a modal is currently open */
  isOpen() {
    const mount = this._mount();
    return mount ? mount.children.length > 0 : false;
  },

  /**
   * Open a modal by injecting HTML.
   * @param {string} htmlContent - Full modal HTML including .modal-overlay
   */
  open(htmlContent) {
    const mount = this._mount();
    if (!mount) return;

    mount.innerHTML      = htmlContent;
    mount.ariaHidden     = 'false';
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    mount.querySelector('.modal-overlay')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) this.close();
    });

    // Focus first focusable element inside modal
    requestAnimationFrame(() => {
      const focusable = mount.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    });
  },

  /**
   * Open a pre-built confirm modal.
   * @param {object} opts
   * @param {string}   opts.title
   * @param {string}   opts.message
   * @param {string}   [opts.confirmLabel='Confirm']
   * @param {string}   [opts.cancelLabel='Cancel']
   * @param {string}   [opts.type='default'] - 'default' | 'danger'
   * @param {Function} opts.onConfirm
   * @param {Function} [opts.onCancel]
   */
  confirm({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
            type = 'default', onConfirm, onCancel } = {}) {
    const btnClass  = type === 'danger' ? 'btn-danger' : 'btn-primary';
    const iconEmoji = type === 'danger' ? '⚠️' : 'ℹ️';

    this.open(`
      <div class="modal-overlay">
        <div class="modal modal--sm">
          <div class="modal__header">
            <div>
              <div style="font-size:2rem; margin-bottom:var(--sp-2)">${iconEmoji}</div>
              <h3 class="modal__title">${_escHtml(title)}</h3>
              ${message ? `<p class="modal__subtitle">${_escHtml(message)}</p>` : ''}
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn-secondary" id="modal-cancel-btn">${_escHtml(cancelLabel)}</button>
            <button class="btn ${btnClass}"   id="modal-confirm-btn">${_escHtml(confirmLabel)}</button>
          </div>
        </div>
      </div>
    `);

    document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
      this.close();
      onConfirm?.();
    });
    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
      this.close();
      onCancel?.();
    });
  },

  /** Close and clear the modal */
  close() {
    const mount = this._mount();
    if (!mount) return;
    mount.innerHTML      = '';
    mount.ariaHidden     = 'true';
    document.body.style.overflow = '';
  },
};


/* ================================================================
   §14 TOAST SYSTEM
   Re-exports showToast from utils.js with app-level defaults.
   ================================================================ */

/**
 * Show a toast notification.
 * Wraps utils.showToast with app-level defaults.
 *
 * @param {string} title
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 * @param {string} [message]
 * @param {number} [duration=3500]
 */
function toast(title, type = 'info', message = '', duration = 3500) {
  showToast({ title, type, message, duration });
}


/* ================================================================
   §15 ERROR BOUNDARY
   Catches and gracefully handles runtime errors.
   ================================================================ */

const _errorBoundary = {
  /**
   * Handle an error at the app level.
   * @param {Error}  err     - The error object
   * @param {string} context - Where the error occurred
   */
  handle(err, context = 'unknown') {
    _logger.error(`[${context}] Unhandled error:`, err);

    showToast({
      title:   'Something went wrong',
      message: CONFIG.ENV === 'development' ? err.message : 'Please refresh the page.',
      type:    'error',
      duration: 6000,
    });
  },

  /** Install global error catchers */
  install() {
    window.addEventListener('unhandledrejection', e => {
      this.handle(e.reason, 'Promise');
    });

    window.addEventListener('error', e => {
      this.handle(e.error || new Error(e.message), 'Window');
    });
  },
};


/* ================================================================
   §16 PERFORMANCE & INTERNAL HELPERS
   ================================================================ */

/** Internal logger — respects ENV (silent in production) */
const _logger = {
  _prefix: `[${CONFIG?.APP_NAME || 'App'}]`,

  info  (...args) { if (CONFIG.ENV !== 'production') console.log  (this._prefix, ...args); },
  warn  (...args) {                                   console.warn (this._prefix, ...args); },
  error (...args) {                                   console.error(this._prefix, ...args); },
  time  (label)  { if (CONFIG.ENV !== 'production') console.time  (label); },
  timeEnd(label) { if (CONFIG.ENV !== 'production') console.timeEnd(label); },
};

/** Simple HTML escape for modal/toast content */
function _escHtml(str) {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' };
  return String(str ?? '').replace(/[&<>"']/g, m => map[m]);
}

/** Render the loading spinner into #page-content */
function _renderLoader() {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = `
    <div class="page-loader" aria-live="polite" aria-busy="true">
      <div class="spinner spinner-lg"></div>
      <span>Loading…</span>
    </div>`;
}

/** Render a 404 / unknown route message */
function _render404() {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = `
    <div class="page-wrapper">
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <h2 class="empty-state__title">Page Not Found</h2>
        <p class="empty-state__text">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="#dashboard" class="btn btn-primary mt-5">Back to Dashboard</a>
      </div>
    </div>`;
}

/** Render a page-load error message */
function _renderPageError(hash, filePath) {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = `
    <div class="page-wrapper">
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h2 class="empty-state__title">Failed to Load Page</h2>
        <p class="empty-state__text">
          Could not load <code>${_escHtml(filePath)}</code>.
          ${CONFIG.ENV === 'development'
            ? '<br/>Check the console for details.'
            : 'Please try again.'}
        </p>
        <div class="flex gap-3 mt-5 justify-center">
          <button class="btn btn-secondary" onclick="location.reload()">Refresh</button>
          <a href="#dashboard" class="btn btn-primary">Dashboard</a>
        </div>
      </div>
    </div>`;
}


/* ================================================================
   §16b  CORE MODULE INITIALIZER
   ================================================================ */

/** Initialize all core modules in the correct order */
async function _initCoreModules() {
  try {
    // Auth must run first — determines if user is logged in
    await initAuth();

    // User profile — depends on auth
    await initUser();

    // XP system — depends on user
    initXP();

    // Feature-flagged modules
    if (CONFIG.FEATURES.ACHIEVEMENTS) {
      const { initAchievements } = await import('./modules/achievements.js');
      initAchievements();
    }

    if (CONFIG.FEATURES.LEADERBOARD) {
      const { initLeaderboard } = await import('./modules/leaderboard.js');
      initLeaderboard();
    }

    _logger.info('All core modules initialized.');

  } catch (err) {
    _logger.error('Module initialization failed:', err);
    throw err;
  }
}


/* ================================================================
   §16c  NAVBAR UI UPDATER
   ================================================================ */

const _navbarUI = {
  /** Sync navbar with current state (user, XP, streak) */
  sync() {
    const user   = state.get('user');
    const xp     = state.get('xp')     || 0;
    const streak = state.get('streak') || 0;

    // XP badge
    const xpEl = document.getElementById('navbar-xp-val') ||
                 document.getElementById('navbar-xp-value');
    if (xpEl) xpEl.textContent = formatXP(xp);

    // Streak badge
    const stEl = document.getElementById('navbar-streak-val') ||
                 document.getElementById('navbar-streak-value');
    if (stEl) stEl.textContent = streak;

    // Avatar initials
    const avEl = document.getElementById('navbar-avatar');
    if (avEl) avEl.textContent = getUserInitials();

    // Username
    const unEl = document.getElementById('navbar-uname') ||
                 document.getElementById('navbar-username');
    if (unEl && user) unEl.textContent = user.displayName?.split(' ')[0] || '';

    // Sidebar XP meter
    _sidebarManager.updateXPMeter();
  },
};


/* ================================================================
   §16d  STATE SUBSCRIPTIONS
   React to state changes and update UI automatically.
   ================================================================ */

function _subscribeToState() {
  // When XP changes → update navbar + sidebar
  state.subscribe('xp', () => _navbarUI.sync());

  // When streak changes → update navbar
  state.subscribe('streak', () => _navbarUI.sync());

  // When user changes → update navbar
  state.subscribe('user', () => _navbarUI.sync());

  // When theme changes → apply it
  state.subscribe('theme', theme => _themeManager.apply(theme));
}


/* ================================================================
   §16e  LOGOUT HANDLER
   ================================================================ */

async function _handleLogout() {
  modalManager.confirm({
    title:        'Log Out',
    message:      'Are you sure you want to log out of ExamEdge Pro?',
    confirmLabel: 'Log Out',
    cancelLabel:  'Stay',
    type:         'danger',
    onConfirm: async () => {
      try {
        const { signOut } = await import('./modules/auth.js');
        await signOut();
        toast('Logged out successfully', 'info');
        loadPage('#auth');
      } catch (err) {
        _errorBoundary.handle(err, 'logout');
      }
    },
  });
}


/* ================================================================
   §17 PUBLIC API
   Only these symbols are exported — everything else is private.
   ================================================================ */

export {
  // Core lifecycle
  initApp,
  loadPage,
  loadComponent,
  attachEvents,

  // Navigation
  _router as router,

  // Modal
  modalManager,

  // Toast shorthand
  toast,

  // Page lifecycle (for page-level scripts to register cleanup)
  _pageLifecycle as pageLifecycle,

  // Managers (for advanced use by modules)
  _themeManager  as themeManager,
  _sidebarManager as sidebarManager,

  // Legacy aliases — keeps older page scripts working
  modalManager  as openModal,   // call modalManager.open(html) instead
};

/**
 * Register a cleanup function to run before the next page loads.
 * Use this in page-level <script type="module"> blocks to
 * clear timers, intervals, or event listeners.
 *
 * @example
 * // Inside pages/practice.html <script>
 * import { onPageUnload } from '../js/app.js';
 * const timer = setInterval(tick, 1000);
 * onPageUnload(() => clearInterval(timer));
 */
export function onPageUnload(fn) {
  _pageLifecycle.register(fn);
}


/* ================================================================
   §18 BOOT
   DOMContentLoaded → initApp()
   ================================================================ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    _errorBoundary.install();
    initApp();
  });
} else {
  // DOM already loaded (script deferred or module loaded late)
  _errorBoundary.install();
  initApp();
}
