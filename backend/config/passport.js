const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Parse the allowed emails from environment variable.
// process.env.ALLOWED_EMAILS looks like: "a@gmail.com,b@gmail.com,c@gmail.com"
// We split by comma and lowercase everything so comparisons are case-insensitive.
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean); // remove any empty strings from accidental extra commas

// ── Google OAuth Strategy ────────────────────────────────────────────────────
// This tells Passport HOW to authenticate a user with Google.
// It runs once when the user completes Google login and we receive their profile.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      // callbackURL must EXACTLY match what you entered in Google Cloud Console.
      // Google will refuse to redirect anywhere else (security measure).
    },

    // This "verify callback" is called after Google hands us the user's profile.
    // accessToken: lets us make Google API calls on behalf of the user (we don't use it)
    // refreshToken: lets us get a new accessToken when it expires (we don't need it)
    // profile: the user's Google profile info (name, email, photo, etc.)
    // done: a callback we call to tell Passport what happened
    async (accessToken, refreshToken, profile, done) => {
      // Extract the user's primary email (Google returns an array of emails)
      const email = profile.emails?.[0]?.value?.toLowerCase();

      // ── THE KEY SECURITY CHECK ────────────────────────────────────────────
      // Is this person on our approved list?
      if (!email || !ALLOWED_EMAILS.includes(email)) {
        // done(null, false, message) = "authentication failed, not an error"
        // Passport will redirect to the failureRedirect URL in auth.js
        return done(null, false, {
          message: `Access denied: ${email || 'unknown email'} is not authorized. Contact the team admin.`,
        });
      }

      // ── Build our internal user object ────────────────────────────────────
      // We only keep what we need. We don't store the full Google profile or any tokens.
      const user = {
        googleId: profile.id,
        name: profile.displayName,
        email: email,
        // photo: profile.photos?.[0]?.value, // Uncomment if you want to show avatars later
      };

      // done(null, user) = "authentication succeeded, here's the user"
      // Passport will then call serializeUser below to store them in the session.
      return done(null, user);
    }
  )
);

// ── Serialization / Deserialization ─────────────────────────────────────────
// These two functions define how Passport stores and retrieves the logged-in
// user across requests using the session.

// serializeUser: called once after login.
// Decides what to store IN the session (kept small to save memory).
// For 3 users with no database, we just store the whole user object directly.
passport.serializeUser((user, done) => {
  done(null, user);
  // In a larger app, you'd store just the user's database ID here:
  //   done(null, user.id);
  // Then look them up in the database in deserializeUser.
});

// deserializeUser: called on EVERY subsequent request that has a session cookie.
// Retrieves the user from whatever serializeUser stored.
// Passport attaches the result to req.user on every authenticated request.
passport.deserializeUser((user, done) => {
  done(null, user);
  // In a larger app with a database, this would be:
  //   const fullUser = await db.users.findById(user);
  //   done(null, fullUser);
});
