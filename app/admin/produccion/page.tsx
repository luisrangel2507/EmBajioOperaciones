import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNav";
import AppShell from "@/components/AppShell";
import RotationGrid from "@/components/RotationGrid";
import OeeDashboard, { type OeeDayRow } from "@/components/OeeDashboard";
import OrdersDashboard, { type OrderRow } from "@/components/OrdersDashboard";
import ScrapPanel, { type ScrapRow } from "@/components/ScrapPanel";

const SCRAP_DAYS = 30;

interface OptionRow {
  id: number;
  name: string;
}

const OEE_DAYS = 14;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function dateKey(value: string | Date) {
  return value instanceof Date ? isoDate(value) : value.slice(0, 10);
}

function minutesBetween(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
}

export default async function ProduccionPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const rangeStart = daysAgo(OEE_DAYS - 1);

  const [inspectorsRes, clientsRes, ordersRes, plansRes, shiftsRes, resultsRes, scrapRes] =
    await Promise.all([
    query<OptionRow>(
      `SELECT id, name FROM users WHERE role = 'inspector' AND active ORDER BY name`
    ),
    query<OptionRow>(
      `SELECT id, company_name AS name FROM clients ORDER BY company_name`
    ),
    query<OrderRow>(
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
       WHERE o.status IN ('pendiente', 'en_proceso')
       ORDER BY o.created_at DESC`
    ),
    query<{ plan_date: string | Date; planned_pieces: number; planned_minutes: number }>(
      `SELECT plan_date, planned_pieces, planned_minutes
       FROM production_plans
       WHERE plan_date >= $1
       ORDER BY plan_date`,
      [isoDate(rangeStart)]
    ),
    query<{
      shift_date: string | Date;
      start_time: string | null;
      end_time: string | null;
      pieces_inspected: number;
    }>(
      `SELECT shift_date, start_time, end_time, pieces_inspected
       FROM shifts
       WHERE shift_date >= $1`,
      [isoDate(rangeStart)]
    ),
    query<{ day: string | Date; ok: string; ng: string }>(
      `SELECT DATE(inspected_at) AS day,
              COALESCE(SUM(pieces_ok), 0) AS ok,
              COALESCE(SUM(pieces_ng), 0) AS ng
       FROM inspection_results
       WHERE inspected_at >= $1
       GROUP BY DATE(inspected_at)`,
      [isoDate(rangeStart)]
    ),
    query<ScrapRow>(
      `SELECT s.id, s.scrap_date, s.part_name, s.part_number, s.station_num,
              s.operation, s.quantity, s.reason, s.notes, s.created_at,
              c.id AS client_id, c.company_name AS client_name
       FROM scrap_records s
       LEFT JOIN clients c ON c.id = s.client_id
       WHERE s.scrap_date >= $1
       ORDER BY s.scrap_date DESC, s.created_at DESC`,
      [isoDate(daysAgo(SCRAP_DAYS - 1))]
    ),
  ]);

  const plansMap = new Map(
    plansRes.rows.map((p) => [
      dateKey(p.plan_date),
      { pieces: p.planned_pieces, minutes: p.planned_minutes },
    ])
  );

  const actualByDay = new Map<string, { pieces: number; minutes: number }>();
  for (const s of shiftsRes.rows) {
    const key = dateKey(s.shift_date);
    const prev = actualByDay.get(key) ?? { pieces: 0, minutes: 0 };
    prev.pieces += s.pieces_inspected;
    prev.minutes += minutesBetween(s.start_time, s.end_time);
    actualByDay.set(key, prev);
  }

  const qualityByDay = new Map(
    resultsRes.rows.map((r) => [dateKey(r.day), { ok: Number(r.ok), ng: Number(r.ng) }])
  );

  const days: OeeDayRow[] = Array.from({ length: OEE_DAYS }, (_, i) => {
    const d = daysAgo(OEE_DAYS - 1 - i);
    const key = isoDate(d);
    const plan = plansMap.get(key);
    const actual = actualByDay.get(key);
    const quality = qualityByDay.get(key);
    return {
      date: key,
      label: d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }),
      plannedPieces: plan?.pieces ?? 0,
      plannedMinutes: plan?.minutes ?? 0,
      actualPieces: actual?.pieces ?? 0,
      actualMinutes: actual?.minutes ?? 0,
      piecesOk: quality?.ok ?? 0,
      piecesNg: quality?.ng ?? 0,
    };
  });

  return (
    <AppShell
      title="Produccion"
      roleLabel="Administrador"
      role="admin"
      userName={session.name}
      navItems={ADMIN_NAV_ITEMS}
    >
      <div className="space-y-8">
        <OeeDashboard initialDays={days} />

        <div>
          <h2 className="mb-1 text-sm font-bold tracking-wide text-ink-700 uppercase">
            📦 Ordenes en produccion
          </h2>
          <p className="text-xs text-ink-500/60">
            Ordenes pendientes o en proceso. Puedes cargar una nueva orden directamente desde
            aqui.
          </p>
        </div>
        <OrdersDashboard
          initialOrders={ordersRes.rows}
          clients={clientsRes.rows}
          inspectors={inspectorsRes.rows}
          defaultStatus="pendiente,en_proceso"
        />

        <div>
          <h2 className="mb-1 text-sm font-bold tracking-wide text-ink-700 uppercase">
            🗑️ Desechos / Scrap
          </h2>
          <p className="text-xs text-ink-500/60">
            Registra piezas desechadas por estacion y motivo. Ultimos {SCRAP_DAYS} dias.
          </p>
        </div>
        <ScrapPanel initialRecords={scrapRes.rows} clients={clientsRes.rows} />

        <div>
          <h2 className="mb-1 text-sm font-bold tracking-wide text-ink-700 uppercase">
            🔄 Rotacion de estaciones
          </h2>
          <p className="text-xs text-ink-500/60">
            Asigna que inspector cubre cada estacion por horario. Los cambios se guardan
            automaticamente.
          </p>
        </div>
        <RotationGrid inspectors={inspectorsRes.rows} />
      </div>
    </AppShell>
  );
}
