"use client";

import { useState } from "react";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "inspector" | "cliente";
  active: boolean;
  created_at: string;
  client_id: number | null;
  client_name: string | null;
}

interface ClientOption {
  id: number;
  name: string;
}

const ROLE_LABELS: Record<UserRow["role"], string> = {
  admin: "Administrador",
  inspector: "Inspector",
  cliente: "Cliente",
};

const ROLE_STYLES: Record<UserRow["role"], string> = {
  admin: "bg-olive-400/20 text-olive-700 ring-olive-500/30",
  inspector: "bg-ink-700/8 text-ink-700 ring-ink-700/20",
  cliente: "bg-kraft-100 text-kraft-700 ring-kraft-400/40",
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "inspector" as UserRow["role"],
  client_id: "",
};

export default function UsersManager({
  initialUsers,
  clients,
  currentUserId,
}: {
  initialUsers: UserRow[];
  clients: ClientOption[];
  currentUserId: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name || !form.email || !form.password) {
      setFormError("Nombre, correo y contrasena son requeridos");
      return;
    }
    if (form.role === "cliente" && !form.client_id) {
      setFormError("Selecciona el cliente para este usuario");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          client_id: form.role === "cliente" ? Number(form.client_id) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear el usuario");
        setSubmitting(false);
        return;
      }
      const client = clients.find((c) => c.id === data.user.client_id);
      setUsers((prev) =>
        [...prev, { ...data.user, client_name: client?.name ?? null }].sort((a, b) =>
          a.role === b.role ? a.name.localeCompare(b.name) : a.role.localeCompare(b.role)
        )
      );
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setFormError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(user: UserRow) {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-gradient-to-br from-olive-400 to-olive-600 px-5 py-2 text-sm font-bold tracking-wide text-ink-700 shadow-[0_4px_14px_rgba(90,60,25,0.25)] transition hover:shadow-[0_6px_18px_rgba(90,60,25,0.35)]"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-kraft-200 text-sm">
          <thead className="bg-kraft-50">
            <tr>
              <Th>Nombre</Th>
              <Th>Correo</Th>
              <Th>Rol</Th>
              <Th>Cliente</Th>
              <Th>Estatus</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kraft-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-olive-400/8">
                <td className="px-4 py-3 font-medium text-ink-700">{u.name}</td>
                <td className="px-4 py-3 text-ink-700/80">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[u.role]}`}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-700/80">{u.client_name ?? "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      u.active
                        ? "bg-olive-400/15 text-olive-700 ring-olive-500/25"
                        : "bg-kraft-50 text-ink-500/50 ring-kraft-300/50"
                    }`}
                  >
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-ink-500/40">Tu cuenta</span>
                  ) : (
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={togglingId === u.id}
                      className="text-xs font-semibold text-ink-700/70 underline decoration-dotted hover:text-ink-700 disabled:opacity-50"
                    >
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-kraft-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-700">Nuevo usuario</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-ink-500/50 hover:text-ink-700"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Nombre" required>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  required
                />
              </Field>

              <Field label="Correo" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  required
                />
              </Field>

              <Field label="Contrasena" required>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input"
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </Field>

              <Field label="Rol" required>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as UserRow["role"] })
                  }
                  className="input"
                >
                  <option value="admin">Administrador</option>
                  <option value="inspector">Inspector</option>
                  <option value="cliente">Cliente</option>
                </select>
              </Field>

              {form.role === "cliente" && (
                <Field label="Cliente" required>
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
              )}

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
                  {submitting ? "Creando..." : "Crear usuario"}
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
