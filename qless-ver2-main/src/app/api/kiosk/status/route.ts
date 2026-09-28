import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateQRCodeDataURL } from '@/lib/qrcode';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || searchParams.get('ticketNumber') || searchParams.get('ticket_number');

    if (!code) {
      return NextResponse.json(
        { error: 'Queue ticket number or code is required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Look up ticket by queue_number or ticket_code
    const tickets = await query<any[]>(
      `SELECT t.*, 
              s.name AS service_name,
              so.name AS office_name,
              so.prefix AS office_prefix
       FROM queue_tickets t
       LEFT JOIN services s ON t.service_id = s.id
       LEFT JOIN service_offices so ON t.service_office_id = so.id
       WHERE UPPER(TRIM(t.queue_number)) = ? OR UPPER(TRIM(t.ticket_code)) = ?
       ORDER BY t.id DESC 
       LIMIT 1`,
      [cleanCode, cleanCode]
    );

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Queue ticket not found. Please verify your queue number.' },
        { status: 404 }
      );
    }

    const ticketRow = tickets[0];

    // 2. Count tickets ahead in queue if WAITING
    let aheadCount = 0;
    if (ticketRow.status === 'WAITING') {
      const aheadRows = await query<any[]>(
        `SELECT COUNT(*) AS count
         FROM queue_tickets
         WHERE service_office_id = ?
           AND status = 'WAITING'
           AND id < ?`,
        [ticketRow.service_office_id, ticketRow.id]
      );
      aheadCount = aheadRows[0]?.count || 0;
    }

    // 3. Find current ticket being called/served at this office
    const servingRows = await query<any[]>(
      `SELECT queue_number 
       FROM queue_tickets
       WHERE service_office_id = ? 
         AND status IN ('CALLED', 'SERVING')
       ORDER BY id DESC 
       LIMIT 1`,
      [ticketRow.service_office_id]
    );
    const currentlyServing = servingRows.length > 0 ? servingRows[0].queue_number : 'None';

    const estimatedWaitMinutes = aheadCount * 5;

    // 4. Generate QR code safely
    let qrCodeUrl = '';
    try {
      if (typeof generateQRCodeDataURL === 'function') {
        qrCodeUrl = await generateQRCodeDataURL(ticketRow.ticket_code || ticketRow.queue_number);
      }
    } catch (qrErr) {
      console.warn('QR code generation skipped:', qrErr);
    }

    // 5. Structure payload to satisfy both original and new UI formats
    const ticketPayload = {
      id: ticketRow.id,
      ticketCode: ticketRow.ticket_code,
      ticket_code: ticketRow.ticket_code,
      queueNumber: ticketRow.queue_number,
      queue_number: ticketRow.queue_number,
      studentIdentifier: ticketRow.student_identifier,
      student_identifier: ticketRow.student_identifier,
      studentName: ticketRow.student_name,
      student_name: ticketRow.student_name,
      serviceName: ticketRow.service_name || 'General Inquiry',
      service_name: ticketRow.service_name || 'General Inquiry',
      officeName: ticketRow.office_name || 'Service Office',
      office_name: ticketRow.office_name || 'Service Office',
      status: ticketRow.status,
      createdAt: ticketRow.created_at,
      created_at: ticketRow.created_at,
      aheadCount,
      position: aheadCount + 1,
      estimatedWaitMinutes,
      currentlyServing,
      qrCodeUrl,
    };

    return NextResponse.json({
      success: true,
      ticket: ticketPayload,
      aheadCount,
      position: aheadCount + 1,
      estimatedWaitMinutes,
      currentlyServing,
      qrCodeUrl,
    });
  } catch (err: any) {
    console.error('Error fetching ticket status:', err);
    return NextResponse.json({ error: 'Failed to retrieve queue status.' }, { status: 500 });
  }
}