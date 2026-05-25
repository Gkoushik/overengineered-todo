'use client';
import { useState } from 'react';
import { createTask } from '@/lib/api';

export function AddTask({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask(title);
      setTitle('');
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
        placeholder="Add a task... (triggers 7 microservices)"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? '...' : 'Add'}
      </button>
    </form>
  );
}
