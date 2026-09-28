import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    let schema: any[] = [];
    let rows: any[] = [];

    try {
      schema = await query(`DESCRIBE appointments`);
      rows = await query(`SELECT * FROM appointments ORDER BY id DESC LIMIT 10`);
    } catch (e: any) {
      // If appointments is a view or not named appointments, check queue_tickets
      const tickets = await query(`SELECT id, queue_number, status, service_office_id FROM queue_tickets ORDER BY id DESC LIMIT 10`);
      return NextResponse.json({ appointmentsError: e.message, tickets });
    }

    return NextResponse.json({
      schema,
      sampleRows: rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}