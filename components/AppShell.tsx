import type { ReactNode } from "react";
import UserMenu from "@/components/UserMenu";
import { CubeIcon } from "@/components/icons";
import type { Role } from "@/lib/session";

interface NavItem {
  label: string;
  href?: string;
  soon?: boolean;
}

export default function AppShell({
  title,
  roleLabel,
  userName,
  role,
  navItems,
  children,
}: {
  title: string;
  roleLabel: string;
  userName: string;
  role: Role;
  navItems: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-kraft-50">
      <header className="border-b border-kraft-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <CubeIcon className="h-7 w-7 shrink-0 text-ink-700" />
            <div>
              <p className="text-sm leading-tight font-bold text-ink-700">
                EmBajio<span className="text-olive-600"> Operaciones</span>
              </p>
              <p className="text-xs text-ink-500/60">Powered by Alta Vibra</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-olive-400/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-olive-700 uppercase sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-olive-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-olive-600" />
              </span>
              Proteccion activa
            </span>
          </div>
          <UserMenu userName={userName} roleLabel={roleLabel} role={role} />
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-kraft-100 px-4 sm:px-6">
          {navItems.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                className="border-b-2 border-transparent px-3 py-2.5 text-xs font-bold tracking-wide whitespace-nowrap text-ink-700/70 uppercase transition hover:border-olive-500 hover:text-ink-700"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                className="flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-xs font-bold tracking-wide whitespace-nowrap text-ink-500/35 uppercase"
              >
                {item.label}
                {item.soon && (
                  <span className="rounded bg-kraft-100 px-1.5 py-0.5 text-[9px] font-medium tracking-normal text-ink-500/50 normal-case">
                    Proximamente
                  </span>
                )}
              </span>
            )
          )}
        </nav>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-lg font-semibold text-ink-700">{title}</h1>
        {children}
      </main>
    </div>
  );
}
