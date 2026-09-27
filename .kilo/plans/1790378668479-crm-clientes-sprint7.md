# Spec: Sprint 7 — CRM Base de Clientes

**Feature:** 7.4 CRM Base de Clientes
**Sprint:** 7
**Tier:** `basico` y `premium` (ambos tiers acceden)
**SSOT de tipos:** `src/types/supabase.ts`
**Verificado vía:** Supabase MCP (query a `information_schema.columns`, `pg_policy`, `pg_indexes`, `plan_features`)

> **Nota de ubicación:** Este spec se escribe en `.kilo/plans/` porque el modo `architect` del planificador tiene permisos restringidos de escritura. El agente ejecutor debe tr trasladarlo a `docs/specs/sprint7-crm-clientes.md` como spec final.

---

## 1. Contexto Técnico y Estructura Actual

### 1.1. Tabla `clientes` — Verificación de Esquema (MCP)

Query ejecutado vía Supabase MCP (`supabase_execute_sql`):

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clientes'
ORDER BY ordinal_position;
```

| Columna            | Tipo                       | Nullable | Default                  | SSOT Match |
|--------------------|----------------------------|----------|--------------------------|------------|
| `id`               | `uuid`                     | NO       | `gen_random_uuid()`      | ✓          |
| `created_at`       | `timestamp with time zone` | YES      | `now()`                  | ✓          |
| `nombre_completo`  | `text`                     | NO       | —                        | ✓          |
| `telefono`         | `text`                     | NO       | —                        | ✓          |
| `email`            | `text`                     | YES      | `null`                   | ✓          |
| `estado`           | `text`                     | YES      | `'verificado'::text`     | ✓          |
| `total_gastado`    | `numeric`                  | YES      | `0.00`                   | ✓          |
| `cantidad_pedidos` | `integer`                  | YES      | `0`                      | ✓          |
| `notas`            | `text`                     | YES      | `null`                   | ✓          |
| `tenant_id`        | `uuid`                     | NO       | —                        | ✓          |

**Hallazgos clave:**
- **RLS está ENABLED** en `clientes` (verificado via `pg_class.relrowsecurity`).
- **Política existente:** `admin_tenant_isolation_clientes` (FOR ALL, authenticated, scoped por `admin_users.tenant_id = clientes.tenant_id`). Ya filtra por tenant — no se requiere cambio.
- **Índices existentes:** `idx_clientes_tenant` sobre `tenant_id`. La query ordenada por `total_gastado DESC` se beneficiaría de un índice compuesto — se propone en la sección 3.3.
- **No existe columna `etiqueta`** en la tabla. Confirmado: la etiqueta se calcula en runtime, no en DB.
- **FK:** `clientes.tenant_id` → `tenants(id)` (ON DELETE NO ACTION). `pedidos.cliente_id` → `clientes(id)` (ON DELETE SET NULL).
- **Unique constraint:** `clientes_tenant_telefono_unique` sobre `(tenant_id, telefono)`.
- **`estado` tiene DEFAULT `'verificado'`** — los clientes creados via `crear_cliente_checkout` empiezan en `verificado`.

### 1.2. Tabla `pedidos` — Relevante para el historial (MCP)

| Columna             | Tipo                       | Descripción                              |
|---------------------|----------------------------|------------------------------------------|
| `id`                | `uuid`                     | Número de orden                            |
| `created_at`        | `timestamp with time zone` | Fecha del pedido                           |
| `cliente_id`        | `uuid` (FK)                | → `clientes(id)` ON DELETE SET NULL        |
| `estado`            | `text`                     | `DEFAULT 'pendiente'`                      |
| `total`             | `numeric`                  | Total del pedido                           |
| `comprobante_numero`| `text`                     | Número de comprobante                      |
| `comprobante_url`   | `text`                     | URL del comprobante                        |
| `tenant_id`         | `uuid`                     | → `tenants(id)`                            |

### 1.3. Tabla `plan_features` — Estado Actual (MCP)

| feature_key              | plan     | enabled |
|--------------------------|----------|---------|
| `carrito_whatsapp`       | basico   | true    |
| `catalogo`               | basico   | true    |
| `checkout_transferencia`   | basico   | true    |
| `cotizador_dinamico`     | basico   | false   |
| `instagram_feed`         | basico   | false   |
| `meta_pixel`             | basico   | false   |
| `carrito_whatsapp`       | premium  | true    |
| `catalogo`               | premium  | true    |
| `checkout_transferencia`   | premium  | true    |
| `cotizador_dinamico`     | premium  | true    |
| `instagram_feed`         | premium  | true    |
| `meta_pixel`             | premium  | true    |

**No existe `crm_clientes`** en `plan_features`. Debe agregarse para ambos tiers con `enabled = true`. La tabla tiene RLS ENABLED.

### 1.4. RPC de Actualización de CRM

- `confirmar_pedido_transaccion(p_pedido_id)`: ya existe y actualiza `total_gastado` y `cantidad_pedidos` del cliente asociado. El `confirmarPedido` Server Action en `pedidosActions.ts:71` ya llama a esta RPC y reválida `/admin/clientes` (línea 88).
- `confirmar_venta_y_actualizar_crm(p_pedido_id)`: existe en los tipos (`supabase.ts:457`) pero su implementación en DB no está verificada. **No se requiere para este sprint** — la actualización de métricas ya ocurre via `confirmar_pedido_transaccion`.

### 1.5. Estado de la Página

- `app/admin/clientes/page.tsx` — existe como un **stub** con contenido placeholder. Debe reemplazarse completamente.
- `app/admin/clientes/[id]/page.tsx` — **no existe**. Debe crearse.
- `AdminNavigation.tsx:40-44` — ya tiene el link de navegación "CRM Clientes" → `/admin/clientes`. ✓

### 1.6. Patrones Existentes de Referencia

| Patrón                        | Archivo de referencia                              |
|-------------------------------|-----------------------------------------------------|
| Server Action (read)          | `src/features/admin/actions/pedidosActions.ts:38` (`listarPedidosPendientes`) |
| Server Action (mutate)        | `src/features/admin/actions/pedidosActions.ts:130` (`guardarComprobante`) |
| Server Action (RPC)           | `src/features/admin/actions/pedidosActions.ts:71` (`confirmarPedido`) |
| Page (Server Component, data) | `app/admin/pedidos/page.tsx`                        |
| Client page (inline edit)     | `app/admin/pedidos/[id]/page.tsx`                   |
| Client component (tabla)      | `src/features/admin/components/TablaPedidos.tsx`    |
| Utility (etiquetas)           | `src/features/catalogo/utils/calcularEtiquetasInventario.ts` |
| Auth admin helper            | `src/lib/auth/admin.ts` (`verificarAdministrador`, `obtenerTenantIdAdmin`) |
| Server client                 | `src/lib/supabase/server.ts` (`createSupabaseServerClient`, `createSupabasePublicClient`) |

---

## 2. Decisiones de Diseño

### 2.1. Etiqueta de Cliente — Cálculo en Runtime

| `cantidad_pedidos` | Etiqueta     | Estilos (Tailwind semántico)                              |
|--------------------|--------------|----------------------------------------------------------|
| `0` / `null`       | (ninguna)    | —                                                        |
| `1`                | Nuevo        | `border-amber-500/40 text-amber-700 dark:text-amber-300`   |
| `2`                | Regular      | `border-slate-400/40 text-slate-700 dark:text-slate-300`   |
| `>=3`              | Frecuente    | `border-emerald-500/40 text-emerald-700 dark:text-emerald-300` |

**Razón:** La etiqueta se deriva de `cantidad_pedidos` (un aggregate actualizado por la RPC transaccional `confirmar_pedido_transaccion`), no de `estado`. No se persiste en DB.

### 2.2. Arquitectura Frontend

**Lista (`/admin/clientes`):**
- **Server Component** (como `app/admin/pedidos/page.tsx`):
  - Resuelve datos vía `listarClientes()` (Server Action).
  - Maneja errores con try/catch y Suspense.
  - Pasa `clientes` a un **Client Component** que implementa el buscador y la tabla.
- **Client Component** (`TablaClientes`):
  - Recibe `clientes` como prop (`ReadonlyArray<ClienteConEtiqueta>`).
  - Estado local de búsqueda (`searchTerm`).
  - Filtra client-side por `nombre_completo` o `telefono` (case-insensitive, sin query adicional).
  - Click en fila → navega a `/admin/clientes/[id]` via `<Link>`.

**Ficha (`/admin/clientes/[id]`):**
- **Client Component** (como `app/admin/pedidos/[id]/page.tsx`):
  - `use(params)` para resolver `id` (Next.js 15 — `params` es una Promise).
  - `useEffect` → `obtenerClientePorId(id)`.
  - Inline editing de `notas` con optimistic update.
  - Server Action `actualizarNotasCliente(id, notas)` con `revalidatePath`.

### 2.3. Feature Gating

**Tier: basico y premium.** Ambas tienen acceso. Aunque ambos tenants tengan acceso, el AGENTS.md exige que todo check de plan pase por `plan_features`.

**Decisiones:**
1. **Migration:** INSERT de `crm_clientes` con `enabled=true` para ambos planes.
2. **Helper:** Crear `src/lib/auth/entitlements.ts` con `tieneFeature(featureKey: string): Promise<boolean>`.
3. **Gate en la página lista:** El Server Component verifica `tieneFeature('crm_clientes')` antes de renderizar. Si `false` → muestra mensaje de "feature no disponible".

**GAP:** No existe helper de entitlements en el codebase. Es un bloqueo para el gating correcto. Ver sección 2.3 / Archivos a crear.

---

## 3. Migraciones

### 3.1. Verificación de Schema — Resultado (MCP)

**No se requiere `ALTER TABLE` sobre `clientes`.** Todas las columnas necesarias (`nombre_completo`, `telefono`, `email`, `total_gastado`, `cantidad_pedidos`, `notas`, `tenant_id`, `created_at`, `estado`) ya existen y están correctamente tipadas.

| Claim del usuario                         | Verificado vía MCP | Estado     |
|-------------------------------------------|--------------------|------------|
| Tabla `clientes` existe                   | ✓                  | Confirmado  |
| Columna `cantidad_pedidos` (integer)      | ✓                  | Confirmado  |
| Columna `total_gastado` (numeric)         | ✓                  | Confirmado  |
| Columna `notas` (text, nullable)          | ✓                  | Confirmado  |
| Columna `tenant_id` (uuid, FK)            | ✓                  | Confirmado  |
| `etiqueta` NO va en DB                    | ✓ (no existe)      | Confirmado  |
| RLS en `clientes`                         | ✓ (ENABLED)        | Confirmado  |
| Política `admin_tenant_isolation_clientes`| ✓ (existe)         | Confirmado  |
| Índice `idx_clientes_tenant`              | ✓ (existe)         | Confirmado  |
| Unique `(tenant_id, telefono)`            | ✓ (existe)         | Confirmado  |

### 3.2. Feature Flag: INSERT en `plan_features`

```sql
INSERT INTO public.plan_features (feature_key, plan, enabled)
VALUES
    ('crm_clientes', 'basico', TRUE),
    ('crm_clientes', 'premium', TRUE)
