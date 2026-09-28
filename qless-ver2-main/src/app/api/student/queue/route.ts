import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { getStudentActiveTickets, getStudentAppointments } from '@/lib/queue';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await getStudentActiveTickets(session.id, session.studentNumber || undefined);
    const appointments = await getStudentAppointments(session.id, session.studentNumber || undefined);

    let history: any[] = [];
    try {
      history = await query<any[]>(
        `SELECT 
          qt.id,
          qt.ticket_code AS ticketCode,
          qt.queue_number AS queueNumber,
          so.name AS officeName,
          s.name AS serviceName,
          qt.status,
          DATE_FORMAT(qt.created_at, '%Y-%m-%d %H:%i') AS queueDate
        FROM queue_tickets qt
        LEFT JOIN service_offices so ON qt.service_office_id = so.id
        LEFT JOIN services s ON qt.service_id = s.id
        WHERE (qt.student_id = ? OR qt.student_identifier = ?)
          AND qt.status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW')
        ORDER BY qt.created_at DESC
        LIMIT 20`,
        [session.id, session.studentNumber || '']
      );
    } catch (e) {
      console.warn('Could not query history:', e);
    }

    return NextResponse.json({
      success: true,
      tickets,
      activeTickets: tickets,
      activeTicket: tickets.length > 0 ? tickets[0] : null,
      appointments,
      history,
    });
  } catch (error: any) {
    console.error('Error fetching student queue/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, action } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'A valid Ticket or Appointment ID is required.' }, { status: 400 });
    }

    const nextStatus = action === 'DONE' ? 'COMPLETED' : 'CANCELLED';
    const parsedId = Number(ticketId);
    const idStr = String(ticketId).trim();

    console.log(`[Queue Cancel API] Updating ticketId: ${ticketId} (parsed: ${parsedId}) to ${nextStatus}`);

    let totalUpdated = 0;

    // 1. Update queue_tickets by ID or ticket_code (NO updated_at column)
    try {
      if (!isNaN(parsedId) && parsedId > 0) {
        const res: any = await query(
          `UPDATE queue_tickets 
           SET status = ? 
           WHERE id = ?`,
          [nextStatus, parsedId]
        );
        totalUpdated += res?.affectedRows || 0;
      }
      
      const resCode: any = await query(
        `UPDATE queue_tickets 
         SET status = ? 
         WHERE ticket_code = ?`,
        [nextStatus, idStr]
      );
      totalUpdated += resCode?.affectedRows || 0;
    } catch (dbErr: any) {
      console.error('Error updating queue_tickets:', dbErr);
    }

    // 2. Also update appointments table by ID or appointment_code (appointments HAS updated_at)
    try {
      if (!isNaN(parsedId) && parsedId > 0) {
        const resApp: any = await query(
          `UPDATE appointments 
           SET status = ?, updated_at = NOW() 
           WHERE id = ?`,
          [nextStatus, parsedId]
        );
        totalUpdated += resApp?.affectedRows || 0;
      }

      const resAppCode: any = await query(
        `UPDATE appointments 
         SET status = ?, updated_at = NOW() 
         WHERE appointment_code = ?`,
        [nextStatus, idStr]
      );
      totalUpdated += resAppCode?.affectedRows || 0;
    } catch (appErr: any) {
      // Appointments table fallback
      try {
        if (!isNaN(parsedId) && parsedId > 0) {
          const resApp2: any = await query(
            `UPDATE appointments SET status = ? WHERE id = ?`,
            [nextStatus, parsedId]
          );
          totalUpdated += resApp2?.affectedRows || 0;
        }
      } catch {}
    }

    console.log(`[Queue Cancel API] Total affected rows: ${totalUpdated}`);

    return NextResponse.json({
      success: true,
      affectedRows: totalUpdated,
      message: `Successfully marked as ${nextStatus}.`,
    });
  } catch (error: any) {
    console.error('Critical error updating/cancelling ticket:', error);
    return NextResponse.json(
      { error: error?.message || 'Database error occurred while cancelling.' },
      { status: 500 }
    );
  }
}