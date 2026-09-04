```markdown
# 🧦 Tienda Medias - E-commerce & Admin Dashboard

Una plataforma de comercio electrónico moderna, rápida y escalable, construida con Next.js y Supabase. El proyecto incluye un catálogo completo para clientes con un flujo de compra optimizado hacia WhatsApp, y un panel de administración seguro para la gestión integral del inventario.

## 📝 Descripción

Este proyecto está diseñado utilizando **Feature-Sliced Design (FSD)** para mantener el código modular, mantenible y altamente escalable. Combina las últimas características de **Next.js (App Router)** y **React 19**, estilizado con el nuevo motor de **Tailwind CSS v4**, y respaldado por **Supabase** para la base de datos, autenticación y almacenamiento en la nube.

## ✨ Características Principales

### Para los Clientes (Storefront)
*   **Catálogo Dinámico:** Visualización de productos con filtros y buscador integrado.
*   **Gestión de Carrito y Favoritos:** Estados globales manejados con Zustand persistente.
*   **Checkout por WhatsApp:** Flujo de compra sin fricción que consolida el pedido y redirige automáticamente al cliente vía WhatsApp.
*   **UI/UX Optimizada:** Diseño responsivo (Mobile-first), modo oscuro nativo y feedback visual con notificaciones (React Hot Toast).

### Para los Administradores (Admin Panel)
*   **Rutas Protegidas:** Acceso restringido validando sesión y roles de usuario (Server-Side).
*   **Gestión de Inventario (CRUD):** Creación, edición, visualización y eliminación de productos.
*   **Optimización de Imágenes:** Compresión automática de imágenes en el lado del cliente antes de subir al bucket de Supabase.

## 🛠️ Stack Tecnológico

*   **Framework Core:** [Next.js](https://nextjs.org/) (App Router) / React 19
*   **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **BaaS (Backend & Auth):** [Supabase](https://supabase.com/) (`@supabase/ssr`)
*   **Gestión de Estado:** [Zustand](https://zustand-demo.pmnd.rs/)
*   **Formularios:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
*   **Testing E2E:** [Playwright](https://playwright.dev/)
*   **Tipografía:** `next/font` (Geist / Geist Mono)

## 📂 Arquitectura de Carpetas (Feature-Sliced Design)

El proyecto organiza su lógica de negocio en dominios independientes dentro de `src/features/` para un menor acoplamiento:

```text
├── app/                  # Rutas de la aplicación (App Router)
│   ├── (public)/         # Rutas accesibles: /catalogo, /carrito, etc.
│   └── admin/            # Rutas protegidas del dashboard
├── src/
│   ├── components/       # Componentes compartidos y Layouts globales (Sidebar, Header)
│   ├── features/         # Módulos independientes de negocio
│   │   ├── admin/        # Lógica del panel de control
│   │   ├── auth/         # Autenticación con Supabase
│   │   ├── carrito/      # Gestión del carrito y checkout a WhatsApp
│   │   ├── catalogo/     # Listado y filtros
│   │   ├── favoritos/    # Lógica de guardado de productos
│   │   └── productos/    # CRUD y compresión de imágenes
│   └── lib/              # Utilidades genéricas e instancias (ej. configuración de Supabase)
├── tests/                # Pruebas End-to-End con Playwright
└── .clinerules / .continue  # Reglas de IA para convenciones de código

```

## 🚀 Instalación y Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone [https://github.com/tu-usuario/tienda-medias.git](https://github.com/tu-usuario/tienda-medias.git)
cd tienda-medias

```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
# o
pnpm install

```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

```

*(Nota: Asegúrate de tener configuradas las tablas correspondientes en Supabase, incluyendo `admin_users` y tu Storage Bucket para las imágenes).*

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev

```

La aplicación estará disponible en `http://localhost:3000`.

## 🧪 Testing

El proyecto incluye pruebas de flujo completo (End-to-End) utilizando Playwright (ej. flujo de compra completo). Para ejecutar las pruebas:

```bash
# Ejecutar pruebas en modo headless
npm run test:e2e

# Ejecutar pruebas abriendo la interfaz de Playwright
npm run test:e2e -- --ui

```

## 🛡️ Seguridad y Rendimiento

* **Security Headers:** Cabeceras HTTP (CSP, HSTS) estrictamente configuradas en `next.config.ts`.
* **Imágenes Optimizadas:** Uso de `next/image` con `remotePatterns` apuntando exclusivamente al Storage de Supabase.

---

*Desarrollado por Emanuel Naon*

```

```
