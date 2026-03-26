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
```

Ambas claves las encontrás en **Supabase → Settings → API**.

### 4. Levantar el servidor

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Te va a redirigir al login. Ingresá tu email y Supabase te manda un magic link para entrar.

---

## Deploy en Vercel

1. Conectá el repo de GitHub en [vercel.com](https://vercel.com)
2. Agregá las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en la configuración del proyecto
3. Vercel detecta Next.js automáticamente y hace el deploy

---

## Estructura del proyecto

```
app/
  dashboard/        → vista principal
  objectives/       → lista y detalle de objetivos
  tasks/            → vista global de tareas
  reflections/      → diario de reflexiones
  login/            → autenticación con magic link
  auth/callback/    → callback de Supabase Auth

components/
  ui/               → Button, Badge, ProgressBar, Modal
  objectives/       → ObjectiveCard, TaskItem, TaskModal, QuantitativeProgress, QualitativeSlider, StreakWidget
  tasks/            → TasksClient (vista global)
  reflections/      → ReflectionCard, ReflectionForm, ObjectiveTagSelector
  dashboard/        → StatsCard, FocusInput, UpcomingTasks

lib/
  supabase/         → cliente browser y servidor
  types.ts          → tipos TypeScript de todas las tablas
  utils.ts          → helpers: calcProgress, formatDate, etc.

supabase/
  migrations/       → SQL para crear el schema en Supabase
```
