# NIVRA Task Tracker

Internal task board for the NIVRA graphene wearable heating product team.

**Stack:** React (Vite) · Node.js / Express · Google OAuth 2.0 · Google Sheets API

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/) installed
- A Google account with access to Google Cloud Console
- A Google Sheet you'll use as the database

---

## Step 1 — Google Cloud Console Setup

### 1a. Create a project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown → **New Project** → name it `nivra-task-tracker`

### 1b. Enable the Google Sheets API
1. In your project: **APIs & Services → Enable APIs & Services**
2. Search for **"Google Sheets API"** → click it → **Enable**

### 1c. Create OAuth 2.0 credentials (for user login)
1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. If prompted, configure the OAuth consent screen first:
   - User type: **External** → fill in app name "NIVRA Task Tracker" and your email
   - Add scopes: `email`, `profile`
   - Add test users: add all 3 team email addresses
3. Application type: **Web application**
4. Name: `NIVRA Web Client`
5. **Authorized redirect URIs** — add both:
   - `http://localhost:3001/auth/callback`  ← for local development
   - `https://YOUR-APP.onrender.com/auth/callback`  ← add this after deploying
6. Click **Create** → copy the **Client ID** and **Client Secret** into `backend/.env`

### 1d. Create a Service Account (for Sheets read/write)
1. Go to **IAM & Admin → Service Accounts → Create Service Account**
2. Name it `nivra-sheets-bot` → click **Create and Continue** → **Done**
3. Click the newly created service account → **Keys** tab
4. **Add Key → Create new key → JSON** → download the file
5. Open the JSON file — copy its **entire contents** as one line into `GOOGLE_SERVICE_ACCOUNT_JSON` in `backend/.env`
   - **Windows PowerShell tip:** `(Get-Content key.json -Raw) -replace "\r?\n","" | Set-Clipboard`
   - **Mac/Linux tip:** `cat key.json | tr -d '\n' | pbcopy`
6. Note the `client_email` inside the JSON (e.g. `nivra-sheets-bot@nivra-task-tracker.iam.gserviceaccount.com`)

---

## Step 2 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**
2. Rename the tab at the bottom from "Sheet1" to **`Tasks`** (case-sensitive)
3. In row 1, add these headers exactly (one per column, A through H):

   ```
   id | title | owner | track | status | priority | due | notes
   ```

4. Share the sheet:
   - Click **Share** → paste the service account `client_email` from step 1d → set to **Editor** → Send
   - Optionally also share with the 3 team emails as Viewers/Editors so you can see it directly

5. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```
   Paste it into `GOOGLE_SHEET_ID` in `backend/.env`

---

## Step 3 — Backend Setup

```bash
cd backend

# Copy the example env file and fill in your values
cp .env.example .env
# (Edit .env with your actual credentials — see comments inside for guidance)

# Install dependencies
npm install

# Start the development server
npm run dev
```

**Test it:** Open `http://localhost:3001/health` in your browser.
You should see: `{"status":"ok","message":"NIVRA backend is running ✅"}`

### Phase 1 Test — Auth
1. Visit `http://localhost:3001/auth/google` in your browser
2. Google login page should appear
3. Log in with an **approved** email → you should be redirected back and see the task board
4. Log in with a **non-approved** email → you should be redirected to the frontend with an "Access denied" message

### Phase 2 Test — Sheets
While the backend is running, open a new terminal:

```bash
# Quick test: read all tasks (should return [] for an empty Sheet, or your existing rows)
curl -b cookies.txt -c cookies.txt http://localhost:3001/tasks

# You need to be logged in first. After Step 1 test, your session cookie is set.
# Or use Thunder Client / Postman / REST Client in VS Code.
```

---

## Step 4 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` → you should see the NIVRA login page.

**Full flow test:**
1. Click "Sign in with Google" → logs in → Kanban board loads with tasks from your Sheet
2. Click a task card → modal opens with flip animation → edit fields → click "Save changes" → check the Sheet in Google Sheets to confirm the row updated
3. Click "Add task" → fill in form → submit → new row appears in the Sheet
4. Open task → click "Delete task" → row disappears from Sheet

---

## Deployment

### Backend → Render

1. Push your code to a GitHub repository
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo → select the `backend/` directory as root
4. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. Add **all environment variables** from `backend/.env` in Render's "Environment" tab
6. Update `GOOGLE_CALLBACK_URL` to `https://YOUR-APP.onrender.com/auth/callback`
7. Update `FRONTEND_URL` to your Vercel URL (e.g. `https://nivra.vercel.app`)
8. Deploy → copy your Render URL (e.g. `https://nivra-backend.onrender.com`)
9. **Go back to Google Cloud Console** → OAuth credentials → add the new callback URL to Authorized redirect URIs

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo → set **Root Directory** to `frontend/`
3. Add environment variable:
   - `VITE_API_URL` = `https://YOUR-BACKEND.onrender.com`
4. Deploy → share the Vercel URL with your team

> **Note:** Render's free tier sleeps after 15 min of inactivity. The first request after sleep
> takes ~30 seconds and will log everyone out (in-memory sessions). This is fine for a team
> that uses the app during work hours. Upgrade to Render's $7/month plan if it becomes annoying.

---

## File Structure

```
nivrataskbar/
├── frontend/                  React + Vite app
│   ├── src/
│   │   ├── App.jsx            Main UI (Kanban + List view, all modals)
│   │   ├── LoginPage.jsx      Google sign-in screen
│   │   └── api.js             All fetch() calls to the backend
│   └── vite.config.js         Dev proxy config
│
├── backend/                   Node.js + Express server
│   ├── server.js              Entry point
│   ├── config/passport.js     Google OAuth strategy + email allowlist
│   ├── middleware/requireAuth.js  Auth guard for task routes
│   ├── routes/auth.js         /auth/google  /auth/callback  /auth/me  /auth/logout
│   ├── routes/tasks.js        GET/POST/PUT/DELETE /tasks
│   ├── services/sheets.js     All Google Sheets API logic
│   ├── .env.example           Template — commit this
│   └── .env                   Your secrets — NEVER commit this
│
└── README.md
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON` | Make sure the key JSON is on one line with no extra whitespace. Try parsing it: `node -e "JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)"` |
| `The caller does not have permission` from Sheets | You haven't shared the Sheet with the service account email. Share it as Editor. |
| `redirect_uri_mismatch` from Google | The callback URL in Cloud Console doesn't exactly match `GOOGLE_CALLBACK_URL` in `.env`. |
| Tasks load but show empty after adding | Check that your Sheet tab is named exactly `Tasks` (capital T, no spaces). |
| Session lost on every request | Make sure `credentials: 'include'` is in every fetch call (handled by `api.js`), and `CORS credentials: true` is set in the backend. |
