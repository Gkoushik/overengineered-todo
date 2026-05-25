'use client';
import { Task } from '@overengineered-todo/shared';
import { completeTask, deleteTask } from '@/lib/api';

interface Props {
  tasks: Task[];
  onChanged: () => void;
}

export function TaskList({ tasks, onChanged }: Props) {
  async function handleComplete(id: string) {
    await completeTask(id);
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    onChanged();
  }

  if (tasks.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No tasks yet. Add one to trigger a distributed transaction across 7 services.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg border border-gray-800"
        >
          <button
            onClick={() => handleComplete(task.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              task.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-600 hover:border-blue-500'
            }`}
          >
            {task.completed && <span className="text-white text-xs">✓</span>}
          </button>
          <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </span>
          {task.priority > 0 && (
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
              Priority: {task.priority}
            </span>
          )}
          <button
            onClick={() => handleDelete(task.id)}
            className="text-gray-600 hover:text-red-400 text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
