import { createKafka, createConsumer, TOPICS, AppEvent } from '@overengineered-todo/shared';
import { indexTask, deleteTask } from './elasticsearch';
import { generateEmbedding } from './embeddings';

export async function startConsumer(): Promise<void> {
  const kafka = createKafka('search-service');
  await createConsumer(
    kafka,
    'search-service-group',
    [TOPICS.TASK_CREATED, TOPICS.TASK_DELETED],
    async (event: AppEvent) => {
      switch (event.type) {
        case 'task.created': {
          const embedding = await generateEmbedding(event.task.title);
          await indexTask(event.task.id, event.task.title, event.task.userId, embedding);
          console.log(`[search-service] Indexed task: ${event.task.title}`);
          break;
        }
        case 'task.deleted': {
          await deleteTask(event.taskId);
          console.log(`[search-service] Deleted task from index: ${event.taskId}`);
          break;
        }
      }
    }
  );
  console.log('[search-service] Kafka consumer started');
}
