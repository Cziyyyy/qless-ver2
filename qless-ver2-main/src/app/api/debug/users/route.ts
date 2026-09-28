import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Get column structure
    const columns = await query<any[]>(`DESCRIBE users`);

    // 2. Get existing accounts (excluding password hashes for cleanliness)
    const userList = await query<any[]>(
      `SELECT id, name, email, role, student_number, department_id, service_office_id FROM users`
    );

    return NextResponse.json({
      columns,
      totalUsers: userList.length,
      users: userList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}