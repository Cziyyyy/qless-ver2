import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password, studentNumber } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Domain validation: Student registration must use @mymail.mapua.edu.ph
    if (!cleanEmail.endsWith('@mymail.mapua.edu.ph')) {
      return NextResponse.json(
        { error: 'Student registration requires an official Mapúa student email (@mymail.mapua.edu.ph).' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [cleanEmail]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const result = await query<any>(
      `INSERT INTO users (name, email, password_hash, role, student_number) VALUES (?, ?, ?, 'STUDENT', ?)`,
      [name.trim(), cleanEmail, hashedPassword, studentNumber ? studentNumber.trim() : null]
    );

    const sessionPayload = {
      id: result.insertId,
      name: name.trim(),
      email: cleanEmail,
      role: 'STUDENT' as const,
      studentNumber: studentNumber ? studentNumber.trim() : null,
    };

    const token = signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set('qless_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Failed to create student account.' }, { status: 500 });
  }
}
