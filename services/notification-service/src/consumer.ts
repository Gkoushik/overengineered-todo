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
