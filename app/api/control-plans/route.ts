import { NextRequest, NextResponse } from "next/server";
import { query, pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";

async function nextPlanNumber() {
  const year = new Date().getFullYear();
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM control_plans WHERE plan_number LIKE $1`,
    [`PC-${year}-%`]
  );
  const seq = Number(result.rows[0].count) + 1;
  return `PC-${year}-${String(seq).padStart(4, "0")}`;
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await query(
    `SELECT p.id, p.plan_number, p.part_name, p.part_number, p.revision, p.created_at,
            c.id AS client_id, c.company_name AS client_name,
            COALESCE(i.item_count, 0) AS item_count
     FROM control_plans p
     LEFT JOIN clients c ON c.id = p.client_id
     LEFT JOIN (
        SELECT control_plan_id, COUNT(*) AS item_count
        FROM control_plan_items
        GROUP BY control_plan_id
     ) i ON i.control_plan_id = p.id
     ORDER BY p.created_at DESC`
  );

  return NextResponse.json({ plans: result.rows });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { part_name, part_number, client_id, revision, items } = body ?? {};

  if (!part_name || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Pieza y al menos una caracteristica son requeridas" },
      { status: 400 }
    );
  }
  for (const item of items) {
    if (!item.characteristic) {
      return NextResponse.json(
        { error: "Cada caracteristica requiere un nombre" },
        { status: 400 }
      );
    }
  }

  const planNumber = await nextPlanNumber();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const planResult = await client.query(
      `INSERT INTO control_plans (plan_number, part_name, part_number, client_id, revision, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, plan_number`,
      [
        planNumber,
        part_name,
        part_number || null,
        client_id || null,
        revision || "A",
        session.userId,
      ]
    );
    const plan = planResult.rows[0] as { id: number; plan_number: string };

    let sortOrder = 0;
    for (const item of items) {
      await client.query(
        `INSERT INTO control_plan_items
          (control_plan_id, process_step, characteristic, specification, control_method, sample_size, frequency, reaction_plan, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          plan.id,
          item.process_step || null,
          item.characteristic,
          item.specification || null,
          item.control_method || null,
          item.sample_size || null,
          item.frequency || null,
          item.reaction_plan || null,
          sortOrder++,
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
