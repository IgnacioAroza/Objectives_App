# Objetivos 2026 — ClickStore

App web personal para el tracking de objetivos anuales. Privada, un solo usuario.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** con paleta ClickStore
- **Supabase** (PostgreSQL + Auth)
- **Vercel** (deploy)

---

## Funcionalidades

### Dashboard
Vista principal con el estado global del año:
- Progreso por categoría (Negocio, Salud, Estilo de vida)
- Métricas rápidas: peso actual, días sin fumar, facturación acumulada
- Días restantes en 2026
- Foco del día (top 3 prioridades, se guardan automáticamente)
- Tareas con vencimiento en los próximos 7 días
- Últimas 3 reflexiones

### Objetivos
Cada objetivo tiene su tipo de progreso:
- **Cuantitativo** (peso, facturación, USD): se carga el valor actual manualmente, la app calcula el % automáticamente y guarda un historial de valores
- **Cualitativo** (marca, importar, etc.): slider manual del 0 al 100%
- **Streak** (dejar de fumar): calcula días automáticamente desde la fecha de inicio, con botón "Tuve una recaída" que reinicia la racha

### Tareas
- Cada objetivo tiene su lista de tareas con título, fecha límite, prioridad (Alta / Media / Baja)
- Al completar una tarea se puede agregar una nota sobre cómo resultó
- Vista global `/tasks` con todas las tareas de todos los objetivos, filtrable por categoría y prioridad
- Indicadores visuales para tareas vencidas y próximas a vencer

### Diario de reflexiones
Registro diario con cuatro campos:
1. ¿Qué hice hoy?
2. ¿Cómo me sentí?
3. ¿Qué aprendí?
4. Espacio libre

Cada reflexión se puede etiquetar con los objetivos trabajados ese día. El historial es filtrable por objetivo.

### Gestión de objetivos
CRUD completo desde la propia app:
- **Crear** nuevos objetivos con botón "+ Nuevo objetivo" en `/objectives`, eligiendo categoría, tipo y meta
- **Editar** cualquier objetivo (título, categoría, tipo, meta, valor inicial, unidad) desde su página de detalle
- **Eliminar** un objetivo con confirmación — borra también todas sus tareas en cascada

### Coach IA
Asistente personal basado en Claude (Anthropic) que lee tu contexto real de Supabase antes de responder:
- Lee objetivos con su progreso actual, tareas pendientes, reflexiones recientes y registros de valores
- Chat con streaming en tiempo real
- Historial de conversaciones persistido en Supabase (`coach_messages`)
- 5 prompts rápidos predefinidos + input libre
- Sugiere tareas concretas en cards con botón "Agregar" para confirmarlas directamente en Supabase

---

## Setup

### 1. Clonar el repo

```bash
git clone https://github.com/IgnacioAroza/Objectives_App.git
cd Objectives_App
npm install
```

### 2. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un nuevo proyecto
2. En el **SQL Editor**, ejecutá el contenido de `supabase/migrations/001_initial.sql`
   Esto crea todas las tablas, activa RLS y carga los objetivos iniciales

### 3. Configurar variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
ANTHROPIC_API_KEY=sk-ant-...
```

`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` las encontrás en **Supabase → Settings → API**.
`ANTHROPIC_API_KEY` la generás en [console.anthropic.com](https://console.anthropic.com). Es necesaria para el Coach IA.

### 4. Levantar el servidor

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Te va a redirigir al login. Ingresá tu email y Supabase te manda un magic link para entrar.

---

## Deploy en Vercel

1. Conectá el repo de GitHub en [vercel.com](https://vercel.com)
2. Agregá las tres variables de entorno en la configuración del proyecto:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (sin prefijo `NEXT_PUBLIC_` — solo server-side)
3. Vercel detecta Next.js automáticamente y hace el deploy

---

## Estructura del proyecto

```
app/
  dashboard/        → vista principal
  objectives/       → lista y detalle de objetivos
  tasks/            → vista global de tareas
  reflections/      → diario de reflexiones
  coach/            → chat con Coach IA
  login/            → autenticación con magic link
  auth/callback/    → callback de Supabase Auth
  api/coach/        → API route: contexto Supabase + llamada a Anthropic (streaming)
  api/coach/tasks/  → API route: crear tarea sugerida por el coach

components/
  ui/               → Button, Badge, ProgressBar, Modal
  objectives/       → ObjectiveCard, ObjectiveFormModal, ObjectiveActions, TaskItem, TaskModal, QuantitativeProgress, QualitativeSlider, StreakWidget
  tasks/            → TasksClient (vista global)
  reflections/      → ReflectionCard, ReflectionForm, ObjectiveTagSelector
  dashboard/        → StatsCard, FocusInput, UpcomingTasks
  coach/            → ChatInterface, QuickPrompts, SuggestedTaskCard

lib/
  supabase/         → cliente browser y servidor
  types.ts          → tipos TypeScript de todas las tablas
  utils.ts          → helpers: calcProgress, formatDate, etc.

supabase/
  migrations/       → SQL para crear el schema en Supabase
```
