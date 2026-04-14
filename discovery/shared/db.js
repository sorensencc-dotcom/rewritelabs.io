import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

export const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10,
  idleTimeoutMillis: 30000
});

export async function testDB() {
  try {
    await db.query('SELECT 1');
    console.log('[shared/db] Connected to Postgres');
  } catch (err) {
    console.error('[shared/db] Postgres connection failed', err);
  }
}