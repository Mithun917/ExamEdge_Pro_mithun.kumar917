/**
 * ================================================================
 * ExamEdge Pro — component-loader.js
 * COMPONENT LOADER SYSTEM
 *
 * A standalone, reusable system for loading HTML components
 * dynamically into the page. Works with any vanilla JS project.
 *
 * ✅ Zero framework dependencies
 * ✅ In-memory caching — each file fetched only ONCE
 * ✅ Retry on failure — configurable attempts
 * ✅ Loading + error states — visual feedback while fetching
 * ✅ Script re-execution — inline <script> tags run after inject
 * ✅ Lifecycle hooks — onBefore, onAfter, onError callbacks
 * ✅ Parallel loading — load multiple components simultaneously
 * ✅ Lazy loading — load only when element becomes visible
 * ✅ Hot reload — force re-fetch bypassing cache (development)
 * ✅ Component registry — named shortcuts for common components
 * ✅ Clean separation — no DOM coupling outside mount points
 *
 * Usage:
 *  import { loadComponent } from './component-loader.js';
 *
 *  // Basic
 *  await loadComponent('navbar-mount', 'components/navbar.html');
 *
 *  // With options
 *  await loadComponent('sidebar-mount', 'components/sidebar.html', {
 *    cache:    true,
 *    onAfter:  (el) => initSidebar(el),
 *    onError:  (err) => console.error(err),
 *  });
 *
 *  // Load many at once
 *  await loadComponents([
 *    { id: 'navbar-mount',  file: 'components/navbar.html'  },
 *    { id: 'sidebar-mount', file: 'components/sidebar.html' },
 *    { id: 'modal-mount',   file: 'components/modal.html'   },
 *  ]);
 *
 * Section Map:
 *  §1  Configuration & Constants
 *  §2  Component Registry
 *  §3  Cache Manager
 *  §4  loadComponent()       ← Main function
 *  §5  loadComponents()      ← Parallel batch loader
 *  §6  loadRegistered()      ← Load by registry name
 *  §7  loadAllRegistered()   ← Load entire registry
 *  §8  lazyLoadComponent()   ← IntersectionObserver-based
 *  §9  Script Executor
 *  §10 DOM Helpers (mount-point states)
 *  §11 Event System
 *  §12 Diagnostics & Debug
 *  §13 Exports
 * ================================================================
 */


/* ================================================================
   §1  CONFIGURATION & CONSTANTS
   ================================================================ */

/** Default options for every loadComponent() call */
const LOADER_DEFAULTS = {
  /** Use in-memory cache (same file not fetched twice) */
  cache: true,

  /** How many times to retry a failed fetch before giving up */
  retries: 2,

  /** Milliseconds to wait between retry attempts */
  retryDelay: 800,

  /** Show a skeleton/spinner while loading */
  showLoader: true,

  /** Show an error message in the mount point on failure */
  showError: true,

  /**
   * Called with the mount element BEFORE injecting HTML.
   * Return false to cancel the load.
   * @type {((el: HTMLElement) => boolean|void)|null}
   */
  onBefore: null,

  /**
   * Called with the mount element AFTER HTML is injected.
   * Use this to initialize component-specific JS.
   * @type {((el: HTMLElement) => void)|null}
   */
  onAfter: null,

  /**
   * Called when a load fails (all retries exhausted).
   * @type {((err: Error, mountId: string) => void)|null}
   */
  onError: null,

  /**
   * Force re-fetch even if cached.
   * Useful in development / hot-reload.
   */
  force: false,
};

/** Loader version — shown in diagnostics */
const LOADER_VERSION = '1.0.0';


/* ================================================================
   §2  COMPONENT REGISTRY
   Named shortcuts — avoids hardcoding file paths everywhere.
   Add new components here when you create them.
   ================================================================ */

/**
 * Registry of all known components.
 * Key   = short name used with loadRegistered()
 * Value = { mountId, filePath, description }
 */
