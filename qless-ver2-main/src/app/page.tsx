'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Ticket, 
  LogIn, 
  ArrowRight, 
  KeyRound, 
  Copy, 
  Check, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  CreditCard, 
  FileText 
} from 'lucide-react';

export default function HomePage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const demoAccounts = [
    {
      role: 'Student',
      target: 'Student Portal Dashboard',
      icon: GraduationCap,
      email: 'studentdemo@mymail.mapua.edu.ph',
      password: 'student123',
    },
    {
      role: 'Department Staff',
      target: 'Academic / Faculty Consultations',
      icon: BookOpen,
      email: 'departmental@mapua.edu.ph',
      password: 'department123',
    },
    {
      role: 'Service Staff (Admissions)',
      target: 'Admissions Counter Desk',
      icon: Building2,
      email: 'service@mapua.edu.ph',
      password: 'service123',
    },
    {
      role: 'Service Staff (Treasury)',
      target: 'Cashier & Tuition Desk',
      icon: CreditCard,
      email: 'treasury@mapua.edu.ph',
      password: 'treasury123',
    },
    {
      role: 'Service Staff (Registrar)',
      target: 'Records & Credentials Desk',
      icon: FileText,
      email: 'registrar@mapua.edu.ph',
      password: 'registrar123',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 py-12">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-red-700 tracking-tight">Q-Less Mapúa</h1>
          <p className="text-slate-600 mt-2 text-base">
            Smart Queue & Appointment Management System
          </p>
        </div>

        {/* 2 Main Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Card 1: External / Guest Kiosk */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6">
                <Ticket className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Self-Service Kiosk</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                For guests, transferees, and walk-in campus queuing. No Mapúa account required.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <Link
                href="/kiosk"
                className="inline-flex items-center justify-between w-full px-4 py-3 bg-red-700 text-white rounded-xl font-semibold text-sm hover:bg-red-800 transition"
              >
                <span>Open Kiosk Mode</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/kiosk/status"
                className="text-center text-xs text-slate-500 hover:text-slate-800 transition"
              >
                Check Request Status
              </Link>
            </div>
          </div>

          {/* Card 2: Unified Mapúa Login */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6">
                <LogIn className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Mapúa Portal Login</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Access your dashboard using verified Mapúa credentials. Supports students, department faculty, and service staff.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-between w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition"
              >
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/student/register"
                className="text-center text-xs text-slate-500 hover:text-slate-800 transition"
              >
                Need to activate student account? Register here
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Accounts Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-red-700" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Demo Accounts for Testing
              </h3>
            </div>
            <span className="text-xs text-slate-400">Click any value to copy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {demoAccounts.map((acc, idx) => {
              const IconComp = acc.icon;
              const emailCopied = copiedKey === `email-${idx}`;
              const passCopied = copiedKey === `pass-${idx}`;

              return (
                <div
                  key={acc.role}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <IconComp className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="truncate text-[12px]">{acc.role}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3 line-clamp-1">{acc.target}</p>

                    <div className="space-y-2">
                      {/* Email Copy */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Email
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.email, `email-${idx}`)}
                          className="w-full flex items-center justify-between bg-white p-1.5 rounded border border-slate-200 hover:border-red-500 transition text-left"
                        >
                          <span className="font-mono text-[11px] truncate text-slate-700">
                            {acc.email}
                          </span>
                          {emailCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                          )}
                        </button>
                      </div>

                      {/* Password Copy */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Password
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.password, `pass-${idx}`)}
                          className="w-full flex items-center justify-between bg-white p-1.5 rounded border border-slate-200 hover:border-red-500 transition text-left"
                        >
                          <span className="font-mono text-[11px] text-slate-700">
                            {acc.password}
                          </span>
                          {passCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}