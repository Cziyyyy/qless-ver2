import pool, { query } from '@/lib/db';
import crypto from 'crypto';

export interface TicketInfo {
  id: number;
  ticketCode: string;
  queueNumber: string;
  studentId: number | null;
  studentIdentifier: string;
  studentName: string | null;
  instructorName?: string | null;
  departmentName?: string | null;
  concernDetails?: string | null;
  serviceOfficeId: number;
  serviceOfficeName: string;
  serviceOfficePrefix: string;
  serviceId: number;
  serviceName: string;
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  queueDate: string;
  sequenceNumber: number;
  estimatedWaitMinutes: number;
  peopleAhead: number;
  currentlyServing: string | null;
  createdAt: string;
}

export interface AppointmentInfo {
  id: number;
  appointmentCode: string;
  queueNumber: string;
  instructorName: string;
  departmentName: string;
  concernDetails: string;
  status: string;
  queueDate: string;
  createdAt: string;
}

/**
 * Creates a queue ticket or department appointment.
 */
export async function createQueueTicket(params: {
  serviceOfficeId: number;
  serviceId: number;
  studentIdentifier: string;
  studentName?: string;
  studentId?: number | null;
  instructor?: string | null;
  department?: string | null;
  details?: string | null;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const cleanIdentifier = params.studentIdentifier.trim();
    const isGuest = cleanIdentifier.toLowerCase().startsWith('guest-walkin');

    let resolvedStudentId = params.studentId || null;
    let resolvedStudentNumber = cleanIdentifier;
    let resolvedStudentName = params.studentName || null;

    // 1. Resolve student ID and official name from users table
    if (!isGuest && cleanIdentifier) {
      const [userMatch]: any = await connection.execute(
        `SELECT id, name, student_number, email FROM users 
         WHERE LOWER(TRIM(student_number)) = LOWER(?) 
            OR LOWER(TRIM(email)) = LOWER(?) 
            OR LOWER(email) LIKE LOWER(?) 
         LIMIT 1`,
        [cleanIdentifier, cleanIdentifier, `${cleanIdentifier}@%`]
      );

      if (userMatch && userMatch.length > 0) {
        const studentUser = userMatch[0];
        resolvedStudentId = studentUser.id;
        resolvedStudentNumber = studentUser.student_number || cleanIdentifier;
        resolvedStudentName = studentUser.name || resolvedStudentName;
      }
    }

    // 2. Fetch Office Prefix
    const [officeRows]: any = await connection.execute(
      `SELECT id, name, prefix FROM service_offices WHERE id = ? AND status = 'ACTIVE'`,
      [params.serviceOfficeId]
    );

    if (!officeRows || officeRows.length === 0) {
      await connection.rollback();
      return { success: false, error: 'Selected service office is not available.' };
    }

    const office = officeRows[0];

    // 3. Lock & calculate sequence number for office using CURDATE()
    const [seqResult]: any = await connection.execute(
      `SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq 
       FROM queue_tickets 
       WHERE service_office_id = ? AND queue_date = CURDATE() FOR UPDATE`,
      [params.serviceOfficeId]
    );

    const nextSeq = seqResult[0].next_seq;
    const formattedSeq = String(nextSeq).padStart(3, '0');
    const queueNumber = `${office.prefix}-${formattedSeq}`;

    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const ticketCode = `QL-${randomHex}`;

    // 4. Estimate wait time
    const [aheadRows]: any = await connection.execute(
      `SELECT COUNT(*) as count FROM queue_tickets 
       WHERE service_office_id = ? AND queue_date = CURDATE() AND status = 'WAITING'`,
      [params.serviceOfficeId]
    );
    const peopleAhead = aheadRows[0]?.count || 0;
    const estimatedWaitMinutes = Math.max(5, (peopleAhead + 1) * 5);

    // 5. Insert Ticket linked to student record
    const [insertRes]: any = await connection.execute(
      `INSERT INTO queue_tickets 
        (ticket_code, queue_number, student_id, student_identifier, student_name, 
         instructor_name, department_name, concern_details,
         service_office_id, service_id, status, queue_date, sequence_number, estimated_wait_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING', CURDATE(), ?, ?)`,
      [
        ticketCode,
        queueNumber,
        resolvedStudentId,
        resolvedStudentNumber,
        resolvedStudentName || (isGuest ? 'Guest Walk-in' : 'Mapúa Student'),
        params.instructor || null,
        params.department || null,
        params.details || null,
        params.serviceOfficeId,
        params.serviceId,
        nextSeq,
        estimatedWaitMinutes,
      ]
    );

    const ticketId = insertRes.insertId;

    try {
      await connection.execute(
        `INSERT INTO queue_events (queue_ticket_id, event_type, details) VALUES (?, 'CREATED', ?)`,
        [ticketId, params.details || 'Ticket generated']
      );
    } catch (e) {
      console.warn('Queue event insert skipped:', e);
    }

    await connection.commit();

    return {
      success: true,
      ticket: {
        id: ticketId,
        ticketCode,
        queueNumber,
        serviceOfficeId: params.serviceOfficeId,
        serviceOfficeName: office.name,
        serviceId: params.serviceId,
        studentId: resolvedStudentId,
        studentIdentifier: resolvedStudentNumber,
        studentName: resolvedStudentName,
        instructorName: params.instructor || null,
        departmentName: params.department || null,
        concernDetails: params.details || null,
        status: 'WAITING',
        sequenceNumber: nextSeq,
        estimatedWaitMinutes,
        peopleAhead,
      },
    };
  } catch (err: any) {
    await connection.rollback();
    console.error('Error creating queue ticket:', err);
    return { success: false, error: err.message || 'Failed to generate queue ticket.' };
  } finally {
    connection.release();
  }
}

