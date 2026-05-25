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
