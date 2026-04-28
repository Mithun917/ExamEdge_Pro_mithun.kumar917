/**
 * ExamEdge Pro — modules/auth.js
 * Authentication module: sign-in, sign-up, session management.
 * Uses mock data by default; plug in firebase.js for real auth.
 */

import { state }     from '../state.js';
import { CONFIG }    from '../config.js';
import { showToast, storage } from '../utils.js';

/* ── Mock user (development only) ────────────────────────── */

const MOCK_USER = {
  uid:         'mock-uid-001',
  displayName: 'Arjun Sharma',
  email:       'arjun@example.com',
  photoURL:    null,
  role:        'student',
  createdAt:   new Date().toISOString(),
};

/* ── Init ────────────────────────────────────────────────── */

export async function initAuth() {
  // Try to restore session from localStorage
  const savedUser = storage.get(CONFIG.STORAGE_KEYS.USER);

  if (savedUser) {
    state.patch({ user: savedUser, isAuthenticated: true });
    console.log('[Auth] Session restored for:', savedUser.displayName);
  } else {
    // Auto-login with mock user in development mode
    if (CONFIG.ENV === 'development') {
      await _setUser(MOCK_USER);
      console.log('[Auth] Mock user logged in (development).');
    }
  }

  // TODO: replace with onAuthStateChanged(firebase) in production
}

/* ── Sign In ─────────────────────────────────────────────── */

/**
 * Sign in with email and password.
 * @param {string} email
 * @param {string} password
 */
export async function signIn(email, password) {
  try {
    // TODO: const cred = await signInWithEmail(email, password);
    // const user = cred.user;
    await _setUser(MOCK_USER); // mock
    showToast({ title: 'Welcome back!', type: 'success' });
    return { success: true };
  } catch (err) {
    console.error('[Auth] Sign-in failed:', err);
    showToast({ title: 'Sign-in failed', message: err.message, type: 'error' });
    return { success: false, error: err.message };
  }
}

/**
 * Sign in with Google OAuth.
 */
export async function signInGoogle() {
  try {
    // TODO: const cred = await signInWithGoogle();
    await _setUser(MOCK_USER); // mock
    showToast({ title: 'Signed in with Google', type: 'success' });
    return { success: true };
  } catch (err) {
    console.error('[Auth] Google sign-in failed:', err);
    showToast({ title: 'Google sign-in failed', message: err.message, type: 'error' });
    return { success: false, error: err.message };
  }
}

/* ── Sign Up ─────────────────────────────────────────────── */

/**
 * Create a new account with email and password.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 */
export async function signUp(email, password, displayName) {
  try {
    // TODO: const cred = await signUpWithEmail(email, password, displayName);
    const newUser = { ...MOCK_USER, email, displayName };
    await _setUser(newUser); // mock
    showToast({ title: 'Account created!', message: 'Welcome to ExamEdge Pro.', type: 'success' });
    return { success: true };
  } catch (err) {
    console.error('[Auth] Sign-up failed:', err);
    showToast({ title: 'Sign-up failed', message: err.message, type: 'error' });
    return { success: false, error: err.message };
  }
}

/* ── Sign Out ────────────────────────────────────────────── */

export async function signOut() {
  try {
    // TODO: await firebaseSignOut();
    storage.remove(CONFIG.STORAGE_KEYS.USER);
    state.reset();
    showToast({ title: 'Signed out', type: 'info' });
    location.hash = '#dashboard';
    return { success: true };
  } catch (err) {
    console.error('[Auth] Sign-out failed:', err);
    return { success: false, error: err.message };
  }
}

/* ── Helpers ─────────────────────────────────────────────── */

async function _setUser(user) {
  storage.set(CONFIG.STORAGE_KEYS.USER, user);
  state.patch({ user, isAuthenticated: true });
}

/** Returns true if there is an active authenticated user. */
export function isAuthenticated() {
  return state.get('isAuthenticated') === true;
}

/** Returns the current user object or null. */
export function getCurrentUser() {
  return state.get('user');
}
