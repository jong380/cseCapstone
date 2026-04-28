import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(false);
// Opens database in default location
const db = SQLite.openDatabase({ name: 'nodi.db', location: 'default' });

// Create table if it doesn't exist
export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TIMESTAMP NOT NULL,
        content TEXT NOT NULL,
        source VARCHAR(255) NOT NULL,
        sender VARCHAR(255) NOT NULL
      );
    `);
  });
};

// Insert new notification into database
export const insertSuppressedNotification = (
  content: string,
  source: string,
  sender: string
) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO messages (time, content, source, sender) VALUES (?, ?, ?, ?)`,
      [new Date().toISOString(), content, source, sender]
    );
  });
};

// Get all notifications from database
export const getSuppressedNotifications = (callback: (rows: any[]) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM messages ORDER BY time DESC`,
      [],
      (_, result) => {
        const rows = [];
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i));
        }
        callback(rows);
      }
    );
  });
};