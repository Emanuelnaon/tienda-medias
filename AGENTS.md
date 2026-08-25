# =====================================================================
# Script de Inicialización de SDK para IA (Actualizado 2026)
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

# 5. Copiar el Enrutador/Instrucciones de Copilot
Write-Host "Inyectando reglas globales para Copilot..." -ForegroundColor Yellow
if (Test-Path "$SdkPath\copilot-instructions.md") {
    Copy-Item -Path "$SdkPath\copilot-instructions.md" -Destination .\.github\ -Force
} else {
    Write-Host "Aviso: No se encontró copilot-instructions.md en $SdkPath." -ForegroundColor DarkYellow
}

# 5.5. NUEVO: Inyectar Orquestador Maestro Dinámico (AGENTS.md)
Write-Host "Inyectando Orquestador Maestro Dinámico (AGENTS.md)..." -ForegroundColor Yellow
$agentsContent = @'
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
El agente debe operar exclusivamente con los siguientes servidores MCP activos en la infraestructura:
- **Database Explorer (Supabase MCP):** Transporte `streamable-http` remoto. Sincroniza esquemas en tiempo real, valida tipos contra el SSOT, inspecciona políticas RLS y genera migraciones SQL.
- **Web Browser & QA (Playwright MCP):** Transporte `stdio` nativo local. Ojos del agente para testing visual en móviles de la PWA, auditorías del Service Worker y extracción de documentación técnica actualizada (React 19 / Next.js 15+).
- **Document Processor (Markitdown MCP):** Transporte `stdio` local. Parsing automático de archivos externos (Excel, PDFs) a Markdown limpio.

## 📏 Reglas de Oro (Inquebrantables)
- **Mobile First:** El estilo base de Tailwind es obligatorio para móvil. Los prefijos (`md:`, `lg:`) se reservan únicamente para escritorio.
- **SSOT Absoluto:** La única fuente de verdad sobre el modelo de datos es `src/types/supabase.ts`. Queda estrictamente prohibido inventar o forzar interfaces manuales.
- **PWA Ready:** Todo desarrollo de UI debe ser ultra ligero, priorizando el rendimiento optimizado y tolerancia offline.

## 🎛️ Reglas de Orquestación del Operador
- **Autocompletado de Código:** Delegado a sub-modelos locales de baja latencia (Qwen/DeepSeek via Ollama) o Copilot.
- **Ingeniería Compleja:** Reservado a la ventana de agentes y Cline. El agente debe verificar su propio código abriendo el navegador virtual (Playwright) o consultando el estado remoto (Supabase) antes de finalizar.
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
Write-Host "npm install @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod clsx tailwind-merge lucide-react" -ForegroundColor White
Write-Host "`n¡Tu entorno está listo para trabajar con Cline, Continue y Copilot!" -ForegroundColor Green