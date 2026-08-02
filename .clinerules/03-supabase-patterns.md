# Reglas y Patrones de Supabase (TypeScript + RLS)

Esta es una directiva estricta para el uso de Supabase en este proyecto. Debes seguir estos patrones sin excepción en cada consulta, migración o componente que interactúe con la base de datos.

## 1. Tipado Estricto (TypeScript)
- NUNCA uses `any` o tipado implícito para las respuestas o clientes de Supabase.
- SIEMPRE importa el esquema autogenerado: `import type { Database } from '@/types/supabase'`.
- Tipá el cliente explícitamente usando el genérico: `createClient<Database>(...)`.
- Para extraer tipos individuales de tablas, usa siempre la ruta completa de la interfaz:
  `type TablaEjemploRow = Database['public']['Tables']['nombre_tabla']['Row']`

## 2. Row Level Security (RLS) - Regla Inquebrantable
- NINGUNA tabla debe crearse sin su política de seguridad. Toda nueva migración DDL debe incluir `ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;`.
- NUNCA crees políticas "ALL" genéricas. Debes crear políticas granulares e independientes para `SELECT`, `INSERT`, `UPDATE` y `DELETE`.
- Toda tabla que maneje datos de usuario debe tener una columna `user_id` (UUID) referenciando a `auth.users`.
- Toda política debe validar la identidad del usuario contra `auth.uid()`.

## 3. Patrón de Data Fetching (Next.js Server Actions / Componentes)
- NUNCA asumas que una consulta a Supabase fue exitosa. SIEMPRE maneja el objeto `error` inmediatamente después de la llamada.
- No uses `try/catch` para envolver la llamada de Supabase a menos que hagas procesamiento adicional; maneja la tupla nativa `{ data, error }`.
- Devuelve los datos tipados de forma predecible o lanza un error descriptivo.

## 4. Mutaciones y Relaciones
- Para inserciones o actualizaciones, SIEMPRE devuelve el registro modificado usando `.select().single()` si el UI necesita actualizar el estado inmediatamente.
- Cuando consultes tablas relacionadas (Foreign Keys), usa la sintaxis de join de Supabase y define la interfaz de respuesta si la inferencia de TypeScript falla.