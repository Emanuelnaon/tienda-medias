# Convenciones de Nomenclatura Estrictas

## Archivos y Carpetas
- Carpetas y módulos: `kebab-case` (ej. `gestion-usuarios`, `ui`).
- Componentes React (archivos): `PascalCase.tsx` (ej. `BotonPrimario.tsx`, `TablaPrecios.tsx`).
- Funciones auxiliares y hooks (archivos): `camelCase.ts` (ej. `usePresupuesto.ts`, `formatearMoneda.ts`).

## Código (TypeScript/JavaScript)
- Componentes e Interfaces: `PascalCase` (ej. `interface CalculoCosto`).
- Variables y Funciones: `camelCase` (ej. `calcularTotal`, `datosUsuario`).
- Constantes globales: `UPPER_SNAKE_CASE` (ej. `MAX_INTENTOS`, `API_TIMEOUT`).

## Tipos Booleanos y Handlers
- Todo booleano debe usar prefijos semánticos: `is`, `has`, `should` (ej. `isMobile`, `hasError`, `shouldRender`).
- Las funciones que manejan eventos deben usar el prefijo `handle` (ej. `handleSubmit`, `handleClick`).
- Las propiedades (props) de eventos deben usar el prefijo `on` (ej. `onSubmit`, `onClick`).