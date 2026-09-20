# Spec: Sprint 6 - Deudas Técnicas Detectadas (Validación 2026-09-19)

## Contexto General

Este documento recopila las 4 deudas técnicas detectadas durante el reporte de validación (2026-09-19) y la migración del Sprint 5. Cada deuda incluye análisis de riesgo, impacto en el código verificado contra `src/types/supabase.ts`, criterios de aceptación medibles y priorización para sprints futuros.

### Estado actual verificado

| Archivo | Hallazgo relevante |
|---|---|
| `src/types/supabase.ts` | `pedidos.tenant_id: string \| null` (línea 142). `admin_users` NO tiene `tenant_id` (líneas 100-117). `Functions` solo declara `confirmar_venta_y_actualizar_crm` (líneas 165-168). Ni `confirmar_pedido_transaccion` ni `get_my_tenant_id` aparecen en los tipos. |
| `src/lib/auth/admin.ts` | `verificarAdministrador()` (líneas 5-24) verifica membresía en `admin_users` pero NO valida tenant ownership. |
| `src/features/admin/actions/pedidosActions.ts` | `confirmarPedido()` llama `rpc('confirmar_venta_y_actualizar_crm')` sin contexto de tenant (línea 54). `listarPedidosPendientes()` no filtra por `tenant_id` (líneas 27-33). Ambas son Server Actions (`'use server'`, línea 1). |

### Cadena de uso verificada

```
app/admin/pedidos/page.tsx:1
  → importa: confirmarVentaYActualizarCrm, listarPedidosPendientes
app/admin/pedidos/page.tsx:22
  → llama: listarPedidosPendientes()
app/admin/pedidos/page.tsx:89
  → pasa como action: confirmarVentaYActualizarCrm (Server Action en form)
pedidosActions.ts:84
  → confirmarVentaYActualizarCrm → await confirmarPedido(pedidoId)
pedidosActions.ts:54
  → confirmarPedido → rpc('confirmar_venta_y_actualizar_crm', { pedido_id })
```

---

## Tabla de Resumen

| # | Deuda | Tipo | Riesgo | Prioridad Sprint | Migración DB |
|---|---|---|---|---|---|
| 1 | RPCs sin validación de tenant | SECURITY | **ALTO** | Bloqueo Sprint 7 | Sí — `[MIGRACIÓN REQUERIDA]` |
| 2 | `clsx`/`tailwind-merge` no usados | FRONTEND | **BAJO** | Backlog | No |
| 3 | AGENTS.md referencia archivo eliminado | DOCS/MCP | **BAJO** | Backlog | No |
| 4 | Knip false positive `confirmarPedido` | TOOLING | **BAJO** | Backlog | No |

---

## Deuda 1: SECURITY — RPCs `confirmar_venta_y_actualizar_crm` y `confirmar_pedido_transaccion` sin validación de tenant

### Descripción

Las funciones RPC transaccionales en PostgreSQL no validan internamente que el pedido pertenezca al tenant del administrador autenticado. Un admin autenticado de **cualquier** tenant puede confirmar pedidos ajenos. La validación debe usar `get_my_tenant_id()` que ya existe en el esquema público.

### Evidencia en código

| Archivo | Línea | Hallazgo |
|---|---|---|
| `src/types/supabase.ts` | 142 | `pedidos.tenant_id: string \| null` — la columna existe pero no se filtra |
| `src/types/supabase.ts` | 100-117 | `admin_users` NO tiene `tenant_id` — no se puede mapear admin → tenant sin MCP |
| `src/types/supabase.ts` | 165-168 | Solo `confirmar_venta_y_actualizar_crm` está en `Functions`. `confirmar_pedido_transaccion` y `get_my_tenant_id` no están tipados |
| `src/lib/auth/admin.ts` | 5-24 | `verificarAdministrador()` verifica `auth.uid()` ∈ `admin_users` pero no resuelve tenant |
| `pedidosActions.ts` | 27-33 | `listarPedidosPendientes()` hace `.eq('estado', 'pendiente')` **sin** `.eq('tenant_id', ...)` |
| `pedidosActions.ts` | 52-56 | `confirmarPedido()` llama `rpc('confirmar_venta_y_actualizar_crm')` sin pasar `tenant_id` |

