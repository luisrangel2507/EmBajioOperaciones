import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { QUALITY_CATEGORIES, isQualityCategory, type QualityCategory } from "@/lib/qualityCategories";

async function nextRecordNumber(category: QualityCategory) {
  const prefix = QUALITY_CATEGORIES[category].prefix;
  const year = new Date().getFullYear();
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM quality_records WHERE record_number LIKE $1`,
    [`${prefix}-${year}-%`]
  );
  const seq = Number(result.rows[0].count) + 1;
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  if (!category || !isQualityCategory(category)) {
    return NextResponse.json({ error: "Categoria invalida" }, { status: 400 });
  }

  const result = await query(
    `SELECT r.id, r.record_number, r.title, r.part_name, r.part_number, r.description,
            r.status, r.severity, r.occurrence, r.detection, r.due_date, r.created_at,
            c.id AS client_id, c.company_name AS client_name
     FROM quality_records r
     LEFT JOIN clients c ON c.id = r.client_id
     WHERE r.category = $1
     ORDER BY r.created_at DESC`,
    [category]
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
    category,
    title,
    client_id,
    part_name,
    part_number,
    description,
    severity,
    occurrence,
    detection,
    due_date,
  } = body ?? {};

  if (!category || !isQualityCategory(category)) {
    return NextResponse.json({ error: "Categoria invalida" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "El titulo es requerido" }, { status: 400 });
  }

  const recordNumber = await nextRecordNumber(category);
  const result = await query(
    `INSERT INTO quality_records
      (category, record_number, title, client_id, part_name, part_number, description,
       severity, occurrence, detection, due_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id, record_number`,
    [
      category,
      recordNumber,
      title,
      client_id || null,
      part_name || null,
      part_number || null,
      description || null,
      severity || null,
      occurrence || null,
      detection || null,
      due_date || null,
      session.userId,
    ]
  );

  return NextResponse.json({ record: result.rows[0] }, { status: 201 });
}
