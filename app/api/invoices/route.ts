import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE $1`,
    [`FAC-${year}-%`]
  );
  const seq = Number(result.rows[0].count) + 1;
  return `FAC-${year}-${String(seq).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("client_id");

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (status && ["pendiente", "pagada", "vencida"].includes(status)) {
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }
  if (clientId) {
    params.push(Number(clientId));
    conditions.push(`i.client_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT i.id, i.invoice_number, i.amount, i.status, i.issued_at, i.due_date, i.paid_at,
            c.id AS client_id, c.company_name AS client_name,
            o.id AS order_id, o.order_number
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     LEFT JOIN inspection_orders o ON o.id = i.order_id
     ${where}
     ORDER BY i.issued_at DESC`,
    params
  );

  return NextResponse.json({ invoices: result.rows });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { client_id, order_id, amount, due_date } = body ?? {};

  if (!client_id) {
    return NextResponse.json({ error: "El cliente es requerido" }, { status: 400 });
  }
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Monto invalido" }, { status: 400 });
  }

  const invoiceNumber = await nextInvoiceNumber();
  const result = await query(
    `INSERT INTO invoices (invoice_number, client_id, order_id, amount, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, invoice_number, issued_at`,
    [invoiceNumber, client_id, order_id || null, amountNum, due_date || null]
  );

  return NextResponse.json({ invoice: result.rows[0] }, { status: 201 });
}
