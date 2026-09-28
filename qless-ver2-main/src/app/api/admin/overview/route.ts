import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const officeFilter = searchParams.get('officeId');
    const statusFilter = searchParams.get('status');
    const deptFilter = searchParams.get('deptId');
    const dateFilter = searchParams.get('date');

    const today = dateFilter || new Date().toISOString().split('T')[0];

    // Stats
    const [userCountRows] = await query<any[]>(`SELECT COUNT(*) as count FROM users`);
    const [ticketTodayRows] = await query<any[]>(`SELECT COUNT(*) as count FROM queue_tickets WHERE queue_date = ?`, [today]);
    const [activeTicketsRows] = await query<any[]>(`SELECT COUNT(*) as count FROM queue_tickets WHERE queue_date = ? AND status IN ('WAITING', 'CALLED', 'SERVING')`, [today]);
    const [appointmentTodayRows] = await query<any[]>(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?`, [today]);

    // Office Stats
    const officeStats = await query<any[]>(
      `SELECT so.id, so.name, so.prefix,
              COUNT(t.id) as total_tickets,
              SUM(CASE WHEN t.status IN ('WAITING', 'CALLED', 'SERVING') THEN 1 ELSE 0 END) as active_tickets,
              SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tickets
       FROM service_offices so
       LEFT JOIN queue_tickets t ON so.id = t.service_office_id AND t.queue_date = ?
       WHERE so.status = 'ACTIVE'
       GROUP BY so.id, so.name, so.prefix`,
      [today]
    );

    // Queue Monitor SQL query with dynamic filters
    let queueSql = `
      SELECT t.*, so.name AS office_name, s.name AS service_name
      FROM queue_tickets t
      JOIN service_offices so ON t.service_office_id = so.id
      JOIN services s ON t.service_id = s.id
      WHERE 1=1
    `;
    const queueParams: any[] = [];

    if (officeFilter && officeFilter !== 'ALL') {
      queueSql += ` AND t.service_office_id = ?`;
      queueParams.push(parseInt(officeFilter));
    }
    if (statusFilter && statusFilter !== 'ALL') {
      queueSql += ` AND t.status = ?`;
      queueParams.push(statusFilter);
    }
    if (dateFilter) {
      queueSql += ` AND t.queue_date = ?`;
      queueParams.push(dateFilter);
    }

    queueSql += ` ORDER BY t.id DESC LIMIT 50`;
    const allTickets = await query<any[]>(queueSql, queueParams);

    // Appointment Monitor SQL query with dynamic filters
    let appSql = `
      SELECT a.*, d.name AS department_name, u.name AS student_name, u.email AS student_email, p.name AS professor_name
      FROM appointments a
      JOIN departments d ON a.department_id = d.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN professors p ON a.professor_id = p.id
      WHERE 1=1
    `;
    const appParams: any[] = [];

    if (deptFilter && deptFilter !== 'ALL') {
      appSql += ` AND a.department_id = ?`;
      appParams.push(parseInt(deptFilter));
    }
    if (statusFilter && statusFilter !== 'ALL') {
      appSql += ` AND a.status = ?`;
      appParams.push(statusFilter);
    }
    if (dateFilter) {
      appSql += ` AND a.appointment_date = ?`;
      appParams.push(dateFilter);
    }

    appSql += ` ORDER BY a.id DESC LIMIT 50`;
    const allAppointments = await query<any[]>(appSql, appParams);

    return NextResponse.json({
      stats: {
        totalUsers: userCountRows.count,
        ticketsToday: ticketTodayRows.count,
        activeTickets: activeTicketsRows.count,
        appointmentsToday: appointmentTodayRows.count,
      },
      officeStats,
      allTickets,
      allAppointments,
    });
  } catch (err: any) {
    console.error('Error fetching admin overview:', err);
    return NextResponse.json({ error: 'Failed to retrieve system overview.' }, { status: 500 });
  }
}
