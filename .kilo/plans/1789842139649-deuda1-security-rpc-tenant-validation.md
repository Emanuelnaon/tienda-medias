# Plan: Deuda 1 - SECURITY - RPCs sin validación de tenant (Sprint 6/7)

## Objetivo
Implementar aislamiento de tenant en la RPC transaccional canónica (`confirmar_pedido_transaccion`) y en la capa de aplicación (`pedidosActions.ts`) para evitar que un admin de un tenant pueda confirmar/leer pedidos de otro tenant.

## Estado actual verificado (MCP confirmado - Sprint 5 ya ejecutado)

| Elemento | Estado | Detalle |
|----------|--------|---------|
| `tenants` table | ✅ Existe | `id` UUID PK |
| `admin_users.tenant_id` | ✅ Existe | UUID, nullable, FK a `tenants(id)` |
| `admin_users.role` | ✅ Existe | `text` NOT NULL (usado por `get_my_tenant_id`) |
| `get_my_tenant_id()` | ✅ Existe | `RETURNS uuid` - `SELECT tenant_id FROM admin_users WHERE id = auth.uid() AND role = 'admin' LIMIT 1` |
| `pedidos.tenant_id` | ✅ Existe | UUID NOT NULL |
| `confirmar_venta_y_actualizar_crm` | ✅ Existe | Legacy - usa `productos` (sin talles) |
| `confirmar_pedido_transaccion` | ✅ Existe | Canónica - usa `producto_variantes` (con talles), retorna JSON |

**Conclusión:** Infraestructura de tenant YA existe. Solo falta:
1. Agregar validación de tenant dentro de `confirmar_pedido_transaccion`
2. Revocar acceso a `confirmar_venta_y_actualizar_crm` (legacy)
3. Actualizar tipos TypeScript
4. Actualizar `pedidosActions.ts`

## Plan de implementación

### Fase 1: Migración única de base de datos
| Paso | Acción SQL | Descripción |
|------|------------|-------------|
| 1.1 | Leer cuerpo completo de `confirmar_pedido_transaccion` via MCP | **Obligatorio:** preservar toda la lógica de stock existente (producto_variantes, talles, etc.) |
| 1.2 | `CREATE OR REPLACE FUNCTION confirmar_pedido_transaccion(p_pedido_id uuid) ...` | Agregar validación al inicio del cuerpo (antes de cualquier lógica):<br><br>```sql<br>-- Validación de aislamiento de tenant<br>-- get_my_tenant_id() retorna NULL para webmaster (rol sin tenant asignado)<br>-- IS DISTINCT FROM maneja NULL correctamente (NULL IS DISTINCT FROM uuid = TRUE)<br>-- IS NOT NULL permite paso libre a webmaster (NULL tenant_id = acceso global)<br>IF get_my_tenant_id() IS DISTINCT FROM<br>   (SELECT tenant_id FROM pedidos WHERE id = p_pedido_id)<br>   AND get_my_tenant_id() IS NOT NULL<br>THEN<br>  RAISE EXCEPTION 'Acceso denegado: pedido no pertenece a este tenant';<br>END IF;<br>``` |
| 1.3 | `REVOKE EXECUTE ON FUNCTION confirmar_venta_y_actualizar_crm(uuid) FROM authenticated;` | Deprecar RPC legacy - revocar acceso |

### Fase 2: Actualización de tipos TypeScript (`src/types/supabase.ts`)
- **Editar únicamente** las secciones afectadas (no regenerar archivo completo):
  1. `Database['public']['Tables']['admin_users']['Row']`: agregar `tenant_id: string \| null`, `role: string`
  2. `Database['public']['Functions']`: agregar:
     - `get_my_tenant_id: { Args: Record<string, never>; Returns: string }`
     - `confirmar_pedido_transaccion: { Args: { pedido_id: string }; Returns: { success: boolean; mensaje: string } }`

### Fase 3: Capa de aplicación
| Archivo | Cambio |
|---------|--------|
| `src/lib/auth/admin.ts` | Agregar `export async function obtenerTenantIdAdmin(): Promise<string>` que llame `rpc('get_my_tenant_id')` |
| `src/features/admin/actions/pedidosActions.ts` | **Primero:** `grep` para confirmar qué RPC usa `confirmarPedido()` actualmente<br>**Luego:** En `listarPedidosPendientes()`: obtener `tenantId` via `obtenerTenantIdAdmin()` y agregar `.eq('tenant_id', tenantId)`<br>**Si `confirmarPedido` usa `confirmar_venta_y_actualizar_crm`:** cambiar a `confirmar_pedido_transaccion` (ya valida en DB). Si ya usa la correcta, solo logging opcional. |

### Fase 4: Validación
- `npm run build` - sin errores de tipos
- `npm run lint` - sin warnings nuevos
- `npm run knip` - sin warnings nuevos
- Test manual: admin tenant A no puede confirmar pedido tenant B

## Archivos a modificar
1. **DB**: 1 migración SQL (Fase 1.1 + 1.2) - ejecutar vía `supabase_apply_migration`
2. `src/types/supabase.ts` - types de functions + `admin_users` Row
3. `src/lib/auth/admin.ts` - helper `obtenerTenantIdAdmin()`
4. `src/features/admin/actions/pedidosActions.ts` - filtro en `listarPedidosPendientes`, cambiar RPC en `confirmarPedido`

## Dependencias y orden
```
Fase 1 (DB migración) → Fase 2 (tipos TS) → Fase 3 (capa app) → Fase 4 (validación)
```

## Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|------------|
| `admin_users` existing rows sin `tenant_id` | Columna nullable; `get_my_tenant_id()` retorna NULL → validación `IS DISTINCT FROM` + `IS NOT NULL` bloquea correctamente (NULL IS DISTINCT FROM uuid = TRUE, pero IS NOT NULL = FALSE → no entra al IF) |
| `confirmar_venta_y_actualizar_crm` aún referenciada | Verificar grep: solo `pedidosActions.ts` la usa → cambiar a `confirmar_pedido_transaccion` en Fase 3 |
| `get_my_tenant_id()` retorna NULL para no-admins/webmaster | Validación en RPC: `IS NOT NULL` permite paso a webmaster (diseño intencional), bloquea a admins sin tenant asignado |
| Webmaster (rol global sin tenant) | Comportamiento documentado en comentario SQL: NULL tenant_id = acceso global por diseño |

## Decisiones resueltas
1. ✅ **Validación solo en DB** (Fase 1) - más robusta, centralizada
2. ✅ **Usar `confirmar_pedido_transaccion`** - es la correcta para stock por talle
3. ✅ **Revocar `confirmar_venta_y_actualizar_crm`** - legacy, no se usa en app tras Fase 3
4. ✅ **App-layer tenant resolution** - solo para `listarPedidosPendientes` (read path); `confirmarPedido` confía en validación DB

---

**Próximo paso:** Aplicar migración DB (Fase 1) - agregar validación a `confirmar_pedido_transaccion` y revocar `confirmar_venta_y_actualizar_crm`.