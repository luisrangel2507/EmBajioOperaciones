import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await query(
    `SELECT id, process_step, characteristic, specification, control_method,
            sample_size, frequency, reaction_plan
     FROM control_plan_items
     WHERE control_plan_id = $1
     ORDER BY sort_order`,
    [id]
  );

  return NextResponse.json({ items: result.rows });
}
