/* ─────────────────────────────────────────────────────────────
   MathMunch — Firebase configuration
   ─────────────────────────────────────────────────────────────
   PASTE YOUR OWN VALUES BELOW.

   Where to find them:
   1. Go to https://console.firebase.google.com  →  create a project
      (or open an existing one).
   2. Click the </>  "Web" icon to register a web app.
   3. Firebase shows a `firebaseConfig = { ... }` object — copy each
      value into the matching field below.

   NOTE: These values are NOT secret. A Firebase web API key only
   identifies your project; it is meant to ship in client code.
   Real security comes from (a) the list of "Authorized domains" in
   Authentication → Settings, and (b) Firestore/Storage rules.
───────────────────────────────────────────────────────────── */

export const firebaseConfig = {
  apiKey:            "PASTE_API_KEY",
  authDomain:        "PASTE_PROJECT_ID.firebaseapp.com",
  projectId:         "PASTE_PROJECT_ID",
  storageBucket:     "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId:             "PASTE_APP_ID",
};
