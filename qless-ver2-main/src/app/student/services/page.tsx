'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  ArrowLeft,
  ChevronRight,
  Loader2,
  UserCheck,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

type FlowCategory = 'ROOT' | 'DEPT_CONCERN' | 'SERVICE_OFFICE';

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

// Dynamic mapping of concerns to database office/service IDs
const SERVICE_ROUTING_MAP: Record<
  string,
  { officeId: number; serviceId: number; officeName: string }
> = {
  // Department Consultations -> Office 4 (DEP), Service 7
  'Academic Concern': { officeId: 4, serviceId: 7, officeName: 'Department' },
  'Grade Consultation': { officeId: 4, serviceId: 7, officeName: 'Department' },
  'Shifting of Program': { officeId: 4, serviceId: 7, officeName: 'Department' },

  // Admissions -> Office 1 (A)
  'Schedule Adjustment': { officeId: 1, serviceId: 2, officeName: 'Admissions' },
  'Shift Modality': { officeId: 1, serviceId: 2, officeName: 'Admissions' },
  'General Admission Inquiry': { officeId: 1, serviceId: 1, officeName: 'Admissions' },

  // Registrar -> Office 2 (R)
  'Credentials Submission & Validation': { officeId: 2, serviceId: 3, officeName: 'Registrar' },
  'Transferee Records Evaluation': { officeId: 2, serviceId: 4, officeName: 'Registrar' },

  // Treasury -> Office 3 (T)
  'Tuition Payment': { officeId: 3, serviceId: 5, officeName: 'Treasury' },
  'Recent Transactions': { officeId: 3, serviceId: 6, officeName: 'Treasury' },
};

