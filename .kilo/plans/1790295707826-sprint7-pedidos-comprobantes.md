# Spec: Sprint 7 - Vista de Pedidos Pendientes + Confirmar Acreditación

## 1. Objetivo General

Implementar la vista de administración de pedidos con: (a) tabla de pedidos pendientes con filtros por estado y confirmación de acreditación con feedback en tiempo real, y (b) vista de detalle individual de cada pedido con ingreso de número de comprobante.

**Tier:** Básico y Premium (accesible para ambos planes; la lógica de acceso se valida vía `verificarAdministrador` y `tenant_id` en todas las queries).

---

## 2. Diagnóstico del Bug: "Confirmar Acreditación" da 500

### Estado actual
- `app/admin/pedidos/page.tsx` es un **Server Component async** que renderiza cards.
- El formulario usa `action={confirmarVentaYActualizarCrm}` con un `<button type="submit">` nativo (HTML form submission).
- `confirmarVentaYActualizarCrm` (FormData wrapper) → `confirmarPedido(pedidoId)` → RPC `confirmar_pedido_transaccion`.

### Causas raíz probables

| # | Posible causa | Evidencia | Impacto en el spec |
|---|---|---|---|
| 1 | **Server Action lanza excepción no capturada** | `confirmarPedido` envuelve todo en `try/catch` y re-throws — en Next.js 16, Server Actions que lanzan excepciones sin un manejador de errores de formulario producen 500 | La solución requiere mover a client-side con `react-hot-toast` |
| 2 | **RPC `confirmar_pedido_transaccion` falla internamente** | No se puede inspeccionar sin MCP/Supabase — se requiere validación | Se mantiene la RPC como está; el spec documenta fallback de error visible |
| 3 | **`revalidatePath` falla en contexto de Server Action** | Next.js 16 App Router puede lanzar si la ruta no existe o hay error de cache | Se mantiene `revalidatePath`, se agrega error boundary en cliente |

### Solución de diseño
Convertir la página a **Client Component** (`'use client'`) y llamar `confirmarPedido(pedidoId)` directamente desde el handler (no vía FormData nativo). Aplicar `try/catch` + `react-hot-toast` para feedback visible. Esto elimina el ciclo de recarga completa y permite loading states por fila.

---

## 3. Diseño: Vista `/admin/pedidos` (Lista + Filtros)

### 3.1. Arquitectura

```
app/admin/pedidos/page.tsx          ← Server Component (carga datos iniciales)
src/features/admin/components/      ← Client Components (interactividad)
  TablaPedidos.tsx                  ← Tabla con filtros + confirmación inline
  FiltrosPedidos.tsx                ← Tabs de filtro de estado
src/features/admin/actions/
  pedidosActions.ts                 ← listarPedidosPendientes(estado?) modificado
```

### 3.2. Server Component (`page.tsx`)

- Es un **Server Component async** que resuelve los pedidos en el servidor (SSR).
- Lee el filtro de estado desde `searchParams` (promesa en Next.js 15+).
- Pasa los pedidos y el estado activo al Client Component `TablaPedidos`.
- Si ocurre error, muestra mensaje de error (preserva comportamiento actual).

### 3.3. Client Component (`TablaPedidos.tsx`)

- Recibe `pedidosIniciales: PedidoPendiente[]` y `estadoInicial: string` como props.
- Estado local:
  - `pedidos` (array, actualizado optimísticamente tras confirmación).
  - `pedidoConfirmandoId: string | null` — ID del pedido en proceso de confirmación.
- Botón "Confirmar Acreditación" por fila:
  - `disabled` mientras `pedidoConfirmandoId === pedido.id`.
  - Muestra spinner de loading inline.
  - On success: `toast.success(...)`, remove row del estado local.
  - On error: `toast.error(...)`, `pedidoConfirmandoId = null`.
- Cada fila enlaza a `/admin/pedidos/[id]` (detalle).

### 3.4. Filtros (`FiltrosPedidos.tsx`)

- Tabs: **Pendiente** / **Confirmado** / **Todos**.
- Navegación vía `useRouter().push()` con `searchParams` (`?estado=pendiente | confirmado | todos`).
- El estado activo se resalta visualmente.

### 3.5. Tabla de columnas

| Columna | Fuente de datos | Notas |
|---|---|---|
| Fecha | `pedido.created_at` | Formateado con `Intl.DateTimeFormat('es-AR')` |
| Número de orden | `pedido.id.slice(0, 8)` | Primeros 8 chars del UUID |
| Cliente | `pedido.cliente.nombre_completo` | Fallback "Cliente sin nombre" |
| Teléfono | `pedido.cliente.telefono` | Fallback "Sin teléfono" |
| Total | `pedido.total` | `$${Number(total).toLocaleString('es-AR')}` |
| Estado | `pedido.estado` | Badge: `pendiente` / `confirmado` |
| Acciones | Botón "Confirmar Acreditación" | Link al detalle + botón confirmar |

