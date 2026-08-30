"use client";

import { useState } from "react";
import { SCRAP_REASONS } from "@/lib/scrapReasons";

export interface ScrapRow {
  id: number;
  scrap_date: string;
  part_name: string;
  part_number: string | null;
  station_num: number | null;
  operation: string | null;
  quantity: number;
  reason: string;
  notes: string | null;
  client_id: number | null;
  client_name: string | null;
  order_id: number | null;
  order_number: string | null;
  order_total_pieces: number | null;
  created_at: string;
}

interface ClientOption {
  id: number;
  name: string;
}

export interface OrderOption {
  id: number;
  order_number: string;
  part_name: string;
  part_number: string | null;
  total_pieces: number;
}

const emptyForm = {
  scrap_date: "",
  part_name: "",
  part_number: "",
  station_num: "",
  operation: "",
  quantity: "",
  reason: "",
  client_id: "",
  order_id: "",
  notes: "",
};

export default function ScrapPanel({
  initialRecords,
  clients,
  orders,
}: {
  initialRecords: ScrapRow[];
  clients: ClientOption[];
  orders: OrderOption[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalQty = records.reduce((sum, r) => sum + r.quantity, 0);
  const reasonTotals = new Map<string, number>();
  for (const r of records) {
    reasonTotals.set(r.reason, (reasonTotals.get(r.reason) ?? 0) + r.quantity);
  }
  const topReason = [...reasonTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  // Pivote: piezas (u ordenes, cuando estan ligadas) en filas, motivos en columnas
  const usedReasons = SCRAP_REASONS.filter((r) => reasonTotals.has(r));
  const byPart = new Map<
    string,
    {
      partName: string;
      partNumber: string | null;
      orderNumber: string | null;
      orderTotalPieces: number | null;
      byReason: Map<string, number>;
      total: number;
    }
  >();
  for (const r of records) {
    const key = r.order_id ? `order-${r.order_id}` : `part-${r.part_name}|${r.part_number ?? ""}`;
    const entry = byPart.get(key) ?? {
      partName: r.part_name,
      partNumber: r.part_number,
      orderNumber: r.order_number,
      orderTotalPieces: r.order_total_pieces,
      byReason: new Map<string, number>(),
      total: 0,
    };
    entry.byReason.set(r.reason, (entry.byReason.get(r.reason) ?? 0) + r.quantity);
    entry.total += r.quantity;
    byPart.set(key, entry);
  }
  const partRows = [...byPart.values()].sort((a, b) => b.total - a.total);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.part_name.trim()) {
      setFormError("La pieza es requerida");
      return;
    }
    if (!form.reason) {
      setFormError("Selecciona un motivo del desecho");
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      setFormError("La cantidad debe ser mayor a 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          station_num: form.station_num || null,
          client_id: form.client_id || null,
          order_id: form.order_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo guardar el registro");
        setSubmitting(false);
        return;
      }
      const client = clients.find((c) => c.id === Number(form.client_id));
      const order = orders.find((o) => o.id === Number(form.order_id));
      setRecords((prev) => [
        {
          id: data.record.id,
          scrap_date: form.scrap_date || new Date().toISOString().slice(0, 10),
          part_name: form.part_name,
          part_number: form.part_number || null,
          station_num: form.station_num ? Number(form.station_num) : null,
          operation: form.operation || null,
          quantity: Number(form.quantity),
          reason: form.reason,
          notes: form.notes || null,
          client_id: form.client_id ? Number(form.client_id) : null,
          client_name: client?.name ?? null,
          order_id: order?.id ?? null,
          order_number: order?.order_number ?? null,
          order_total_pieces: order?.total_pieces ?? null,
          created_at: new Date().toISOString(),
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
        <SummaryCard label="Registros" value={String(records.length)} accent="border-kraft-400/50" />
        <SummaryCard label="Piezas desechadas" value={String(totalQty)} accent="border-red-400/40" />
        <SummaryCard
          label="Motivo principal"
          value={topReason ? topReason[0] : "-"}
          accent="border-kraft-400/50"
          small
        />
        <div className="flex items-center justify-end sm:col-span-1">
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold tracking-wide text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(90,60,25,0.35)] active:scale-95"
          >
            + Registrar desecho
          </button>
        </div>
      </div>

      {partRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-kraft-200 bg-white shadow-sm">
          <p className="border-b border-kraft-100 px-4 py-2.5 text-xs font-bold tracking-widest text-ink-500/50 uppercase">
            Desechos por pieza
          </p>
          <table className="min-w-full divide-y divide-kraft-200 text-sm">
            <thead className="bg-kraft-50">
              <tr>
                <th rowSpan={2} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase align-bottom">
                  Pieza
                </th>
                <th
                  colSpan={usedReasons.length}
                  className="border-b border-kraft-200 px-4 py-1.5 text-center text-[10px] font-bold tracking-widest text-ink-500/50 uppercase"
                >
                  Motivo del desecho
                </th>
                <th rowSpan={2} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase align-bottom">
                  Total piezas
                </th>
                <th rowSpan={2} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase align-bottom">
                  % Desechos
                </th>
                <th rowSpan={2} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-500/60 uppercase align-bottom">
                  PPM
                </th>
              </tr>
              <tr>
                {usedReasons.map((r) => (
                  <Th key={r}>{r}</Th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft-100">
              {partRows.map((p) => {
                const pct =
                  p.orderTotalPieces && p.orderTotalPieces > 0
                    ? (p.total / p.orderTotalPieces) * 100
                    : null;
                const ppm =
                  p.orderTotalPieces && p.orderTotalPieces > 0
                    ? (p.total / p.orderTotalPieces) * 1_000_000
                    : null;
                return (
                  <tr
                    key={`${p.orderNumber ?? "sin-orden"}|${p.partName}|${p.partNumber ?? ""}`}
                    className="hover:bg-olive-400/8"
                  >
                    <td className="px-4 py-3 text-ink-700/80">
                      <div className="font-medium text-ink-700">{p.partName}</div>
                      {p.partNumber && (
                        <div className="text-xs text-ink-500/50">{p.partNumber}</div>
                      )}
                      {p.orderNumber && (
                        <div className="text-xs text-olive-700">{p.orderNumber}</div>
                      )}
                    </td>
                    {usedReasons.map((r) => (
                      <td key={r} className="px-4 py-3 text-ink-700/80">
                        {p.byReason.get(r) ?? 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-bold text-red-600">{p.total}</td>
                    <td className="px-4 py-3 text-ink-700/80">
                      {pct !== null ? `${pct.toFixed(2)}%` : "-"}
                    </td>
                    <td className="px-4 py-3 text-ink-700/80">
                      {ppm !== null ? Math.round(ppm).toLocaleString("es-MX") : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-kraft-200 bg-kraft-50 font-bold">
              <tr>
                <td className="px-4 py-3 text-ink-700">Total de todas las piezas</td>
                {usedReasons.map((r) => (
                  <td key={r} className="px-4 py-3 text-ink-700">
                    {reasonTotals.get(r) ?? 0}
                  </td>
                ))}
                <td className="px-4 py-3 text-red-600">{totalQty}</td>
                <td className="px-4 py-3 text-ink-500/40">-</td>
                <td className="px-4 py-3 text-ink-500/40">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-kraft-200 bg-white shadow-sm">
        <p className="border-b border-kraft-100 px-4 py-2.5 text-xs font-bold tracking-widest text-ink-500/50 uppercase">
          Registros individuales
        </p>
        <table className="min-w-full divide-y divide-kraft-200 text-sm">
          <thead className="bg-kraft-50">
            <tr>
              <Th>Fecha</Th>
              <Th>Pieza</Th>
              <Th>Orden</Th>
              <Th>Estacion</Th>
              <Th>Operacion</Th>
              <Th>Cantidad</Th>
              <Th>Motivo</Th>
              <Th>Cliente</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kraft-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-500/40">
                  No hay desechos registrados.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-olive-400/8">
                <td className="px-4 py-3 whitespace-nowrap text-ink-700/80">
                  {new Date(r.scrap_date).toLocaleDateString("es-MX")}
                </td>
                <td className="px-4 py-3 text-ink-700/80">
                  <div className="font-medium text-ink-700">{r.part_name}</div>
                  {r.part_number && (
                    <div className="text-xs text-ink-500/50">{r.part_number}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-700/80">{r.order_number ?? "-"}</td>
                <td className="px-4 py-3 text-ink-700/80">
                  {r.station_num ? `Est. ${r.station_num}` : "-"}
                </td>
                <td className="px-4 py-3 text-ink-700/80">{r.operation ?? "-"}</td>
                <td className="px-4 py-3 font-bold text-red-600">{r.quantity}</td>
                <td className="px-4 py-3 text-ink-700/80">{r.reason}</td>
                <td className="px-4 py-3 text-ink-700/80">{r.client_name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-700">Registrar desecho</h2>
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
                <Field label="Fecha">
                  <input
                    type="date"
                    value={form.scrap_date}
                    onChange={(e) => setForm({ ...form, scrap_date: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Cantidad" required>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Orden (para % y PPM)" className="col-span-2">
                  <select
                    value={form.order_id}
                    onChange={(e) => {
                      const orderId = e.target.value;
                      const order = orders.find((o) => o.id === Number(orderId));
                      setForm({
                        ...form,
                        order_id: orderId,
                        part_name: order ? order.part_name : form.part_name,
                        part_number: order ? (order.part_number ?? "") : form.part_number,
                      });
                    }}
                    className="input"
                  >
                    <option value="">Sin orden (no calcula % ni PPM)</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} · {o.part_name} ({o.total_pieces} pz)
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Pieza" required className="col-span-2">
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
                <Field label="Estacion">
                  <select
                    value={form.station_num}
                    onChange={(e) => setForm({ ...form, station_num: e.target.value })}
                    className="input"
                  >
                    <option value="">Sin asignar</option>
                    {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Estacion {n}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Operacion">
                  <input
                    value={form.operation}
                    onChange={(e) => setForm({ ...form, operation: e.target.value })}
                    className="input"
                    placeholder="Ej. Inspeccion visual"
                  />
                </Field>
                <Field label="Motivo del desecho" required>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Selecciona un motivo</option>
                    {SCRAP_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Cliente" className="col-span-2">
                  <select
                    value={form.client_id}
                    onChange={(e) => setForm({ ...form, client_id: e.target.value })}
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

                <Field label="Descripcion / notas" className="col-span-2">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                  {submitting ? "Guardando..." : "Guardar"}
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
  small,
}: {
  label: string;
  value: string;
  accent: string;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${accent}`}
    >
      <p className={`font-black tracking-tight text-ink-700 ${small ? "text-sm" : "text-2xl"}`}>
        {value}
      </p>
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
