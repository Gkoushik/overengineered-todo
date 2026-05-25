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
