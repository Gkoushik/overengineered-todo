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
