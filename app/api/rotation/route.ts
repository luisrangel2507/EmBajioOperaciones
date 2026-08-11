import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week");
  if (!week) {
    return NextResponse.json({ error: "Parametro week requerido" }, { status: 400 });
  }

  const result = await query(
    `SELECT r.day_of_week, r.time_slot, r.station_num, r.inspector_id, u.name AS inspector_name
     FROM station_rotations r
     LEFT JOIN users u ON u.id = r.inspector_id
     WHERE r.week_start = $1`,
    [week]
  );

  return NextResponse.json({ rows: result.rows });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { week_start, day_of_week, time_slot, station_num, inspector_id } = body ?? {};

  if (
    !week_start ||
    day_of_week === undefined ||
    !time_slot ||
    station_num === undefined
  ) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (!inspector_id) {
    await query(
      `DELETE FROM station_rotations
       WHERE week_start = $1 AND day_of_week = $2 AND time_slot = $3 AND station_num = $4`,
      [week_start, day_of_week, time_slot, station_num]
    );
    return NextResponse.json({ ok: true });
  }

  await query(
    `INSERT INTO station_rotations (week_start, day_of_week, time_slot, station_num, inspector_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (week_start, day_of_week, time_slot, station_num)
     DO UPDATE SET inspector_id = $5, updated_at = now()`,
    [week_start, day_of_week, time_slot, station_num, inspector_id]
  );

  return NextResponse.json({ ok: true });
}
