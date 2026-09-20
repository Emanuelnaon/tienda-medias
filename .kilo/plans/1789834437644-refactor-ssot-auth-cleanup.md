# PLAN: Refactorización Segura — Limpieza de Código y Consolidación de SSOT

## Resumen Ejecutivo

Eliminar código muerto, duplicados y centralizar la lógica de autenticación en una Fuente Única de Verdad (SSOT), sin romper imports ni alterar la lógica de negocio. Dos fases: unificación de tipos y centralización de auth.

## Hallazgos Clave

| Hallazgo | Archivo | Riesgo |
|---|---|---|
| Archivo muerto, duplicado de `createSupabaseServerClient` | `src/supabase-client-pattern.ts` | 0 — nunca importado |
| Tipos de Supabase obsoletos (140 líneas, faltan `categorias`, `Relationships`, `Views`) | `types/supabase.ts` | Alto — `SelectorProducto.tsx` importa de aquí |
| Importación a tipos obsoletos | `SelectorProducto.tsx:6` (`@/types/supabase`) | Alto |
| Lógica de auth duplicada (líneas 1-73) | `Sidebar.tsx` & `MobileNav.tsx` | Medio |
| Función `verificarAdministrador` duplicada con mensajes de error distintos | `productosActions.ts:36-53` & `pedidosActions.ts:25-41` | Medio |
| Deps declarados pero nunca importados | `package.json` (`clsx`, `tailwind-merge`) | Bajo |
| Import relativo inestándar | `app/carrito/page.tsx:4` (`../../src/features/...`) | Bajo |
| Directorio de hooks vacío | `src/hooks/` | Bajo |

## Decisiones de Diseño

### D1: Mensajes de error en `verificarAdministrador` (RESUELTO)
Las dos implementaciones existentes usan mensajes de error **diferentes y contextuales**:
- Productos: `"Debes iniciar sesión para realizar esta operación."` / `"No tienes permisos suficientes de administración."`
- Pedidos: `"Debes iniciar sesión para gestionar pedidos."` / `"No tienes permisos para gestionar pedidos."`

**Solución:** La función compartida acepta un parámetro `context: string` opcional (default `"la operación"`) que personaliza los mensajes de error manteniendo el flujo de ejecución idéntico:
```typescript
// 'Debes iniciar sesión para <context>.'
// 'No tienes permisos para <context>.'
```
Los callers pasarán `"realizar esta operación"`, `"gestionar pedidos"`, etc. Esto preserva el comportamiento actual de cada acción.

### D2: Extracción del hook `useAuthState` (RESUELTO)
El hook `useAuthState` encapsula líneas 1-73 de `Sidebar.tsx`/`MobileNav.tsx` y retornará:
```typescript
{
  usuario: SupabaseUser | null;
  mounted: boolean;
  totalItems: number;
  totalFavoritos: number;
  animateBadge: boolean;
  handleSignOut: () => Promise<void>;
}
```
El hook llama internamente a `useRouter()`, por lo que los componentes no necesitan pasarlo. La lógica es un refactor estructural puro (misma secuencia de hooks, mismo ciclo de vida).

---

## Fase 1: Unificación de Tipos (SSOT) y Limpieza de Duplicados

### Paso 1.1 — Verificar integridad de `src/types/supabase.ts`
- **Archivo fuente:** `src/types/supabase.ts` (171 líneas, 11 tablas con `Relationships: []`, `Views: Record<string, never>`)
- **Confirmado:** Incluye `categorias`, `producto_variantes` con `updated_at`, tipos `Row`/`Insert`/`Update` completos para todas las tablas.
- **No requiere cambios.** Es la SSOT declarada.

### Paso 1.2 — Actualizar import en `SelectorProducto.tsx`
- **Archivo:** `src/features/productos/components/SelectorProducto.tsx`
- **Línea 6:**
  ```diff
  -import type { Database } from '@/types/supabase';
  +import type { Database } from '@/src/types/supabase';
  ```
- **Orden:** Este paso DEBE ejecutarse antes del Paso 1.3.

### Paso 1.3 — Eliminar tipos raíz duplicados
- **Archivo a borrar:** `types/supabase.ts` (root, 140 líneas — está obsoleto)
- **Verificación previa:** Confirmado que `SelectorProducto.tsx` (el único importador via `@/types/supabase`) ya fue actualizado en Paso 1.2.
- **Comando:** `rm types/supabase.ts`

