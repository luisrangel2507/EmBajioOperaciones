"use client";

import { useEffect, useState } from "react";

export interface GadgetStats {
  ordenesPendientes: number;
  ordenesEnProceso: number;
  ordenesCompletadas: number;
  ordenesCanceladas: number;
  piezasOk: number;
  piezasNg: number;
  carsAbiertos: number;
  carsEnProceso: number;
  carsCerrados: number;
  controlPlans: number;
  qualityRecords: number;
  turnosSemana: number;
  piezasSemana: number;
  rotacionesSemana: number;
  piezasPorDia: { label: string; value: number }[];
}

interface GadgetDef {
  id: string;
  module: string;
  title: string;
  kind: "bubble" | "bar" | "sparkline";
}

const CATALOG: GadgetDef[] = [
  { id: "ord-pendientes", module: "Ordenes", title: "Pendientes", kind: "bubble" },
  { id: "ord-enproceso", module: "Ordenes", title: "En proceso", kind: "bubble" },
  { id: "ord-completadas", module: "Ordenes", title: "Completadas", kind: "bubble" },
  { id: "ord-chart-estatus", module: "Ordenes", title: "Ordenes por estatus", kind: "bar" },
  { id: "ord-chart-okng", module: "Ordenes", title: "Piezas OK vs NG", kind: "bar" },
  { id: "cal-cars", module: "Calidad", title: "CARs abiertos", kind: "bubble" },
  { id: "cal-planes", module: "Calidad", title: "Planes de control", kind: "bubble" },
  { id: "cal-registros", module: "Calidad", title: "Registros", kind: "bubble" },
  { id: "cal-chart-cars", module: "Calidad", title: "CARs por estatus", kind: "bar" },
  { id: "rh-turnos", module: "RH / Turnos", title: "Turnos esta semana", kind: "bubble" },
  { id: "rh-piezas", module: "RH / Turnos", title: "Piezas inspeccionadas", kind: "bubble" },
  { id: "rh-chart-sparkline", module: "RH / Turnos", title: "Piezas - ultimos 7 dias", kind: "sparkline" },
  { id: "prod-rotacion", module: "Produccion", title: "Inspectores en rotacion", kind: "bubble" },
];

const DEFAULT_IDS = [
  "ord-pendientes",
  "ord-enproceso",
  "ord-completadas",
  "cal-cars",
  "cal-planes",
  "cal-registros",
  "rh-turnos",
  "rh-piezas",
  "prod-rotacion",
];

const STORAGE_KEY = "embajio:dashboard-gadgets:v1";

export default function DashboardGadgets({ stats }: { stats: GadgetStats }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_IDS);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((id) => CATALOG.some((g) => g.id === id));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrata la seleccion guardada en localStorage al montar
        setSelectedIds(valid);
      }
    } catch {
      // localStorage con datos invalidos: se ignora y se usa el default
    }
  }, []);

  function toggleGadget(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const available = CATALOG.filter((g) => !selectedIds.includes(g.id));

  return (
    <div id="gadgets" className="scroll-mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-wide text-ink-700 uppercase">Gadgets</h2>
          <p className="text-xs text-ink-500/60">
            Elige que datos y graficas de cada area quieres ver aqui.
          </p>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide uppercase transition ${
            editing
              ? "border-olive-500 bg-olive-400/15 text-olive-700"
              : "border-kraft-300 text-ink-700/70 hover:border-olive-400 hover:text-ink-700"
          }`}
        >
          {editing ? "Listo" : "Personalizar"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {selectedIds.map((id) => {
          const def = CATALOG.find((g) => g.id === id);
          if (!def) return null;
          return (
            <GadgetCard
              key={id}
              def={def}
              stats={stats}
              editing={editing}
              onRemove={() => toggleGadget(id)}
            />
          );
        })}
        {selectedIds.length === 0 && (
          <p className="col-span-full text-xs text-ink-500/50">
            No hay gadgets en el panel. Usa &quot;Personalizar&quot; para agregar.
          </p>
        )}
      </div>

      {editing && (
        <div className="rounded-xl border border-dashed border-kraft-300 bg-kraft-50/50 p-4">
          <p className="mb-2 text-[10px] font-bold tracking-widest text-ink-500/50 uppercase">
            Agregar gadget
          </p>
          {available.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {available.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGadget(g.id)}
                  className="rounded-full border border-kraft-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700/80 transition hover:border-olive-400 hover:text-ink-700"
                >
                  + {g.title} <span className="text-ink-500/40">· {g.module}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-500/50">Ya agregaste todos los gadgets disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}

function GadgetCard({
  def,
  stats,
  editing,
  onRemove,
}: {
  def: GadgetDef;
  stats: GadgetStats;
  editing: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border border-kraft-200 bg-white p-4 shadow-sm ${
        def.kind === "bubble" ? "" : "col-span-2"
      }`}
    >
      {editing && (
        <button
          onClick={onRemove}
          aria-label={`Quitar ${def.title}`}
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-kraft-100 text-xs text-ink-500/60 transition hover:bg-red-100 hover:text-red-600"
        >
          ×
        </button>
      )}
      <p className="mb-2 text-[9px] font-bold tracking-widest text-ink-500/40 uppercase">
        {def.module}
      </p>
      <GadgetContent def={def} stats={stats} />
    </div>
  );
}