---

## 4. Diseño: Vista `/admin/pedidos/[id]` (Detalle de Pedido)

### 4.1. Archivo

```
app/admin/pedidos/[id]/page.tsx    ← Server Component (SSR para datos, Client wrapper para interacción)
```

### 4.2. Server Component (`page.tsx`)

- Resuelve `params: Promise<{ id: string }>` con `await`.
- Llama `obtenerPedidoPorId(id)` (nueva action, ver §5.2).
- Pasa datos a un Client Component `DetallePedido` o renderiza directamente en server component + un sub-component client para el formulario de comprobante.

### 4.3. Layout de detalle

```
Header: ← Volver  |  Pedido #XXXX |  Badge estado
Datos del cliente: nombre, email, teléfono, estado (VIP/Frecuente/Nuevo)
Items del pedido (tabla):
  ┌────────────────────┬───┬───┬───────┐
  │ Producto           │Talle│Cant│Precio │
  └────────────────────┴───┴───┴───────┘
  Subtotal, Total
Estado actual: [badge]
Campo: Número de comprobante [input] [Guardar]
Botón: Confirmar Acreditación (solo si estado = pendiente)
```

### 4.4. Interacciones

- **Campo número de comprobante:** input de texto libre. On submit llama `guardarComprobante(pedidoId, numero)`.
  - Success: `toast.success`, update estado local del campo.
  - Error: `toast.error`.
- **Botón "Confirmar Acreditación":** visible solo si `estado === 'pendiente'`.
  - Llama `confirmarPedido(pedidoId)` directamente (client-side, no FormData).
  - Loading state + toast feedback.
  - On success: `router.push('/admin/pedidos')` o `revalidatePath` + refresh.

---

## 5. Modificaciones de Server Actions (`pedidosActions.ts`)

### 5.1. `listarPedidosPendientes(estado?: string)`

**Firma actual:** `listarPedidosPendientes()` — hardcodea `.eq('estado', 'pendiente')`.

**Firma nueva:**
```typescript
export async function listarPedidosPendientes(estado?: string): Promise<PedidoPendiente[]>
```

- Si `estado` es `'todos'` o `undefined`: omite el `.eq('estado', ...)`.
- Si `estado` es `'pendiente'` o `'confirmado'`: aplica `.eq('estado', estado)`.
- Valida `estado` contra un whitelist (`['pendiente', 'confirmado', 'todos']` o `undefined`) para prevenir inyección de filtros.
- Actualizar `PedidoPendiente` type: agregar `readonly estado: string | null` y `readonly comprobante_numero: string | null`.

### 5.2. Nueva: `obtenerPedidoPorId(id: string)`

```typescript
export async function obtenerPedidoPorId(id: string): Promise<PedidoDetalle>
```

- Valida `id` es string no vacío.
- `verificarAdministrador('gestionar pedidos')` + `obtenerTenantIdAdmin()`.
- Query: `select('*, cliente:clientes(*), items:pedidos_items(*)').eq('id', id).eq('tenant_id', tenantId)`.
- Retorna el pedido completo con cliente + items.
- Define type `PedidoDetalle` (extiende `PedidoPendiente` + `cliente_id`).

### 5.3. Nueva: `guardarComprobante(pedidoId: string, numero: string)`

```typescript
export async function guardarComprobante(
    pedidoId: string,
    numero: string,
): Promise<{ success: boolean; pedidoId: string }>
```

- Valida `pedidoId` y `numero`.
- `verificarAdministrador` + `obtenerTenantIdAdmin()`.
- Update: `supabase.from('pedidos').update({ comprobante_numero: numero }).eq('id', pedidoId).eq('tenant_id', tenantId)`.
- `.select().single()` para retornar el registro actualizado (patrón del repo).
- `revalidatePath('/admin/pedidos')`, `revalidatePath('/admin/pedidos/[id]')`.
- Retorna `{ success: true, pedidoId }`.

### 5.4. `confirmarPedido(pedidoId: string)` — sin cambios funcionales

- Se mantiene la firma. La corrección del 500 se resuelve en el cliente (manejo de errores visible).
- Se evalúa borrar el wrapper `confirmarVentaYActualizarCrm` si no hay otros consumidores (grep previo).

### 5.5. Type exports

- Exportar `PedidoPendiente` y `PedidoDetalle` desde el actions file.

---

## 6. Migraciones de Base de Datos

### 6.1. Verificación previa (OBLIGATORIO antes de aplicar)

