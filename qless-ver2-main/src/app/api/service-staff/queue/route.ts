import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SERVICE_STAFF' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const officeId = session.serviceOfficeId || 1; // 1 = Admissions

    // 1. Get Office Details
    let office = { id: 1, name: 'Admissions', prefix: 'ADM' };
    try {
      const officeRows = await query<any[]>(
        `SELECT id, name, prefix FROM service_offices WHERE id = ?`,
        [officeId]
      );
      if (officeRows.length > 0) office = officeRows[0];
    } catch (e) {
      console.warn('Could not query service_offices:', e);
    }

    // 2. Fetch currently serving/called ticket
    const activeTickets = await query<any[]>(
      `SELECT t.id,
              t.ticket_code AS ticketCode,
              t.queue_number AS queueNumber,
              t.student_identifier AS studentIdentifier,
              s.name AS serviceName,
              t.status,
              t.created_at AS createdAt
       FROM queue_tickets t
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.service_office_id = ? 
         AND t.status IN ('CALLED', 'SERVING')
       ORDER BY t.id DESC 
       LIMIT 1`,
      [officeId]
    );

    const currentlyServing = activeTickets.length > 0 ? activeTickets[0] : null;

    // 3. Fetch waiting queue
    const waitingTickets = await query<any[]>(
      `SELECT t.id,
              t.ticket_code AS ticketCode,
              t.queue_number AS queueNumber,
              t.student_identifier AS studentIdentifier,
              s.name AS serviceName,
              t.status,
              t.created_at AS createdAt
       FROM queue_tickets t
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.service_office_id = ? 
         AND t.status = 'WAITING'
       ORDER BY t.id ASC`,
      [officeId]
    );

    // 4. Completed count
    const completedResult = await query<any[]>(
      `SELECT COUNT(*) as count 
       FROM queue_tickets 
       WHERE service_office_id = ? AND status = 'COMPLETED'`,
      [officeId]
    );

    // 5. Total count
    const totalResult = await query<any[]>(
      `SELECT COUNT(*) as count 
       FROM queue_tickets 
       WHERE service_office_id = ?`,
      [officeId]
    );

    const nextInLine = waitingTickets.length > 0 ? waitingTickets[0] : null;

    return NextResponse.json({
      success: true,
      office,
      currentlyServing,
      waiting: waitingTickets,
      waitingQueue: waitingTickets,
      nextInLine,
      stats: {
        totalToday: totalResult[0]?.count || 0,
        waitingCount: waitingTickets.length,
        completedCount: completedResult[0]?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Error in service staff queue API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SERVICE_STAFF' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ticketId } = await req.json();
    const officeId = session.serviceOfficeId || 1;

    console.log(`[Service Staff Action] Action "${action}" received for office ${officeId}`);

    if (action === 'CALL_NEXT') {
      const nextTickets = await query<any[]>(
        `SELECT id, queue_number FROM queue_tickets 
         WHERE service_office_id = ? AND status = 'WAITING'
         ORDER BY id ASC LIMIT 1`,
        [officeId]
      );

      if (!nextTickets || nextTickets.length === 0) {
        return NextResponse.json({ error: 'No tickets waiting in line.' }, { status: 400 });
      }

      const nextTicket = nextTickets[0];

      // Update strictly the status column to prevent ER_BAD_FIELD_ERROR
      await query(
        `UPDATE queue_tickets 
         SET status = 'CALLED' 
         WHERE id = ?`,
        [nextTicket.id]
      );

      console.log(`[Service Staff Action] Ticket ${nextTicket.queue_number} (ID: ${nextTicket.id}) set to CALLED`);

      return NextResponse.json({
        success: true,
        message: `Now calling ticket ${nextTicket.queue_number}`,
        ticket: nextTicket,
      });
    }

    if (action === 'START_SERVING' && ticketId) {
      await query(
        `UPDATE queue_tickets SET status = 'SERVING' WHERE id = ?`,
        [ticketId]
      );
      return NextResponse.json({ success: true, message: 'Serving started.' });
    }

    if (action === 'COMPLETE' && ticketId) {
      await query(
        `UPDATE queue_tickets SET status = 'COMPLETED' WHERE id = ?`,
        [ticketId]
      );
      return NextResponse.json({ success: true, message: 'Ticket marked as completed.' });
    }

    if (action === 'CANCEL' && ticketId) {
      await query(
        `UPDATE queue_tickets SET status = 'CANCELLED' WHERE id = ?`,
        [ticketId]
      );
      return NextResponse.json({ success: true, message: 'Ticket cancelled.' });
    }

    if (action === 'SKIP' && ticketId) {
      await query(
        `UPDATE queue_tickets SET status = 'NO_SHOW' WHERE id = ?`,
        [ticketId]
      );
      return NextResponse.json({ success: true, message: 'Ticket marked as no-show.' });
    }

    return NextResponse.json({ error: 'Invalid action provided.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating service staff queue:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}