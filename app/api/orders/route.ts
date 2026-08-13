import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const VALID_STATUSES = ["pendiente", "en_proceso", "completada", "cancelada"];

export async function GET(req: NextRequest) {
  const session = await requireRole("admin", "inspector");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("client_id");

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (session.role === "inspector") {
    params.push(session.userId);
    conditions.push(`o.assigned_inspector_id = $${params.length}`);
  }

  if (status) {
    const statuses = status.split(",").filter((s) => VALID_STATUSES.includes(s));
    if (statuses.length === 1) {
      params.push(statuses[0]);
      conditions.push(`o.status = $${params.length}`);
    } else if (statuses.length > 1) {
      params.push(statuses);
      conditions.push(`o.status = ANY($${params.length})`);
    }
  }

  if (clientId) {
    params.push(Number(clientId));
    conditions.push(`o.client_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT
        o.id, o.order_number, o.part_name, o.part_number, o.lot_number,
        o.total_pieces, o.defect_criteria, o.status, o.due_date,
        o.created_at, o.completed_at,
        c.id AS client_id, c.company_name AS client_name,
        u.id AS inspector_id, u.name AS inspector_name,
        COALESCE(r.pieces_ok, 0) AS pieces_ok,
        COALESCE(r.pieces_ng, 0) AS pieces_ng
     FROM inspection_orders o
     LEFT JOIN clients c ON c.id = o.client_id
     LEFT JOIN users u ON u.id = o.assigned_inspector_id
     LEFT JOIN (
        SELECT order_id, SUM(pieces_ok) AS pieces_ok, SUM(pieces_ng) AS pieces_ng
        FROM inspection_results
        GROUP BY order_id
     ) r ON r.order_id = o.id
     ${where}
     ORDER BY o.created_at DESC`,
    params
  );

  return NextResponse.json({ orders: result.rows });
}

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM inspection_orders WHERE order_number LIKE $1`,
    [`OI-${year}-%`]
  );
  const seq = Number(result.rows[0].count) + 1;
  return `OI-${year}-${String(seq).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const {
    client_id,
    part_name,
    part_number,
    lot_number,
    total_pieces,
    defect_criteria,
    due_date,
    assigned_inspector_id,
  } = body;

  if (!client_id || !part_name || !total_pieces || Number(total_pieces) <= 0) {
    return NextResponse.json(
      { error: "Cliente, pieza y cantidad total son requeridos" },
      { status: 400 }
    );
  }

  const orderNumber = await nextOrderNumber();

  const result = await query(
    `INSERT INTO inspection_orders
      (order_number, client_id, part_name, part_number, lot_number, total_pieces,
       defect_criteria, due_date, assigned_inspector_id, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendiente')
     RETURNING id, order_number`,
    [
      orderNumber,
      client_id,
      part_name,
      part_number || null,
      lot_number || null,
      Number(total_pieces),
      defect_criteria || null,
      due_date || null,
      assigned_inspector_id || null,
      session.userId,
    ]
  );

  const order = result.rows[0] as { id: number; order_number: string };

  await query(
    `INSERT INTO lot_tracking (order_id, location, status, moved_by)
     VALUES ($1, 'Recepcion', 'recibido', $2)`,
    [order.id, session.userId]
  );

  return NextResponse.json({ order }, { status: 201 });
}
