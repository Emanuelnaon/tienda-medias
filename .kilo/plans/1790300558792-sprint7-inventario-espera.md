# Plan de Implementación: Sprint 7 — Etiquetas de Inventario y Lista de Espera

Este plan detalla los cambios necesarios para implementar las funcionalidades **7.2 (Etiquetas automáticas de inventario)** y **7.3 (Captura de contacto en productos agotados)** en el proyecto Tienda de Medias.

El archivo final de especificación debe ser guardado por el agente ejecutor en `docs/specs/sprint7-inventario-espera.md`. Como agente planificador con permisos restringidos de escritura, este plan de implementación se guarda en `.kilo/plans/1790300558792-sprint7-inventario-espera.md`.

---

## 1. Contexto Técnico y Análisis

### 1.1. Modelo de Datos Existente y Queries
Tras inspeccionar el código fuente (`src/types/supabase.ts`, `app/catalogo/page.tsx`, `app/producto/[id]/page.tsx`, `src/features/productos/api/queries.ts`), se identificaron las siguientes condiciones:
- **`productos`**: Almacena el campo `stock` como el aggregate (suma) de todas sus variantes, el campo `created_at` y el campo `tenant_id` (de tipo `text` con valor por defecto `'default'`).
- **`producto_variantes`**: Almacena el stock por talle (`stock`, `talle`, `producto_id`, `tenant_id`).
- **Queries Actuales**: Las queries públicas en el catálogo, la búsqueda y las sugerencias seleccionan `*, categorias:categorias(id,nombre,slug)`, por lo que **no cargan el detalle de variantes**.

### 1.2. Decisiones de Arquitectura

#### D1: Lógica de Etiquetas (Catálogo vs. Ficha de Producto)
- **Catálogo (`TarjetaProducto`)**: Se utilizará el campo aggregate `productos.stock` ya provisto en las queries de lista para evitar joins redundantes de alta sobrecarga (N+1 conceptual).
  - `stock === 0` indica que todas las variantes están agotadas (Agotado).
  - `stock > 0 && stock <= 3` indica que al menos una variante tiene stock bajo (Últimas unidades).
- **Ficha de Producto (`app/producto/[id]/page.tsx`)**: Se modificará el select para realizar el join mínimo: `select('*, categorias:categorias(id,nombre,slug), producto_variantes(id,talle,stock)')` para contar con precisión de variantes para los badges y el disparador de la lista de espera.

#### D2: Detección de "Restock"
- **Decisión**: Se descarta para este sprint debido a que no existe una tabla de auditoría/movimientos de stock y el requisito prohíbe explícitamente agregar columnas adicionales para el badge (salvo excepciones justificadas). Se prioriza mantener el desarrollo simple y libre de over-engineering.

#### D3: Tipo de `tenant_id`
- **Decisión**: La nueva tabla `lista_espera` utilizará `tenant_id text NOT NULL DEFAULT 'default'::text` para mantener estricta consistencia con el resto de las tablas del proyecto (`productos`, `clientes`, etc.), ya que el tenant `'default'` se almacena como texto y no como UUID en el esquema actual de base de datos.

---

## 2. Cambios de Base de Datos (Migraciones)

Crear un archivo de migración en `supabase/migrations/20260924_create_lista_espera.sql` con el siguiente contenido:

```sql
-- 1. Crear tabla lista_espera
CREATE TABLE IF NOT EXISTS public.lista_espera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL DEFAULT 'default'::text,
    producto_id UUID NOT NULL,
    variante_id UUID,
    email TEXT,
    telefono TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_lista_espera_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_lista_espera_variante FOREIGN KEY (variante_id) REFERENCES public.producto_variantes(id) ON DELETE SET NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad (RLS)
-- Nota: La inserción va por RPC SECURITY DEFINER, pero se define la política de inserción pública por cumplimiento normativo.
CREATE POLICY "anon_insert_lista_espera" ON public.lista_espera
    FOR INSERT
    TO anon
    WITH CHECK (
        tenant_id IN (SELECT id FROM public.tenants WHERE activo = true)
    );

CREATE POLICY "admin_select_lista_espera" ON public.lista_espera
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = lista_espera.tenant_id
    ));

CREATE POLICY "admin_delete_lista_espera" ON public.lista_espera
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = lista_espera.tenant_id
    ));

-- 4. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_lista_espera_tenant_id ON public.lista_espera(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_producto_id ON public.lista_espera(producto_id);

-- 5. RPC Security Definer para inserción segura desde el cliente público
CREATE OR REPLACE FUNCTION public.crear_lista_espera(
    p_tenant_id TEXT,
    p_producto_id UUID,
    p_variante_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_telefono TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Validar que el tenant esté activo
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id AND activo = true) THEN
        RAISE EXCEPTION 'Tenant inválido o inactivo';
    END IF;

    -- Validar que el producto pertenezca al tenant
    IF NOT EXISTS (SELECT 1 FROM public.productos WHERE id = p_producto_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Producto no encontrado en el tenant';
    END IF;

    -- Validar variante si se proporciona
    IF p_variante_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.producto_variantes 
        WHERE id = p_variante_id AND producto_id = p_producto_id
    ) THEN
        RAISE EXCEPTION 'Variante inválida para este producto';
    END IF;

    -- Insertar en lista_espera
    INSERT INTO public.lista_espera (tenant_id, producto_id, variante_id, email, p_telefono)
    VALUES (p_tenant_id, p_producto_id, p_variante_id, p_email, p_telefono)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_lista_espera TO anon, authenticated;
```

