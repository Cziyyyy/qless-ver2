import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { getStudentAppointments } from '@/lib/queue';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch department appointments from queue_tickets (Kiosk and Online DEP tickets)
    const deptConsultations = await getStudentAppointments(
      session.id,
      session.studentNumber || undefined
    );

    // 2. Fetch scheduled appointments from appointments table
    let scheduledApps: any[] = [];
    try {
      scheduledApps = await query<any[]>(
        `SELECT 
          a.id,
          a.appointment_code AS appointmentCode,
          COALESCE(a.appointment_number, CONCAT('DEP-', LPAD(a.id, 3, '0'))) AS queueNumber,
          COALESCE(p.name, u.name, a.instructor_name, 'Department Faculty') AS instructorName,
          COALESCE(d.name, a.department_name, 'Academic Department') AS departmentName,
          COALESCE(a.concern_type, a.details, 'Consultation') AS concernDetails,
          a.status,
          DATE_FORMAT(COALESCE(a.appointment_date, a.preferred_date, NOW()), '%Y-%m-%d') AS queueDate,
          a.appointment_time AS appointmentTime,
          a.notes,
          a.rejection_reason AS rejectionReason,
          a.created_at AS createdAt,
          CONCAT('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=', a.appointment_code) AS qrCodeUrl
        FROM appointments a
        LEFT JOIN users u ON a.faculty_id = u.id
        LEFT JOIN professors p ON a.professor_id = p.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.student_id = ? OR (a.student_number IS NOT NULL AND a.student_number = ?)
        ORDER BY a.created_at DESC`,
        [session.id, session.studentNumber || '']
      );
    } catch (e) {
      // appointments table fallback
    }

    // Combine both sources, eliminating duplicates by code or ID
    const combined = [...deptConsultations];
    for (const app of scheduledApps) {
      if (!combined.some((c) => c.id === app.id || c.appointmentCode === app.appointmentCode)) {
        combined.push(app);
      }
    }

    return NextResponse.json({
      success: true,
      appointments: combined,
    });
  } catch (error: any) {
    console.error('Error fetching student appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { departmentId, concernType, professorId, appointmentDate, appointmentTime, notes } = body;

    if (!departmentId || !concernType || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: 'Department, concern, appointment date, and time are required.' },
        { status: 400 }
      );
    }

    // Fetch department details
    const deptRows = await query<any[]>(`SELECT id, name, code FROM departments WHERE id = ?`, [departmentId]);
    const deptName = deptRows[0]?.name || 'Academic Department';

    // Fetch professor name if provided
    let profName = 'Any Professor / Department Head';
    if (professorId) {
      const profRows = await query<any[]>(`SELECT id, name FROM professors WHERE id = ?`, [professorId]);
      if (profRows && profRows.length > 0) {
        profName = profRows[0].name;
      }
    }

    const appCode = `APT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Insert into appointments table
    const appResult = await query<any>(
      `INSERT INTO appointments 
        (appointment_code, student_id, student_number, department_id, department_name, 
         concern_type, professor_id, instructor_name, appointment_date, appointment_time, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING')`,
      [
        appCode,
        session.id,
        session.studentNumber || null,
        departmentId,
        deptName,
        concernType,
        professorId || null,
        profName,
        appointmentDate,
        appointmentTime,
        notes || null,
      ]
    );

    const appointmentId = appResult.insertId;
    const queueNumber = `DEP-${String(appointmentId).padStart(3, '0')}`;

    // Update appointment number
    await query(`UPDATE appointments SET appointment_number = ? WHERE id = ?`, [queueNumber, appointmentId]);

    // 2. SYNC FEATURE: Also insert into queue_tickets so Department Staff Portal & Kiosk Queue sync seamlessly!
    let deptOfficeId = 4;
    const officeRows = await query<any[]>(`SELECT id FROM service_offices WHERE prefix = 'DEP' LIMIT 1`);
    if (officeRows && officeRows.length > 0) {
      deptOfficeId = officeRows[0].id;
    }

    // Calculate sequence number
    const seqRows = await query<any[]>(
      `SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq FROM queue_tickets WHERE service_office_id = ? AND queue_date = CURDATE()`,
      [deptOfficeId]
    );
    const nextSeq = seqRows[0]?.next_seq || appointmentId;

    await query(
      `INSERT INTO queue_tickets 
        (ticket_code, queue_number, student_id, student_identifier, student_name, 
         instructor_name, department_name, concern_details, service_office_id, service_id, status, queue_date, sequence_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'WAITING', ?, ?)`,
      [
        appCode,
        queueNumber,
        session.id,
        session.studentNumber || session.email,
        session.name,
        profName,
        deptName,
        `${concernType}${notes ? ` - ${notes}` : ''}`,
        deptOfficeId,
        appointmentDate,
        nextSeq,
      ]
    );

    // Create Notification
    try {
      await query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'APPOINTMENT_UPDATE')`,
        [
          session.id,
          'Appointment Scheduled',
          `Your appointment for ${concernType} at ${deptName} has been booked for ${appointmentDate} at ${appointmentTime}. Code: ${queueNumber}`,
        ]
      );
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Appointment successfully scheduled and synced to department queue!',
      appointment: {
        id: appointmentId,
        appointmentCode: appCode,
        queueNumber,
        departmentName: deptName,
        instructorName: profName,
        concernType,
        appointmentDate,
        appointmentTime,
        status: 'WAITING',
      },
    });
  } catch (error: any) {
    console.error('Error creating student appointment:', error);
    return NextResponse.json({ error: 'Server error scheduling appointment.' }, { status: 500 });
  }
}