ON CONFLICT DO NOTHING;
```

**Rationale:** La tabla `plan_features` ya tiene RLS ENABLED. El INSERT se ejecuta como service_role (via Supabase MCP), por lo que no necesita política de inserción.

### 3.3. Índice para Ordenamiento por `total_gastado`

```sql
CREATE INDEX IF NOT EXISTS idx_clientes_total_gastado_tenant
    ON public.clientes (tenant_id, total_gastado DESC);
```

**Rationale:** La vista de lista ordena por `total_gastado DESC` por defecto. Sin este índice, en tenants con miles de clientes, la query hará un sort completo en memoria. El índice compuesto `(tenant_id, total_gastado DESC)` acelera tanto el filtrado por tenant como el ordenamiento.

### 3.4. Regenerar Tipos Supabase

**No es necesario** — no se agregan columnas a tablas existentes. El SSOT (`src/types/supabase.ts`) ya refleja todas las columnas de `clientes` y `pedidos`.

### 3.5. Archivo de Migración Propuesto

`supabase/migrations/20260925_add_crm_clientes_feature_flag.sql`

---

## 4. Server Actions

### 4.1. Tipos Compartidos

Definidos en `src/features/admin/types/clientesTypes.ts`:

```typescript
// Derivado del SSOT supabase.ts
export type ClienteRow = Database['public']['Tables']['clientes']['Row'];