### Análisis: discrepancia `confirmar_pedido_transaccion`

El usuario reporta que existe la función `confirmar_pedido_transaccion(uuid)`. Sin embargo:
- **No** aparece en `src/types/supabase.ts` (Functions section, líneas 164-169)
- **No** es invocada en ningún `.ts`/`.tsx` del repositorio (grep confirma 0 resultados)
- La Sprint 5 spec (`docs/sprint-5-multi-tenant-spec.md:24`) menciona únicamente `confirmar_venta_y_actualizar_crm`

**Conclusión:** `confirmar_pedido_transaccion` es una RPC que existe en el esquema de Supabase pero **no está en los tipos TypeScript** y **no se llama desde la aplicación**. Requiere inspección vía MCP (Supabase) para confirmar su existencia, definición y relación con `confirmar_venta_y_actualizar_crm`.

### Impacto en `pedidosActions.ts`

1. **`confirmarPedido()` (línea 46)**: Debe resolver el `tenant_id` del admin autenticado (vía `get_my_tenant_id()` RPC o query a `admin_users.tenant_id`) y validar que `pedidos.tenant_id` coincide antes de ejecutar la RPC. Si falla, debe lanzar error de autorización.
2. **`listarPedidosPendientes()` (línea 25)**: Debe añadir `.eq('tenant_id', tenantId)` al query de `pedidos`.
3. **`confirmarVentaYActualizarCrm()` (línea 78)**: Wrapper de FormData — el cambio en `confirmarPedido` se propaga automáticamente; no necesita cambio estructural.
4. **Tipos (`src/types/supabase.ts`)**: Deben agregarse a la sección `Functions`:
   - `get_my_tenant_id: { Args: Record<string, never>; Returns: string }`
   - `confirmar_pedido_transaccion: { Args: { pedido_id: string }; Returns: unknown }` (si existe en DB)

### Riesgo real: **ALTO**

**Justificación:**
- **Confidencialidad rota:** Un admin de `tenant_A` puede acreditar pedidos de `tenant_B`. Implica acceso a datos de clientes (nombre, teléfono, historial) y modificación de su CRM.
- **Integridad de datos:** Confirmar un pedido de otro tenant descuenta stock y actualiza gastos del cliente incorrectos.
- **Cumplimiento:** En una app multi-tenant con datos sensibles (GDPR/ARG), esto es un hallazgo de seguridad crítico.
- **Exploitability:** La cadena `verificarAdministrador → rpc()` no requiere intervención del usuario más allá de estar autenticado como admin.

### Criterios de aceptación medibles

1. **DB-level:** Cada RPC (`confirmar_venta_y_actualizar_crm` y `confirmar_pedido_transaccion` si existe) ejecuta validación `get_my_tenant_id()` = `pedidos.tenant_id` antes de cualquier mutation; si no coincide, lanza excepción `RAISE EXCEPTION 'Pedido fuera de tenant'`.
2. **TS-level:** `src/types/supabase.ts` incluye `get_my_tenant_id` en `Functions`.
3. **`listarPedidosPendientes()`**: Query incluye `.eq('tenant_id', tenantId)` donde `tenantId` se obtiene de `get_my_tenant_id()`.
4. **`confirmarPedido()`**: Antes de la RPC transaccional, ejecuta validación de tenant y lanza `Error('No autorizado para confirmar pedidos de otro tenant')` si falla.
5. **Tests E2E (Playwright):** Dos admins de distintos tenants intentan confirmar el mismo pedido; el cross-tenant retorna 403/forbidden, el owner retorna 200 con éxito.
6. **`npm run knip`**: No introduce nuevas warnings.

### [MIGRACIÓN REQUERIDA]

**Afecta la base de datos (Supabase/PostgreSQL):**

