'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@overengineered.app');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('token', data.accessToken);
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-xl shadow-2xl w-96 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Overengineered TODO</h1>
          <p className="text-gray-400 text-sm">14 microservices. 4 databases. 1 user.</p>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
          placeholder="Email"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? 'Authenticating across 3 services...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
