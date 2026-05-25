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
app.use(authRouter);

async function start() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`[auth-service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
