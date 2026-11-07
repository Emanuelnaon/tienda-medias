# Reglas y Patrones de Supabase (Next.js 15 + RLS + MCP)

Esta es una directiva estricta para el uso de Supabase. Debes seguir estos patrones sin excepción en cada consulta, migración o componente.

## 1. Tipado Estricto (TypeScript) y Validación MCP
- NUNCA uses `any` o tipado implícito para las respuestas o clientes de Supabase[cite: 16].
- SIEMPRE importa el esquema autogenerado: `import type { Database } from '@/types/supabase'`[cite: 16].
- Tipá el cliente explícitamente usando el genérico: `createClient<Database>(...)`[cite: 16].
- **Anti-Alucinación:** Si el esquema en `types/supabase.ts` está desactualizado o es ambiguo, TIENES PROHIBIDO inventar la estructura. Debes solicitar autorización al usuario para ejecutar la herramienta MCP de Supabase y leer el esquema real.

## 2. Row Level Security (RLS) - Regla Inquebrantable
- NINGUNA tabla debe crearse sin su política de seguridad[cite: 16]. Toda nueva migración DDL debe incluir `ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;`[cite: 16].
- NUNCA crees políticas "ALL" genéricas[cite: 16]. Crea políticas granulares independientes para `SELECT`, `INSERT`, `UPDATE` y `DELETE`[cite: 16].
- Toda tabla vinculada a usuarios debe tener una columna `user_id` (UUID) referenciando a `auth.users`[cite: 16]. Toda política debe validar la identidad contra `auth.uid()`[cite: 16].

## 3. Patrón de Data Fetching (Next.js 15)
- **Cookies Asíncronas:** Al instanciar el cliente en el servidor, recuerda que `cookies()` exige `await`.
- NUNCA asumas que una consulta a Supabase fue exitosa[cite: 16]. SIEMPRE maneja el objeto `error` inmediatamente después de la llamada[cite: 16].
- No uses `try/catch` para envolver la llamada de Supabase a menos que hagas procesamiento adicional complejo; maneja la tupla nativa `{ data, error }`[cite: 16].

## 4. Mutaciones y Relaciones
- Para inserciones o actualizaciones, SIEMPRE devuelve el registro modificado usando `.select().single()`[cite: 16].
- Cuando consultes tablas relacionadas, usa la sintaxis de join de Supabase y define la interfaz de respuesta si la inferencia falla[cite: 16].