| Acción | Descripción | Uso conocido |
|---|---|---|
| Modificar `confirmar_venta_y_actualizar_crm` | Añadir validación `get_my_tenant_id()` = `pedidos.tenant_id` al inicio de la función antes del commit | `pedidosActions.ts:54` — RPC única llamada transaccional |
| Modificar `confirmar_pedido_transaccion` | Si existe en DB, añadir la misma validación de tenant; verificar su relación con la anterior | No se detecta en código TS; verificar vía MCP |
| Verificar/crear `tenant_id` en `admin_users` | Sprint 5 sección 2.1 planea esto; si no existe, la validación DB-level no puede funcionar sin `get_my_tenant_id()` | `src/lib/auth/admin.ts:17` — query a `admin_users` |
| Tipar `get_my_tenant_id` | Agregar a `src/types/supabase.ts` `Functions` | Nueva entrada type-safe para llamadas `rpc()` |
| Tipar `confirmar_pedido_transaccion` | Si existe en DB, agregar a `Functions` | Para futuro uso tipado en `pedidosActions.ts` |

**Pre-requisito MCP:** La inspección de las funciones RPC (`confirmar_venta_y_actualizar_crm`, `confirmar_pedido_transaccion`, `get_my_tenant_id`) requiere el **Supabase MCP** bajo petición explícita del usuario. No se puede validar el código SQL interno sin inspección directa del esquema.

### Archivos afectados

- `src/types/supabase.ts` — agregar tipos de functions
- `src/features/admin/actions/pedidosActions.ts` — validación tenant en `confirmarPedido`, filtro en `listarPedidosPendientes`
- `src/lib/auth/admin.ts` — posiblemente elevar lógica de resolución de tenant a helper reutilizable
- Base de datos Supabase — modificación RPC + posible columna `admin_users.tenant_id`

### Bloqueo de sprint

**Bloquea Sprint 7.** No se debe avanzar con features multi-tenant hasta que el aislamiento de tenant esté implementado en las RPCs y en la capa de aplicación. La Sprint 5 planificó pero no completó esta validación (`docs/sprint-5-multi-tenant-spec.md:24`).

---

## Deuda 2: FRONTEND — `clsx` y `tailwind-merge` declarados pero no importados

### Descripción

Las dependencias `clsx` (^2.1.1) y `tailwind-merge` (^3.6.0) están en `package.json` (líneas 21 y 29) pero nunca importadas. Knip lo confirma. Existe código manual de composición de clases condicionales que debería migrarse a un helper centralizado.

### Evidencia en código

| Archivo | Línea | Hallazgo |
|---|---|---|
| `package.json` | 21 | `"clsx": "^2.1.1"` — dependencia declarada, nunca importada |
| `package.json` | 29 | `"tailwind-merge": "^3.6.0"` — dependencia declarada, nunca importada |
| `package.json` | 93 | El script de init de AGENTS.md instala ambos paquetes |
| `app/admin/pedidos/page.tsx` | 58 | `className={`...${cliente.estilos}`}` — composición manual de clases condicionales |
| `src/lib/` | — | **No existe** directorio `src/lib/utils/` |

### Grep de verificación

```
grep -r "clsx\|tailwind-merge\|cn(" src/  →  0 resultados
```

### Decisión: Crear helper centralizado `src/lib/utils/cn.ts`

| Alternativa | Pros | Contras |
|---|---|---|
| **Crear `src/lib/utils/cn.ts`** con `clsx` + `tailwind-merge` | • Ya están instalados (no hay costo de dependencias)<br>• El SDK y `.clinerules` los recomiendan implícitamente para clases condicionales de Tailwind<br>• `page.tsx:58` ya hace manualmente lo que `cn()` haría<br>• Patrón estándar en React ecosystem | • Necesita migrar usos existentes (solo 1-2 lugares)<br>• Nuevo archivo en el árbol |
| **Eliminar de `package.json`** | • Reduce `node_modules`<br>• Knip deja de reportar | • Va en contra de las convenciones del SDK<br>• El `page.tsx:58` y futuros componentes seguirán necesitando composición de clases<br>• Imposibilita adopción futura de UI_GEN skill |

