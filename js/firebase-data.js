/* ─────────────────────────────────────────────────────────────
   MathMunch — Firestore data layer
   ─────────────────────────────────────────────────────────────
   Shared, framework-free API on window.mmData used by:
     • signup.html / login.html  → save a user profile on auth
     • js/mathmunch.js            → sync each player's progress to the cloud
     • teacher.html               → class rosters + real per-student progress
     • admin.html                 → list & manage every registered account

   DATA MODEL
     users/{uid}     { uid, email, emailLower, name, role, avatar, photo,
                       classId, className, createdAt, lastActive,
                       progress, progressUpdatedAt }
     classes/{id}    { name, year, teacherUid, teacherName, code,
                       createdAt, studentUids[], pendingEmails[] }

   ADMIN ACCESS is by email allow-list (see ADMIN_EMAILS). Keep this list
   in sync with the matching list in firestore.rules.
───────────────────────────────────────────────────────────── */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut as fbSignOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, addDoc,
  serverTimestamp, arrayUnion, arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

/* ── Admin allow-list ─────────────────────────────────────────
   Anyone signed in with one of these emails gets admin access.   */
export const ADMIN_EMAILS = ["tech@eduversal.org"];
window.MM_ADMIN_EMAILS = ADMIN_EMAILS;

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase());
}

const isConfigured =
  firebaseConfig &&
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.length > 0 &&
  !firebaseConfig.apiKey.includes("PASTE");

