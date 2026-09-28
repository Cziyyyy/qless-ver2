import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DEPARTMENT_STAFF') {
      return NextResponse.json({ error: 'Unauthorized department staff access.' }, { status: 401 });
    }

    const deptId = session.departmentId;
    if (!deptId) {
      return NextResponse.json({ error: 'No department assigned to staff account.' }, { status: 400 });
    }

    // Get Department Details
    const deptRows = await query<any[]>(`SELECT id, name, code FROM departments WHERE id = ?`, [deptId]);
    if (!deptRows || deptRows.length === 0) {
      return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
    }

    const department = deptRows[0];

    // Fetch All Appointments for this Department ONLY
    const rows = await query<any[]>(
      `SELECT a.*, 
              u.name AS student_name, u.email AS student_email, u.student_number,
              p.name AS professor_name
       FROM appointments a
       JOIN users u ON a.student_id = u.id
       LEFT JOIN professors p ON a.professor_id = p.id
       WHERE a.department_id = ?
       ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
      [deptId]
    );

    const pending = rows.filter((r) => r.status === 'PENDING');
    const approved = rows.filter((r) => r.status === 'APPROVED');
    const completed = rows.filter((r) => r.status === 'COMPLETED');
    const upcoming = rows.filter((r) => ['PENDING', 'APPROVED'].includes(r.status));

    return NextResponse.json({
      department,
      appointments: rows.map((r) => ({
        id: r.id,
        appointmentCode: r.appointment_code,
        appointmentNumber: r.appointment_number,
        studentName: r.student_name,
        studentEmail: r.student_email,
        studentNumber: r.student_number || 'N/A',
        concernType: r.concern_type,
        professorName: r.professor_name || 'Unassigned / Any Professor',
        appointmentDate: r.appointment_date,
        appointmentTime: r.appointment_time,
        notes: r.notes,
        status: r.status,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      stats: {
        total: rows.length,
        pending: pending.length,
        approved: approved.length,
        upcoming: upcoming.length,
        completed: completed.length,
      },
    });
  } catch (err: any) {
    console.error('Error in department staff appointments API:', err);
    return NextResponse.json({ error: 'Failed to retrieve department appointments.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DEPARTMENT_STAFF') {
      return NextResponse.json({ error: 'Unauthorized department staff action.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, appointmentId, rejectionReason, reason, newDate, newTime } = body;
    const deptId = session.departmentId;

    if (!appointmentId || !action) {
      return NextResponse.json({ error: 'Appointment ID and action are required.' }, { status: 400 });
    }

    // Verify appointment belongs to this staff's assigned department
    const targetRows = await query<any[]>(
      `SELECT * FROM appointments WHERE id = ? AND department_id = ?`,
      [appointmentId, deptId]
    );

    if (!targetRows || targetRows.length === 0) {
      return NextResponse.json({ error: 'Appointment record not found or unauthorized for this department.' }, { status: 404 });
    }

    const app = targetRows[0];
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    if (action === 'APPROVE') {
      const aptNumber = `APT-${todayStr}-${String(app.id).padStart(3, '0')}`;

      await query(
        `UPDATE appointments SET status = 'APPROVED', appointment_number = ?, updated_at = NOW() WHERE id = ?`,
        [aptNumber, appointmentId]
      );

      // Create notification for student in MySQL
      await query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'APPOINTMENT_UPDATE')`,
        [
          app.student_id,
          'Appointment Approved!',
          `Your appointment request for ${app.concern_type} on ${app.appointment_date} at ${app.appointment_time} has been APPROVED. Appointment Number: ${aptNumber}`,
        ]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Appointment approved successfully.', 
        appointmentNumber: aptNumber 
      });
    }

    if (action === 'REJECT') {
      const effectiveReason = rejectionReason || reason || 'Professor is unavailable during the selected schedule.';

      await query(
        `UPDATE appointments SET status = 'REJECTED', rejection_reason = ?, updated_at = NOW() WHERE id = ?`,
        [effectiveReason, appointmentId]
      );

      await query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'APPOINTMENT_UPDATE')`,
        [
          app.student_id,
          'Appointment Request Declined',
          `Your appointment request for ${app.concern_type} was declined. Reason: ${effectiveReason}`,
        ]
      );

      return NextResponse.json({ success: true, message: 'Appointment rejected.' });
    }

    if (action === 'RESCHEDULE') {
      if (!newDate || !newTime) {
        return NextResponse.json({ error: 'New date and time are required for rescheduling.' }, { status: 400 });
      }

      await query(
        `UPDATE appointments SET status = 'APPROVED', appointment_date = ?, appointment_time = ?, updated_at = NOW() WHERE id = ?`,
        [newDate, newTime, appointmentId]
      );

      await query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'APPOINTMENT_UPDATE')`,
        [
          app.student_id,
          'Appointment Rescheduled',
          `Your appointment for ${app.concern_type} has been rescheduled to ${newDate} at ${newTime}.`,
        ]
      );

      return NextResponse.json({ success: true, message: 'Appointment rescheduled successfully.' });
    }

    if (action === 'COMPLETE') {
      await query(`UPDATE appointments SET status = 'COMPLETED', updated_at = NOW() WHERE id = ?`, [appointmentId]);
      return NextResponse.json({ success: true, message: 'Appointment marked as completed.' });
    }

    if (action === 'CANCEL') {
      await query(`UPDATE appointments SET status = 'CANCELLED', updated_at = NOW() WHERE id = ?`, [appointmentId]);
      return NextResponse.json({ success: true, message: 'Appointment cancelled.' });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error handling department staff appointment action:', err);
    return NextResponse.json({ error: 'Server error processing appointment action.' }, { status: 500 });
  }
}
