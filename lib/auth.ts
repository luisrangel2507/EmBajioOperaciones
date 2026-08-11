import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
  homeForRole,
  type Role,
  type SessionPayload,
} from "@/lib/session";

export type { Role, SessionPayload };
export { homeForRole, createSessionToken, verifySessionToken, SESSION_COOKIE_NAME };

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  client_id: number | null;
  active: boolean;
  password_hash: string;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await query<AuthUser>(
    `SELECT id, name, email, role, client_id, active, password_hash
     FROM users WHERE email = $1 LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  return result.rows[0] ?? null;
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    return null;
  }
  return session;
}
