'use client';
import { useState } from 'react';
import { searchTasks } from '@/lib/api';

interface SearchResult {
  taskId: string;
  title: string;
  score: number;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const data = await searchTasks(query);
    setResults(data.results);
    setSearched(true);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
          placeholder="Semantic search (try 'dairy products' to find 'buy milk')"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
        >
          Search
        </button>
      </form>
      {searched && results.length === 0 && (
        <p className="text-gray-500 text-sm">No results (cosine similarity found nothing)</p>
      )}
      {results.map((r) => (
        <div
          key={r.taskId}
          className="p-3 bg-gray-900 rounded-lg border border-gray-800 flex justify-between"
        >
          <span>{r.title}</span>
          <span className="text-xs text-gray-500">score: {r.score.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}
