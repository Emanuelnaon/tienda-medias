# 🎨 SKILL: Sistema de Diseño y Refactor Seguro de Componentes (Executor)

**Descripción:** Reglas obligatorias para crear o modificar cualquier componente visual (UI) en el proyecto. Se activa con el trigger `[UI_GEN]` o `[DESIGN_REFACTOR]` desde `AGENTS.md`.

---

## 1. SOLID aplicado a componentes React (no es solo para clases)

- **Single Responsibility:** un componente = una responsabilidad visual. Si `ProductCard` empieza a manejar lógica de carrito, fetch de datos Y presentación al mismo tiempo, se divide: `ProductCard` (presentación pura) + `useProductCardActions` (hook con la lógica) + quien lo llama decide qué pasarle.
- **Open/Closed:** un componente compartido (usado en 2+ features) se extiende agregando **props opcionales con default** o **variantes** (`variant="compact" | "full"`), nunca editando su lógica interna para forzar un caso de uso nuevo de un solo lugar que lo consume.
- **Interface Segregation:** si una prop de `ProductCard` solo la usa 1 de 5 lugares que lo consumen, esa prop no pertenece al componente base — se resuelve con composición (slot/children) o con un wrapper específico de esa feature.
- **Dependency Inversion:** un componente de UI reutilizable NUNCA hace `fetch` ni llama a Supabase directamente adentro suyo. Recibe los datos ya resueltos vía props, tipados desde el SSOT (`src/types/supabase.ts`). Quien orquesta la carga de datos es el componente de feature o el server component que lo envuelve, no el componente visual.

## 2. Feature-based: dónde vive cada componente

- `src/components/ui/` → **solo** primitivos de diseño reutilizables en cualquier feature: `Button`, `Card`, `Input`, `Badge`. Cero lógica de negocio, cero conocimiento de qué es un "producto" o un "tenant".
- `src/features/{nombre-feature}/components/` → todo componente que conoce el dominio (`ProductCard`, `OrderSummary`, `TenantBadge`). Si un componente de acá necesita usarse en otra feature, **no se mueve a `ui/` a la fuerza** — se evalúa si en realidad es un primitivo (sin lógica de dominio) o si la feature debe exponerlo explícitamente.
- Antes de crear un componente nuevo: preguntar primero si ya existe algo parecido en `src/components/ui/` que se pueda extender con una variante, en vez de duplicar.

## 3. Mobile-first (regla de oro ya definida en AGENTS.md, con ejemplos concretos)

- Toda clase de Tailwind sin prefijo es la versión mobile. Prohibido escribir primero el layout desktop y "arreglarlo" después con `sm:`/`md:` hacia abajo.
- Nunca usar valores de píxeles sueltos (`w-[327px]`) fuera de la escala de Tailwind, salvo con justificación explícita en comentario. Usar la escala del theme (`w-full`, `max-w-sm`, etc.) para mantener consistencia entre componentes.
- Todo componente táctil (botón, card clickeable) respeta un área mínima de touch target razonable — no reducir el padding solo para "que entre" en mobile.

## 4. Data-first: el tipo manda, no el componente

- Ningún componente de feature acepta `any` ni una prop con forma inventada ad-hoc. La forma de los datos que recibe un componente se deriva de `src/types/supabase.ts` (directamente o vía un tipo mapeado/View Model definido en la feature, ej. `ProductCardViewModel`).
- Si el dato que necesita el componente no existe tal cual en el SSOT, se define un tipo de transformación explícito en la capa de feature (`mapProductToCardViewModel()`), nunca se fuerza el tipo del SSOT con `as any` o `@ts-ignore`.

## 5. Protocolo de Refactor Seguro (la parte que evita romper cosas)

Antes de modificar la firma de props de CUALQUIER componente en `src/components/ui/` o de un componente de feature usado en más de un lugar:

1. **Buscar todos los call-sites primero.** Grep/búsqueda de todos los usos del componente en el proyecto antes de tocar una sola línea.
2. **Clasificar el cambio:**
   - *Aditivo* (prop nueva opcional con default): seguro, no requiere tocar call-sites existentes.
   - *Breaking* (renombrar prop, cambiar tipo, quitar prop): requiere actualizar TODOS los call-sites en la misma tarea — nunca dejar un call-site roto "para después".
3. **Nunca declarar la tarea terminada si quedó un call-site sin actualizar**, aunque TypeScript no tire error (puede no tirarlo si la prop vieja quedó como opcional por error).
4. Si el componente está en `src/components/ui/` (primitivo compartido), tratar su firma de props como un contrato público: cualquier cambio breaking se informa explícitamente al usuario antes de aplicarlo, no se aplica en silencio dentro de una tarea que pedía otra cosa.

## 6. Protocolo de Cambio Puntual de Estilo (workflow inspector → código)

Cuando el usuario pide corregir un valor visual específico que encontró con el inspector del navegador (color, espaciado, tamaño puntual):

1. **Identificar si la clase mencionada es un token con nombre** (ej. `bg-primary`, `text-brand`, definido en `tailwind.config.ts` o en variables CSS de `globals.css`) **o una utilidad directa** (ej. `bg-red-500`, `p-4`).
2. **Si es un token con nombre:** antes de cambiar su definición en el archivo de configuración, buscar cuántos componentes lo usan. Si son varios, avisar al usuario del alcance ("este token lo usan 12 componentes, ¿confirmás el cambio global o preferís una excepción solo acá?") antes de aplicar.
3. **Si es una utilidad directa:** el cambio es local a ese componente/línea — aplicar únicamente ahí, sin extender el cambio a otros archivos aunque tengan una clase visualmente similar.
4. **Nunca ampliar el alcance de la tarea por iniciativa propia.** Si la instrucción es "cambiá este color en este componente", no se reorganiza el archivo, no se renombran clases vecinas, no se "aprovecha" para limpiar otra cosa.

## 7. Qué hacer si no hay certeza de estilo

Si no existe una decisión de diseño previa para un caso (ej. "¿cómo se ve un estado de error en una card?"), **no inventar un estilo nuevo sin avisar**. Proponer 1-2 opciones breves basadas en los patrones ya existentes en `src/components/ui/`, y esperar confirmación antes de aplicar en múltiples lugares.
