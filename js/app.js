/**
 * ExamEdge Pro — app.js
 * Main entry point. Bootstraps the app, initialises modules,
 * handles client-side routing and component mounting.
 */

import { CONFIG }          from './config.js';
import { state }           from './state.js';
import { initAuth }        from './modules/auth.js';
import { initUser }        from './modules/user.js';
import { initXP }          from './modules/xp.js';
import { initAchievements }from './modules/achievements.js';
import { initLeaderboard } from './modules/leaderboard.js';
import { showToast }       from './utils.js';

/* ── Component loader ─────────────────────────────────────── */

/**
 * Fetch an HTML component and inject it into a mount point.
 * @param {string} mountId  - id of the target element
 * @param {string} filePath - path to the HTML component file
 */
async function mountComponent(mountId, filePath) {
  try {
    const res  = await fetch(filePath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const el   = document.getElementById(mountId);
    if (el) el.innerHTML = html;
  } catch (err) {
    console.error(`[App] Failed to mount component "${filePath}":`, err);
  }
}

/* ── Router ──────────────────────────────────────────────── */

/** Map of route hashes → page file paths */
const ROUTES = {
  '#dashboard':   'pages/dashboard.html',
  '#practice':    'pages/practice.html',
  '#mock':        'pages/mock.html',
  '#exam':        'pages/exam.html',
  '#profile':     'pages/profile.html',
  '#leaderboard': 'pages/leaderboard.html',
};

/**
 * Navigate to a page by loading its HTML into #page-content.
 * @param {string} [hash] - optional hash override (defaults to location.hash)
 */
async function navigate(hash) {
  const route   = hash ?? location.hash;
  const page    = ROUTES[route] ?? ROUTES['#dashboard'];
  const content = document.getElementById('page-content');

  if (!content) return;

  // Show loader
  content.innerHTML = `
    <div class="page-loader" aria-live="polite">
      <div class="loader-ring"></div>
      <span>Loading…</span>
    </div>`;

  try {
    const res  = await fetch(page);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    content.innerHTML = html;
    content.scrollTop = 0;

    // Update active nav link
    updateActiveNav(route);

    // Dispatch event so page modules can self-init
    document.dispatchEvent(new CustomEvent('pageLoaded', { detail: { route, page } }));
  } catch (err) {
    content.innerHTML = `
      <div class="page-wrapper">
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <h2 class="empty-state__title">Page not found</h2>
          <p class="empty-state__text">The requested page could not be loaded. Try navigating to the dashboard.</p>
          <a href="#dashboard" class="btn btn-primary">Go to Dashboard</a>
        </div>
      </div>`;
    console.error('[Router] Failed to load page:', err);
  }
}

/** Sync the sidebar nav-link active state with the current route. */
function updateActiveNav(route) {
  document.querySelectorAll('.nav-link[data-route]').forEach(link => {
    link.classList.toggle('active', link.dataset.route === route);
  });
}

/* ── App Bootstrap ───────────────────────────────────────── */

async function bootstrap() {
  console.log(`[App] Starting ${CONFIG.APP_NAME} v${CONFIG.VERSION}`);

  // 1. Mount shared components
  await Promise.all([
    mountComponent('navbar-mount',  'components/navbar.html'),
    mountComponent('sidebar-mount', 'components/sidebar.html'),
    mountComponent('modal-mount',   'components/modal.html'),
  ]);

  // 2. Initialise core modules
  await initAuth();
  await initUser();
  initXP();
  initAchievements();
  initLeaderboard();

  // 3. Set up routing
  window.addEventListener('hashchange', () => navigate());
  navigate(location.hash || '#dashboard');

  // 4. Wire up global UI behaviours
  initGlobalUI();

  console.log('[App] Bootstrap complete.');
}

/* ── Global UI wiring ────────────────────────────────────── */

function initGlobalUI() {
  // Theme toggle
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="toggle-theme"]')) {
      const root  = document.documentElement;
      const theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      state.set('theme', theme);
    }
  });

  // Sidebar mobile toggle
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="toggle-sidebar"]')) {
      document.getElementById('sidebar-mount')
        ?.querySelector('.sidebar')
        ?.classList.toggle('mobile-open');
    }
  });

  // Modal close on overlay click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });

  // Keyboard: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ── Modal helpers (exported for use by page modules) ─────── */

export function openModal(htmlContent) {
  const mount = document.getElementById('modal-mount');
  if (!mount) return;
  mount.innerHTML = htmlContent;
  mount.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  const mount = document.getElementById('modal-mount');
  if (!mount) return;
  mount.innerHTML = '';
  mount.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', bootstrap);
