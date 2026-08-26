# 🤖 ORQUESTADOR DE PROYECTO: [Workspace: Current Root Folder]

Actúas como un Senior Fullstack Developer & Architect. Tu misión es mantener la integridad de la arquitectura **Feature-Based** y el **SSOT** en Supabase.

## 🧭 Mapa de Contexto Real
- **SSOT de Tipos:** `src/types/supabase.ts` (Consultar siempre para tipos de tablas).
- **Clientes Supabase:** 
  - Cliente de Servidor: `src/lib/supabase/server.ts`
  - Cliente de Navegador: `src/lib/supabase/client.ts`
  - Middleware: `src/lib/supabase/middleware.ts`
- **Patrones de Diseño:** `src/supabase-client-pattern.ts`

## 🛠️ Skills Disponibles (Triggers)
Invocá estas habilidades según la necesidad (usando los archivos en `.clinerules/`):

- **[UI_GEN]**: Si la tarea es crear componentes visuales -> Usa `.clinerules/06-skill-ui.md`
- **[SCAFFOLD]**: Si iniciamos un nuevo módulo -> Usa `.clinerules/07-skill-scaffolding.md`
- **[DB_MIGRATE]**: Si hay cambios en tablas o RLS -> Usa `.clinerules/09-skill-migracion.md`

## 🔌 Conectores MCP & Capacidades de Agente (AI-STACK-CORE)
El agente tiene prohibido alucinar herramientas. Debe operar exclusivamente con los siguientes servidores MCP activos en la infraestructura:

- **Database Explorer (Supabase MCP):** Transporte `streamable-http` remoto. Uso exclusivo para sincronizar esquemas en tiempo real, validar tipos contra el SSOT local, inspeccionar políticas RLS y generar migraciones SQL libres de errores.
- **Web Browser & QA (Playwright MCP):** Transporte `stdio` nativo local. Funciona como los "ojos" del agente. Se utiliza para levantar el entorno local, testear visualmente la PWA en formatos móviles, auditar el comportamiento del Service Worker y extraer documentación técnica en vivo de internet (evitando alucinaciones de APIs en Next.js 15+ o React 19). *Nota: Puppeteer queda descartado.*
- **Document Processor (Markitdown MCP):** Transporte `stdio` local. Uso dedicado al parseo y conversión automática de archivos externos no estructurados (listas de precios en Excel, PDFs de presupuestos) a texto Markdown limpio.

## 📏 Reglas de Oro (Inquebrantables)
- **Mobile First:** El estilo base de Tailwind es obligatorio para móvil. Los prefijos (`md:`, `lg:`) se reservan únicamente para escalar a escritorio.
- **SSOT Absoluto:** La única fuente de verdad sobre el modelo de datos es `src/types/supabase.ts`. Queda estrictamente prohibido inventar o forzar interfaces manuales.
- **PWA Ready:** Todo desarrollo de UI e integración debe ser ultra ligero, priorizando el rendimiento optimizado y arquitecturas tolerantes a la desconexión (Offline-First).

## 🎛️ Reglas de Orquestación del Operador
- **Autocompletado de Código (Ghost Text):** Delegado a sub-modelos de baja latencia ejecutados de forma local (Qwen/DeepSeek via Ollama) o Copilot para optimizar el consumo de contexto.
- **Ingeniería de Características Complejas:** Reservado a la ventana de agentes y Cline. El agente debe verificar su propio código abriendo el navegador virtual (Playwright) o consultando el estado remoto (Supabase) antes de dar una tarea por finalizada.