export type PedidoResumen = Pick<
    Database['public']['Tables']['pedidos']['Row'],
    'id' | 'created_at' | 'total' | 'estado' | 'comprobante_numero'
>;

export type ClienteConPedidos = ClienteRow & {
    pedidos: ReadonlyArray<PedidoResumen>;
};

export type EtiquetaCliente = {
    readonly texto: string;
    readonly estilos: string;
};

export type ClienteConEtiqueta = ClienteRow & {
    readonly etiqueta: EtiquetaCliente | null;
};
```

### 4.2. `listarClientes()`

**Archivo:** `src/features/admin/actions/clientesActions.ts`

```typescript
export async function listarClientes(): Promise<ClienteConEtiqueta[]>
```

- Calls `verificarAdministrador('gestionar clientes')` → supabase client.
- Calls `obtenerTenantIdAdmin()` → tenantId.
- Query: `.from('clientes').select('*').eq('tenant_id', tenantId).order('total_gastado', { ascending: false })`.
- Maneja `{ data, error }` — lanza `Error` si `error` (patrón: `pedidosActions.ts:60`).
- Mapea cada fila con `calcularEtiquetaCliente()` para adjuntar la etiqueta.
- **No usa `as unknown`** — la inferencia de tipos de Supabase es correcta para `clientes` sin joins.

### 4.3. `obtenerClientePorId(id)`

**Archivo:** `src/features/admin/actions/clientesActions.ts`

```typescript
export async function obtenerClientePorId(id: string): Promise<ClienteConPedidos | null>
```

- Validación: `if (!id || typeof id !== 'string') throw new Error(...)`.
- Calls `verificarAdministrador('gestionar clientes')`.
- Calls `obtenerTenantIdAdmin()`.
- Query: `.from('clientes').select('*, pedidos(id, created_at, total, estado, comprobante_numero)').eq('id', id).eq('tenant_id', tenantId).order('created_at', { foreignTable: 'pedidos', ascending: false }).maybeSingle()`.
- Returns `null` si no existe o no pertenece al tenant (usando `maybeSingle()`).
- El join de pedidos se resuelve vía la FK inversa `pedidos.cliente_id → clientes.id`. Supabase/PostgREST detecta automáticamente la relación.

### 4.4. `actualizarNotasCliente(id, notas)`

**Archivo:** `src/features/admin/actions/clientesActions.ts`

```typescript
export async function actualizarNotasCliente(
    id: string,
    notas: string,
): Promise<{ success: boolean; clienteId: string }>
```

- Validación: `id` requerido (string no vacío), `notas.trim().length > 0` requerido (no se permiten notas vacías).
- Calls `verificarAdministrador('gestionar clientes')`.
- Calls `obtenerTenantIdAdmin()`.
- Query: `.from('clientes').update({ notas: notas.trim() }).eq('id', id).eq('tenant_id', tenantId).select('id').single()`.
- Maneja `{ data, error }`.
- `revalidatePath('/admin/clientes')`, `revalidatePath('/admin/clientes/' + id)`.
- Returns `{ success: true, clienteId: data.id }`.

---

## 5. Utility: `calcularEtiquetaCliente`

### 5.1. Archivo

`src/features/admin/utils/calcularEtiquetaCliente.ts`

### 5.2. Función

```typescript
export function calcularEtiquetaCliente(cantidadPedidos: number | null): EtiquetaCliente | null
```

Lógica:
- `cantidadPedidos === null || cantidadPedidos === 0` → retorna `null` (sin etiqueta).
- `cantidadPedidos === 1` → retorna `{ texto: 'Nuevo', estilos: '...' }`.
- `cantidadPedidos === 2` → retorna `{ texto: 'Regular', estilos: '...' }`.
- `cantidadPedidos >= 3` → retorna `{ texto: 'Frecuente', estilos: '...' }`.

**Patrón de tipado (Const Types Pattern):**

```typescript
const ETIQUETAS_CLIENTE = {
    nuevo: { texto: 'Nuevo', estilos: '...' },
    regular: { texto: 'Regular', estilos: '...' },
    frecuente: { texto: 'Frecuente', estilos: '...' },
} as const;
type TipoEtiquetaCliente = keyof typeof ETIQUETAS_CLIENTE;
```

### 5.3. Index

`src/features/admin/utils/index.ts` — re-exporta `calcularEtiquetaCliente`.

### 5.4. Reutilización

La utility se importa tanto desde:
- `src/features/admin/actions/clientesActions.ts` (para `listarClientes` y `obtenerClientePorId`).
- `TablaClientes.tsx` (no necesario — los datos ya vienen con etiqueta adjunta desde el Server Action).
- `app/admin/clientes/[id]/page.tsx` (si necesita recalcular en runtime).

**Nota:** La utility existe en `src/features/admin/utils/` y NO en `src/components/ui/` porque contiene lógica de dominio del cliente.

---

## 6. Vista Lista: `/admin/clientes` (Lista)

### 6.1. Archivos

| Archivo | Tipo | Responsabilidad |
|---------|------|-----------------|
| `app/admin/clientes/page.tsx` | Server Component | Orquesta fetch vía `listarClientes()`, gatea feature, delega render a `TablaClientes` |
| `src/features/admin/components/TablaClientes.tsx` | Client Component | Tabla con buscador client-side, filas clickeables |

### 6.2. Server Component — `app/admin/clientes/page.tsx`

Inspirado en `app/admin/pedidos/page.tsx`:
- `async function cargarClientes()` → llama `listarClientes()`.
- Verifica feature gate: `const featureHabilitada = await tieneFeature('crm_clientes')`.
- Wrapper interno `TablaClientesWrapper` con try/catch para capturar errores del Server Action.
- Si la feature no está habilitada → renderiza mensaje de "feature no disponible".
- `Suspense` con fallback "Cargando clientes...".
- Pasa `clientes` (array) a `<TablaClientes clientesIniciales={clientes} />`.

### 6.3. Client Component — `TablaClientes.tsx`

Inspirado en `TablaPedidos.tsx`:
- Props: `{ clientesIniciales: ReadonlyArray<ClienteConEtiqueta> }`.
- Estado local: `searchTerm: string`.
- Filtrado client-side:
  ```typescript
  const clientesFiltrados = clientesIniciales.filter(
      (c) =>
          c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.telefono.includes(searchTerm)
  );
  ```
- Columnas: **Nombre, Teléfono, Email, Cantidad Pedidos, Total Gastado, Etiqueta**.
- Ordenamiento: ya viene ordenado por `total_gastado DESC` desde el Server Action. El cliente no reordena.
- Click en fila → `<Link href={`/admin/clientes/${c.id}`}>` (toda la fila es clickeable).
- Estado vacío: "No se encontraron clientes" (cuando el search filter no match) o "No hay clientes todavía" (cuando el array está vacío).

---

## 7. Vista Ficha: `/admin/clientes/[id]` (Ficha)

### 7.1. Archivo

`app/admin/clientes/[id]/page.tsx` — Client Component (`'use client'`)

### 7.2. Estructura

Inspirado en `app/admin/pedidos/[id]/page.tsx`:

1. **Resolución de params:** `const { id } = use(params);` (Next.js 15).
2. **Fetch inicial:** `useEffect` → `obtenerClientePorId(id)`.
3. **Estados:** `cliente`, `cargando`, `error`, `guardandoNotas`.
4. **Header:** Botón "← Volver" → `/admin/clientes`. Título con nombre del cliente. Etiqueta calculada al lado.
5. **Métricas destacadas (grid 2 col):**
   - Total Gastado — `$X.XXX.XXX` (formateado con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`).
   - Cantidad de Pedidos — número entero.
