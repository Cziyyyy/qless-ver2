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
  Plus
} from 'lucide-react';
import Navbar from '@/components/Navbar';

type FlowCategory = 'ROOT' | 'DEPT_CONCERN' | 'SERVICE_OFFICE';

export default function StudentQueueRegistrationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<FlowCategory>('ROOT');
  const [deptConcernType, setDeptConcernType] = useState('');
  const [deptForm, setDeptForm] = useState({
    department: 'School of CS/IT',
    subject: '',
    teacher: '',
  });

  const [selectedOffice, setSelectedOffice] = useState('');

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

  const handleCreateOnlineTicket = async (
    officeName: string,
    concernName: string,
    officeId: number,
    serviceId: number
  ) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/kiosk/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceOfficeId: officeId,
          serviceId,
          studentIdentifier: user.studentNumber || user.email,
          studentName: user.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ALWAYS REDIRECTS ONLINE STUDENT TO MY QUEUE DASHBOARD
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
                    else if (deptConcernType) setDeptConcernType('');
                    else setCategory('ROOT');
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
                Online Portal Registration
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
              {category === 'ROOT'
                ? 'Join an Online Queue'
                : category === 'DEPT_CONCERN'
                ? 'Department Advising'
                : 'Campus Service Desks'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Logged in as <strong className="text-slate-800">{user?.name}</strong> ({user?.studentNumber || user?.email}).
            </p>
          </div>

          <Link
            href="/student/queue"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-50 transition"
          >
            <span>Back to My Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ROOT CATEGORY */}
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

        {/* DEPARTMENT */}
        {category === 'DEPT_CONCERN' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
            {!deptConcernType ? (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Select Topic:</h3>
                <div className="space-y-2.5">
                  {['Academic Concern', 'Grade Consultation', 'Shifting of Program'].map((concern) => (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => setDeptConcernType(concern)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{concern}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">{deptConcernType} Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
                  <select
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 text-slate-800 font-medium"
                    value={deptForm.department}
                    onChange={(e) => setDeptForm({ ...deptForm, department: e.target.value })}
                  >
                    <option value="School of CS/IT">School of CS/IT</option>
                    <option value="School of EE/ECE">School of EE/ECE</option>
                    <option value="School of ME">School of ME</option>
                    <option value="Department of Mathematics">Department of Mathematics</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. CS102"
                      value={deptForm.subject}
                      onChange={(e) => setDeptForm({ ...deptForm, subject: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor</label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Cruz"
                      value={deptForm.teacher}
                      onChange={(e) => setDeptForm({ ...deptForm, teacher: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCreateOnlineTicket('Department', deptConcernType, 1, 1)}
                  className="w-full mt-4 py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm &amp; Join Line</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SERVICE OFFICES */}
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
                    onClick={() => handleCreateOnlineTicket('Treasury', 'Tuition Payment', 3, 5)}
                    className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                  >
                    <span>Tuition Payment (Downpayment, Full Payment)</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCreateOnlineTicket('Treasury', 'Recent Transactions', 3, 6)}
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
                    { title: 'Credentials Submission & Validation', id: 3 },
                    { title: 'Transferee Records Evaluation', id: 4 },
                  ].map((srv) => (
                    <button
                      key={srv.title}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleCreateOnlineTicket('Registrar', srv.title, 2, srv.id)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{srv.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Admissions Inquiries</h3>
                <div className="space-y-2.5">
                  {[
                    { title: 'Schedule Adjustment', id: 1 },
                    { title: 'Shift Modality', id: 2 },
                  ].map((srv) => (
                    <button
                      key={srv.title}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleCreateOnlineTicket('Admission', srv.title, 1, srv.id)}
                      className="w-full p-4 border border-slate-200 rounded-xl text-left font-semibold text-slate-800 hover:bg-slate-50 hover:border-red-600 flex justify-between items-center transition text-sm"
                    >
                      <span>{srv.title}</span>
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