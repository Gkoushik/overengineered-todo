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
