'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Building2,
  ArrowLeft,
  Home,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  UserX,
  Loader2,
  Plus,
} from 'lucide-react';
import KioskInactivityTimer from '@/components/KioskInactivityTimer';

type Step = 'IDENTITY' | 'CATEGORY' | 'DEPT_CONCERN' | 'SERVICE_OFFICE';

interface TicketResult {
  queueNumber?: string;
  ticketCode?: string;
  message?: string;
  error?: string;
  isStudent?: boolean;
  studentNumber?: string;
  qrCodeUrl?: string;
  officeName?: string;
  isAppointment?: boolean;
}

// Structured Faculty Directory per Department
const DEPARTMENT_FACULTY: Record<string, string[]> = {
  'School of CS/IT': [
    'Prof. Arlene Santos',
    'Engr. Roberto Dela Cruz',
    'Dr. Michael Angelo Reyes',
    'Prof. Katrina Lim',
  ],
  'School of EE/ECE': [
    'Engr. Fernando Gonzales',
    'Dr. Maria Teresa Ramos',
    'Prof. Ronald Garcia',
  ],
  'School of ME': [
    'Engr. Victor Villanueva',
    'Dr. Eduardo Bautista',
    'Prof. Gabriel Mendoza',
  ],
  'Department of Mathematics': [
    'Dr. Manuel Fernandez',
    'Prof. Cristina Aquino',
    'Prof. Joseph Salazar',
  ],
};

