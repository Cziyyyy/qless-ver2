import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const offices = await query(`SELECT * FROM service_offices`);
    const staff = await query(
      `SELECT id, name, email, role, service_office_id FROM users WHERE role IN ('SERVICE_STAFF', 'ADMIN')`
    );

    return NextResponse.json({
      offices,
      staff,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}