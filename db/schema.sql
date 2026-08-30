-- EmBajioOperaciones ERP schema
-- PostgreSQL

-- USUARIOS Y ROLES
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(160) NOT NULL,
  contact_name VARCHAR(120),
  contact_email VARCHAR(160),
  contact_phone VARCHAR(30),
  billing_address TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','inspector','cliente')),
  client_id INTEGER REFERENCES clients(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspection_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  part_name VARCHAR(160) NOT NULL,
  part_number VARCHAR(80),
  lot_number VARCHAR(80),
  total_pieces INTEGER NOT NULL,
  defect_criteria TEXT,
  status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_proceso','completada','cancelada')),
  due_date DATE,
  assigned_inspector_id INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_results (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES inspection_orders(id),
  inspector_id INTEGER REFERENCES users(id),
  pieces_ok INTEGER DEFAULT 0,
  pieces_ng INTEGER DEFAULT 0,
  defect_type VARCHAR(120),
  notes TEXT,
  inspected_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lot_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES inspection_orders(id),
  location VARCHAR(120),
  status VARCHAR(30),
  moved_by INTEGER REFERENCES users(id),
  moved_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  inspector_id INTEGER REFERENCES users(id),
  shift_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  pieces_inspected INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS station_rotations (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 5),
  time_slot VARCHAR(5) NOT NULL,
  station_num SMALLINT NOT NULL,
  inspector_id INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (week_start, day_of_week, time_slot, station_num)
);

CREATE TABLE IF NOT EXISTS control_plans (
  id SERIAL PRIMARY KEY,
  plan_number VARCHAR(30) UNIQUE NOT NULL,
  part_name VARCHAR(160) NOT NULL,
  part_number VARCHAR(80),
  client_id INTEGER REFERENCES clients(id),
  revision VARCHAR(20) DEFAULT 'A',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS control_plan_items (
  id SERIAL PRIMARY KEY,
  control_plan_id INTEGER REFERENCES control_plans(id) ON DELETE CASCADE,
  process_step VARCHAR(160),
  characteristic VARCHAR(160) NOT NULL,
  specification VARCHAR(200),
  control_method VARCHAR(160),
  sample_size VARCHAR(60),
  frequency VARCHAR(80),
  reaction_plan TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS car_reports (
  id SERIAL PRIMARY KEY,
  car_number VARCHAR(30) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  part_name VARCHAR(160),
  part_number VARCHAR(80),
  problem_summary TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'abierto' CHECK (status IN ('abierto','en_proceso','cerrado')),
  d1_team TEXT,
  d2_problem_description TEXT,
  d3_containment_actions TEXT,
  d4_root_cause TEXT,
  d5_corrective_actions TEXT,
  d6_implementation TEXT,
  d7_prevention TEXT,
  d8_closure TEXT,
  opened_by INTEGER REFERENCES users(id),
  opened_at TIMESTAMP DEFAULT now(),
  closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quality_records (
  id SERIAL PRIMARY KEY,
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'part_specifications','process_flow_charts','checksheets','sppap',
    'deviations','fmea','ppap','gage_control','supplier_quality','shared_practices'
  )),
  record_number VARCHAR(30) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  part_name VARCHAR(160),
  part_number VARCHAR(80),
  description TEXT,
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo','en_revision','obsoleto')),
  severity SMALLINT,
  occurrence SMALLINT,
  detection SMALLINT,
  due_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scrap_records (
  id SERIAL PRIMARY KEY,
  scrap_date DATE NOT NULL DEFAULT CURRENT_DATE,
  part_name VARCHAR(160) NOT NULL,
  part_number VARCHAR(80),
  station_num SMALLINT,
  operation VARCHAR(120),
  quantity INTEGER NOT NULL,
  reason VARCHAR(60) NOT NULL,
  notes TEXT,
  order_id INTEGER REFERENCES inspection_orders(id),
  client_id INTEGER REFERENCES clients(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_plans (
  id SERIAL PRIMARY KEY,
  plan_date DATE UNIQUE NOT NULL,
  planned_pieces INTEGER NOT NULL DEFAULT 0,
  planned_minutes INTEGER NOT NULL DEFAULT 480,
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  order_id INTEGER REFERENCES inspection_orders(id),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente','pagada','vencida')),
  issued_at TIMESTAMP DEFAULT now(),
  due_date DATE,
  paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_client ON inspection_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON inspection_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_inspector ON inspection_orders(assigned_inspector_id);
CREATE INDEX IF NOT EXISTS idx_results_order ON inspection_results(order_id);
CREATE INDEX IF NOT EXISTS idx_lot_order ON lot_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_control_plans_client ON control_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_control_plan_items_plan ON control_plan_items(control_plan_id);
CREATE INDEX IF NOT EXISTS idx_car_reports_client ON car_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_car_reports_status ON car_reports(status);
CREATE INDEX IF NOT EXISTS idx_quality_records_category ON quality_records(category);
CREATE INDEX IF NOT EXISTS idx_quality_records_client ON quality_records(client_id);
CREATE INDEX IF NOT EXISTS idx_production_plans_date ON production_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_scrap_records_date ON scrap_records(scrap_date);
CREATE INDEX IF NOT EXISTS idx_scrap_records_order ON scrap_records(order_id);
