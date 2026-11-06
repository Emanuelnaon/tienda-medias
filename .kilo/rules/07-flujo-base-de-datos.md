# Flujo de cambios en la base de datos
- Consultar el estado real por MCP (solo lectura) antes de proponer cambios.
- Todo DDL se muestra completo y se espera confirmación explícita
  antes de ejecutarlo. Nunca ejecutar por iniciativa propia.
- Cambio de firma de función: DROP de la anterior primero, nunca
  CREATE OR REPLACE con otros parámetros.
- Guards de tenant: exigir auth.uid() IS NOT NULL e is_webmaster()
  explícito. NULL nunca significa webmaster.