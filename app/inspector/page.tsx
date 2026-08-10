import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function InspectorHomePage() {
  const session = await getSession();
  if (!session || session.role !== "inspector") {
    redirect("/login");
  }

  return (
    <AppShell
      title="Mis ordenes"
      roleLabel="Inspector"
      userName={session.name}
      navItems={[{ label: "Mis ordenes", href: "/inspector" }]}
    >
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Este modulo esta en construccion. Pronto podras ver tus ordenes
        asignadas y capturar resultados OK/NG aqui.
      </div>
    </AppShell>
  );
}
