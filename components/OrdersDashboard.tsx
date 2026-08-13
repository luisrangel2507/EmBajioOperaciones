"use client";

import { useState } from "react";

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
  pendiente: "bg-kraft-100 text-kraft-700 ring-kraft-400/40",
  en_proceso: "bg-ink-700/8 text-ink-700 ring-ink-700/20",
  completada: "bg-olive-400/20 text-olive-700 ring-olive-500/30",
  cancelada: "bg-kraft-50 text-ink-500/50 ring-kraft-300/50",
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

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
}

export default function OrdersDashboard({
  initialOrders,
  clients,
  inspectors,
  defaultStatus,
}: {
  initialOrders: OrderRow[];
  clients: OptionRow[];
  inspectors: OptionRow[];
  defaultStatus?: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState(defaultStatus ?? "");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(message: string, variant: Toast["variant"]) {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

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
      pushToast(`Orden ${data.order.order_number} creada`, "success");
    } catch {
      setFormError("Error de conexion. Intenta de nuevo.");
      pushToast("No se pudo crear la orden", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-kraft-300 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm focus:border-olive-600 focus:outline-none"
          >
            <option value={defaultStatus ?? ""}>
              {defaultStatus ? "Pendiente + en proceso" : "Todos los estatus"}
            </option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={clientFilter}
            onChange={(e) => onClientChange(e.target.value)}
            className="rounded-lg border border-kraft-300 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm focus:border-olive-600 focus:outline-none"
          >
            <option value="">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {loading && <span className="text-xs text-ink-500/50">Cargando...</span>}
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold tracking-wide text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(90,60,25,0.35)] active:scale-95"
        >
          + Nueva orden
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="min-w-full divide-y divide-kraft-200 text-sm">
            <thead className="sticky top-0 z-10 bg-kraft-50">
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
            <tbody className="divide-y divide-kraft-100">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink-500/40">
                    No hay ordenes con estos filtros.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-olive-400/8">
                  <td className="px-4 py-3 font-bold text-olive-700">
                    {o.order_number}
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">
                    {o.client_name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">
                    <div>{o.part_name}</div>
                    {o.part_number && (
                      <div className="text-xs text-ink-500/50">{o.part_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">{o.lot_number ?? "-"}</td>
                  <td className="px-4 py-3 text-ink-700/80">{o.total_pieces}</td>
                  <td className="px-4 py-3 text-ink-700/80">
                    <span className="text-olive-700">{o.pieces_ok}</span>
                    {" / "}
                    <span className="text-red-600">{o.pieces_ng}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">
                    {o.inspector_name ?? "Sin asignar"}
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">
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
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4">
          <div className="w-full max-w-lg rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-700">Nueva orden de inspeccion</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-ink-500/50 hover:text-ink-700"
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
                  className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700/70 hover:bg-kraft-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Crear orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
            t.variant === "success"
              ? "border-olive-500/30 bg-white text-olive-700"
              : "border-red-300 bg-white text-red-700"
          }`}
        >
          {t.message}
        </div>
      ))}
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
