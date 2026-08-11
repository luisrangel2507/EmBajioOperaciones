"use client";

import { useEffect, useState } from "react";

const SLOTS = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00"];
const STATIONS = 7;
const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

interface RotationRow {
  day_of_week: number;
  time_slot: string;
  station_num: number;
  inspector_id: number | null;
  inspector_name: string | null;
}

interface OptionRow {
  id: number;
  name: string;
}

function mondayOf(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function weekLabel(monday: Date) {
  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `Semana del ${monday.toLocaleDateString("es-MX", opts)} al ${saturday.toLocaleDateString("es-MX", opts)}`;
}

function slotLabel(slot: string, index: number) {
  const next = SLOTS[index + 1];
  if (next) return `${slot}–${next}`;
  const hour = parseInt(slot.split(":")[0], 10) + 2;
  return `${slot}–${String(hour).padStart(2, "0")}:00`;
}

export default function RotationGrid({ inspectors }: { inspectors: OptionRow[] }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 0 : Math.min(d - 1, 5);
  });
  const [data, setData] = useState<Map<string, number | null>>(new Map());
  const [loading, setLoading] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function loadWeek(monday: Date) {
    setLoading(true);
    try {
      const res = await fetch(`/api/rotation?week=${isoDate(monday)}`);
      const json = await res.json();
      const map = new Map<string, number | null>();
      if (res.ok) {
        for (const row of json.rows as RotationRow[]) {
          map.set(`${row.day_of_week}-${row.time_slot}-${row.station_num}`, row.inspector_id);
        }
      }
      setData(map);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos al montar/cambiar de semana
    loadWeek(weekStart);
  }, [weekStart]);

  function goToday() {
    setWeekStart(mondayOf(new Date()));
    const d = new Date().getDay();
    setSelectedDay(d === 0 ? 0 : Math.min(d - 1, 5));
  }

  function shiftWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  }

  async function saveCell(slot: string, station: number, inspectorId: number | null) {
    const key = `${selectedDay}-${slot}-${station}`;
    setData((prev) => new Map(prev).set(key, inspectorId));
    try {
      await fetch("/api/rotation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: isoDate(weekStart),
          day_of_week: selectedDay,
          time_slot: slot,
          station_num: station,
          inspector_id: inspectorId,
        }),
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // silently ignore; el usuario puede reintentar cambiando el valor de nuevo
    }
  }

  async function copyPreviousWeek() {
    const prevMonday = new Date(weekStart);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const res = await fetch(`/api/rotation?week=${isoDate(prevMonday)}`);
    const json = await res.json();
    const rows: RotationRow[] = res.ok ? json.rows : [];
    if (rows.length === 0) return;

    await Promise.all(
      rows.map((row) =>
        fetch("/api/rotation", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            week_start: isoDate(weekStart),
            day_of_week: row.day_of_week,
            time_slot: row.time_slot,
            station_num: row.station_num,
            inspector_id: row.inspector_id,
          }),
        })
      )
    );
    await loadWeek(weekStart);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-kraft-200 bg-kraft-50 px-4 py-3">
        <button
          onClick={() => shiftWeek(-1)}
          className="rounded-md border border-kraft-300 px-2.5 py-1 text-sm text-ink-700 hover:bg-white"
          aria-label="Semana anterior"
        >
          ‹
        </button>
        <span className="min-w-[220px] text-center text-sm font-bold text-ink-700">
          {weekLabel(weekStart)}
        </span>
        <button
          onClick={() => shiftWeek(1)}
          className="rounded-md border border-kraft-300 px-2.5 py-1 text-sm text-ink-700 hover:bg-white"
          aria-label="Semana siguiente"
        >
          ›
        </button>
        <button
          onClick={goToday}
          className="rounded-md border border-kraft-300 px-2.5 py-1 text-xs font-semibold text-olive-700 hover:bg-white"
        >
          Hoy
        </button>
        <button
          onClick={copyPreviousWeek}
          className="rounded-md border border-kraft-300 bg-kraft-100 px-2.5 py-1 text-xs font-semibold text-ink-700/80 hover:bg-white"
        >
          ⎘ Copiar semana anterior
        </button>
        {loading && <span className="text-xs text-ink-500/50">Cargando...</span>}
      </div>

      <div className="flex gap-1 border-b border-kraft-100 px-4 py-2">
        {DAY_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => setSelectedDay(i)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase transition ${
              selectedDay === i
                ? "bg-olive-500 text-white"
                : "text-ink-700/60 hover:bg-kraft-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 px-2 py-2 text-left text-xs font-bold tracking-wide text-ink-500/60 uppercase">
                Horario
              </th>
              {Array.from({ length: STATIONS }, (_, i) => i + 1).map((s) => (
                <th
                  key={s}
                  className="px-2 py-2 text-center text-xs font-bold tracking-wide text-ink-500/60 uppercase"
                >
                  Est. {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, si) => (
              <tr key={slot} className="border-t border-kraft-100">
                <td className="py-1.5 pr-3 text-right text-xs font-bold whitespace-nowrap text-ink-500/70">
                  {slotLabel(slot, si)}
                </td>
                {Array.from({ length: STATIONS }, (_, i) => i + 1).map((station) => {
                  const key = `${selectedDay}-${slot}-${station}`;
                  const value = data.get(key) ?? null;
                  return (
                    <td key={station} className="px-1 py-1">
                      <select
                        value={value ?? ""}
                        onChange={(e) =>
                          saveCell(slot, station, e.target.value ? Number(e.target.value) : null)
                        }
                        className={`w-full rounded-md border px-1.5 py-1.5 text-xs transition ${
                          savedKey === key
                            ? "border-olive-500 bg-olive-400/10"
                            : "border-kraft-300 bg-white"
                        } text-ink-700 focus:border-olive-600 focus:outline-none`}
                      >
                        <option value="">—</option>
                        {inspectors.map((insp) => (
                          <option key={insp.id} value={insp.id}>
                            {insp.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
