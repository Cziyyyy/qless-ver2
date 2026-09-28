import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Hashes
    const deptPassword = 'departmental123';
    const deptHash = await bcrypt.hash(deptPassword, 10);

    const staffPassword = 'staff123';
    const staffHash = await bcrypt.hash(staffPassword, 10);

    // 2. Department & Faculty Updates
    await query(
      `UPDATE users SET password_hash = ? WHERE LOWER(TRIM(email)) = 'prof.santos@mapua.edu.ph'`,
      [deptHash]
    );

    const deptResult: any = await query(
      `UPDATE users SET password_hash = ? WHERE role = 'DEPARTMENT_STAFF'`,
      [deptHash]
    );

    // 3. Service Staff Updates (Admissions, Registrar, Treasury)
    const staffResult: any = await query(
      `UPDATE users SET password_hash = ? WHERE role = 'SERVICE_STAFF'`,
      [staffHash]
    );

    // 4. Retrieve updated staff accounts with assigned offices
    const serviceStaffAccounts = await query<any[]>(
      `SELECT u.id, u.name, u.email, u.role, u.service_office_id, so.name AS office_name, so.prefix
       FROM users u
       LEFT JOIN service_offices so ON u.service_office_id = so.id
       WHERE u.role = 'SERVICE_STAFF'`
    );

    return NextResponse.json({
      success: true,
      message: 'All department faculty and service desk staff passwords successfully updated!',
      passwords: {
        departmentStaff: 'departmental123',
        serviceStaff: 'staff123',
      },
      counts: {
        departmentStaffUpdated: deptResult?.affectedRows || 0,
        serviceStaffUpdated: staffResult?.affectedRows || 0,
      },
      serviceStaffAccounts,
      facultyAccounts: [
        'prof.santos@mapua.edu.ph',
        'departmental@mapua.edu.ph',
        'engr.delacruz@mapua.edu.ph',
        'dr.reyes@mapua.edu.ph',
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}