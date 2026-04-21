const express = require('express');
const router = express.Router();
const db = require('../database/database');

router.post('/', (req, res) => {
  const { time, content, source, sender } = req.body;

  if (!time || !content || !source || !sender) {
    return res.status(400).json({ error: 'Missing required fields: time, content, source, sender' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO messages (time, content, source, sender)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(time, content, source, sender);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Failed to insert message' });
  }
});

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM messages ORDER BY time DESC').all();
    res.json(rows);
  } catch (err) {
    console.error('DB fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;