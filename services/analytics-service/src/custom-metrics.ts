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
