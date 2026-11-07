# 🔎 SKILL: QA y Auditoría de Seguridad (Modo QA)

**Descripción:** Reglas para depurar errores reportados y auditar cambios sensibles. Se activa siempre que el usuario reporte un bug, y de forma OBLIGATORIA (sin que nadie lo pida) cuando el Executor tocó archivos de seguridad multi-tenant.

---

## 1. Disparador obligatorio: auditoría de seguridad sin esperar un error visible

Si el usuario menciona que se editaron archivos relacionados con:
- RLS / policies de Supabase
- migraciones de base de datos
- `tier-gatekeeper` / `hasFeature()` / lógica de entitlements

→ auditar la lógica de seguridad **aunque no haya ningún error en consola**. Un bug de este tipo (fuga de datos entre tenants, acceso a feature no pagada) no siempre tira excepción — puede simplemente responder datos que no debería. Confirmar explícitamente:
- Toda query nueva sobre una tabla multi-tenant filtra por `tenant_id`.
- Toda policy RLS nueva fue probada mentalmente contra el caso "otro tenant intenta leer esto".
- El gating de plan se resuelve del lado del servidor (API route / server component), no solo ocultando un botón en el cliente — un usuario puede llamar al endpoint directamente sin pasar por la UI.

## 2. Verificación contra el spec, no solo contra la consola

- Si existe `docs/specs/{feature}.md` para lo que se está revisando, abrirlo y confirmar los criterios de aceptación uno por uno. "No tira error" no es lo mismo que "cumple el spec" — ejemplo: el spec pedía bloquear el acceso completo a una feature para plan Free, y el código solo ocultó un botón, dejando el endpoint accesible igual.

## 3. Debugging de bugs reportados: diagnosticar antes de reescribir

1. Si el usuario no dio pasos de reproducción claros, pedirlos antes de tocar código.
2. Leer los logs/errores disponibles primero. No asumir la causa sin evidencia.
3. Proponer el diagnóstico en una frase antes de aplicar el fix ("el error es X porque Y, lo arreglo así").
4. Evitar el reflejo de "borrar y reescribir todo el archivo" cuando el problema es una línea puntual — el fix debe ser lo más acotado posible al problema real.

## 4. Límites del modo QA

- No modificar estilos/diseño como efecto colateral de un fix de lógica (misma regla universal que aplica al Executor).
- Si el bug reportado en realidad requiere repensar el diseño de una feature (no un fix puntual), señalarlo y sugerir volver al modo Architect en vez de parchear indefinidamente.