const COMPONENT_REGISTRY = {

  /* ── Shared Layout Components ──────────────────────────── */
  navbar: {
    mountId:     'navbar-mount',
    filePath:    'components/navbar.html',
    description: 'Top navigation bar with search, XP, and avatar',
  },

  sidebar: {
    mountId:     'sidebar-mount',
    filePath:    'components/sidebar.html',
    description: 'Left sidebar with navigation links and XP meter',
  },

  modal: {
    mountId:     'modal-mount',
    filePath:    'components/modal.html',
    description: 'Global modal mount point',
  },

  /* ── Future Components — add here as you build them ─────── */
  // toast: {
  //   mountId:  'toast-mount',
  //   filePath: 'components/toast.html',
  //   description: 'Toast notification container',
  // },
  // footer: {
  //   mountId:  'footer-mount',
  //   filePath: 'components/footer.html',
  //   description: 'Page footer',
  // },
  // breadcrumb: {
  //   mountId:  'breadcrumb-mount',
  //   filePath: 'components/breadcrumb.html',
  //   description: 'Page breadcrumb navigation',
  // },
};


/* ================================================================
   §3  CACHE MANAGER
   Stores fetched HTML in memory so the same file is never
   requested from the network more than once.
   ================================================================ */

const _cache = {
  /** @type {Map<string, string>} filePath → HTML string */
  _store: new Map(),

  /** @type {Map<string, Promise<string>>} In-flight fetches */
  _pending: new Map(),

  /** Check if a file is cached */
  has(filePath) {
    return this._store.has(filePath);
  },

  /** Get cached HTML */
  get(filePath) {
    return this._store.get(filePath) ?? null;
  },

  /** Store HTML in cache */
  set(filePath, html) {
    this._store.set(filePath, html);
  },

  /** Check if a fetch is already in flight (prevents duplicate requests) */
  isPending(filePath) {
    return this._pending.has(filePath);
  },

  /** Get the in-flight promise */
  getPending(filePath) {
    return this._pending.get(filePath) ?? null;
  },

  /** Register an in-flight fetch */
  setPending(filePath, promise) {
    this._pending.set(filePath, promise);
  },

  /** Remove from pending when fetch completes */
  clearPending(filePath) {
    this._pending.delete(filePath);
  },

  /** Remove a single entry */
  invalidate(filePath) {
    this._store.delete(filePath);
    this._pending.delete(filePath);
  },

  /** Clear everything */
  clear() {
    this._store.clear();
    this._pending.clear();
  },

  /** Summary for diagnostics */
  stats() {
    return {
      cached:  this._store.size,
      pending: this._pending.size,
      keys:    [...this._store.keys()],
    };
  },
};


/* ================================================================
   §4  loadComponent()  ← MAIN FUNCTION
   Load one HTML component into one mount point.
   ================================================================ */

/**
 * Load an HTML component file and inject it into a DOM element.
 *
 * @param {string} mountId   - The `id` of the target container element
 * @param {string} filePath  - Path to the HTML file (relative to index.html)
 * @param {object} [options] - Override any LOADER_DEFAULTS
 * @returns {Promise<LoadResult>}
 *
 * @typedef {object} LoadResult
 * @property {boolean}          success   - Whether the load succeeded
 * @property {string}           mountId   - The mount point ID
 * @property {string}           filePath  - The file that was loaded
 * @property {HTMLElement|null} element   - The mount point element
 * @property {boolean}          fromCache - Whether HTML came from cache
 * @property {number}           duration  - Load time in milliseconds
 * @property {Error|null}       error     - Error if load failed
 *
 * @example
 * // Basic
 * const result = await loadComponent('navbar-mount', 'components/navbar.html');
 * if (result.success) console.log('Navbar loaded!');
 *
 * // With lifecycle hooks
 * await loadComponent('sidebar-mount', 'components/sidebar.html', {
 *   onAfter: (el) => {
 *     // el is the mount element — run sidebar JS here
 *     el.querySelectorAll('.nav-link').forEach(initNavLink);
 *   },
 *   onError: (err) => showToast({ title: 'Failed to load sidebar', type: 'error' }),
 * });
 *
 * // Force re-fetch (development / hot reload)
 * await loadComponent('navbar-mount', 'components/navbar.html', { force: true });
 */
