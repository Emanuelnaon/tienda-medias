# Plan: Conectar Supabase MCP y listar tablas

## Problema
El MCP de Supabase (transporte HTTP a `mcp.supabase.com`) retorna `Unauthorized` aunque `SUPABASE_ACCESS_TOKEN` está definido en Windows y VS Code/Kilo se reinició. El servidor HTTP no hereda automáticamente la variable de entorno del sistema; requiere el token en los headers de la petición.

## Solución
Actualizar `.vscode/mcp.json` para incluir el header `Authorization: Bearer <token>` en la configuración del servidor Supabase, o bien cambiar a transporte stdio usando la CLI de Supabase con `--access-token`.

### Opción A (recomendada): headers en mcp.json
Agregar a la entrada `supabase`:
```json
"headers": {
  "Authorization": "Bearer ${env:SUPABASE_ACCESS_TOKEN}"
}
```
o hardcodear el token (menos seguro, solo para dev).

### Opción B: stdio con CLI
```json
"supabase": {
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase", "--access-token", "${env:SUPABASE_ACCESS_TOKEN}", "--project-ref", "adauxoedgfvaadkvvifu"]
}
```

## Pasos
1. Editar `.vscode/mcp.json` con la opción elegida.
2. Reiniciar VS Code/Kilo para que el MCP server se reinicie con la nueva config.
3. Invocar `supabase_list_tables` con `project_id = adauxoedgfvaadkvvifu`.
4. Si falla, verificar que la variable esté disponible en el proceso (ej. `echo %SUPABASE_ACCESS_TOKEN%` en CMD).

## Validación
- `list_tables` retorna lista de tablas del schema `public`.
- No aparece error `Unauthorized`.

## Estado actual (reintento fallido)
Se reintentó `supabase_list_tables` después de que el usuario confirmó tener la Opción A configurada sin `${env:}`. Sigue retornando `Unauthorized`. El servidor HTTP de MCP no hereda la variable de entorno del sistema automáticamente; el token debe estar presente en los headers de la petición HTTP. Es necesario editar `.vscode/mcp.json` para agregar el header `Authorization: Bearer <token>` (hardcodeado o vía env) y reiniciar VS Code/Kilo. Requiere agente con permisos de edición.

## Riesgos
- Si el token expiró o no tiene scope suficiente, seguirá fallando → regenerar token en Supabase dashboard.
- Hardcodear el token en mcp.json expone credenciales → preferir `${env:...}`.
