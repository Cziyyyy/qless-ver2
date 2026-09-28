'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ArrowRight } from 'lucide-react';
import ScanLoginQrModal from '@/components/ScanLoginQrModal';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'student' | 'operational'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, accountType }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Login failed. Please check your credentials.');
      }

      if (accountType === 'student') {
        router.push('/student/dashboard');
        return;
      }

      const role = data?.user?.role?.toLowerCase() || '';
      const department = data?.user?.department?.toLowerCase() || '';
      const lowerEmail = email.toLowerCase();

      const isServiceStaff =
        role === 'service_staff' ||
        department.includes('registrar') ||
        department.includes('admission') ||
        department.includes('treasury') ||
        lowerEmail.includes('registrar') ||
        lowerEmail.includes('admission') ||
        lowerEmail.includes('treasury') ||
        lowerEmail.includes('service');

      if (isServiceStaff) {
        router.push('/service');
      } else {
        router.push('/department');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mapúa Unified Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in with your Mapúa account</p>
        </div>

        {/* Account Type Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAccountType('student');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-lg transition-all ${
              accountType === 'student'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType('operational');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-lg transition-all ${
              accountType === 'operational'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operationals
          </button>
        </div>

        {/* FEATURE 1: SCAN LOGIN QR CODE BUTTON FOR STUDENTS */}
        {accountType === 'student' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full bg-slate-900 hover:bg-black text-white p-3.5 rounded-xl shadow-xs border border-amber-400/50 flex items-center justify-between group transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-400 text-gray-900 rounded-lg flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">QUICK AUTH</span>
                  <span className="text-xs font-bold text-white">SCAN LOGIN QR CODE</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {accountType === 'student' ? 'Student Email' : 'Operational Staff Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                accountType === 'student'
                  ? 'studentdemo@mymail.mapua.edu.ph'
                  : 'staff@mapua.edu.ph'
              }
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition"
            />
          </div>

          {accountType === 'operational' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
              * Staff members are automatically routed to the <b>Service Staff Portal</b> or <b>Department Staff Portal</b> based on assignment.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 disabled:opacity-50 transition shadow-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-red-700 transition">
            &larr; Back to Kiosk
          </Link>
          {accountType === 'student' && (
            <Link href="/student/register" className="hover:text-red-700 transition">
              Create an Account
            </Link>
          )}
        </div>
      </div>

      {/* QR Code Login Scanner Modal */}
      <ScanLoginQrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </div>
  );
}