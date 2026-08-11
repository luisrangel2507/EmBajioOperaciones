"use client";

import { Fragment, useState } from "react";

export interface ControlPlanRow {
  id: number;
  plan_number: string;
  part_name: string;
  part_number: string | null;
  revision: string;
  created_at: string;
  client_id: number | null;
  client_name: string | null;
  item_count: number;
}

export interface ControlPlanItem {
  id?: number;
  process_step: string;
  characteristic: string;
  specification: string;
  control_method: string;
  sample_size: string;
  frequency: string;
  reaction_plan: string;
}

interface ClientOption {
  id: number;
  name: string;
}

const emptyItem: ControlPlanItem = {
  process_step: "",
  characteristic: "",
  specification: "",
  control_method: "",
  sample_size: "",
  frequency: "",
  reaction_plan: "",
};

const emptyHeader = {
  part_name: "",
  part_number: "",
  client_id: "",
  revision: "A",
};

export default function ControlPlansPanel({
  initialPlans,
  clients,
}: {
  initialPlans: ControlPlanRow[];
  clients: ClientOption[];
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [showForm, setShowForm] = useState(false);
  const [header, setHeader] = useState(emptyHeader);
  const [items, setItems] = useState<ControlPlanItem[]>([{ ...emptyItem }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<ControlPlanItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  function updateItem(index: number, field: keyof ControlPlanItem, value: string) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function toggleExpand(plan: ControlPlanRow) {
    if (expandedId === plan.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(plan.id);
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/control-plans/${plan.id}`);
      const data = await res.json();
      if (res.ok) setExpandedItems(data.items);
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!header.part_name) {
      setFormError("El nombre de la pieza es requerido");
      return;
    }
    const validItems = items.filter((it) => it.characteristic.trim());
    if (validItems.length === 0) {
      setFormError("Agrega al menos una caracteristica a controlar");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/control-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...header,
          client_id: header.client_id ? Number(header.client_id) : null,
          items: validItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear el plan de control");
        setSubmitting(false);
        return;
      }
      const client = clients.find((c) => c.id === Number(header.client_id));
      setPlans((prev) => [
        {
          id: data.plan.id,
          plan_number: data.plan.plan_number,
          part_name: header.part_name,
          part_number: header.part_number || null,
          revision: header.revision || "A",
          created_at: new Date().toISOString(),
          client_id: header.client_id ? Number(header.client_id) : null,
          client_name: client?.name ?? null,
          item_count: validItems.length,
        },
        ...prev,
      ]);
      setHeader(emptyHeader);
      setItems([{ ...emptyItem }]);
      setShowForm(false);
    } catch {
      setFormError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold tracking-wide text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] transition hover:shadow-[0_6px_18px_rgba(90,60,25,0.35)]"
        >
          + Nuevo plan de control
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-kraft-200 text-sm">
          <thead className="bg-kraft-50">
            <tr>
              <Th>Plan</Th>
              <Th>Pieza / Parte</Th>
              <Th>Cliente</Th>
              <Th>Rev.</Th>
              <Th>Caracteristicas</Th>
              <Th>Fecha</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kraft-100">
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500/40">
                  No hay planes de control registrados.
                </td>
              </tr>
            )}
            {plans.map((p) => (
              <Fragment key={p.id}>
                <tr
                  onClick={() => toggleExpand(p)}
                  className="cursor-pointer transition hover:bg-olive-400/8"
                >
                  <td className="px-4 py-3 font-bold text-olive-700">{p.plan_number}</td>
                  <td className="px-4 py-3 text-ink-700/80">
                    <div>{p.part_name}</div>
                    {p.part_number && (
                      <div className="text-xs text-ink-500/50">{p.part_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">{p.client_name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink-700/80">{p.revision}</td>
                  <td className="px-4 py-3 text-ink-700/80">{p.item_count}</td>
                  <td className="px-4 py-3 text-ink-700/80">
                    {new Date(p.created_at).toLocaleDateString("es-MX")}
                  </td>
                </tr>
                {expandedId === p.id && (
                  <tr key={`${p.id}-detail`}>
                    <td colSpan={6} className="bg-kraft-50 px-4 py-4">
                      {loadingItems ? (
                        <p className="text-xs text-ink-500/50">Cargando...</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="text-left text-ink-500/60 uppercase">
                                <th className="py-1 pr-4">Paso de proceso</th>
                                <th className="py-1 pr-4">Caracteristica</th>
                                <th className="py-1 pr-4">Especificacion</th>
                                <th className="py-1 pr-4">Metodo de control</th>
                                <th className="py-1 pr-4">Muestra</th>
                                <th className="py-1 pr-4">Frecuencia</th>
                                <th className="py-1 pr-4">Plan de reaccion</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedItems.map((it, i) => (
                                <tr key={it.id ?? i} className="border-t border-kraft-200">
                                  <td className="py-1.5 pr-4 text-ink-700/80">
                                    {it.process_step || "-"}
                                  </td>
                                  <td className="py-1.5 pr-4 font-medium text-ink-700">
                                    {it.characteristic}
                                  </td>
                                  <td className="py-1.5 pr-4 text-ink-700/80">
                                    {it.specification || "-"}
                                  </td>
                                  <td className="py-1.5 pr-4 text-ink-700/80">
                                    {it.control_method || "-"}
                                  </td>
                                  <td className="py-1.5 pr-4 text-ink-700/80">
                                    {it.sample_size || "-"}
                                  </td>
                                  <td className="py-1.5 pr-4 text-ink-700/80">
                                    {it.frequency || "-"}
                                  </td>
                                  <td className="py-1.5 pr-4 text-ink-700/80">
                                    {it.reaction_plan || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-700">Nuevo plan de control</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-ink-500/50 hover:text-ink-700"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Pieza / Parte" required className="col-span-2 sm:col-span-2">
                  <input
                    value={header.part_name}
                    onChange={(e) => setHeader({ ...header, part_name: e.target.value })}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Numero de parte">
                  <input
                    value={header.part_number}
                    onChange={(e) => setHeader({ ...header, part_number: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Revision">
                  <input
                    value={header.revision}
                    onChange={(e) => setHeader({ ...header, revision: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Cliente" className="col-span-2 sm:col-span-4">
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
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-wide text-ink-700 uppercase">
                    Caracteristicas a controlar
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-semibold text-olive-700 hover:underline"
                  >
                    + Agregar caracteristica
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 gap-2 rounded-lg border border-kraft-200 p-3 sm:grid-cols-4"
                    >
                      <input
                        placeholder="Paso de proceso"
                        value={item.process_step}
                        onChange={(e) => updateItem(i, "process_step", e.target.value)}
                        className="input"
                      />
                      <input
                        placeholder="Caracteristica *"
                        value={item.characteristic}
                        onChange={(e) => updateItem(i, "characteristic", e.target.value)}
                        className="input"
                      />
                      <input
                        placeholder="Especificacion"
                        value={item.specification}
                        onChange={(e) => updateItem(i, "specification", e.target.value)}
                        className="input"
                      />
                      <input
                        placeholder="Metodo de control"
                        value={item.control_method}
                        onChange={(e) => updateItem(i, "control_method", e.target.value)}
                        className="input"
                      />
                      <input
                        placeholder="Tamano de muestra"
                        value={item.sample_size}
                        onChange={(e) => updateItem(i, "sample_size", e.target.value)}
                        className="input"
                      />
                      <input
                        placeholder="Frecuencia"
                        value={item.frequency}
                        onChange={(e) => updateItem(i, "frequency", e.target.value)}
                        className="input"
                      />
                      <input
                        placeholder="Plan de reaccion"
                        value={item.reaction_plan}
                        onChange={(e) => updateItem(i, "reaction_plan", e.target.value)}
                        className="input col-span-2 sm:col-span-1"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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
                  {submitting ? "Creando..." : "Crear plan de control"}
                </button>
              </div>
            </form>
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
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink-700/80">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