### Paso 1.4 — Eliminar archivo de patrón no referenciado
- **Archivo a borrar:** `src/supabase-client-pattern.ts` (27 líneas)
- **Justificación:** Nunca es importado por ningún archivo en el proyecto. La función `createSupabaseServerClient` que exporta es funcionalmente idéntica a `src/lib/supabase/server.ts` (las únicas diferencias son comentarios en líneas 5, 21).
- **Comando:** `rm src/supabase-client-pattern.ts`

---

## Fase 2: Centralización de Autenticación y Lógica de Negocio

### Paso 2.1 — Crear `src/lib/auth/admin.ts`
- **Nuevo archivo:** `src/lib/auth/admin.ts`
- **Contenido:**
  ```typescript
  import { createSupabaseServerClient } from '@/src/lib/supabase/server';

  type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

  export async function verificarAdministrador(
      context: string = 'realizar esta operación',
  ): Promise<SupabaseClient> {
      const supabase = await createSupabaseServerClient();
      const {
          data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
          throw new Error(`Debes iniciar sesión para ${context}.`);
      }

      const { data: administrador, error } =
          await supabase.from('admin_users').select('id').eq('id', user.id).single();

      if (error || !administrador) {
          throw new Error(`No tienes permisos para ${context}.`);
      }

      return supabase;
  }
  ```

### Paso 2.2 — Actualizar Server Actions para usar la función centralizada

#### 2.2a — `productosActions.ts`
- Importar: `import { verificarAdministrador } from '@/src/lib/auth/admin';`
- Borrar la función local `verificarAdministrador` (líneas 33-53)
- Reemplazar llamadas `await verificarAdministrador()` → `await verificarAdministrador('realizar esta operación')`
  - En `guardarProductoConVariantes` (línea 154)
  - En `eliminarProductoAction` (línea 186)
- **Nota:** La importación actual de `@/src/lib/supabase/server` (línea 4) debe conservarse porque `supabase` se pasa a funciones auxiliares tipeadas con `any`.

#### 2.2b — `pedidosActions.ts`
- Importar: `import { verificarAdministrador } from '@/src/lib/auth/admin';`
- Borrar la función local `verificarAdministrador` (líneas 25-41)
- Reemplazar llamadas `await verificarAdministrador()` → `await verificarAdministrador('gestionar pedidos')`
  - En `listarPedidosPendientes` (línea 44)
  - En `confirmarPedido` (línea 70)

### Paso 2.3 — Crear `src/hooks/useAuthState.ts`
- **Nuevo archivo:** `src/hooks/useAuthState.ts`
- **Contenido** (exacción pura de líneas 1-73 de `Sidebar.tsx`/`MobileNav.tsx`):
  ```typescript
  'use client';

  import { useState, useEffect, useSyncExternalStore } from 'react';
  import { useRouter } from 'next/navigation';
  import { createClient } from '@/src/lib/supabase/client';
  import type { User as SupabaseUser } from '@supabase/supabase-js';
  import { useCarritoStore } from '@/src/features/carrito/store';
  import { useFavoritosStore } from '@/src/features/favoritos/store/useFavoritosStore';

  const emptySubscribe = () => () => {};

  export function useAuthState() {
      const router = useRouter();
      const [usuario, setUsuario] = useState<SupabaseUser | null>(null);

      const mounted = useSyncExternalStore(
          emptySubscribe,
          () => true,
          () => false,
      );

      const items = useCarritoStore((state) => state.items);
      const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

      const favoritos = useFavoritosStore((state) => state.favoritos);
      const totalFavoritos = favoritos.length;

      const [animateBadge, setAnimateBadge] = useState(false);

      useEffect(() => {
          if (totalItems > 0) {
              const timer1 = setTimeout(() => setAnimateBadge(true), 10);
              const timer2 = setTimeout(() => setAnimateBadge(false), 300);
              return () => {
                  clearTimeout(timer1);
                  clearTimeout(timer2);
              };
          }
      }, [totalItems]);

      useEffect(() => {
          const supabase = createClient();

          supabase.auth.getUser().then(({ data }) => setUsuario(data.user));

          const {
              data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
              setUsuario(session?.user ?? null);
          });

          return () => {
              subscription.unsubscribe();
          };
      }, [router]);

      const handleSignOut = async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          setUsuario(null);
          router.refresh();
          window.location.href = '/';
      };

      return {
          usuario,
          mounted,
          totalItems,
          totalFavoritos,
          animateBadge,
          handleSignOut,
      };
  }
  ```

