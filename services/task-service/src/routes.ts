import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { Task } from '@overengineered-todo/shared';
import { pool } from './db';
import { emitTaskCreated, emitTaskCompleted, emitTaskDeleted } from './producer';

export const taskRouter = Router();

taskRouter.get('/tasks', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const result = await pool.query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY priority DESC, created_at DESC',
    [userId]
  );
  const tasks: Task[] = result.rows.map((r) => ({
    id: r.id,
    title: r.title,
    completed: r.completed,
    priority: r.priority,
    createdAt: r.created_at.toISOString(),
    completedAt: r.completed_at?.toISOString(),
    userId: r.user_id,
  }));
  res.json({ tasks });
});

taskRouter.post('/tasks', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { title } = req.body;
  const id = uuid();
  const now = new Date();

  await pool.query(
    'INSERT INTO tasks (id, title, user_id, created_at) VALUES ($1, $2, $3, $4)',
    [id, title, userId, now]
  );

  const task: Task = { id, title, completed: false, priority: 0, createdAt: now.toISOString(), userId };
  await emitTaskCreated(task);
  res.status(201).json({ task });
});

taskRouter.patch('/tasks/:id/complete', async (req, res) => {
  const { id } = req.params;
  const now = new Date();

  const result = await pool.query(
    'UPDATE tasks SET completed = true, completed_at = $1 WHERE id = $2 RETURNING *',
    [now, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const r = result.rows[0];
  const task: Task = {
    id: r.id, title: r.title, completed: true, priority: r.priority,
    createdAt: r.created_at.toISOString(), completedAt: now.toISOString(), userId: r.user_id,
  };
  await emitTaskCompleted(task);
  res.json({ task });
});

taskRouter.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string;
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  await emitTaskDeleted(id, userId);
  res.status(204).end();
});
