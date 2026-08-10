"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Completa correo y contrasena.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesion");
        setLoading(false);
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("No se pudo conectar al servidor.");
      setLoading(false);
    }
  }

  return (
    <div className="eb-login">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- fuente exclusiva del login, no debe cargar en el resto de la app */}
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="eb-grid-lines" />
      <div className="eb-brand-tag">EmBajio Operaciones</div>

      <div className="eb-login-card">
        <div className="eb-corner tl" />
        <div className="eb-corner tr" />
        <div className="eb-corner bl" />
        <div className="eb-corner br" />

        <div className="eb-status-bar">
          <span>Sistema activo</span>
          <div className="eb-status-dot" />
        </div>

        <div className="eb-login-cols">
          <div className="eb-login-form-col">
            {error && <div className="eb-error-msg">{error}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="eb-form-row">
                <label htmlFor="email">Correo</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="eb-form-row">
                <label htmlFor="password">Contrasena</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="eb-btn-login" disabled={loading}>
                {loading ? "■  Verificando…" : "▶  Entrar"}
              </button>
            </form>
          </div>

          <div className="eb-login-brand-col">
            <div className="eb-logo-mark">EB</div>
            <div className="eb-logo-title">
              EmBajio
              <span>Operaciones</span>
            </div>
            <div className="eb-logo-sub">Inspeccion Industrial</div>
            <div className="eb-brand-divider" />
            <div className="eb-powered-by">
              Powered by
              <strong>Alta Vibra</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
