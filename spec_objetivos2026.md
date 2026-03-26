# Spec técnico — App Objetivos 2026 (Ignacio)

## Stack
- Framework: Next.js 14 (App Router)
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth)
- ORM/cliente: `@supabase/supabase-js` v2 con server components
- Hosting: Vercel (free tier, integración nativa con Next.js)
- Auth: Magic link via Supabase Auth — acceso exclusivo para el email del owner

---

## Contexto del usuario
El usuario es dueño de un ecommerce argentino (ClickStore, Home & Deco en Tiendanube).
La app es personal, privada, solo para él. No es multiusuario.
Colores de marca: Navy `#141B63`, Blue `#1E4FD8`, Sky `#4DA3FF`, Cream `#FAF7F2`.
Tipografía: Montserrat (títulos), Inter (cuerpo).

---

## Estructura de objetivos

### Categorías y objetivos precargados

**Negocio**
- Facturación mensual promedio ARS → tipo: cuantitativo, meta: 20 (millones ARS/mes)
- $30.000 USD líquido al cierre → tipo: cuantitativo, meta: 30000 (USD)
- Marca consolidada → tipo: cualitativo
- Importar de China → tipo: cualitativo
- Documentar el negocio → tipo: cualitativo

**Salud**
- Llegar a 90 kg → tipo: cuantitativo, valor inicial: 83.5 kg, meta: 90 kg
- Mejorar el cardio → tipo: cualitativo
- Dejar de fumar marihuana → tipo: especial (streak de días)

**Estilo de vida**
- Vivir solo → tipo: cualitativo
- Viaje a Europa o EEUU → tipo: cualitativo
- Conseguir novia → tipo: cualitativo

---

## Features

### 1. Objetivos + progreso mixto

**Cuantitativos** (peso, facturación, USD):
- El progreso se calcula automáticamente: `(valor_actual / meta) * 100`
- El usuario carga el valor actual manualmente (ej: su peso esta semana, facturación del mes)
- Se muestra barra de progreso + historial de valores cargados

**Cualitativos** (marca, importar, vivir solo, etc.):
- El progreso es un slider manual del 0 al 100%
- El usuario lo mueve cuando siente que avanzó

**Especial - streak** (dejar de fumar):
- El usuario ingresa la fecha de inicio
- La app calcula automáticamente los días transcurridos
- Botón "tuve una recaída" que reinicia y guarda el intento anterior en historial

---

### 2. Tasks por objetivo

Cada objetivo tiene su lista de tareas. Las tareas tienen:
- `title` — descripción de la tarea
- `due_date` — fecha límite (opcional)
- `priority` — 1 (alta), 2 (media), 3 (baja)
- `done` — boolean
- `done_at` — timestamp de cuando se completó
- `note` — nota al completar (opcional, se pide al marcar como hecha)

**Comportamiento al completar una tarea:**
1. El usuario marca la tarea como hecha
2. Aparece un modal/input: "¿Querés agregar una nota sobre cómo resultó?" (opcional)
3. Se guarda `done_at` + `note` + se mueve al historial

**Ordenamiento por defecto:** prioridad ascendente → due_date ascendente → created_at

**Vista historial por objetivo:**
- Sección colapsable dentro de cada objetivo: "Tareas completadas (N)"
- Muestra: título, fecha de completado, nota (si tiene)
- Ordenadas por `done_at` DESC

---

### 3. Reflexiones diarias

**Estructura de cada reflexión:**
- `date` — único por día
- `what_i_did` — "¿Qué hice hoy?" (textarea)
- `how_i_felt` — "¿Cómo me sentí?" (textarea)
- `what_i_learned` — "¿Qué aprendí o me llevé de hoy?" (textarea)
- `free_notes` — "Espacio libre" (textarea, opcional)
- `objective_ids` — array de UUIDs de objetivos trabajados ese día (multi-select)

**UI de carga:**
- Botón en el dashboard: "Escribir reflexión de hoy"
- Si ya existe una para hoy, mostrar "Editar reflexión de hoy"
- Las 3 preguntas guiadas primero, luego el espacio libre
- Al final: "¿Sobre qué objetivos trabajaste hoy?" → checkboxes con todos los objetivos

**Historial de reflexiones:**
- Vista separada "Diario"
- Lista por fecha DESC
- Card expandible: muestra preview de `what_i_did`, al expandir muestra todo
- Filtro por objetivo: "Ver reflexiones donde trabajé [objetivo X]"

---

### 4. Dashboard

Muestra:
- Días restantes en 2026
- % de progreso por categoría (promedio de sus objetivos)
- Top 3 focos del día (inputs que persisten por fecha)
- Últimas 3 reflexiones (preview)
- Tareas con vencimiento próximo (próximos 7 días, todas las categorías)
- Widget de peso actual vs meta
- Racha actual sin fumar
- Facturación acumulada del año

---

## Schema Supabase

