import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNav";
import AppShell from "@/components/AppShell";
import UsersManager, { type UserRow } from "@/components/UsersManager";

interface ClientOption {
  id: number;
  name: string;
}

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [usersRes, clientsRes] = await Promise.all([
    query<UserRow>(
      `SELECT u.id, u.name, u.email, u.role, u.active, u.created_at,
              u.client_id, c.company_name AS client_name
       FROM users u
       LEFT JOIN clients c ON c.id = u.client_id
       ORDER BY u.role, u.name`
    ),
    query<ClientOption>(`SELECT id, company_name AS name FROM clients ORDER BY company_name`),
  ]);

  return (
    <AppShell
      title="Usuarios y roles"
      roleLabel="Administrador"
      role="admin"
      userName={session.name}
      navItems={ADMIN_NAV_ITEMS}
    >
      <UsersManager
        initialUsers={usersRes.rows}
        clients={clientsRes.rows}
        currentUserId={session.userId}
      />
    </AppShell>
  );
}
