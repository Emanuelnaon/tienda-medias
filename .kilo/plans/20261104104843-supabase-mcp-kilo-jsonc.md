# Plan: Configurar Supabase MCP en `.kilo/kilo.jsonc`

## Contexto

- `.kilo/kilo.jsonc` tiene `"mcp": {}` vacío.
- `.vscode/mcp.json` tiene `"servers": {}` vacío y **Kilo no lo lee** (solo carga `kilo.jsonc` global o `.kilo/kilo.jsonc`).
- El esquema de Kilo para MCP remoto (`Mcp.RemoteConfigEncoded`) requiere `type: "remote"`, `url`, y acepta `headers` para enviar `Authorization: Bearer <token>`.
- MCP de Supabase: `https://mcp.supabase.com/mcp`, proyecto `adauxoedgfvaadkvvifu`, auth vía bearer token `SUPABASE_ACCESS_TOKEN`.
- Sesiones previas intentaron configurar `.vscode/mcp.json` sin éxito; el bloqueador era que el token no llegaba en los headers HTTP.

## Cambio propuesto

Editar `.kilo/kilo.jsonc`, sección `mcp.servers`, agregando la entrada `supabase`:

```json
"mcp": {
  "servers": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=adauxoedgfvaadkvvifu&read_only=true",
      "headers": {
        "Authorization": "Bearer {{SUPABASE_ACCESS_TOKEN}}"
      },
      "enabled": true
    }
  }
}
```

Notas:
- `project_ref` y `read_only=true` delimitan el servidor al proyecto `adauxoedgfvaadkvvifu` en modo solo lectura, como usa el dashboard de Supabase.
- `{{SUPABASE_ACCESS_TOKEN}}` se resuelve del entorno del proceso que inicia Kilo/VS Code (no se hardcodea el token).
- Si Kilo no interpola `{{VAR}}` en `headers`, usar el token literal `Bearer sbp_...` temporalmente o definir `SUPABASE_ACCESS_TOKEN` en el entorno antes de iniciar Kilo.

## Pasos de implementación

1. Editar `.kilo/kilo.jsonc` agregando `mcp.servers.supabase` como se muestra arriba.
2. Verificar que `SUPABASE_ACCESS_TOKEN` esté definido en el entorno del proceso de Kilo/VS Code (no en `.env.local`; el MCP de Supabase no lo lee).
3. Reiniciar Kilo / VS Code para que levante el servidor MCP con la nueva config.
4. Listar tablas para confirmar conexión (ej. inspeccionar schema o invocar listado de tablas del schema `public`).

## Validación

- Kilo arranca sin errores de configuración de MCP.
- El servidor `supabase` aparece conectado (no `Unauthorized`).
- Se puede listar el schema `public` del proyecto `adauxoedgfvaadkvvifu` (tablas esperadas: admin_users, categoria, clientes, delivery_tracking, lista_espera, pedidos, pedidos_historial, pedidos_items, plan_features, producto_variantes, productos, tenants, ...).

## Rollback

- Revertir `.kilo/kilo.jsonc` a `"mcp": {}` (estado previo) y reiniciar Kilo.

## Fuera de alcance

- Cambios de código, migraciones o RLS.
- Configurar `.vscode/mcp.json` (Kilo no lo usa).
