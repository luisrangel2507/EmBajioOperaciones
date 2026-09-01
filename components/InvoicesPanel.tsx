"use client";

import { useState } from "react";

export interface InvoiceRow {
  id: number;
  invoice_number: string;
  amount: string | number;
  status: "pendiente" | "pagada" | "vencida";
  issued_at: string;
  due_date: string | null;
  paid_at: string | null;
  client_id: number | null;
  client_name: string | null;
  order_id: number | null;
  order_number: string | null;
}

interface ClientOption {
  id: number;
  name: string;
}

interface OrderOption {
  id: number;
  order_number: string;
}

const STATUS_LABELS: Record<InvoiceRow["status"], string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

const STATUS_STYLES: Record<InvoiceRow["status"], string> = {
  pendiente: "bg-kraft-100 text-kraft-700 ring-kraft-400/40",
  pagada: "bg-olive-400/20 text-olive-700 ring-olive-500/30",
  vencida: "bg-red-100 text-red-700 ring-red-400/40",
};

const emptyForm = {
  client_id: "",
  order_id: "",
  amount: "",
  due_date: "",
};

function money(value: string | number) {
  return Number(value).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default function InvoicesPanel({
  initialInvoices,
  clients,
  orders,
}: {
  initialInvoices: InvoiceRow[];
  clients: ClientOption[];
  orders: OrderOption[];
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
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
      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setInvoices(data.invoices);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const totalFacturado = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPendiente = invoices
    .filter((i) => i.status !== "pagada")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPagado = invoices
    .filter((i) => i.status === "pagada")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueCount = invoices.filter(
    (i) => i.status === "pendiente" && i.due_date && i.due_date < today
  ).length;

  async function changeStatus(id: number, status: InvoiceRow["status"]) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setInvoices((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status, paid_at: data.invoice.paid_at } : i))
      );
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.client_id) {
      setFormError("Selecciona un cliente");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("El monto debe ser mayor a 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          order_id: form.order_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear la factura");
        setSubmitting(false);
        return;
      }
      const client = clients.find((c) => c.id === Number(form.client_id));
      const order = orders.find((o) => o.id === Number(form.order_id));
      setInvoices((prev) => [
        {
          id: data.invoice.id,
          invoice_number: data.invoice.invoice_number,
          amount: form.amount,
          status: "pendiente",
          issued_at: data.invoice.issued_at,
          due_date: form.due_date || null,
          paid_at: null,
          client_id: Number(form.client_id),
          client_name: client?.name ?? null,
          order_id: form.order_id ? Number(form.order_id) : null,
          order_number: order?.order_number ?? null,
        },
        ...prev,
      ]);
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setFormError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total facturado" value={money(totalFacturado)} accent="border-kraft-400/50" />
        <SummaryCard label="Por cobrar" value={money(totalPendiente)} accent="border-red-400/40" />
        <SummaryCard label="Cobrado" value={money(totalPagado)} accent="border-olive-400/40" />
        <SummaryCard label="Facturas vencidas" value={String(overdueCount)} accent="border-red-400/40" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              applyFilters(e.target.value, clientFilter);
            }}
            className="rounded-lg border border-kraft-300 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm focus:border-olive-600 focus:outline-none"
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
            onChange={(e) => {
              setClientFilter(e.target.value);
              applyFilters(statusFilter, e.target.value);
            }}
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
          + Nueva factura
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-kraft-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-kraft-200 text-sm">
          <thead className="bg-kraft-50">
            <tr>
              <Th>Folio</Th>
              <Th>Cliente</Th>
              <Th>Orden</Th>
              <Th>Monto</Th>
              <Th>Emitida</Th>
              <Th>Vencimiento</Th>
              <Th>Estatus</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kraft-100">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500/40">
                  No hay facturas registradas.
                </td>
              </tr>
            )}
            {invoices.map((inv) => {
              const isOverdue =
                inv.status === "pendiente" && inv.due_date !== null && inv.due_date < today;
              return (
                <tr key={inv.id} className="hover:bg-olive-400/8">
                  <td className="px-4 py-3 font-bold text-olive-700">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-ink-700/80">{inv.client_name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink-700/80">{inv.order_number ?? "-"}</td>
                  <td className="px-4 py-3 font-medium text-ink-700">{money(inv.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-700/80">
                    {new Date(inv.issued_at).toLocaleDateString("es-MX")}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${isOverdue ? "font-bold text-red-600" : "text-ink-700/80"}`}>
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString("es-MX") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={inv.status}
                      onChange={(e) =>
                        changeStatus(inv.id, e.target.value as InvoiceRow["status"])
                      }
                      className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset focus:outline-none ${STATUS_STYLES[inv.status]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4">
          <div className="w-full max-w-lg rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-700">Nueva factura</h2>
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

                <Field label="Orden relacionada" className="col-span-2">
                  <select
                    value={form.order_id}
                    onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Sin orden especifica</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Monto (MXN)" required>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Fecha de vencimiento">
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="input"
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
                  {submitting ? "Creando..." : "Crear factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      <p className="text-xl font-black tracking-tight text-ink-700">{value}</p>
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
