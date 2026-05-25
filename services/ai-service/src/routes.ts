import { Router } from 'express';
import { Task } from '@overengineered-todo/shared';
import { prioritizeTasks } from './llm';

export const aiRouter = Router();

aiRouter.post('/ai/prioritize', async (req, res) => {
  const { tasks } = req.body as { tasks: Task[] };
  const priorities = await prioritizeTasks(tasks);
  res.json({ priorities });
});
