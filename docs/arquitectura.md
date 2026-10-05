# Arquitectura Técnica — SaaS E-commerce Multi-Tenant
**Última actualización:** 2026-09-28
**Para:** equipo de desarrollo y agentes de IA (Kilo Code)

---

## Stack Tecnológico

| Capa | Tecnología | Decisión |
|------|-----------|----------|
| Frontend | Next.js 16 (App Router) | Server Components por defecto, Client Components solo para interactividad |
| Base de datos | Supabase (PostgreSQL) | SSOT de tipos, RLS nativo, Realtime, Edge Functions |
| Estilos | Tailwind CSS | Mobile-first, tokens en `globals.css`, `cn()` para clases condicionales |
| Auth | Supabase Auth | JWT, roles en `admin_users`, middleware en `src/middleware.ts` |
| Deploy | Vercel | Edge Network, ISR, Server Actions |
| Estado global | Zustand + Immer | Solo para carrito y UI global, no para datos del servidor |
| Validación | Zod + React Hook Form | Schema compartido entre cliente y servidor |
| Testing | Vitest | Tests unitarios para lógica pura, E2E con Playwright para flujos críticos |

---

## Principios de Arquitectura

### 1. Feature-Based Folder Structure
Cada dominio de negocio vive en `src/features/{nombre}/`:
```
src/features/
  carrito/
    actions/      ← Server Actions ('use server')
    components/   ← Client Components ('use client')
    store/        ← Zustand store
    types/        ← tipos locales del feature
    utils/        ← lógica pura testeable
  admin/
  catalogo/
  configuracion-pagos/
  checkout-confirmacion/
  productos/
  auth/
```
**Regla:** ningún componente de un feature importa directamente de otro feature. Si dos features comparten algo, va a `src/lib/` o `src/components/ui/`.

### 2. SSOT de Tipos
`src/types/supabase.ts` es la única fuente de verdad del modelo de datos. Se regenera con:
```bash
npx supabase gen types typescript --project-id <ID> --schema public > src/types/supabase.ts
```
**Regla:** nunca se edita a mano. Después de cada migración de DB, se regenera antes de tocar código.

### 3. Server Actions como única capa de mutación
Toda operación que escribe en la DB usa Server Actions en `src/features/{nombre}/actions/`. Nunca se hace fetch directo desde el cliente a Supabase para mutaciones.

**Patrón estándar de Server Action:**
```typescript
'use server';
export async function miAction(input: Input): Promise<Output> {
  const supabase = await verificarAdministrador('descripcion del permiso');
  const tenantId = await obtenerTenantIdAdmin();
  // lógica...
  revalidatePath('/ruta-afectada');
  return resultado;
}
```

### 4. RPC SECURITY DEFINER para operaciones públicas
Las operaciones que necesita hacer un usuario no autenticado (anon) van a funciones PostgreSQL con `SECURITY DEFINER`. Nunca se dan permisos de escritura directa a anon sobre tablas.

**RPCs públicas actuales:**
- `crear_cliente_checkout(p_nombre_completo, p_telefono, p_tenant_id)` → uuid
- `crear_pedido_checkout(p_cliente_id, p_total, p_tenant_id, p_items)` → uuid
- `crear_lista_espera(p_tenant_id, p_producto_id, p_variante_id, p_email, p_telefono)` → uuid
- `get_pedido_publico(p_id)` → json

**Patrón de RPC pública:**
```sql
CREATE OR REPLACE FUNCTION public.nombre_funcion(...)
RETURNS tipo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ ... $$;
GRANT EXECUTE ON FUNCTION public.nombre_funcion(...) TO anon;
```

### 5. Multi-Tenant por defecto
Toda tabla nueva lleva `tenant_id uuid NOT NULL REFERENCES tenants(id)` y RLS habilitado. Sin excepciones.

**Helper functions de RLS:**
- `get_my_tenant_id()` → uuid: retorna el tenant del admin logueado (NULL para webmaster)
- `is_webmaster()` → boolean: true si el usuario tiene rol webmaster

### 6. Feature Gating Centralizado
Ninguna feature gateada por plan usa `if (tenant.plan === ...)` en el código. Todo check pasa por `plan_features` en DB + helper `tieneFeature(featureKey)` en `src/lib/auth/entitlements.ts`.

### 7. No-Touch de Estilos
Ningún cambio de `className`, token de Tailwind o valor CSS se aplica como efecto colateral de una tarea no visual. Si se detecta una mejora de estilo posible, se sugiere al final — nunca se aplica sin confirmación.

---

## Modelo de Roles

| Rol | tenant_id | Acceso |
|-----|-----------|--------|
| `webmaster` | NULL | Ve y administra todos los tenants via `is_webmaster()` |
| `admin` | uuid del tenant | CRUD sobre datos de su propio tenant via `get_my_tenant_id()` |
| `anon` | — | Solo lectura pública + INSERT via RPC SECURITY DEFINER |

