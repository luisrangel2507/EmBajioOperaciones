import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  homeForRole,
  type Role,
} from "@/lib/session";

const ROLE_PREFIX: Record<string, Role> = {
  "/admin": "admin",
  "/inspector": "inspector",
  "/portal": "cliente",
};

function matchRolePrefix(pathname: string): Role | null {
  for (const prefix of Object.keys(ROLE_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return ROLE_PREFIX[prefix];
    }
  }
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

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
  matcher: ["/", "/login", "/admin/:path*", "/inspector/:path*", "/portal/:path*"],
};
