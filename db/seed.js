require("dotenv").config({ path: ".env.local" });
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const DEMO_PASSWORD = "demo1234";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `TRUNCATE invoices, shifts, lot_tracking, inspection_results, inspection_orders, users, clients RESTART IDENTITY CASCADE`
    );

    const clientsRes = await client.query(
      `INSERT INTO clients (company_name, contact_name, contact_email, contact_phone, billing_address)
       VALUES
        ('Autopartes del Bajio SA de CV', 'Maria Hernandez', 'maria.hernandez@autopartesbajio.mx', '4771234567', 'Parque Industrial El Bajio, Silao, Gto.'),
        ('Componentes Metalicos Leon', 'Jorge Ramirez', 'jramirez@cmleon.mx', '4779876543', 'Zona Industrial Leon, Leon, Gto.')
       RETURNING id`
    );
    const [clientA, clientB] = clientsRes.rows.map((r) => r.id);

    const usersRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, client_id)
       VALUES
        ('Admin General', 'admin@embajio.com', $1, 'admin', NULL),
        ('Carlos Mendoza', 'carlos.mendoza@embajio.com', $1, 'inspector', NULL),
        ('Lucia Torres', 'lucia.torres@embajio.com', $1, 'inspector', NULL),
        ('Roberto Diaz', 'roberto.diaz@embajio.com', $1, 'inspector', NULL),
        ('Maria Hernandez', 'maria.hernandez@autopartesbajio.mx', $1, 'cliente', $2),
        ('Jorge Ramirez', 'jramirez@cmleon.mx', $1, 'cliente', $3)
       RETURNING id, role, email`,
      [hash, clientA, clientB]
    );
    const insp1 = usersRes.rows.find((r) => r.email.includes("carlos")).id;
    const insp2 = usersRes.rows.find((r) => r.email.includes("lucia")).id;
    const insp3 = usersRes.rows.find((r) => r.email.includes("roberto")).id;
    const admin = usersRes.rows.find((r) => r.role === "admin").id;

    const ordersRes = await client.query(
      `INSERT INTO inspection_orders
        (order_number, client_id, part_name, part_number, lot_number, total_pieces, defect_criteria, status, due_date, assigned_inspector_id, created_by, completed_at)
       VALUES
        ('OI-2026-0001', $1,  'Brazo de suspension', 'BS-4021', 'LOT-A100', 500,  'Rebabas, porosidad, fisuras superficiales', 'pendiente',   '2026-08-15', $3, $5, NULL),
        ('OI-2026-0002', $1,  'Buje de aluminio',    'BJ-1187', 'LOT-A101', 1200, 'Diametro fuera de tolerancia, rayaduras',   'en_proceso',  '2026-08-12', $4, $5, NULL),
        ('OI-2026-0003', $2,  'Soporte de motor',    'SM-3390', 'LOT-B220', 800,  'Soldadura incompleta, deformacion',         'en_proceso',  '2026-08-13', $6, $5, NULL),
        ('OI-2026-0004', $2,  'Bracket metalico',    'BK-2255', 'LOT-B221', 300,  'Golpes, oxidacion, roscas danadas',         'completada',  '2026-08-05', $3, $5, now() - interval '2 days'),
        ('OI-2026-0005', $1,  'Flecha cardan',       'FC-5510', 'LOT-A102', 150,  'Balanceo fuera de rango, grietas',          'cancelada',   '2026-08-01', $4, $5, NULL)
       RETURNING id, client_id, status, total_pieces, assigned_inspector_id`,
      [clientA, clientB, insp1, insp2, admin, insp3]
    );
    const orders = ordersRes.rows;
    const completedOrder = orders.find((o) => o.status === "completada");
    const enProcesoOrders = orders.filter((o) => o.status === "en_proceso");

    // Resultados de inspeccion: cuadran completamente en la orden completada
    await client.query(
      `INSERT INTO inspection_results (order_id, inspector_id, pieces_ok, pieces_ng, defect_type, notes)
       VALUES ($1, $2, 280, 20, 'Oxidacion', 'Lote revisado al 100%, piezas NG separadas y etiquetadas')`,
      [completedOrder.id, completedOrder.assigned_inspector_id]
    );

    // Resultados parciales en las ordenes en_proceso
    for (const order of enProcesoOrders) {
      const okQty = Math.floor(order.total_pieces * 0.4);
      const ngQty = Math.floor(order.total_pieces * 0.05);
      await client.query(
        `INSERT INTO inspection_results (order_id, inspector_id, pieces_ok, pieces_ng, defect_type, notes)
         VALUES ($1, $2, $3, $4, 'Rayaduras', 'Avance parcial de inspeccion')`,
        [order.id, order.assigned_inspector_id, okQty, ngQty]
      );
    }

    // Trazabilidad de lotes
    for (const order of orders) {
      await client.query(
        `INSERT INTO lot_tracking (order_id, location, status, moved_by)
         VALUES ($1, 'Recepcion - Anden 2', 'recibido', $2)`,
        [order.id, admin]
      );
      if (order.status !== "pendiente") {
        await client.query(
          `INSERT INTO lot_tracking (order_id, location, status, moved_by)
           VALUES ($1, 'Area de inspeccion - Linea 1', 'en_inspeccion', $2)`,
          [order.id, order.assigned_inspector_id]
        );
      }
      if (order.status === "completada") {
        await client.query(
          `INSERT INTO lot_tracking (order_id, location, status, moved_by)
           VALUES ($1, 'Almacen de salida', 'liberado', $2)`,
          [order.id, order.assigned_inspector_id]
        );
      }
    }

    // Turnos de inspectores
    await client.query(
      `INSERT INTO shifts (inspector_id, shift_date, start_time, end_time, pieces_inspected)
       VALUES
        ($1, CURRENT_DATE - interval '1 day', '07:00', '15:00', 320),
        ($2, CURRENT_DATE - interval '1 day', '07:00', '15:00', 280),
        ($3, CURRENT_DATE - interval '1 day', '15:00', '23:00', 190),
        ($1, CURRENT_DATE, '07:00', '15:00', 150)`,
      [insp1, insp2, insp3]
    );

    // Factura de la orden completada
    await client.query(
      `INSERT INTO invoices (invoice_number, client_id, order_id, amount, status, due_date)
       VALUES ('FAC-2026-0001', $1, $2, 4500.00, 'pendiente', '2026-08-20')`,
      [completedOrder.client_id, completedOrder.id]
    );

    await client.query("COMMIT");
    console.log("Seed completado.");
    console.log(`Password demo para todos los usuarios: ${DEMO_PASSWORD}`);
    console.log("Usuarios: admin@embajio.com, carlos.mendoza@embajio.com, lucia.torres@embajio.com, roberto.diaz@embajio.com, maria.hernandez@autopartesbajio.mx, jramirez@cmleon.mx");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
