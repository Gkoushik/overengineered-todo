import { Task, PriorityResult, BlockchainReceipt } from './types';

export const TOPICS = {
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  PRIORITIES_UPDATED: 'priorities.updated',
  BLOCKCHAIN_MINTED: 'blockchain.minted',
} as const;

export interface TaskCreatedEvent {
  type: 'task.created';
  task: Task;
  timestamp: string;
}

export interface TaskCompletedEvent {
  type: 'task.completed';
  task: Task;
  timestamp: string;
}

export interface TaskDeletedEvent {
  type: 'task.deleted';
  taskId: string;
  userId: string;
  timestamp: string;
}

export interface PrioritiesUpdatedEvent {
  type: 'priorities.updated';
  userId: string;
  priorities: PriorityResult[];
  timestamp: string;
}

export interface BlockchainMintedEvent {
  type: 'blockchain.minted';
  receipt: BlockchainReceipt;
  timestamp: string;
}

export type AppEvent =
  | TaskCreatedEvent
  | TaskCompletedEvent
  | TaskDeletedEvent
  | PrioritiesUpdatedEvent
  | BlockchainMintedEvent;
