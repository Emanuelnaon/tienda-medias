# Convenciones de Nomenclatura Estrictas

## 1. Archivos y Carpetas
- Carpetas y módulos: `kebab-case` (ej. `gestion-usuarios`, `ui`)[cite: 15].
- Componentes React (archivos): `PascalCase.tsx` (ej. `BotonPrimario.tsx`, `TablaPrecios.tsx`)[cite: 15].
- Funciones auxiliares y hooks (archivos): `camelCase.ts` (ej. `usePresupuesto.ts`, `formatearMoneda.ts`)[cite: 15].

## 2. Código (TypeScript/JavaScript)
- Componentes e Interfaces: `PascalCase` (ej. `interface CalculoCosto`)[cite: 15].
- Variables y Funciones Puras: `camelCase` (ej. `calcularTotal`, `datosUsuario`)[cite: 15].
- Constantes globales: `UPPER_SNAKE_CASE` (ej. `MAX_INTENTOS`, `API_TIMEOUT`)[cite: 15].

## 3. Server Actions (Next.js)
- Toda función mutadora que se ejecute en el servidor (Server Action) debe llevar el prefijo `action` o el sufijo `Action` (ej. `actionCrearProducto`, `crearProductoAction`) para distinguirla inequívocamente de las funciones de cliente.

## 4. Tipos Booleanos y Handlers
- Todo booleano debe usar prefijos semánticos: `is`, `has`, `should` (ej. `isMobile`, `hasError`, `shouldRender`)[cite: 15].
- Las funciones que manejan eventos en el cliente deben usar el prefijo `handle` (ej. `handleSubmit`, `handleClick`)[cite: 15].
- Las propiedades (props) de eventos deben usar el prefijo `on` (ej. `onSubmit`, `onClick`)[cite: 15].