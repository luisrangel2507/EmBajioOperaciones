import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNav";
import AppShell from "@/components/AppShell";

interface ShiftRow {
  id: number;
  inspector_id: number;
  inspector_name: string;
  shift_date: string | Date;
  start_time: string | null;
  end_time: string | null;
  pieces_inspected: number;
}

interface InspectorRow {
  id: number;
  name: string;
}

function hoursBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return minutes / 60;
}

function formatTime(value: string | null) {
  if (!value) return "-";
  return value.slice(0, 5);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shiftDateKey(value: string | Date) {
  return value instanceof Date ? isoDate(value) : value.slice(0, 10);
}

export default async function RhPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 6);

  const [shiftsRes, inspectorsRes] = await Promise.all([
    query<ShiftRow>(
      `SELECT s.id, s.inspector_id, u.name AS inspector_name, s.shift_date,
              s.start_time, s.end_time, s.pieces_inspected
       FROM shifts s
       JOIN users u ON u.id = s.inspector_id
       WHERE s.shift_date >= $1
       ORDER BY s.shift_date DESC, s.start_time ASC NULLS LAST`,
      [isoDate(rangeStart)],
    ),
    query<InspectorRow>(
      `SELECT id, name FROM users WHERE role = 'inspector' AND active ORDER BY name`,
    ),
  ]);

  const shifts = shiftsRes.rows;
  const inspectors = inspectorsRes.rows;

  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const shiftsByInspectorDay = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const key = `${s.inspector_id}|${shiftDateKey(s.shift_date)}`;
    const list = shiftsByInspectorDay.get(key) ?? [];
    list.push(s);
    shiftsByInspectorDay.set(key, list);
  }

  const totalShifts = shifts.length;
  const totalPieces = shifts.reduce((sum, s) => sum + s.pieces_inspected, 0);
  const productivityValues = shifts
    .map((s) => {
      const h = hoursBetween(s.start_time, s.end_time);
      return h && h > 0 ? s.pieces_inspected / h : null;
    })
    .filter((v): v is number => v !== null);
  const avgProductivity =
    productivityValues.length > 0
      ? Math.round(
          productivityValues.reduce((a, b) => a + b, 0) /
            productivityValues.length,
        )
      : 0;
  const todayKey = isoDate(today);
  const inspectorsToday = new Set(
    shifts
      .filter((s) => shiftDateKey(s.shift_date) === todayKey)
      .map((s) => s.inspector_id),
  ).size;

  return (
    <AppShell
      title="RH y Turnos"
      roleLabel="Administrador"
      role="admin"
      userName={session.name}
      navItems={ADMIN_NAV_ITEMS}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile label="Turnos (7 dias)" value={totalShifts} />
          <SummaryTile label="Piezas inspeccionadas" value={totalPieces} />
          <SummaryTile
            label="Productividad prom."
            value={avgProductivity}
            suffix=" pz/h"
            accent
          />
          <SummaryTile label="Inspectores hoy" value={inspectorsToday} />
        </div>

        <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
          <div className="border-b border-kraft-200 bg-kraft-50 px-4 py-3">
            <h2 className="text-sm font-bold tracking-wide text-ink-700 uppercase">
              Roster semanal
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[150px] border-b border-kraft-200 bg-white px-4 py-2.5 text-left text-xs font-bold tracking-wide text-ink-500/60 uppercase">
                    Inspector
                  </th>
                  {days.map((d) => (
                    <th
                      key={d.toISOString()}
                      className="min-w-[120px] border-b border-l border-kraft-100 px-3 py-2.5 text-center text-xs font-bold tracking-wide text-ink-500/60 uppercase"
                    >
                      {d.toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inspectors.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-ink-500/40"
                    >
                      No hay inspectores registrados.
                    </td>
                  </tr>
                )}
                {inspectors.map((insp) => (
                  <tr
                    key={insp.id}
                    className="border-b border-kraft-100 last:border-b-0"
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-ink-700">
                      {insp.name}
                    </td>
                    {days.map((d) => {
                      const key = `${insp.id}|${isoDate(d)}`;
                      const cellShifts = shiftsByInspectorDay.get(key) ?? [];
                      return (
                        <td
                          key={key}
                          className="border-l border-kraft-100 px-2 py-2 text-center align-top"
                        >
                          {cellShifts.length === 0 ? (
                            <span className="text-xs text-ink-500/25">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {cellShifts.map((s) => {
                                const isMorning =
                                  Number((s.start_time ?? "12").slice(0, 2)) <
                                  13;
                                return (
                                  <div
                                    key={s.id}
                                    className={`rounded-md px-2 py-1 text-[10.5px] leading-tight font-semibold ${
                                      isMorning
                                        ? "bg-olive-400/15 text-olive-700"
                                        : "bg-ink-700/8 text-ink-700"
                                    }`}
                                  >
                                    <div>
                                      {formatTime(s.start_time)}–
                                      {formatTime(s.end_time)}
                                    </div>
                                    <div className="font-normal opacity-70">
                                      {s.pieces_inspected} pz
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
          <div className="border-b border-kraft-200 bg-kraft-50 px-4 py-3">
            <h2 className="text-sm font-bold tracking-wide text-ink-700 uppercase">
              Historial de turnos
            </h2>
          </div>
          <table className="min-w-full divide-y divide-kraft-200 text-sm">
            <thead className="bg-kraft-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase">
                  Inspector
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase">
                  Turno
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase">
                  Piezas
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase">
                  Productividad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft-100">
              {shifts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink-500/40"
                  >
                    Sin turnos registrados en los ultimos 7 dias.
                  </td>
                </tr>
              )}
              {shifts.map((s) => {
                const hours = hoursBetween(s.start_time, s.end_time);
                const productivity =
                  hours && hours > 0
                    ? Math.round(s.pieces_inspected / hours)
                    : null;
                return (
                  <tr key={s.id} className="hover:bg-olive-400/8">
                    <td className="px-4 py-3 font-medium text-ink-700">
                      {s.inspector_name}
                    </td>
                    <td className="px-4 py-3 text-ink-700/80">
                      {new Date(s.shift_date).toLocaleDateString("es-MX")}
                    </td>
                    <td className="px-4 py-3 text-ink-700/80">
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </td>
                    <td className="px-4 py-3 text-ink-700/80">
                      {s.pieces_inspected}
                    </td>
                    <td className="px-4 py-3 text-olive-700">
                      {productivity !== null ? `${productivity} pz/h` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryTile({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        accent
          ? "border-olive-500/30 bg-olive-400/10"
          : "border-kraft-200 bg-white"
      }`}
    >
      <p className="text-[10px] font-bold tracking-widest text-ink-500/50 uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-3xl font-black tracking-tight ${
          accent ? "text-olive-700" : "text-ink-700"
        }`}
      >
        {value}
        {suffix && <span className="text-base font-bold">{suffix}</span>}
      </p>
    </div>
  );
}
