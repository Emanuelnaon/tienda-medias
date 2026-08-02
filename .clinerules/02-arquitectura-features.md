# Arquitectura de Carpetas y Módulos (Feature-Driven)

Todo el código de la aplicación debe organizarse en módulos por funcionalidad (features) dentro de `src/features/`, manteniendo la carpeta `src/app/` exclusivamente para enrutamiento.

## 1. Reglas de Estructura de Rutas (`src/app/`)
- Los archivos en `src/app/` (`page.tsx`, `layout.tsx`) NO DEBEN contener lógica de negocio compleja ni componentes extensos de UI.
- Su única responsabilidad es manejar parámetros de ruta, validar sesión y consumir el componente principal exportado desde la carpeta `features`.

## 2. Estructura de un Feature (`src/features/<nombre-feature>/`)
Cada feature debe ser autocontenido y tener la siguiente estructura estandarizada:
- `/components`: Componentes visuales exclusivos de este módulo.
- `/hooks`: Custom hooks de React para manejar el estado local o lógica de UI de este feature.
- `/api`: Server Actions o funciones de fetching de datos (Supabase) exclusivas del módulo.
- `/types`: Interfaces y tipos de TypeScript de este dominio específico.
- `/utils`: Funciones auxiliares puras.

## 3. Aislamiento y Dependencias
- Un feature PUEDE importar código de la carpeta global compartida (`src/components/ui/`, `src/lib/`, `src/types/`).
- Un feature NO DEBE importar código directamente de las subcarpetas internas de otro feature. Si dos features necesitan compartir lógica, esa lógica debe elevarse a las carpetas globales compartidas.

## 4. UI Compartida (`src/components/ui/`)
- Aquí van los componentes "tontos" y reutilizables en toda la aplicación (Botones, Inputs, Modales genéricos).
- No deben tener estado complejo ni realizar peticiones a la base de datos.