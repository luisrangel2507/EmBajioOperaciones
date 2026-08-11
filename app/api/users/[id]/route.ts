import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "Campo active requerido" }, { status: 400 });
  }
  if (Number(id) === session.userId && body.active === false) {
    return NextResponse.json(
      { error: "No puedes desactivar tu propia cuenta" },
      { status: 400 }
    );
  }

  const result = await query(
    `UPDATE users SET active = $1 WHERE id = $2
     RETURNING id, name, email, role, client_id, active, created_at`,
    [body.active, id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user: result.rows[0] });
}