---

## 3. Implementación en Frontend

### 3.1. Mapeo de Etiquetas (Utility)
Crear el archivo `src/features/catalogo/utils/calcularEtiquetasInventario.ts`:
- Define el tipo `type TipoEtiqueta = 'agotado' | 'ultimas_unidades' | 'nuevo'`.
- Expone la función `calcularEtiquetasInventario(producto: ProductoParaEtiquetas): { primary: TipoEtiqueta | null; secondary: TipoEtiqueta | null }`.
- "Agotado" tiene prioridad sobre "Últimas unidades".
- "Nuevo" se verifica comparando `created_at` contra un margen de 7 días, y puede coexistir con "Últimas unidades" como badge secundario.
- El umbral para "Últimas unidades" se reduce de `< 5` a `<= 3` para cumplir la especificación del sprint.

### 3.2. Componente Visual de Etiquetas
Crear `src/components/ui/EtiquetaInventario.tsx`:
- Renderiza el badge con el estilo visual correspondiente (Rojo para Agotado, Naranja para Últimas unidades, Verde para Nuevo).
- Reemplaza el markup actual de badges en `TarjetaProducto.tsx` y `app/producto/[id]/page.tsx`.

### 3.3. Formulario de Lista de Espera (Zod + RHF)
Crear `src/features/productos/components/FormularioListaEspera.tsx`:
- Componente de tipo `'use client'`.
- Schema de validación Zod:
  - `email`: opcional (pero debe ser un email válido si se ingresa).
  - `telefono`: requerido (mínimo 8 caracteres, tipo `tel`).
  - `variante_id`: UUID opcional (el formulario puede incluir un dropdown opcional con los talles agotados, permitiendo al cliente elegir un talle o dejarlo sin especificar).
- Llama al Server Action `actionCrearListaEspera` al enviarse.

### 3.4. Server Action
Crear `src/features/productos/actions/listaEsperaActions.ts`:
- Marca `'use server'`.
- Obtiene un cliente público con `createSupabasePublicClient()`.
- Llama al RPC `crear_lista_espera` pasando los parámetros.
- Devuelve `{ success: true, mensaje: '...' }` o maneja errores de base de datos de manera controlada.

### 3.5. Modificación en Ficha de Producto (`app/producto/[id]/page.tsx`)
- Modificar el select de supabase para incluir `producto_variantes:producto_variantes(id,talle,stock)`.
- Determinar si el producto está completamente agotado (suma de stock de variantes === 0 o variantes vacías con stock 0).
- Si está agotado, ocultar/reemplazar el componente `SelectorProducto` y renderizar `FormularioListaEspera`.
- Reemplazar el indicador inline antiguo de "Últimas unidades" con `EtiquetaInventario`.

### 3.6. Modificación en Catálogo (`TarjetaProducto.tsx`)
- Reemplazar la función inline `renderEtiqueta()` por la nueva utility `calcularEtiquetasInventario`.
- Mostrar adecuadamente el badge primario y el badge secundario (coexistentes si el producto es Nuevo + Últimas unidades).

---

## 4. Plan de Verificación y Pruebas

### 4.1. Verificación del Linter y Compilación
Ejecutar los siguientes comandos en la terminal para asegurar que no hay regresiones ni errores de tipos:
```bash
npm run type-check
npm run lint
```

### 4.2. Pruebas Unitarias / Funcionales
1. **Caso 1: Producto con Stock Agotado**
   - Asegurarse de que muestre el badge "Agotado" en rojo.
   - En la ficha del producto, el botón de "Agregar al carrito" no debe aparecer y debe mostrarse el formulario inline de Lista de Espera.
2. **Caso 2: Formulario de Lista de Espera**
   - Ingresar un teléfono inválido o vacío → debe mostrar error de validación en tiempo de ejecución.
   - Ingresar un email con formato incorrecto → debe mostrar error de validación.
   - Enviar formulario válido → debe registrar con éxito el contacto en la tabla `lista_espera` de Supabase y mostrar toast de éxito.
3. **Caso 3: Badge "Últimas Unidades"**
   - Configurar un producto con variante de stock = 2. Debe mostrar el badge de "Últimas unidades" en naranja (y con animación pulse sutil).
4. **Caso 4: Badge "Nuevo"**
   - Configurar un producto con `created_at` dentro de los últimos 7 días. Debe mostrar el badge de "Nuevo" en verde. Si además tiene stock <= 3, deben coexistir ambos badges (Últimas unidades y Nuevo).

---

## 5. Riesgos Identificados

1. **Regeneración de Tipos (SSOT)**: Al agregar la tabla `lista_espera` y el campo `tenant_id` a `producto_variantes` en base de datos, el archivo `src/types/supabase.ts` quedará desactualizado.
   *Mitigación*: Se debe ejecutar obligatoriamente `npx supabase gen types` tras aplicar la migración en base de datos y antes de compilar el frontend.
2. **Impacto en Favoritos**: Los productos guardados en favoritos no contienen las variantes detalladas.
   *Mitigación*: La utility de cálculo de etiquetas se diseña de manera defensiva para soportar la ausencia de la propiedad `producto_variantes`, cayendo en reversión limpia sobre el campo aggregate `productos.stock`.
