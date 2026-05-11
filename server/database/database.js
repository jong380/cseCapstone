const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use an absolute path for the database file to avoid issues
const dbPath = path.resolve(__dirname, '../../nodi.db');

const db = new Database(dbPath);

// Initialize the schema if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    sender TEXT NOT NULL,
    status TEXT NOT NULL
  );
`);

module.exports = db;
