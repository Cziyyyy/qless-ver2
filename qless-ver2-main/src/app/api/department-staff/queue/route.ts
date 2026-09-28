import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instructor = searchParams.get('instructor') || searchParams.get('instructorId');
    const department = searchParams.get('department') || searchParams.get('departmentId');

    // 1. Fetch tickets from queue_tickets (Department office / prefix DEP)
    let sql = `
      SELECT t.*, 
             so.name AS office_name,
             so.prefix AS office_prefix,
             s.name AS service_name,
             t.ticket_code AS ticketCode,
             t.queue_number AS queueNumber,
             t.student_identifier AS studentIdentifier,
             t.student_name AS studentName,
             t.instructor_name AS instructorName,
             t.department_name AS departmentName,
             t.concern_details AS concernDetails,
             t.created_at AS createdAt
      FROM queue_tickets t
      LEFT JOIN service_offices so ON t.service_office_id = so.id
      LEFT JOIN services s ON t.service_id = s.id
      WHERE (t.service_office_id = 4 OR so.prefix = 'DEP' OR t.department_name IS NOT NULL)
    `;
    const params: any[] = [];

    if (department && department !== 'ALL' && department !== 'all') {
      sql += ` AND (LOWER(t.department_name) LIKE LOWER(CONCAT('%', ?, '%')) OR t.academic_department_id = ?)`;
      params.push(department, department);
    }

    if (instructor && instructor !== 'ALL' && instructor !== 'all') {
      sql += ` AND (LOWER(t.instructor_name) LIKE LOWER(CONCAT('%', ?, '%')) OR t.instructor_id = ?)`;
      params.push(instructor, instructor);
    }

    sql += ` ORDER BY t.id ASC`;

    const ticketRows = await query<any[]>(sql, params);

    // 2. Fetch appointments from appointments table to ensure 100% sync
    let apptRows: any[] = [];
    try {
      let apptSql = `
        SELECT 
          a.id,
          a.appointment_code AS ticket_code,
          a.appointment_code AS ticketCode,
          COALESCE(a.appointment_number, CONCAT('DEP-', LPAD(a.id, 3, '0'))) AS queue_number,
          COALESCE(a.appointment_number, CONCAT('DEP-', LPAD(a.id, 3, '0'))) AS queueNumber,
          COALESCE(u.student_number, u.email, a.student_number, 'Student') AS student_identifier,
          COALESCE(u.student_number, u.email, a.student_number, 'Student') AS studentIdentifier,
          COALESCE(u.name, 'Mapúa Student') AS student_name,
          COALESCE(u.name, 'Mapúa Student') AS studentName,
          COALESCE(p.name, a.instructor_name, 'Department Faculty') AS instructor_name,
          COALESCE(p.name, a.instructor_name, 'Department Faculty') AS instructorName,
          COALESCE(d.name, a.department_name, 'Academic Department') AS department_name,
          COALESCE(d.name, a.department_name, 'Academic Department') AS departmentName,
          CONCAT(a.concern_type, COALESCE(CONCAT(' - ', a.notes), '')) AS concern_details,
          CONCAT(a.concern_type, COALESCE(CONCAT(' - ', a.notes), '')) AS concernDetails,
          a.status,
          a.appointment_date AS queue_date,
          a.created_at AS created_at,
          a.created_at AS createdAt
        FROM appointments a
        LEFT JOIN users u ON a.student_id = u.id
        LEFT JOIN professors p ON a.professor_id = p.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE 1=1
      `;
      const apptParams: any[] = [];
      if (department && department !== 'ALL' && department !== 'all') {
        apptSql += ` AND (LOWER(d.name) LIKE LOWER(CONCAT('%', ?, '%')) OR LOWER(a.department_name) LIKE LOWER(CONCAT('%', ?, '%')))`;
        apptParams.push(department, department);
      }
      if (instructor && instructor !== 'ALL' && instructor !== 'all') {
        apptSql += ` AND (LOWER(p.name) LIKE LOWER(CONCAT('%', ?, '%')) OR LOWER(a.instructor_name) LIKE LOWER(CONCAT('%', ?, '%')))`;
        apptParams.push(instructor, instructor);
      }
      apptSql += ` ORDER BY a.id ASC`;

      apptRows = await query<any[]>(apptSql, apptParams);
    } catch (e) {
      console.warn('Appointments query sync skipped:', e);
    }

    // Merge ticket rows and appointment rows without duplicates
    const combinedMap = new Map<string, any>();
    
    // Add appointments first
    for (const app of apptRows) {
      const key = app.ticket_code || `APPT-${app.id}`;
      combinedMap.set(key, app);
    }

    // Add tickets (override or supplement)
    for (const t of ticketRows) {
      const key = t.ticket_code || `TICK-${t.id}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, t);
      } else {
        // preserve status sync if ticket is serving/completed
        const existing = combinedMap.get(key);
        combinedMap.set(key, { ...existing, ...t });
      }
    }

    const allTickets = Array.from(combinedMap.values());

    // Normalize PENDING status to WAITING for department dashboard
    const normalizedTickets = allTickets.map((t) => ({
      ...t,
      status: t.status === 'PENDING' || t.status === 'APPROVED' ? 'WAITING' : t.status,
    }));

    // Active consultation (SERVING or CALLED)
    const activeTickets = normalizedTickets.filter(
      (t) => t.status === 'CALLED' || t.status === 'SERVING'
    );
    const currentTicket = activeTickets.length > 0 ? activeTickets[activeTickets.length - 1] : null;

    // Waiting consultation list
    const waitingTickets = normalizedTickets.filter((t) => t.status === 'WAITING');

    return NextResponse.json({
      success: true,
      tickets: normalizedTickets,
      currentConsultation: currentTicket,
      currentlyServing: currentTicket,
      waiting: waitingTickets,
      waitingQueue: waitingTickets,
      count: waitingTickets.length,
    });
  } catch (error: any) {
    console.error('Error fetching department tickets:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { ticketId, ticketCode, status, action } = body;

    // Support both action-based ('CALL_NEXT') and direct status updates
    if (action === 'CALL_NEXT' && !ticketId) {
      const waitingList = await query<any[]>(
        `SELECT id, ticket_code, queue_number 
         FROM queue_tickets 
         WHERE (service_office_id = 4 OR prefix = 'DEP' OR department_name IS NOT NULL) 
           AND status IN ('WAITING', 'PENDING', 'APPROVED')
         ORDER BY id ASC LIMIT 1`
      );

      if (!waitingList || waitingList.length === 0) {
        return NextResponse.json({ error: 'No consultation tickets waiting in queue' }, { status: 400 });
      }

      ticketId = waitingList[0].id;
      ticketCode = waitingList[0].ticket_code;
      status = 'SERVING';
    } else if (action && !status) {
      if (action === 'START_SERVING') status = 'SERVING';
      if (action === 'COMPLETE') status = 'COMPLETED';
      if (action === 'CANCEL') status = 'CANCELLED';
      if (action === 'SKIP') status = 'NO_SHOW';
    }

    if (!ticketId && !ticketCode) {
      return NextResponse.json({ error: 'Ticket ID or Code is required' }, { status: 400 });
    }

    if (!status) status = 'SERVING';

    // 1. Update queue_tickets table
    if (ticketId) {
      await query(
        `UPDATE queue_tickets SET status = ? WHERE id = ?`,
        [status, ticketId]
      );
    }
    if (ticketCode) {
      await query(
        `UPDATE queue_tickets SET status = ? WHERE ticket_code = ?`,
        [status, ticketCode]
      );
    }

    // 2. SYNC FEATURE: Also update appointments table to keep department features in sync!
    try {
      if (ticketCode) {
        await query(
          `UPDATE appointments SET status = ? WHERE appointment_code = ?`,
          [status, ticketCode]
        );
      }
      if (ticketId) {
        await query(
          `UPDATE appointments SET status = ? WHERE id = ? OR appointment_number LIKE CONCAT('%', ?, '%')`,
          [status, ticketId, String(ticketId).padStart(3, '0')]
        );
      }
    } catch (apptErr) {
      console.warn('Sync update to appointments table skipped:', apptErr);
    }

    // Optional event logger
    try {
      await query(
        `INSERT INTO queue_events (queue_ticket_id, event_type, details) VALUES (?, ?, ?)`,
        [ticketId || 0, status, `Department updated status to ${status}`]
      );
    } catch (eventErr) {}

    return NextResponse.json({
      success: true,
      message: `Consultation status updated to ${status}`,
      ticketId,
      status,
    });
  } catch (error: any) {
    console.error('Error updating department ticket status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}