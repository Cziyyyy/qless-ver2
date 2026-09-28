'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Ticket, Calendar, Building2, QrCode, RefreshCw, Loader2, Trash2, Plus, ArrowRight, Star, FileText, Download
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import RatingModal from '@/components/RatingModal';

interface ActiveTicket {
  id: number;
  ticketCode: string;
  queueNumber: string;
  serviceOfficeName: string;
  serviceName: string;
  status: string;
  estimatedWaitMinutes: number;
  peopleAhead: number;
  currentlyServing: string;
  qrCodeUrl: string;
}

interface AppointmentItem {
  id: number;
  appointmentCode: string;
  queueNumber: string;
  instructorName: string;
  departmentName: string;
  concernDetails: string;
  status: string;
  queueDate: string;
  createdAt: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<ActiveTicket[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedQrTicket, setSelectedQrTicket] = useState<ActiveTicket | null>(null);
  
  // Student Login QR Pass Modal
  const [showMyQrPass, setShowMyQrPass] = useState(false);

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ id: number; name: string; type: 'ticket' | 'appointment' } | null>(null);

  const loadDashboardData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/student/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const queueRes = await fetch('/api/student/queue');
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setTickets(queueData.tickets || (queueData.activeTickets || []));
        setAppointments(queueData.appointments || []);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleLeaveLine = async (ticketId: number) => {
    if (!confirm('Are you sure you want to cancel and leave this line?')) return;
    setActionLoading(ticketId);

    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setAppointments((prev) => prev.filter((a) => a.id !== ticketId));

    try {
      const res = await fetch('/api/student/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action: 'CANCEL' }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Failed to cancel: ${data.error || 'Server error'}`);
        await loadDashboardData();
      } else {
        await loadDashboardData();
      }
    } catch (err: any) {
      console.error('Leave line error:', err);
      alert(`Network error: ${err.message}`);
      await loadDashboardData();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-700 animate-spin" />
      </div>
    );
  }

  const primaryTicket = tickets.length > 0 ? tickets[0] : null;
  const myStudentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    JSON.stringify({
      type: 'QLESS_STUDENT_LOGIN',
      email: user?.email || '',
      studentNumber: user?.studentNumber || '',
    })
  )}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full border border-red-200">
                MAPÚA STUDENT PORTAL
              </span>
              <span className="text-xs text-gray-400 font-mono">Live Sync</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Student No: <span className="font-mono font-semibold text-gray-800">{user?.studentNumber || '2024109876'}</span> &bull; {user?.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* View Student Login QR Pass Button */}
            <button
              onClick={() => setShowMyQrPass(true)}
              className="bg-slate-900 hover:bg-black text-amber-400 font-bold text-xs px-4 py-3 rounded-2xl shadow-sm transition flex items-center space-x-2 border border-amber-400/40"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>MY LOGIN QR PASS</span>
            </button>

            {/* Consultation Form Link */}
            <Link
              href="/student/consultation"
              className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-xs px-4 py-3 rounded-2xl shadow-sm transition flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-gray-900" />
              <span>CONSULTATION FORM</span>
            </Link>

            <Link
              href="/student/services"
              className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs px-4 py-3 rounded-2xl shadow-sm transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>JOIN SERVICE LINE</span>
            </Link>
          </div>
        </div>

        {/* SECTION 1: ACTIVE SERVICE QUEUE */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-red-700" />
                <span>ACTIVE SERVICE DESK QUEUE</span>
              </h2>
              {tickets.length > 1 && (
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                  +{tickets.length - 1} more active
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="text-xs font-semibold text-gray-500 hover:text-red-700 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REFRESH</span>
              </button>
            </div>
          </div>

          {primaryTicket ? (
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/40">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {primaryTicket.serviceOfficeName} &bull; {primaryTicket.serviceName}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      Code: {primaryTicket.ticketCode}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-3">
                    YOUR QUEUE NUMBER
                  </div>
                  <div className="text-6xl font-black text-amber-400 font-mono tracking-tight my-1">
                    {primaryTicket.queueNumber}
                  </div>
                </div>

                {/* Status Counters */}
                <div className="grid grid-cols-3 gap-3 bg-gray-800/80 p-4 rounded-2xl border border-gray-700/80 w-full lg:w-auto text-center">
                  <div className="px-3">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">NOW SERVING</span>
                    <span className="text-xl font-bold font-mono text-white">{primaryTicket.currentlyServing || '---'}</span>
                  </div>
                  <div className="border-x border-gray-700 px-3">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">PEOPLE AHEAD</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{primaryTicket.peopleAhead}</span>
                  </div>
                  <div className="px-3">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">EST. WAIT</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">~{primaryTicket.estimatedWaitMinutes}m</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => setSelectedQrTicket(primaryTicket)}
                    className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-xs py-3 px-5 rounded-xl transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>VIEW QR PASS</span>
                  </button>

                  {/* RATE SERVICE BUTTON */}
                  {primaryTicket.status === 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setRatingTarget({ id: primaryTicket.id, name: primaryTicket.serviceOfficeName, type: 'ticket' });
                        setRatingModalOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-1"
                    >
                      <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                      <span>RATE SERVICE</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleLeaveLine(primaryTicket.id)}
                    disabled={actionLoading === primaryTicket.id}
                    className="bg-gray-800 hover:bg-red-950/70 hover:text-red-400 text-gray-400 border border-gray-700 font-medium text-xs py-2 px-4 rounded-xl transition flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Leave Line</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
              <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">No Active Service Desk Tickets</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                You are not currently queued at Admissions, Treasury, or the Registrar.
              </p>
              <Link
                href="/student/services"
                className="inline-flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Join a Service Queue</span>
              </Link>
            </div>
          )}
        </section>

        {/* SECTION 2: APPOINTMENTS & DEPARTMENT CONSULTATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Faculty & Consultation Appointments Column */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-red-700" />
                <span>Department Consultations &amp; Appointments ({appointments.length})</span>
              </h3>
              <Link href="/student/appointments" className="text-xs font-bold text-red-700 hover:underline">
                View All
              </Link>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((app) => (
                  <div 
                    key={app.id} 
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                          {app.departmentName}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-900">
                          {app.queueNumber}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mt-1">
                        Consultation with {app.instructorName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Concern: <span className="text-gray-800 font-medium">{app.concernDetails}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {app.status}
                      </span>

                      {/* FEATURE 2: RATE CONSULTATION SERVICE BUTTON */}
                      <button
                        onClick={() => {
                          setRatingTarget({ id: app.id, name: app.departmentName || 'Academic Consultation', type: 'appointment' });
                          setRatingModalOpen(true);
                        }}
                        className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1"
                        title="Rate this consultation"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Rate</span>
                      </button>

                      <button
                        onClick={() => handleLeaveLine(app.id)}
                        disabled={actionLoading === app.id}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition"
                        title="Cancel Appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 space-y-3">
                <p>No active department consultation appointments.</p>
                <Link
                  href="/student/consultation"
                  className="inline-block text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl transition"
                >
                  Schedule a Consultation Form
                </Link>
              </div>
            )}
          </div>

          {/* Mapúa Campus Services Indicator */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-red-700" />
              <span>Mapúa Service Offices Status</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Real-time operational status for physical campus service counters.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Admissions Office', prefix: 'A', status: 'OPEN' },
                { name: 'Office of the Registrar', prefix: 'R', status: 'OPEN' },
                { name: 'Treasury / Cashier', prefix: 'T', status: 'OPEN' },
                { name: 'School of CS/IT', prefix: 'DEP', status: 'OPEN' },
                { name: 'Student Affairs', prefix: 'SAO', status: 'OPEN' },
                { name: 'IT Infrastructure Helpdesk', prefix: 'IT', status: 'OPEN' }
              ].map((office) => (
                <div key={office.name} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-xs text-gray-800">{office.name}</span>
                    <span className="text-[10px] font-mono text-gray-400">Desk Prefix: {office.prefix}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    {office.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* MY STUDENT LOGIN QR PASS MODAL */}
      {showMyQrPass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border-2 border-amber-400 shadow-2xl relative">
            <div className="w-12 h-12 bg-red-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl shadow">
              Q
            </div>
            <h3 className="text-xl font-black text-gray-900">{user?.name || 'Mapúa Student'}</h3>
            <p className="text-xs font-mono font-bold text-red-700 mt-0.5 mb-4">{user?.studentNumber || 'Student No.'}</p>
            
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={myStudentQrUrl} 
              alt="My Student QR Pass" 
              className="w-56 h-56 mx-auto border border-gray-200 rounded-2xl p-3 mb-4 bg-white shadow-inner" 
            />

            <p className="text-[11px] text-gray-500 mb-5">
              Use this QR Pass to log in quickly on any kiosk or device.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowMyQrPass(false)}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition"
              >
                CLOSE PASS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket QR Modal */}
      {selectedQrTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border-2 border-amber-500 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">{selectedQrTicket.serviceOfficeName}</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedQrTicket.serviceName}</p>

            <div className="text-4xl font-black text-red-700 font-mono mb-4">
              {selectedQrTicket.queueNumber}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={selectedQrTicket.qrCodeUrl} 
              alt="Ticket QR" 
              className="w-48 h-48 mx-auto border rounded-2xl p-2 mb-4" 
            />

            <button
              onClick={() => setSelectedQrTicket(null)}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-3 rounded-xl transition"
            >
              CLOSE PASS
            </button>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        ticketId={ratingTarget?.type === 'ticket' ? ratingTarget.id : null}
        appointmentId={ratingTarget?.type === 'appointment' ? ratingTarget.id : null}
        officeOrDeptName={ratingTarget?.name || 'Service Office'}
        onSuccess={loadDashboardData}
      />

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Mapúa University Q-Less Queue &amp; Appointment Management System
      </footer>
    </div>
  );
}