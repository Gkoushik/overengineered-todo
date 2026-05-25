import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'overengineered-secret-key-change-in-prod-lol';

const PUBLIC_PATHS = ['/auth/register', '/auth/login', '/auth/refresh', '/health', '/metrics'];

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (PUBLIC_PATHS.some((p) => req.path.startsWith(p))) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string };
    req.headers['x-user-id'] = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
