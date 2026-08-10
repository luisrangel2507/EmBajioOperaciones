import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";
import { CubeIcon } from "@/components/icons";

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
    <div className="flex min-h-screen flex-1 bg-kraft-50">
      <aside className="hidden w-56 shrink-0 border-r border-kraft-200 bg-white sm:flex sm:flex-col">
        <div className="flex items-center gap-2.5 border-b border-kraft-200 px-5 py-5">
          <CubeIcon className="h-7 w-7 shrink-0 text-ink-700" />
          <div>
            <p className="text-sm leading-tight font-bold text-ink-700">
              EmBajio<span className="text-olive-600"> Operaciones</span>
            </p>
            <p className="text-xs text-ink-500/60">{roleLabel}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-ink-700/80 transition hover:bg-olive-400/15 hover:text-ink-700"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink-500/40"
              >
                {item.label}
                {item.soon && (
                  <span className="rounded bg-kraft-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-500/50">
                    Proximamente
                  </span>
                )}
              </span>
            )
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-kraft-200 bg-white px-4 py-3 sm:px-6">
          <h1 className="text-lg font-semibold text-ink-700">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500/70">{userName}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