**`tailwind-merge` resuelve un problema real:** evita conflictos de clases Tailwind (ej. `bg-red-500` + `bg-green-500` → `bg-green-500`). El patrón manual en `page.tsx:58` no tiene conflictos hoy, pero es frágil a medida que se añaden clases dinámicas.

### Riesgo real: **BAJO**

**Justificación:** No es un bug funcional. Es dead code que genera ruido en Knip. El riesgo es de mantenibilidad a largo plazo: sin un helper centralizado, la composición de clases crecerá de forma inconsistente.

### Criterios de aceptación medibles

1. **`src/lib/utils/cn.ts`** creado con:
   ```ts
   import clsx from 'clsx';
   import { twMerge } from 'tailwind-merge';
   export function cn(...inputs: Parameters<typeof clsx>) {
       return twMerge(clsx(inputs));
   }
   ```
2. **Migración en `app/admin/pedidos/page.tsx:58`**: reemplazar template literal por `cn('rounded-full border px-2 py-0.5 text-xs font-semibold', cliente.estilos)`.
3. **`npm run knip`**: No reporta `clsx` ni `tailwind-merge` como unused.
4. **Migración futura:** Todos los componentes nuevos usan `cn()` en lugar de template literals para clases condicionales.

### [MIGRACIÓN REQUERIDA]

**No aplica.** No hay cambios en la base de datos.

### Archivos afectados

- `package.json` — **deuda técnica: mantener como está (decision: adoptar, no eliminar)**
- `src/lib/utils/cn.ts` — **nuevo archivo**
- `app/admin/pedidos/page.tsx` — refactor de `className` en línea 58

### Bloqueo de sprint

**Backlog.** No bloquea funcionalidad. Puede hacerse en cualquier sprint de tech debt o como parte de la migración de UI.

---

## Deuda 3: AGENTS.md — Referencia a `src/supabase-client-pattern.ts` (archivo eliminado)

### Descripción

La plantilla AGENTS.md (inyectada por el SDK de ai-stack-core en `D:\ai-stack-core`) contiene una referencia en el "Mapa de Contexto Real" a `src/supabase-client-pattern.ts`, un archivo eliminado en la refactorización de Fases 1-2. El reemplazante oficial es `src/lib/auth/admin.ts`, que contiene el patrón de verificación de administrador (`verificarAdministrador`).

### Evidencia en código

| Archivo | Línea | Hallazgo |
|---|---|---|
| `AGENTS.md` (script init) | 56 | Heredoc template: `- **Patrones de Diseño:** `src/lib/supabase/server.ts`` — referencia actual (actualizada parcialmente desde el SDK) |
| `src/supabase-client-pattern.ts` | — | **No existe** en el repositorio (grep y glob confirman: 0 resultados) |
| `src/lib/auth/admin.ts` | 5-24 | `verificarAdministrador()` — el patrón de diseño de autenticación/admin que reemplaza al archivo eliminado |
| `src/lib/supabase/server.ts` | 5-26 | `createSupabaseServerClient()` — cliente de Supabase, existe pero es un concern separado del "Patrones de Diseño" |

### Análisis de discrepancia

- El SDK template en `D:\ai-stack-core` reportablemente referencia `src/supabase-client-pattern.ts` (no accesible desde este workspace).
- Este repositorio's AGENTS.md (script init, línea 56) referencia `src/lib/supabase/server.ts` — una actualización parcial, pero el usuario indica que el reemplazante correcto es `src/lib/auth/admin.ts`.
- `src/lib/auth/admin.ts` contiene `verificarAdministrador()`, el patrón de verificación de admin que fue parte del antiguo `supabase-client-pattern.ts`.

#### Tabla de referencias

| Elemento del "Mapa de Contexto" | Current (line 56 heredoc) | Correcto (según usuario) | Archivo verificado |
|---|---|---|---|
| Patrones de Diseño | `src/lib/supabase/server.ts` | `src/lib/auth/admin.ts` | ✅ Existe |

### Riesgo real: **BAJO**

