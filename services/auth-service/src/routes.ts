import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { User } from '@overengineered-todo/shared';
import { generateAccessToken, generateRefreshToken, verifyToken, storeRefreshToken } from './jwt';

export const authRouter = Router();

// Demo auth — no real password storage, any email gets tokens (it's a TODO app)
authRouter.post('/auth/register', async (req, res) => {
  const { email, username } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  const user: User = { id: uuid(), email, username: username || email.split('@')[0] };
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);
  res.status(201).json({ user, accessToken, refreshToken });
});

authRouter.post('/auth/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  const user: User = { id: uuid(), email, username: email.split('@')[0] };
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);
  res.json({ user, accessToken, refreshToken });
});

authRouter.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
  try {
    const payload = verifyToken(refreshToken);
    const user: User = { id: payload.userId, email: payload.email || '', username: '' };
    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const payload = verifyToken(authHeader.slice(7));
    res.json({ valid: true, userId: payload.userId });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});
