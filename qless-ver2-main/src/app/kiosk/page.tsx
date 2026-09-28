'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Search, Clock, ChevronRight } from 'lucide-react';
import KioskInactivityTimer from '@/components/KioskInactivityTimer';

export default function KioskHomePage() {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      <KioskInactivityTimer inactivityLimitSeconds={45} />

      {/* Header */}
      <header className="flex justify-between items-center border-b border-gray-100 pb-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-700 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            Q
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight flex items-center space-x-2">
              <span>Q-Less Kiosk</span>
              <span className="text-xs font-medium bg-[#F3F4F6] text-[#374151] px-2.5 py-0.5 rounded-md">
                Mapúa
              </span>
            </h1>
            <p className="text-gray-500 text-xs font-normal mt-0.5">
              Digital Self-Service Queuing
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-xl font-semibold text-gray-900 flex items-center justify-end space-x-2">
            <Clock className="w-4 h-4 text-red-700" />
            <span>{timeStr || '12:00 PM'}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{dateStr}</div>
        </div>
      </header>

      {/* Main Center Area */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-10">
          <span className="text-xs font-medium text-gray-500 bg-[#F3F4F6] px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            SELF-SERVICE KIOSK
          </span>
          <h2 className="text-3xl sm:text-5xl font-semibold text-gray-900 mt-4 mb-2 tracking-tight">
            How can we help you?
          </h2>
          <p className="text-sm text-gray-500 font-normal">Select an option below to proceed</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Primary Action Button: GET A QUEUE TICKET */}
          <Link
            href="/kiosk/services"
            className="group bg-red-700 hover:bg-red-800 text-white p-7 rounded-2xl shadow-sm flex flex-col justify-between col-span-1 md:col-span-2 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Ticket className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
                PRIMARY ACTION
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-white mb-1 flex items-center justify-between">
                <span>GET A QUEUE TICKET</span>
                <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-white/90 font-normal">
                Choose between Department Concerns or Service Offices (Admission, Registrar, Treasury).
              </p>
            </div>
          </Link>

          {/* Secondary Action: CHECK QUEUE STATUS */}
          <Link
            href="/kiosk/status"
            className="group bg-white hover:bg-gray-50 text-gray-900 p-6 rounded-2xl border border-gray-200 shadow-sm transition-all flex items-center space-x-4 col-span-1 md:col-span-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] text-gray-700 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-red-700" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                VIEW REQUEST STATUS
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">Track queue status using your queue ticket number</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100 max-w-5xl mx-auto w-full">
        Mapúa University &bull; Q-Less Self-Service Queue System
      </footer>
    </div>
  );
}