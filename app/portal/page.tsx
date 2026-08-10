import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function PortalHomePage() {
  const session = await getSession();
  if (!session || session.role !== "cliente") {
    redirect("/login");
  }

  return (
    <AppShell
      title="Mis ordenes"
      roleLabel="Portal de cliente"
      userName={session.name}
      navItems={[{ label: "Mis ordenes", href: "/portal" }]}
    >
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Este modulo esta en construccion. Pronto podras ver el estatus de tus
        ordenes y descargar reportes y facturas aqui.
      </div>
    </AppShell>
  );
}
