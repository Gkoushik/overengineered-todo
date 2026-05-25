# Overengineered TODO App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a demo-grade overengineered TODO app with 7 microservices, 4 databases, Kafka, blockchain, AI, and monitoring — all running on a local Kind cluster.

**Architecture:** Monorepo with npm workspaces. Each service is a standalone Express app with its own Dockerfile, deployed to Kind via Skaffold. Services communicate through Kafka events. A Next.js frontend ties it all together with a clean UI that shows the absurd cascade visually.

**Tech Stack:** TypeScript, Node.js, Express, Next.js, Kafka (KRaft), Postgres, Redis, TimescaleDB, Elasticsearch, Hardhat/Solidity, Grafana, Prometheus, Kind, Skaffold, Docker, Tailwind CSS

---

## Phase 1: Foundation (Monorepo + Shared Package + Infrastructure)

### Task 1: Initialize Monorepo

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/events.ts`
- Create: `packages/shared/src/types.ts`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create root package.json with npm workspaces**

```json
{
  "name": "overengineered-todo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "services/*",
    "frontend",
    "blockchain"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "clean": "rm -rf node_modules packages/*/dist services/*/dist frontend/.next"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.11.0"
  }
}
```

- [ ] **Step 2: Create base tsconfig**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create shared package**

`packages/shared/package.json`:
```json
{
  "name": "@overengineered-todo/shared",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

`packages/shared/src/types.ts`:
```typescript
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: number;
  createdAt: string;
  completedAt?: string;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface PriorityResult {
  taskId: string;
  priority: number;
  reasoning: string;
}

export interface BlockchainReceipt {
  transactionHash: string;
  blockNumber: number;
  taskId: string;
  taskName: string;
  timestamp: number;
}
```

`packages/shared/src/events.ts`:
```typescript
import { Task, PriorityResult, BlockchainReceipt } from './types';

export const TOPICS = {
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  PRIORITIES_UPDATED: 'priorities.updated',
  BLOCKCHAIN_MINTED: 'blockchain.minted',
} as const;

export interface TaskCreatedEvent {
  type: 'task.created';
  task: Task;
  timestamp: string;
}

export interface TaskCompletedEvent {
  type: 'task.completed';
  task: Task;
  timestamp: string;
}

export interface TaskDeletedEvent {
  type: 'task.deleted';
  taskId: string;
  userId: string;
  timestamp: string;
}

export interface PrioritiesUpdatedEvent {
  type: 'priorities.updated';
  userId: string;
  priorities: PriorityResult[];
  timestamp: string;
}

export interface BlockchainMintedEvent {
  type: 'blockchain.minted';
  receipt: BlockchainReceipt;
  timestamp: string;
}

export type AppEvent =
  | TaskCreatedEvent
  | TaskCompletedEvent
  | TaskDeletedEvent
  | PrioritiesUpdatedEvent
  | BlockchainMintedEvent;
```

`packages/shared/src/index.ts`:
```typescript
export * from './types';
export * from './events';
```

- [ ] **Step 4: Create .gitignore and .env.example**

`.gitignore`:
```
node_modules/
dist/
.next/
.env
*.log
coverage/
blockchain/artifacts/
blockchain/cache/
blockchain/typechain-types/
```

`.env.example`:
```bash
# AI Service (optional — fallback mode works without these)
OPENAI_API_KEY=
CLAUDE_API_KEY=

# Auth
JWT_SECRET=overengineered-secret-key-change-in-prod-lol

# Services (defaults work for local dev)
POSTGRES_URL=postgresql://todo:todo@localhost:5432/todo
REDIS_URL=redis://localhost:6379
TIMESCALE_URL=postgresql://todo:todo@localhost:5433/analytics
ELASTICSEARCH_URL=http://localhost:9200
KAFKA_BROKERS=localhost:9092
HARDHAT_RPC_URL=http://localhost:8545
MAILHOG_SMTP_HOST=localhost
MAILHOG_SMTP_PORT=1025
```

- [ ] **Step 5: Install dependencies and build shared package**

```bash
npm install
cd packages/shared && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: initialize monorepo with shared types and event definitions"
```

---

### Task 2: Service Boilerplate Factory

Each service follows the same pattern. We'll create a template, then stamp out all 7 services.

**Files:**
- Create: `services/task-service/package.json`
- Create: `services/task-service/tsconfig.json`
- Create: `services/task-service/src/index.ts`
- Create: `services/task-service/src/health.ts`
- Create: `services/task-service/src/metrics.ts`
- (Repeat for all 7 services)

- [ ] **Step 1: Create the service template files**

Each service gets the same base structure. Here's the pattern (shown for task-service, replicate for all):

`services/task-service/package.json`:
```json
{
  "name": "@overengineered-todo/task-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev --respawn src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@overengineered-todo/shared": "*",
    "express": "^4.18.0",
    "kafkajs": "^2.2.0",
    "prom-client": "^15.1.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

`services/task-service/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

`services/task-service/src/metrics.ts`:
```typescript
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
});
```

`services/task-service/src/health.ts`:
```typescript
import { Router } from 'express';
import { registry } from './metrics';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'task-service', timestamp: new Date().toISOString() });
});

healthRouter.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});
```

`services/task-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);

app.listen(PORT, () => {
  console.log(`[task-service] Running on port ${PORT}`);
});
```

- [ ] **Step 2: Create all 7 services using this pattern**

Replicate the above for:
- `services/api-gateway/` (port 3000)
- `services/task-service/` (port 3001)
- `services/auth-service/` (port 3002)
- `services/notification-service/` (port 3003)
- `services/ai-service/` (port 3004)
- `services/search-service/` (port 3005)
- `services/analytics-service/` (port 3006)

Also create `services/blockchain-service/` (port 3007) — this is the Node service that talks to Hardhat, not the Hardhat node itself.

Change the `name`, `PORT`, and service name string in each.

- [ ] **Step 3: Install all dependencies from root**

```bash
npm install
```

- [ ] **Step 4: Verify each service starts**

```bash
cd services/task-service && npm run dev &
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"task-service","timestamp":"..."}
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold all 7 services with health checks and metrics"
```

---

### Task 3: Kafka Setup & Shared Producer/Consumer

**Files:**
- Create: `packages/shared/src/kafka.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add Kafka helper to shared package**

`packages/shared/src/kafka.ts`:
```typescript
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { AppEvent, TOPICS } from './events';

const BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

export function createKafka(clientId: string): Kafka {
  return new Kafka({
    clientId,
    brokers: BROKERS,
    retry: { initialRetryTime: 1000, retries: 5 },
  });
}

export async function createProducer(kafka: Kafka): Promise<Producer> {
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

export async function publishEvent(producer: Producer, event: AppEvent): Promise<void> {
  await producer.send({
    topic: event.type,
    messages: [{ key: event.type, value: JSON.stringify(event) }],
  });
}

export async function createConsumer(
  kafka: Kafka,
  groupId: string,
  topics: string[],
  handler: (event: AppEvent, payload: EachMessagePayload) => Promise<void>
): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  await consumer.run({
    eachMessage: async (payload) => {
      const event = JSON.parse(payload.message.value!.toString()) as AppEvent;
      await handler(event, payload);
    },
  });
  return consumer;
}
```

- [ ] **Step 2: Re-export from index**

Update `packages/shared/src/index.ts`:
```typescript
export * from './types';
export * from './events';
export * from './kafka';
```

- [ ] **Step 3: Rebuild shared package**

```bash
cd packages/shared && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add Kafka producer/consumer helpers to shared package"
```

---

## Phase 2: Core Services

### Task 4: Auth Service

**Files:**
- Create: `services/auth-service/src/index.ts` (replace boilerplate)
- Create: `services/auth-service/src/jwt.ts`
- Create: `services/auth-service/src/routes.ts`
- Create: `services/auth-service/src/redis.ts`

- [ ] **Step 1: Create Redis client**

`services/auth-service/src/redis.ts`:
```typescript
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({ url: REDIS_URL });

redis.on('error', (err) => console.error('[auth-service] Redis error:', err));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log('[auth-service] Connected to Redis');
}
```

- [ ] **Step 2: Create JWT helpers**

`services/auth-service/src/jwt.ts`:
```typescript
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
```

- [ ] **Step 3: Create auth routes**

`services/auth-service/src/routes.ts`:
```typescript
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { User } from '@overengineered-todo/shared';
import { generateAccessToken, generateRefreshToken, verifyToken, storeRefreshToken } from './jwt';

export const authRouter = Router();

// Simplified auth — no real OAuth2, just register/login with email for demo
authRouter.post('/register', async (req, res) => {
  const { email, username } = req.body;
  const user: User = { id: uuid(), email, username: username || email.split('@')[0] };
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);
  res.json({ user, accessToken, refreshToken });
});

authRouter.post('/login', async (req, res) => {
  const { email } = req.body;
  // Demo: any email "works" — we just mint tokens
  const user: User = { id: uuid(), email, username: email.split('@')[0] };
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);
  res.json({ user, accessToken, refreshToken });
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const payload = verifyToken(refreshToken);
    const user: User = { id: payload.userId, email: '', username: '' };
    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.get('/verify', (req, res) => {
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
```

- [ ] **Step 4: Wire up auth service index**

`services/auth-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { authRouter } from './routes';
import { connectRedis } from './redis';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);
app.use('/auth', authRouter);

async function start() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`[auth-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
```

- [ ] **Step 5: Add dependencies**

Add to `services/auth-service/package.json` dependencies:
```json
"jsonwebtoken": "^9.0.0",
"redis": "^4.6.0",
"uuid": "^9.0.0"
```
And devDependencies:
```json
"@types/jsonwebtoken": "^9.0.0",
"@types/uuid": "^9.0.0"
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: implement auth service with JWT and Redis"
```

---

### Task 5: Task Service

**Files:**
- Create: `services/task-service/src/index.ts` (replace boilerplate)
- Create: `services/task-service/src/db.ts`
- Create: `services/task-service/src/routes.ts`
- Create: `services/task-service/src/producer.ts`

- [ ] **Step 1: Create Postgres client**

`services/task-service/src/db.ts`:
```typescript
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
```

- [ ] **Step 2: Create Kafka producer**

`services/task-service/src/producer.ts`:
```typescript
import { Producer } from 'kafkajs';
import { createKafka, createProducer, publishEvent, TaskCreatedEvent, TaskCompletedEvent, TaskDeletedEvent } from '@overengineered-todo/shared';
import { Task } from '@overengineered-todo/shared';

let producer: Producer;

export async function initProducer(): Promise<void> {
  const kafka = createKafka('task-service');
  producer = await createProducer(kafka);
  console.log('[task-service] Kafka producer connected');
}

export async function emitTaskCreated(task: Task): Promise<void> {
  const event: TaskCreatedEvent = { type: 'task.created', task, timestamp: new Date().toISOString() };
  await publishEvent(producer, event);
}

export async function emitTaskCompleted(task: Task): Promise<void> {
  const event: TaskCompletedEvent = { type: 'task.completed', task, timestamp: new Date().toISOString() };
  await publishEvent(producer, event);
}

export async function emitTaskDeleted(taskId: string, userId: string): Promise<void> {
  const event: TaskDeletedEvent = { type: 'task.deleted', taskId, userId, timestamp: new Date().toISOString() };
  await publishEvent(producer, event);
}
```

- [ ] **Step 3: Create task routes**

`services/task-service/src/routes.ts`:
```typescript
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
```

- [ ] **Step 4: Wire up task service index**

`services/task-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { taskRouter } from './routes';
import { initDb } from './db';
import { initProducer } from './producer';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);
app.use(taskRouter);

async function start() {
  await initDb();
  await initProducer();
  app.listen(PORT, () => {
    console.log(`[task-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
```

- [ ] **Step 5: Add dependencies**

Add to `services/task-service/package.json` dependencies:
```json
"pg": "^8.11.0",
"uuid": "^9.0.0"
```
And devDependencies:
```json
"@types/pg": "^8.10.0",
"@types/uuid": "^9.0.0"
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: implement task service with Postgres and Kafka events"
```

---

### Task 6: API Gateway

**Files:**
- Create: `services/api-gateway/src/index.ts` (replace boilerplate)
- Create: `services/api-gateway/src/proxy.ts`
- Create: `services/api-gateway/src/auth-middleware.ts`
- Create: `services/api-gateway/src/websocket.ts`

- [ ] **Step 1: Create auth middleware**

`services/api-gateway/src/auth-middleware.ts`:
```typescript
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
```

- [ ] **Step 2: Create service proxy**

`services/api-gateway/src/proxy.ts`:
```typescript
import { createProxyMiddleware } from 'http-proxy-middleware';

const SERVICE_URLS: Record<string, string> = {
  '/auth': process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  '/tasks': process.env.TASK_SERVICE_URL || 'http://localhost:3001',
  '/ai': process.env.AI_SERVICE_URL || 'http://localhost:3004',
  '/search': process.env.SEARCH_SERVICE_URL || 'http://localhost:3005',
  '/analytics': process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
  '/blockchain': process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3007',
};

export function createServiceProxies() {
  return Object.entries(SERVICE_URLS).map(([path, target]) => ({
    path,
    proxy: createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (p) => p, // keep path as-is
    }),
  }));
}
```

- [ ] **Step 3: Create WebSocket support for real-time cascade updates**

`services/api-gateway/src/websocket.ts`:
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createKafka, createConsumer, TOPICS, AppEvent } from '@overengineered-todo/shared';

const clients = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('userId') || 'anonymous';
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId)!.add(ws);

    ws.on('close', () => {
      clients.get(userId)?.delete(ws);
    });
  });

  startEventForwarding();
}

async function startEventForwarding(): Promise<void> {
  const kafka = createKafka('api-gateway-ws');
  await createConsumer(
    kafka,
    'api-gateway-ws-group',
    [TOPICS.TASK_CREATED, TOPICS.TASK_COMPLETED, TOPICS.PRIORITIES_UPDATED, TOPICS.BLOCKCHAIN_MINTED],
    async (event: AppEvent) => {
      const userId = 'userId' in event ? (event as any).task?.userId || (event as any).userId : null;
      if (!userId) return;
      const userClients = clients.get(userId);
      if (!userClients) return;
      const message = JSON.stringify(event);
      for (const ws of userClients) {
        if (ws.readyState === WebSocket.OPEN) ws.send(message);
      }
    }
  );
}
```

- [ ] **Step 4: Wire up gateway index**

`services/api-gateway/src/index.ts`:
```typescript
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { healthRouter } from './health';
import { authMiddleware } from './auth-middleware';
import { createServiceProxies } from './proxy';
import { initWebSocket } from './websocket';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);
app.use(authMiddleware);

const proxies = createServiceProxies();
for (const { path, proxy } of proxies) {
  app.use(path, proxy);
}

const server = createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`[api-gateway] Running on port ${PORT}`);
});
```

- [ ] **Step 5: Add dependencies**

Add to `services/api-gateway/package.json` dependencies:
```json
"cors": "^2.8.5",
"http-proxy-middleware": "^2.0.6",
"jsonwebtoken": "^9.0.0",
"ws": "^8.16.0"
```
And devDependencies:
```json
"@types/cors": "^2.8.0",
"@types/jsonwebtoken": "^9.0.0",
"@types/ws": "^8.5.0"
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: implement API gateway with auth, proxy, and WebSocket"
```

---

### Task 7: Notification Service

**Files:**
- Create: `services/notification-service/src/index.ts` (replace)
- Create: `services/notification-service/src/mailer.ts`
- Create: `services/notification-service/src/consumer.ts`

- [ ] **Step 1: Create mailer**

`services/notification-service/src/mailer.ts`:
```typescript
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.MAILHOG_SMTP_HOST || 'localhost';
const SMTP_PORT = parseInt(process.env.MAILHOG_SMTP_PORT || '1025');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
});

export async function sendTaskNotification(email: string, subject: string, body: string): Promise<void> {
  await transporter.sendMail({
    from: '"Overengineered TODO" <todo@overengineered.app>',
    to: email,
    subject,
    text: body,
    html: `<h2>${subject}</h2><p>${body}</p>`,
  });
  console.log(`[notification-service] Email sent: ${subject}`);
}
```

- [ ] **Step 2: Create Kafka consumer**

`services/notification-service/src/consumer.ts`:
```typescript
import { createKafka, createConsumer, TOPICS, AppEvent } from '@overengineered-todo/shared';
import { sendTaskNotification } from './mailer';

export async function startConsumer(): Promise<void> {
  const kafka = createKafka('notification-service');
  await createConsumer(
    kafka,
    'notification-service-group',
    [TOPICS.TASK_CREATED, TOPICS.TASK_COMPLETED],
    async (event: AppEvent) => {
      switch (event.type) {
        case 'task.created':
          await sendTaskNotification(
            'user@overengineered.app',
            `New Task: ${event.task.title}`,
            `You created a new task: "${event.task.title}". Good luck with that.`
          );
          break;
        case 'task.completed':
          await sendTaskNotification(
            'user@overengineered.app',
            `Congratulations! You completed: ${event.task.title}`,
            `Task "${event.task.title}" is done. You're basically a productivity god.`
          );
          break;
      }
    }
  );
  console.log('[notification-service] Kafka consumer started');
}
```

- [ ] **Step 3: Wire up index**

`services/notification-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { startConsumer } from './consumer';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);

async function start() {
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`[notification-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
```

- [ ] **Step 4: Add dependencies**

```json
"nodemailer": "^6.9.0"
```
devDependencies:
```json
"@types/nodemailer": "^6.4.0"
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: implement notification service with Mailhog emails"
```

---

### Task 8: AI Service

**Files:**
- Create: `services/ai-service/src/index.ts` (replace)
- Create: `services/ai-service/src/llm.ts`
- Create: `services/ai-service/src/fallback.ts`
- Create: `services/ai-service/src/consumer.ts`
- Create: `services/ai-service/src/routes.ts`

- [ ] **Step 1: Create fallback responses**

`services/ai-service/src/fallback.ts`:
```typescript
import { PriorityResult } from '@overengineered-todo/shared';

const FUNNY_REASONINGS = [
  "Health comes first. You can't be productive if you're dead.",
  "This has been on your list for 3 days. The guilt alone should motivate you.",
  "Technically optional, but your future self will thank you.",
  "The AI considers this 'mental wellness'. You're welcome.",
  "Urgent because society requires it, not because you want to.",
  "This is the kind of task that separates adults from large children.",
  "Procrastinating this further would be a character flaw.",
  "The algorithm has spoken. Do not question the algorithm.",
];

export function generateFallbackPriorities(taskIds: string[]): PriorityResult[] {
  return taskIds.map((taskId, index) => ({
    taskId,
    priority: taskIds.length - index,
    reasoning: FUNNY_REASONINGS[index % FUNNY_REASONINGS.length],
  }));
}
```

- [ ] **Step 2: Create LLM client**

`services/ai-service/src/llm.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Task, PriorityResult } from '@overengineered-todo/shared';
import { generateFallbackPriorities } from './fallback';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function prioritizeTasks(tasks: Task[]): Promise<PriorityResult[]> {
  if (!CLAUDE_API_KEY && !OPENAI_API_KEY) {
    console.log('[ai-service] No API key set, using fallback responses');
    return generateFallbackPriorities(tasks.map((t) => t.id));
  }

  try {
    if (CLAUDE_API_KEY) {
      return await prioritizeWithClaude(tasks);
    }
    return generateFallbackPriorities(tasks.map((t) => t.id));
  } catch (error) {
    console.error('[ai-service] LLM call failed, using fallback:', error);
    return generateFallbackPriorities(tasks.map((t) => t.id));
  }
}

async function prioritizeWithClaude(tasks: Task[]): Promise<PriorityResult[]> {
  const client = new Anthropic({ apiKey: CLAUDE_API_KEY });
  const taskList = tasks.map((t, i) => `${i + 1}. "${t.title}" (id: ${t.id})`).join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a slightly judgmental productivity AI. Rank these tasks by urgency and life impact. Be opinionated and a little sarcastic in your reasoning.\n\nTasks:\n${taskList}\n\nRespond as JSON array: [{"taskId": "...", "priority": N, "reasoning": "..."}] where priority is highest-first (N = total tasks means highest priority). Keep reasoning to one snarky sentence each.`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return generateFallbackPriorities(tasks.map((t) => t.id));
  return JSON.parse(jsonMatch[0]) as PriorityResult[];
}
```

- [ ] **Step 3: Create Kafka consumer for AI service**

`services/ai-service/src/consumer.ts`:
```typescript
import { createKafka, createProducer, createConsumer, publishEvent, TOPICS, AppEvent, PrioritiesUpdatedEvent } from '@overengineered-todo/shared';
import { Producer } from 'kafkajs';
import { prioritizeTasks } from './llm';

let producer: Producer;

export async function startConsumer(): Promise<void> {
  const kafka = createKafka('ai-service');
  producer = await createProducer(kafka);

  await createConsumer(
    kafka,
    'ai-service-group',
    [TOPICS.TASK_CREATED, TOPICS.TASK_COMPLETED],
    async (event: AppEvent) => {
      if (event.type === 'task.created' || event.type === 'task.completed') {
        // In a real system we'd fetch all tasks for this user
        // For demo, just reprioritize the single task
        const priorities = await prioritizeTasks([event.task]);
        const updateEvent: PrioritiesUpdatedEvent = {
          type: 'priorities.updated',
          userId: event.task.userId,
          priorities,
          timestamp: new Date().toISOString(),
        };
        await publishEvent(producer, updateEvent);
        console.log(`[ai-service] Reprioritized tasks for user ${event.task.userId}`);
      }
    }
  );
  console.log('[ai-service] Kafka consumer started');
}
```

- [ ] **Step 4: Create routes for on-demand prioritization**

`services/ai-service/src/routes.ts`:
```typescript
import { Router } from 'express';
import { Task } from '@overengineered-todo/shared';
import { prioritizeTasks } from './llm';

export const aiRouter = Router();

aiRouter.post('/ai/prioritize', async (req, res) => {
  const { tasks } = req.body as { tasks: Task[] };
  const priorities = await prioritizeTasks(tasks);
  res.json({ priorities });
});
```

- [ ] **Step 5: Wire up index**

`services/ai-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { aiRouter } from './routes';
import { startConsumer } from './consumer';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);
app.use(aiRouter);

async function start() {
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`[ai-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
```

- [ ] **Step 6: Add dependencies**

```json
"@anthropic-ai/sdk": "^0.39.0"
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: implement AI service with Claude integration and fallback"
```

---

### Task 9: Search Service

**Files:**
- Create: `services/search-service/src/index.ts` (replace)
- Create: `services/search-service/src/elasticsearch.ts`
- Create: `services/search-service/src/embeddings.ts`
- Create: `services/search-service/src/consumer.ts`
- Create: `services/search-service/src/routes.ts`

- [ ] **Step 1: Create Elasticsearch client**

`services/search-service/src/elasticsearch.ts`:
```typescript
import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

export const esClient = new Client({ node: ELASTICSEARCH_URL });

const INDEX_NAME = 'tasks';

export async function initIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            taskId: { type: 'keyword' },
            title: { type: 'text' },
            userId: { type: 'keyword' },
            embedding: { type: 'dense_vector', dims: 384, index: true, similarity: 'cosine' },
            createdAt: { type: 'date' },
          },
        },
      },
    });
  }
  console.log('[search-service] Elasticsearch index ready');
}

export async function indexTask(taskId: string, title: string, userId: string, embedding: number[]): Promise<void> {
  await esClient.index({
    index: INDEX_NAME,
    id: taskId,
    body: { taskId, title, userId, embedding, createdAt: new Date().toISOString() },
  });
}

export async function searchByVector(embedding: number[], userId: string, k: number = 5): Promise<Array<{ taskId: string; title: string; score: number }>> {
  const result = await esClient.search({
    index: INDEX_NAME,
    body: {
      query: {
        bool: {
          must: [{ term: { userId } }],
          should: [{
            script_score: {
              query: { match_all: {} },
              script: { source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0", params: { query_vector: embedding } },
            },
          }],
        },
      },
      size: k,
    },
  });

  return (result.hits.hits as any[]).map((hit) => ({
    taskId: hit._source.taskId,
    title: hit._source.title,
    score: hit._score,
  }));
}

export async function deleteTask(taskId: string): Promise<void> {
  await esClient.delete({ index: INDEX_NAME, id: taskId }).catch(() => {});
}
```

- [ ] **Step 2: Create embeddings helper**

`services/search-service/src/embeddings.ts`:
```typescript
import { pipeline } from '@xenova/transformers';

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embed = await getEmbedder();
  const result = await embed(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data as Float32Array).slice(0, 384);
}
```

- [ ] **Step 3: Create consumer**

`services/search-service/src/consumer.ts`:
```typescript
import { createKafka, createConsumer, TOPICS, AppEvent } from '@overengineered-todo/shared';
import { indexTask, deleteTask } from './elasticsearch';
import { generateEmbedding } from './embeddings';

export async function startConsumer(): Promise<void> {
  const kafka = createKafka('search-service');
  await createConsumer(
    kafka,
    'search-service-group',
    [TOPICS.TASK_CREATED, TOPICS.TASK_DELETED],
    async (event: AppEvent) => {
      switch (event.type) {
        case 'task.created': {
          const embedding = await generateEmbedding(event.task.title);
          await indexTask(event.task.id, event.task.title, event.task.userId, embedding);
          console.log(`[search-service] Indexed task: ${event.task.title}`);
          break;
        }
        case 'task.deleted': {
          await deleteTask(event.taskId);
          console.log(`[search-service] Deleted task from index: ${event.taskId}`);
          break;
        }
      }
    }
  );
  console.log('[search-service] Kafka consumer started');
}
```

- [ ] **Step 4: Create search routes**

`services/search-service/src/routes.ts`:
```typescript
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
```

- [ ] **Step 5: Wire up index**

`services/search-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { searchRouter } from './routes';
import { initIndex } from './elasticsearch';
import { startConsumer } from './consumer';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);
app.use(searchRouter);

async function start() {
  await initIndex();
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`[search-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
```

- [ ] **Step 6: Add dependencies**

```json
"@elastic/elasticsearch": "^8.12.0",
"@xenova/transformers": "^2.17.0"
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: implement search service with vector embeddings and Elasticsearch"
```

---

### Task 10: Analytics Service

**Files:**
- Create: `services/analytics-service/src/index.ts` (replace)
- Create: `services/analytics-service/src/timescale.ts`
- Create: `services/analytics-service/src/consumer.ts`
- Create: `services/analytics-service/src/routes.ts`

- [ ] **Step 1: Create TimescaleDB client**

`services/analytics-service/src/timescale.ts`:
```typescript
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
  // TimescaleDB hypertable (will silently fail if TimescaleDB extension not loaded — fine for demo)
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
```

- [ ] **Step 2: Create consumer**

`services/analytics-service/src/consumer.ts`:
```typescript
import { createKafka, createConsumer, TOPICS, AppEvent } from '@overengineered-todo/shared';
import { recordEvent } from './timescale';
import { tasksCompletedTotal, tasksCreatedTotal } from './custom-metrics';

export async function startConsumer(): Promise<void> {
  const kafka = createKafka('analytics-service');
  await createConsumer(
    kafka,
    'analytics-service-group',
    [TOPICS.TASK_CREATED, TOPICS.TASK_COMPLETED, TOPICS.TASK_DELETED],
    async (event: AppEvent) => {
      switch (event.type) {
        case 'task.created':
          await recordEvent('task.created', event.task.userId, event.task.id, event.task.title);
          tasksCreatedTotal.inc();
          console.log(`[analytics-service] Recorded: task created "${event.task.title}"`);
          break;
        case 'task.completed':
          await recordEvent('task.completed', event.task.userId, event.task.id, event.task.title);
          tasksCompletedTotal.inc();
          console.log(`[analytics-service] Recorded: task completed "${event.task.title}"`);
          break;
        case 'task.deleted':
          await recordEvent('task.deleted', event.userId, event.taskId);
          break;
      }
    }
  );
  console.log('[analytics-service] Kafka consumer started');
}
```

- [ ] **Step 3: Create custom metrics**

`services/analytics-service/src/custom-metrics.ts`:
```typescript
import { Counter } from 'prom-client';
import { registry } from './metrics';

export const tasksCreatedTotal = new Counter({
  name: 'tasks_created_total',
  help: 'Total tasks created',
  registers: [registry],
});

export const tasksCompletedTotal = new Counter({
  name: 'tasks_completed_total',
  help: 'Total tasks completed',
  registers: [registry],
});
```

- [ ] **Step 4: Create analytics routes**

`services/analytics-service/src/routes.ts`:
```typescript
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
```

- [ ] **Step 5: Wire up index**

`services/analytics-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { analyticsRouter } from './routes';
import { initDb } from './timescale';
import { startConsumer } from './consumer';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);
app.use(analyticsRouter);

async function start() {
  await initDb();
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`[analytics-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
```

- [ ] **Step 6: Add dependencies**

```json
"pg": "^8.11.0"
```
devDependencies:
```json
"@types/pg": "^8.10.0"
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: implement analytics service with TimescaleDB"
```

---

### Task 11: Blockchain Service + Smart Contract

**Files:**
- Create: `blockchain/package.json`
- Create: `blockchain/hardhat.config.ts`
- Create: `blockchain/contracts/ProofOfProductivity.sol`
- Create: `blockchain/scripts/deploy.ts`
- Create: `services/blockchain-service/src/index.ts` (replace)
- Create: `services/blockchain-service/src/contract.ts`
- Create: `services/blockchain-service/src/consumer.ts`

- [ ] **Step 1: Create Hardhat project**

`blockchain/package.json`:
```json
{
  "name": "@overengineered-todo/blockchain",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "compile": "hardhat compile",
    "node": "hardhat node",
    "deploy": "hardhat run scripts/deploy.ts --network localhost"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "hardhat": "^2.20.0"
  }
}
```

`blockchain/hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
  },
};

export default config;
```

- [ ] **Step 2: Write the Solidity smart contract**

`blockchain/contracts/ProofOfProductivity.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofOfProductivity {
    struct CompletedTask {
        string taskName;
        uint256 taskId;
        uint256 timestamp;
        address completedBy;
    }

    CompletedTask[] public completions;
    mapping(address => uint256[]) public userCompletions;

    event TaskCompletedOnChain(
        uint256 indexed completionId,
        address indexed user,
        string taskName,
        uint256 taskId,
        uint256 timestamp
    );

    function completeTask(string memory taskName, uint256 taskId) public {
        uint256 completionId = completions.length;
        completions.push(CompletedTask({
            taskName: taskName,
            taskId: taskId,
            timestamp: block.timestamp,
            completedBy: msg.sender
        }));
        userCompletions[msg.sender].push(completionId);

        emit TaskCompletedOnChain(completionId, msg.sender, taskName, taskId, block.timestamp);
    }

    function getCompletionHistory(address user) public view returns (uint256[] memory) {
        return userCompletions[user];
    }

    function getCompletion(uint256 id) public view returns (CompletedTask memory) {
        return completions[id];
    }

    function totalCompletions() public view returns (uint256) {
        return completions.length;
    }
}
```

- [ ] **Step 3: Create deploy script**

`blockchain/scripts/deploy.ts`:
```typescript
import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const ProofOfProductivity = await ethers.getContractFactory('ProofOfProductivity');
  const contract = await ProofOfProductivity.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`ProofOfProductivity deployed to: ${address}`);

  // Save address for the blockchain service to use
  const deploymentInfo = { address, deployedAt: new Date().toISOString() };
  fs.writeFileSync(
    path.join(__dirname, '../deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main().catch(console.error);
```

- [ ] **Step 4: Create blockchain service contract client**

`services/blockchain-service/src/contract.ts`:
```typescript
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { BlockchainReceipt } from '@overengineered-todo/shared';

const RPC_URL = process.env.HARDHAT_RPC_URL || 'http://localhost:8545';

let contract: ethers.Contract;
let signer: ethers.Signer;

const ABI = [
  'function completeTask(string memory taskName, uint256 taskId) public',
  'function getCompletionHistory(address user) public view returns (uint256[] memory)',
  'function getCompletion(uint256 id) public view returns (tuple(string taskName, uint256 taskId, uint256 timestamp, address completedBy))',
  'function totalCompletions() public view returns (uint256)',
  'event TaskCompletedOnChain(uint256 indexed completionId, address indexed user, string taskName, uint256 taskId, uint256 timestamp)',
];

export async function initContract(): Promise<void> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  signer = await provider.getSigner(0); // Use first Hardhat account

  // Read deployment address
  const deploymentPath = path.join(__dirname, '../../../blockchain/deployment.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('Contract not deployed. Run: cd blockchain && npm run deploy');
  }
  const { address } = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
  contract = new ethers.Contract(address, ABI, signer);
  console.log(`[blockchain-service] Connected to contract at ${address}`);
}

export async function mintTaskCompletion(taskName: string, taskId: string): Promise<BlockchainReceipt> {
  const numericId = parseInt(taskId.replace(/\D/g, '').slice(0, 8)) || Date.now();
  const tx = await contract.completeTask(taskName, numericId);
  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    taskId,
    taskName,
    timestamp: Date.now(),
  };
}
```

- [ ] **Step 5: Create blockchain consumer**

`services/blockchain-service/src/consumer.ts`:
```typescript
import { createKafka, createProducer, createConsumer, publishEvent, TOPICS, AppEvent, BlockchainMintedEvent } from '@overengineered-todo/shared';
import { Producer } from 'kafkajs';
import { mintTaskCompletion } from './contract';

let producer: Producer;

export async function startConsumer(): Promise<void> {
  const kafka = createKafka('blockchain-service');
  producer = await createProducer(kafka);

  await createConsumer(
    kafka,
    'blockchain-service-group',
    [TOPICS.TASK_COMPLETED],
    async (event: AppEvent) => {
      if (event.type === 'task.completed') {
        console.log(`[blockchain-service] Minting NFT for: ${event.task.title}`);
        const receipt = await mintTaskCompletion(event.task.title, event.task.id);
        const mintEvent: BlockchainMintedEvent = {
          type: 'blockchain.minted',
          receipt,
          timestamp: new Date().toISOString(),
        };
        await publishEvent(producer, mintEvent);
        console.log(`[blockchain-service] Minted! TX: ${receipt.transactionHash}`);
      }
    }
  );
  console.log('[blockchain-service] Kafka consumer started');
}
```

- [ ] **Step 6: Wire up blockchain service index**

`services/blockchain-service/src/index.ts`:
```typescript
import express from 'express';
import { healthRouter } from './health';
import { initContract } from './contract';
import { startConsumer } from './consumer';
import { httpRequestsTotal, httpRequestDuration } from './metrics';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode.toString() });
  });
  next();
});

app.use(healthRouter);

async function start() {
  await initContract();
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`[blockchain-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
```

- [ ] **Step 7: Add dependencies**

`services/blockchain-service/package.json` dependencies:
```json
"ethers": "^6.11.0"
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: implement blockchain service with Solidity smart contract"
```

---

## Phase 3: Frontend

### Task 12: Next.js Frontend

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/tasks/page.tsx`
- Create: `frontend/src/app/dashboard/page.tsx`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/ws.ts`
- Create: `frontend/src/components/TaskList.tsx`
- Create: `frontend/src/components/AddTask.tsx`
- Create: `frontend/src/components/CascadeIndicator.tsx`
- Create: `frontend/src/components/SearchBar.tsx`
- Create: `frontend/src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

`frontend/package.json`:
```json
{
  "name": "@overengineered-todo/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 4000",
    "build": "next build",
    "start": "next start -p 4000"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@overengineered-todo/shared": "*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

`frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:3000/:path*' },
    ];
  },
};
module.exports = nextConfig;
```

`frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`frontend/postcss.config.js`:
```javascript
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Create API client**

`frontend/src/lib/api.ts`:
```typescript
const API_BASE = '/api';

let accessToken: string | null = null;

export function setToken(token: string) { accessToken = token; }
export function getToken() { return accessToken; }

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers as any };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export async function login(email: string) {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email }) });
  accessToken = data.accessToken;
  return data;
}

export async function getTasks() {
  return request('/tasks');
}

export async function createTask(title: string) {
  return request('/tasks', { method: 'POST', body: JSON.stringify({ title }) });
}

export async function completeTask(id: string) {
  return request(`/tasks/${id}/complete`, { method: 'PATCH' });
}

export async function deleteTask(id: string) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

export async function searchTasks(query: string) {
  return request(`/search?q=${encodeURIComponent(query)}`);
}
```

- [ ] **Step 3: Create WebSocket client**

`frontend/src/lib/ws.ts`:
```typescript
import { AppEvent } from '@overengineered-todo/shared';

type EventHandler = (event: AppEvent) => void;

let ws: WebSocket | null = null;
const handlers: EventHandler[] = [];

export function connectWs(userId: string): void {
  const url = `ws://localhost:3000/ws?userId=${userId}`;
  ws = new WebSocket(url);

  ws.onmessage = (msg) => {
    const event = JSON.parse(msg.data) as AppEvent;
    handlers.forEach((h) => h(event));
  };

  ws.onclose = () => {
    setTimeout(() => connectWs(userId), 3000);
  };
}

export function onEvent(handler: EventHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  };
}
```

- [ ] **Step 4: Create layout and globals**

`frontend/src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`frontend/src/app/layout.tsx`:
```tsx
import './globals.css';
import { ReactNode } from 'react';

export const metadata = { title: 'Overengineered TODO', description: 'The most overengineered TODO app ever built' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create login page**

`frontend/src/app/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@overengineered.app');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('token', data.accessToken);
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-xl shadow-2xl w-96 space-y-6">
        <h1 className="text-2xl font-bold text-center">Overengineered TODO</h1>
        <p className="text-gray-400 text-center text-sm">14 microservices. 4 databases. 1 user.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
          placeholder="Email"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Authenticating across 3 services...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Create CascadeIndicator component**

`frontend/src/components/CascadeIndicator.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { onEvent } from '@/lib/ws';
import { AppEvent } from '@overengineered-todo/shared';

interface CascadeStep {
  label: string;
  done: boolean;
}

export function CascadeIndicator() {
  const [steps, setSteps] = useState<CascadeStep[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onEvent((event: AppEvent) => {
      switch (event.type) {
        case 'task.created':
          setVisible(true);
          setSteps([
            { label: 'Task stored in Postgres', done: true },
            { label: 'Event published to Kafka', done: true },
            { label: 'AI prioritizing...', done: false },
            { label: 'Indexing in Elasticsearch...', done: false },
            { label: 'Sending notification...', done: false },
          ]);
          break;
        case 'priorities.updated':
          setSteps((s) => s.map((step) => step.label.includes('AI') ? { ...step, done: true } : step));
          break;
        case 'blockchain.minted':
          setSteps((s) => [...s.map((step) => ({ ...step, done: true })), { label: `NFT minted! TX: ${event.receipt.transactionHash.slice(0, 10)}...`, done: true }]);
          setTimeout(() => setVisible(false), 4000);
          break;
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-xl p-4 w-80 shadow-2xl">
      <h3 className="text-sm font-bold text-gray-400 mb-2">CASCADE IN PROGRESS</h3>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 text-sm py-1">
          <span className={step.done ? 'text-green-400' : 'text-yellow-400 animate-pulse'}>
            {step.done ? '✓' : '⟳'}
          </span>
          <span className={step.done ? 'text-gray-300' : 'text-gray-400'}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Create TaskList and AddTask components**

`frontend/src/components/AddTask.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { createTask } from '@/lib/api';

export function AddTask({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask(title);
      setTitle('');
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
        placeholder="Add a task... (triggers 7 microservices)"
      />
      <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50">
        {loading ? '...' : 'Add'}
      </button>
    </form>
  );
}
```

`frontend/src/components/TaskList.tsx`:
```tsx
'use client';
import { Task } from '@overengineered-todo/shared';
import { completeTask, deleteTask } from '@/lib/api';

interface Props {
  tasks: Task[];
  onChanged: () => void;
}

export function TaskList({ tasks, onChanged }: Props) {
  async function handleComplete(id: string) {
    await completeTask(id);
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    onChanged();
  }

  if (tasks.length === 0) {
    return <p className="text-gray-500 text-center py-8">No tasks yet. Add one to trigger a distributed transaction across 7 services.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <button
            onClick={() => handleComplete(task.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-blue-500'}`}
          >
            {task.completed && <span className="text-white text-xs">✓</span>}
          </button>
          <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
          {task.priority > 0 && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">Priority: {task.priority}</span>}
          <button onClick={() => handleDelete(task.id)} className="text-gray-600 hover:text-red-400 text-sm">✕</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Create SearchBar component**

`frontend/src/components/SearchBar.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { searchTasks } from '@/lib/api';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ taskId: string; title: string; score: number }>>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const data = await searchTasks(query);
    setResults(data.results);
    setSearched(true);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
          placeholder="Semantic search (try 'dairy products' to find 'buy milk')"
        />
        <button type="submit" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium">Search</button>
      </form>
      {searched && results.length === 0 && <p className="text-gray-500 text-sm">No results (cosine similarity found nothing)</p>}
      {results.map((r) => (
        <div key={r.taskId} className="p-3 bg-gray-900 rounded-lg border border-gray-800 flex justify-between">
          <span>{r.title}</span>
          <span className="text-xs text-gray-500">score: {r.score.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Create main tasks page**

`frontend/src/app/tasks/page.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { getTasks, setToken } from '@/lib/api';
import { connectWs } from '@/lib/ws';
import { Task } from '@overengineered-todo/shared';
import { AddTask } from '@/components/AddTask';
import { TaskList } from '@/components/TaskList';
import { SearchBar } from '@/components/SearchBar';
import { CascadeIndicator } from '@/components/CascadeIndicator';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  async function loadTasks() {
    const data = await getTasks();
    setTasks(data.tasks);
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token) setToken(token);
    if (userId) connectWs(userId);
    loadTasks();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">TODO</h1>
        <p className="text-gray-500 text-sm">Powered by 7 microservices, 4 databases, Kafka, AI, and a blockchain</p>
      </header>
      <AddTask onAdded={loadTasks} />
      <SearchBar />
      <TaskList tasks={tasks} onChanged={loadTasks} />
      <CascadeIndicator />
    </div>
  );
}
```

- [ ] **Step 10: Create dashboard page (Grafana embed)**

`frontend/src/app/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      <p className="text-gray-400">Monitoring a TODO app like it's a Fortune 500 company.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <iframe src="http://localhost:3001/grafana/d/system-overview" className="w-full h-96 rounded-lg border border-gray-800" />
        <iframe src="http://localhost:3001/grafana/d/task-pipeline" className="w-full h-96 rounded-lg border border-gray-800" />
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: implement Next.js frontend with real-time cascade indicator"
```

---

## Phase 4: Infrastructure & Deployment

### Task 13: Dockerfiles

**Files:**
- Create: `infra/docker/Dockerfile.service` (shared multi-stage Dockerfile for all Node services)
- Create: `infra/docker/Dockerfile.frontend`
- Create: `infra/docker/Dockerfile.hardhat`

- [ ] **Step 1: Create shared service Dockerfile**

`infra/docker/Dockerfile.service`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY services/${SERVICE_NAME}/package.json services/${SERVICE_NAME}/
RUN npm ci --workspace=packages/shared --workspace=services/${SERVICE_NAME}
COPY packages/shared packages/shared
COPY services/${SERVICE_NAME} services/${SERVICE_NAME}
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/${SERVICE_NAME}

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/services/${SERVICE_NAME}/dist services/${SERVICE_NAME}/dist
COPY --from=builder /app/services/${SERVICE_NAME}/package.json services/${SERVICE_NAME}/
COPY --from=builder /app/node_modules node_modules
WORKDIR /app/services/${SERVICE_NAME}
CMD ["node", "dist/index.js"]
```

Note: Since Docker doesn't support build-time env vars in COPY, each service gets its own Dockerfile that just sets the ARG. Create a script that generates them:

`infra/docker/generate-dockerfiles.sh`:
```bash
#!/bin/bash
SERVICES="api-gateway task-service auth-service notification-service ai-service search-service analytics-service blockchain-service"
for SERVICE in $SERVICES; do
  cat > "infra/docker/Dockerfile.${SERVICE}" <<EOF
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/ packages/shared/
COPY services/${SERVICE}/ services/${SERVICE}/
RUN npm ci
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/${SERVICE}

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/services/${SERVICE}/dist services/${SERVICE}/dist
COPY --from=builder /app/services/${SERVICE}/package.json services/${SERVICE}/
COPY --from=builder /app/services/${SERVICE}/node_modules services/${SERVICE}/node_modules
COPY --from=builder /app/node_modules node_modules
WORKDIR /app/services/${SERVICE}
CMD ["node", "dist/index.js"]
EOF
done
```

- [ ] **Step 2: Create frontend Dockerfile**

`infra/docker/Dockerfile.frontend`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/ packages/shared/
COPY frontend/ frontend/
RUN npm ci
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=frontend

FROM node:20-alpine
WORKDIR /app/frontend
COPY --from=builder /app/frontend/.next .next
COPY --from=builder /app/frontend/public public
COPY --from=builder /app/frontend/package.json .
COPY --from=builder /app/frontend/node_modules node_modules
CMD ["npm", "start"]
```

- [ ] **Step 3: Create Hardhat Dockerfile**

`infra/docker/Dockerfile.hardhat`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY blockchain/package.json blockchain/package-lock.json ./
RUN npm ci
COPY blockchain/ .
RUN npx hardhat compile
EXPOSE 8545
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add Dockerfiles for all services, frontend, and Hardhat"
```

---

### Task 14: Kubernetes Manifests

**Files:**
- Create: `infra/k8s/namespace.yaml`
- Create: `infra/k8s/services/` (one yaml per service)
- Create: `infra/k8s/infra/` (databases, kafka, etc.)
- Create: `infra/k8s/monitoring/` (prometheus, grafana)
- Create: `infra/k8s/ingress.yaml`

- [ ] **Step 1: Create namespace**

`infra/k8s/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: overengineered-todo
```

- [ ] **Step 2: Create service deployments (template for all)**

`infra/k8s/services/task-service.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-service
  namespace: overengineered-todo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: task-service
  template:
    metadata:
      labels:
        app: task-service
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3001"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: task-service
          image: overengineered-todo/task-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: PORT
              value: "3001"
            - name: POSTGRES_URL
              value: "postgresql://todo:todo@postgres:5432/todo"
            - name: KAFKA_BROKERS
              value: "kafka:9092"
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: task-service
  namespace: overengineered-todo
spec:
  selector:
    app: task-service
  ports:
    - port: 3001
      targetPort: 3001
```

Create similar files for: `api-gateway.yaml`, `auth-service.yaml`, `notification-service.yaml`, `ai-service.yaml`, `search-service.yaml`, `analytics-service.yaml`, `blockchain-service.yaml`. Each follows the same pattern with its respective port and env vars.

- [ ] **Step 3: Create infrastructure manifests**

`infra/k8s/infra/postgres.yaml`:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: overengineered-todo
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: todo
            - name: POSTGRES_PASSWORD
              value: todo
            - name: POSTGRES_DB
              value: todo
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: overengineered-todo
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
```

Create similar for `redis.yaml`, `timescaledb.yaml`, `elasticsearch.yaml`, `kafka.yaml`, `mailhog.yaml`, `hardhat.yaml`.

- [ ] **Step 4: Create ingress**

`infra/k8s/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-ingress
  namespace: overengineered-todo
  annotations:
    nginx.ingress.kubernetes.io/websocket-services: api-gateway
spec:
  rules:
    - http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 3000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 4000
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Kubernetes manifests for all services and infrastructure"
```

---

### Task 15: Monitoring Setup

**Files:**
- Create: `infra/monitoring/prometheus-values.yaml`
- Create: `infra/monitoring/grafana-values.yaml`
- Create: `infra/monitoring/dashboards/system-overview.json`
- Create: `infra/monitoring/dashboards/task-pipeline.json`

- [ ] **Step 1: Create Prometheus Helm values**

`infra/monitoring/prometheus-values.yaml`:
```yaml
server:
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
  scrapeInterval: 10s

serverFiles:
  prometheus.yml:
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names: ['overengineered-todo']
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            target_label: __address__
            regex: (.+)
            replacement: ${1}:${2}
```

- [ ] **Step 2: Create Grafana Helm values with provisioning**

`infra/monitoring/grafana-values.yaml`:
```yaml
adminUser: admin
adminPassword: overengineered
resources:
  requests:
    memory: "128Mi"
    cpu: "50m"

datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-server:80
        isDefault: true

dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
      - name: default
        folder: ''
        type: file
        options:
          path: /var/lib/grafana/dashboards

dashboardsConfigMaps:
  default: grafana-dashboards
```

- [ ] **Step 3: Create System Overview dashboard JSON**

`infra/monitoring/dashboards/system-overview.json`:
```json
{
  "title": "System Overview - Overengineered TODO",
  "uid": "system-overview",
  "panels": [
    {
      "title": "Requests/sec by Service",
      "type": "graph",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
      "targets": [{ "expr": "rate(http_requests_total[1m])", "legendFormat": "{{job}}" }]
    },
    {
      "title": "P99 Latency",
      "type": "graph",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
      "targets": [{ "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))", "legendFormat": "{{job}}" }]
    },
    {
      "title": "Tasks Created (Total)",
      "type": "stat",
      "gridPos": { "h": 4, "w": 6, "x": 0, "y": 8 },
      "targets": [{ "expr": "tasks_created_total" }]
    },
    {
      "title": "Tasks Completed (Total)",
      "type": "stat",
      "gridPos": { "h": 4, "w": 6, "x": 6, "y": 8 },
      "targets": [{ "expr": "tasks_completed_total" }]
    },
    {
      "title": "Pod Count",
      "type": "stat",
      "gridPos": { "h": 4, "w": 6, "x": 12, "y": 8 },
      "targets": [{ "expr": "count(up{namespace=\"overengineered-todo\"})" }]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "gridPos": { "h": 8, "w": 24, "x": 0, "y": 12 },
      "targets": [{ "expr": "rate(http_requests_total{status=~\"5..\"}[1m])", "legendFormat": "{{job}} - {{status}}" }]
    }
  ]
}
```

- [ ] **Step 4: Create Task Pipeline dashboard JSON**

`infra/monitoring/dashboards/task-pipeline.json`:
```json
{
  "title": "Task Pipeline - End to End",
  "uid": "task-pipeline",
  "panels": [
    {
      "title": "Task Creation → All Services Complete",
      "type": "graph",
      "gridPos": { "h": 10, "w": 24, "x": 0, "y": 0 },
      "targets": [
        { "expr": "rate(http_requests_total{job=\"task-service\", path=\"/tasks\", method=\"POST\"}[1m])", "legendFormat": "1. Task Created" },
        { "expr": "rate(http_requests_total{job=\"ai-service\"}[1m])", "legendFormat": "2. AI Prioritized" },
        { "expr": "rate(http_requests_total{job=\"search-service\"}[1m])", "legendFormat": "3. Indexed" },
        { "expr": "rate(http_requests_total{job=\"notification-service\"}[1m])", "legendFormat": "4. Notified" },
        { "expr": "rate(http_requests_total{job=\"analytics-service\"}[1m])", "legendFormat": "5. Tracked" },
        { "expr": "rate(http_requests_total{job=\"blockchain-service\"}[1m])", "legendFormat": "6. Minted" }
      ]
    },
    {
      "title": "Kafka Consumer Lag",
      "type": "graph",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 10 },
      "targets": [{ "expr": "kafka_consumer_group_lag", "legendFormat": "{{group}} - {{topic}}" }]
    },
    {
      "title": "Blockchain Mints",
      "type": "stat",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 10 },
      "targets": [{ "expr": "rate(http_requests_total{job=\"blockchain-service\"}[5m])", "legendFormat": "Mints/sec" }]
    }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Prometheus and Grafana monitoring with pre-built dashboards"
```

---

### Task 16: Skaffold + Kind Setup

**Files:**
- Create: `skaffold.yaml`
- Create: `scripts/setup-kind.sh`
- Create: `scripts/deploy-contract.sh`

- [ ] **Step 1: Create skaffold.yaml**

`skaffold.yaml`:
```yaml
apiVersion: skaffold/v4beta6
kind: Config
metadata:
  name: overengineered-todo
build:
  local:
    push: false
  artifacts:
    - image: overengineered-todo/api-gateway
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.api-gateway
    - image: overengineered-todo/task-service
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.task-service
    - image: overengineered-todo/auth-service
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.auth-service
    - image: overengineered-todo/notification-service
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.notification-service
    - image: overengineered-todo/ai-service
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.ai-service
    - image: overengineered-todo/search-service
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.search-service
    - image: overengineered-todo/analytics-service
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.analytics-service
    - image: overengineered-todo/blockchain-service
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.blockchain-service
    - image: overengineered-todo/frontend
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.frontend
    - image: overengineered-todo/hardhat
      context: .
      docker:
        dockerfile: infra/docker/Dockerfile.hardhat
deploy:
  kubectl:
    manifests:
      - infra/k8s/namespace.yaml
      - infra/k8s/infra/*.yaml
      - infra/k8s/services/*.yaml
      - infra/k8s/ingress.yaml
  helm:
    releases:
      - name: prometheus
        remoteChart: prometheus-community/prometheus
        namespace: overengineered-todo
        valuesFiles: [infra/monitoring/prometheus-values.yaml]
      - name: grafana
        remoteChart: grafana/grafana
        namespace: overengineered-todo
        valuesFiles: [infra/monitoring/grafana-values.yaml]
```

- [ ] **Step 2: Create Kind setup script**

`scripts/setup-kind.sh`:
```bash
#!/bin/bash
set -e

echo "=== OVERENGINEERED TODO: SETUP ==="
echo "Creating a Kubernetes cluster for a TODO app. Because we're professionals."
echo ""

# Create Kind cluster
kind create cluster --name overengineered-todo --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30000
        hostPort: 80
        protocol: TCP
      - containerPort: 30001
        hostPort: 3000
        protocol: TCP
EOF

echo ""
echo "Cluster created. Adding Helm repos..."

# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

echo ""
echo "=== KIND CLUSTER READY ==="
echo "Pods needed for a TODO app: ~30"
echo "Pods needed for a TODO app if you're sane: 1"
echo ""
```

- [ ] **Step 3: Create contract deploy script**

`scripts/deploy-contract.sh`:
```bash
#!/bin/bash
set -e
echo "[blockchain] Deploying ProofOfProductivity contract..."
echo "[blockchain] This is the most overengineered 'checked a checkbox' in history."
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
echo "[blockchain] Contract deployed. Your productivity is now immutable."
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add Skaffold config and Kind cluster setup scripts"
```

---

## Phase 5: Glue & Demo Tooling

### Task 17: Makefile

**Files:**
- Create: `Makefile`

- [ ] **Step 1: Create Makefile**

`Makefile`:
```makefile
.PHONY: setup dev demo teardown reset add-sample-tasks show-cascade status

setup:
	@echo "=== Setting up the most overengineered TODO app ever ==="
	@echo "Step 1/5: Installing dependencies..."
	npm install
	@echo "Step 2/5: Building shared package..."
	npm run build --workspace=packages/shared
	@echo "Step 3/5: Creating Kind cluster..."
	bash scripts/setup-kind.sh
	@echo "Step 4/5: Building and deploying to Kubernetes..."
	skaffold run
	@echo "Step 5/5: Deploying smart contract..."
	bash scripts/deploy-contract.sh
	@echo ""
	@echo "=== SETUP COMPLETE ==="
	@echo "Frontend: http://localhost:4000"
	@echo "API Gateway: http://localhost:3000"
	@echo "Grafana: http://localhost:3002 (admin/overengineered)"
	@echo "Mailhog: http://localhost:8025"
	@echo "Pods running: $$(kubectl get pods -n overengineered-todo --no-headers | wc -l)"

dev:
	skaffold dev --port-forward

demo:
	@echo "=== DEMO MODE ==="
	@echo "Deploying stable build optimized for filming..."
	skaffold run
	@echo "All services running. Break a leg."

teardown:
	@echo "Destroying the TODO app that took 2 weeks to build..."
	kind delete cluster --name overengineered-todo
	@echo "Gone. Like it never happened. Except the git history knows."

reset:
	@echo "Wiping all data for a clean take..."
	kubectl exec -n overengineered-todo deploy/postgres -- psql -U todo -d todo -c "TRUNCATE tasks;"
	kubectl exec -n overengineered-todo deploy/timescaledb -- psql -U todo -d analytics -c "TRUNCATE events;"
	kubectl exec -n overengineered-todo deploy/elasticsearch -- curl -s -X DELETE 'localhost:9200/tasks'
	@echo "Clean slate. 4 databases wiped. For a TODO app."

add-sample-tasks:
	@echo "Adding sample tasks (each one triggers 7 microservices)..."
	curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d '{"title":"Buy milk"}' | jq .
	curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d '{"title":"Call dentist"}' | jq .
	curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d '{"title":"Watch Breaking Bad S3"}' | jq .
	curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d '{"title":"Finish TODO app"}' | jq .
	curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d '{"title":"Question life choices"}' | jq .
	@echo "5 tasks added. 35 microservice invocations. 5 Kafka events. 5 AI calls. 0 blockchain mints (yet)."

show-cascade:
	@echo "Adding task and showing the cascade across all services..."
	@echo "--- Tailing all service logs ---"
	kubectl logs -n overengineered-todo -l app --all-containers --follow --max-log-requests=10 &
	@sleep 2
	curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d '{"title":"Witness the cascade"}'
	@sleep 5
	@kill %1 2>/dev/null || true
	@echo ""
	@echo "That was one task. One checkbox. Seven services. Four databases. One blockchain transaction."

status:
	@echo "=== SYSTEM STATUS ==="
	@echo ""
	@echo "Pods:"
	@kubectl get pods -n overengineered-todo --no-headers | awk '{printf "  %-40s %s\n", $$1, $$3}'
	@echo ""
	@echo "Services:"
	@kubectl get svc -n overengineered-todo --no-headers | awk '{printf "  %-30s %s\n", $$1, $$5}'
	@echo ""
	@echo "Total pods: $$(kubectl get pods -n overengineered-todo --no-headers | wc -l)"
	@echo "For context: a TODO app needs 0 pods if you use a sticky note."
```

- [ ] **Step 2: Make scripts executable**

```bash
chmod +x scripts/setup-kind.sh scripts/deploy-contract.sh
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Makefile with setup, demo, and filming helper commands"
```

---

### Task 18: Docker Compose (Development Fallback)

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml for local dev without K8s**

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: todo
      POSTGRES_PASSWORD: todo
      POSTGRES_DB: todo
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  timescaledb:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_USER: todo
      POSTGRES_PASSWORD: todo
      POSTGRES_DB: analytics
    ports: ["5433:5432"]

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms256m -Xmx256m"
    ports: ["9200:9200"]

  kafka:
    image: bitnami/kafka:3.7
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
    ports: ["9092:9092"]

  hardhat:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.hardhat
    ports: ["8545:8545"]

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

  prometheus:
    image: prom/prometheus
    volumes:
      - ./infra/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - ./infra/monitoring/dashboards:/var/lib/grafana/dashboards
    ports: ["3100:3000"]
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add docker-compose.yml for local development without K8s"
```

---

### Task 19: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

`README.md`:
```markdown
# The Most Overengineered TODO App

> 14 microservices. 4 databases. A message queue. A machine learning pipeline. A blockchain. Costs $200/day to run. Has one user. It's me. And I don't even use it because I forgot my password.

## Architecture

```
User → Next.js → API Gateway → Task Service → Postgres
                                     ↓
                              Kafka Event Bus
                    ↙    ↙    ↓    ↘    ↘
            Notification  AI  Search  Analytics  Blockchain
               ↓          ↓     ↓        ↓         ↓
            Mailhog   Claude  Elastic  Timescale  Hardhat
```

**Services:** 7 microservices (TypeScript/Node)
**Databases:** Postgres, Redis, TimescaleDB, Elasticsearch
**Events:** Kafka (KRaft mode)
**AI:** Claude API with fallback responses
**Blockchain:** Solidity smart contract on local Hardhat
**Monitoring:** Prometheus + Grafana
**Orchestration:** Kubernetes (Kind) with 3 replicas per service

## Requirements

- Node.js 20+
- Docker
- Kind (Kubernetes in Docker)
- Helm
- Skaffold
- 16GB+ RAM (seriously)

## Quick Start

```bash
make setup    # ~10 minutes. Get coffee. Question your life choices.
make demo     # Stable deployment for filming
make status   # See the beautiful absurdity
```

## Commands

| Command | What it does |
|---------|-------------|
| `make setup` | Install everything, create cluster, deploy 30+ pods |
| `make dev` | Hot-reload development mode |
| `make demo` | Stable deployment for filming |
| `make teardown` | Delete the cluster |
| `make reset` | Wipe data across 4 databases |
| `make add-sample-tasks` | Seed sample tasks |
| `make show-cascade` | Add a task and watch the cascade in real-time |
| `make status` | Show what's running |

## Cost Per Task

- AWS bill (if deployed): ~$847/month
- Tasks completed: 2
- Cost per task: $423.50
- Cost of a sticky note: $0.02

## License

MIT. But if you deploy this to production, you void all warranties on your sanity.
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "docs: add README with architecture overview and usage"
```

---

### Task 20: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md**

`CLAUDE.md`:
```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An intentionally overengineered TODO app built for a comedy YouTube video. 7 microservices, 4 databases, Kafka, AI, blockchain, and Kubernetes — for a TODO list.

## Build & Run

```bash
# Full setup (Kind cluster + all services)
make setup

# Development with hot-reload
make dev

# Just infrastructure (databases, Kafka, etc.) via Docker Compose
docker-compose up -d

# Build shared package (must run first)
npm run build --workspace=packages/shared

# Run a single service locally
cd services/task-service && npm run dev

# Deploy blockchain contract (requires Hardhat node running)
bash scripts/deploy-contract.sh
```

## Architecture

Monorepo with npm workspaces. All services are TypeScript/Express apps that share types via `packages/shared`.

Event flow: Task Service → Kafka → [Notification, AI, Search, Analytics, Blockchain] services consume events independently.

Key paths:
- `packages/shared/src/events.ts` — Event type definitions and Kafka topic constants
- `packages/shared/src/kafka.ts` — Shared Kafka producer/consumer helpers
- `services/*/src/index.ts` — Service entry points (all follow same pattern)
- `infra/k8s/` — Kubernetes manifests
- `blockchain/contracts/` — Solidity smart contracts

## Conventions

- Every service exposes `/health` and `/metrics` endpoints
- Services communicate via Kafka events, not direct HTTP calls (except API Gateway → services)
- All Kafka event types defined in `packages/shared/src/events.ts`
- AI service has fallback mode (no API key needed for demo)
- Each service gets 3 K8s replicas (the joke is the overkill)
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "docs: add CLAUDE.md for Claude Code context"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Foundation | 1-3 | Monorepo, shared types, Kafka helpers |
| 2: Core Services | 4-11 | All 7 services + blockchain contract |
| 3: Frontend | 12 | Next.js UI with cascade indicator |
| 4: Infrastructure | 13-16 | Dockerfiles, K8s manifests, monitoring, Skaffold |
| 5: Glue & Demo | 17-20 | Makefile, docker-compose, README, CLAUDE.md |

Total: 20 tasks. Each produces a commit. The system is demoable after Phase 4, polished after Phase 5.


