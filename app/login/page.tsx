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
  const [showForgotNote, setShowForgotNote] = useState(false);

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

      <div className="eb-brand-tag">EmBajio Operaciones</div>

      <div className="eb-login-frame">
        <div className="eb-login-card">
          <div className="eb-status-bar">
            <span className="eb-status-dots">
              <span />
              <span />
            </span>
            Sistema activo
            <span className="eb-status-dots">
              <span />
              <span />
            </span>
          </div>

          <div className="eb-login-cols">
            <div className="eb-login-brand-col">
              <CubeIcon className="eb-logo-mark" />
              <div className="eb-logo-title">
                EmBajio
                <span>Operaciones</span>
              </div>
              <div className="eb-logo-sub">
                Inspeccion industrial
                <br />
                Powered by <strong>Alta Vibra</strong>
              </div>
            </div>

            <div className="eb-login-form-col">
              {error && <div className="eb-error-msg">{error}</div>}
              <form onSubmit={handleSubmit} noValidate>
                <div className="eb-form-row">
                  <label htmlFor="email">Correo electronico</label>
                  <div className="eb-input-wrap">
                    <MailIcon />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="usuario@embajio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="eb-form-row">
                  <label htmlFor="password">Contrasena</label>
                  <div className="eb-input-wrap">
                    <LockIcon />
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {showForgotNote ? (
                  <p className="eb-forgot-note">
                    Pide a tu administrador que restablezca tu contrasena.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="eb-forgot"
                    onClick={() => setShowForgotNote(true)}
                  >
                    ¿Olvidaste tu contrasena?
                  </button>
                )}

                <button type="submit" className="eb-btn-login" disabled={loading}>
                  {loading ? "Verificando…" : "Entrar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 6 9 6.5L21 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="10.5" width="16" height="10" rx="2.2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" strokeLinecap="round" />
    </svg>
  );
}

function CubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M24 4 43 15v18L24 44 5 33V15Z" />
      <path d="M24 4v18M24 22 5 15M24 22l19-7M24 22v22" strokeLinecap="round" />
    </svg>
  );
}
