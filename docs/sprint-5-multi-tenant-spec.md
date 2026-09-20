# Spec: Sprint 5 - Fundación Multi-Tenant y Base de Datos (Data-First)

## 1. Objetivo General
Completar la infraestructura de datos en Supabase para soportar múltiples tiendas operando bajo la misma instancia. Se prioriza el aislamiento de datos completando la inyección del `tenant_id` y configurando la seguridad (RLS) en todas las tablas transaccionales.

## 2. Arquitectura de Base de Datos (SSOT)
Actualmente `pedidos` y `categorias` ya poseen la columna `tenant_id` (tipo text). Debemos estandarizar el resto del esquema.

### 2.1. Inyección de `tenant_id` (Migración SQL)
Se debe crear un script SQL (migración) para agregar la columna `tenant_id text NOT NULL DEFAULT 'default'::text` a las siguientes tablas:
*   `productos`
*   `producto_variantes`
*   `clientes`
*   `pedidos_items` (Opcional por redundancia, pero recomendado para RLS simple).
*   `admin_users` (Permitirá saber a qué tenant pertenece cada administrador).

## 3. Políticas de Seguridad (Row Level Security - RLS)
Habilitar RLS (`ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;`) en TODAS las tablas mencionadas. 
Se deben crear políticas (`CREATE POLICY`) que garanticen:
*   **Lectura Pública:** Un usuario anónimo solo puede hacer `SELECT` en `productos`, `producto_variantes` y `categorias` donde el `tenant_id` coincida con el solicitado por el frontend.
*   **Operaciones Privadas:** Un administrador autenticado (verificado vía `auth.uid()`) solo puede hacer `SELECT`, `INSERT`, `UPDATE`, `DELETE` en registros cuyo `tenant_id` coincida con el `tenant_id` asignado a su perfil en `admin_users`.

## 4. Actualización de Funciones (Postgres RPC)
*   **`confirmar_venta_y_actualizar_crm`**: Se debe revisar el código interno de esta RPC para asegurar que, al descontar stock y sumar gastos al cliente, la consulta valide implícitamente o explícitamente el `tenant_id` del pedido.

## 5. Implementación en Frontend (Next.js)
*   Asegurar que en la creación de nuevos registros (ej. `productosActions.ts`), el sistema inyecte automáticamente el `tenant_id` del administrador activo para no depender del valor `'default'`.