import { Router } from 'express';
import { generateEmbedding } from './embeddings';
import { searchByVector } from './elasticsearch';

export const searchRouter = Router();

searchRouter.get('/search', async (req, res) => {
  const { q } = req.query as { q: string };
  const userId = req.headers['x-user-id'] as string;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const embedding = await generateEmbedding(q);
  const results = await searchByVector(embedding, userId);
  res.json({ results, query: q });
});
