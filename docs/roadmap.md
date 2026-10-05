# Roadmap Maestro — SaaS E-commerce Multi-Tenant
**Última actualización:** 2026-09-28
**Stack:** Next.js 16 · Supabase · Tailwind · Vercel

---

## Estructura de Planes

### Plan Catálogo (Básico)
Foco: presencia digital rápida y toma de pedidos manual.

- Catálogo online con hasta 100 productos
- Checkout WhatsApp con QR de pago (Transferencias 3.0)
- Página de confirmación de pedido con datos bancarios
- Badges de inventario: Agotado / Últimas unidades / Nuevo
- Lista de espera para productos agotados
- Panel admin: gestión de pedidos y confirmación de acreditación
- CRM base: historial de clientes y notas
- 1 usuario administrador por tenant
- Subdominio genérico de la plataforma

### Plan E-commerce (Profesional)
Foco: automatización del checkout y profesionalización.

- Todo lo del plan Catálogo, sin límite de productos
- Métodos de pago: MP OAuth + Mobbex Connect (tenant conecta su cuenta)
- Conciliación automática de pagos (sin subir comprobante manual)
- Estados extendidos de pedido: preparando → en camino → entregado
- Tracking público en tiempo real (Supabase Realtime)
- Zonas de envío con cálculo de costo por código postal
- Meta Pixel + API de Conversiones (server-side)
- Feed de Instagram en home
- Dominio propio del tenant
- Anti-fraude: bloqueo de clientes, detección de patrones

### Plan Escala (Avanzado)
Foco: operaciones con mayor volumen y equipos de trabajo.

- Todo lo del plan E-commerce
- Múltiples usuarios con roles: admin / cajero / depósito
- Cotizador dinámico con reglas de precio por área y volumen
- Visualizador 2D de mockup para personalización
- Dashboard de métricas: ventas, productos más vendidos, evolución
- Importador masivo CSV de productos
- Scanner QR para inventario
- Soporte prioritario
- Cancha preparada para ISV (Naranja X, BINDX, MODO)

---

## Estado Actual

| Sprint | Feature | Estado |
|--------|---------|--------|
| 5 | Multi-tenant · RLS · roles webmaster/admin · plan_features | ✅ |
| 6 | Seguridad RPCs · migración categoria_id · deudas técnicas | ✅ |
| 7.1 | Vista pedidos + confirmar acreditación | ✅ |
| 7.2 | Etiquetas de inventario | ✅ |
| 7.3 | Lista de espera agotados | ✅ |
| 7.4 | Stock sincronizado via trigger | ✅ |
| 7.6 | CRM base clientes | ✅ |
| 8.1 | Datos bancarios del tenant + /pedido/[id] con QR | ✅ |

---

## Roadmap de Sprints

### Sprint 8.2 — Logística y Estados de Pedido
**Objetivo:** cerrar el ciclo de entrega y darle visibilidad al comprador.

- Tabla `zonas_envio`: métodos (retiro / mensajería / correo), costo, envío gratis desde monto mínimo
- Cálculo de costo de envío por código postal en el checkout
- Validación en Edge Function (evitar manipulación desde cliente)
- Estados extendidos en `pedidos`: preparando → en camino → entregado → cancelado
- Tabla `pedidos_historial`: registro de cada cambio de estado con timestamp y usuario
- Vista de timeline en `/pedido/[id]` (tracking público)
- Supabase Realtime en `/pedido/[id]` para actualización en vivo

### Sprint 9 — Social Commerce + Anti-fraude
**Objetivo:** captación de tráfico y madurez operativa.

- QR Transferencias 3.0 en formato estándar Coelsa (mejora del QR actual, cero dependencias)
- Meta Pixel + API de Conversiones server-side (plan E-commerce y Escala)
- Feed de Instagram en home (oEmbed, sin API de Meta)
- Botones de compartir en ficha de producto (WhatsApp e Instagram)
- Anti-fraude: bloqueo de clientes, detección de pedidos duplicados por patrón
- `tieneFeature()` conectado en todas las páginas que lo requieren

### Sprint 10 — Arquitectura de Pagos
**Objetivo:** dejar la cancha lista para múltiples providers sin depender de ninguno.

