import { loginWithGoogle } from './api';

// ── LoginPage ─────────────────────────────────────────────────────────────────
// Shown when the user is not logged in (or when their session has expired).
// Matches the warm paper/graphite theme of the main app exactly.
//
// Props:
//   errorMsg — optional string shown when login was attempted and rejected
//              (e.g. "email not in allowed list"). Passed via ?error= in the URL.

export default function LoginPage({ errorMsg }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF7F1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#1E1B16',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .google-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1.5px solid #E3DFD3;
          border-radius: 10px;
          padding: 13px 22px;
          font-size: 15px;
          font-weight: 500;
          color: #1E1B16;
          cursor: pointer;
          transition: all .15s;
          font-family: inherit;
          width: 100%;
          justify-content: center;
          box-shadow: 0 1px 4px rgba(30,27,22,0.06);
        }
        .google-btn:hover {
          border-color: #C8551F;
          box-shadow: 0 3px 12px rgba(200,85,31,0.12);
          transform: translateY(-1px);
        }
        .google-btn:active { transform: translateY(0); }
      `}</style>

      <div
        style={{
          background: '#fff',
          border: '1px solid #EAE6D9',
          borderRadius: 18,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 380,
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(30,27,22,0.07)',
        }}
      >
        {/* Logo / wordmark */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: '#1E1B16',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 26,
            }}
          >
            🔥
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 22,
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
            }}
          >
            NIVRA
          </h1>
          <p style={{ color: '#8A867A', fontSize: 13.5, margin: 0 }}>
            Internal task tracker
          </p>
        </div>

        {/* Error message — shown after a failed/rejected login attempt */}
        {errorMsg && (
          <div
            style={{
              background: '#FDF0EC',
              border: '1px solid #F5DCD4',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#8C2E1E',
              textAlign: 'left',
              lineHeight: 1.5,
            }}
          >
            <strong>Access denied.</strong> That Google account isn't on the approved list.
            Contact Meenal to be added.
          </div>
        )}

        {/* Sign in button */}
        <button className="google-btn" onClick={loginWithGoogle} id="google-signin-btn">
          {/* Google "G" logo as inline SVG — no image dependency */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          Sign in with Google
        </button>

        <p
          style={{
            color: '#B0AC9E',
            fontSize: 12,
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Access is restricted to the NIVRA team only.
        </p>
      </div>
    </div>
  );
}
