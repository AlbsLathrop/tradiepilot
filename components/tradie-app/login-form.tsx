'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Email not found. Try joey@tradie.test for testing.');
    } else if (result?.ok) {
      router.push('/home');
    }
  }

  return (
    <div className="min-h-screen bg-[#111827] text-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">🛩️</h1>
            <h2 className="text-2xl font-bold mt-4">Cockpit</h2>
            <p className="text-[#9CA3AF] mt-2">Tradie management, simplified</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444] rounded-lg p-3 text-sm text-[#FCA5A5]">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joey@tradie.test"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-[#1F2937] border border-[#374151] text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-[#06B6D4] disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-[#06B6D4] text-[#111827] font-semibold hover:bg-[#0891B2] disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-[#6B7280]">
            Demo: Use <strong>joey@tradie.test</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