**Justificación:** Es un problema de documentación. Las referencias rotas en AGENTS.md generan ruido para agentes IA (Cline, Continue, Copilot) que consultan el archivo para localizar patrones. No afecta funcionalidad, pero degrada la calidad del contexto de IA en proyectos nuevos generados con el SDK.

### Criterios de aceptación medibles

1. **Local:** `AGENTS.md` heredoc (línea 56) actualizado: `- **Patrones de Diseño:** `src/lib/auth/admin.ts``
2. **SDK:** Template en `D:\ai-stack-core` actualizado — la plantilla que genera el AGENTS.md debe referenciar `src/lib/auth/admin.ts` en lugar de `src/supabase-client-pattern.ts`.
3. **Verificación:** `grep -r "supabase-client-pattern" .` retorna **0 resultados** en proyectos nuevos generados con el SDK actualizado.
4. **Verificación local:** `grep -r "supabase-client-pattern" .` retorna **0 resultados** en este repositorio.

### [MIGRACIÓN REQUERIDA]

**No aplica.** No hay cambios en la base de datos.

### Archivos afectados

- `AGENTS.md` (este repositorio, heredoc línea 56) — actualizar referencia
- `D:\ai-stack-core` (SDK template) — **fuera del workspace**, requiere acceso al SDK externo

### Bloqueo de sprint

**Backlog.** Problema documental. No bloquea funcionalidad ni sprints.

---

## Deuda 4: KNIP — `confirmarPedido` reportado como "no usado" (falso positivo)

### Descripción

El export `confirmarPedido` en `pedidosActions.ts` (línea 46) aparece como "no usado" en el reporte de Knip. Sin embargo, la cadena de uso flow 4.2 confirma que SÍ se usa internamente. Se debe determinar si es un falso positivo de Knip o un problema de barrel file.

### Evidencia en código

| Archivo | Línea | Hallazgo |
|---|---|---|
| `pedidosActions.ts` | 1 | `'use server';` — Server Action file |
| `pedidosActions.ts` | 46 | `export async function confirmarPedido(...)` — el export reportado como "no usado" |
| `pedidosActions.ts` | 84 | `await confirmarPedido(pedidoId)` — uso interno desde `confirmarVentaYActualizarCrm` |
| `app/admin/pedidos/page.tsx` | 1 | `import { confirmarVentaYActualizarCrm, listarPedidosPendientes } from '.../pedidosActions'` |
| `app/admin/pedidos/page.tsx` | 89 | `<form action={confirmarVentaYActualizarCrm}>` — Server Action pasada como prop de form |

### Análisis: ¿Falso positivo o barrel file mal configurado?

#### Estado del barrel file

| Elemento | Estado |
|---|---|
| `src/features/admin/actions/index.ts` | **No existe** — el directorio `actions/` no tiene barrel file |
| `src/features/admin/index.ts` | **No existe** — el feature `admin` no tiene `index.ts` |
| `.clinerules/02-arquitectura-features.md` | Línea 19: "Contrato de Interfaz (`index.ts`): OBLIGATORIO. Cada feature debe tener un archivo `index.ts`" |

**Conclusión parcial:** No hay barrel file, pero `app/admin/pedidos/page.tsx` importa directamente del archivo `pedidosActions.ts` y el import funciona. La falta de barrel no es la causa del false positive.

#### Configuración Knip

| Elemento | Estado |
|---|---|
| `.kniprc.json` | **No existe** |
| `knip.config.ts` | **No existe** |
| Sección `knip` en `package.json` | **No existe** |
| Entry points Knip (default) | `src/**/*` y `app/**/*` — pero Knip podría no rastrear Server Actions en `app/` |

#### Root cause analysis

1. **Server Actions en form actions:** Knip podría no reconocer `<form action={confirmarVentaYActualizarCrm}>` en JSX `.tsx` como "uso" del export. Si Knip no detecta que `confirmarVentaYActualizarCrm` es consumido, no rastrea la cadena interna a `confirmarPedido`.

2. **Tipos genéricos complejos:** `src/lib/auth/admin.ts:3` define `type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>`. Knip podría tener dificultades rastreando exports que dependen de tipos genéricos profundos.

