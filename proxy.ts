import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  homeForRole,
  type Role,
} from "@/lib/session";
import { consumeRateLimit } from "@/lib/rateLimit";

const ROLE_PREFIX: Record<string, Role> = {
  "/admin": "admin",
  "/inspector": "inspector",
  "/portal": "cliente",
};

// 600 solicitudes/min por sesion (o por IP sin sesion), igual que QualityShield.
const API_LIMIT = { windowMs: 60 * 1000, max: 600 };

function matchRolePrefix(pathname: string): Role | null {
  for (const prefix of Object.keys(ROLE_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return ROLE_PREFIX[prefix];
    }
  }
  return null;
}

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith("/api/")) {
    const key = session ? `api:uid:${session.userId}` : `api:ip:${clientIp(req)}`;
    const { allowed, retryAfterSeconds } = consumeRateLimit(key, API_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(
        new URL(homeForRole(session.role), req.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? homeForRole(session.role) : "/login", req.url)
    );
  }

  const requiredRole = matchRolePrefix(pathname);
  if (requiredRole) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== requiredRole) {
      return NextResponse.redirect(new URL(homeForRole(session.role), req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/inspector/:path*",
    "/portal/:path*",
    "/api/:path*",
  ],
};