/**
 * Fetch ONLY active Service Desk Tickets (Admissions, Registrar, Treasury)
 * Explicitly EXCLUDES Department Consultations.
 */
export async function getStudentActiveTickets(studentId: number | null, studentIdentifier?: string) {
  const cleanId = studentIdentifier?.trim() || '';

  const rows = await query<any[]>(
    `SELECT t.*, 
            so.name AS office_name, 
            so.prefix AS office_prefix,
            s.name AS service_name
     FROM queue_tickets t
     JOIN service_offices so ON t.service_office_id = so.id
     LEFT JOIN services s ON t.service_id = s.id
     WHERE (
       (t.student_id IS NOT NULL AND t.student_id = ?) 
       OR LOWER(TRIM(t.student_identifier)) = LOWER(?)
       OR (? != '' AND LOWER(t.student_identifier) LIKE LOWER(CONCAT('%', ?, '%')))
     )
       AND t.status IN ('WAITING', 'CALLED', 'SERVING')
       AND so.prefix != 'DEP'
       AND t.service_office_id != 4
     ORDER BY t.id DESC`,
    [studentId || 0, cleanId, cleanId, cleanId]
  );

  if (!rows || rows.length === 0) return [];

  return Promise.all(
    rows.map(async (ticket) => {
      let peopleAhead = 0;
      if (ticket.status === 'WAITING') {
        const aheadRows = await query<any[]>(
          `SELECT COUNT(*) as count FROM queue_tickets 
           WHERE service_office_id = ? AND queue_date = CURDATE() AND status = 'WAITING' AND sequence_number < ?`,
          [ticket.service_office_id, ticket.sequence_number]
        );
        peopleAhead = aheadRows[0]?.count || 0;
      }

      const servingRows = await query<any[]>(
        `SELECT queue_number FROM queue_tickets 
         WHERE service_office_id = ? AND queue_date = CURDATE() AND status IN ('CALLED', 'SERVING')
         ORDER BY id DESC LIMIT 1`,
        [ticket.service_office_id]
      );

      return {
        id: ticket.id,
        ticketCode: ticket.ticket_code,
        queueNumber: ticket.queue_number,
        serviceOfficeName: ticket.office_name,
        serviceName: ticket.service_name || 'Desk Service',
        status: ticket.status,
        sequenceNumber: ticket.sequence_number,
        peopleAhead,
        currentlyServing: servingRows.length > 0 ? servingRows[0].queue_number : '---',
        estimatedWaitMinutes: Math.max(5, (peopleAhead + 1) * 5),
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.ticket_code}`,
      };
    })
  );
}

/**
 * Fetch Department Consultations as APPOINTMENTS
 */
export async function getStudentAppointments(studentId: number | null, studentIdentifier?: string): Promise<AppointmentInfo[]> {
  const cleanId = studentIdentifier?.trim() || '';

  const rows = await query<any[]>(
    `SELECT t.*, 
            so.name AS office_name, 
            so.prefix AS office_prefix,
            s.name AS service_name
     FROM queue_tickets t
     JOIN service_offices so ON t.service_office_id = so.id
     LEFT JOIN services s ON t.service_id = s.id
     WHERE (
       (t.student_id IS NOT NULL AND t.student_id = ?) 
       OR LOWER(TRIM(t.student_identifier)) = LOWER(?)
       OR (? != '' AND LOWER(t.student_identifier) LIKE LOWER(CONCAT('%', ?, '%')))
     )
       AND (so.prefix = 'DEP' OR t.service_office_id = 4)
       AND t.status IN ('WAITING', 'CALLED', 'SERVING')
     ORDER BY t.id DESC`,
    [studentId || 0, cleanId, cleanId, cleanId]
  );

  return (rows || []).map((appt) => ({
    id: appt.id,
    appointmentCode: appt.ticket_code,
    queueNumber: appt.queue_number,
    instructorName: appt.instructor_name || 'Department Faculty',
    departmentName: appt.department_name || 'Academic Department',
    concernDetails: appt.concern_details || 'Faculty Consultation',
    status: appt.status,
    queueDate: appt.queue_date,
    createdAt: appt.created_at,
  }));
}