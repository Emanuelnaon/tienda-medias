# Convenciones Core del Stack (Next.js 15+ + Tailwind v4 + TS)

## 1. TypeScript y Tipado Estricto

- **Flat Interfaces:** Usa un solo nivel de profundidad. Si un objeto está anidado, extráelo a una interfaz dedicada para mantener el código limpio y reutilizable[cite: 22].
- **Const Types Pattern:** Para valores fijos o estados, crea primero un objeto inmutable (`const STATUS = {...} as const`) y extrae el tipo (`type Status = typeof STATUS[keyof typeof STATUS]`) en lugar de usar uniones directas estáticas[cite: 22].
- Prohibido el uso de `any`[cite: 23]. Si la estructura de datos es incierta, utiliza `unknown` e implementa _type guards_ para validar la información en tiempo de ejecución[cite: 23].
- Exporta interfaces desde `types/index.ts` si se van a compartir[cite: 23]. Si el tipo es exclusivo de un componente, decláralo localmente en el mismo archivo[cite: 23].

## 2. Next.js 15+ (Server-First y Asincronía)

- **Asincronía Obligatoria:** Las APIs dinámicas como `params`, `searchParams`, `cookies()` y `headers()` son Promesas en Next.js 15[cite: 23]. Deben resolverse siempre utilizando `await`[cite: 23].
- El fetching de datos debe realizarse del lado del servidor (Server Components o Server Actions) siempre que sea posible[cite: 23].
- Mantén los Client Components (marcados con `'use client'`) lo más bajo posible en el árbol de componentes para no comprometer el rendimiento[cite: 23].
- Utiliza las convenciones nativas del framework: maneja los estados de carga con `loading.tsx` y los errores con `error.tsx`[cite: 23].

## 3. Estilos y Tailwind CSS v4 (Mobile First)

- Las clases base sin prefijo en Tailwind representan obligatoriamente el diseño en dispositivos móviles[cite: 23].
- Los prefijos de breakpoint (`md:`, `lg:`) son EXCLUSIVOS para escalar a escritorio[cite: 23].
- **Prohibición de Hex y `var()`:** NUNCA uses colores hexadecimales (ej. `bg-[#1e293b]`) ni variables CSS nativas (ej. `text-[var(--text-color)]`) directamente en el `className`[cite: 22]. Utiliza siempre la escala predefinida y semántica del framework[cite: 22].
- **Estilos en línea limitados:** Los estilos en línea (`style={{...}}`) están prohibidos para el diseño estático[cite: 23]. Solo se autoriza su uso para valores estrictamente dinámicos inyectados por JS (ej. porcentajes de ancho) o al pasar constantes de color a librerías de terceros que no soporten clases[cite: 22].
