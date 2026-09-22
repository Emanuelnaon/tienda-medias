# Design Tokens y Tailwind CSS v4

## 1. Prohibición de Valores Arbitrarios (Magic Numbers)
- NUNCA uses clases arbitrarias en Tailwind (ej. `w-[325px]`, `text-[#ff0000]`) a menos que sea una medida dinámica inyectada por JS[cite: 14].
- SIEMPRE utiliza la escala predefinida nativa de Tailwind (ej. `w-64`, `text-red-500`)[cite: 14].

## 2. Paleta Semántica (CSS Nativo)
- Utiliza las utilidades semánticas para colores (ej. `bg-primary`, `text-secondary`, `border-destructive`)[cite: 14].
- **Resolución v4:** Estos *design tokens* deben estar mapeados estrictamente a variables CSS (ej. `var(--primary)`) mediante la directiva `@theme` en el archivo global de estilos (`globals.css`). 

## 3. Composición de Clases
- Mantén el orden lógico en Tailwind: primero layout (flex, grid), luego dimensiones (w, h), espaciado (p, m), tipografía y finalmente colores/efectos[cite: 14].
- Usa la utilidad `cn()` (que combina `clsx` y `tailwind-merge`) para resolver clases condicionales dinámicas sin colisiones[cite: 14].