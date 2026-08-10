import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  homeForRole,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Correo y contrasena son requeridos" },
      { status: 400 }
    );
  }

  let user;
  try {
    user = await findUserByEmail(email);
  } catch (err) {
    console.error("Error de conexion a la base de datos:", err);
    return NextResponse.json(
      { error: "No se pudo conectar a la base de datos. Revisa DATABASE_URL." },
      { status: 500 }
    );
  }

  if (!user || !user.active) {
    return NextResponse.json(
      { error: "Credenciales invalidas" },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Credenciales invalidas" },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    clientId: user.client_id,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    role: user.role,
    redirectTo: homeForRole(user.role),
  });
}