function GadgetContent({ def, stats }: { def: GadgetDef; stats: GadgetStats }) {
  switch (def.id) {
    case "ord-pendientes":
      return <Bubble value={stats.ordenesPendientes} label="Pendientes" />;
    case "ord-enproceso":
      return <Bubble value={stats.ordenesEnProceso} label="En proceso" />;
    case "ord-completadas":
      return <Bubble value={stats.ordenesCompletadas} label="Completadas" />;
    case "cal-cars":
      return (
        <Bubble
          value={stats.carsAbiertos + stats.carsEnProceso}
          label="CARs abiertos"
        />
      );
    case "cal-planes":
      return <Bubble value={stats.controlPlans} label="Planes de control" />;
    case "cal-registros":
      return <Bubble value={stats.qualityRecords} label="Registros" />;
    case "rh-turnos":
      return <Bubble value={stats.turnosSemana} label="Turnos esta semana" />;
    case "rh-piezas":
      return <Bubble value={stats.piezasSemana} label="Piezas inspeccionadas" />;
    case "prod-rotacion":
      return <Bubble value={stats.rotacionesSemana} label="Inspectores en rotacion" />;
    case "ord-chart-estatus":
      return (
        <>
          <p className="mb-2 text-xs font-bold text-ink-700">{def.title}</p>
          <MiniBarChart
            bars={[
              { label: "Pendiente", value: stats.ordenesPendientes, color: "var(--color-kraft-400)" },
              { label: "En proceso", value: stats.ordenesEnProceso, color: "var(--color-olive-500)" },
              { label: "Completada", value: stats.ordenesCompletadas, color: "var(--color-olive-700)" },
              { label: "Cancelada", value: stats.ordenesCanceladas, color: "#b45454" },
            ]}
          />
        </>
      );
    case "ord-chart-okng":
      return (
        <>
          <p className="mb-2 text-xs font-bold text-ink-700">{def.title}</p>
          <MiniBarChart
            bars={[
              { label: "OK", value: stats.piezasOk, color: "var(--color-olive-600)" },
              { label: "NG", value: stats.piezasNg, color: "#c0504d" },
            ]}
          />
        </>
      );
    case "cal-chart-cars":
      return (
        <>
          <p className="mb-2 text-xs font-bold text-ink-700">{def.title}</p>
          <MiniBarChart
            bars={[
              { label: "Abierto", value: stats.carsAbiertos, color: "#c0504d" },
              { label: "En proceso", value: stats.carsEnProceso, color: "var(--color-kraft-400)" },
              { label: "Cerrado", value: stats.carsCerrados, color: "var(--color-olive-600)" },
            ]}
          />
        </>
      );
    case "rh-chart-sparkline":
      return (
        <>
          <p className="mb-2 text-xs font-bold text-ink-700">{def.title}</p>
          <Sparkline points={stats.piezasPorDia} />
        </>
      );
    default:
      return null;
  }
}

function Bubble({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-full bg-kraft-50 px-3 py-4 text-center ring-1 ring-kraft-200">
      <p className="text-xl font-black tracking-tight text-ink-700">{value}</p>
      <p className="text-[9px] leading-tight font-semibold text-ink-500/60 uppercase">{label}</p>
    </div>
  );
}

function MiniBarChart({
  bars,
}: {
  bars: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="flex flex-col gap-1.5">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-[10px] font-semibold text-ink-500/60 uppercase">
            {b.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-kraft-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-[11px] font-bold text-ink-700">
            {b.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ points }: { points: { label: string; value: number }[] }) {
  const w = 320;
  const h = 64;
  const pad = 6;
  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1][0]},${h - pad} L${coords[0][0]},${h - pad} Z`
      : "";

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <path d={areaPath} fill="var(--color-olive-400)" opacity={0.15} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-olive-600)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill="var(--color-olive-600)" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] font-semibold text-ink-500/50 uppercase">
        {points.map((p, i) => (
          <span key={`${p.label}-${i}`}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
