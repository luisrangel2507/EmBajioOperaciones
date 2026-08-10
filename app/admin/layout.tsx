import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const NAV_ITEMS = [
  { label: "Ordenes", href: "/admin" },
  { label: "Facturacion", soon: true },
  { label: "RH / Turnos", soon: true },
  { label: "Reportes", soon: true },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <AppShell
      title="Panel de administracion"
      roleLabel="Administrador"
      userName={session.name}
      navItems={NAV_ITEMS}
    >
      {children}
    </AppShell>
  );
}
