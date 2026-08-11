import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const D_FIELDS = [
  "d1_team",
  "d2_problem_description",
  "d3_containment_actions",
  "d4_root_cause",
  "d5_corrective_actions",
  "d6_implementation",
  "d7_prevention",
  "d8_closure",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await query(
    `SELECT r.*, c.company_name AS client_name
     FROM car_reports r
     LEFT JOIN clients c ON c.id = r.client_id
     WHERE r.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "CAR no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ car: result.rows[0] });
}

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
  if (!body) {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const sets: string[] = [];
  const values: unknown[] = [];

  for (const field of D_FIELDS) {
    if (field in body) {
      values.push(body[field]);
      sets.push(`${field} = $${values.length}`);
    }
  }

  if (body.status && ["abierto", "en_proceso", "cerrado"].includes(body.status)) {
    values.push(body.status);
    sets.push(`status = $${values.length}`);
    if (body.status === "cerrado") {
      sets.push(`closed_at = now()`);
    } else {
      sets.push(`closed_at = NULL`);
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  values.push(id);
  const result = await query(
    `UPDATE car_reports SET ${sets.join(", ")} WHERE id = $${values.length}
     RETURNING id, car_number, status, closed_at`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "CAR no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ car: result.rows[0] });
}