6. **Datos del Cliente (card):**
   - Nombre completo (read-only).
   - Teléfono (read-only).
   - Email (read-only, condicional si existe).
   - Notas — **textarea editable inline** con botón "Guardar notas".
     - Optimistic update: actualiza estado local inmediatamente, llama `actualizarNotasCliente(id, nuevoValor)`.
     - Toast de éxito/error via `react-hot-toast`.
     - Botón disabled mientras `guardandoNotas`.
7. **Historial de Pedidos (table):**
   - Columnas: Fecha, Número de Orden, Total, Estado.
   - Filas: `cliente.pedidos` (array ordenado por `created_at DESC`).
   - `formatearFecha(created_at)` → `Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' })`.
   - Estado como badge (reutilizar lógica de `badgeEstadoPedido` de `pedidos/[id]/page.tsx`).
   - Si no hay pedidos: "Este cliente aún no realizó pedidos."

### 7.3. Restricciones

- **NO** editar nombre, teléfono o email en este sprint.
- El campo de notas debe manejar `null` → `""` en el textarea, y `""` → `null` en la DB al guardar (o mantener como string vacío según decisión del team — se propone no permitir notas vacías).
- Si `cantidad_pedidos` es `null`, tratar como `0` para el cálculo de etiqueta.

---

## 8. Integración con `confirmar_pedido_transaccion`

