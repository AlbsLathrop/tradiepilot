'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('joey@tradie.test');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      rememberMe: rememberMe ? 'true' : 'false',
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.push('/home');
      router.refresh();
    } else {
      setError('Invalid email. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1F2937] rounded-xl border border-white/5 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">TradiePilot</h1>
          <p className="text-gray-400 mb-8">Cockpit + War Room</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joey@tradie.test"
                className="w-full px-4 py-2 rounded-lg bg-[#111827] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#06B6D4]"
                disabled={loading}
              />
            </div>

            <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-[#111827] accent-[#06B6D4]"
                disabled={loading}
              />
              Keep me logged in for 30 days
            </label>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-black font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-gray-500 text-xs mt-6 text-center">
            Test email: joey@tradie.test
          </p>
        </div>
      </div>
    </div>
  );
}
