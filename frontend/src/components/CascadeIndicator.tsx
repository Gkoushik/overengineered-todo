'use client';
import { useEffect, useState } from 'react';
import { onEvent } from '@/lib/ws';
import { AppEvent } from '@overengineered-todo/shared';

interface CascadeStep {
  label: string;
  done: boolean;
}

export function CascadeIndicator() {
  const [steps, setSteps] = useState<CascadeStep[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onEvent((event: AppEvent) => {
      switch (event.type) {
        case 'task.created':
          setVisible(true);
          setSteps([
            { label: 'Task stored in Postgres', done: true },
            { label: 'Event published to Kafka', done: true },
            { label: 'AI prioritizing...', done: false },
            { label: 'Indexing in Elasticsearch...', done: false },
            { label: 'Sending notification...', done: false },
          ]);
          break;
        case 'priorities.updated':
          setSteps((s) => s.map((step) =>
            step.label.includes('AI') ? { ...step, done: true } : step
          ));
          break;
        case 'blockchain.minted':
          setSteps((s) => [
            ...s.map((step) => ({ ...step, done: true })),
            { label: `NFT minted! TX: ${event.receipt.transactionHash.slice(0, 10)}...`, done: true },
          ]);
          setTimeout(() => setVisible(false), 4000);
          break;
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-xl p-4 w-80 shadow-2xl">
      <h3 className="text-sm font-bold text-gray-400 mb-2">CASCADE IN PROGRESS</h3>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 text-sm py-1">
          <span className={step.done ? 'text-green-400' : 'text-yellow-400 animate-pulse'}>
            {step.done ? '✓' : '⟳'}
          </span>
          <span className={step.done ? 'text-gray-300' : 'text-gray-400'}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}