- Tabla `tenant_payment_configs` con soporte multi-provider
- Supabase Vault para credenciales encriptadas
- Columna `region` en `tenants` para lógica geográfica de providers sugeridos
- Edge Function `/payment-router` como orquestador único
- MP OAuth: primera integración real (tenant conecta su cuenta MP con un clic)
- Webhooks de confirmación de pago desde MP
- Conciliación automática: el pedido pasa a confirmado sin intervención del admin

### Sprint 11 — Herramientas Operativas + Plan Escala
**Objetivo:** features de diferenciación para negocios con volumen.

- Importador masivo CSV de productos
- Scanner QR/código de barras para inventario
- Dashboard de métricas: ventas por período, productos más vendidos
- Cotizador dinámico: tablas de precios por técnica, área y volumen en Supabase
- Visualizador 2D de mockup con fabric.js

### Sprint 12 — Multi-usuario + Dominio Propio
**Objetivo:** habilitar el Plan Escala completo.

- Roles adicionales: cajero (solo ver pedidos) / depósito (solo stock)
- Middleware que resuelve dominio propio al tenant correcto
- Certificados SSL dinámicos por tenant
- Mobbex Connect como segundo provider de pagos
- Cancha ISV: estructura para onboarding de Naranja X, BINDX, MODO

---

## Arquitectura de Pagos (Progresión)

| Sprint | Método | Costo | Dependencia |
|--------|--------|-------|-------------|
| Actual | QR CBU/alias + comprobante manual | 0% | Ninguna |
| Sprint 9 | QR Transferencias 3.0 estándar Coelsa | 0-0.8% | Ninguna |
| Sprint 10 | MP OAuth (tenant conecta su cuenta) | ~4.99% tarjeta (lo paga el tenant) | MP API pública |
| Sprint 11 | Mobbex Connect | Variable | Mobbex API pública |
| Futuro | Naranja X ISV · BINDX webhooks · MODO · DEBIN | Negociado | ISV program |

**Principio:** nunca la plataforma es intermediaria del dinero. El tenant conecta sus propias credenciales y el dinero va directo a su cuenta. La plataforma cobra solo la suscripción mensual.

---

## Decisiones de Arquitectura Clave

- **Multi-tenant:** `tenant_id uuid NOT NULL FK → tenants(id)` en toda tabla nueva
- **RLS siempre:** toda tabla nueva tiene RLS habilitado con policies por rol
- **Feature gating centralizado:** `plan_features` en DB + helper `tieneFeature()`
- **Pagos como plugin:** `tenant_payment_configs` abstrae el provider, el frontend no sabe cuál es
- **Credenciales encriptadas:** Supabase Vault, nunca texto plano en la DB
- **Edge Function como orquestador:** `/payment-router` es el único punto que toca credenciales
- **No PCI-DSS:** nunca procesamos tarjetas directamente, siempre redirigimos al provider
- **Geografía:** `tenants.region` permite sugerir el provider con mayor adopción por zona

---

## Mapa de Features por Plan

| Feature | Catálogo | E-commerce | Escala |
|---------|----------|------------|--------|
| Catálogo online | ✅ (hasta 100) | ✅ (sin límite) | ✅ |
| Checkout WhatsApp + QR | ✅ | ✅ | ✅ |
| Panel admin pedidos + CRM | ✅ | ✅ | ✅ |
| Lista de espera agotados | ✅ | ✅ | ✅ |
| MP OAuth / Mobbex | ❌ | ✅ | ✅ |
| Conciliación automática | ❌ | ✅ | ✅ |
| Tracking en tiempo real | ❌ | ✅ | ✅ |
| Zonas de envío | ❌ | ✅ | ✅ |
| Meta Pixel | ❌ | ✅ | ✅ |
| Feed Instagram | ❌ | ✅ | ✅ |
| Anti-fraude avanzado | ❌ | ✅ | ✅ |
| Dominio propio | ❌ | ✅ | ✅ |
| Multi-usuario con roles | ❌ | ❌ | ✅ |
| Cotizador dinámico | ❌ | ❌ | ✅ |
| Visualizador 2D mockup | ❌ | ❌ | ✅ |
| Dashboard métricas | ❌ | ❌ | ✅ |
| Importador CSV | ❌ | ❌ | ✅ |
| ISV (Naranja X / BINDX) | ❌ | ❌ | ✅ |
