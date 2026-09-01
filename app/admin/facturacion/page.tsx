import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNav";
import AppShell from "@/components/AppShell";
import InvoicesPanel, { type InvoiceRow } from "@/components/InvoicesPanel";

interface ClientOption {
  id: number;
  name: string;
}

interface OrderOption {
  id: number;
  order_number: string;
}

export default async function FacturacionPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [invoicesRes, clientsRes, ordersRes] = await Promise.all([
    query<InvoiceRow>(
      `SELECT i.id, i.invoice_number, i.amount, i.status, i.issued_at, i.due_date, i.paid_at,
              c.id AS client_id, c.company_name AS client_name,
              o.id AS order_id, o.order_number
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN inspection_orders o ON o.id = i.order_id
       ORDER BY i.issued_at DESC`
    ),
    query<ClientOption>(`SELECT id, company_name AS name FROM clients ORDER BY company_name`),
    query<OrderOption>(
      `SELECT id, order_number FROM inspection_orders ORDER BY created_at DESC LIMIT 200`
    ),
  ]);

  return (
    <AppShell
      title="Facturacion"
      roleLabel="Administrador"
      role="admin"
      userName={session.name}
      navItems={ADMIN_NAV_ITEMS}
    >
      <InvoicesPanel
        initialInvoices={invoicesRes.rows}
        clients={clientsRes.rows}
        orders={ordersRes.rows}
      />
    </AppShell>
  );
}
