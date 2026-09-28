import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');

    if (entity === 'users') {
      const users = await query<any[]>(
        `SELECT u.id, u.name, u.email, u.role, u.student_number, u.department_id, u.service_office_id, u.created_at,
                d.name AS department_name, so.name AS service_office_name
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         LEFT JOIN service_offices so ON u.service_office_id = so.id
         ORDER BY u.id DESC`
      );
      return NextResponse.json({ users });
    }

    if (entity === 'departments') {
      const departments = await query<any[]>(`SELECT * FROM departments ORDER BY id ASC`);
      return NextResponse.json({ departments });
    }

    if (entity === 'professors') {
      const professors = await query<any[]>(
        `SELECT p.*, d.name AS department_name FROM professors p JOIN departments d ON p.department_id = d.id ORDER BY p.id ASC`
      );
      return NextResponse.json({ professors });
    }

    if (entity === 'offices') {
      const offices = await query<any[]>(`SELECT * FROM service_offices ORDER BY id ASC`);
      return NextResponse.json({ offices });
    }

    if (entity === 'services') {
      const services = await query<any[]>(
        `SELECT s.*, so.name AS office_name FROM services s JOIN service_offices so ON s.service_office_id = so.id ORDER BY s.id ASC`
      );
      return NextResponse.json({ services });
    }

    return NextResponse.json({ error: 'Invalid entity type requested.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error fetching admin entity:', err);
    return NextResponse.json({ error: 'Failed to retrieve data.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { entity, action, data } = await req.json();

    if (entity === 'users') {
      if (action === 'CREATE') {
        const { name, email, password, role, studentNumber, departmentId, serviceOfficeId } = data;
        const hashedPassword = await hashPassword(password || 'password123');
        await query(
          `INSERT INTO users (name, email, password_hash, role, student_number, department_id, service_office_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, email.toLowerCase().trim(), hashedPassword, role, studentNumber || null, departmentId || null, serviceOfficeId || null]
        );
        return NextResponse.json({ success: true, message: 'User created.' });
      }
      if (action === 'UPDATE') {
        const { id, name, email, role, studentNumber, departmentId, serviceOfficeId } = data;
        await query(
          `UPDATE users SET name = ?, email = ?, role = ?, student_number = ?, department_id = ?, service_office_id = ? WHERE id = ?`,
          [name, email.toLowerCase().trim(), role, studentNumber || null, departmentId || null, serviceOfficeId || null, id]
        );
        return NextResponse.json({ success: true, message: 'User updated.' });
      }
      if (action === 'DELETE') {
        await query(`DELETE FROM users WHERE id = ?`, [data.id]);
        return NextResponse.json({ success: true, message: 'User deleted.' });
      }
    }

    if (entity === 'departments') {
      if (action === 'CREATE') {
        await query(`INSERT INTO departments (name, code, description, status) VALUES (?, ?, ?, ?)`, [
          data.name,
          data.code.toUpperCase().trim(),
          data.description || null,
          data.status || 'ACTIVE',
        ]);
        return NextResponse.json({ success: true, message: 'Department created.' });
      }
      if (action === 'UPDATE') {
        await query(`UPDATE departments SET name = ?, code = ?, description = ?, status = ? WHERE id = ?`, [
          data.name,
          data.code.toUpperCase().trim(),
          data.description || null,
          data.status,
          data.id,
        ]);
        return NextResponse.json({ success: true, message: 'Department updated.' });
      }
    }

    if (entity === 'professors') {
      if (action === 'CREATE') {
        await query(`INSERT INTO professors (department_id, name, email, specialization, status) VALUES (?, ?, ?, ?, ?)`, [
          data.departmentId,
          data.name,
          data.email || null,
          data.specialization || null,
          data.status || 'ACTIVE',
        ]);
        return NextResponse.json({ success: true, message: 'Professor added.' });
      }
      if (action === 'UPDATE') {
        await query(`UPDATE professors SET department_id = ?, name = ?, email = ?, specialization = ?, status = ? WHERE id = ?`, [
          data.departmentId,
          data.name,
          data.email || null,
          data.specialization || null,
          data.status,
          data.id,
        ]);
        return NextResponse.json({ success: true, message: 'Professor updated.' });
      }
    }

    if (entity === 'offices') {
      if (action === 'CREATE') {
        await query(`INSERT INTO service_offices (name, prefix, description, icon_name, status) VALUES (?, ?, ?, ?, ?)`, [
          data.name,
          data.prefix.toUpperCase().trim(),
          data.description || null,
          data.iconName || 'Building2',
          data.status || 'ACTIVE',
        ]);
        return NextResponse.json({ success: true, message: 'Service office created.' });
      }
      if (action === 'UPDATE') {
        await query(`UPDATE service_offices SET name = ?, prefix = ?, description = ?, icon_name = ?, status = ? WHERE id = ?`, [
          data.name,
          data.prefix.toUpperCase().trim(),
          data.description || null,
          data.iconName || 'Building2',
          data.status,
          data.id,
        ]);
        return NextResponse.json({ success: true, message: 'Service office updated.' });
      }
    }

    if (entity === 'services') {
      if (action === 'CREATE') {
        await query(`INSERT INTO services (service_office_id, name, parent_id, estimated_minutes, status) VALUES (?, ?, ?, ?, ?)`, [
          data.serviceOfficeId,
          data.name,
          data.parentId || null,
          data.estimatedMinutes || 15,
          data.status || 'ACTIVE',
        ]);
        return NextResponse.json({ success: true, message: 'Service created.' });
      }
      if (action === 'UPDATE') {
        await query(`UPDATE services SET service_office_id = ?, name = ?, parent_id = ?, estimated_minutes = ?, status = ? WHERE id = ?`, [
          data.serviceOfficeId,
          data.name,
          data.parentId || null,
          data.estimatedMinutes || 15,
          data.status,
          data.id,
        ]);
        return NextResponse.json({ success: true, message: 'Service updated.' });
      }
    }

    return NextResponse.json({ error: 'Unsupported entity or action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error handling admin CRUD action:', err);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