El Server Action `confirmarPedido` en `pedidosActions.ts:71` ya:
1. Llama la RPC `confirmar_pedido_transaccion(p_pedido_id)`.
2. Revalida `/admin/clientes` (línea 88).

**Esto significa:** al confirmar un pedido, `cantidad_pedidos` y `total_gastado` se actualizan automáticamente, y la lista de clientes se reválida. **No se requiere modificación en `pedidosActions.ts`.**

Sin embargo, el `actualizarNotasCliente` action debe reválidar también `/admin/pedidos` si se muestra el nombre del cliente en esa lista (para reflejar cambios en notas). Actualmente `TablaPedidos` solo muestra el nombre, no las notas — no se requiere revalidar `/admin/pedidos`.

---

## 9. Criterios de Aceptación (AC)

### 9.1. Migraciones y Feature Flag

- **AC-1:** La tabla `plan_features` contiene una fila `crm_clientes` con `enabled=true` para los planes `basico` y `premium`.
- **AC-2:** El índice `idx_clientes_total_gastado_tenant` existe sobre `(tenant_id, total_gastado DESC)`.
- **AC-3:** No se agrega ninguna columna `etiqueta` a la tabla `clientes`.
- **AC-4:** El SSOT (`src/types/supabase.ts`) refleja correctamente las columnas verificadas via MCP (sin cambios necesarios).

