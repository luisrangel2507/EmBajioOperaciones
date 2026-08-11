import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNav";
import AppShell from "@/components/AppShell";
import RotationGrid from "@/components/RotationGrid";

interface OptionRow {
  id: number;
  name: string;
}

export default async function ProduccionPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const inspectorsRes = await query<OptionRow>(
    `SELECT id, name FROM users WHERE role = 'inspector' AND active ORDER BY name`
  );

  return (
    <AppShell
      title="Produccion"
      roleLabel="Administrador"
      userName={session.name}
      navItems={ADMIN_NAV_ITEMS}
    >
      <div className="space-y-6">
        <div>
          <h2 className="mb-1 text-sm font-bold tracking-wide text-ink-700 uppercase">
            🔄 Rotacion de estaciones
          </h2>
          <p className="text-xs text-ink-500/60">
            Asigna que inspector cubre cada estacion por horario. Los cambios se guardan
            automaticamente.
          </p>
        </div>
        <RotationGrid inspectors={inspectorsRes.rows} />
      </div>
    </AppShell>
  );
}
