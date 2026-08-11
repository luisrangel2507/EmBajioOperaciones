import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const VALID_STATUSES = ["activo", "en_revision", "obsoleto"];

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
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Estatus invalido" }, { status: 400 });
  }

  const result = await query(
    `UPDATE quality_records SET status = $1 WHERE id = $2 RETURNING id, status`,
    [body.status, id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ record: result.rows[0] });
}
