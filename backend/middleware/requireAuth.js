// ── requireAuth middleware ────────────────────────────────────────────────────
// Middleware = a function that runs BETWEEN receiving a request and running the
// actual route handler. Think of it as a bouncer at the door.
//
// This function checks: is there an active session for this user?
// If yes → let them through (call next()).
// If no  → stop here and return a 401 Unauthorized error.
//
// We apply this to all task routes so that unauthenticated users can never
// read or write task data — even if they know the API URLs.

function requireAuth(req, res, next) {
  // req.isAuthenticated() is provided by Passport.
  // It returns true if passport.deserializeUser successfully loaded a user
  // from the session cookie, false otherwise.
  if (req.isAuthenticated()) {
    return next(); // ✅ Logged in — proceed to the route handler
  }

  // ❌ Not logged in — reject the request
  // 401 = "Unauthorized" (technically "unauthenticated", but 401 is the standard code)
  res.status(401).json({
    error: 'You must be logged in to access tasks.',
    loginUrl: '/auth/google', // Hint for the frontend to redirect to login
  });
}

module.exports = requireAuth;
