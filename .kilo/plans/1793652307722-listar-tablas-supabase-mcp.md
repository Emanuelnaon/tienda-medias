# Plan: Listar tablas del schema public via Supabase MCP

## Objetivo
Listar las tablas del schema `public` del proyecto Supabase usando el MCP configurado.

## Bloqueador actual
El MCP devuelve `Unauthorized`: falta `SUPABASE_ACCESS_TOKEN` en el entorno del proceso que inicia VS Code/Kilo. La config en `.vscode/mcp.json` usa `Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}`.

## Pasos
1. Configurar `SUPABASE_ACCESS_TOKEN` en el entorno del proceso que inicia VS Code/Kilo (no en `.env.local`, el MCP no lo lee).
2. Reiniciar VS Code/Kilo.
3. Ejecutar `supabase_list_projects` para obtener el `project_id`.
4. Ejecutar `supabase_list_tables` con `project_id` y `schemas: ["public"]`.

## Validación
- La llamada a `supabase_list_projects` devuelve proyectos sin error de autorización.
- `supabase_list_tables` devuelve la lista de tablas del schema `public`.

## Fuera de alcance
- Cambios en código o migraciones.
