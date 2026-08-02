# Convenciones Core del Stack (Next.js + Tailwind + TS)

## 1. TypeScript y Tipado
- Prohibido el uso de `any`. Si la estructura de datos es incierta, utiliza `unknown` e implementa *type guards* (validaciones de tipo).
- Exporta interfaces y tipos desde un archivo `types/index.ts` si se van a compartir entre varios componentes. Si el tipo es exclusivo de un componente, decláralo en el mismo archivo.

## 2. Next.js (App Router)
- El fetching de datos debe realizarse del lado del servidor (en Server Components o Server Actions) siempre que sea arquitectónicamente posible.
- Mantén los Client Components lo más bajo posible en el árbol de componentes para no contaminar el rendimiento del servidor.
- Utiliza las convenciones nativas del framework: maneja los estados de carga nativos con `loading.tsx` y los errores de ruta con `error.tsx`.

## 3. Estilos y Tailwind CSS (Mobile First)
- Las clases base sin prefijo en Tailwind representan obligatoriamente el diseño en dispositivos móviles.
- Utiliza los prefijos de breakpoint (`md:`, `lg:`, `xl:`) exclusivamente para escalar y adaptar el diseño hacia pantallas más grandes. Nunca diseñes para desktop primero para luego usar prefijos para achicar en móvil.
- Prohibido terminantemente el uso de estilos en línea (`style={{...}}`). Todo debe resolverse a través de clases utilitarias o *design tokens* configurados en `tailwind.config.ts`.