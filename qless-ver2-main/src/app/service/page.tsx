'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PhoneCall, Play, CheckCircle, SkipForward, XCircle, Clock, Loader2, AlertCircle, Building2, Users
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface TicketData {
  id: number;
  ticketCode: string;
  queueNumber: string;
  studentIdentifier: string;
  studentName?: string;
  serviceName: string;
  status: string;
  createdAt: string;
}

export default function ServiceStaffPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [office, setOffice] = useState<any>(null);
  const [currentlyServing, setCurrentlyServing] = useState<TicketData | null>(null);
  const [waitingList, setWaitingList] = useState<TicketData[]>([]);
  const [nextInLine, setNextInLine] = useState<TicketData | null>(null);
  const [historyToday, setHistoryToday] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalToday: 0, waitingCount: 0, completedCount: 0 });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchQueueData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/service/login');
        return;
      }
      const meData = await meRes.json();

      // Role authorization redirects
      if (meData.user?.role === 'DEPARTMENT_STAFF') {
        router.push('/department');
        return;
      }
      if (meData.user?.role === 'STUDENT') {
        router.push('/student/dashboard');
        return;
      }
      if (meData.user?.role !== 'SERVICE_STAFF') {
        setError('Unauthorized account role. Service staff only.');
        setLoading(false);
        return;
      }
      setUser(meData.user);

      const res = await fetch('/api/service-staff/queue');
      const data = await res.json();

      if (res.ok) {
        setOffice(data.office);
        setCurrentlyServing(data.currentlyServing);
        setWaitingList(data.waiting || []);
        setNextInLine(data.nextInLine);
        setHistoryToday(data.historyToday || []);
        setStats(data.stats || { totalToday: 0, waitingCount: 0, completedCount: 0 });
      } else {
        setError(data.error || 'Failed to fetch queue data.');
      }
    } catch (err) {
      console.error('Error in service staff portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, ticketId?: number) => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/service-staff/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ticketId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Action performed successfully.');
        fetchQueueData();
      } else {
        setError(data.error || 'Action failed.');
      }
    } catch (err) {
      setError('Connection error executing queue action.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col justify-between font-sans">
      <Navbar user={user} />

      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-brand-accent uppercase tracking-wider bg-brand-accent/10 px-2.5 py-0.5 rounded-md">
                SERVICE STAFF PORTAL
              </span>
              <span className="text-xs text-gray-400 font-mono">Live Sync</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {office?.name || 'Admissions'} Desk
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Assigned service desk counter queue management
            </p>
          </div>

          <div className="text-right text-xs">
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-gray-400 truncate max-w-[180px]">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 space-y-6">
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-subtle">
            <span className="text-xs font-medium text-gray-500 block mb-1">Total Tickets Today</span>
            <span className="text-3xl font-bold text-gray-900">{stats.totalToday}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-subtle">
            <span className="text-xs font-medium text-gray-500 block mb-1">Waiting in Queue</span>
            <span className="text-3xl font-bold text-brand-accent">{stats.waitingCount}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-subtle">
            <span className="text-xs font-medium text-gray-500 block mb-1">Completed Today</span>
            <span className="text-3xl font-bold text-emerald-600">{stats.completedCount}</span>
          </div>
        </div>

        {/* Operational Desk Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CURRENTLY SERVING CARD */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-subtle lg:col-span-2 flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <span className="text-[11px] font-semibold text-brand-accent uppercase tracking-wider">
                  CURRENTLY SERVING AT DESK
                </span>
                <span className="text-xs text-gray-400 font-mono">Live Counter</span>
              </div>

              {currentlyServing ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-400 font-medium block">TICKET NUMBER</span>
                    <div className="text-6xl font-bold text-gray-900 font-mono tracking-tight my-1">
                      {currentlyServing.queueNumber}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-1 text-xs text-gray-900">
                    <p><span className="text-gray-500 font-medium">Service:</span> <span className="font-semibold">{currentlyServing.serviceName}</span></p>
                    <p><span className="text-gray-500 font-medium">Student:</span> <span className="font-semibold">{currentlyServing.studentIdentifier}</span></p>
                    <p><span className="text-gray-500 font-medium">Status:</span> <span className="font-semibold text-emerald-600 uppercase">{currentlyServing.status}</span></p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-base font-semibold text-gray-900">Desk is Idle</h3>
                  <p className="text-xs text-gray-500 mt-1">Click &quot;CALL NEXT&quot; to call the next waiting ticket.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                onClick={() => handleAction('CALL_NEXT')}
                disabled={actionLoading || waitingList.length === 0}
                className="bg-brand-accent hover:bg-brand-accent-dark disabled:opacity-40 text-white font-semibold text-xs py-3 px-3 rounded-xl transition-all shadow-subtle flex flex-col items-center justify-center space-y-1"
              >
                <PhoneCall className="w-4 h-4" />
                <span>CALL NEXT</span>
              </button>

              <button
                onClick={() => handleAction('START_SERVING', currentlyServing?.id)}
                disabled={actionLoading || !currentlyServing || currentlyServing.status === 'SERVING'}
                className="bg-gray-900 hover:bg-black disabled:opacity-40 text-white font-semibold text-xs py-3 px-3 rounded-xl transition-all shadow-subtle flex flex-col items-center justify-center space-y-1"
              >
                <Play className="w-4 h-4" />
                <span>START SERVING</span>
              </button>

              <button
                onClick={() => handleAction('COMPLETE', currentlyServing?.id)}
                disabled={actionLoading || !currentlyServing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs py-3 px-3 rounded-xl transition-all shadow-subtle flex flex-col items-center justify-center space-y-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>COMPLETE</span>
              </button>

              <button
                onClick={() => handleAction('SKIP', currentlyServing?.id)}
                disabled={actionLoading || !currentlyServing}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-semibold text-xs py-3 px-3 rounded-xl transition-all shadow-subtle flex flex-col items-center justify-center space-y-1"
              >
                <SkipForward className="w-4 h-4" />
                <span>SKIP</span>
              </button>

              <button
                onClick={() => handleAction('CANCEL', currentlyServing?.id)}
                disabled={actionLoading || !currentlyServing}
                className="bg-white border border-gray-300 text-gray-700 hover:text-red-600 hover:border-red-300 disabled:opacity-40 font-semibold text-xs py-3 px-3 rounded-xl transition-all shadow-subtle flex flex-col items-center justify-center space-y-1"
              >
                <XCircle className="w-4 h-4" />
                <span>CANCEL</span>
              </button>
            </div>
          </div>

          {/* WAITING QUEUE LIST COLUMN */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-brand-accent" />
                  <span>Waiting Queue ({waitingList.length})</span>
                </h3>
              </div>

              {waitingList.length > 0 ? (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {waitingList.map((ticket, idx) => (
                    <div
                      key={ticket.id}
                      className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                        idx === 0
                          ? 'bg-red-50/60 border-brand-accent text-gray-900'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-gray-900">{ticket.queueNumber}</span>
                          {idx === 0 && (
                            <span className="text-[10px] font-semibold bg-brand-accent text-white px-2 py-0.5 rounded">
                              NEXT IN LINE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{ticket.serviceName}</p>
                        <p className="text-[11px] font-mono text-gray-400">{ticket.studentIdentifier}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-10">No tickets waiting in queue.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Mapúa Q-Less Service Staff Desk Portal
      </footer>
    </div>
  );
}
