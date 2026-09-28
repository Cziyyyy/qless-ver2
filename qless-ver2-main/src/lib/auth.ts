import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'qless_mapua_super_secret_jwt_key_2026';

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'SERVICE_STAFF' | 'DEPARTMENT_STAFF' | 'ADMIN';
  studentNumber?: string | null;
  departmentId?: number | null;
  serviceOfficeId?: number | null;
}

export function signToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('qless_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
