import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { SCRAP_REASONS } from "@/lib/scrapReasons";

export async function GET(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (from) {
    params.push(from);
    conditions.push(`s.scrap_date >= $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT s.id, s.scrap_date, s.part_name, s.part_number, s.station_num,
            s.operation, s.quantity, s.reason, s.notes, s.created_at,
            c.id AS client_id, c.company_name AS client_name,
            o.id AS order_id, o.order_number, o.total_pieces AS order_total_pieces
     FROM scrap_records s
     LEFT JOIN clients c ON c.id = s.client_id
     LEFT JOIN inspection_orders o ON o.id = s.order_id
     ${where}
     ORDER BY s.scrap_date DESC, s.created_at DESC`,
    params
  );

  return NextResponse.json({ records: result.rows });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const {
    scrap_date,
    part_name,
    part_number,
    station_num,
    operation,
    quantity,
    reason,
    notes,
    client_id,
    order_id,
  } = body ?? {};

  if (!part_name) {
    return NextResponse.json({ error: "La pieza es requerida" }, { status: 400 });
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return NextResponse.json({ error: "Cantidad invalida" }, { status: 400 });
  }
  if (!reason || !SCRAP_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Motivo invalido" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO scrap_records
      (scrap_date, part_name, part_number, station_num, operation, quantity, reason, notes, client_id, order_id, created_by)
     VALUES (COALESCE($1, CURRENT_DATE), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      scrap_date || null,
      part_name,
      part_number || null,
      station_num ? Number(station_num) : null,
      operation || null,
      qty,
      reason,
      notes || null,
      client_id || null,
      order_id || null,
      session.userId,
    ]
  );

  return NextResponse.json({ record: result.rows[0] }, { status: 201 });
}
