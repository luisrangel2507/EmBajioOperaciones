# EmBajio Operaciones — ERP de inspeccion de piezas industriales

ERP para una empresa de sorteo/inspeccion de piezas industriales: ordenes de
inspeccion, trazabilidad de lotes, captura de resultados OK/NG, reportes de
calidad, facturacion y turnos de inspectores.

**Stack:** Next.js (App Router) + PostgreSQL + Tailwind CSS, deploy en Railway.

## Roles

- **admin** — control total: crea ordenes, asigna inspectores, ve facturacion y reportes.
- **inspector** — ve solo sus ordenes asignadas, captura resultados OK/NG.
- **cliente** — portal de solo lectura: ve estatus de sus ordenes y descarga reportes/facturas.

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Configuracion local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env.local` en la raiz con:

   ```bash
   DATABASE_URL=postgres://usuario:password@localhost:5432/embajio_ops
   JWT_SECRET=una-cadena-larga-y-aleatoria
   ```

3. Crea la base de datos y aplica el schema:

   ```bash
   createdb embajio_ops
   npm run db:migrate
   ```

4. Carga datos de prueba (2 clientes, 3 inspectores, 1 admin, 5 ordenes en distintos estatus):

   ```bash
   npm run db:seed
   ```

   Todos los usuarios de prueba usan la contrasena `demo1234`:

   - `admin@embajio.com` (admin)
   - `carlos.mendoza@embajio.com`, `lucia.torres@embajio.com`, `roberto.diaz@embajio.com` (inspectores)
   - `maria.hernandez@autopartesbajio.mx`, `jramirez@cmleon.mx` (clientes)

5. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000) — el login redirige automaticamente a `/admin`, `/inspector` o `/portal` segun el rol.

## Estructura

```
/app
  /admin        -> dashboard, ordenes, facturacion, RH (admin)
  /inspector    -> ordenes asignadas, captura OK/NG (inspector)
  /portal       -> vista de solo lectura (cliente)
  /api
    /orders     -> listar/crear ordenes de inspeccion
    /auth       -> login/logout
/lib
  db.ts         -> pool de conexion PostgreSQL
  auth.ts       -> sesiones, hashing de password, guards por rol (Node)
  session.ts    -> JWT edge-safe, usado por proxy.ts (middleware)
/components     -> UI compartida (shell, dashboard de ordenes, etc.)
/db
  schema.sql    -> schema completo de PostgreSQL
  migrate.js    -> aplica schema.sql contra DATABASE_URL
  seed.js       -> datos de prueba
proxy.ts        -> middleware de autenticacion y redireccion por rol
```

## Estado actual

- [x] Schema de base de datos + seed de datos de prueba
- [x] Autenticacion con roles (login + middleware de redireccion)
- [x] Dashboard admin: lista de ordenes con filtros por estatus/cliente y formulario de creacion
- [ ] Panel de inspector (captura de resultados OK/NG)
- [ ] Portal de cliente
- [ ] Trazabilidad de lotes (UI)
- [ ] Reportes de calidad exportables a PDF
- [ ] Facturacion
- [ ] RH / turnos de inspectores

## Deploy en Railway

1. Crea un servicio de PostgreSQL en Railway y copia su `DATABASE_URL`.
2. Crea el servicio de la app apuntando a este repo.
3. Configura las variables de entorno `DATABASE_URL` y `JWT_SECRET` en el servicio.
4. Corre `npm run db:migrate` y `npm run db:seed` (o solo `db:migrate` en produccion) contra la base de Railway.
5. Railway detecta Next.js automaticamente (`npm run build` / `npm run start`).
