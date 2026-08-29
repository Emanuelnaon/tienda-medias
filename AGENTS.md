# =====================================================================
# Script de Inicialización de SDK para IA (Actualizado 2026 - Final)
# Ejecuta este script desde la raíz de tu NUEVO proyecto Next.js
# =====================================================================

$SdkPath = "D:\ai-stack-core"

Write-Host "Iniciando inyección de contexto de IA..." -ForegroundColor Cyan

if (-not (Test-Path "package.json")) {
    Write-Host "Error: No se encontró package.json. Asegúrate de ejecutar este script en la raíz de tu proyecto Next.js." -ForegroundColor Red
    exit
}

# 3. Crear carpetas de reglas locales para los 3 entornos
Write-Host "Creando carpetas .clinerules, .continue/rules y .github..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path .\.clinerules | Out-Null
New-Item -ItemType Directory -Force -Path .\.continue\rules | Out-Null
New-Item -ItemType Directory -Force -Path .\.github | Out-Null

# 4. Copiar las reglas del proyecto (Cline y Continue)
Write-Host "Inyectando Project Rules para Cline y Continue..." -ForegroundColor Yellow
Copy-Item -Path "$SdkPath\project-rules\*" -Destination .\.clinerules\ -Recurse -Force
Copy-Item -Path "$SdkPath\project-rules\*" -Destination .\.continue\rules\ -Recurse -Force

# 4.5. NUEVO: Copiar las SKILLS para que la IA pueda consumirlas
Write-Host "Inyectando Skills de ejecución para la IA..." -ForegroundColor Yellow
if (Test-Path "$SdkPath\skills") {
    Copy-Item -Path "$SdkPath\skills\*" -Destination .\.clinerules\ -Recurse -Force
    Copy-Item -Path "$SdkPath\skills\*" -Destination .\.continue\rules\ -Recurse -Force
} else {
    Write-Host "Aviso: No se encontró la carpeta skills en $SdkPath." -ForegroundColor DarkYellow
}

# 5. Copiar el Enrutador/Instrucciones de Copilot
Write-Host "Inyectando reglas globales para Copilot..." -ForegroundColor Yellow
if (Test-Path "$SdkPath\global\copilot-instructions.md") {
    Copy-Item -Path "$SdkPath\global\copilot-instructions.md" -Destination .\.github\ -Force
} else {
    Write-Host "Aviso: No se encontró copilot-instructions.md en $SdkPath\global." -ForegroundColor DarkYellow
}

# 5.5. Inyectar Orquestador Maestro Dinámico (AGENTS.md)
Write-Host "Inyectando Orquestador Maestro Dinámico (AGENTS.md)..." -ForegroundColor Yellow
$agentsContent = @'
# 🤖 ORQUESTADOR DE PROYECTO: [Workspace: Current Root Folder]

Actúas como un Senior Fullstack Developer & Architect. Tu misión es mantener la integridad de la arquitectura **Feature-Based** y el **SSOT** en Supabase.

## 🧭 Mapa de Contexto Real
- **SSOT de Tipos:** `src/types/supabase.ts` (Consultar siempre para tipos de tablas).
- **Clientes Supabase:** 
  - Cliente de Servidor: `src/lib/supabase/server.ts`
  - Cliente de Navegador: `src/lib/supabase/client.ts`
  - Middleware: `src/middleware.ts`
- **Patrones de Diseño:** `src/supabase-client-pattern.ts`

## 🛠️ Skills Disponibles (Triggers)
**REGLA CERO:** Antes de ejecutar cualquier código, es OBLIGATORIO invocar y leer el archivo de la skill correspondiente si la tarea encaja en estas categorías:
- **[UI_GEN]**: Crear componentes visuales puros -> Usa `.clinerules/crear-componente-con-tokens.md`
- **[SCAFFOLD]**: Iniciar un nuevo módulo -> Usa `.clinerules/crear-feature.md`
- **[DB_MIGRATE]**: Cambios en tablas o RLS -> Usa `.clinerules/crear-query-supabase.md`
- **[FORM_GEN]**: Formularios validados (Zod+RHF) -> Usa `.clinerules/crear-fomulario-validado.md`
- **[MCP_RULES]**: Reglas de conexión a servidores -> Usa `.clinerules/mcp-supabase-playwright.md`

## 🔌 Conectores MCP & Capacidades de Agente (AI-STACK-CORE)
El agente tiene prohibido alucinar herramientas. Debe operar con los siguientes servidores MCP activos, pero **SU EJECUCIÓN ES ESTRICTAMENTE BAJO DEMANDA MANUAL DEL USUARIO** para optimizar el consumo de tokens:
- **Database Explorer (Supabase MCP):** Transporte `streamable-http`. Uso exclusivo bajo petición para sincronizar esquemas, validar tipos o generar migraciones. No ejecutar escaneos autónomos sin autorización explícita.
- **Web Browser & QA (Playwright MCP):** Transporte `stdio` nativo local. Funciona como los "ojos" del agente. **Solo se invocará cuando el usuario solicite explícitamente una auditoría visual, testing E2E o verificación del DOM.**
- **Document Processor (Markitdown MCP):** Transporte `stdio` local. Uso dedicado al parseo de archivos externos a Markdown. Solo por petición.

## 📏 Reglas de Oro (Inquebrantables)
- **Mobile First:** El estilo base de Tailwind es obligatorio para móvil. Los prefijos (`md:`, `lg:`) se reservan únicamente para escalar a escritorio.
- **SSOT Absoluto:** La única fuente de verdad sobre el modelo de datos es `src/types/supabase.ts`. Queda estrictamente prohibido inventar o forzar interfaces manuales.
- **PWA Ready:** Todo desarrollo de UI e integración debe ser ultra ligero, priorizando el rendimiento optimizado y arquitecturas tolerantes a la desconexión (Offline-First).

## 🎛️ Reglas de Orquestación del Operador
- **Autocompletado de Código:** Delegado a sub-modelos locales de baja latencia o Copilot.
- **Ingeniería Compleja:** Reservado a la ventana de agentes y Cline. Las verificaciones mediante navegador virtual (Playwright) o consultas al estado remoto (Supabase) **solo se realizarán si el usuario lo solicita explícitamente al finalizar la tarea.**
'@
Set-Content -Path ".\AGENTS.md" -Value $agentsContent -Encoding UTF8

# 6. Copiar los Templates
Write-Host "Inyectando Templates físicos..." -ForegroundColor Yellow
Copy-Item -Path "$SdkPath\templates\*" -Destination .\src\ -Recurse -Force

Write-Host "`n===========================================================" -ForegroundColor Green
Write-Host "¡Contexto de IA inyectado con éxito!" -ForegroundColor Green
Write-Host "===========================================================`n"

# 7. Recordatorio de dependencias base
Write-Host "Para que las plantillas y skills funcionen sin errores, instala tu stack base ejecutando:" -ForegroundColor Cyan
Write-Host "npm install @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod clsx tailwind-merge lucide-react browser-image-compression zustand immer" -ForegroundColor White
Write-Host "`n¡Tu entorno está listo para trabajar con Cline, Continue y Copilot!" -ForegroundColor Green