export async function loadComponent(mountId, filePath, options = {}) {
  const opts      = { ...LOADER_DEFAULTS, ...options };
  const startTime = performance.now();

  // ── Resolve mount element ──────────────────────────────────
  const mountEl = _getMountEl(mountId);
  if (!mountEl) {
    const err = new Error(`Mount point #${mountId} not found in DOM.`);
    _log.warn(err.message);
    opts.onError?.(err, mountId);
    return _makeResult({ success: false, mountId, filePath, error: err, startTime });
  }

  // ── onBefore hook ──────────────────────────────────────────
  if (typeof opts.onBefore === 'function') {
    const cancelled = opts.onBefore(mountEl) === false;
    if (cancelled) {
      _log.info(`Load of "${filePath}" cancelled by onBefore hook.`);
      return _makeResult({ success: false, mountId, filePath, element: mountEl, startTime });
    }
  }

  // ── Show loading state ─────────────────────────────────────
  if (opts.showLoader) {
    _dom.setLoading(mountEl, filePath);
  }

  // ── Dispatch "loading" event ───────────────────────────────
  _events.dispatch('componentLoading', { mountId, filePath });

  // ── Fetch HTML (with cache + retry) ──────────────────────
  let html;
  let fromCache = false;

  try {
    const fetched = await _fetchWithCache(filePath, opts);
    html       = fetched.html;
    fromCache  = fetched.fromCache;
  } catch (err) {
    _log.error(`Failed to load "${filePath}" after ${opts.retries} retries:`, err);

    if (opts.showError) {
      _dom.setError(mountEl, filePath, err);
    }

    opts.onError?.(err, mountId);
    _events.dispatch('componentError', { mountId, filePath, error: err });

    return _makeResult({ success: false, mountId, filePath, element: mountEl, error: err, startTime });
  }

  // ── Inject HTML ───────────────────────────────────────────
  mountEl.innerHTML = html;

  // ── Re-execute <script> tags inside injected HTML ─────────
  _scriptExecutor.run(mountEl);

  // ── onAfter hook ──────────────────────────────────────────
  if (typeof opts.onAfter === 'function') {
    try {
      opts.onAfter(mountEl);
    } catch (hookErr) {
      _log.warn(`onAfter hook error for "${filePath}":`, hookErr);
    }
  }

  // ── Dispatch "loaded" event ────────────────────────────────
  const duration = Math.round(performance.now() - startTime);
  _events.dispatch('componentLoaded', { mountId, filePath, fromCache, duration });

  _log.info(`✅ Loaded: "${filePath}" → #${mountId} (${fromCache ? 'cache' : 'network'}, ${duration}ms)`);

  return _makeResult({ success: true, mountId, filePath, element: mountEl, fromCache, startTime });
}


/* ================================================================
   §5  loadComponents()  — Parallel batch loader
   Load multiple components at the same time.
   ================================================================ */

/**
 * Load multiple components in parallel.
 * All fetches start simultaneously — fastest possible loading.
 *
 * @param {Array<{id: string, file: string, options?: object}>} components
 * @returns {Promise<LoadResult[]>}
 *
 * @example
 * const results = await loadComponents([
 *   { id: 'navbar-mount',  file: 'components/navbar.html'  },
 *   { id: 'sidebar-mount', file: 'components/sidebar.html' },
 *   { id: 'modal-mount',   file: 'components/modal.html'   },
 * ]);
 *
 * const allLoaded = results.every(r => r.success);
 * console.log(`${results.filter(r => r.success).length}/${results.length} loaded`);
 */
export async function loadComponents(components) {
  if (!Array.isArray(components) || components.length === 0) {
    _log.warn('loadComponents() called with empty or invalid array.');
    return [];
  }

  _log.info(`Loading ${components.length} component(s) in parallel…`);
  const startTime = performance.now();

  const promises = components.map(({ id, file, options }) =>
    loadComponent(id, file, options)
  );

  const results  = await Promise.allSettled(promises);
  const resolved = results.map(r =>
    r.status === 'fulfilled'
      ? r.value
      : _makeResult({ success: false, error: r.reason })
  );

  const passed  = resolved.filter(r => r.success).length;
  const failed  = resolved.length - passed;
  const elapsed = Math.round(performance.now() - startTime);

  _log.info(`Batch complete: ${passed} loaded, ${failed} failed (${elapsed}ms total)`);

  if (failed > 0) {
    const failedNames = resolved
      .filter(r => !r.success)
      .map(r => r.filePath || 'unknown')
      .join(', ');
    _log.warn(`Failed components: ${failedNames}`);
  }

  return resolved;
}


/* ================================================================
   §6  loadRegistered()  — Load by registry name
   ================================================================ */

/**
 * Load a component by its registry name (defined in COMPONENT_REGISTRY).
 *
 * @param {string} name    - Registry key e.g. 'navbar', 'sidebar', 'modal'
 * @param {object} [options]
 * @returns {Promise<LoadResult>}
 *
 * @example
 * await loadRegistered('navbar');
 * await loadRegistered('sidebar', { onAfter: el => initSidebar(el) });
 */
