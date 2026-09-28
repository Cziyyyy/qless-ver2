'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Video, 
  MapPin, 
  HelpCircle, 
  ArrowRight,
  QrCode,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Department {
  id: number;
  name: string;
  code: string;
  professors: { id: number; name: string; specialization: string }[];
}

export default function StudentConsultationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  // Form state
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [consultationTopic, setConsultationTopic] = useState('Grade Consultation');
  const [consultationMode, setConsultationMode] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  const TOPICS = [
    { label: 'Grade Consultation', desc: 'Inquire about quiz, exam, or final grade computation' },
    { label: 'Academic Advising', desc: 'Curriculum guidance, prerequisites, or overload requests' },
    { label: 'Thesis & Capstone Advising', desc: 'Consultation for research, proposal, or project defense' },
    { label: 'Special Examination', desc: 'Request for make-up exams or special assessments' },
    { label: 'Program Shifting / Clearance', desc: 'Inter-department transfer or clearance signature' },
  ];

  useEffect(() => {
    const initData = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/student/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const deptRes = await fetch('/api/student/departments');
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData.departments || []);
          if (deptData.departments?.length > 0) {
            setDepartmentId(deptData.departments[0].id);
          }
        }
      } catch (err) {
        console.error('Failed loading consultation form:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!departmentId) {
      setError('Please select a department.');
      return;
    }
    if (!appointmentDate || !appointmentTime) {
      setError('Please choose a preferred consultation date and time.');
      return;
    }

    setSubmitting(true);

    try {
      const selectedDept = departments.find((d) => d.id === departmentId);
      const fullNotes = `[${consultationMode === 'IN_PERSON' ? 'In-Person' : 'Online MS Teams'}] Course: ${courseCode || 'N/A'}${notes ? ` | Details: ${notes}` : ''}`;

      const res = await fetch('/api/student/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId,
          concernType: consultationTopic,
          professorId,
          appointmentDate,
          appointmentTime,
          notes: fullNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit consultation form.');
        return;
      }

      setSuccessData({
        appointment: data.appointment,
        departmentName: selectedDept?.name,
        mode: consultationMode,
      });
    } catch (err: any) {
      setError('Network error submitting consultation form.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-700 animate-spin" />
      </div>
    );
  }

  const selectedDept = departments.find((d) => d.id === departmentId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
        {/* Header Title */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MAPÚA ACADEMIC CONSULTATION PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Faculty Consultation Request Form
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Submit an official academic consultation request directly to your department head or professor.
          </p>
        </div>

        {/* SUCCESS MODAL / CARD */}
        {successData ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Consultation Form Submitted!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your request has been routed to the <strong className="text-slate-800">{successData.departmentName}</strong> queue.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 max-w-md mx-auto space-y-3 text-left text-xs text-slate-700">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="font-bold text-slate-400 uppercase">TICKET NUMBER</span>
                <span className="font-mono text-xl font-bold text-red-700">{successData.appointment?.queueNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Topic:</span>
                <span className="font-bold text-slate-900">{successData.appointment?.concernType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Faculty:</span>
                <span className="font-bold text-slate-900">{successData.appointment?.instructorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-bold text-slate-900">{successData.appointment?.appointmentDate} at {successData.appointment?.appointmentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode:</span>
                <span className="font-bold text-emerald-700">{successData.mode === 'IN_PERSON' ? '🏫 In-Person Office' : '💻 Online MS Teams'}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/student/appointments"
                className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow transition"
              >
                VIEW IN MY APPOINTMENTS
              </Link>
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 px-6 rounded-xl transition"
              >
                SUBMIT ANOTHER FORM
              </button>
            </div>
          </div>
        ) : (
          /* CONSULTATION FORM CARD */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: DEPARTMENT & PROFESSOR */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b pb-2">
                <Building2 className="w-4 h-4 text-red-700" />
                <span>1. Select School & Faculty</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Academic Department *
                  </label>
                  <select
                    value={departmentId || ''}
                    onChange={(e) => {
                      setDepartmentId(Number(e.target.value));
                      setProfessorId(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none"
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Faculty / Instructor (Optional)
                  </label>
                  <select
                    value={professorId || ''}
                    onChange={(e) => setProfessorId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    <option value="">Any Available Faculty / Department Head</option>
                    {selectedDept?.professors?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: TOPIC & COURSE */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b pb-2">
                <FileText className="w-4 h-4 text-red-700" />
                <span>2. Consultation Topic & Course Details</span>
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                  Select Primary Concern Topic *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.label}
                      type="button"
                      onClick={() => setConsultationTopic(topic.label)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        consultationTopic === topic.label
                          ? 'border-red-700 bg-red-50/70 text-red-900 ring-2 ring-red-600'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-xs block">{topic.label}</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{topic.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Course Code & Title (e.g. CS101 / GED102)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CS102 - Data Structures"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Mode of Consultation *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConsultationMode('IN_PERSON')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                        consultationMode === 'IN_PERSON'
                          ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>In-Person</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsultationMode('ONLINE')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                        consultationMode === 'ONLINE'
                          ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>MS Teams</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: SCHEDULE & NOTES */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b pb-2">
                <Calendar className="w-4 h-4 text-red-700" />
                <span>3. Preferred Schedule & Additional Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Preferred Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Reason for Consultation / Concern Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide background details or specific questions you wish to discuss during the consultation..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-sm py-4 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <>
                    <span>SUBMIT CONSULTATION FORM</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Mapúa University Academic Consultation System
      </footer>
    </div>
  );
}
