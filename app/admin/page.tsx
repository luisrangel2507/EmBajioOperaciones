import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNav";
import AppShell from "@/components/AppShell";
import OrdersDashboard, {
  type OrderRow,
  type OptionRow,
} from "@/components/OrdersDashboard";
import DashboardHero from "@/components/DashboardHero";
import DashboardGadgets, { type GadgetStats } from "@/components/DashboardGadgets";

export default async function AdminOrdersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [ordersRes, clientsRes, inspectorsRes, gadgetsRes] = await Promise.all([
    query<OrderRow>(
      `SELECT
          o.id, o.order_number, o.part_name, o.part_number, o.lot_number,
          o.total_pieces, o.defect_criteria, o.status, o.due_date,
          o.created_at, o.completed_at,
          c.id AS client_id, c.company_name AS client_name,
          u.id AS inspector_id, u.name AS inspector_name,
          COALESCE(r.pieces_ok, 0) AS pieces_ok,
          COALESCE(r.pieces_ng, 0) AS pieces_ng
       FROM inspection_orders o
       LEFT JOIN clients c ON c.id = o.client_id
       LEFT JOIN users u ON u.id = o.assigned_inspector_id
       LEFT JOIN (
          SELECT order_id, SUM(pieces_ok) AS pieces_ok, SUM(pieces_ng) AS pieces_ng
          FROM inspection_results
          GROUP BY order_id
       ) r ON r.order_id = o.id
       ORDER BY o.created_at DESC`,
    ),
    query<OptionRow>(
      `SELECT id, company_name AS name FROM clients ORDER BY company_name`,
    ),
    query<OptionRow>(
      `SELECT id, name FROM users WHERE role = 'inspector' AND active ORDER BY name`,
    ),
    query<{
      cars_abiertos: string;
      control_plans: string;
      quality_records: string;
      turnos_semana: string;
      piezas_semana: string;
      rotaciones_semana: string;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM car_reports WHERE status != 'cerrado') AS cars_abiertos,
        (SELECT COUNT(*) FROM control_plans) AS control_plans,
        (SELECT COUNT(*) FROM quality_records) AS quality_records,
        (SELECT COUNT(*) FROM shifts WHERE shift_date >= date_trunc('week', CURRENT_DATE)::date) AS turnos_semana,
        (SELECT COALESCE(SUM(pieces_inspected), 0) FROM shifts WHERE shift_date >= date_trunc('week', CURRENT_DATE)::date) AS piezas_semana,
        (SELECT COUNT(DISTINCT inspector_id) FROM station_rotations WHERE week_start = date_trunc('week', CURRENT_DATE)::date) AS rotaciones_semana`,
    ),
  ]);

  const gadgetRow = gadgetsRes.rows[0];
  const gadgetStats: GadgetStats = {
    ordenesPendientes: ordersRes.rows.filter((o) => o.status === "pendiente").length,
    ordenesEnProceso: ordersRes.rows.filter((o) => o.status === "en_proceso").length,
    ordenesCompletadas: ordersRes.rows.filter((o) => o.status === "completada").length,
    carsAbiertos: Number(gadgetRow.cars_abiertos),
    controlPlans: Number(gadgetRow.control_plans),
    qualityRecords: Number(gadgetRow.quality_records),
    turnosSemana: Number(gadgetRow.turnos_semana),
    piezasSemana: Number(gadgetRow.piezas_semana),
    rotacionesSemana: Number(gadgetRow.rotaciones_semana),
  };

  return (
    <AppShell
      title="Panel de administracion"
      roleLabel="Administrador"
      role="admin"
      userName={session.name}
      navItems={ADMIN_NAV_ITEMS}
    >
      <div className="space-y-6">
        <DashboardHero orders={ordersRes.rows} />
        <DashboardGadgets stats={gadgetStats} />
        <OrdersDashboard
          initialOrders={ordersRes.rows}
          clients={clientsRes.rows}
          inspectors={inspectorsRes.rows}
        />
      </div>
    </AppShell>
  );
}
