import jwt from 'jsonwebtoken';
import { User } from '@overengineered-todo/shared';
import { redis } from './redis';

const JWT_SECRET = process.env.JWT_SECRET || 'overengineered-secret-key-change-in-prod-lol';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(user: User): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(user: User): string {
  return jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: string; email?: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email?: string };
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  await redis.set(`refresh:${userId}`, token, { EX: 7 * 24 * 60 * 60 });
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await redis.del(`refresh:${userId}`);
}
