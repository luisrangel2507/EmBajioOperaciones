import { SignJWT, jwtVerify } from "jose";

export type Role = "admin" | "inspector" | "cliente";

export interface SessionPayload {
  userId: number;
  name: string;
  email: string;
  role: Role;
  clientId: number | null;
  [key: string]: unknown;
}

export const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no esta configurado");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function homeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "inspector") return "/inspector";
  return "/portal";
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