if (!isConfigured) {
  window.mmData = {
    available: false,
    reason: "Firebase isn't set up yet. Add your keys in js/firebase-config.js",
    ready: Promise.resolve(false),
    onUser() {},
    isAdmin: isAdminEmail,
  };
  window.dispatchEvent(new Event("mmdata-ready"));
} else {
  // Reuse the app the auth bridge may have created (avoids double-init).
  const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db   = getFirestore(app);

  // Resolve once the first auth state is known (signed in or not).
  let _resolveAuth;
  const authReady = new Promise((res) => { _resolveAuth = res; });
  let _userCbs = [];
  onAuthStateChanged(auth, (user) => {
    _resolveAuth(user);
    _userCbs.forEach((cb) => { try { cb(user); } catch (_) {} });
  });

  function localUser() {
    try { return JSON.parse(localStorage.getItem("mm_user") || "{}"); }
    catch (_) { return {}; }
  }

  // The Firebase auth user, falling back to the cached mm_user uid.
  async function currentUid() {
    const u = await authReady;
    if (u && u.uid) return u.uid;
    const lu = localUser();
    return lu && lu.uid && !lu.isGuest ? lu.uid : null;
  }

  function friendlyDataError(err) {
    const code = (err && err.code) || "";
    if (code === "permission-denied")
      return "Permission denied. Publish the Firestore rules (see firestore.rules).";
    if (code === "unavailable" || code === "failed-precondition")
      return "Cloud Firestore isn't enabled yet. Turn it on in the Firebase console (see FIRESTORE_SETUP.md).";
    return (err && err.message) || "Something went wrong talking to the database.";
  }

  // Find the first class that has invited this email (pending roster entry).
  async function findPendingClassFor(emailLower) {
    if (!emailLower) return null;
    const q = query(collection(db, "classes"), where("pendingEmails", "array-contains", emailLower));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  window.mmData = {
    available: true,
    auth,
    db,
    isAdmin: isAdminEmail,
    ready: authReady.then(() => true).catch(() => true),

    /** Register a callback fired with the Firebase user (or null) on every auth change. */
    onUser(cb) {
      _userCbs.push(cb);
      authReady.then((u) => { try { cb(u); } catch (_) {} });
    },

    currentUser: () => auth.currentUser,
    currentUid,

    /** End the Firebase session and clear the cached user. */
    async signOut() {
      try { await fbSignOut(auth); } catch (_) {}
      localStorage.removeItem("mm_user");
    },

    /* ── PROFILES ─────────────────────────────────────────── */

    /** Upsert users/{uid} from the cached mm_user plus any extra fields.
        Also links the account to any class that invited its email. */
    async saveProfile(extra = {}) {
      const uid = await currentUid();
      if (!uid) return null;
      const lu = localUser();
      const fbUser = auth.currentUser;
      const email = (fbUser && fbUser.email) || lu.email || "";
      const emailLower = email.toLowerCase();

      const ref  = doc(db, "users", uid);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data() : {};

      const data = {
        uid,
        email,
        emailLower,
        name:   extra.name   || lu.name   || existing.name   || (email ? email.split("@")[0] : "Explorer"),
        role:   extra.role   || lu.role   || existing.role   || "student",
        avatar: extra.avatar || lu.avatar || existing.avatar || null,
        photo:  (fbUser && fbUser.photoURL) || lu.photo || existing.photo || null,
        lastActive: serverTimestamp(),
      };
      if (!snap.exists()) data.createdAt = serverTimestamp();

      // Link to a class that pre-invited this email (students only).
      if (!existing.classId && data.role === "student") {
        try {
          const cls = await findPendingClassFor(emailLower);
          if (cls) {
            data.classId   = cls.id;
            data.className = cls.name;
            await updateDoc(doc(db, "classes", cls.id), {
              studentUids:  arrayUnion(uid),
              pendingEmails: arrayRemove(emailLower),
            });
          }
        } catch (_) { /* linking is best-effort */ }
      }

      await setDoc(ref, data, { merge: true });
      return data;
    },

    /** Persist the player's progress object (mm_progress) to their profile. */
    async syncProgress(progress) {
      const uid = await currentUid();
      if (!uid) return false;
      const ref = doc(db, "users", uid);
      try {
        await setDoc(ref, {
          progress,
          progressUpdatedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        }, { merge: true });
        return true;
      } catch (err) {
        console.warn("[MathMunch] progress sync failed:", friendlyDataError(err));
        return false;
      }
    },

    async getProfile(uid) {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? snap.data() : null;
    },

    /* ── ADMIN ────────────────────────────────────────────── */

    /** Every registered account (admin only — enforced by rules). */
    async listUsers() {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => d.data());
    },

    async setUserRole(uid, role) {
      await updateDoc(doc(db, "users", uid), { role });
    },

    async deleteProfile(uid) {
      await deleteDoc(doc(db, "users", uid));
    },

    /* ── CLASSES / ROSTERS ────────────────────────────────── */

    async getMyClasses(teacherUid) {
      const q = query(collection(db, "classes"), where("teacherUid", "==", teacherUid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
                      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    },

    async createClass({ name, year }) {
      const uid = await currentUid();
      if (!uid) throw new Error("Not signed in.");
      const lu = localUser();
      const code = (name || "CLASS").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() +
                   "-" + String(Math.abs(hashStr(name + uid)) % 9000 + 1000);
      const ref = await addDoc(collection(db, "classes"), {
        name: name || "New Class",
        year: year || "",
        teacherUid: uid,
        teacherName: lu.name || (lu.email ? lu.email.split("@")[0] : "Teacher"),
        code,
        createdAt: serverTimestamp(),
        studentUids: [],
        pendingEmails: [],
      });
      return { id: ref.id };
    },

    async deleteClass(classId) {
      // Detach any linked students, then remove the class.
      const cls = await getDoc(doc(db, "classes", classId));
      if (cls.exists()) {
        const uids = cls.data().studentUids || [];
        await Promise.all(uids.map((uid) =>
          updateDoc(doc(db, "users", uid), { classId: null, className: null }).catch(() => {})
        ));
      }
      await deleteDoc(doc(db, "classes", classId));
    },

    /** Add a student to a class by email. Links immediately if the account
        exists, otherwise records a pending invite that links on signup. */
    async addStudentByEmail(classId, email) {
      const emailLower = String(email || "").trim().toLowerCase();
      if (!emailLower) throw new Error("Enter an email.");
      const clsRef = doc(db, "classes", classId);
      const cls = (await getDoc(clsRef)).data() || {};
      const clsName = cls.name || "";

      const q = query(collection(db, "users"), where("emailLower", "==", emailLower));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const student = snap.docs[0].data();
        await updateDoc(doc(db, "users", student.uid), { classId, className: clsName });
        await updateDoc(clsRef, {
          studentUids: arrayUnion(student.uid),
          pendingEmails: arrayRemove(emailLower),
        });
        return { status: "linked", name: student.name, email: emailLower };
      }
      await updateDoc(clsRef, { pendingEmails: arrayUnion(emailLower) });
      return { status: "pending", email: emailLower };
    },

    async removeStudent(classId, uid) {
      await updateDoc(doc(db, "classes", classId), { studentUids: arrayRemove(uid) });
      await updateDoc(doc(db, "users", uid), { classId: null, className: null }).catch(() => {});
    },

    async removePending(classId, emailLower) {
      await updateDoc(doc(db, "classes", classId), { pendingEmails: arrayRemove(emailLower) });
    },

    /** Full roster for a class: registered students (with profiles/progress)
        plus any pending (not-yet-registered) invites. */
    async getRoster(classId) {
      const cls = (await getDoc(doc(db, "classes", classId))).data() || {};
      const uids = cls.studentUids || [];
      const students = (await Promise.all(uids.map((uid) =>
        getDoc(doc(db, "users", uid)).then((s) => (s.exists() ? s.data() : null)).catch(() => null)
      ))).filter(Boolean);
      return { students, pending: cls.pendingEmails || [] };
    },
  };

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < (s || "").length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return h;
  }

  window.dispatchEvent(new Event("mmdata-ready"));
}
