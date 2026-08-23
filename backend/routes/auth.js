const express = require('express');
const passport = require('passport');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Route: Start Google Login ──────────────────────────────────────────────
// When the user clicks "Sign in with Google" in the frontend, they're redirected here.
// Passport builds the Google OAuth URL (with our client ID and requested scopes)
// and redirects the browser to Google's login page automatically.
//
// 'scope' tells Google what data we want permission to read:
//   'profile' = name, Google ID, profile photo
//   'email'   = their email address (we need this for the allowlist check)
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// ── Route: Google OAuth Callback ──────────────────────────────────────────
// After the user logs in on Google's site, Google redirects back here.
// Google includes a short-lived "authorization code" in the URL.
// Passport automatically exchanges this code for an access token,
// then fetches the user's profile and calls our verify function in config/passport.js.
//
// If authentication fails (email not allowed, user denied permission, etc.):
//   → redirect to FRONTEND_URL?error=unauthorized (frontend shows an error message)
//
// If authentication succeeds:
//   → Passport creates a session, stores the user, sets the cookie
//   → redirect to the frontend main page (the Kanban board)
router.get(
  '/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}?error=unauthorized`,
  }),
  (req, res) => {
    // We only reach here if authentication fully succeeded.
    // The session is already created; the user is logged in.
    res.redirect(FRONTEND_URL);
  }
);

// ── Route: Get Current User ────────────────────────────────────────────────
// The frontend calls GET /auth/me on every page load to check:
//   "Is there an active session? Who is logged in?"
// If yes → return the user's name and email (frontend shows the board)
// If no  → return 401 (frontend shows the login page)
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    // Send back only what the frontend needs — no sensitive info
    res.json({
      name: req.user.name,
      email: req.user.email,
    });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

// ── Route: Log Out ─────────────────────────────────────────────────────────
// req.logout() is provided by Passport. It clears the user from the session.
// We then destroy the session entirely (clearing the cookie data on the server side)
// and redirect back to the frontend, which will detect the missing session
// and show the login page.
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      // Clear the session cookie on the client side too
      res.clearCookie('connect.sid');
      res.redirect(FRONTEND_URL);
    });
  });
});

module.exports = router;
