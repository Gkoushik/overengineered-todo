import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({ url: REDIS_URL });

redis.on('error', (err) => console.error('[auth-service] Redis error:', err));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log('[auth-service] Connected to Redis');
}
