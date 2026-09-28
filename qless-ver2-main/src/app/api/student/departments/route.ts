import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const departments = await query<any[]>(
      `SELECT id, name, code, description FROM departments WHERE status = 'ACTIVE' ORDER BY name ASC`
    );

    const professors = await query<any[]>(
      `SELECT id, department_id, name, specialization, email FROM professors WHERE status = 'ACTIVE' ORDER BY name ASC`
    );

    const result = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      description: dept.description,
      professors: professors
        .filter((p) => p.department_id === dept.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          specialization: p.specialization,
          email: p.email,
        })),
    }));

    return NextResponse.json({ departments: result });
  } catch (err: any) {
    console.error('Error fetching departments & professors:', err);
    return NextResponse.json({ error: 'Failed to load department data.' }, { status: 500 });
  }
}