### 9.2. Server Actions

- **AC-5:** `listarClientes()` retorna todos los clientes del tenant, ordenados por `total_gastado DESC`, con la etiqueta calculada adjunta.
- **AC-6:** `obtenerClientePorId(id)` retorna el cliente + sus pedidos (ordenados por `created_at DESC`). Retorna `null` si el cliente no existe o no pertenece al tenant.
- **AC-7:** `actualizarNotasCliente(id, notas)` actualiza solo el campo `notas`, reválida `/admin/clientes` y `/admin/clientes/[id]`, retorna `{ success: true, clienteId }`.
- **AC-8:** `listarClientes()` y `obtenerClientePorId(id)` incluyen `tenant_id` en el filtro — **nunca** filtran solo por `id` de cliente.
- **AC-9:** `actualizarNotasCliente` rechaza IDs vacíos o no-string, y notas vacías.

### 9.3. Utility: calcularEtiquetaCliente

- **AC-10:** `cantidad_pedidos = 0` o `null` → retorna `null` (sin etiqueta).
- **AC-11:** `cantidad_pedidos = 1` → retorna `{ texto: 'Nuevo', estilos: '...' }`.
- **AC-12:** `cantidad_pedidos = 2` → retorna `{ texto: 'Regular', estilos: '...' }`.
- **AC-13:** `cantidad_pedidos >= 3` → retorna `{ texto: 'Frecuente', estilos: '...' }`.

### 9.4. Vista Lista `/admin/clientes`

- **AC-14:** La tabla muestra columnas: Nombre, Teléfono, Email, Cantidad Pedidos, Total Gastado, Etiqueta.
- **AC-15:** Los clientes están ordenados por `total_gastado DESC` por defecto.
- **AC-16:** El buscador filtra por nombre o teléfono (case-insensitive) sin disparar queries adicionales a Supabase.
- **AC-17:** Click en una fila navega a `/admin/clientes/[id]`.
- **AC-18:** La etiqueta se muestra correctamente según AC-10 a AC-13.
- **AC-19:** Si el tenant no tiene la feature `crm_clientes` habilitada, la página muestra un mensaje de "feature no disponible".
- **AC-20:** Si no hay clientes, muestra estado vacío.

### 9.5. Vista Ficha `/admin/clientes/[id]`

- **AC-21:** Muestra nombre, teléfono, email y notas del cliente.
- **AC-22:** El campo de notas es editable inline (textarea) con botón de guardado.
- **AC-23:** Al guardar notas exitosamente, se muestra toast de éxito y la ficha refleja el cambio inmediatamente (optimistic update).
- **AC-24:** El historial de pedidos muestra: fecha, número de orden (ID corto), total, estado.
- **AC-25:** Las métricas (total gastado, cantidad de pedidos) se muestran destacadas en la parte superior.
- **AC-26:** La etiqueta calculada se muestra tanto en la ficha como en la lista con la misma lógica.
- **AC-27:** Nombre, teléfono y email son **read-only** (no hay inputs editables para estos campos).
- **AC-28:** Si el cliente no existe o no pertenece al tenant, se muestra error y redirección a `/admin/clientes`.

### 9.6. Integración

- **AC-29:** Al confirmar un pedido desde `/admin/pedidos/[id]`, las métricas del cliente asociado se actualizan y la lista/ficha de clientes se revitalizan (ya implementado via `revalidatePath` en `confirmarPedido`).

---

## 10. Archivos a Modificar / Crear

