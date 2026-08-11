"use client";

import { useState } from "react";

export interface CarRow {
  id: number;
  car_number: string;
  part_name: string | null;
  part_number: string | null;
  problem_summary: string;
  status: "abierto" | "en_proceso" | "cerrado";
  opened_at: string;
  closed_at: string | null;
  client_id: number | null;
  client_name: string | null;
}

interface CarDetail extends CarRow {
  d1_team: string | null;
  d2_problem_description: string | null;
  d3_containment_actions: string | null;
  d4_root_cause: string | null;
  d5_corrective_actions: string | null;
  d6_implementation: string | null;
  d7_prevention: string | null;
  d8_closure: string | null;
}

interface ClientOption {
  id: number;
  name: string;
}

const STATUS_LABELS: Record<CarRow["status"], string> = {
  abierto: "Abierto",
  en_proceso: "En proceso",
  cerrado: "Cerrado",
};

const STATUS_STYLES: Record<CarRow["status"], string> = {
  abierto: "bg-red-50 text-red-700 ring-red-500/25",
  en_proceso: "bg-kraft-100 text-kraft-700 ring-kraft-400/40",
  cerrado: "bg-olive-400/20 text-olive-700 ring-olive-500/30",
};

const D_DEFINITIONS: {
  key: keyof CarDetail;
  title: string;
  desc: string;
}[] = [
  { key: "d1_team", title: "D1 · Equipo", desc: "Quien participa en la solucion del problema" },
  {
    key: "d2_problem_description",
    title: "D2 · Descripcion del problema",
    desc: "Que paso, donde, cuando, cuanto (5W2H)",
  },
  {
    key: "d3_containment_actions",
    title: "D3 · Acciones de contencion",
    desc: "Que se hizo de inmediato para proteger al cliente",
  },
  {
    key: "d4_root_cause",
    title: "D4 · Causa raiz",
    desc: "Analisis de causa raiz (5 por que's, Ishikawa, etc.)",
  },
  {
    key: "d5_corrective_actions",
    title: "D5 · Acciones correctivas",
    desc: "Acciones permanentes propuestas para eliminar la causa raiz",
  },
  {
    key: "d6_implementation",
    title: "D6 · Implementacion y validacion",
    desc: "Como y cuando se implementaron, evidencia de efectividad",
  },
  {
    key: "d7_prevention",
    title: "D7 · Prevencion",
    desc: "Cambios a sistemas/procesos para evitar recurrencia",
  },
  {
    key: "d8_closure",
    title: "D8 · Cierre",
    desc: "Reconocimiento al equipo y cierre formal del CAR",
  },
];

const emptyHeader = {
  client_id: "",
  part_name: "",
  part_number: "",
  problem_summary: "",
};

