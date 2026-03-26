# CLAUDE.md — Objetivos 2026 App

## Proyecto

App web personal de tracking de objetivos anuales para Ignacio.
Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.
App privada, un solo usuario. No es multiusuario.
Referencia visual de diseño: `objetivos_2026.html` (no copiar código, solo referencia de UI).
Spec técnico completo: `spec_objetivos2026.md` (fuente de verdad para schema, features y estructura).

---

## Comportamiento general

- Respondé siempre en **español rioplatense** (voseo). El usuario habla así y espera respuestas en ese tono.
- Antes de escribir código, **leé el spec completo** (`spec_objetivos2026.md`). No asumas nada que no esté ahí.
- Si una tarea es ambigua, **preguntá antes de implementar**. Es mejor aclarar que refactorizar.
- Cuando termines una tarea, resumí brevemente **qué hiciste y qué queda pendiente** para la próxima sesión.
- No generes código que no fue pedido. Scope creep confunde al usuario y genera bugs inesperados.

---

## Stack y versiones

| Tecnología | Versión | Notas |
|---|---|---|
| Next.js | 14 | App Router exclusivamente. No usar Pages Router. |
| TypeScript | 5.x | Strict mode activado. Sin `any` salvo justificación explícita. |
| Tailwind CSS | 3.x | Colores ClickStore definidos en `tailwind.config.ts`. |
| Supabase JS | v2 | `createBrowserClient` en client, `createServerClient` en server. |
| Node.js | 18+ | Requerido por Next.js 14. |

---

## Estructura de carpetas

Seguir **exactamente** la estructura definida en `spec_objetivos2026.md`.
No crear carpetas o archivos fuera de esa estructura sin consultarlo antes.

```
app/              → rutas (App Router)
components/       → componentes React reutilizables
lib/              → supabase/, types.ts, utils.ts
middleware.ts     → protección de rutas
tailwind.config.ts
.env.local        → variables de entorno (nunca commitear)
```

---

## Reglas de código

### TypeScript
- **No usar `any`**. Si el tipo no está claro, usar `unknown` y narrowing.
- Todos los tipos de las tablas Supabase van en `lib/types.ts`.
- Preferir `type` sobre `interface` para consistencia, salvo que se necesite extensión.
- Los props de componentes siempre tipados. Nunca dejar props sin tipo.

### React / Next.js
- Componentes **server by default**. Agregar `'use client'` solo cuando sea necesario (eventos, hooks, estado local).
- No usar `useEffect` para fetching de datos — usar server components o Server Actions.
- Los datos se fetchean en el server component más cercano y se pasan por props.
- Usar `loading.tsx` y `error.tsx` en las rutas que lo requieran.
- No instalar librerías de UI externas (Shadcn, MUI, etc.) — el diseño es custom con Tailwind.

### Tailwind CSS
- Usar los tokens de color definidos: `navy`, `brand`, `sky`, `cream`, `beige`.
- No hardcodear colores hex en className. Si el color no está en el config, agregarlo al config.
- Clases ordenadas con el plugin `prettier-plugin-tailwindcss` si está disponible.

### Supabase
- **Nunca exponer la `service_role` key** en el cliente. Solo `anon key` en el browser.
- Siempre manejar el caso `error` en todas las queries:
  ```ts
  const { data, error } = await supabase.from('tasks').select('*')
  if (error) throw new Error(error.message)
  ```
- Las queries al server usan `createServerClient` desde `lib/supabase/server.ts`.
- Las mutations desde el cliente usan `createBrowserClient` desde `lib/supabase/client.ts`.
- RLS está activado en todas las tablas. No bypassear con `service_role` salvo migraciones.

---

## Manejo de errores

### Regla general
**Nunca silencies un error.** Ni `catch (e) {}` vacío, ni `console.log` como único manejo.

### Jerarquía de manejo

1. **Error de Supabase** (query, auth, RLS):
   ```ts
   const { data, error } = await supabase.from('objectives').select('*')
   if (error) {
     console.error('[supabase] objectives fetch:', error.message)
     throw new Error(`No se pudieron cargar los objetivos: ${error.message}`)
   }
   ```

2. **Error en Server Component** → usar `error.tsx` en la ruta correspondiente:
   ```tsx
   // app/objectives/error.tsx
   'use client'
   export default function Error({ error, reset }: { error: Error; reset: () => void }) {
     return (
       <div>
         <p>Error al cargar objetivos: {error.message}</p>
         <button onClick={reset}>Reintentar</button>
       </div>
     )
   }
   ```

3. **Error en Client Component** → estado local con mensaje visible al usuario. Nunca solo en consola.
   ```tsx
   const [error, setError] = useState<string | null>(null)
   // en el catch:
   setError('No se pudo guardar la tarea. Intentá de nuevo.')
   ```

