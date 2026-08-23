const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const sheets = require('../services/sheets');

// Apply the requireAuth middleware to ALL routes in this file.
// Any request to /tasks/* will first pass through requireAuth.
// If the user isn't logged in, requireAuth returns 401 and the handler never runs.
router.use(requireAuth);

// ── GET /tasks ──────────────────────────────────────────────────────────────
// Read all tasks from the Google Sheet.
// The frontend calls this once on initial page load.
router.get('/', async (req, res) => {
  try {
    const tasks = await sheets.readAllTasks();
    res.json(tasks);
  } catch (err) {
    console.error('[GET /tasks] Error:', err.message);
    res.status(500).json({ error: 'Failed to load tasks. Check server logs.' });
  }
});

// ── POST /tasks ─────────────────────────────────────────────────────────────
// Create a new task. The frontend sends the task data in the request body.
// We assign a numeric ID (timestamp) so IDs are always unique.
router.post('/', async (req, res) => {
  try {
    // Date.now() returns milliseconds since Jan 1 1970 — always unique and sortable
    const task = { ...req.body, id: Date.now() };
    await sheets.appendTask(task);
    res.status(201).json(task); // 201 = Created (more specific than 200 OK)
  } catch (err) {
    console.error('[POST /tasks] Error:', err.message);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// ── PUT /tasks/:id ──────────────────────────────────────────────────────────
// Update an existing task. :id is the task's numeric ID (from the Sheet's column A).
// req.params.id is a string (URL parameters are always strings).
// The frontend sends only the changed fields in req.body (a "patch").
// The Sheets service merges this patch with the existing row before writing.
router.put('/:id', async (req, res) => {
  try {
    await sheets.updateTask(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(`[PUT /tasks/${req.params.id}] Error:`, err.message);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// ── DELETE /tasks/:id ───────────────────────────────────────────────────────
// Delete a task by its ID. Removes the entire row from the Sheet.
router.delete('/:id', async (req, res) => {
  try {
    await sheets.deleteTask(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /tasks/${req.params.id}] Error:`, err.message);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
