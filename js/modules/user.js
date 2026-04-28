/**
 * ExamEdge Pro — modules/user.js
 * User profile management: load, update, avatar, preferences.
 */

import { state }  from '../state.js';
import { showToast, storage } from '../utils.js';
import { CONFIG } from '../config.js';

export async function initUser() {
  const user = state.get('user');
  if (!user) return;
  // TODO: fetch full user profile from Firestore
  // const profile = await getDocument('users', user.uid);
  // state.merge('user', profile);
  console.log('[User] User module ready for:', user.displayName);
}

/**
 * Update the current user's profile fields.
 * @param {object} updates - partial user object
 */
export async function updateUserProfile(updates) {
  const user = state.get('user');
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const updated = { ...user, ...updates };
    // TODO: await updateDocument('users', user.uid, updates);
    storage.set(CONFIG.STORAGE_KEYS.USER, updated);
    state.set('user', updated);
    showToast({ title: 'Profile updated', type: 'success' });
    return { success: true };
  } catch (err) {
    showToast({ title: 'Update failed', message: err.message, type: 'error' });
    return { success: false, error: err.message };
  }
}

/**
 * Get the user's display initial(s) for avatar fallback.
 * @returns {string}
 */
export function getUserInitials() {
  const name = state.get('user')?.displayName ?? '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
