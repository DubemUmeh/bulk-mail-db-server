import pgPromise from 'pg-promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise();

const db = pgp({
  host: process.env.DB_AIVEN_HOST,
  port: process.env.DB_AIVEN_PORT,
  database: process.env.DB_AIVEN_DB,
  user: process.env.DB_AIVEN_USER,
  password: process.env.DB_AIVEN_PASS,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./cert/ca.pem').toString(),
  },
});

const initDB = async () => {
  await db.none(`
    CREATE TABLE IF NOT EXISTS message_history (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      smtp_token TEXT NOT NULL
    );
  `);

  await db.none(`
    CREATE TABLE IF NOT EXISTS config (
      id SERIAL PRIMARY KEY,
      smtp_token TEXT,
      pass_key TEXT NOT NULL,
      smtp_user TEXT,
      smtp_pass TEXT,
      smtp_host TEXT,
      smtp_from TEXT
    );
  `);

  await db.none(`
    CREATE TABLE IF NOT EXISTS passkeys (
      id SERIAL PRIMARY KEY,
      pass_key TEXT UNIQUE NOT NULL
    );
  `);

  return db;
};

export default initDB;