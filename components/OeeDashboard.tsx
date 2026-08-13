"use client";

import { useState } from "react";

export interface OeeDayRow {
  date: string;
  label: string;
  plannedPieces: number;
  plannedMinutes: number;
  actualPieces: number;
  actualMinutes: number;
  piecesOk: number;
  piecesNg: number;
}

interface Metrics {
  availability: number | null;
  performance: number | null;
  quality: number | null;
  oee: number | null;
}

function computeMetrics(day: OeeDayRow): Metrics {
  const availability =
    day.plannedMinutes > 0 ? Math.min(day.actualMinutes / day.plannedMinutes, 1) : null;
  const performance =
    day.plannedPieces > 0 ? Math.min(day.actualPieces / day.plannedPieces, 1) : null;
  const totalInspected = day.piecesOk + day.piecesNg;
  const quality = totalInspected > 0 ? day.piecesOk / totalInspected : null;
  const oee =
    availability !== null && performance !== null && quality !== null
      ? availability * performance * quality
      : null;
  return { availability, performance, quality, oee };
}

function pct(value: number | null) {
  return value === null ? "-" : `${Math.round(value * 100)}%`;
}

function oeeBadgeClass(value: number | null) {
  if (value === null) return "bg-kraft-100 text-ink-500/50";
  if (value >= 0.85) return "bg-olive-400/20 text-olive-700";
  if (value >= 0.6) return "bg-kraft-200 text-kraft-700";
  return "bg-red-100 text-red-700";
}

export default function OeeDashboard({ initialDays }: { initialDays: OeeDayRow[] }) {
  const [days, setDays] = useState(initialDays);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [form, setForm] = useState({ pieces: "", minutes: "" });
  const [saving, setSaving] = useState(false);

  function startEdit(day: OeeDayRow) {
    setEditingDate(day.date);
    setForm({
      pieces: String(day.plannedPieces),
      minutes: String(day.plannedMinutes || 480),
    });
  }

  async function savePlan(date: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/production-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_date: date,
          planned_pieces: Number(form.pieces) || 0,
          planned_minutes: Number(form.minutes) || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDays((prev) =>
          prev.map((d) =>
            d.date === date
              ? {
                  ...d,
                  plannedPieces: data.plan.planned_pieces,
                  plannedMinutes: data.plan.planned_minutes,
                }
              : d
          )
        );
        setEditingDate(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const withMetrics = days.map((d) => ({ ...d, ...computeMetrics(d) }));
  const withOee = withMetrics.filter((d) => d.oee !== null);
  const avg = (key: "availability" | "performance" | "quality" | "oee") =>
    withOee.length
      ? withOee.reduce((sum, d) => sum + (d[key] as number), 0) / withOee.length
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-sm font-bold tracking-wide text-ink-700 uppercase">
          📈 OEE - Produccion planeada vs real
        </h2>
        <p className="text-xs text-ink-500/60">
          Disponibilidad x Rendimiento x Calidad, ultimos {days.length} dias. Define lo
          planeado por dia y el resto se calcula solo con los turnos e inspecciones
          registradas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="OEE promedio" value={pct(avg("oee"))} accent="border-olive-400/40" />
        <SummaryCard
          label="Disponibilidad"
          value={pct(avg("availability"))}
          accent="border-kraft-400/50"
        />
        <SummaryCard
          label="Rendimiento"
          value={pct(avg("performance"))}
          accent="border-kraft-400/50"
        />
        <SummaryCard label="Calidad" value={pct(avg("quality"))} accent="border-kraft-400/50" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-kraft-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-kraft-200 text-sm">
          <thead className="bg-kraft-50">
            <tr>
              <Th>Fecha</Th>
              <Th>Planeado</Th>
              <Th>Real</Th>
              <Th>Disponibilidad</Th>
              <Th>Rendimiento</Th>
              <Th>Calidad</Th>
              <Th>OEE</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kraft-100">
            {withMetrics.map((d) => (
              <tr key={d.date} className="hover:bg-olive-400/8">
                <td className="px-4 py-3 font-medium text-ink-700 whitespace-nowrap">
                  {d.label}
                </td>
                <td className="px-4 py-3 text-ink-700/80">
                  {editingDate === d.date ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={form.pieces}
                        onChange={(e) => setForm({ ...form, pieces: e.target.value })}
                        className="w-16 rounded border border-kraft-300 px-1.5 py-1 text-xs"
                        placeholder="Piezas"
                      />
                      <input
                        type="number"
                        min={0}
                        value={form.minutes}
                        onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                        className="w-16 rounded border border-kraft-300 px-1.5 py-1 text-xs"
                        placeholder="Min"
                      />
                      <button
                        onClick={() => savePlan(d.date)}
                        disabled={saving}
                        className="rounded-full bg-olive-500 px-2 py-1 text-xs font-bold text-white transition-all duration-200 hover:bg-olive-600 active:scale-95 disabled:opacity-50"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingDate(null)}
                        className="rounded-full bg-kraft-100 px-2 py-1 text-xs text-ink-500/60 transition-all duration-200 hover:bg-kraft-200 active:scale-95"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(d)}
                      className="group flex items-center gap-1.5 rounded px-1.5 py-1 -ml-1.5 text-left transition-colors duration-200 hover:bg-kraft-50"
                    >
                      <span className={d.plannedMinutes === 0 && d.plannedPieces === 0 ? "text-ink-500/40 italic" : ""}>
                        {d.plannedMinutes === 0 && d.plannedPieces === 0
                          ? "Sin plan"
                          : `${d.plannedPieces} pz · ${d.plannedMinutes} min`}
                      </span>
                      <span className="text-[10px] text-ink-500/40 opacity-0 transition-opacity group-hover:opacity-100">
                        editar
                      </span>
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-700/80">
                  {d.actualPieces} pz · {Math.round(d.actualMinutes)} min
                </td>
                <td className="px-4 py-3 text-ink-700/80">{pct(d.availability)}</td>
                <td className="px-4 py-3 text-ink-700/80">{pct(d.performance)}</td>
                <td className="px-4 py-3 text-ink-700/80">{pct(d.quality)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${oeeBadgeClass(d.oee)}`}
                  >
                    {pct(d.oee)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${accent}`}
    >
      <p className="text-2xl font-black tracking-tight text-ink-700">{value}</p>
      <p className="text-[10px] font-bold tracking-widest text-ink-500/50 uppercase">{label}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase">
      {children}
    </th>
  );
}