export async function loadRegistered(name, options = {}) {
  const entry = COMPONENT_REGISTRY[name];

  if (!entry) {
    const err = new Error(
      `Component "${name}" not in registry. ` +
      `Available: ${Object.keys(COMPONENT_REGISTRY).join(', ')}`
    );
    _log.error(err.message);
    return _makeResult({ success: false, error: err });
  }

  return loadComponent(entry.mountId, entry.filePath, options);
}


/* ================================================================
   §7  loadAllRegistered()  — Load entire registry
   ================================================================ */

/**
 * Load ALL components defined in COMPONENT_REGISTRY in parallel.
 * Typically called once in initApp() to set up the page shell.
 *
 * @param {object} [globalOptions] - Options applied to every component
 * @returns {Promise<LoadResult[]>}
 *
 * @example
 * // In app.js initApp():
 * await loadAllRegistered();
 *
 * // With per-component hooks via globalOptions:
 * await loadAllRegistered({ cache: true, showLoader: true });
 */
export async function loadAllRegistered(globalOptions = {}) {
  const entries = Object.entries(COMPONENT_REGISTRY);

  _log.info(`Loading all ${entries.length} registered components…`);

  const batch = entries.map(([name, entry]) => ({
    id:      entry.mountId,
    file:    entry.filePath,
    options: globalOptions,
  }));

  return loadComponents(batch);
}


/* ================================================================
   §8  lazyLoadComponent()  — Intersection Observer
   Load a component only when its mount point scrolls into view.
   Saves bandwidth on components below the fold.
   ================================================================ */

/**
 * Load a component lazily — only when the mount point
 * becomes visible in the viewport.
 *
 * @param {string} mountId
 * @param {string} filePath
 * @param {object} [options]
 * @param {number} [rootMargin='200px'] - Load this far before visible
 * @returns {function} Cancel function — call to stop observing
 *
 * @example
 * // Load leaderboard only when user scrolls to it
 * lazyLoadComponent('leaderboard-mount', 'components/leaderboard-widget.html');
 *
 * // Cancel lazy loading:
 * const cancel = lazyLoadComponent(...);
 * cancel(); // stops observation, component won't load
 */
export function lazyLoadComponent(mountId, filePath, options = {}, rootMargin = '200px') {
  const mountEl = _getMountEl(mountId);

  if (!mountEl) {
    _log.warn(`lazyLoadComponent: #${mountId} not found.`);
    return () => {};
  }

  // If IntersectionObserver not available — load immediately
  if (typeof IntersectionObserver === 'undefined') {
    _log.warn('IntersectionObserver not supported — loading immediately.');
    loadComponent(mountId, filePath, options);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          loadComponent(mountId, filePath, options);
        }
      });
    },
    { rootMargin }
  );

  observer.observe(mountEl);
  _log.info(`Lazy observing: #${mountId} → "${filePath}"`);

  // Return cancel function
  return () => {
    observer.unobserve(mountEl);
    observer.disconnect();
  };
}


/* ================================================================
   §9  SCRIPT EXECUTOR
   Re-execute <script> tags inside dynamically injected HTML.
   Browsers skip scripts that are set via innerHTML.
   ================================================================ */

const _scriptExecutor = {
  /**
   * Find all <script> tags in a container and re-execute them.
   * @param {HTMLElement} container
   */
  run(container) {
    const scripts = container.querySelectorAll('script');
    if (!scripts.length) return;

    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');

      // Copy all attributes (type="module", src, defer, etc.)
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Copy inline script content
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }

      // Replace old script with new (triggers execution)
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    _log.info(`Re-executed ${scripts.length} script(s).`);
  },
};


/* ================================================================
   §10 DOM HELPERS  — Mount-point state management
   Shows loading spinner and error states inside mount points.
   These are the ONLY places in this file that touch the DOM.
   ================================================================ */

