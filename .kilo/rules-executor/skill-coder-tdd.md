# ⚙️ SKILL: Ejecución de Código con Disciplina de Spec (Executor)

**Descripción:** Reglas para escribir código de features a partir de una especificación, con un enfoque de TDD *pragmático* — no ceremonial. Se activa en cualquier tarea de implementación de lógica de negocio o backend.

---

## 1. Leer el spec antes de escribir una línea

- Si existe `docs/specs/{feature}.md` para la tarea pedida, leerlo completo antes de generar código. Los criterios de aceptación de ese archivo son el contrato a cumplir.
- Si NO existe spec para la tarea, avisar al usuario explícitamente: *"No encontré un spec en docs/specs/ para esto, voy a implementar directo — si es una feature grande, puede convenir pasar primero por el modo Architect."* No bloquear la tarea, pero no fingir que hay un contrato cuando no lo hay.

## 2. TDD ligero: dónde vale la pena y dónde no

No se aplica TDD estricto (test-first para todo) porque para un desarrollador solo, forzarlo en cada componente visual es ceremonia sin retorno. Se aplica selectivamente:

- **SÍ escribir un test antes del código** para: funciones puras de lógica de negocio (cálculos, formateadores, validaciones), y en particular cualquier función que resuelva **entitlements/feature-gating** (`hasFeature()`, checks de plan) o **filtros multi-tenant**. Ahí el costo de un bug es alto y el test es barato.
- **NO es obligatorio escribir test primero** para componentes de UI puros o para scaffolding inicial de una pantalla. La red de seguridad ahí es el protocolo de refactor de `skill-design-system.md`, no una suite de tests.

## 3. Respetar los límites de otras reglas mientras se codea

- No modificar `className`, tokens de Tailwind ni archivos CSS como efecto colateral de una tarea de lógica (regla universal de `AGENTS.md`).
- No inventar campos o tablas que no existan en `src/types/supabase.ts`. Si la tarea los necesita y no existen, señalarlo en vez de improvisar un tipo.
- Toda feature nueva que dependa del plan de suscripción del tenant pasa por la capa de entitlements centralizada (`hasFeature()`), nunca por un `if (tenant.plan === ...)` disperso.

## 4. Al terminar la tarea

Cerrar la respuesta con un chequeo explícito y corto contra el spec (si existía uno):

```
Criterios de aceptación:
- [x] Criterio 1 — cumplido
- [x] Criterio 2 — cumplido
- [ ] Criterio 3 — no lo cubrí porque [razón]
```

Esto reemplaza la ceremonia de "aprobación" formal: es un self-report rápido para que el usuario (o el modo QA) sepa de un vistazo qué quedó pendiente, sin tener que releer todo el código generado.
