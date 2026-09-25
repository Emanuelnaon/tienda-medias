# Spec: Sprint 7 — Etiquetas de Inventario + Lista de Espera

**Feature:** 7.2 Etiquetas automáticas de inventario · 7.3 Captura de contacto en productos agotados  
**Sprint:** 7  
**Tier:** `basico` y `premium` (ambos tiers acceden)  
**SSOT de tipos:** `src/types/supabase.ts`

---

## 1. Contexto Técnico y Estructura Actual

- **`productos`**: Almacena el campo `stock` como el aggregate (suma) de todas sus variantes, el campo `created_at` y el campo `tenant_id` (de tipo `uuid` con clave foránea a `tenants.id`).
- **`producto_variantes`**: Almacena el stock por talle (`stock`, `talle`, `producto_id`, `tenant_id`).
- **Queries Actuales**: Las queries en la lista de catálogo, la página de inicio y sugerencias seleccionan `*, categorias:categorias(id,nombre,slug)`. No cargan el detalle de variantes para evitar sobrecarga en listados.
- **Ficha de Producto (`app/producto/[id]/page.tsx`)**: Carga el detalle completo con variantes para el render condicional y badges exactos per-variante.

---

## 2. Cambios de Base de Datos (Migraciones)

### 2.1. Tabla `lista_espera`
La tabla `lista_espera` almacena los registros de clientes interesados en productos agotados.

```sql
CREATE TABLE IF NOT EXISTS public.lista_espera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    variante_id UUID,
    email TEXT,
    telefono TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_lista_espera_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_lista_espera_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_lista_espera_variante FOREIGN KEY (variante_id) REFERENCES public.producto_variantes(id) ON DELETE SET NULL
);

ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;
```

### 2.2. Políticas de Seguridad (RLS)
- **Lectura/Borrado de Administrador**: Un admin autenticado solo puede gestionar registros de su propio tenant.
- **Inserción Anónima**: Los usuarios no autenticados pueden insertar registros siempre que correspondan a un tenant activo.

```sql
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
```

### 2.3. RPC `crear_lista_espera` (Security Definer)
Bypassa RLS para permitir que el cliente público de Next.js inserte de forma segura, validando que el tenant, el producto y la variante existan y estén activos.

```sql
CREATE OR REPLACE FUNCTION public.crear_lista_espera(
    p_tenant_id UUID,
    p_producto_id UUID,
    p_telefono TEXT,
    p_variante_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Validar que el tenant exista y esté activo
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id AND activo = true) THEN
        RAISE EXCEPTION 'Tenant inválido o inactivo';
    END IF;

    -- Validar que el producto exista y pertenezca al tenant correspondiente
    IF NOT EXISTS (SELECT 1 FROM public.productos WHERE id = p_producto_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Producto no encontrado para este tenant';
    END IF;

    -- Validar que la variante, si es provista, pertenezca al producto correcto
    IF p_variante_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.producto_variantes
        WHERE id = p_variante_id AND producto_id = p_producto_id
    ) THEN
        RAISE EXCEPTION 'Variante inválida para este producto';
    END IF;

    -- Insertar el registro y retornar el ID generado utilizando el nombre de columna correcto 'telefono'
    INSERT INTO public.lista_espera (tenant_id, producto_id, variante_id, email, telefono)
    VALUES (p_tenant_id, p_producto_id, p_variante_id, p_email, p_telefono)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_lista_espera(UUID, UUID, TEXT, UUID, TEXT) TO anon, authenticated;
```

---

## 3. Implementación Frontend (Next.js)

### 3.1. Utility `calcularEtiquetasInventario`
Lógica de visualización de etiquetas centralizada en `src/features/catalogo/utils/calcularEtiquetasInventario.ts`:
- **Agotado (Primary)**: Muestra "Agotado" en rojo si todas las variantes tienen `stock = 0` (o `stock = 0` aggregate si no hay variantes en la consulta).
- **Últimas Unidades (Primary)**: Muestra "¡Últimas unidades!" en naranja si no está agotado y al menos una variante tiene `stock <= 3`.
- **Nuevo (Secondary)**: Muestra "Nuevo" en verde si la diferencia de tiempo entre `created_at` y el tiempo actual es de 7 días o menos. Coexiste con "Últimas unidades" como badge secundario.
- **Restock**: Descartado para este sprint debido a la ausencia de histórico de stock en base de datos.

### 3.2. Formulario de Captura de Contacto (Zod + RHF)
Ubicado en `src/features/productos/components/FormularioListaEspera.tsx`:
- Renderiza campos `telefono` (requerido, mínimo 8 caracteres) y `email` (opcional, formato email válido).
- Muestra un selector opcional de talles agotados basados en las variantes provistas.
- Al enviar, invoca el Server Action `actionCrearListaEspera` que ejecuta de manera segura la RPC en Supabase.
- Al registrarse con éxito, limpia el formulario y notifica vía toast (`react-hot-toast`).

---

## 4. Criterios de Aceptación (AC)

### 4.1. Etiquetas de Inventario (AC)
- **7.2.1**: Un producto con stock 0 en todas las variantes debe mostrar el badge "Agotado" (rojo) en la tarjeta y en la ficha.
- **7.2.2**: Un producto con stock mayor a 0, pero donde al menos una variante tenga stock menor o igual a 3, debe mostrar el badge "Últimas unidades" (naranja, animado) en la tarjeta y ficha.
- **7.2.3**: Un producto con `created_at` menor o igual a 7 días debe mostrar el badge "Nuevo" (verde).
- **7.2.4**: Si un producto es nuevo y tiene bajo stock, deben coexistir ambos badges sin solapamiento (organizados de manera flexible con flexbox).
- **7.2.5**: El badge "Agotado" tiene prioridad de visualización y no muestra "Últimas unidades" en el slot primario.

### 4.2. Lista de Espera (AC)
- **7.3.1**: El formulario inline debe renderizarse en `app/producto/[id]/page.tsx` en reemplazo del selector de talles normales de compra, únicamente cuando el producto esté completamente agotado.
- **7.3.2**: La validación Zod de teléfono debe requerir al menos 8 dígitos.
- **7.3.3**: La validación Zod de email debe ser opcional, pero si se ingresa un valor, debe validar el formato de dirección de correo electrónico.
- **7.3.4**: El formulario debe permitir opcionalmente seleccionar un talle de entre los agotados antes del envío.
- **7.3.5**: La inserción se debe realizar de manera exitosa llamando a la RPC, registrando el contacto en la tabla `lista_espera`.
- **7.3.6**: Los administradores autenticados de un tenant deben tener acceso exclusivo para ver las solicitudes de su propio tenant mediante RLS.
