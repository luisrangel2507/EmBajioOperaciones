"use client";

import { useEffect, useState } from "react";
import { QUALITY_CATEGORIES, type QualityCategory } from "@/lib/qualityCategories";

export interface QualityRecordRow {
  id: number;
  record_number: string;
  title: string;
  part_name: string | null;
  part_number: string | null;
  description: string | null;
  status: "activo" | "en_revision" | "obsoleto";
  severity: number | null;
  occurrence: number | null;
  detection: number | null;
  due_date: string | null;
  created_at: string;
  client_id: number | null;
  client_name: string | null;
}

interface ClientOption {
  id: number;
  name: string;
}

const STATUS_LABELS: Record<QualityRecordRow["status"], string> = {
  activo: "Activo",
  en_revision: "En revision",
  obsoleto: "Obsoleto",
};

const STATUS_STYLES: Record<QualityRecordRow["status"], string> = {
  activo: "bg-olive-400/20 text-olive-700 ring-olive-500/30",
  en_revision: "bg-kraft-100 text-kraft-700 ring-kraft-400/40",
  obsoleto: "bg-kraft-50 text-ink-500/50 ring-kraft-300/50",
};

const emptyForm = {
  title: "",
  client_id: "",
  part_name: "",
  part_number: "",
  description: "",
  severity: "",
  occurrence: "",
  detection: "",
  due_date: "",
};

export default function QualityRecordsPanel({
  category,
  clients,
}: {
  category: QualityCategory;
  clients: ClientOption[];
}) {
  const meta = QUALITY_CATEGORIES[category];
  const variant = meta.variant;

  const [records, setRecords] = useState<QualityRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos al montar/cambiar de categoria
    setLoading(true);
    fetch(`/api/quality-records?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRecords(data.records ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) {
      setFormError("El titulo es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quality-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          ...form,
          client_id: form.client_id ? Number(form.client_id) : null,
          severity: form.severity ? Number(form.severity) : null,
          occurrence: form.occurrence ? Number(form.occurrence) : null,
          detection: form.detection ? Number(form.detection) : null,
          due_date: form.due_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear el registro");
        setSubmitting(false);
        return;
      }
      const client = clients.find((c) => c.id === Number(form.client_id));
      setRecords((prev) => [
        {
          id: data.record.id,
          record_number: data.record.record_number,
          title: form.title,
          part_name: form.part_name || null,
          part_number: form.part_number || null,
          description: form.description || null,
          status: "activo",
          severity: form.severity ? Number(form.severity) : null,
          occurrence: form.occurrence ? Number(form.occurrence) : null,
          detection: form.detection ? Number(form.detection) : null,
          due_date: form.due_date || null,
          created_at: new Date().toISOString(),
          client_id: form.client_id ? Number(form.client_id) : null,
          client_name: client?.name ?? null,
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

  async function changeStatus(id: number, status: QualityRecordRow["status"]) {
    const res = await fetch(`/api/quality-records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-500/60">
          Prefijo de folio: <span className="font-semibold text-ink-700/70">{meta.prefix}</span>
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold tracking-wide text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] transition hover:shadow-[0_6px_18px_rgba(90,60,25,0.35)]"
        >
          + Nuevo registro
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-kraft-200 text-sm">
          <thead className="bg-kraft-50">
            <tr>
              <Th>Folio</Th>
              <Th>Titulo</Th>
              <Th>Pieza / Cliente</Th>
              {variant === "fmea" && <Th>S · O · D · RPN</Th>}
              {variant === "dated" && <Th>Vence</Th>}
              <Th>Estatus</Th>
              <Th>Fecha</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kraft-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500/40">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500/40">
                  No hay registros de {meta.label.toLowerCase()}.
                </td>
              </tr>
            )}
            {records.map((r) => {
              const rpn =
                r.severity && r.occurrence && r.detection
                  ? r.severity * r.occurrence * r.detection
                  : null;
              return (
                <tr key={r.id} className="hover:bg-olive-400/8">
                  <td className="px-4 py-3 font-bold text-olive-700">{r.record_number}</td>
                  <td className="px-4 py-3 text-ink-700/80">
                    <div className="font-medium text-ink-700">{r.title}</div>
                    {r.description && (
                      <div className="max-w-xs truncate text-xs text-ink-500/50">
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">
                    <div>{r.part_name ?? "-"}</div>
                    {r.client_name && (
                      <div className="text-xs text-ink-500/50">{r.client_name}</div>
                    )}
                  </td>
                  {variant === "fmea" && (
                    <td className="px-4 py-3 text-ink-700/80">
                      {r.severity ?? "-"} · {r.occurrence ?? "-"} · {r.detection ?? "-"} ·{" "}
                      <span
                        className={`font-bold ${rpn && rpn >= 100 ? "text-red-600" : "text-ink-700"}`}
                      >
                        {rpn ?? "-"}
                      </span>
                    </td>
                  )}
                  {variant === "dated" && (
                    <td className="px-4 py-3 text-ink-700/80">
                      {r.due_date ? new Date(r.due_date).toLocaleDateString("es-MX") : "-"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        changeStatus(r.id, e.target.value as QualityRecordRow["status"])
                      }
                      className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset focus:outline-none ${STATUS_STYLES[r.status]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-ink-700/80">
                    {new Date(r.created_at).toLocaleDateString("es-MX")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-700">
                Nuevo registro · {meta.label}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-ink-500/50 hover:text-ink-700"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Titulo" required>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  required
                />
              </Field>

              <Field label="Cliente">
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pieza / Parte">
                  <input
                    value={form.part_name}
                    onChange={(e) => setForm({ ...form, part_name: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Numero de parte">
                  <input
                    value={form.part_number}
                    onChange={(e) => setForm({ ...form, part_number: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>

              {variant === "dated" && (
                <Field label="Fecha de vencimiento">
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="input"
                  />
                </Field>
              )}

              {variant === "fmea" && (
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Severidad (1-10)">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <Field label="Ocurrencia (1-10)">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.occurrence}
                      onChange={(e) => setForm({ ...form, occurrence: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <Field label="Deteccion (1-10)">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.detection}
                      onChange={(e) => setForm({ ...form, detection: e.target.value })}
                      className="input"
                    />
                  </Field>
                </div>
              )}

              <Field label="Descripcion / notas">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={3}
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
                  {submitting ? "Creando..." : "Crear registro"}
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