4. **Error de validación de formulario** → mostrar inline, junto al campo que falló. No alertas del browser.

5. **Error de autenticación** → redirect a `/login`. Nunca mostrar datos sin sesión activa.

### Cuándo lanzar vs cuándo mostrar
- **Lanzar (`throw`)**: en server components y funciones de lib. Lo atrapa `error.tsx` o el caller.
- **Mostrar al usuario**: en client components, con un mensaje en español claro y accionable.
- **Loggear siempre**: tanto si se lanza como si se muestra, incluir `console.error` con contexto.

---

## Flujo cuando encontrás un error durante el desarrollo

Cuando algo no funciona, seguí este orden **antes de pedirme que lo revise**:

1. **Leer el error completo**. El stack trace dice exactamente dónde falló. No ignorar la línea del error.
2. **Verificar el tipo**. ¿Es un error de TypeScript, de runtime, de Supabase, o de Next.js?
3. **Buscar en este orden**:
   - ¿El tipo en `lib/types.ts` coincide con lo que devuelve Supabase?
   - ¿El componente que falla es server o client? ¿Está usando el cliente correcto de Supabase?
   - ¿Hay un `'use client'` faltante o sobrante?
   - ¿El middleware está bloqueando la ruta?
   - ¿La query de Supabase tiene RLS configurado correctamente?
4. **Si es un error de tipos TypeScript**: corregirlo siempre. No castear con `as` para eludirlo.
5. **Si es un error de Supabase 401/403**: revisar las políticas RLS en el dashboard de Supabase.
6. **Si es un error de hidratación de React**: buscar diferencias entre el render del server y del client.
7. **Si después de todo eso no se resuelve**: mostrarme el error completo + el archivo donde ocurre + lo que intentaste.

---

## Variables de entorno

Archivo `.env.local` en la raíz. **Nunca commitear este archivo.**
`.gitignore` debe incluir `.env.local` desde el inicio.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Solo estas dos variables son necesarias para el cliente. Si en el futuro se necesita la `service_role`, va en una variable **sin** el prefijo `NEXT_PUBLIC_` y solo se usa en server-side.

---

## Git

- Commits en español, descriptivos, en imperativo: `Agrega modal de completar tarea`, `Corrige cálculo de progreso cuantitativo`.
- Un commit por feature o fix. No mezclar cambios no relacionados.
- Nunca commitear:
  - `.env.local`
  - `node_modules/`
  - `.next/`
  - Archivos con API keys o credenciales

---

## Base de datos — reglas para migraciones

- Todo cambio al schema va en un archivo SQL en `/supabase/migrations/` con nombre `YYYYMMDD_descripcion.sql`.
- Nunca modificar el schema directamente en producción sin un archivo de migración.
- Antes de correr una migración destructiva (DROP, ALTER que elimina columnas), **consultarme**.
- El seed inicial de objetivos está en el spec. No modificarlo sin una razón clara.

---

## Diseño y UI

- Paleta de colores ClickStore:
  - `navy: #141B63` — títulos, headers, elementos de autoridad
  - `brand: #1E4FD8` — CTAs, botones primarios, links de acción
  - `sky: #4DA3FF` — acentos, badges, highlights
  - `cream: #FAF7F2` — fondo principal (cálido, Home & Deco)
  - `beige: #E8E0D5` — bordes suaves, fondos secundarios

- Tipografía:
  - Títulos: `font-display` → Montserrat
  - Cuerpo: `font-body` → Inter

- La app es **mobile-first**. Diseñar para mobile y expandir a desktop.
- No usar librerías de iconos externas. Usar SVG inline o Heroicons si es necesario.
- Los modales no usan `position: fixed` en contextos donde cause problemas de layout — usar dialog nativo de HTML5 cuando sea posible.

---

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Build de producción (verificar antes de deployar)
npm run build

# Type checking sin build
npx tsc --noEmit

# Linting
npm run lint

# Generar tipos de Supabase (correr cuando cambie el schema)
npx supabase gen types typescript --project-id <project-id> > lib/types.ts
```

---

## Checklist antes de dar una tarea por terminada

- [ ] El código compila sin errores TypeScript (`npx tsc --noEmit`)
- [ ] No hay warnings de ESLint sin resolver
- [ ] El manejo de errores está implementado (no hay catches vacíos)
- [ ] Los casos edge están cubiertos (array vacío, null, usuario no autenticado)
- [ ] El componente funciona en mobile (viewport < 400px)
- [ ] No hay datos hardcodeados que deberían venir de Supabase
- [ ] Las variables de entorno están en `.env.local`, no en el código
