// Load environment variables from .env BEFORE anything else.
// dotenv reads the .env file and adds every KEY=VALUE pair to process.env,
// so that process.env.GOOGLE_CLIENT_ID works throughout the app.
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Load our passport Google OAuth configuration (must run before any routes)
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
// CORS = Cross-Origin Resource Sharing.
// Browsers block requests between different "origins" (domain + port combos)
// by default. Our frontend runs on port 5173, backend on 3001 — different origins.
// This tells the browser: "it's safe to send requests from the frontend to the backend."
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  // credentials: true is REQUIRED to allow cookies (which carry session info)
  // to be sent in cross-origin requests. Without this, the session won't work.
}));

// Parse JSON bodies in incoming requests.
// Without this, req.body would be undefined when the frontend sends JSON.
app.use(express.json());

// ── Sessions ──────────────────────────────────────────────────────────────────
// HTTP is stateless — each request is independent with no memory of past requests.
// Sessions solve this: the server stores data (like "who is logged in") tied to a
// unique session ID. The browser stores just that ID in a cookie.
// On every request, Express reads the cookie, finds the session, and populates req.session.
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me-in-production',
  // The secret signs the session cookie cryptographically so it can't be faked.
  // Must be a long random string in production — see .env.example for how to generate one.

  resave: false,
  // false = don't re-save the session to the store on every request (better performance)

  saveUninitialized: false,
  // false = don't create a session until something is actually stored in it
  // (avoids creating empty sessions for every visitor)

  cookie: {
    secure: process.env.NODE_ENV === 'production',
    // secure: true means the cookie is only sent over HTTPS.
    // We allow non-HTTPS in development (localhost doesn't have HTTPS by default).

    httpOnly: true,
    // httpOnly: true means JavaScript in the browser CANNOT read this cookie.
    // This protects against XSS attacks (malicious scripts stealing the session).

    maxAge: 7 * 24 * 60 * 60 * 1000,
    // How long the session lasts: 7 days, expressed in milliseconds.
    // After this, the user will need to log in again.
  },
}));

// ── Passport ─────────────────────────────────────────────────────────────────
// Passport is an authentication middleware. It handles the complex OAuth 2.0
// flow with Google (token exchange, profile fetching) so we don't have to.
// It adds req.user and req.isAuthenticated() to every request.
app.use(passport.initialize()); // Must come before passport.session()
app.use(passport.session());    // Integrates passport with our express-session above

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);   // /auth/google, /auth/callback, /auth/me, /auth/logout
app.use('/tasks', taskRoutes);  // GET/POST/PUT/DELETE /tasks

// Health check — open your browser to http://localhost:3001/health to confirm the server is up
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NIVRA backend is running ✅' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ NIVRA backend running on http://localhost:${PORT}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`   Allowed emails: ${process.env.ALLOWED_EMAILS}\n`);
});
