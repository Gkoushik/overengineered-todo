import { Router } from 'express';
import { pool } from './timescale';

export const analyticsRouter = Router();

analyticsRouter.get('/analytics/summary', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const result = await pool.query(`
    SELECT event_type, COUNT(*) as count
    FROM events WHERE user_id = $1
    GROUP BY event_type
  `, [userId]);
  res.json({ summary: result.rows });
});

analyticsRouter.get('/analytics/timeline', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const result = await pool.query(`
    SELECT time, event_type, task_title
    FROM events WHERE user_id = $1
    ORDER BY time DESC LIMIT 50
  `, [userId]);
  res.json({ events: result.rows });
});
