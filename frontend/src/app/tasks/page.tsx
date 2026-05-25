'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, setToken } from '@/lib/api';
import { connectWs } from '@/lib/ws';
import { Task } from '@overengineered-todo/shared';
import { AddTask } from '@/components/AddTask';
import { TaskList } from '@/components/TaskList';
import { SearchBar } from '@/components/SearchBar';
import { CascadeIndicator } from '@/components/CascadeIndicator';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();

  async function loadTasks() {
    try {
      const data = await getTasks();
      setTasks(data.tasks);
    } catch {
      router.push('/');
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token) {
      router.push('/');
      return;
    }
    setToken(token);
    if (userId) connectWs(userId);
    loadTasks();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">TODO</h1>
        <p className="text-gray-500 text-sm">
          Powered by 7 microservices, 4 databases, Kafka, AI, and a blockchain
        </p>
        <a href="/dashboard" className="text-xs text-blue-400 hover:text-blue-300">
          View Analytics Dashboard →
        </a>
      </header>
      <AddTask onAdded={loadTasks} />
      <SearchBar />
      <TaskList tasks={tasks} onChanged={loadTasks} />
      <CascadeIndicator />
    </div>
  );
}