3. **Sin entry configurado para `app/`:** Sin `.kniprc.json`, Knip usa defaults que pueden no incluir `app/` como entry point, impidiendo el rastreo desde `app/admin/pedidos/page.tsx` a `pedidosActions.ts`.

**Conclusión final:** Es un **falso positivo de Knip**. El motivo raíz es la falta de configuración de Knip para Next.js Server Actions. `confirmarPedido` SÍ es usado internamente por `confirmarVentaYActualizarCrm`, que a su vez es usada como Server Action handler en `app/admin/pedidos/page.tsx:89`.

### Riesgo real: **BAJO**

**Justificación:** No es un bug funcional. `confirmarPedido` funciona correctamente. El false positive genera ruido en CI si Knip falla el build.

### Criterios de aceptación medibles

1. **`npm run knip`**: No reporta `confirmarPedido` como "Export not used" o "Export not found".
2. **`.kniprc.json`** creado en el root del proyecto con configuración Next.js Server Actions.
3. **Verificación adicional:** `npx knip --verbose` rastrea la cadena `app/admin/pedidos/page.tsx` → `confirmarVentaYActualizarCrm` → `confirmarPedido` sin warnings.

### Recomendación de configuración Knip

Crear `.kniprc.json`:
```json
{
    "entry": [
        "src/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}"
    ],
    "ignoreExports": [
        {
            "src/features/admin/actions/pedidosActions.ts": ["confirmarPedido"]
        }
    ]
}
```

> **Nota:** La entrada `ignoreExports` es el enfoque explícito para este false positive. Si Knip 6.x resuelve correctamente con `entry` ampliado a `app/**`, la entrada `ignoreExports` puede omitirse. Validar con `npm run knip` después de crear el config.

### [MIGRACIÓN REQUERIDA]

**No aplica.** No hay cambios en la base de datos.

### Archivos afectados

- `.kniprc.json` — **nuevo archivo** (configuración Knip)

### Bloqueo de sprint

**Backlog.** No bloquea funcionalidad. Puede hacerse en cualquier sprint de tech debt.

---

## Sección: Tareas Pendientes por Sprint

### Sprint 6 (actual — en ejecución)

| Deuda | Si debe hacerse | Si no debe hacerse | Justificación |
|---|---|---|---|
| 1 (SECURITY) | **No** — requiere MCP de Supabase para inspección DB | No procede sin acceso a esquema real | Bloqueada en espera de autorización MCP |
| 2 (FRONTEND) | Opcional si hay tiempo de tech debt | Puede ir al backlog | No bloqueante, pero alto ROI |
| 3 (AGENTS.md) | No — template en `D:\ai-stack-core` está fuera de workspace | Backlog | Requiere acceso al SDK externo |
| 4 (KNIP) | Opcional — crear `.kniprc.json` (5 líneas) | Backlog | Elimina ruido CI |

### Sprint 7 (próximo)

**Bloqueo:** La Deuda 1 (SECURITY) **bloquea el Sprint 7**. No se debe avanzar con features multi-tenant hasta que el aislamiento de tenant esté implementado en las RPCs y en la capa de aplicación. La Sprint 5 planificó pero no completó esta validación (`docs/sprint-5-multi-tenant-spec.md:24`).

### Prioridad de resolución

```
1. [ALTO]    → Deuda 1: SECURITY (bloquea Sprint 7) — requiere MCP
2. [BAJO]    → Deuda 4: KNIP (config .kniprc.json, elimina ruido CI)
3. [BAJO]    → Deuda 2: FRONTEND (helper cn.ts + migración page.tsx:58)
4. [BAJO]    → Deuda 3: AGENTS.md (actualizar heredoc + template SDK)
```

### Resumen de migraciones de base de datos

| Deuda | Tipo de migración | Pre-requisito |
|---|---|---|
| 1 (SECURITY) | Modificar RPCs + tipar functions en `src/types/supabase.ts` | **MCP Supabase bajo petición explícita** — no se puede validar SQL sin inspección directa |
| 2-4 | No aplicable | N/A |
