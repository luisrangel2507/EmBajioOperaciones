import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  if (!from) {
    return NextResponse.json({ error: "Parametro 'from' requerido" }, { status: 400 });
  }

  const result = await query(
    `SELECT plan_date, planned_pieces, planned_minutes
     FROM production_plans
     WHERE plan_date >= $1
     ORDER BY plan_date`,
    [from]
  );

  return NextResponse.json({ plans: result.rows });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { plan_date, planned_pieces, planned_minutes } = body ?? {};

  if (!plan_date) {
    return NextResponse.json({ error: "plan_date requerido" }, { status: 400 });
  }
  const pieces = Number(planned_pieces);
  const minutes = Number(planned_minutes);
  if (!Number.isFinite(pieces) || pieces < 0 || !Number.isFinite(minutes) || minutes < 0) {
    return NextResponse.json({ error: "Valores invalidos" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO production_plans (plan_date, planned_pieces, planned_minutes, created_by, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (plan_date)
     DO UPDATE SET planned_pieces = $2, planned_minutes = $3, updated_at = now()
     RETURNING plan_date, planned_pieces, planned_minutes`,
    [plan_date, pieces, minutes, session.userId]
  );

  return NextResponse.json({ plan: result.rows[0] });
}
