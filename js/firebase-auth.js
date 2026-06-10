/* ─────────────────────────────────────────────────────────────
   MathMunch — Firebase Authentication bridge
   Exposes a small, framework-free API on window.mmAuth that the
   login & signup pages call. Maps the Firebase user onto the app's
   existing `mm_user` localStorage shape so the rest of the site
   keeps working unchanged.
───────────────────────────────────────────────────────────── */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const isConfigured =
  firebaseConfig &&
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.length > 0 &&
  !firebaseConfig.apiKey.includes("PASTE");

if (!isConfigured) {
  // Pages read this flag and tell the user to finish setup.
  window.mmAuthError = "Sign-in isn't set up yet. Add your Firebase keys in js/firebase-config.js";
  console.warn("[MathMunch] " + window.mmAuthError);
  window.dispatchEvent(new Event("mmauth-ready"));
} else {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.useDeviceLanguage();
  const googleProvider = new GoogleAuthProvider();

  // Friendly, kid-site-appropriate messages for Firebase error codes.
  const MESSAGES = {
    "auth/invalid-credential":    "That email or password doesn't match. Please try again.",
    "auth/wrong-password":        "That password isn't right. Please try again.",
    "auth/user-not-found":        "No account found for that email. Try signing up instead.",
    "auth/invalid-email":         "Please enter a valid email address.",
    "auth/email-already-in-use":  "An account with that email already exists. Try signing in.",
    "auth/weak-password":         "Please choose a stronger password (at least 6 characters).",
    "auth/too-many-requests":     "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user":  "Google sign-in was cancelled.",
    "auth/popup-blocked":         "Your browser blocked the Google pop-up. Please allow pop-ups and retry.",
    "auth/network-request-failed":"Network error. Check your connection and try again.",
    "auth/unauthorized-domain":   "This site isn't authorised in Firebase yet (Authentication → Settings → Authorized domains).",
    "auth/operation-not-allowed": "This sign-in method isn't enabled in your Firebase project yet.",
  };

  function friendlyError(err) {
    const code = (err && err.code) || "";
    return MESSAGES[code] || (err && err.message) || "Something went wrong. Please try again.";
  }

  // Merge a Firebase user (and any extra signup details) into mm_user.
  function saveUser(fbUser, extra = {}) {
    const existing = JSON.parse(localStorage.getItem("mm_user") || "{}");
    const role = extra.role || existing.role || "student";
    const defaults = (window.AVATAR_DEFAULTS && window.AVATAR_DEFAULTS[role]) ||
                     { type: "bear", colour: 0, accessory: 0, bg: 0 };
    const user = {
      uid:    fbUser.uid,
      email:  fbUser.email,
      name:   extra.name || fbUser.displayName || existing.name ||
              (fbUser.email ? fbUser.email.split("@")[0] : "Explorer"),
      role:   role,
      avatar: extra.avatar || existing.avatar || defaults,
      photo:  fbUser.photoURL || existing.photo || null,
    };
    localStorage.setItem("mm_user", JSON.stringify(user));
    return user;
  }

  window.mmAuth = {
    configured: true,
    friendlyError,

    async signUpEmail({ email, password, name, role, avatar }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        try { await updateProfile(cred.user, { displayName: name }); } catch (_) {}
      }
      return saveUser(cred.user, { name, role, avatar });
    },

    async signInEmail({ email, password }) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return saveUser(cred.user);
    },

    async signInGoogle(extra = {}) {
      const cred = await signInWithPopup(auth, googleProvider);
      return saveUser(cred.user, extra);
    },

    async sendReset(email) {
      return sendPasswordResetEmail(auth, email);
    },

    async signOut() {
      try { await signOut(auth); } catch (_) {}
      localStorage.removeItem("mm_user");
    },
  };

  window.dispatchEvent(new Event("mmauth-ready"));
}