Antes de escribir cualquier ALTER TABLE, consultar el esquema real en Supabase:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;

SELECT conname, contype, consrc
FROM pg_constraint
WHERE conrelid = 'pedidos'::regclass
AND contype = 'c';
```

Confirmar:
- `comprobante_numero` no existe aún → procede con ADD COLUMN.
- `estado` no tiene CHECK constraint → procede con ADD CONSTRAINT.

### 6.2. Migración: `pedidos` — agregar `comprobante_numero`

```sql
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS comprobante_numero text;
```

- Tipo: `text` (texto libre, puede incluir guiones, letras, números).
- Nullable: sí (no todos los pedidos tendrán comprobante).

### 6.3. Migración: `pedidos` — CHECK constraint en `estado`

Verificar si ya existe un CHECK constraint. Si no existe:

```sql
ALTER TABLE pedidos
ADD CONSTRAINT pedidos_estado_check
CHECK (estado IN ('pendiente', 'confirmado'));
```

Si ya existe un constraint con valores diferentes, `DROP CONSTRAINT` + recrear con los valores correctos.

### 6.4. RLS

- La tabla `pedidos` ya tiene RLS habilitado (migración Sprint 5).
- Las nuevas columnas heredan automáticamente las policies existentes.
- No se requieren nuevas policies para esta sprint.

### 6.5. Regenerar tipos Supabase

Después de aplicar las migraciones:

```bash
npx supabase gen types typescript --project-id <ID> --schema public > src/types/supabase.ts
```

---

## 7. Tipos y SSOT (`src/types/supabase.ts`)

### 7.1. Estado actual de `pedidos` (SSOT)

```typescript
// Ya existe en supabase.ts (líneas 141-184)
pedidos: {
    Row: {
        cliente_id: string | null
        comprobante_url: string | null    // ✓ existe
        created_at: string | null
        estado: string | null             // ✓ existe (tipo string|null, sin CHECK en TS)
        id: string
        tenant_id: string
        total: number
    }
}
```

**Hallazgo clave:** `comprobante_numero` **NO** existe en el SSOT. La migración es necesaria.

### 7.2. Estado esperado después de migración + regeneración

```typescript
pedidos: {
    Row: {
        cliente_id: string | null
        comprobante_numero: string | null   // ← NUEVA
        comprobante_url: string | null
        created_at: string | null
        estado: string | null
        id: string
        tenant_id: string
        total: number
    }
}
```

### 7.3. Types locales en `pedidosActions.ts`

`PedidoPendiente` actualizado:

```typescript
export type PedidoPendiente = {
    readonly id: string;
    readonly created_at: string | null;
    readonly total: number;
    readonly estado: string | null;              // AGREGAR
    readonly comprobante_url: string | null;
    readonly comprobante_numero: string | null; // AGREGAR (post-migración)
    readonly cliente: {
        readonly nombre_completo: string;
        readonly telefono: string;
        readonly estado: string | null;
    } | null;
    readonly items: ReadonlyArray<{
        readonly id: string;
        readonly nombre_producto: string;
        readonly talle: string | null;
        readonly cantidad: number;
        readonly precio_unitario: number;
    }>;
};

