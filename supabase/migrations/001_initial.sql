-- Habilitar UUID
create extension if not exists "pgcrypto";

-- Objetivos
create table objectives (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'negocio' | 'salud' | 'lifestyle'
  title text not null,
  type text not null, -- 'quantitative' | 'qualitative' | 'streak'
  target_value numeric,
  current_value numeric,
  initial_value numeric,
  unit text,
  progress_manual integer default 0,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid references objectives(id) on delete cascade,
  title text not null,
  due_date date,
  priority integer default 2, -- 1=alta, 2=media, 3=baja
  done boolean default false,
  done_at timestamptz,
  note text,
  created_at timestamptz default now()
);

-- Historial de valores cuantitativos (peso, facturación, USD)
create table value_logs (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid references objectives(id) on delete cascade,
  value numeric not null,
  logged_at date default current_date,
  note text
);

-- Config general (quit_date para fumar, etc.)
create table config (
  key text primary key,
  value text
);

-- Reflexiones diarias
create table reflections (
  id uuid primary key default gen_random_uuid(),
  date date unique not null default current_date,
  what_i_did text,
  how_i_felt text,
  what_i_learned text,
  free_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Relación reflexiones ↔ objetivos
create table reflection_objectives (
  reflection_id uuid references reflections(id) on delete cascade,
  objective_id uuid references objectives(id) on delete cascade,
  primary key (reflection_id, objective_id)
);

-- Foco diario (top 3)
create table daily_focus (
  date date primary key default current_date,
  f1 text,
  f2 text,
  f3 text
);

-- RLS
alter table objectives enable row level security;
alter table tasks enable row level security;
alter table value_logs enable row level security;
alter table config enable row level security;
alter table reflections enable row level security;
alter table reflection_objectives enable row level security;
alter table daily_focus enable row level security;

-- Política: solo usuario autenticado (single user app)
create policy "owner only" on objectives for all using (auth.role() = 'authenticated');
create policy "owner only" on tasks for all using (auth.role() = 'authenticated');
create policy "owner only" on value_logs for all using (auth.role() = 'authenticated');
create policy "owner only" on config for all using (auth.role() = 'authenticated');
create policy "owner only" on reflections for all using (auth.role() = 'authenticated');
create policy "owner only" on reflection_objectives for all using (auth.role() = 'authenticated');
create policy "owner only" on daily_focus for all using (auth.role() = 'authenticated');

-- Seed inicial de objetivos
insert into objectives (category, title, type, target_value, initial_value, current_value, unit, sort_order) values
('negocio',   'Facturación mensual promedio',   'quantitative', 20,    0,    0,    'M ARS/mes', 1),
('negocio',   '$30.000 USD líquido al cierre',  'quantitative', 30000, 0,    0,    'USD',       2),
('negocio',   'Marca consolidada',              'qualitative',  null,  null, null, null,        3),
('negocio',   'Importar de China',              'qualitative',  null,  null, null, null,        4),
('negocio',   'Documentar el negocio',          'qualitative',  null,  null, null, null,        5),
('salud',     'Llegar a 90 kg',                 'quantitative', 90,    83.5, 83.5, 'kg',        1),
('salud',     'Mejorar el cardio',              'qualitative',  null,  null, null, null,        2),
('salud',     'Dejar de fumar marihuana',       'streak',       null,  null, null, null,        3),
('lifestyle', 'Vivir solo',                     'qualitative',  null,  null, null, null,        1),
('lifestyle', 'Viaje a Europa o EEUU',          'qualitative',  null,  null, null, null,        2),
('lifestyle', 'Conseguir novia',                'qualitative',  null,  null, null, null,        3);
