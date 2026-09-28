import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { qrData } = await req.json();

    if (!qrData || typeof qrData !== 'string') {
      return NextResponse.json({ error: 'QR Code data is required.' }, { status: 400 });
    }

    const trimmed = qrData.trim();
    let email = '';
    let studentNumber = '';

    // 1. Check if JSON payload (e.g. {"type":"QLESS_STUDENT_LOGIN","email":"...","studentNumber":"..."})
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        email = parsed.email || parsed.studentEmail || '';
        studentNumber = parsed.studentNumber || parsed.student_number || parsed.idNumber || '';
      } catch (e) {
        // invalid json, fallback to string matching
      }
    }

    // 2. If payload format is "STUDENT:<email_or_number>"
    if (!email && !studentNumber && trimmed.toUpperCase().startsWith('STUDENT:')) {
      const parts = trimmed.split(':');
      const val = parts[1]?.trim();
      if (val?.includes('@')) {
        email = val;
      } else {
        studentNumber = val;
      }
    }

    // 3. Fallback: if trimmed looks like email or student number directly
    if (!email && !studentNumber) {
      if (trimmed.includes('@')) {
        email = trimmed;
      } else {
        studentNumber = trimmed;
      }
    }

    if (!email && !studentNumber) {
      return NextResponse.json({ error: 'Unrecognized Student QR Code format.' }, { status: 400 });
    }

    // Query user by email or student_number
    let users: any[] = [];
    if (email && studentNumber) {
      users = await query<any[]>(
        `SELECT * FROM users WHERE (LOWER(email) = LOWER(?) OR student_number = ?) AND role = 'STUDENT' LIMIT 1`,
        [email, studentNumber]
      );
    } else if (email) {
      users = await query<any[]>(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role = 'STUDENT' LIMIT 1`,
        [email]
      );
    } else {
      users = await query<any[]>(
        `SELECT * FROM users WHERE student_number = ? AND role = 'STUDENT' LIMIT 1`,
        [studentNumber]
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No active student account found for this QR code.' },
        { status: 404 }
      );
    }

    const user = users[0];

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentNumber: user.student_number || null,
      departmentId: user.department_id || null,
      serviceOfficeId: user.service_office_id || null,
    };

    const token = signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: sessionPayload,
    });

    response.cookies.set('qless_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (err: any) {
    console.error('QR Login Error:', err);
    return NextResponse.json({ error: 'Server error processing QR login.' }, { status: 500 });
  }
}
