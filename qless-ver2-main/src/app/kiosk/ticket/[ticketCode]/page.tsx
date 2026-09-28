'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Printer, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import KioskInactivityTimer from '@/components/KioskInactivityTimer';

export default function KioskTicketConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const ticketCode = (params?.ticketCode as string) || '';
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const res = await fetch(`/api/kiosk/status?code=${encodeURIComponent(ticketCode)}`);
        if (res.ok) {
          const data = await res.json();
          setTicket(data.ticket || data.ticketInfo || null);
        }
      } catch (err) {
        console.error('Error fetching ticket confirmation:', err);
      } finally {
        setLoading(false);
      }
    };

    if (ticketCode) fetchTicketDetails();
    else setLoading(false);
  }, [ticketCode]);

  const handlePrint = () => {
    window.print();
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketCode)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-10 font-sans">
      <KioskInactivityTimer />

      <main className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center items-center">
        <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-10 w-full text-center border-4 border-amber-400 shadow-2xl relative overflow-hidden">
          
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            TICKET GENERATED SUCCESSFUL
          </h1>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Mapúa Digital Queue Pass
          </p>

          <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-inner">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block mb-1">
              YOUR QUEUE NUMBER
            </span>
            <div className="text-6xl font-black text-amber-400 font-mono tracking-tight my-2">
              {ticket?.queueNumber || ticketCode || 'A-001'}
            </div>
            <span className="text-xs font-mono text-slate-400">
              Ref Code: {ticketCode}
            </span>
          </div>

          {/* Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-1.5 mb-6 text-left">
            <p><span className="text-slate-500 font-semibold">Service Desk:</span> <strong>{ticket?.serviceOfficeName || 'Campus Service Counter'}</strong></p>
            <p><span className="text-slate-500 font-semibold">Service:</span> <strong>{ticket?.serviceName || 'General Service Inquiry'}</strong></p>
            {ticket?.studentIdentifier && (
              <p><span className="text-slate-500 font-semibold">Student ID:</span> <strong className="font-mono">{ticket.studentIdentifier}</strong></p>
            )}
          </div>

          {/* QR Code */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Ticket QR"
            className="w-44 h-44 mx-auto border border-slate-200 rounded-2xl p-2 mb-6 bg-white"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-slate-900 hover:bg-black text-amber-400 font-bold text-xs py-4 rounded-2xl transition flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT PHYSICAL TICKET</span>
            </button>

            <Link
              href="/kiosk"
              className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-4 rounded-2xl transition flex items-center justify-center space-x-2 shadow"
            >
              <span>DONE &amp; RETURN HOME</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500">
        Mapúa University Q-Less Kiosk System
      </footer>
    </div>
  );
}