const _dom = {
  /**
   * Show a loading skeleton in the mount point.
   * @param {HTMLElement} el
   * @param {string}      filePath - Used in aria-label
   */
  setLoading(el, filePath) {
    const name = filePath.split('/').pop().replace('.html', '');
    el.innerHTML = `
      <div class="component-loading" role="status" aria-label="Loading ${name}…"
        style="display:flex; align-items:center; justify-content:center;
               gap:10px; padding:24px; color:var(--clr-text-3, #5a5e78);
               font-size:0.8125rem; font-family:inherit;">
        <div style="width:16px; height:16px; border:2px solid var(--clr-surface-4,#363950);
                    border-top-color:var(--clr-accent,#6c63ff); border-radius:50%;
                    animation:__loaderSpin 0.7s linear infinite; flex-shrink:0;">
        </div>
        <span>Loading ${name}…</span>
      </div>
      <style>
        @keyframes __loaderSpin { to { transform: rotate(360deg); } }
      </style>`;
  },

  /**
   * Show an error message in the mount point.
   * @param {HTMLElement} el
   * @param {string}      filePath
   * @param {Error}       err
   */
  setError(el, filePath, err) {
    const name = filePath.split('/').pop();
    el.innerHTML = `
      <div class="component-error" role="alert"
        style="display:flex; flex-direction:column; align-items:center;
               gap:8px; padding:24px; text-align:center;
               color:var(--clr-accent-3,#ff6b6b); font-size:0.8125rem; font-family:inherit;">
        <span style="font-size:1.5rem;" aria-hidden="true">⚠️</span>
        <strong>Failed to load ${name}</strong>
        <span style="color:var(--clr-text-3,#5a5e78); font-size:0.75rem;">
          ${err?.message ?? 'Unknown error'}
        </span>
        <button
          onclick="this.closest('.component-error')?.dispatchEvent(new Event('retry', { bubbles:true }))"
          style="margin-top:4px; background:none; border:1px solid currentColor;
                 border-radius:6px; padding:4px 12px; color:inherit;
                 font-size:0.75rem; cursor:pointer; font-family:inherit;">
          ↺ Retry
        </button>
      </div>`;

    // Wire up retry button
    el.querySelector('.component-error')?.addEventListener('retry', () => {
      _log.info(`Retrying load of "${filePath}"…`);
      _cache.invalidate(filePath);
      loadComponent(el.id || el.getAttribute('id') || '', filePath, { force: true });
    });
  },

  /**
   * Clear the mount point (empty it).
   * @param {HTMLElement} el
   */
  clear(el) {
    el.innerHTML = '';
  },
};


/* ================================================================
   §11 EVENT SYSTEM
   Dispatches custom DOM events so other modules can react to
   component loading without coupling to this file.
   ================================================================ */

const _events = {
  /**
   * Dispatch a custom event on document.
   * @param {string} name   - Event name (e.g. 'componentLoaded')
   * @param {object} detail - Payload
   */
  dispatch(name, detail) {
    document.dispatchEvent(new CustomEvent(`loader:${name}`, {
      detail,
      bubbles:    false,
      cancelable: false,
    }));
  },
};

/**
 * Subscribe to a component loader event.
 *
 * @param {'componentLoading'|'componentLoaded'|'componentError'} eventName
 * @param {Function} callback - Receives event.detail
 * @returns {Function} Unsubscribe function
 *
 * @example
 * const unsub = onComponentEvent('componentLoaded', ({ mountId, filePath, duration }) => {
 *   console.log(`${filePath} loaded in ${duration}ms`);
 * });
 * // Later:
 * unsub();
 */
export function onComponentEvent(eventName, callback) {
  const fullName = `loader:${eventName}`;
  const handler  = e => callback(e.detail);
  document.addEventListener(fullName, handler);
  return () => document.removeEventListener(fullName, handler);
}


/* ================================================================
   §12 DIAGNOSTICS & DEBUG
   ================================================================ */

/**
 * Get a diagnostic report of the component loader state.
 * @returns {object}
 *
 * @example
 * import { getLoaderStats } from './component-loader.js';
 * console.table(getLoaderStats());
 */
export function getLoaderStats() {
  const cacheStats = _cache.stats();
  return {
    version:          LOADER_VERSION,
    registeredCount:  Object.keys(COMPONENT_REGISTRY).length,
    registeredNames:  Object.keys(COMPONENT_REGISTRY),
    cachedCount:      cacheStats.cached,
    cachedFiles:      cacheStats.keys,
    pendingCount:     cacheStats.pending,
  };
}

/**
 * Invalidate the cache for a specific file (force re-fetch next time).
 * @param {string} filePath
 */
export function invalidateCache(filePath) {
  _cache.invalidate(filePath);
  _log.info(`Cache invalidated: "${filePath}"`);
}

