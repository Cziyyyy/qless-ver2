'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, Search, AlertCircle, CheckCircle, Bell, Loader2 } from 'lucide-react';
import KioskInactivityTimer from '@/components/KioskInactivityTimer';

interface TicketStatusData {
  ticketCode: string;
  queueNumber: string;
  serviceOfficeName: string;
  serviceName: string;
  status: string;
  queueDate: string;
  estimatedWaitMinutes: number;
  peopleAhead: number;
  currentlyServing: string;
  qrCodeUrl: string;
}

function StatusCheckContent() {
  const searchParams = useSearchParams();
  const initialNumber = searchParams.get('number') || searchParams.get('code') || '';

  const [inputNumber, setInputNumber] = useState(initialNumber);
  const [ticket, setTicket] = useState<TicketStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStatus = async (queryNum: string) => {
    if (!queryNum.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/kiosk/status?code=${encodeURIComponent(queryNum.trim())}`);
      const data = await res.json();
      if (res.ok && data.ticket) {
        setTicket(data.ticket);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setError(data.error || 'Queue ticket not found.');
        setTicket(null);
      }
    } catch (err) {
      setError('Connection error checking status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialNumber) {
      fetchStatus(initialNumber);
    }
  }, [initialNumber]);

  useEffect(() => {
    if (!ticket) return;

    const interval = setInterval(() => {
      fetchStatus(ticket.queueNumber);
    }, 4000);

    return () => clearInterval(interval);
  }, [ticket?.queueNumber]);

  return (
    <main className="max-w-2xl mx-auto w-full my-auto py-8 space-y-6">
      {/* Search Input Box */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStatus(inputNumber);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={inputNumber}
            onChange={(e) => setInputNumber(e.target.value.toUpperCase())}
            placeholder="ENTER QUEUE NUMBER (e.g. A-023)"
            className="flex-1 bg-white text-gray-900 text-xl font-bold p-4 rounded-xl border border-gray-300 focus:border-brand-accent focus:outline-none font-mono placeholder:text-gray-400 uppercase"
          />

          <button
            type="submit"
            disabled={loading}
            className="kiosk-touch-target kiosk-btn bg-brand-accent hover:bg-brand-accent-dark text-white font-semibold text-base px-6 py-4 rounded-xl shadow-subtle flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>CHECK</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Details Result Display */}
      {ticket && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center space-y-6">
          <div>
            <span className="text-[11px] font-semibold text-brand-accent uppercase tracking-wider bg-brand-accent/10 px-2.5 py-0.5 rounded-md">
              LIVE QUEUE STATUS
            </span>
            <div className="text-5xl font-bold text-gray-900 font-mono tracking-tight my-2">
              {ticket.queueNumber}
            </div>
            <p className="text-sm font-semibold text-gray-900">{ticket.serviceOfficeName}</p>
            <p className="text-xs text-gray-500">{ticket.serviceName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
            <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase block">NOW SERVING</span>
              <span className="text-2xl font-bold text-gray-900 font-mono mt-1 block">{ticket.currentlyServing || 'Idle'}</span>
            </div>

            <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase block">PEOPLE AHEAD</span>
              <span className="text-2xl font-bold text-gray-900 font-mono mt-1 block">{ticket.peopleAhead}</span>
            </div>

            <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase block">STATUS</span>
              <span className="text-xs font-semibold text-emerald-600 uppercase block mt-2">{ticket.status}</span>
            </div>

            <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase block">ESTIMATED WAIT</span>
              <span className="text-xs font-semibold text-gray-900 block mt-2">~{ticket.estimatedWaitMinutes} mins</span>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-[11px] text-gray-400 font-mono">
              Auto-updating every 4s • Last checked at {lastUpdated}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

export default function KioskStatusPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between p-6 sm:p-10 select-none">
      <KioskInactivityTimer inactivityLimitSeconds={45} />

      <header className="flex justify-between items-center border-b border-gray-100 pb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/kiosk"
            className="kiosk-touch-target kiosk-btn bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 flex items-center space-x-1.5 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span>Back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Check Queue Status</h1>
            <p className="text-xs text-gray-500">Live queue lookup &amp; waiting estimate</p>
          </div>
        </div>

        <Link
          href="/kiosk"
          className="kiosk-touch-target kiosk-btn bg-brand-accent hover:bg-brand-accent-dark text-white px-4 py-2.5 rounded-xl flex items-center space-x-1.5 text-sm font-semibold shadow-subtle"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
      </header>

      <Suspense fallback={<div className="text-center py-20 text-xs text-gray-500">Loading search...</div>}>
        <StatusCheckContent />
      </Suspense>

      <footer className="text-center text-xs text-gray-400">
        Mapúa Q-Less Digital Kiosk
      </footer>
    </div>
  );
}