export type PedidoDetalle = PedidoPendiente & {
    readonly cliente_id: string | null;
};
```

---

## 8. Criterios de Aceptación

### 8.1. Vista `/admin/pedidos` (lista)

- [ ] La tabla muestra columnas: fecha, número de orden (8 chars), cliente, teléfono, total, estado, acciones.
- [ ] Los filtros "Pendiente" / "Confirmado" / "Todos" funcionan sin recargar página (client-side navigation).
- [ ] El botón "Confirmar Acreditación" por fila muestra spinner de loading durante la operación.
- [ ] Al confirmar con éxito: el pedido desaparece de la lista (si filtro = pendiente) y muestra `toast.success`.
- [ ] Si la confirmación falla: muestra `toast.error` con mensaje descriptivo y el botón vuelve a habilitarse.
- [ ] Cada fila es clickeable y navega a `/admin/pedidos/[id]`.
- [ ] La página funciona en mobile (scroll horizontal).

### 8.2. Vista `/admin/pedidos/[id]` (detalle)

- [ ] Muestra datos del cliente: nombre, email, teléfono, estado.
- [ ] Muestra items en tabla: nombre, talle, cantidad, precio unitario.
- [ ] Muestra total del pedido y estado actual (badge).
- [ ] El campo "Número de comprobante" guarda el valor en `comprobante_numero` con feedback toast.
- [ ] El botón "Confirmar Acreditación" es visible solo cuando `estado = 'pendiente'`.
- [ ] Al confirmar: navega de vuelta a `/admin/pedidos` con mensaje de éxito.
- [ ] Si el pedido está `confirmado`, el botón está oculto/disabled y se muestra el número de comprobante guardado.

### 8.3. Migraciones

- [ ] `comprobante_numero` columna agregada a `pedidos`.
- [ ] CHECK constraint en `estado` con valores `('pendiente', 'confirmado')`.
- [ ] RLS sigue habilitado en `pedidos` (verificado).
- [ ] `src/types/supabase.ts` regenerado y refleja `comprobante_numero`.

### 8.4. Bug 500

- [ ] La confirmación de acreditación no produce 500.
- [ ] Los errores se muestran como toasts en lugar de 500 HTTP response.

---

## 9. Archivos a Modificar

| Archivo | Acción | Detalle |
|---|---|---|
| `src/features/admin/actions/pedidosActions.ts` | Modificar | `listarPedidosPendientes(estado?)` |
| `src/features/admin/actions/pedidosActions.ts` | Agregar | `obtenerPedidoPorId(id)` |
| `src/features/admin/actions/pedidosActions.ts` | Agregar | `guardarComprobante(pedidoId, numero)` |
| `src/features/admin/actions/pedidosActions.ts` | Modificar | Type `PedidoPendiente` + `PedidoDetalle` |
| `app/admin/pedidos/page.tsx` | Reescribir | Server Component → carga datos + renderiza `TablaPedidos` |
| `src/features/admin/components/TablaPedidos.tsx` | Crear | Client Component con tabla, filtros, confirmación inline |
| `src/features/admin/components/FiltrosPedidos.tsx` | Crear | Tabs de filtro de estado |
| `app/admin/pedidos/[id]/page.tsx` | Crear | Server Component detalle + Client Component formulario |
| `src/types/supabase.ts` | Regenerar | Tras aplicar migraciones |

---

## 10. Riesgos y Consideraciones

### 10.1. Contradicción: `comprobante_url` vs `comprobante_numero`

El contexto menciona "se guarda en `pedidos.comprobante_url` por ahora hasta que Sprint 7.4 agregue la columna dedicada", pero la sección de migraciones pide agregar `comprobante_numero` en esta misma sprint.

**Decisión:** Sprint 7 agrega la columna `comprobante_numero` y la implementación la usa directamente. `comprobante_url` se deja intacta para uso futuro de uploads de archivos (Sprint 7.4).

### 10.2. 500 no verificado en DB

No se puede inspeccionar el RPC `confirmar_pedido_transaccion` sin acceso al MCP Supabase. El spec asume que la RPC funciona correctamente (como indica el contexto) y que el 500 proviene del manejo de errores en el cliente. Si la RPC falla internamente, el `toast.error` mostrará el mensaje.

### 10.3. Tier gating

Ambas vistas son accesibles para basic y premium. No se requiere feature flag. La validación de tenant ya está en las queries (`.eq('tenant_id', tenantId)`).

### 10.4. Dependencias

- `react-hot-toast` — ya disponible (usado en `TablaProductos.tsx`, `editar/[id]/page.tsx`).
- `lucide-react` — ya disponible (usado en `AdminNavigation.tsx`).
- `clsx` + `tailwind-merge` — ya disponible vía `cn()`.

### 10.5. Patrones a seguir

- Server Actions con `'use server'` en `pedidosActions.ts`.
- Client Components con `'use client'` para interactividad.
- Tipos desde `Database['public']['Tables']['...']['Row']` cuando es posible.
- `verificarAdministrador` + `obtenerTenantIdAdmin` en cada action.
- `revalidatePath` después de mutaciones.
- `cn()` para clases condicionales.
- Nomenclatura: `action` prefix o `Action` suffix para server actions.

---

## 11. Diagrama de Flujo

```
Usuario admin → /admin/pedidos
  ↓ (Server Component)
listarPedidosPendientes(estado del searchParams)
  ↓
TablaPedidos (Client Component)
  ├── FiltrosPedidos (Pendiente/Confirmado/Todos)
  ├── Row por pedido
  │     ├── Link → /admin/pedidos/[id]
  │     └── Botón "Confirmar Acreditación"
  │           → confirmarPedido(id) [Server Action]
  │           → toast.success / toast.error
  ↓
/admin/pedidos/[id]
  ↓ (Server Component)
obtenerPedidoPorId(id)
  ↓
DetallePedido (Client Component)
  ├── Datos cliente, items, total, estado
  ├── Campo "Número de comprobante"
  │     → guardarComprobante(id, numero) [Server Action]
  └── Botón "Confirmar Acreditación" (solo si pendiente)
        → confirmarPedido(id) [Server Action]
        → router.push('/admin/pedidos')
```