export default function KioskServicesPage() {
  const router = useRouter();

  // Navigation State
  const [step, setStep] = useState<Step>('IDENTITY');

  // Step 1: Attendee Identity
  const [attendeeType, setAttendeeType] = useState<'STUDENT' | 'GUEST' | null>(null);
  const [studentNumber, setStudentNumber] = useState('');
  const [identityError, setIdentityError] = useState('');

  // Department State (Students Only)
  const [deptConcernType, setDeptConcernType] = useState('');
  const [deptForm, setDeptForm] = useState({
    department: 'School of CS/IT',
    instructor: 'Prof. Arlene Santos',
    subject: '',
  });

  // Service Office State (Students & Guests)
  const [selectedOffice, setSelectedOffice] = useState<string>('');

  // Result & Timers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<TicketResult | null>(null);
  const [countdown, setCountdown] = useState(10);

  // OPTION B / DONE / TIMEOUT: Clears kiosk back to initial Student vs Guest screen
  const resetToKioskStart = () => {
    setStep('IDENTITY');
    setAttendeeType(null);
    setStudentNumber('');
    setIdentityError('');
    setDeptConcernType('');
    setSelectedOffice('');
    setDeptForm({
      department: 'School of CS/IT',
      instructor: 'Prof. Arlene Santos',
      subject: '',
    });
    setTicketResult(null);
    setCountdown(10);
  };

  // OPTION A: Queues for another service with the SAME student ID
  const handleQueueAnotherService = () => {
    setTicketResult(null);
    setSelectedOffice('');
    setDeptConcernType('');
    setStep('CATEGORY');
  };

  const handleBack = () => {
    if (ticketResult) {
      setTicketResult(null);
      return;
    }
    if (step === 'DEPT_CONCERN') {
      if (deptConcernType) setDeptConcernType('');
      else setStep('CATEGORY');
      return;
    }
    if (step === 'SERVICE_OFFICE') {
      if (selectedOffice) setSelectedOffice('');
      else if (attendeeType === 'GUEST') setStep('IDENTITY');
      else setStep('CATEGORY');
      return;
    }
    if (step === 'CATEGORY') {
      setStep('IDENTITY');
      return;
    }
    router.push('/kiosk');
  };

  const handleIdentityProceed = () => {
    setIdentityError('');
    if (attendeeType === 'STUDENT') {
      if (!studentNumber.trim()) {
        setIdentityError('Please enter your Mapúa Student Number to link your queues.');
        return;
      }
      setStep('CATEGORY');
    } else if (attendeeType === 'GUEST') {
      setStep('SERVICE_OFFICE');
    }
  };

  // Countdown timer on finished ticket screen
  useEffect(() => {
    if (!ticketResult || ticketResult.error) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetToKioskStart();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [ticketResult]);

  const handleGenerateTicket = async (officeName: string, serviceTitle: string) => {
    setIsSubmitting(true);
    const isStudent = attendeeType === 'STUDENT';
    const isDept = officeName === 'Department';

    // ROUTING FIX: Office 4 is the Department Consultation Office
    let serviceOfficeId = 1;
    let serviceId = 1;

    if (isDept) {
      serviceOfficeId = 4; // Department Consultation (DEP prefix)
      serviceId = 4;
    } else if (officeName === 'Treasury') {
      serviceOfficeId = 3;
      serviceId = serviceTitle.includes('Recent') ? 6 : 5;
    } else if (officeName === 'Registrar') {
      serviceOfficeId = 2;
      serviceId = serviceTitle.includes('Transferee') ? 4 : 3;
    } else if (officeName === 'Admission') {
      serviceOfficeId = 1;
      serviceId = serviceTitle.includes('Modality') ? 2 : 1;
    }

    const identifier = isStudent ? studentNumber.trim() : `guest-walkin-${Date.now()}`;

    try {
      const res = await fetch('/api/kiosk/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceOfficeId,
          serviceId,
          category: isDept ? 'DEPARTMENT' : 'SERVICE_OFFICE',
          studentIdentifier: identifier,
          studentName: isStudent ? `Student (${identifier})` : 'Guest Visitor',
          details: serviceTitle,
          instructor: isDept ? deptForm.instructor : undefined,
          department: isDept ? deptForm.department : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTicketResult({ error: data.error || 'Failed to issue queue ticket.' });
        return;
      }

      setTicketResult({
        queueNumber: data.ticket?.queueNumber || data.ticket?.ticketCode,
        ticketCode: data.ticket?.ticketCode,
        message: isDept 
          ? `Your consultation with ${deptForm.instructor} has been scheduled.` 
          : `Your spot for ${officeName} has been booked.`,
        isStudent,
        isAppointment: isDept,
        studentNumber: isStudent ? identifier : undefined,
        officeName: isDept ? `${deptForm.department} Consultation` : officeName,
        qrCodeUrl:
          data.ticket?.qrCodeUrl ||
          `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data.ticket?.ticketCode}`,
      });
    } catch (err) {
      setTicketResult({ error: 'Network error generating ticket.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-6 sm:p-10 select-none font-sans">
      <KioskInactivityTimer inactivityLimitSeconds={45} />

      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-200 pb-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center space-x-3.5">
          <button
            type="button"
            onClick={handleBack}
            className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center space-x-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back</span>
          </button>
          <div>
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider bg-red-50 px-2.5 py-0.5 rounded-md">
              CAMPUS KIOSK
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
              {ticketResult
                ? ticketResult.isAppointment ? 'Appointment Scheduled' : 'Queue Ticket Issued'
                : step === 'IDENTITY'
                ? 'Welcome to Mapúa Kiosk'
                : step === 'CATEGORY'
                ? 'Select Consultation Category'
                : step === 'DEPT_CONCERN'
                ? 'Department Consultation'
                : 'Campus Service Desks'}
            </h1>
          </div>
        </div>

        <Link
          href="/kiosk"
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl flex items-center space-x-1.5 text-sm font-semibold shadow-xs transition"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        {/* TICKET CONFIRMATION VIEW */}
        {ticketResult && (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg animate-in fade-in zoom-in-95 duration-150">
            {ticketResult.error ? (
              <div className="space-y-4">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
                <h2 className="text-xl font-bold text-red-600">{ticketResult.error}</h2>
                <button
                  type="button"
                  onClick={resetToKioskStart}
                  className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition"
                >
                  Return to Start
                </button>
              </div>
            ) : ticketResult.isStudent ? (
              /* STUDENT TICKET COMPLETION */
              <div className="space-y-5">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
                    Saved to Student ID: {ticketResult.studentNumber}
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
                    {ticketResult.isAppointment ? 'Appointment Confirmed!' : 'Ticket Confirmed!'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {ticketResult.isAppointment
                      ? 'Saved as an appointment under your student profile.'
                      : 'This queue is saved to your profile. Check your phone to monitor your turn live.'}
                  </p>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-inner">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                    {ticketResult.isAppointment ? 'APPOINTMENT NUMBER' : 'QUEUE TICKET NUMBER'}
                  </span>
                  <div className="text-5xl font-black font-mono text-amber-400">
                    {ticketResult.queueNumber}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ticketResult.officeName}</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {/* OPTION A: QUEUE FOR ANOTHER SERVICE */}
                  <button
                    type="button"
                    onClick={handleQueueAnotherService}
                    className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Option A: Queue for Another Service</span>
                  </button>

                  {/* OPTION B: DONE */}
                  <button
                    type="button"
                    onClick={resetToKioskStart}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Option B: Done ({countdown}s)
                  </button>

                  <p className="text-[11px] text-slate-400">
                    Terminal automatically clears for the next person in line.
                  </p>
                </div>
              </div>
            ) : (
              /* GUEST TICKET COMPLETION */
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                    Guest Walk-In Pass
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Take Your Ticket</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Take a photo of this QR pass on your phone to track your turn.
                  </p>
                </div>

                <div className="text-5xl font-black font-mono text-red-700">
                  {ticketResult.queueNumber}
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ticketResult.qrCodeUrl}
                    alt="Queue QR"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <button
                  type="button"
                  onClick={resetToKioskStart}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
                >
                  Done / Reset ({countdown}s)
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: STUDENT VS GUEST SELECTION */}
        {!ticketResult && step === 'IDENTITY' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="text-center mb-8">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Kiosk Self-Service Entry
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                Choose Visitor Type
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div
                onClick={() => setAttendeeType('STUDENT')}
                className={`cursor-pointer p-7 rounded-3xl border-2 transition-all flex flex-col justify-between h-64 ${
                  attendeeType === 'STUDENT'
                    ? 'border-red-700 bg-red-50/40 ring-4 ring-red-100 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center justify-between">
                    <span>Mapúa Student</span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Queue for department consultations or services. Multiple inquiries will sync to your online profile.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  setAttendeeType('GUEST');
                  setStudentNumber('');
                  setIdentityError('');
                }}
                className={`cursor-pointer p-7 rounded-3xl border-2 transition-all flex flex-col justify-between h-64 ${
                  attendeeType === 'GUEST'
                    ? 'border-slate-900 bg-slate-50 ring-4 ring-slate-200 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <UserX className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center justify-between">
                    <span>Guest / Walk-In</span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Walk-in visitors and transferees. Restricted to academic service desks with instant QR code slips.
                  </p>
                </div>
              </div>
            </div>

            {/* Student ID Input (REQUIRED) */}
            {attendeeType === 'STUDENT' && (
              <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Type Your Student Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2023123456"
                  value={studentNumber}
                  onChange={(e) => {
                    setStudentNumber(e.target.value);
                    if (identityError) setIdentityError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-slate-900 font-semibold"
                />
                {identityError && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5">{identityError}</p>
                )}
              </div>
            )}

            {attendeeType && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleIdentityProceed}
                  className="w-full sm:w-auto px-8 py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>
                    {attendeeType === 'GUEST' ? 'Proceed to Academic Services' : 'Continue to Categories'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CATEGORY SELECTION (STUDENTS ONLY) */}
        {!ticketResult && step === 'CATEGORY' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-slate-100 px-4 py-2.5 rounded-xl text-xs text-slate-600">
              <span>
                Student ID: <strong className="text-slate-900">{studentNumber}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep('IDENTITY')}
                className="text-red-700 font-bold hover:underline"
              >
                Change ID
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => setStep('DEPT_CONCERN')}
                className="bg-white hover:bg-slate-50 border border-slate-200 p-7 rounded-2xl shadow-xs text-left flex flex-col justify-between h-56 transition group hover:border-red-600"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-700 flex items-center justify-between">
                    <span>Department Concern</span>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Academic advising, grade consultations, thesis topics, and shifting reviews.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep('SERVICE_OFFICE')}
                className="bg-white hover:bg-slate-50 border border-slate-200 p-7 rounded-2xl shadow-xs text-left flex flex-col justify-between h-56 transition group hover:border-red-600"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-700 flex items-center justify-between">
                    <span>Service Office</span>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Admissions, Registrar document requests, and Treasury tuition payments.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3A: DEPARTMENT CONCERN (APPOINTMENT ROUTED) */}
        {!ticketResult && step === 'DEPT_CONCERN' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs animate-in fade-in duration-200">
            {!deptConcernType ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Select Department Concern:</h3>
                <div className="space-y-2.5">
                  {['Academic Concern', 'Grade Consultation', 'Shifting of Program'].map((concern) => (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => setDeptConcernType(concern)}
                      className="w-full p-4 border border-slate-200 rounded-2xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{concern}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
                    {deptConcernType}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">Consultation Details</h3>
                </div>

                {/* 1. School / Department Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Choose School / Department
                  </label>
                  <select
                    className="w-full border-2 border-slate-200 p-3 rounded-2xl text-xs bg-slate-50 text-slate-900 font-bold focus:outline-none focus:border-red-700"
                    value={deptForm.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setDeptForm({
                        ...deptForm,
                        department: newDept,
                        instructor: DEPARTMENT_FACULTY[newDept]?.[0] || '',
                      });
                    }}
                  >
                    {Object.keys(DEPARTMENT_FACULTY).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Touch-to-Select Instructor (Radio Cards) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    2. Select Instructor / Adviser <span className="text-red-600">*</span>
                  </label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {DEPARTMENT_FACULTY[deptForm.department]?.map((teacher) => {
                      const isSelected = deptForm.instructor === teacher;
                      return (
                        <div
                          key={teacher}
                          onClick={() => setDeptForm({ ...deptForm, instructor: teacher })}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-red-700 bg-red-50/70 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'border-red-700 bg-red-700' : 'border-slate-400 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-bold text-slate-900">{teacher}</span>
                          </div>
                          <UserCheck className={`w-4 h-4 ${isSelected ? 'text-red-700' : 'text-slate-300'}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Optional Subject Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Subject Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS101"
                    className="w-full border-2 border-slate-200 p-3 rounded-2xl text-xs bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-red-700"
                    value={deptForm.subject}
                    onChange={(e) => setDeptForm({ ...deptForm, subject: e.target.value })}
                  />
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  disabled={isSubmitting || !deptForm.instructor}
                  onClick={() =>
                    handleGenerateTicket(
                      'Department',
                      `${deptConcernType} - ${deptForm.instructor} (${deptForm.department}${deptForm.subject ? ' - ' + deptForm.subject : ''})`
                    )
                  }
                  className="w-full mt-4 py-4 bg-red-700 hover:bg-red-800 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm &amp; Join Queue</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3B: SERVICE OFFICES (STUDENTS & GUESTS) */}
        {!ticketResult && step === 'SERVICE_OFFICE' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs animate-in fade-in duration-200">
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
                {attendeeType === 'GUEST' ? 'Academic Services (Guest)' : `Student ID: ${studentNumber}`}
              </span>
            </div>

            {!selectedOffice ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Select Academic Desk:</h3>
                <div className="space-y-2.5">
                  {[
                    { name: 'Admission', desc: 'Application concerns, schedule adjustments, shift modality' },
                    { name: 'Registrar', desc: 'Processing of requirements (First year, Continuing, Transferees)' },
                    { name: 'Treasury', desc: 'Tuition payment & recent transaction inquiries' },
                  ].map((office) => (
                    <button
                      key={office.name}
                      type="button"
                      onClick={() => setSelectedOffice(office.name)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{office.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{office.desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedOffice === 'Admission' ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Admission Desks</h3>
                <div className="space-y-2.5">
                  {['Schedule Adjustment', 'Shift Modality', 'General Admission Inquiry'].map((service) => (
                    <button
                      key={service}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleGenerateTicket('Admission', service)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{service}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedOffice === 'Registrar' ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Registrar Desks</h3>
                <div className="space-y-2.5">
                  {['First Year Credentials', 'Continuing Students Requirements', 'Transferee Records Evaluation'].map((service) => (
                    <button
                      key={service}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleGenerateTicket('Registrar', service)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{service}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Treasury Desks</h3>
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleGenerateTicket('Treasury', 'Tuition Payment')}
                    className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                  >
                    <span>Tuition Payment (Downpayment, Full Payment)</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleGenerateTicket('Treasury', 'Recent Transactions')}
                    className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                  >
                    <span>Recent Transactions &amp; Receipts</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 pt-6 border-t border-slate-200 max-w-5xl mx-auto w-full">
        Mapúa University &bull; Q-Less Touchscreen Kiosk
      </footer>
    </div>
  );
}