**Roles futuros (Sprint 12):**
- `cajero`: solo lectura de pedidos del tenant
- `deposito`: solo lectura y actualización de stock del tenant

---

## Clientes de Supabase

| Cliente | Función | Cuándo usarlo |
|---------|---------|---------------|
| `createSupabaseServerClient()` | Lee cookies de sesión | Server Actions de admin, Server Components autenticados |
| `createSupabasePublicClient()` | Anon key sin sesión | Checkout público, página `/pedido/[id]`, lista de espera |

**Regla:** nunca usar el cliente público para operaciones de escritura directa. Siempre via RPC SECURITY DEFINER.

---

## Patrones de UI

### Server Component (página admin con datos)
```typescript
// app/admin/recurso/page.tsx
export default async function Page() {
  const datos = await listarRecursos(); // Server Action
  return <TablaRecursos datosIniciales={datos} />;
}
```

### Client Component (interactividad)
```typescript
'use client';
// src/features/admin/components/TablaRecursos.tsx
export function TablaRecursos({ datosIniciales }: Props) {
  const [datos, setDatos] = useState(datosIniciales);
  // interactividad, toast, optimistic updates...
}
```

### Página pública (sin auth)
```typescript
// app/pedido/[id]/page.tsx — fuera del layout de admin
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await obtenerRecursoPublico(id); // usa createSupabasePublicClient
  if (!data) redirect('/');
  return <VistaPublica data={data} />;
}
```

---

## Migraciones de Base de Datos

### Reglas
1. Verificar schema real via MCP o `information_schema.columns` antes de cualquier ALTER TABLE
2. Usar `IF NOT EXISTS` en CREATE TABLE e índices
3. Usar `DO $$ IF NOT EXISTS` para ADD CONSTRAINT (PostgreSQL no soporta `IF NOT EXISTS` nativo)
4. Toda función SECURITY DEFINER lleva `SET search_path = public, pg_temp`
5. Regenerar `src/types/supabase.ts` después de cada migración

### Orden de aplicación
```
1. Backup en Supabase Dashboard
2. ALTER TABLE / CREATE TABLE
3. Crear índices
4. Crear/actualizar policies RLS
5. Crear/actualizar funciones y RPCs
6. INSERT de datos semilla (plan_features, etc.)
7. Regenerar tipos TS
8. npm run check
```

---

## Testing

### Tipos de tests por capa

| Capa | Herramienta | Qué testear |
|------|------------|-------------|
| Lógica pura (utils) | Vitest | Siempre — funciones sin efectos secundarios |
| Server Actions | Vitest + Supabase local | Features críticas: checkout, confirmación de pedido |
| UI | Playwright E2E | Flujos completos cuando la UI esté estable |

### Tests unitarios existentes
```
src/features/admin/utils/__tests__/calcularEtiquetaCliente.test.ts       (6 casos)
src/features/catalogo/utils/__tests__/calcularEtiquetasInventario.test.ts (6 casos)
```

### Cuándo agregar tests unitarios
- Toda función en `src/features/*/utils/` debe tener tests
- Funciones de cálculo, transformación o validación: siempre
- Server Actions: solo las críticas (checkout, pagos)
- Componentes UI: no por defecto, solo si tienen lógica compleja

---

## Scripts de Validación

```bash
npm run check   # type-check + lint + knip + test:unit + build
npm run test:unit        # solo tests unitarios (Vitest)
npm run test:unit:watch  # modo watch para desarrollo
npm run test:e2e         # Playwright (cuando haya tests escritos)
```

**Regla:** `npm run check` debe pasar en 0 errores antes de cada commit importante.

---

## Arquitectura de Pagos (Roadmap)

Ver `docs/pagos.md` para la estrategia completa.

**Principio base:** la plataforma nunca es intermediaria del dinero. El tenant conecta sus propias credenciales y el dinero va directo a su cuenta. La plataforma cobra solo la suscripción mensual.

**Patrón futuro:**
```
Frontend → Edge Function /payment-router → tenant_payment_configs → Provider API
```

La Edge Function es el único punto que toca credenciales encriptadas en Supabase Vault.

---

## Decisiones Registradas

| Decisión | Alternativa descartada | Motivo |
|----------|----------------------|--------|
| RPC SECURITY DEFINER para anon | Policy INSERT directa | El cliente público de Next.js no envía rol anon correctamente |
| tenant_id UUID en todas las tablas | TEXT 'default' | Consistencia, FK real, queries más eficientes |
| Zustand solo para carrito | Server State para todo | El carrito es UI state, no server state |
| Vitest sobre Jest | Jest | Más rápido, mejor integración con Vite/Next.js |
| window.location.assign sobre router.push | router.push | El drawer desmonta el componente antes de que router.push complete |
| Trigger para sincronizar productos.stock | Calcular en runtime | Evita N+1 queries en listados, stock siempre consistente |
| Feature gating via plan_features en DB | Hardcodear en código | Permite cambiar features sin deploy, un solo lugar de verdad |
