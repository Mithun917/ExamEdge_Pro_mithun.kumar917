/**
 * ExamEdge Pro — firebase.js
 * Firebase integration layer.
 *
 * ── PLACEHOLDER ──────────────────────────────────────────────
 * This file is intentionally minimal. Fill it in when you are
 * ready to connect Firebase.
 *
 * Steps:
 *  1. Install Firebase:   npm install firebase
 *  2. Create a project at https://console.firebase.google.com
 *  3. Copy your firebaseConfig values into js/config.js
 *  4. Uncomment and implement the stubs below.
 * ─────────────────────────────────────────────────────────────
 */

// import { initializeApp }               from 'firebase/app';
// import { getAuth }                      from 'firebase/auth';
// import { getFirestore }                 from 'firebase/firestore';
// import { getStorage }                   from 'firebase/storage';
// import { getAnalytics }                 from 'firebase/analytics';
// import { CONFIG }                       from './config.js';

/* ── Firebase App ─────────────────────────────────────────── */

let firebaseApp  = null;
let authInstance = null;
let dbInstance   = null;

/**
 * Initialise Firebase. Called once during app bootstrap.
 * @returns {object} { app, auth, db }
 */
export async function initFirebase() {
  // TODO: uncomment once Firebase is installed and configured.
  //
  // firebaseApp  = initializeApp(CONFIG.FIREBASE);
  // authInstance = getAuth(firebaseApp);
  // dbInstance   = getFirestore(firebaseApp);
  //
  // console.log('[Firebase] Initialised successfully.');
  // return { app: firebaseApp, auth: authInstance, db: dbInstance };

  console.warn('[Firebase] Not yet configured — running in offline/mock mode.');
  return null;
}

/* ── Auth helpers (stubs) ────────────────────────────────── */

export async function signInWithGoogle() {
  // TODO: implement Google OAuth sign-in
  throw new Error('Firebase not configured');
}

export async function signInWithEmail(email, password) {
  // TODO: implement email/password sign-in
  throw new Error('Firebase not configured');
}

export async function signUpWithEmail(email, password, displayName) {
  // TODO: implement email/password sign-up
  throw new Error('Firebase not configured');
}

export async function signOut() {
  // TODO: implement sign-out
  throw new Error('Firebase not configured');
}

export function onAuthStateChanged(callback) {
  // TODO: subscribe to auth state changes
  // return authInstance.onAuthStateChanged(callback);
}

/* ── Firestore helpers (stubs) ───────────────────────────── */

export async function getDocument(collection, docId) {
  // TODO: return document from Firestore
  throw new Error('Firebase not configured');
}

export async function setDocument(collection, docId, data) {
  // TODO: set/overwrite document in Firestore
  throw new Error('Firebase not configured');
}

export async function updateDocument(collection, docId, partial) {
  // TODO: merge-update document in Firestore
  throw new Error('Firebase not configured');
}

export async function queryCollection(collection, ...constraints) {
  // TODO: query Firestore collection with where/orderBy/limit
  throw new Error('Firebase not configured');
}

export async function subscribeToDocument(collection, docId, callback) {
  // TODO: real-time subscription to a Firestore document
  // return onSnapshot(doc(dbInstance, collection, docId), callback);
  throw new Error('Firebase not configured');
}

/* ── Storage helpers (stubs) ─────────────────────────────── */

export async function uploadFile(path, file) {
  // TODO: upload file to Firebase Storage
  throw new Error('Firebase not configured');
}

export async function getFileUrl(path) {
  // TODO: get download URL from Firebase Storage
  throw new Error('Firebase not configured');
}
