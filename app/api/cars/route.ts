import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

async function nextCarNumber() {
  const year = new Date().getFullYear();
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM car_reports WHERE car_number LIKE $1`,
    [`CAR-${year}-%`]
  );
  const seq = Number(result.rows[0].count) + 1;
  return `CAR-${year}-${String(seq).padStart(4, "0")}`;
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await query(
    `SELECT r.id, r.car_number, r.part_name, r.part_number, r.problem_summary,
            r.status, r.opened_at, r.closed_at,
            c.id AS client_id, c.company_name AS client_name
     FROM car_reports r
     LEFT JOIN clients c ON c.id = r.client_id
     ORDER BY r.opened_at DESC`
  );

  return NextResponse.json({ cars: result.rows });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { client_id, part_name, part_number, problem_summary } = body ?? {};

  if (!problem_summary) {
    return NextResponse.json(
      { error: "La descripcion del problema es requerida" },
      { status: 400 }
    );
  }

  const carNumber = await nextCarNumber();
  const result = await query(
    `INSERT INTO car_reports (car_number, client_id, part_name, part_number, problem_summary, status, opened_by)
     VALUES ($1, $2, $3, $4, $5, 'abierto', $6)
     RETURNING id, car_number`,
    [carNumber, client_id || null, part_name || null, part_number || null, problem_summary, session.userId]
  );

  return NextResponse.json({ car: result.rows[0] }, { status: 201 });
}
