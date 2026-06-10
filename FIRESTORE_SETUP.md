# MathMunch — Cloud Firestore setup

The admin page, the Class Dashboard rosters, and cross-device progress all
read and write **Cloud Firestore**. Auth alone (what the site used before)
can't list accounts or share progress between devices, so Firestore must be
turned on once.

## 1. Enable Firestore
1. Open the [Firebase console](https://console.firebase.google.com) → project
   **mathmunch-8a25f**.
2. Build → **Firestore Database** → **Create database**.
3. Start in **production mode** (the rules below lock it down), pick a region,
   and create.

## 2. Publish the security rules
1. Firestore Database → **Rules** tab.
2. Paste the contents of [`firestore.rules`](firestore.rules) and **Publish**.

These rules let a user read/write only their own profile, let teachers enrol
students into their classes, and give admins (by email) full access.

## 3. Admin access
Admin is granted by **email allow-list**, defined in **two places that must
match**:
- `ADMIN_EMAILS` in [`js/firebase-data.js`](js/firebase-data.js) — controls the UI.
- the email list inside the `isAdmin()` function in
  [`firestore.rules`](firestore.rules) — enforces it on the server.

`tech@eduversal.org` is pre-listed. Add more emails (lower-case) to **both**
places, then re-publish the rules.

Sign in with an admin email and open **`admin.html`**.

## 4. How data flows
- **Signup / login** writes a profile to `users/{uid}`.
- **Playing a game / reading a book** syncs `mm_progress` to that profile.
- **Teachers** create classes and add students by email on `teacher.html`.
  If the student already has an account they're linked instantly; otherwise the
  email is held as a pending invite and linked automatically when they sign up.
- **Admins** see every account on `admin.html` and can change roles or remove
  profiles.

Existing accounts created before this feature get their profile written the
next time they sign in or finish a game — no migration needed.