/**
 * Clear the entire component HTML cache.
 */
export function clearCache() {
  _cache.clear();
  _log.info('Component cache cleared.');
}

/**
 * List all registered components.
 * @returns {Array<{ name, mountId, filePath, description }>}
 *
 * @example
 * listComponents().forEach(c => console.log(c.name, '→', c.filePath));
 */
export function listComponents() {
  return Object.entries(COMPONENT_REGISTRY).map(([name, entry]) => ({
    name,
    mountId:     entry.mountId,
    filePath:    entry.filePath,
    description: entry.description,
  }));
}

/**
 * Register a new component at runtime.
 * Useful for dynamically loaded modules that add their own components.
 *
 * @param {string} name
 * @param {{ mountId: string, filePath: string, description?: string }} entry
 *
 * @example
 * registerComponent('analytics-widget', {
 *   mountId:     'analytics-mount',
 *   filePath:    'components/analytics-widget.html',
 *   description: 'Analytics dashboard widget',
 * });
 * await loadRegistered('analytics-widget');
 */
export function registerComponent(name, entry) {
  if (!entry.mountId || !entry.filePath) {
    throw new Error('[ComponentLoader] registerComponent() requires mountId and filePath.');
  }
  COMPONENT_REGISTRY[name] = {
    mountId:     entry.mountId,
    filePath:    entry.filePath,
    description: entry.description ?? '',
  };
  _log.info(`Component registered: "${name}" → ${entry.filePath}`);
}


/* ================================================================
   INTERNAL HELPERS (not exported)
   ================================================================ */

/**
 * Fetch HTML from a file, using cache and retry logic.
 * @param {string} filePath
 * @param {object} opts
 * @returns {Promise<{ html: string, fromCache: boolean }>}
 */
async function _fetchWithCache(filePath, opts) {
  // Return from cache if available and not forced
  if (opts.cache && !opts.force && _cache.has(filePath)) {
    return { html: _cache.get(filePath), fromCache: true };
  }

  // Deduplicate in-flight requests for the same file
  if (_cache.isPending(filePath)) {
    _log.info(`Waiting for in-flight fetch: "${filePath}"`);
    const html = await _cache.getPending(filePath);
    return { html, fromCache: false };
  }

  // Start fetch with retry
  const fetchPromise = _fetchWithRetry(filePath, opts.retries, opts.retryDelay);
  _cache.setPending(filePath, fetchPromise);

  try {
    const html = await fetchPromise;
    if (opts.cache) _cache.set(filePath, html);
    return { html, fromCache: false };
  } finally {
    _cache.clearPending(filePath);
  }
}

/**
 * Fetch a file with automatic retries on failure.
 * @param {string} filePath
 * @param {number} retries
 * @param {number} retryDelay
 * @returns {Promise<string>} HTML string
 */
async function _fetchWithRetry(filePath, retries, retryDelay) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      _log.warn(`Retry ${attempt}/${retries} for "${filePath}"…`);
      await _sleep(retryDelay);
    }

    try {
      const res = await fetch(filePath, {
        cache: 'no-store',
        headers: { 'Accept': 'text/html' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} — "${filePath}"`);
      }

      return await res.text();

    } catch (err) {
      lastError = err;

      // Don't retry on 404 (file genuinely missing)
      if (err.message.includes('HTTP 404')) {
        throw new Error(`Component not found: "${filePath}" (404)`);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch "${filePath}"`);
}

/**
 * Get a mount element by ID with helpful error.
 * @param {string} mountId
 * @returns {HTMLElement|null}
 */
function _getMountEl(mountId) {
  if (!mountId) return null;
  return document.getElementById(mountId);
}

/**
 * Build a LoadResult object.
 * @param {object} params
 * @returns {LoadResult}
 */
function _makeResult({ success, mountId = '', filePath = '',
                        element = null, fromCache = false,
                        error = null, startTime = 0 }) {
  return {
    success,
    mountId,
    filePath,
    element,
    fromCache,
    error,
    duration: startTime ? Math.round(performance.now() - startTime) : 0,
  };
}

/** Simple async sleep */
function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Internal logger — silent in production */
const _log = {
  _prefix: '[ComponentLoader]',
  info (...a) { console.log  (this._prefix, ...a); },
  warn (...a) { console.warn (this._prefix, ...a); },
  error(...a) { console.error(this._prefix, ...a); },
};
