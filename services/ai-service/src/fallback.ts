import { PriorityResult } from '@overengineered-todo/shared';

const FUNNY_REASONINGS = [
  "Health comes first. You can't be productive if you're dead.",
  "This has been on your list for 3 days. The guilt alone should motivate you.",
  "Technically optional, but your future self will thank you.",
  "The AI considers this 'mental wellness'. You're welcome.",
  "Urgent because society requires it, not because you want to.",
  "This is the kind of task that separates adults from large children.",
  "Procrastinating this further would be a character flaw.",
  "The algorithm has spoken. Do not question the algorithm.",
];

export function generateFallbackPriorities(taskIds: string[]): PriorityResult[] {
  return taskIds.map((taskId, index) => ({
    taskId,
    priority: taskIds.length - index,
    reasoning: FUNNY_REASONINGS[index % FUNNY_REASONINGS.length],
  }));
}