### 10.1. Crear

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `supabase/migrations/20260925_add_crm_clientes_feature_flag.sql` | Migration | INSERT `crm_clientes` en `plan_features` + índice `total_gastado` |
| `src/features/admin/types/clientesTypes.ts` | Types | `ClienteRow`, `ClienteConPedidos`, `ClienteConEtiqueta`, `PedidoResumen`, `EtiquetaCliente` |
| `src/features/admin/utils/calcularEtiquetaCliente.ts` | Utility | `calcularEtiquetaCliente(cantidadPedidos)` |
| `src/features/admin/utils/index.ts` | Index | Re-export utility |
| `src/features/admin/actions/clientesActions.ts` | Server Actions | `listarClientes`, `obtenerClientePorId`, `actualizarNotasCliente` |
| `src/features/admin/components/TablaClientes.tsx` | Client Component | Tabla con buscador client-side |
| `src/features/admin/components/index.ts` | Index | Re-export `TablaClientes` |
| `src/lib/auth/entitlements.ts` | Lib | `tieneFeature(featureKey)` helper **nuevo** |
| `app/admin/clientes/page.tsx` | Page (replace stub) | Server Component — lista de clientes |
| `app/admin/clientes/[id]/page.tsx` | Page | Client Component — ficha de cliente |

### 10.2. Modificar

| Archivo | Cambio |
|---------|--------|
| `app/admin/clientes/page.tsx` | Reemplazar el stub por la implementación real. |

### 10.3. No modificar

| Archivo | Razón |
|---------|-------|
| `src/features/admin/actions/pedidosActions.ts` | Ya reválida `/admin/clientes` en `confirmarPedido`. Sin cambios. |
| `src/components/admin/AdminNavigation.tsx` | Ya tiene el link a `/admin/clientes`. |
| `app/admin/pedidos/[id]/page.tsx` | Su `etiquetaCliente` usa `estado`, no `cantidad_pedidos`. No se modifica — la CRM usa su propia utilidad. |
| `src/types/supabase.ts` | No se agregan columnas. No requiere regeneración. |

---

## 11. Riesgos

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| R1 | **No existe helper de entitlements.** La regla de AGENTS.md exige feature gating centralizado, pero no hay implementación previa (`plan_features` tiene datos pero ningún código las consulta). | Alto — rompe la regla de "Feature Gating Centralizado". | Crear `src/lib/auth/entitlements.ts` como dependency. Si no es prioridad, documentar como GAP y usar `verificarAdministrador` + RLS como mitigación mínima. |
| R2 | **`total_gastado` es `numeric` en DB, `number` en TS.** El casteo a `Number()` puede perder precisión en montos > 2^53. | Bajo — montos de medias no superan esa magnitud. Sigue el patrón existente (`pedidos/[id]/page.tsx:199` ya usa `Number(pedido.total)`). |
| R3 | **`cantidad_pedidos` y `total_gastado` son `null` por default.** Un cliente recién creado (via checkout) podría tener `null` en lugar de `0`. | Medio — el cálculo de etiqueta debe tratar `null` como `0`. | `calcularEtiquetaCliente` acepta `number | null` y normaliza a `0`. |
| R4 | **Order history puede ser vacío.** La query de join retorna `[]` si no hay pedidos, no `null`. | Bajo — manejar con conditional render. | Verificar con mock data y test de cliente sin pedidos. |
| R5 | **Optimistic update de notas.** Si el Server Action falla, el UI mostrará el valor anterior inconsistente. | Medio | Revertir el estado local en el `catch` del handler. |
| R6 | **`estado` del cliente vs etiqueta.** La `etiquetaCliente` existiente en `pedidos/[id]/page.tsx` usa `estado`. La CRM usa `cantidad_pedidos`. Dos lógicas distintas pueden confundir. | Bajo | Documentar que la CRM usa su propia utilidad `calcularEtiquetaCliente`. No refactorizar `pedidos/[id]/page.tsx`. |
| R7 | **Índice `idx_clientes_total_gastado_tenant`.** Si el tenant tiene pocos clientes, el índice añade overhead en writes de `confirmar_pedido_transaccion`. | Muy bajo | El beneficio de ORDER BY supera el costo. Solo se crea `IF NOT EXISTS`. |
| R8 | **Unique constraint `clientes_tenant_telefono_unique`.** Si el checkout crea dos clientes con el mismo teléfono + tenant (race condition), el segundo insert fallará. | Medio | No afecta este sprint (no se inserta clientes). Documentar para futuro. |
| R9 | **`app/admin/clientes/[id]/page.tsx` como Client Component.** El fetch ocurre en `useEffect`, lo que significa un render de loading → data. No hay SSR para la ficha. | Bajo | Sigue el patrón de `pedidos/[id]/page.tsx`. |
| R10 | **`plan_features` tiene RLS ENABLED.** Si el entitlements helper usa el cliente anónimo, no podrá leer `plan_features` (no hay política pública). | Alto | El helper debe usar `verificarAdministrador` (cliente autenticado) para leer `plan_features`. La política `admin_tenant_isolation_*` no aplica a `plan_features` (no tiene `tenant_id`). Se propone una política SELECT para `plan_features` o usar service_role. |

