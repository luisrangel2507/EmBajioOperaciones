import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNav";
import AppShell from "@/components/AppShell";
import QualityHub from "@/components/QualityHub";
import type { ControlPlanRow } from "@/components/ControlPlansPanel";
import type { CarRow } from "@/components/CarsPanel";

interface ClientOption {
  id: number;
  name: string;
}

export default async function CalidadPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [plansRes, carsRes, clientsRes] = await Promise.all([
    query<ControlPlanRow>(
      `SELECT p.id, p.plan_number, p.part_name, p.part_number, p.revision, p.created_at,
              c.id AS client_id, c.company_name AS client_name,
              COALESCE(i.item_count, 0) AS item_count
       FROM control_plans p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN (
          SELECT control_plan_id, COUNT(*) AS item_count
          FROM control_plan_items
          GROUP BY control_plan_id
       ) i ON i.control_plan_id = p.id
       ORDER BY p.created_at DESC`
    ),
    query<CarRow>(
      `SELECT r.id, r.car_number, r.part_name, r.part_number, r.problem_summary,
              r.status, r.opened_at, r.closed_at,
              c.id AS client_id, c.company_name AS client_name
       FROM car_reports r
       LEFT JOIN clients c ON c.id = r.client_id
       ORDER BY r.opened_at DESC`
    ),
    query<ClientOption>(`SELECT id, company_name AS name FROM clients ORDER BY company_name`),
  ]);

  return (
    <AppShell
      title="Calidad"
      roleLabel="Administrador"
      role="admin"
      userName={session.name}
      navItems={ADMIN_NAV_ITEMS}
    >
      <QualityHub
        controlPlans={plansRes.rows}
        cars={carsRes.rows}
        clients={clientsRes.rows}
      />
    </AppShell>
  );
}
