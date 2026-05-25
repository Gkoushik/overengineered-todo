import { Pool } from 'pg';

const TIMESCALE_URL = process.env.TIMESCALE_URL || 'postgresql://todo:todo@localhost:5433/analytics';

export const pool = new Pool({ connectionString: TIMESCALE_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      time TIMESTAMPTZ NOT NULL,
      event_type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      task_id TEXT,
      task_title TEXT,
      metadata JSONB DEFAULT '{}'
    )
  `);
  await pool.query(`
    SELECT create_hypertable('events', 'time', if_not_exists => TRUE)
  `).catch(() => console.log('[analytics-service] Hypertable creation skipped (TimescaleDB extension may not be loaded)'));
  console.log('[analytics-service] Database initialized');
}

export async function recordEvent(eventType: string, userId: string, taskId?: string, taskTitle?: string): Promise<void> {
  await pool.query(
    'INSERT INTO events (time, event_type, user_id, task_id, task_title) VALUES (NOW(), $1, $2, $3, $4)',
    [eventType, userId, taskId || null, taskTitle || null]
  );
}