### 10.1. Política RLS para `plan_features` (R10)

La tabla `plan_features` NO tiene columna `tenant_id` — es global (scoped por `plan`). La política existente `admin_tenant_isolation_*` no aplica. Necesita una política de SELECT para `authenticated`:

```sql
-- ALLOW: administradores autenticados pueden leer plan_features
CREATE POLICY "admin_select_plan_features"
    ON public.plan_features
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
    ));
```

---

## 12. Validación

### 12.1. Manual (QA)

- [QA-1] Navegar a `/admin/clientes` → ver lista de clientes ordenada por total gastado DESC.
- [QA-2] Buscar "Ana" → la tabla filtra solo clientes con "Ana" en nombre (case-insensitive).
- [QA-3] Buscar por teléfono "1234" → la tabla filtra solo clientes con "1234" en teléfono.
- [QA-4] Click en una fila → navega a `/admin/clientes/[id]`.
- [QA-5] Verificar etiqueta: cliente con 3+ pedidos → "Frecuente"; 1 pedido → "Nuevo"; 2 pedidos → "Regular"; 0 pedidos → sin etiqueta.
- [QA-6] En la ficha, editar notas → click guardar → toast de éxito → notas persisten tras refresh.
- [QA-7] En la ficha, verificar que historial de pedidos muestra fecha, orden, total, estado.
- [QA-8] En la ficha, verificar que nombre/teléfono/email NO son editables.
- [QA-9] Cliente con 0 pedidos → historial muestra "Este cliente aún no realizó pedidos."
- [QA-10] Acceder a `/admin/clientes/[id]` con ID inválido → error + redirect a lista.
- [QA-11] Feature flag: deshabilitar `crm_clientes` en `plan_features` para `basico` → la página muestra "feature no disponible".
- [QA-12] Al confirmar un pedido desde `/admin/pedidos/[id]`, la ficha del cliente asociado muestra métricas actualizadas tras refresh.

### 12.2. Automático

- `npx tsc --noEmit` — los tipos de `clientesActions.ts` compilan sin errores.
- `npm run lint` — sin errores de lint en archivos nuevos.
- Tests de la función `calcularEtiquetaCliente` con los 4 casos (0, 1, 2, >=3) y `null`.

---

## 13. Diagrama de Flujo

```
Usuario admin → /admin/clientes
   ↓ (Server Component)
   tieneFeature('crm_clientes') → false → [Feature no disponible]
                                    → true → listarClientes() [Server Action]
   ↓
   <TablaClientes clientesIniciales={...} /> [Client Component]
     ├── Buscador (client-side filter)
     ├── Row por cliente  ← click → /admin/clientes/[id]
     └── Columnas: Nombre | Teléfono | Email | Cant.Pedidos | Total Gastado | Etiqueta

/admin/clientes/[id]
   ↓ (Client Component: 'use client')
   use(params) → id
   useEffect → obtenerClientePorId(id) [Server Action]
     ├── Datos del cliente (read-only: nombre, teléfono, email)
     ├── Métricas destacadas (total_gastado, cantidad_pedidos)
     ├── Notas (textarea editable → actualizarNotasCliente)
     └── Historial de pedidos (table: fecha, orden, total, estado)
```

---

## 14. Resumen de Decisiones Clave

| Decisión | Detalle |
|----------|---------|
| **Etiqueta en runtime** | No se persiste en DB. Calculada via `calcularEtiquetaCliente(cantidad_pedidos)`. |
| **No ALTER TABLE clientes** | Verificado vía MCP — todas las columnas existen. |
| **Feature gate** | `crm_clientes` en `plan_features` (both tiers enabled) + helper `tieneFeature()`. |
| **Search client-side** | Filtra sobre datos ya cargados, sin query adicional. |
| **Ficha como Client Component** | Sigue el patrón de `pedidos/[id]/page.tsx` para editable inline. |
| **Solo notas editable** | Nombre, teléfono, email son read-only en este sprint. |
| **Orden por total_gastado DESC** | Server Action ordena; cliente no reordena. |
| **Revalidación** | `listarClientes()` no reválida (read). `actualizarNotasCliente` reválida lista + ficha. `confirmarPedido` (existente) ya reválida lista. |