import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

async function ensureRatingsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NULL,
        appointment_id INT NULL,
        student_id INT NOT NULL,
        office_or_dept VARCHAR(150) NOT NULL,
        rating INT NOT NULL,
        feedback TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (e) {
    console.warn('Error creating ratings table:', e);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureRatingsTable();

    const ratings = await query<any[]>(
      `SELECT r.*, u.name as student_name 
       FROM ratings r
       JOIN users u ON r.student_id = u.id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [session.id]
    );

    return NextResponse.json({ success: true, ratings: ratings || [] });
  } catch (err: any) {
    console.error('Error fetching student ratings:', err);
    return NextResponse.json({ error: 'Failed to retrieve ratings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureRatingsTable();

    const { ticketId, appointmentId, officeOrDept, rating, feedback } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars.' }, { status: 400 });
    }

    if (!officeOrDept) {
      return NextResponse.json({ error: 'Office or Department name is required.' }, { status: 400 });
    }

    const res = await query<any>(
      `INSERT INTO ratings (ticket_id, appointment_id, student_id, office_or_dept, rating, feedback)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ticketId || null,
        appointmentId || null,
        session.id,
        officeOrDept,
        rating,
        feedback || null,
      ]
    );

    // Also attempt to update ticket or appointment rating flag if columns exist
    if (ticketId) {
      try {
        await query(`UPDATE queue_tickets SET is_rated = 1 WHERE id = ?`, [ticketId]);
      } catch (e) {}
    }
    if (appointmentId) {
      try {
        await query(`UPDATE appointments SET is_rated = 1 WHERE id = ?`, [appointmentId]);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your rating and feedback!',
      ratingId: res.insertId,
    });
  } catch (err: any) {
    console.error('Error submitting rating:', err);
    return NextResponse.json({ error: 'Server error saving rating.' }, { status: 500 });
  }
}
