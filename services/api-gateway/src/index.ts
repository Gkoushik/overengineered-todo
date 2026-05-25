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
