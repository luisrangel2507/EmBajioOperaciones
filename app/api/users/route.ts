import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";

const VALID_ROLES = ["admin", "inspector", "cliente"];

export async function GET() {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.active, u.created_at,
            u.client_id, c.company_name AS client_name
     FROM users u
     LEFT JOIN clients c ON c.id = u.client_id
     ORDER BY u.role, u.name`
  );

  return NextResponse.json({ users: result.rows });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, email, password, role, client_id } = body ?? {};

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Nombre, correo, contrasena y rol son requeridos" },
      { status: 400 }
    );
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol invalido" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contrasena debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }
  if (role === "cliente" && !client_id) {
    return NextResponse.json(
      { error: "Selecciona el cliente al que pertenece este usuario" },
      { status: 400 }
    );
  }

  const existing = await query(`SELECT id FROM users WHERE email = $1`, [
    email.toLowerCase().trim(),
  ]);
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese correo" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, client_id, active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, name, email, role, client_id, active, created_at`,
    [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      role,
      role === "cliente" ? client_id : null,
    ]
  );

  return NextResponse.json({ user: result.rows[0] }, { status: 201 });
}
