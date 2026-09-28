'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  PhoneCall, 
  SkipForward, 
  Loader2, 
  Star,
  MessageSquare
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface DepartmentTicket {
  id: number;
  ticket_code: string;
  queue_number: string;
  student_identifier: string;
  student_name: string;
  instructor_name: string | null;
  department_name: string | null;
  concern_details: string | null;
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED';
  queue_date: string;
  sequence_number: number;
  created_at: string;
}

export default function DepartmentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('ALL');
  const [isTeacher, setIsTeacher] = useState<boolean>(false);

  // Queue & Rating Data
  const [tickets, setTickets] = useState<DepartmentTicket[]>([]);
  const [currentlyServing, setCurrentlyServing] = useState<DepartmentTicket | null>(null);
  const [ratingStats, setRatingStats] = useState<any>({ average_rating: '5.0', total_reviews: 0 });
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  // 1. Fetch User & Establish Role Rules
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/department/login');
          return;
        }
        const data = await res.json();
        const currentUser = data.user;

        if (currentUser.role !== 'DEPARTMENT_STAFF') {
          router.push('/student/dashboard');
          return;
        }

        setUser(currentUser);

        const name = currentUser.name || '';
        const teacherDetected = 
          name.startsWith('Prof.') || 
          name.startsWith('Engr.') || 
          name.startsWith('Dr.');

        if (teacherDetected) {
          setIsTeacher(true);
          setSelectedInstructor(name);
        }
      } catch (err) {
        router.push('/department/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // 2. Fetch Tickets based on active filter
  const fetchTickets = async () => {
    try {
      let url = `/api/department-staff/queue?`;
      if (selectedDept !== 'ALL') url += `department=${encodeURIComponent(selectedDept)}&`;
      if (selectedInstructor !== 'ALL') url += `instructor=${encodeURIComponent(selectedInstructor)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        const allTickets: DepartmentTicket[] = data.tickets || [];
        setTickets(allTickets.filter(t => t.status === 'WAITING'));
        
        const active = allTickets.find(t => t.status === 'SERVING' || t.status === 'CALLED');
        setCurrentlyServing(active || null);
      }
    } catch (err) {
      console.error('Failed to fetch department queue:', err);
    }
  };

  // 3. Fetch Rating Stats
  const fetchRatings = async () => {
    try {
      const target = selectedDept !== 'ALL' ? selectedDept : 'School';
      const res = await fetch(`/api/ratings/stats?name=${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        setRatingStats(data.stats || { average_rating: '5.0', total_reviews: 0 });
        setRecentReviews(data.recentFeedback || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!user) return;
    fetchTickets();
    fetchRatings();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, [user, selectedDept, selectedInstructor]);

  // 4. Action Handlers
  const handleUpdateStatus = async (ticketId: number, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/department-staff/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col justify-between font-sans">
      <Navbar user={user} />

      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                {isTeacher ? 'FACULTY PORTAL' : 'DEPARTMENT STAFF PORTAL'}
              </span>
              <span className="text-xs text-gray-400 font-mono">Live Appointment Sync</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1 tracking-tight">
              {isTeacher ? `${user?.name} - Consultations` : 'Department Consultation & Appointments Queue'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isTeacher 
                ? 'Managing academic appointments and consultation requests booked directly with you' 
                : 'Real-time overview of all department appointments, consultation requests, and faculty queues'}
            </p>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {!isTeacher && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-red-700"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="School of Information Technology">School of Information Technology</option>
                    <option value="E.T. Yuchengco School of Business">E.T. Yuchengco School of Business</option>
                    <option value="School of Multimedia and Digital Arts">School of Multimedia &amp; Digital Arts</option>
                    <option value="School of Health Sciences">School of Health Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Instructor</label>
                  <select
                    value={selectedInstructor}
                    onChange={(e) => setSelectedInstructor(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-red-700"
                  >
                    <option value="ALL">All Instructors</option>
                    <option value="Prof. Alex Santos">Prof. Alex Santos</option>
                    <option value="Dr. Maria Fernandez">Dr. Maria Fernandez</option>
                    <option value="Prof. Juan Dela Cruz">Prof. Juan Dela Cruz</option>
                    <option value="Prof. Clarissa Reyes">Prof. Clarissa Reyes</option>
                  </select>
                </div>
              </>
            )}

            {isTeacher && (
              <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-xs">
                <span className="text-gray-500 font-medium">Faculty Member: </span>
                <span className="font-bold text-red-800">{user?.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* NOW SERVING CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm lg:col-span-2 flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                  CURRENT CONSULTATION / APPOINTMENT
                </span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">In Session</span>
              </div>

              {currentlyServing ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-400 font-medium block uppercase tracking-wider">APPOINTMENT / QUEUE NUMBER</span>
                    <div className="text-6xl font-black text-gray-900 font-mono tracking-tight my-1">
                      {currentlyServing.queue_number}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-2 text-xs text-gray-800">
                    <p><span className="text-gray-500 font-semibold">Student:</span> <strong className="text-gray-900">{currentlyServing.student_name}</strong> ({currentlyServing.student_identifier})</p>
                    <p><span className="text-gray-500 font-semibold">Faculty / Instructor:</span> <strong className="text-red-700">{currentlyServing.instructor_name}</strong></p>
                    <p><span className="text-gray-500 font-semibold">Department:</span> <span className="font-medium text-gray-800">{currentlyServing.department_name}</span></p>
                    <p><span className="text-gray-500 font-semibold">Concern / Topic:</span> <span className="font-semibold text-slate-900">{currentlyServing.concern_details || 'Academic Consultation'}</span></p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
                  <h3 className="text-base font-bold text-gray-900">No active consultation in progress</h3>
                  <p className="text-xs text-gray-400 mt-1">Click &quot;Call Next Student&quot; to start serving the next appointment.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-3">
              {currentlyServing ? (
                <>
                  <button
                    onClick={() => handleUpdateStatus(currentlyServing.id, 'COMPLETED')}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Consultation</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(currentlyServing.id, 'SKIPPED')}
                    disabled={actionLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Mark No-Show</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => tickets.length > 0 && handleUpdateStatus(tickets[0].id, 'SERVING')}
                  disabled={actionLoading || tickets.length === 0}
                  className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white font-bold text-xs py-4 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Next Student ({tickets.length} waiting)</span>
                </button>
              )}
            </div>
          </div>

          {/* SIDEBAR: WAITING LIST & RATING STATS */}
          <div className="space-y-6">
            
            {/* WAITING APPOINTMENTS LIST */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-red-700" />
                    <span>Waiting Queue ({tickets.length})</span>
                  </h3>
                </div>

                {tickets.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {tickets.map((t, idx) => (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border text-xs ${
                          idx === 0 ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-sm text-gray-900">{t.queue_number}</span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold bg-red-700 text-white px-2 py-0.5 rounded">
                              UP NEXT
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-800 mt-1">{t.student_name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{t.student_identifier}</p>
                        <p className="text-xs text-red-800 font-semibold mt-1">{t.instructor_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{t.concern_details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-10">No students currently in waiting queue.</p>
                )}
              </div>
            </div>

            {/* FEATURE 2: RATING STATS & REVIEWS CARD */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Student Satisfaction Rating</span>
                </h3>
                <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  ⭐ {ratingStats.average_rating || '5.0'} / 5.0
                </span>
              </div>

              <div className="text-xs text-gray-500">
                Total Feedback Reviews: <strong className="text-gray-900">{ratingStats.total_reviews || 0}</strong>
              </div>

              {recentReviews.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Recent Student Feedback</span>
                  {recentReviews.slice(0, 2).map((rev, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px]">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>{rev.student_name || 'Student'}</span>
                        <span className="text-amber-500">{"⭐".repeat(rev.rating)}</span>
                      </div>
                      <p className="text-gray-500 text-[10px] italic mt-0.5">{rev.feedback}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Mapúa Q-Less Department &amp; Faculty Consultation System
      </footer>
    </div>
  );
}