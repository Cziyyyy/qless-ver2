'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, QrCode, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ScanLoginQrModal from '@/components/ScanLoginQrModal';

export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

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
        setError(data.error || 'Invalid credentials.');
        return;
      }

      if (data.user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else if (data.user.role === 'SERVICE_STAFF') {
        router.push('/service');
      } else if (data.user.role === 'DEPARTMENT_STAFF') {
        router.push('/department');
      } else if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/student/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 sm:p-10 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-700 text-white font-black text-2xl rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              Q
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Student Web Login</h2>
            <p className="text-sm text-gray-500 mt-1">Access your Mapúa digital queue &amp; appointments</p>
          </div>

          {/* FEATURE 1: SCAN LOGIN QR FEATURE PROMINENT BUTTON */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 hover:from-black hover:to-slate-950 text-white p-4 rounded-2xl shadow-md border border-amber-400/50 flex items-center justify-between group transition transform active:scale-98"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-400 text-gray-900 rounded-xl flex items-center justify-center font-black group-hover:scale-105 transition">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">FAST AUTHENTICATION</span>
                  <span className="text-sm font-extrabold text-white">SCAN LOGIN QR CODE</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition" />
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase text-gray-400 tracking-wider">or sign in with password</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Mapúa Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="studentdemo@mymail.mapua.edu.ph"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-700 focus:bg-white focus:outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-700 focus:bg-white focus:outline-none text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-base py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <>
                  <span>LOG IN</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-2">Use demo account:</p>
            <button
              type="button"
              onClick={() => {
                setEmail('studentdemo@mymail.mapua.edu.ph');
                setPassword('student123');
              }}
              className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100"
            >
              Fill Demo Student Credentials
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            Don&apos;t have an account yet?{' '}
            <Link href="/student/register" className="font-bold text-red-700 hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </main>

      {/* QR Code Login Scanner Modal */}
      <ScanLoginQrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />

      <footer className="py-4 text-center text-xs text-gray-400">
        Q-Less Mapúa Student Web Portal
      </footer>
    </div>
  );
}
