import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";

interface NavItem {
  label: string;
  href?: string;
  soon?: boolean;
}

export default function AppShell({
  title,
  roleLabel,
  userName,
  navItems,
  children,
}: {
  title: string;
  roleLabel: string;
  userName: string;
  navItems: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white sm:flex sm:flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-sm font-semibold text-slate-900">EmBajio Operaciones</p>
          <p className="text-xs text-slate-400">{roleLabel}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-400"
              >
                {item.label}
                {item.soon && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    Proximamente
                  </span>
                )}
              </span>
            )
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{userName}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 bg-slate-50 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
