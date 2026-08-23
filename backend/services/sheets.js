// ── Google Sheets Service ──────────────────────────────────────────────────
// All Google Sheets read/write logic lives here.
// The rest of the app calls these functions and doesn't know or care about Sheets.
//
// Authentication method: Service Account
// A Service Account is a special Google account for servers/bots — not humans.
// You create it in Cloud Console, download its JSON key, and share the Sheet
// with its email as an Editor. The backend then uses that key to get access tokens
// automatically, without any user needing to be logged in to Google Sheets.
//
// This is separate from the OAuth login: OAuth tells us WHO is using the web app.
// The Service Account is HOW the server reads/writes the Sheet.

const { google } = require('googleapis');

// ── Column definitions ──────────────────────────────────────────────────────
// These must match the header row in your Google Sheet EXACTLY (case-sensitive).
// Order matters — column A = index 0, column B = index 1, etc.
const COLUMNS = ['id', 'title', 'owner', 'track', 'status', 'priority', 'due', 'notes'];

// The name of the tab (sheet) inside your Spreadsheet.
// Default is "Sheet1" but we expect it to be renamed to "Tasks".
const SHEET_TAB_NAME = 'Tasks';

// ── Auth helper ─────────────────────────────────────────────────────────────
// Creates a GoogleAuth client using our Service Account credentials.
// Called fresh on every operation (the library handles token caching internally).
function getAuthClient() {
  // Parse the full JSON key from the environment variable.
  // In .env it's stored as a single-line JSON string.
  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is missing or invalid JSON. ' +
      'Check your .env file — the value must be the entire service account JSON key on one line.'
    );
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    // This scope gives full read + write access to Google Sheets.
    // If you only needed read access, you'd use: .../auth/spreadsheets.readonly
  });
}

// ── Row ↔ Task conversion helpers ──────────────────────────────────────────

// Convert a flat array of cell values (one row from Sheets) to a task object.
// e.g. ['1234567890', 'Buy resistors', 'kul', 'hardware', 'In Progress', 'High', '', '']
//   → { id: 1234567890, title: 'Buy resistors', owner: 'kul', ... }
function rowToTask(row) {
  const task = {};
  COLUMNS.forEach((col, i) => {
    task[col] = row[i] ?? ''; // ?? '' handles missing cells at end of row
  });
  // Convert id back to a number (Sheets stores everything as strings,
  // but the frontend uses numeric IDs for React keys and comparisons)
  if (task.id) task.id = Number(task.id);
  return task;
}

// Convert a task object to an ordered array of values for writing to Sheets.
// e.g. { id: 1234567890, title: 'Buy resistors', ... }
//   → ['1234567890', 'Buy resistors', 'kul', 'hardware', 'In Progress', 'High', '', '']
function taskToRow(task) {
  return COLUMNS.map((col) => String(task[col] ?? ''));
  // String() ensures IDs (numbers) are stored as text in the Sheet
}

// ── readAllTasks ─────────────────────────────────────────────────────────────
// Fetches every row from the Sheet and returns an array of task objects.
// Row 1 (the header) is automatically skipped.
async function readAllTasks() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB_NAME}!A:H`,
    // A:H = columns A through H (all 8 columns).
    // Using a column range (not row range) means it automatically grows as rows are added.
  });

  const rows = response.data.values || [];
  // rows[0] is the header row: ['id', 'title', 'owner', ...]
  // rows[1..] are the data rows
  return rows.slice(1).filter((row) => row[0]).map(rowToTask);
  // .filter(row => row[0]) skips any completely empty rows
}

// ── appendTask ───────────────────────────────────────────────────────────────
// Adds a new task as a new row at the bottom of the Sheet.
async function appendTask(task) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB_NAME}!A:H`,
    valueInputOption: 'RAW',
    // RAW = store values literally. Don't interpret as formulas.
    // (If we used USER_ENTERED, something like '1/2' might become a date.)
    insertDataOption: 'INSERT_ROWS',
    // INSERT_ROWS = add a brand new row. Don't overwrite any existing data.
    resource: {
      values: [taskToRow(task)],
      // Sheets API expects a 2D array: [[row1values], [row2values], ...]
      // We're only inserting one row, so we wrap our row array in another array.
    },
  });
}

// ── findRowNumberById ────────────────────────────────────────────────────────
// Searches column A (the id column) for a matching task ID and returns
// the 1-based row number in the Sheet.
// Returns null if not found.
//
// Why 1-based? Google Sheets uses 1-based row numbers (row 1 = header row).
// JavaScript arrays are 0-based. We convert at the end.
async function findRowNumberById(id) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB_NAME}!A:A`, // Fetch only column A (the id column) — faster
  });

  const idColumn = response.data.values || [];
  // idColumn looks like: [['id'], ['1234'], ['5678'], ...]
  // Index 0 is the header, indices 1+ are data rows

  const arrayIndex = idColumn.findIndex(
    (cell, i) => i > 0 && cell[0] === String(id)
    // i > 0 skips the header row
    // String(id) because Sheets returns everything as strings
  );

  if (arrayIndex === -1) return null; // Task not found
  return arrayIndex + 1; // Convert 0-based array index → 1-based Sheet row number
  // e.g. arrayIndex 1 → row 2 (because row 1 is the header)
}

// ── updateTask ───────────────────────────────────────────────────────────────
// Updates an existing row in place. Only the fields in 'patch' are changed;
// all other fields are preserved from the current Sheet data.
async function updateTask(id, patch) {
  // First, load the current state of this task from the Sheet
  const allTasks = await readAllTasks();
  const existing = allTasks.find((t) => String(t.id) === String(id));
  if (!existing) throw new Error(`Task with id ${id} not found in Sheet`);

  // Merge the patch into the existing task
  const updated = { ...existing, ...patch };

  // Find which row number to update
  const rowNumber = await findRowNumberById(id);
  if (!rowNumber) throw new Error(`Row for task id ${id} not found`);

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB_NAME}!A${rowNumber}:H${rowNumber}`,
    // A${rowNumber}:H${rowNumber} = the exact row to overwrite, e.g. "Tasks!A3:H3"
    valueInputOption: 'RAW',
    resource: {
      values: [taskToRow(updated)],
    },
  });
}

// ── deleteTask ────────────────────────────────────────────────────────────────
// Deletes an entire row from the Sheet.
// Sheets API requires a "batchUpdate" with a deleteDimension request to remove a row.
// This is the most complex Sheets operation — it needs the internal tab ID (not the name).
async function deleteTask(id) {
  const rowNumber = await findRowNumberById(id);
  if (!rowNumber) throw new Error(`Task with id ${id} not found`);

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // We need the internal numeric sheet tab ID (different from the spreadsheet ID).
  // Get it from the spreadsheet metadata.
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
  });
  const tab = meta.data.sheets.find((s) => s.properties.title === SHEET_TAB_NAME);
  if (!tab) throw new Error(`Sheet tab "${SHEET_TAB_NAME}" not found`);
  const sheetTabId = tab.properties.sheetId; // e.g. 0 (for the first tab)

  // Delete the row using batchUpdate → deleteDimension
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetTabId,
              dimension: 'ROWS',       // We're deleting a row, not a column
              startIndex: rowNumber - 1, // batchUpdate uses 0-based indexing
              endIndex: rowNumber,       // exclusive end: deletes exactly one row
              // e.g. rowNumber=3 → startIndex=2, endIndex=3 → deletes row 3 (the 3rd row)
            },
          },
        },
      ],
    },
  });
}

module.exports = { readAllTasks, appendTask, updateTask, deleteTask };
