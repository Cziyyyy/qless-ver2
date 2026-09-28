import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, action } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID required.' }, { status: 400 });
    }

    const newStatus = action === 'DONE' ? 'COMPLETED' : 'CANCELLED';

    // Update status in MySQL ensuring it belongs to this student
    const [result]: any = await pool.query(
      `UPDATE queue_tickets 
       SET status = ? 
       WHERE id = ? 
         AND (student_id = ? OR student_identifier = ? OR student_identifier = ?)`,
      [newStatus, ticketId, session.id, session.studentNumber || '', session.email || '']
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Ticket not found or unauthorized.' }, { status: 404 });
    }

    // Log the event
    await pool.query(
      `INSERT INTO queue_events (queue_ticket_id, event_type, details) 
       VALUES (?, ?, ?)`,
      [ticketId, newStatus, `Student marked ticket as ${newStatus} online`]
    );

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    console.error('Error updating queue status:', err);
    return NextResponse.json({ error: 'Failed to update queue ticket.' }, { status: 500 });
  }
}
