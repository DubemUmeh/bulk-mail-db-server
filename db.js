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
    smtp_token TEXT NOT NULL
    )
    `);

    // Create the new config table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      smtp_token TEXT,  /* Remove NOT NULL constraint */
      pass_key TEXT NOT NULL,
      smtp_user TEXT,
      smtp_pass TEXT,
      smtp_host TEXT,
      smtp_from TEXT
    )
  `);

  return db;
};

export default initDB;