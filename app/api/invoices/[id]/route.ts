import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const VALID_STATUSES = ["pendiente", "pagada", "vencida"];

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
    `UPDATE invoices
     SET status = $1::varchar, paid_at = CASE WHEN $1::varchar = 'pagada' THEN now() ELSE NULL END
     WHERE id = $2
     RETURNING id, status, paid_at`,
    [body.status, id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ invoice: result.rows[0] });
}
