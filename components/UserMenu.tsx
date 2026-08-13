"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/session";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export default function UserMenu({
  userName,
  roleLabel,
  role,
}: {
  userName: string;
  roleLabel: string;
  role: Role;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative flex items-center gap-2.5" ref={ref}>
      <div className="hidden text-right sm:block">
        <p className="text-xs leading-tight font-semibold text-ink-700">{userName}</p>
        <p className="text-[10px] leading-tight text-ink-500/60">{roleLabel}</p>
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-400/20 text-sm font-bold text-olive-700 ring-1 ring-olive-500/30 transition hover:bg-olive-400/30"
        aria-label="Menu de perfil"
        aria-expanded={open}
      >
        {initialsOf(userName)}
      </button>

      {open && (
        <div className="absolute top-11 right-0 z-50 w-56 overflow-hidden rounded-lg border border-kraft-200 bg-white shadow-lg">
          <div className="border-b border-kraft-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-700">{userName}</p>
            <p className="text-xs text-ink-500/60">{roleLabel}</p>
          </div>
          <nav className="py-1">
            {role === "admin" && (
              <a
                href="/admin/usuarios"
                className="block px-4 py-2 text-sm text-ink-700/80 transition hover:bg-kraft-50"
                onClick={() => setOpen(false)}
              >
                Usuarios y roles
              </a>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="block w-full px-4 py-2 text-left text-sm text-ink-700/80 transition hover:bg-kraft-50 disabled:opacity-50"
            >
              {loggingOut ? "Saliendo..." : "Cerrar sesion"}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
