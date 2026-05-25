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
