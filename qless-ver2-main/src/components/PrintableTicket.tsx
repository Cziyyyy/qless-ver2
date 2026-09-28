'use client';

interface TicketData {
  queueNumber: string;
  serviceOfficeName: string;
  serviceName: string;
  ticketCode: string;
  queueDate: string;
  status: string;
  qrCodeUrl?: string;
  estimatedWaitMinutes?: number;
  peopleAhead?: number;
}

export default function PrintableTicket({ ticket }: { ticket: TicketData }) {
  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div id="printable-ticket" className="hidden print:block text-black bg-white p-4 font-mono text-center max-w-[80mm] mx-auto border border-dashed border-gray-400">
      <div className="border-b-2 border-black pb-2 mb-2">
        <h1 className="text-xl font-black uppercase tracking-wider">Q-LESS MAPÚA</h1>
        <p className="text-xs font-semibold">Digital Queueing System</p>
      </div>

      <div className="my-3">
        <p className="text-xs uppercase font-bold text-gray-600">Queue Number</p>
        <p className="text-4xl font-black my-1 border-2 border-black py-1 px-2 inline-block rounded">
          {ticket.queueNumber}
        </p>
      </div>

      <div className="text-left text-xs space-y-1 border-y border-black py-2 my-2">
        <p><span className="font-bold">Office:</span> {ticket.serviceOfficeName}</p>
        <p><span className="font-bold">Service:</span> {ticket.serviceName}</p>
        <p><span className="font-bold">Date:</span> {ticket.queueDate}</p>
        <p><span className="font-bold">Time:</span> {formattedTime}</p>
        <p><span className="font-bold">Status:</span> {ticket.status}</p>
        {ticket.peopleAhead !== undefined && (
          <p><span className="font-bold">Ahead:</span> {ticket.peopleAhead} student(s)</p>
        )}
      </div>

      {ticket.qrCodeUrl && (
        <div className="my-3 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ticket.qrCodeUrl} alt="Queue QR Code" className="w-28 h-28 mx-auto" />
          <p className="text-[10px] tracking-widest font-mono mt-1">{ticket.ticketCode}</p>
        </div>
      )}

      <div className="border-t border-black pt-2 mt-2 text-[10px]">
        <p>Please monitor the queue status display screen or your web dashboard.</p>
        <p className="font-bold mt-1">Thank you for queueing with Q-Less Mapúa!</p>
      </div>
    </div>
  );
}
