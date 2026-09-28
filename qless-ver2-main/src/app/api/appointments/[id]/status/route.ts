import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DEPARTMENT_STAFF') {
      return NextResponse.json({ error: 'Unauthorized department staff access.' }, { status: 401 });
    }

    const appointmentId = params.id;
    const { status, reason, rejectionReason } = await req.json();
    const deptId = session.departmentId;

    const targetRows = await query<any[]>(
      `SELECT * FROM appointments WHERE id = ? AND department_id = ?`,
      [appointmentId, deptId]
    );

    if (!targetRows || targetRows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found or unauthorized.' }, { status: 404 });
    }

    const app = targetRows[0];
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    if (status === 'APPROVED') {
      const aptNumber = `APT-${todayStr}-${String(app.id).padStart(3, '0')}`;
      await query(
        `UPDATE appointments SET status = 'APPROVED', appointment_number = ?, updated_at = NOW() WHERE id = ?`,
        [aptNumber, appointmentId]
      );

      await query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'APPOINTMENT_UPDATE')`,
        [
          app.student_id,
          'Appointment Approved!',
          `Your appointment request for ${app.concern_type} on ${app.appointment_date} at ${app.appointment_time} has been APPROVED. Appointment Number: ${aptNumber}`,
        ]
      );

      return NextResponse.json({ success: true, message: 'Appointment approved.', appointmentNumber: aptNumber });
    }

    if (status === 'REJECTED') {
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

    await query(`UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?`, [status, appointmentId]);
    return NextResponse.json({ success: true, message: `Status updated to ${status}.` });
  } catch (err: any) {
    console.error('Error updating appointment status via PATCH:', err);
    return NextResponse.json({ error: 'Server error updating appointment status.' }, { status: 500 });
  }
}
