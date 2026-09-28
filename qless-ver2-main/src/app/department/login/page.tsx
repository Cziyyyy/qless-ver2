'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function DepartmentStaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('departmental@mapua.edu.ph');
  const [password, setPassword] = useState('department123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid departmental credentials.');
        return;
      }

      if (data.user.role !== 'DEPARTMENT_STAFF' && data.user.role !== 'ADMIN') {
        setError('Unauthorized role. Departmental account required.');
        return;
      }

      router.push('/department');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col justify-between p-6 sm:p-10 font-sans">
      <header className="max-w-md mx-auto w-full flex items-center justify-between pt-4">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-medium text-[#4B5563] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Q-Less</span>
        </Link>
        <span className="text-[11px] font-semibold text-[#6B7280] tracking-wider uppercase">
          DEPARTMENTAL STAFF
        </span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E7EB] space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
              Departmental Portal
            </h1>
            <p className="text-xs text-[#4B5563] mt-1">
              Manage department appointments and concerns.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Mapúa Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="departmental@mapua.edu.ph"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D96868] text-sm text-[#111827] placeholder:text-gray-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-[#111827]">
                  Password
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Demo password is department123'); }} className="text-xs text-[#4B5563] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D96868] text-sm text-[#111827]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D96868] hover:bg-[#c55757] text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#F3F4F6] text-xs text-[#4B5563]">
            <p className="font-medium text-[#111827] mb-1">Pre-configured Demo Account:</p>
            <p className="font-mono text-[11px] text-[#4B5563]">departmental@mapua.edu.ph • department123</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">(Assigned to: School of Information Technology)</p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#6B7280]">
        Q-Less Digital Queueing System • Mapúa University
      </footer>
    </div>
  );
}
