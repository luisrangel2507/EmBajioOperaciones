"use client";

import { useMemo, useState } from "react";
import { SCRAP_REASONS } from "@/lib/scrapReasons";

export interface ScrapTrendRecord {
  scrap_date: string;
  part_name: string;
  part_number: string | null;
  station_num: number | null;
  reason: string;
  quantity: number;
  client_id: number | null;
  client_name: string | null;
}

export interface DailyActual {
  date: string;
  label: string;
  actualPieces: number;
}

interface ClientOption {
  id: number;
  name: string;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ScrapTrendChart({
  records,
  dailyActual,
  clients,
}: {
  records: ScrapTrendRecord[];
  dailyActual: DailyActual[];
  clients: ClientOption[];
}) {
  const minDate = dailyActual[0]?.date ?? isoDate(new Date());
  const maxDate = dailyActual[dailyActual.length - 1]?.date ?? isoDate(new Date());

  const [dateFrom, setDateFrom] = useState(minDate);
  const [dateTo, setDateTo] = useState(maxDate);
  const [partFilter, setPartFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const partOptions = useMemo(
    () => [...new Set(records.map((r) => r.part_name))].sort(),
    [records]
  );

  const filteredRecords = records.filter((r) => {
    if (r.scrap_date < dateFrom || r.scrap_date > dateTo) return false;
    if (partFilter && r.part_name !== partFilter) return false;
    if (stationFilter && String(r.station_num ?? "") !== stationFilter) return false;
    if (reasonFilter && r.reason !== reasonFilter) return false;
    if (clientFilter && String(r.client_id ?? "") !== clientFilter) return false;
    return true;
  });

  const scrapByDay = new Map<string, number>();
  for (const r of filteredRecords) {
    scrapByDay.set(r.scrap_date, (scrapByDay.get(r.scrap_date) ?? 0) + r.quantity);
  }

  const points = dailyActual
    .filter((d) => d.date >= dateFrom && d.date <= dateTo)
    .map((d) => ({
      label: d.label,
      pct: d.actualPieces > 0 ? ((scrapByDay.get(d.date) ?? 0) / d.actualPieces) * 100 : null,
    }));

  const w = 900;
  const h = 260;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const values = points.map((p) => p.pct).filter((v): v is number => v !== null);
  const maxVal = values.length ? Math.max(...values) : 0;
  const niceMax = Math.max(5, Math.ceil((maxVal || 5) / 5) * 5);

  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: padL + i * stepX,
    y: p.pct === null ? null : padT + innerH - (p.pct / niceMax) * innerH,
    pct: p.pct,
  }));
  const validCoords = coords.filter(
    (c): c is { x: number; y: number; pct: number } => c.y !== null
  );
  const linePath = validCoords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (niceMax / yTicks) * i;
    return { val, y: padT + innerH - (val / niceMax) * innerH };
  });

  const labelEvery = Math.max(1, Math.ceil(points.length / 10));

  const selectClass =
    "rounded-lg border border-kraft-300 bg-white px-2.5 py-1.5 text-xs text-ink-700 shadow-sm focus:border-olive-600 focus:outline-none";

  return (
    <div className="rounded-xl border border-kraft-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-ink-700">Embajio Scrap Percentage</p>
      <p className="mb-3 text-xs text-ink-500/55">
        % de piezas desechadas contra piezas inspeccionadas ese dia. Filtra por pieza, estacion,
        motivo, cliente o rango de fechas.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 text-xs text-ink-500/60">
          Desde
          <input
            type="date"
            value={dateFrom}
            min={minDate}
            max={dateTo}
            onChange={(e) => setDateFrom(e.target.value)}
            className={selectClass}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-ink-500/60">
          Hasta
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            max={maxDate}
            onChange={(e) => setDateTo(e.target.value)}
            className={selectClass}
          />
        </label>
        <select
          value={partFilter}
          onChange={(e) => setPartFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Todas las piezas</option>
          {partOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Todas las estaciones</option>
          {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Estacion {n}
            </option>
          ))}
        </select>
        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los motivos</option>
          {SCRAP_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {validCoords.length === 0 ? (
        <p className="py-10 text-center text-xs text-ink-500/40">
          No hay datos de produccion y desechos que coincidan con este filtro.
        </p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
          {gridLines.map((g) => (
            <g key={g.val}>
              <line
                x1={padL}
                x2={w - padR}
                y1={g.y}
                y2={g.y}
                stroke="var(--color-kraft-200)"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={g.y + 3}
                textAnchor="end"
                fontSize={9}
                fill="var(--color-ink-500)"
                opacity={0.55}
              >
                {g.val.toFixed(0)}%
              </text>
            </g>
          ))}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-olive-600)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {validCoords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={2.75} fill="var(--color-olive-600)" />
          ))}
          {coords.map((c, i) =>
            i % labelEvery === 0 ? (
              <text
                key={i}
                x={c.x}
                y={h - 10}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-ink-500)"
                opacity={0.5}
              >
                {points[i].label}
              </text>
            ) : null
          )}
        </svg>
      )}
    </div>
  );
}
