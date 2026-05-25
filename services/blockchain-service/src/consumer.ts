import { createKafka, createProducer, createConsumer, publishEvent, TOPICS, AppEvent, BlockchainMintedEvent } from '@overengineered-todo/shared';
import { Producer } from 'kafkajs';
import { mintTaskCompletion } from './contract';

let producer: Producer;

export async function startConsumer(): Promise<void> {
  const kafka = createKafka('blockchain-service');
  producer = await createProducer(kafka);

  await createConsumer(
    kafka,
    'blockchain-service-group',
    [TOPICS.TASK_COMPLETED],
    async (event: AppEvent) => {
      if (event.type === 'task.completed') {
        console.log(`[blockchain-service] Minting NFT for: ${event.task.title}`);
        const receipt = await mintTaskCompletion(event.task.title, event.task.id);
        const mintEvent: BlockchainMintedEvent = {
          type: 'blockchain.minted',
          receipt,
          timestamp: new Date().toISOString(),
        };
        await publishEvent(producer, mintEvent);
        console.log(`[blockchain-service] Minted! TX: ${receipt.transactionHash}`);
      }
    }
  );
  console.log('[blockchain-service] Kafka consumer started');
}
