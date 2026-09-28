'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Home, ChevronRight, CheckCircle2, AlertCircle, Loader2, UserCheck, ShieldAlert
} from 'lucide-react';
import KioskInactivityTimer from '@/components/KioskInactivityTimer';

interface SubService {
  id: number;
  name: string;
  estimatedMinutes: number;
}

interface MainService {
  id: number;
  name: string;
  estimatedMinutes: number;
  subServices: SubService[];
}

interface ServiceOfficeData {
  id: number;
  name: string;
  prefix: string;
  description: string;
  services: MainService[];
}

export default function KioskServiceSelectPage() {
  const router = useRouter();
  const params = useParams();
  const officeId = params.officeId as string;

  const [office, setOffice] = useState<ServiceOfficeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Service state
  const [selectedMainService, setSelectedMainService] = useState<MainService | null>(null);
  const [selectedSubService, setSelectedSubService] = useState<SubService | null>(null);

  // Flow step inside this page: 'SERVICE_SELECT' -> 'IDENTIFY' -> 'CONFIRM'
  const [flowStep, setFlowStep] = useState<'SERVICE_SELECT' | 'IDENTIFY' | 'CONFIRM'>('SERVICE_SELECT');

  // Student Identification Inputs
  const [studentIdInput, setStudentIdInput] = useState('');
  const [idError, setIdError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadOfficeServices() {
      try {
        const res = await fetch('/api/kiosk/services');
        const data = await res.json();
        if (data.offices) {
          const target = data.offices.find((o: any) => String(o.id) === String(officeId));
          if (target) {
            setOffice(target);
          } else {
            setError('Service office not found.');
          }
        }
      } catch (err) {
        setError('Failed to fetch services.');
      } finally {
        setLoading(false);
      }
    }
    loadOfficeServices();
  }, [officeId]);

  const handleMainServiceClick = (main: MainService) => {
    setSelectedMainService(main);
    if (main.subServices && main.subServices.length > 0) {
      setSelectedSubService(null);
    } else {
      setSelectedSubService(null);
      setFlowStep('IDENTIFY');
    }
  };

  const handleSubServiceClick = (sub: SubService) => {
    setSelectedSubService(sub);
    setFlowStep('IDENTIFY');
  };

  const handleIdentifyNext = () => {
    const input = studentIdInput.trim();
    if (!input) {
      setIdError('Please enter your Mapúa Email or Student Number.');
      return;
    }
    setIdError('');
    setFlowStep('CONFIRM');
  };

  const handleGenerateTicket = async () => {
    setIsSubmitting(true);
    setIdError('');
    try {
      const activeServiceId = selectedSubService ? selectedSubService.id : selectedMainService?.id;

      const res = await fetch('/api/kiosk/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceOfficeId: office?.id,
          serviceId: activeServiceId,
          studentIdentifier: studentIdInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIdError(data.error || 'Failed to generate queue ticket.');
        if (data.error?.includes('already have an active queue ticket')) {
          setFlowStep('IDENTIFY');
        }
        return;
      }

      sessionStorage.setItem('kiosk_ticket_result', JSON.stringify(data.ticket));
      router.push(`/kiosk/ticket/${data.ticket.ticketCode}`);
    } catch (err) {
      setIdError('Server communication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  const selectedServiceName = selectedSubService
    ? `${selectedMainService?.name} - ${selectedSubService.name}`
    : selectedMainService?.name || '';

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between p-6 sm:p-10 select-none">
      <KioskInactivityTimer inactivityLimitSeconds={45} />

      {/* Header */}
      <header className="flex justify-between items-center border-b border-gray-100 pb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (flowStep === 'CONFIRM') setFlowStep('IDENTIFY');
              else if (flowStep === 'IDENTIFY') setFlowStep('SERVICE_SELECT');
              else router.push('/kiosk/services');
            }}
            className="kiosk-touch-target kiosk-btn bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 flex items-center space-x-1.5 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span>Back</span>
          </button>
          <div>
            <span className="text-[11px] font-semibold text-brand-accent uppercase tracking-wider bg-brand-accent/10 px-2.5 py-0.5 rounded-md">
              {flowStep === 'SERVICE_SELECT' && 'STEP 2 OF 3'}
              {flowStep === 'IDENTIFY' && 'STEP 3 OF 3'}
              {flowStep === 'CONFIRM' && 'FINAL CONFIRMATION'}
            </span>
            <h1 className="text-2xl font-semibold text-gray-900 mt-0.5">
              {office?.name || 'Service Office'}
            </h1>
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

      {/* Main Flow Steps */}
      <main className="max-w-content mx-auto w-full my-auto py-8">
        {/* STEP A: SERVICE SELECT */}
        {flowStep === 'SERVICE_SELECT' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-1">
                Select your required service
              </h2>
              <p className="text-sm text-gray-500">
                Choose the transaction type for {office?.name}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {office?.services && office.services.map((main) => {
                const isSelected = selectedMainService?.id === main.id;
                return (
                  <div key={main.id} className="space-y-2">
                    <button
                      onClick={() => handleMainServiceClick(main)}
                      className={`w-full kiosk-touch-target text-left p-6 rounded-2xl border transition-all flex items-center justify-between shadow-subtle ${
                        isSelected
                          ? 'bg-red-50/50 border-brand-accent'
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{main.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Est. wait: ~{main.estimatedMinutes} mins</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-brand-accent" />
                    </button>

                    {/* Sub-services list if main service has options */}
                    {isSelected && main.subServices && main.subServices.length > 0 && (
                      <div className="pl-4 space-y-2 pt-2 border-l-2 border-brand-accent">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Select Specific Requirement:
                        </p>
                        {main.subServices.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubServiceClick(sub)}
                            className="w-full text-left p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 flex justify-between items-center"
                          >
                            <span>{sub.name}</span>
                            <ChevronRight className="w-4 h-4 text-brand-accent" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP B: IDENTIFY */}
        {flowStep === 'IDENTIFY' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-50 text-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-100">
                <UserCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Student Identification</h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your Mapúa Email or Student ID for queue ticket assignment
              </p>
            </div>

            {idError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{idError}</span>
              </div>
            )}

            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase">
                  Mapúa Email or Student Number
                </label>
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="e.g. 2026109823 or studentdemo@mymail.mapua.edu.ph"
                  className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleIdentifyNext}
                  className="w-full bg-brand-accent hover:bg-brand-accent-dark text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-subtle flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Confirmation</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500">
              Demo input: <span className="font-mono text-gray-700 font-medium">studentdemo@mymail.mapua.edu.ph</span>
            </div>
          </div>
        )}

        {/* STEP C: CONFIRM */}
        {flowStep === 'CONFIRM' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Confirm Queue Ticket</h2>
              <p className="text-xs text-gray-500 mt-1">Review details before issuing your queue ticket</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-3 text-sm text-gray-900">
              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="text-xs text-gray-500 font-medium">Service Office:</span>
                <span className="font-semibold text-gray-900">{office?.name}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="text-xs text-gray-500 font-medium">Selected Service:</span>
                <span className="font-semibold text-brand-accent">{selectedServiceName}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="text-xs text-gray-500 font-medium">Student ID / Email:</span>
                <span className="font-mono font-medium text-gray-900">{studentIdInput}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-xs text-gray-500 font-medium">Estimated Wait:</span>
                <span className="font-semibold text-gray-900">~{selectedMainService?.estimatedMinutes} mins</span>
              </div>
            </div>

            <button
              onClick={handleGenerateTicket}
              disabled={isSubmitting}
              className="w-full bg-brand-accent hover:bg-brand-accent-dark text-white font-semibold text-base py-4 px-6 rounded-xl transition-all shadow-subtle flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Queue Ticket...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>PRINT &amp; GENERATE TICKET</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400">
        Mapúa Q-Less Touchscreen Kiosk
      </footer>
    </div>
  );
}