```sql
-- Habilitar UUID
create extension if not exists "pgcrypto";

-- Objetivos
create table objectives (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'negocio' | 'salud' | 'lifestyle'
  title text not null,
  type text not null, -- 'quantitative' | 'qualitative' | 'streak'
  target_value numeric,         -- para cuantitativos
  current_value numeric,        -- para cuantitativos
  initial_value numeric,        -- valor de arranque (ej: 83.5 kg)
  unit text,                    -- 'kg' | 'M ARS' | 'USD' | null
  progress_manual integer default 0, -- 0-100, para cualitativos
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

-- RLS: solo el owner accede (reemplazar con el UUID del user tras hacer auth)
alter table objectives enable row level security;
alter table tasks enable row level security;
alter table value_logs enable row level security;
alter table config enable row level security;
alter table reflections enable row level security;
alter table reflection_objectives enable row level security;
alter table daily_focus enable row level security;

-- Política: solo el usuario autenticado (hay un solo user)
create policy "owner only" on objectives for all using (auth.role() = 'authenticated');
create policy "owner only" on tasks for all using (auth.role() = 'authenticated');
create policy "owner only" on value_logs for all using (auth.role() = 'authenticated');
create policy "owner only" on config for all using (auth.role() = 'authenticated');
create policy "owner only" on reflections for all using (auth.role() = 'authenticated');
create policy "owner only" on reflection_objectives for all using (auth.role() = 'authenticated');
create policy "owner only" on daily_focus for all using (auth.role() = 'authenticated');

-- Datos iniciales de objetivos
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
```

---

## Estructura de archivos sugerida (Next.js App Router)

```
/
├── app/
│   ├── layout.tsx              — layout raíz, fuentes, providers
│   ├── page.tsx                — redirect a /dashboard o /login
│   ├── login/
│   │   └── page.tsx            — pantalla de magic link
│   ├── dashboard/
│   │   └── page.tsx            — dashboard principal (server component)
│   ├── objectives/
│   │   ├── page.tsx            — lista de objetivos por categoría
│   │   └── [id]/
│   │       └── page.tsx        — detalle: tasks + historial + progreso
│   ├── reflections/
│   │   ├── page.tsx            — historial tipo diario
│   │   └── new/
│   │       └── page.tsx        — nueva reflexión / editar hoy
│   └── auth/
│       └── callback/
│           └── route.ts        — callback de magic link (Supabase)
├── components/
│   ├── ui/                     — botones, inputs, modales, badges
│   ├── objectives/             — ProgressBar, TaskItem, TaskModal, etc.
│   ├── reflections/            — ReflectionCard, ObjectiveTagSelector
│   └── dashboard/              — StatsCard, FocusInput, UpcomingTasks
├── lib/
│   ├── supabase/
│   │   ├── client.ts           — createBrowserClient (uso en client components)
│   │   ├── server.ts           — createServerClient (uso en server components)
│   │   └── middleware.ts       — refresh de sesión
│   ├── types.ts                — tipos TypeScript de todas las tablas
│   └── utils.ts                — helpers: calcProgress, formatDate, etc.
├── middleware.ts               — protección de rutas (redirect si no autenticado)
├── tailwind.config.ts          — colores ClickStore como tokens
└── .env.local                  — NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
```

---

## Notas de implementación importantes

1. **Auth flow (Next.js + Supabase):**
   - `middleware.ts` en la raíz intercepta todas las rutas y verifica la sesión con `createServerClient`
   - Si no hay sesión activa → redirect a `/login`
   - `/app/auth/callback/route.ts` maneja el redirect de magic link y llama a `supabase.auth.exchangeCodeForSession(code)`
   - Usar `createBrowserClient` en client components (`'use client'`) y `createServerClient` en server components y route handlers

2. **Tailwind config con colores ClickStore:**
```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      navy:  '#141B63',
      brand: '#1E4FD8',
      sky:   '#4DA3FF',
      cream: '#FAF7F2',
      beige: '#E8E0D5',
    },
    fontFamily: {
      display: ['Montserrat', 'sans-serif'],
      body:    ['Inter', 'sans-serif'],
    }
  }
}
```

3. **Tipos TypeScript para las tablas:**
```ts
// lib/types.ts — generar con: npx supabase gen types typescript
export type Objective = {
  id: string
  category: 'negocio' | 'salud' | 'lifestyle'
  title: string
  type: 'quantitative' | 'qualitative' | 'streak'
  target_value: number | null
  current_value: number | null
  initial_value: number | null
  unit: string | null
  progress_manual: number
  sort_order: number
  created_at: string
}
export type Task = { ... }
export type Reflection = { ... }
// etc.
```

4. **Modal al completar tarea:** Implementar como client component con `useState`. Antes de marcar `done=true`, mostrar el modal con un textarea. Al confirmar: `supabase.from('tasks').update({ done: true, done_at: new Date().toISOString(), note })`.

5. **Progreso mixto:**
   - Cuantitativo: `Math.min(100, Math.round((current - initial) / (target - initial) * 100))`
   - Cualitativo: slider 0-100 con `onChange` debounced que hace `update` a `progress_manual`
   - Streak: `Math.floor((Date.now() - new Date(quitDate).getTime()) / 86400000)` días

6. **Filtro de reflexiones por objetivo:** Query con `.contains('objective_ids')` o join a `reflection_objectives` filtrando por `objective_id`.

7. **Tareas próximas en dashboard:** Server component que hace:
```ts
const in7days = new Date()
in7days.setDate(in7days.getDate() + 7)
const { data } = await supabase
  .from('tasks')
  .select('*, objectives(title, category)')
  .eq('done', false)
  .lte('due_date', in7days.toISOString().split('T')[0])
  .order('due_date', { ascending: true })
```

8. **Objetivo financiero real:** La meta de facturación mensual es **$20M ARS/mes**. El progreso se calcula sobre ese número, no sobre $1M USD. El `target_value` en la tabla es `20` con `unit = 'M ARS/mes'`.
