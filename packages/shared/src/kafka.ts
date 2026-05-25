import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { AppEvent } from './events';

const BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

export function createKafka(clientId: string): Kafka {
  return new Kafka({
    clientId,
    brokers: BROKERS,
    retry: { initialRetryTime: 1000, retries: 5 },
  });
}

export async function createProducer(kafka: Kafka): Promise<Producer> {
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

export async function publishEvent(producer: Producer, event: AppEvent): Promise<void> {
  await producer.send({
    topic: event.type,
    messages: [{ key: event.type, value: JSON.stringify(event) }],
  });
}

export async function createConsumer(
  kafka: Kafka,
  groupId: string,
  topics: string[],
  handler: (event: AppEvent, payload: EachMessagePayload) => Promise<void>
): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  await consumer.run({
    eachMessage: async (payload) => {
      const event = JSON.parse(payload.message.value!.toString()) as AppEvent;
      await handler(event, payload);
    },
  });
  return consumer;
}
