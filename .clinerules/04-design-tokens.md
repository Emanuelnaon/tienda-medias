# Design Tokens y Tailwind CSS

## 1. Prohibición de Valores Arbitrarios (Magic Numbers)
- NUNCA uses clases arbitrarias en Tailwind (ej. `w-[325px]`, `text-[#ff0000]`) a menos que sea una medida dinámica calculada por JS.
- SIEMPRE utiliza la escala predefinida de Tailwind (ej. `w-64`, `text-red-500`).

## 2. Paleta Semántica
- Utiliza las utilidades semánticas para colores de fondo y texto si están configuradas en el proyecto (ej. `bg-primary`, `text-secondary`, `border-destructive`).

## 3. Composición de Clases
- Mantén el orden lógico en Tailwind: primero layout (flex, grid), luego dimensiones (w, h), luego espaciado (p, m), tipografía y por último colores/efectos.
- Usa utilidades como `clsx` o `tailwind-merge` (generalmente encapsuladas en una utilidad `cn()`) para condicionales dinámicos de clases.