### Paso 2.4 — Refactorizar `Sidebar.tsx` y `MobileNav.tsx`

#### 2.4a — `Sidebar.tsx`
- Reemplazar imports de `react`, `useRouter`, `createClient`, `SupabaseUser`, `useCarritoStore`, `useFavoritosStore` (líneas 3, 5, 8, 10, 11, 12) con: `import { useAuthState } from '@/src/hooks/useAuthState';`
- Reemplazar el cuerpo de la función (líneas 16-73) con:
  ```typescript
  export function Sidebar() {
      const {
          usuario,
          mounted,
          totalItems,
          totalFavoritos,
          animateBadge,
          handleSignOut,
      } = useAuthState();

      if (!mounted) return null;

      return (
          // ... JSX existente (líneas 77-166) permanece IGUAL
      );
  }
  ```
- **Conservar** importaciones de `Link`, `lucide-react`, `BotonModoOscuro`, `BuscadorRedes` y el JSX del render.

#### 2.4b — `MobileNav.tsx`
- Mismo patrón que Sidebar.
- Reemplazar imports (líneas 3, 5, 8, 9, 10, 11) con `import { useAuthState } from '@/src/hooks/useAuthState';`
- Reemplazar cuerpo de función (líneas 16-73) con desestructuración del hook.
- JSX (líneas 77-152) **permanece IGUAL**.

---

## Validación Post-Refactorización

1. **`tsc --noEmit`** — verificar tipos (el hook retorna `SupabaseUser | null`, los componentes usan `usuario` para condicional ternario)
2. **Buscar referencias rotas:**
   - `grep -r "@/types/supabase" src/` → debe devolver 0 resultados
   - `grep -r "src/supabase-client-pattern" .` → debe devolver 0 resultados
3. **Verificar imports de `verificarAdministrador`:**
   - `productosActions.ts` e `pedidosActions.ts` deben importarlo desde `@/src/lib/auth/admin`
   - Ningún archivo debe tener una definición local de `verificarAdministrador`
4. **Compilar y probar:** `npm run dev` → revisar que `/admin` y `/carrito` renderizan sin errores

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| El hook `useAuthState` rompe el orden de hooks en Sidebar/MobileNav | El hook usa `useRouter`, `useState`, `useSyncExternalStore`, `useCarritoStore`, `useFavoritosStore`, `useEffect` en el mismo orden que los componentes originales. Orden preservado. |
| Error de tipo en `SupabaseClient` del Paso 2.1 | Se usa `Awaited<ReturnType<typeof createSupabaseServerClient>>` que coincide con el tipo real retornado. Alternativa si falla: `any` (matching original `@typescript-eslint/no-explicit-any` pattern in `upsertProductoBase`). |
| Mensajes de error cambian | Los callers pasan el contexto exacto; los mensajes resultantes son idénticos a los originales. |
| `SelectorProducto.tsx` se rompe al borrar `types/supabase.ts` | Paso 1.2 actualiza el import ANTES de Paso 1.3 borrar el archivo. |

## Tareas Opcionales (Post-Plan, No en Alcance de la Fase 1-2)

- [ ] Eliminar `clsx` y `tailwind-merge` de `package.json` (declarados pero no importados)
- [ ] Corregir import relativo en `app/carrito/page.tsx:4` → `@/src/features/carrito/store`
- [ ] Agregar scripts npm: `"knip": "knip"`, `"jscpd": "jscpd"`, `"depcheck": "depcheck"`, `"depcruise": "depcruise src --validate"`
- [ ] Vaciar `src/hooks/` (actualmente vacío, no afecta al plan)

## Archivos Afectados

| Archivo | Acción |
|---|---|
| `types/supabase.ts` | **Borrar** (Paso 1.3) |
| `src/supabase-client-pattern.ts` | **Borrar** (Paso 1.4) |
| `src/features/productos/components/SelectorProducto.tsx` | **Editar** — import (Paso 1.2) |
| `src/features/admin/actions/productosActions.ts` | **Editar** — import + remover función local (Paso 2.2a) |
| `src/features/admin/actions/pedidosActions.ts` | **Editar** — import + remover función local (Paso 2.2b) |
| `src/components/layout/Sidebar.tsx` | **Editar** — usar hook (Paso 2.4a) |
| `src/components/layout/MobileNav.tsx` | **Editar** — usar hook (Paso 2.4b) |
| `src/lib/auth/admin.ts` | **Crear** (Paso 2.1) |
| `src/hooks/useAuthState.ts` | **Crear** (Paso 2.3) |