export default function StudentOnlineServicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<FlowCategory>('ROOT');
  const [deptConcernType, setDeptConcernType] = useState('Academic Concern');

  const [selectedDept, setSelectedDept] = useState('School of CS/IT');
  const [selectedInstructor, setSelectedInstructor] = useState(
    DEPARTMENT_FACULTY['School of CS/IT'][0]
  );
  const [subjectCode, setSubjectCode] = useState('');

  const [selectedOffice, setSelectedOffice] = useState('');

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    if (DEPARTMENT_FACULTY[dept] && DEPARTMENT_FACULTY[dept].length > 0) {
      setSelectedInstructor(DEPARTMENT_FACULTY[dept][0]);
    } else {
      setSelectedInstructor('');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/student/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        router.push('/student/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleCreateOnlineTicket = async (concernTitle: string, extraNote?: string) => {
    if (!user) return;
    setSubmitting(true);

    const route = SERVICE_ROUTING_MAP[concernTitle] || {
      officeId: 1,
      serviceId: 1,
      officeName: 'Admissions',
    };

    try {
      const res = await fetch('/api/kiosk/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceOfficeId: route.officeId,
          serviceId: route.serviceId,
          studentIdentifier: user.studentNumber || user.email,
          studentName: user.name,
          details: extraNote || concernTitle,
          instructor: route.officeId === 4 ? selectedInstructor : null,
          department: route.officeId === 4 ? selectedDept : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/student/queue?refresh=${Date.now()}`);
      } else {
        alert(data.error || 'Failed to create queue ticket.');
      }
    } catch (err) {
      alert('Network error while creating ticket.');
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              {category !== 'ROOT' && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedOffice) setSelectedOffice('');
                    else setCategory('ROOT');
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
                Online Queue Registration
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
              {category === 'ROOT'
                ? 'Join a Queue'
                : category === 'DEPT_CONCERN'
                ? 'Department Consultation'
                : 'Campus Service Desks'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Logged in: <strong className="text-slate-800">{user?.name}</strong> (Student No: {user?.studentNumber || user?.email})
            </p>
          </div>

          <Link
            href="/student/queue"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-50 transition"
          >
            <span>View Active Queues</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 1. ROOT CATEGORY */}
        {category === 'ROOT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => setCategory('DEPT_CONCERN')}
              className="bg-white hover:bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-xs cursor-pointer transition flex flex-col justify-between h-64 group hover:border-red-600"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-700 flex items-center justify-between">
                  <span>Department Concern</span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Academic advising, grade consultations, thesis defense, or program shifting evaluations.
                </p>
              </div>
            </div>

            <div
              onClick={() => setCategory('SERVICE_OFFICE')}
              className="bg-white hover:bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-xs cursor-pointer transition flex flex-col justify-between h-64 group hover:border-red-600"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-700 flex items-center justify-between">
                  <span>Service Office</span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Admission schedule adjustment, Registrar document processing, and Treasury tuition payments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. DEPARTMENT CONCERN */}
        {category === 'DEPT_CONCERN' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xs animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Department Consultation</h3>
            <p className="text-xs text-slate-500 mb-6">
              Select your consultation topic, department, and teacher.
            </p>

            {/* Step A: Select Topic */}
            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Consultation Topic <span className="text-red-600">*</span>
              </label>

              {[
                { id: 'academic', title: 'Academic Concern', desc: 'Curriculum advising, prerequisite waivers, syllabus inquiries' },
                { id: 'grades', title: 'Grade Consultation', desc: 'Grade disputes, completion of INC, score breakdowns' },
                { id: 'shifting', title: 'Shifting of Program', desc: 'Credited units review, curriculum transition, dean approval' },
              ].map((item) => {
                const isSelected = deptConcernType === item.title;
                return (
                  <div
                    key={item.id}
                    onClick={() => setDeptConcernType(item.title)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-700 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'border-red-700 bg-red-700' : 'border-slate-400 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1">
                      <span className="block text-sm font-bold text-slate-900">
                        {item.title}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step B: Department & Instructor */}
            <div className="space-y-6 pt-5 border-t border-slate-100 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  2. Select School / Department <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.keys(DEPARTMENT_FACULTY).map((dept) => {
                    const isDeptSelected = selectedDept === dept;
                    return (
                      <div
                        key={dept}
                        onClick={() => handleDeptChange(dept)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isDeptSelected
                            ? 'border-red-700 bg-red-50/60'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isDeptSelected ? 'border-red-700 bg-red-700' : 'border-slate-400 bg-white'
                          }`}
                        >
                          {isDeptSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{dept}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  3. Select Instructor / Adviser <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {DEPARTMENT_FACULTY[selectedDept]?.map((teacher) => {
                    const isTeacherSelected = selectedInstructor === teacher;
                    return (
                      <div
                        key={teacher}
                        onClick={() => setSelectedInstructor(teacher)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isTeacherSelected
                            ? 'border-red-700 bg-red-50/60 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isTeacherSelected ? 'border-red-700 bg-red-700' : 'border-slate-400 bg-white'
                            }`}
                          >
                            {isTeacherSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{teacher}</span>
                        </div>
                        <UserCheck className={`w-4 h-4 ${isTeacherSelected ? 'text-red-700' : 'text-slate-300'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Subject Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS102"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <button
                type="button"
                disabled={submitting || !selectedInstructor}
                onClick={() =>
                  handleCreateOnlineTicket(
                    deptConcernType,
                    `${deptConcernType} with ${selectedInstructor} (${selectedDept}${subjectCode ? ' - ' + subjectCode : ''})`
                  )
                }
                className="w-full mt-4 py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirm &amp; Join Line</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 3. SERVICE OFFICES */}
        {category === 'SERVICE_OFFICE' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
            {!selectedOffice ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Select Service Office:</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Admission', desc: 'Schedule adjustment, shift modality, general inquiry' },
                    { name: 'Registrar', desc: 'Certificates, grades, transcripts, transferee evaluation' },
                    { name: 'Treasury', desc: 'Tuition payments, balance settling, official receipts' },
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
            ) : selectedOffice === 'Treasury' ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Treasury Inquiries</h3>
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCreateOnlineTicket('Tuition Payment')}
                    className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                  >
                    <span>Tuition Payment (Downpayment, Full Payment)</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCreateOnlineTicket('Recent Transactions')}
                    className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                  >
                    <span>Recent Transactions &amp; Receipts</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ) : selectedOffice === 'Registrar' ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Registrar Inquiries</h3>
                <div className="space-y-2.5">
                  {[
                    'Credentials Submission & Validation',
                    'Transferee Records Evaluation',
                  ].map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleCreateOnlineTicket(srv)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{srv}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Admissions Inquiries</h3>
                <div className="space-y-2.5">
                  {['Schedule Adjustment', 'Shift Modality', 'General Admission Inquiry'].map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleCreateOnlineTicket(srv)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{srv}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}