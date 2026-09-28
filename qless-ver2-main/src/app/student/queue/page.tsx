'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Ticket, 
  QrCode, 
  RefreshCw, 
  History, 
  Loader2, 
  Layers,
  X,
  Plus,
  CheckCircle2,
  Trash2,
  LayoutDashboard
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function StudentQueuePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedQrTicket, setSelectedQrTicket] = useState<any>(null);

  const fetchQueueData = async (manual = false) => {
    if (manual) setIsSyncing(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/student/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const res = await fetch(`/api/student/queue?t=${Date.now()}`);
      const data = await res.json();
      if (res.ok) {
        const tickets = data.tickets || data.activeTickets || (data.activeTicket ? [data.activeTicket] : []);
        setActiveTickets(tickets);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching queue status:', err);
    } finally {
      setLoading(false);
      if (manual) setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(() => {
      fetchQueueData(false);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleTicketAction = async (ticketId: number, action: 'DONE' | 'CANCEL') => {
    setActionLoadingId(ticketId);
    try {
      const res = await fetch('/api/student/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action }),
      });

      if (res.ok) {
        await fetchQueueData(true);
        if (action === 'DONE') {
          router.push('/student/dashboard');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update ticket status.');
      }
    } catch (err) {
      alert('Error updating ticket.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Ticket className="w-8 h-8 text-red-700" />
              <span>My Queue Status</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Active queues for <strong className="text-slate-800">{user?.name}</strong> (Student No: {user?.studentNumber || user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/kiosk/services"
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Join Another Queue</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchQueueData(true)}
              disabled={isSyncing}
              className="bg-white border border-slate-200 text-slate-700 hover:text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-700' : ''}`} />
              <span>{isSyncing ? 'SYNCING...' : 'SYNC'}</span>
            </button>
          </div>
        </div>

        {/* ACTIVE TICKETS */}
        {activeTickets.length > 0 ? (
          <div className="space-y-6 mb-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-700" />
                Active Queues ({activeTickets.length})
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {activeTickets.map((ticket) => (
                <div
                  key={ticket.id || ticket.queueNumber}
                  className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-xl relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <span className="bg-red-700 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
                        {ticket.serviceOfficeName || 'Campus Desk'} &bull; {ticket.serviceName}
                      </span>
                      <p className="text-xs text-slate-400 mt-2 font-mono">
                        Verification Code: <strong className="text-slate-200">{ticket.ticketCode || 'N/A'}</strong>
                      </p>
                    </div>

                    <span
                      className={`text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider ${
                        ticket.status === 'SERVING'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {ticket.status === 'SERVING' ? 'NOW SERVING - PROCEED TO COUNTER' : 'WAITING IN LINE'}
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between items-center gap-6 py-6">
                    <div className="text-center lg:text-left">
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        YOUR QUEUE NUMBER
                      </div>
                      <div className="text-6xl sm:text-7xl font-black text-amber-400 font-mono tracking-tight my-1">
                        {ticket.queueNumber}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 w-full lg:w-auto text-center">
                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">NOW SERVING</span>
                        <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
                          {ticket.currentlyServing || '---'}
                        </span>
                      </div>

                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">PEOPLE AHEAD</span>
                        <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block">
                          {ticket.peopleAhead ?? 0}
                        </span>
                      </div>

                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">STATUS</span>
                        <span className="text-sm sm:text-base font-black text-emerald-400 uppercase mt-1 block">
                          {ticket.status}
                        </span>
                      </div>

                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">EST. WAIT</span>
                        <span className="text-sm sm:text-base font-black text-white mt-1 block">
                          ~{ticket.estimatedWaitMinutes ?? 5}m
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedQrTicket(ticket)}
                        className="bg-amber-400 text-slate-900 hover:bg-amber-300 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow text-xs transition"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>SHOW QR</span>
                      </button>

                      {/* DONE: Completes ticket & returns to dashboard */}
                      <button
                        type="button"
                        disabled={actionLoadingId === ticket.id}
                        onClick={() => handleTicketAction(ticket.id, 'DONE')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow text-xs transition disabled:opacity-50"
                      >
                        {actionLoadingId === ticket.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>DONE</span>
                          </>
                        )}
                      </button>

                      {/* LEAVE LINE */}
                      <button
                        type="button"
                        disabled={actionLoadingId === ticket.id}
                        onClick={() => handleTicketAction(ticket.id, 'CANCEL')}
                        className="bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 font-bold px-5 py-2 rounded-xl flex items-center justify-center gap-2 border border-slate-700 text-xs transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Leave Line</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs mb-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Ticket className="w-8 h-8 stroke-1" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No Active Queue Tickets</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              You are currently not queued for any campus desks. Register online to hold your spot remotely.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/kiosk/services"
                className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ JOIN THE ONLINE QUEUE</span>
              </Link>
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-2xl transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* QUEUE HISTORY */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-red-700" />
              <span>Queue History</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {history.length} Records
            </span>
          </div>

          {history.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {history.map((item) => (
                <div key={item.id} className="py-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-red-700">{item.queueNumber}</span>
                    <span className="text-slate-400 mx-1.5">&bull;</span>
                    <strong className="text-slate-800 font-semibold">{item.officeName || 'Campus Desk'}</strong>
                    <p className="text-slate-500 mt-0.5">
                      {item.serviceName} &bull; {item.queueDate}
                    </p>
                  </div>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No previous queue history found on your account.
            </div>
          )}
        </div>
      </main>

      {/* QR Modal */}
      {selectedQrTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-amber-400 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedQrTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedQrTicket.serviceOfficeName}</h3>
            <p className="text-xs text-slate-500 mb-3">{selectedQrTicket.serviceName}</p>

            <div className="text-3xl font-black text-red-700 font-mono mb-4 bg-red-50 py-1.5 rounded-xl border border-red-100">
              {selectedQrTicket.queueNumber}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={selectedQrTicket.qrCodeUrl} 
              alt="QR Code" 
              className="w-44 h-44 mx-auto border border-slate-200 rounded-2xl p-2 mb-5 bg-white shadow-xs" 
            />

            <button
              type="button"
              onClick={() => setSelectedQrTicket(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}