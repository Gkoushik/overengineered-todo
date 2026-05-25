export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: number;
  createdAt: string;
  completedAt?: string;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface PriorityResult {
  taskId: string;
  priority: number;
  reasoning: string;
}

export interface BlockchainReceipt {
  transactionHash: string;
  blockNumber: number;
  taskId: string;
  taskName: string;
  timestamp: number;
}
