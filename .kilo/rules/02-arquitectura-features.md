# Arquitectura de Carpetas y Módulos (Feature-Driven)

Todo el código de la aplicación debe organizarse en módulos independientes por funcionalidad dentro de `src/features/`. La carpeta `src/app/` es exclusiva para el enrutamiento.

## 1. Reglas de Estructura de Rutas (`src/app/`)

- Los archivos en `src/app/` (`page.tsx`, `layout.tsx`) NO DEBEN contener lógica de negocio compleja ni componentes extensos.
- Su única responsabilidad es manejar parámetros de ruta (asíncronos), validar estado/sesión y consumir el componente principal exportado desde su feature.

## 2. Estructura Estricta de un Feature (`src/features/<nombre-feature>/`)

Cada feature debe ser autocontenido con esta estructura obligatoria:

- `/components`: Componentes visuales exclusivos.
- `/hooks`: Custom hooks de React.
- `/api`: Server Actions o funciones de fetching. (OBLIGATORIO: declarar `'use server'` en la primera línea de los archivos de mutación).
- `/types`: Interfaces de TS específicas del dominio.
- `/utils`: Funciones auxiliares puras.
- **Contrato de Interfaz (`index.ts`):** OBLIGATORIO. Cada feature debe tener un archivo `index.ts` en su raíz que exporte ÚNICAMENTE los componentes, tipos o funciones que el resto de la aplicación está autorizada a consumir.

## 3. Aislamiento y Dependencias

- Un feature PUEDE importar código de la carpeta global compartida (`src/components/ui/`, `src/lib/`, `src/types/`).
- Un feature NO DEBE importar código directamente de las subcarpetas internas de otro feature. Debe consumirse estrictamente a través del `index.ts` del feature objetivo.
- Si dos features necesitan compartir lógica íntimamente, esa lógica debe elevarse a las carpetas globales.

## 4. UI Compartida (`src/components/ui/`)

- Contiene los componentes "tontos" y agnósticos (Botones, Inputs, Modales genéricos).
- Cero estado complejo, cero lógica de negocio y cero acceso a base de datos.
