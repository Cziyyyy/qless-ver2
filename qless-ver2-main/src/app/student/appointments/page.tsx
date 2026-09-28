'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Loader2, 
  UserCheck,
  AlertCircle,
  X,
  FileText,
  Star
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import RatingModal from '@/components/RatingModal';

interface Department {
  id: number;
  name: string;
  code: string;
  professors: { id: number; name: string; specialization: string }[];
}

export default function StudentAppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Booking Form State
  const [showModal, setShowModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);

  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [concernType, setConcernType] = useState('');
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedQrApp, setSelectedQrApp] = useState<any>(null);

  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ id: number; name: string } | null>(null);

  const CONCERNS = [
    'Grade Consultation',
    'Academic Advising',
    'Academic Concern',
    'Shifting of Program/Department',
    'Meeting with a Professor',
  ];

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/student/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // Fetch Appointments
      const appRes = await fetch('/api/student/appointments');
      if (appRes.ok) {
        const appData = await appRes.json();
        setAppointments(appData.appointments || []);
      }

      // Fetch Departments & Professors
      const deptRes = await fetch('/api/student/departments');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
      }
    } catch (err) {
      console.error('Error loading appointments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/student/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: selectedDeptId,
          concernType,
          professorId: selectedProfId,
          appointmentDate,
          appointmentTime,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to submit appointment.');
        return;
      }

      setShowModal(false);
      setBookingStep(1);
      setSelectedDeptId(null);
      setConcernType('');
      setSelectedProfId(null);
      setAppointmentDate('');
      setAppointmentTime('');
      setNotes('');

      loadData();
    } catch (err) {
      setFormError('Server error submitting appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-700 animate-spin" />
      </div>
    );
  }

  const selectedDept = departments.find((d) => d.id === selectedDeptId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Calendar className="w-8 h-8 text-red-700" />
              <span>Department Appointments &amp; Consultations</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Schedule academic consultations &amp; professor meetings directly with your school department
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/student/consultation"
              className="bg-slate-900 hover:bg-black text-amber-400 font-bold text-xs px-5 py-3.5 rounded-2xl shadow-sm transition flex items-center gap-2 border border-amber-400/40"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>OPEN CONSULTATION FORM</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowModal(true);
                setBookingStep(1);
              }}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-5 py-3.5 rounded-2xl shadow-sm transition flex items-center gap-2 transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>SCHEDULE APPOINTMENT</span>
            </button>
          </div>
        </div>

        {/* Appointments List Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Your Appointments &amp; Consultations</h2>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
              {appointments.length} Total
            </span>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((app) => (
                <div
                  key={app.id}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-red-200 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        {app.departmentName}
                      </span>
                      {app.queueNumber && (
                        <span className="text-xs font-mono font-bold bg-slate-900 text-amber-300 px-3 py-1 rounded-full">
                          {app.queueNumber}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-1">{app.concernType}</h3>
                    
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>
                        Professor: <strong className="text-slate-800 font-semibold">{app.instructorName || app.professorName || 'Department Head / Any Professor'}</strong>
                      </span>
                    </p>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        Schedule: <strong className="text-slate-700">{app.appointmentDate || app.queueDate}</strong> at <strong className="text-slate-700">{app.appointmentTime || 'Scheduled Time'}</strong>
                      </span>
                    </p>

                    {app.rejectionReason && (
                      <p className="text-xs font-bold text-rose-600 mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        Reason: {app.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                        app.status === 'APPROVED' || app.status === 'WAITING' || app.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : app.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {app.status}
                    </span>

                    {/* FEATURE 2: RATE SERVICE BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        setRatingTarget({ id: app.id, name: app.departmentName || 'Academic Consultation' });
                        setRatingModalOpen(true);
                      }}
                      className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>RATE SERVICE</span>
                    </button>

                    {app.qrCodeUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedQrApp(app)}
                        className="bg-amber-400 text-slate-900 hover:bg-amber-300 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>VIEW QR</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Calendar className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Appointments Scheduled</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm">
                You haven&apos;t scheduled any department appointments yet. Click below to book an academic slot or open the consultation form.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/student/consultation"
                  className="bg-slate-900 hover:bg-black text-amber-400 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
                >
                  OPEN CONSULTATION FORM
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(true);
                    setBookingStep(1);
                  }}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
                >
                  SCHEDULE APPOINTMENT
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* APPOINTMENT SCHEDULING WIZARD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-widest">
                  STEP {bookingStep} OF 4
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Schedule Department Appointment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: CHOOSE DEPARTMENT */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Select Your School or Department</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeptId(dept.id);
                        setBookingStep(2);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedDeptId === dept.id
                          ? 'border-red-600 bg-red-50/50 ring-2 ring-red-600'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-md">
                        {dept.code}
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm mt-2">{dept.name}</h5>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: CHOOSE CONCERN & PROFESSOR */}
            {bookingStep === 2 && (
              <div className="space-y-5">
                <h4 className="font-bold text-slate-800 text-sm">
                  Concern &amp; Professor <span className="text-slate-400">({selectedDept?.name})</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                    Select Concern Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CONCERNS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setConcernType(c)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                          concernType === c
                            ? 'bg-red-700 text-white border-red-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Select Professor (Optional)
                  </label>
                  <select
                    value={selectedProfId || ''}
                    onChange={(e) => setSelectedProfId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Any Available Professor / Department Head</option>
                    {selectedDept?.professors?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!concernType) {
                        setFormError('Please select a concern type.');
                        return;
                      }
                      setFormError('');
                      setBookingStep(3);
                    }}
                    className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  >
                    Next: Date &amp; Time
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CHOOSE DATE & TIME */}
            {bookingStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Select Preferred Schedule</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Additional Notes / Details
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide details regarding your consultation request (e.g. course code, capstone group, etc.)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-red-600 resize-none text-slate-800"
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!appointmentDate || !appointmentTime) {
                        setFormError('Please choose both a date and a time.');
                        return;
                      }
                      setFormError('');
                      setBookingStep(4);
                    }}
                    className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  >
                    Review Appointment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {bookingStep === 4 && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Review &amp; Confirm</h4>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <p>
                    <span className="font-bold text-slate-500">Department:</span>{' '}
                    <span className="font-semibold text-slate-800">{selectedDept?.name}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-500">Concern:</span>{' '}
                    <span className="font-semibold text-slate-800">{concernType}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-500">Professor:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedDept?.professors?.find((p) => p.id === selectedProfId)?.name || 'Any Professor'}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-500">Date &amp; Time:</span>{' '}
                    <span className="font-semibold text-slate-800">{appointmentDate} at {appointmentTime}</span>
                  </p>
                  {notes && (
                    <p>
                      <span className="font-bold text-slate-500">Notes:</span>{' '}
                      <span className="font-semibold text-slate-800">{notes}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBookingStep(3)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleBookAppointment}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 disabled:opacity-50 transition"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Submit Appointment Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal for Approved Appointments */}
      {selectedQrApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-amber-400 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">{selectedQrApp.departmentName}</h3>
            <p className="text-xs font-semibold text-red-700 mt-0.5 mb-2">{selectedQrApp.concernType}</p>
            <div className="text-lg font-mono font-bold bg-slate-900 text-amber-300 py-1.5 px-3 rounded-lg inline-block mb-4">
              {selectedQrApp.queueNumber || selectedQrApp.appointmentNumber}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={selectedQrApp.qrCodeUrl} 
              alt="Appointment QR Code" 
              className="w-48 h-48 mx-auto border rounded-xl p-2 mb-4 bg-white" 
            />

            <button 
              type="button"
              onClick={() => setSelectedQrApp(null)} 
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        appointmentId={ratingTarget?.id}
        officeOrDeptName={ratingTarget?.name || 'Department Consultation'}
        onSuccess={loadData}
      />
    </div>
  );
}