import { Producer } from 'kafkajs';
import { createKafka, createProducer, publishEvent, TaskCreatedEvent, TaskCompletedEvent, TaskDeletedEvent, Task } from '@overengineered-todo/shared';

let producer: Producer;

export async function initProducer(): Promise<void> {
  const kafka = createKafka('task-service');
  producer = await createProducer(kafka);
  console.log('[task-service] Kafka producer connected');
}

export async function emitTaskCreated(task: Task): Promise<void> {
  const event: TaskCreatedEvent = { type: 'task.created', task, timestamp: new Date().toISOString() };
  await publishEvent(producer, event);
}

export async function emitTaskCompleted(task: Task): Promise<void> {
  const event: TaskCompletedEvent = { type: 'task.completed', task, timestamp: new Date().toISOString() };
  await publishEvent(producer, event);
}

export async function emitTaskDeleted(taskId: string, userId: string): Promise<void> {
  const event: TaskDeletedEvent = { type: 'task.deleted', taskId, userId, timestamp: new Date().toISOString() };
  await publishEvent(producer, event);
}
