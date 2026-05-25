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
      const userId = 'task' in event ? (event as any).task?.userId : ('userId' in event ? (event as any).userId : null);
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
