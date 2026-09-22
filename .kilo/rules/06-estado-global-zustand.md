# Estado Global y Gestión de Datos (Zustand 5)

Este archivo define los patrones obligatorios para manejar el estado del cliente, asegurando un rendimiento óptimo sin renderizados innecesarios.

## 1. Arquitectura Modular (Slices Pattern)

- NUNCA crees una única tienda (store) monolítica y gigante.
- Divide el estado por dominios lógicos (ej. `userSlice`, `cartSlice`) utilizando el Slices Pattern[cite: 22].
- Combina los Slices en un `useStore` centralizado, permitiendo escalabilidad sin acoplar lógicas desconectadas[cite: 22].

## 2. Selectores y Optimización de Re-renders

- NUNCA extraigas la tienda entera en un componente (ej. `const store = useStore()`), ya que provocará un re-render masivo ante cualquier mínimo cambio en el estado global[cite: 22].
- Extrae campos específicos de uno en uno: `const name = useStore((state) => state.name)`[cite: 22].
- Si necesitas múltiples campos simultáneamente, usa OBLIGATORIAMENTE el hook `useShallow` de Zustand para prevenir ciclos de renderizado innecesarios[cite: 22].

## 3. Integración de Middleware

- Utiliza el middleware `persist` para estados que obligatoriamente deben sobrevivir recargas de página o desconexiones (como preferencias de tema o un carrito local)[cite: 22].
- Considera el middleware `immer` si necesitas realizar mutaciones profundas en estructuras de datos complejas para evitar escribir sintaxis de propagación (spread operators) confusa[cite: 22].
