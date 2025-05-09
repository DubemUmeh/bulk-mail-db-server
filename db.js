import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const initDB = async () => {
  const db = await open({
    filename: './messages.db',
    driver: sqlite3.Database,
  });

  // Create table none existing
  await db.exec(`
    CREATE TABLE IF NOT EXISTS message_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (DATETIME('now','localtime')),
    token TEXT NOT NULL
    )
    `);

    return db;
};

export default initDB;