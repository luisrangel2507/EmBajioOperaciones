import { query } from "@/lib/db";
import OrdersDashboard, { type OrderRow, type OptionRow } from "@/components/OrdersDashboard";
import DashboardHero from "@/components/DashboardHero";

export default async function AdminOrdersPage() {
  const [ordersRes, clientsRes, inspectorsRes] = await Promise.all([
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
       ORDER BY o.created_at DESC`
    ),
    query<OptionRow>(`SELECT id, company_name AS name FROM clients ORDER BY company_name`),
    query<OptionRow>(
      `SELECT id, name FROM users WHERE role = 'inspector' AND active ORDER BY name`
    ),
  ]);

  return (
    <div className="space-y-6">
      <DashboardHero />
      <OrdersDashboard
        initialOrders={ordersRes.rows}
        clients={clientsRes.rows}
        inspectors={inspectorsRes.rows}
      />
    </div>
  );
}
