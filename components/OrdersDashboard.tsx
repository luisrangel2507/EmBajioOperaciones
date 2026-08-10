"use client";

import { useMemo, useState } from "react";

export interface OrderRow {
  id: number;
  order_number: string;
  part_name: string;
  part_number: string | null;
  lot_number: string | null;
  total_pieces: number;
  defect_criteria: string | null;
  status: "pendiente" | "en_proceso" | "completada" | "cancelada";
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  client_id: number | null;
  client_name: string | null;
  inspector_id: number | null;
  inspector_name: string | null;
  pieces_ok: number;
  pieces_ng: number;
}

export interface OptionRow {
  id: number;
  name: string;
}

const STATUS_LABELS: Record<OrderRow["status"], string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const STATUS_STYLES: Record<OrderRow["status"], string> = {
  pendiente: "bg-amber-50 text-amber-700 ring-amber-600/20",
  en_proceso: "bg-blue-50 text-blue-700 ring-blue-600/20",
  completada: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelada: "bg-slate-100 text-slate-500 ring-slate-500/20",
};

const emptyForm = {
  client_id: "",
  part_name: "",
  part_number: "",
  lot_number: "",
  total_pieces: "",
  defect_criteria: "",
  due_date: "",
  assigned_inspector_id: "",
};

export default function OrdersDashboard({
  initialOrders,
  clients,
  inspectors,
}: {
  initialOrders: OrderRow[];
  clients: OptionRow[];
  inspectors: OptionRow[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function applyFilters(nextStatus: string, nextClient: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextClient) params.set("client_id", nextClient);
    try {
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  }

  function onStatusChange(value: string) {
    setStatusFilter(value);
    applyFilters(value, clientFilter);
  }

  function onClientChange(value: string) {
    setClientFilter(value);
    applyFilters(statusFilter, value);
  }

  const summary = useMemo(() => {
    const total = orders.length;
    const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
    return { total, byStatus };
  }, [orders]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.client_id || !form.part_name || !form.total_pieces) {
      setFormError("Cliente, pieza y cantidad total son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          client_id: Number(form.client_id),
          total_pieces: Number(form.total_pieces),
          assigned_inspector_id: form.assigned_inspector_id
            ? Number(form.assigned_inspector_id)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear la orden");
        setSubmitting(false);
        return;
      }
      setForm(emptyForm);
      setShowForm(false);
      await applyFilters(statusFilter, clientFilter);
    } catch {
      setFormError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Pendientes" value={summary.byStatus.pendiente ?? 0} />
        <SummaryCard label="En proceso" value={summary.byStatus.en_proceso ?? 0} />
        <SummaryCard label="Completadas" value={summary.byStatus.completada ?? 0} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">Todos los estatus</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={clientFilter}
            onChange={(e) => onClientChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {loading && <span className="text-xs text-slate-400">Cargando...</span>}
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          + Nueva orden
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>Orden</Th>
              <Th>Cliente</Th>
              <Th>Pieza / Parte</Th>
              <Th>Lote</Th>
              <Th>Cantidad</Th>
              <Th>OK / NG</Th>
              <Th>Inspector</Th>
              <Th>Compromiso</Th>
              <Th>Estatus</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  No hay ordenes con estos filtros.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {o.order_number}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {o.client_name ?? "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{o.part_name}</div>
                  {o.part_number && (
                    <div className="text-xs text-slate-400">{o.part_number}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{o.lot_number ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{o.total_pieces}</td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="text-emerald-600">{o.pieces_ok}</span>
                  {" / "}
                  <span className="text-red-600">{o.pieces_ng}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {o.inspector_name ?? "Sin asignar"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {o.due_date ? new Date(o.due_date).toLocaleDateString("es-MX") : "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[o.status]}`}
                  >
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Nueva orden de inspeccion</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cliente" required className="col-span-2">
                  <select
                    value={form.client_id}
                    onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nombre de la pieza" required className="col-span-2">
                  <input
                    value={form.part_name}
                    onChange={(e) => setForm({ ...form, part_name: e.target.value })}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Numero de parte">
                  <input
                    value={form.part_number}
                    onChange={(e) => setForm({ ...form, part_number: e.target.value })}
                    className="input"
                  />
                </Field>

                <Field label="Numero de lote">
                  <input
                    value={form.lot_number}
                    onChange={(e) => setForm({ ...form, lot_number: e.target.value })}
                    className="input"
                  />
                </Field>

                <Field label="Cantidad total" required>
                  <input
                    type="number"
                    min={1}
                    value={form.total_pieces}
                    onChange={(e) => setForm({ ...form, total_pieces: e.target.value })}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Fecha compromiso">
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="input"
                  />
                </Field>

                <Field label="Inspector asignado" className="col-span-2">
                  <select
                    value={form.assigned_inspector_id}
                    onChange={(e) =>
                      setForm({ ...form, assigned_inspector_id: e.target.value })
                    }
                    className="input"
                  >
                    <option value="">Sin asignar</option>
                    {inspectors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Criterio de defecto a buscar" className="col-span-2">
                  <textarea
                    value={form.defect_criteria}
                    onChange={(e) => setForm({ ...form, defect_criteria: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </Field>
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
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Crear orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
