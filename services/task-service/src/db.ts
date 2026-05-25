import { Pool } from 'pg';

const POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://todo:todo@localhost:5432/todo';

export const pool = new Pool({ connectionString: POSTGRES_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      user_id TEXT NOT NULL
    )
  `);
  console.log('[task-service] Database initialized');
}