export default function CarsPanel({
  initialCars,
  clients,
}: {
  initialCars: CarRow[];
  clients: ClientOption[];
}) {
  const [cars, setCars] = useState(initialCars);
  const [showForm, setShowForm] = useState(false);
  const [header, setHeader] = useState(emptyHeader);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [detail, setDetail] = useState<CarDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);

  async function openDetail(id: number) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/cars/${id}`);
      const data = await res.json();
      if (res.ok) setDetail(data.car);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!header.problem_summary.trim()) {
      setFormError("Describe brevemente el problema");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...header,
          client_id: header.client_id ? Number(header.client_id) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear el CAR");
        setSubmitting(false);
        return;
      }
      const client = clients.find((c) => c.id === Number(header.client_id));
      const newCar: CarRow = {
        id: data.car.id,
        car_number: data.car.car_number,
        part_name: header.part_name || null,
        part_number: header.part_number || null,
        problem_summary: header.problem_summary,
        status: "abierto",
        opened_at: new Date().toISOString(),
        closed_at: null,
        client_id: header.client_id ? Number(header.client_id) : null,
        client_name: client?.name ?? null,
      };
      setCars((prev) => [newCar, ...prev]);
      setHeader(emptyHeader);
      setShowForm(false);
      openDetail(newCar.id);
    } catch {
      setFormError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDetail(status?: CarRow["status"]) {
    if (!detail) return;
    setSavingDetail(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const d of D_DEFINITIONS) payload[d.key] = detail[d.key] ?? "";
      if (status) payload.status = status;

      const res = await fetch(`/api/cars/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setDetail((prev) => (prev ? { ...prev, status: data.car.status, closed_at: data.car.closed_at } : prev));
        setCars((prev) =>
          prev.map((c) =>
            c.id === detail.id ? { ...c, status: data.car.status, closed_at: data.car.closed_at } : c
          )
        );
      }
    } finally {
      setSavingDetail(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold tracking-wide text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] transition hover:shadow-[0_6px_18px_rgba(90,60,25,0.35)]"
        >
          + Nuevo CAR
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-kraft-200 text-sm">
          <thead className="bg-kraft-50">
            <tr>
              <Th>CAR</Th>
              <Th>Cliente / Pieza</Th>
              <Th>Problema</Th>
              <Th>Estatus</Th>
              <Th>Apertura</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kraft-100">
            {cars.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-500/40">
                  No hay CARs registrados.
                </td>
              </tr>
            )}
            {cars.map((c) => (
              <tr
                key={c.id}
                onClick={() => openDetail(c.id)}
                className="cursor-pointer transition hover:bg-olive-400/8"
              >
                <td className="px-4 py-3 font-bold text-olive-700">{c.car_number}</td>
                <td className="px-4 py-3 text-ink-700/80">
                  <div>{c.client_name ?? "-"}</div>
                  {c.part_name && (
                    <div className="text-xs text-ink-500/50">{c.part_name}</div>
                  )}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-ink-700/80">
                  {c.problem_summary}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[c.status]}`}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-700/80">
                  {new Date(c.opened_at).toLocaleDateString("es-MX")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4">
          <div className="w-full max-w-lg rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-700">Nuevo CAR (8D)</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-ink-500/50 hover:text-ink-700"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Cliente">
                <select
                  value={header.client_id}
                  onChange={(e) => setHeader({ ...header, client_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sin cliente especifico</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pieza / Parte">
                  <input
                    value={header.part_name}
                    onChange={(e) => setHeader({ ...header, part_name: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Numero de parte">
                  <input
                    value={header.part_number}
                    onChange={(e) => setHeader({ ...header, part_number: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Descripcion del problema" required>
                <textarea
                  value={header.problem_summary}
                  onChange={(e) => setHeader({ ...header, problem_summary: e.target.value })}
                  className="input"
                  rows={3}
                  required
                />
              </Field>

              {formError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700/70 hover:bg-kraft-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Crear CAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(detail || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4 py-8">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            {loadingDetail || !detail ? (
              <p className="text-sm text-ink-500/50">Cargando...</p>
            ) : (
              <>
                <div className="mb-1 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-700">
                      {detail.car_number}
                    </h2>
                    <p className="text-xs text-ink-500/60">
                      {detail.client_name ?? "Sin cliente"} · {detail.part_name ?? "-"}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="text-ink-500/50 hover:text-ink-700"
                    aria-label="Cerrar"
                  >
                    &times;
                  </button>
                </div>
                <p className="mb-4 rounded-md bg-kraft-50 px-3 py-2 text-sm text-ink-700/80">
                  {detail.problem_summary}
                </p>

                <div className="mb-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[detail.status]}`}
                  >
                    {STATUS_LABELS[detail.status]}
                  </span>
                  {detail.closed_at && (
                    <span className="text-xs text-ink-500/50">
                      Cerrado el {new Date(detail.closed_at).toLocaleDateString("es-MX")}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {D_DEFINITIONS.map((d) => (
                    <div key={d.key}>
                      <label className="mb-1 block text-sm font-bold text-ink-700">
                        {d.title}
                      </label>
                      <p className="mb-1 text-xs text-ink-500/50">{d.desc}</p>
                      <textarea
                        value={(detail[d.key] as string) ?? ""}
                        onChange={(e) =>
                          setDetail((prev) =>
                            prev ? { ...prev, [d.key]: e.target.value } : prev
                          )
                        }
                        className="input"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700/70 hover:bg-kraft-100"
                  >
                    Cerrar ventana
                  </button>
                  <button
                    type="button"
                    disabled={savingDetail}
                    onClick={() => saveDetail("en_proceso")}
                    className="rounded-lg border border-kraft-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-kraft-100 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  {detail.status !== "cerrado" ? (
                    <button
                      type="button"
                      disabled={savingDetail}
                      onClick={() => saveDetail("cerrado")}
                      className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] disabled:opacity-50"
                    >
                      Guardar y cerrar CAR
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={savingDetail}
                      onClick={() => saveDetail("en_proceso")}
                      className="rounded-lg border border-kraft-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-kraft-100 disabled:opacity-50"
                    >
                      Reabrir
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink-700/80">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
