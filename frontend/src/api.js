// ── api.js ────────────────────────────────────────────────────────────────────
// This file is the ONLY place in the frontend that knows the backend URL.
// Every other file imports functions from here instead of writing fetch() directly.
// This keeps things clean: if the backend URL changes, you update one line.
//
// VITE_API_URL is an environment variable set in the Vite build.
// In development (local): leave it unset, defaults to http://localhost:3001
// In production (Vercel): set VITE_API_URL to your Render backend URL
// Note: Vite requires env vars to start with VITE_ to be available in frontend code.

// In development: Vite proxies /auth and /tasks to localhost:3001, so we use '' (empty = same origin).
// In production (Vercel): set VITE_API_URL to your Render backend URL in Vercel's env var settings.
const API_URL = import.meta.env.VITE_API_URL || '';

// ── Core fetch wrapper ────────────────────────────────────────────────────────
// All API calls go through this helper.
// It automatically:
//   - Prepends the backend URL
//   - Sends the session cookie (credentials: 'include')
//   - Sets Content-Type to JSON
//   - Throws a readable error if the response isn't OK
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    // credentials: 'include' is CRITICAL.
    // By default, browsers don't send cookies to a different origin (our backend URL).
    // This flag overrides that so the session cookie gets sent with every request.
    // Without it, the backend would think you're not logged in on every API call.

    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    // Try to parse an error message from the backend's JSON response
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(errData.error || 'Request failed');
    err.status = res.status; // Attach the HTTP status code so callers can check it
    throw err;
  }

  return res.json();
}

// ── Auth functions ────────────────────────────────────────────────────────────

// Check who's currently logged in.
// Returns { name, email } if logged in, throws a 401 error if not.
// App.jsx calls this on every page load to decide what to show.
export function getMe() {
  return request('/auth/me');
}

// These two use the FULL backend URL (not the proxy) because they redirect the browser.
// A browser redirect to a relative path would stay on the Vite server, not go to the backend.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Redirect the browser to the Google login page.
export function loginWithGoogle() {
  window.location.href = `${BACKEND_URL}/auth/google`;
}

// Log out by navigating to the backend logout route.
export function logout() {
  window.location.href = `${BACKEND_URL}/auth/logout`;
}

// ── Task functions ────────────────────────────────────────────────────────────

// Load all tasks from the Google Sheet
export function fetchTasks() {
  return request('/tasks');
}

// Add a new task (backend appends a new row to the Sheet)
export function createTask(task) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

// Save changes to an existing task (backend updates the row in place)
// 'id' = the task's numeric ID
// 'patch' = an object with the fields that changed, e.g. { status: 'Done', notes: '...' }
export function saveTask(id, patch) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

// Delete a task (backend removes the row from the Sheet)
export function removeTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}
