# Estrategia y Arquitectura de Pagos
**Última actualización:** 2026-09-28
**Para:** equipo de desarrollo y agentes de IA (Kilo Code)

---

## Principios Base

1. **La plataforma nunca toca el dinero.** El tenant conecta sus propias credenciales y el dinero va directo a su cuenta. La plataforma cobra solo la suscripción mensual.
2. **Sin PCI-DSS.** Nunca procesamos tarjetas directamente. Siempre redirigimos al provider del tenant.
3. **Progresión sin fricción.** Cada nivel de pago mejora la UX sin romper lo anterior.
4. **Geografía importa.** El provider sugerido depende de la región del tenant.
5. **Abstracción de provider.** El frontend nunca sabe qué provider está usando.

---

## Niveles de Pago por Plan

### Plan Catálogo — Transferencia Manual + QR
**Costo:** 0% | **Estado:** implementado

Flujo actual:
1. Comprador finaliza → llega a /pedido/[id]
2. Ve datos bancarios del tenant (CBU, alias, banco, titular)
3. Escanea el QR o copia los datos
4. Transfiere desde su homebanking o billetera
5. Admin confirma la acreditación manualmente en el panel

Limitación aceptada: requiere intervención manual del admin. Es el punto de upgrade al plan E-commerce.

---

### Plan E-commerce — Transferencias 3.0 + OAuth de providers
**Costo:** 0-0.8% (Transferencias 3.0) o tasa del provider | **Estado:** Sprint 10

#### Nivel 2a — QR Transferencias 3.0 estándar Coelsa (Sprint 9)
Mejora del QR actual al formato estándar regulado por el BCRA. Cualquier billetera argentina lo lee nativamente (Mercado Pago, MODO, Cuenta DNI, Ualá, Brubank). Sin contratar nada — solo cambiar el string que le pasamos a qrcode.toDataURL().

Formato del string Coelsa:
NOMBRE:${titular_cuenta}|CBU:${cbu}|ALIAS:${alias}|MONTO:${total}|CONCEPTO:${numero_orden}

#### Nivel 2b — MP OAuth (Sprint 10)
El tenant conecta su cuenta de Mercado Pago con un clic. La comisión la paga el comprador o el tenant directamente en su cuenta MP. La plataforma no toca el dinero.

Flujo de onboarding del tenant:
1. Tenant va a /admin/configuracion/pagos
2. Click en "Conectar Mercado Pago"
3. Redirect a OAuth de MP con client_id de la plataforma
4. MP pide permiso al tenant para operar en su cuenta
5. MP redirige de vuelta con authorization_code
6. Edge Function intercambia el code por access_token y refresh_token
7. Tokens se guardan encriptados en tenant_payment_configs

Flujo de pago:
1. Comprador llega a /pedido/[id]
2. Edge Function /payment-router recibe tenant_id + pedido_id
3. Lee credenciales MP del tenant desde tenant_payment_configs
4. Llama a MP API, crea preferencia de pago, retorna init_point (URL)
5. Comprador es redirigido a MP para pagar
6. MP llama al webhook de la plataforma con el resultado
7. Webhook actualiza pedidos.estado automáticamente

#### Nivel 2c — Mobbex Connect (Sprint 11)
Mismo patrón que MP OAuth pero con Mobbex. Permite split de pagos para que la plataforma cobre un fee automático por transacción en el futuro.

---

### Plan Escala — Multi-provider + ISV
**Estado:** Futuro

Providers candidatos:
- Naranja X (Nave): OAuth 2.0 M2M, Plan Z nativo, penetración en interior del país
- BINDX: webhooks de conciliación en tiempo real, DEBIN
- MODO: botón de pago con fallback QR, respaldo bancario tradicional
- Ualá Bis: API robusta, comisiones competitivas, webhooks serverless-friendly
- Payway (Prisma): adquirencia directa para tenants con número de establecimiento

---

## Modelo de Datos

### tenant_payment_configs
Tabla central que abstrae todos los providers. Una fila por provider por tenant.

Columnas clave:
- tenant_id uuid FK → tenants(id)
- provider_name text ('mp', 'mobbex', 'naranjax', 'uala', 'bindx', 'modo', 'payway')
- credentials jsonb (encriptado con Supabase Vault)
- is_active boolean
- region text ('caba', 'gba', 'cordoba', 'nea', 'noa', 'cuyo', 'patagonia')
- webhook_secret text (para verificar autenticidad de webhooks)
- expires_at timestamptz (para refresh de tokens OAuth)
- UNIQUE (tenant_id, provider_name)

RLS: admin solo ve/edita sus propias configs. Webmaster ve todo.

### Columna region en tenants
Permite la lógica geográfica de sugerencia de providers.
Valores: 'caba', 'gba', 'cordoba', 'nea', 'noa', 'cuyo', 'patagonia'

### payment_provider_recommendations
Tabla de sugerencias por región. Permite cambiar recomendaciones sin deploy.

Seed inicial:
- caba      → mp (1), modo (2)
- gba       → mp (1)
- cordoba   → naranjax (1), mp (2)
- nea       → naranjax (1)
- noa       → naranjax (1)
- cuyo      → mp (1)
- patagonia → mp (1)

---

## Arquitectura de la Edge Function /payment-router

Único punto de contacto con credenciales de pago. El frontend nunca llama directamente a providers.

Flujo:
1. Verificar que el pedido existe y pertenece al tenant
2. Leer tenant_payment_configs donde tenant_id + provider_name
3. Desencriptar credenciales con Supabase Vault
4. Según provider_name:
   - mp       → crear preferencia MP → retornar { init_point }
   - mobbex   → crear orden Mobbex   → retornar { redirect_url }
   - naranjax → crear link Nave      → retornar { payment_url }
   - transfer → retornar { qr_data, cbu, alias } (caso base sin provider)
5. Retornar { payment_url, qr_data?, provider }

---

## Webhooks de Confirmación

Endpoint único que enruta por provider:
POST /webhooks/payment/{provider}

Flujo:
1. Verificar firma del webhook (webhook_secret en tenant_payment_configs)
2. Identificar tenant y pedido desde el payload del provider
3. Actualizar pedidos.estado = 'confirmado'
4. Ejecutar confirmar_pedido_transaccion (descuenta stock, actualiza CRM)
5. Retornar 200

---

## Encriptación de Credenciales

Las credenciales en tenant_payment_configs.credentials se encriptan con Supabase Vault. Nunca se almacenan en texto plano.

Regla: las credenciales nunca pasan por el cliente de Next.js. Solo la Edge Function /payment-router las lee.

---

## Progresión Técnica por Sprint

Sprint actual → QR con CBU/alias + confirmación manual → funciona, 0% costo, requiere admin
Sprint 9      → QR formato Coelsa estándar             → cualquier billetera lo lee nativamente
Sprint 10     → tenant_payment_configs + Vault + MP OAuth + webhook → pago automático con MP
Sprint 11     → Mobbex Connect                          → segunda opción, split de fees futuro
Futuro        → Naranja X ISV + BINDX + MODO + DEBIN   → multi-provider con lógica geográfica

---

## Decisiones Registradas

| Decisión | Alternativa descartada | Motivo |
|----------|----------------------|--------|
| Nunca intermediar el dinero | Cobrar y redistribuir | Evita riesgo fiscal, regulatorio y operativo |
| Edge Function como orquestador | Server Actions de Next.js | Las credenciales nunca pasan por el servidor de Next.js |
| Supabase Vault para credenciales | jsonb en texto plano | Encriptación en reposo, acceso auditado |
| Una tabla multi-provider | Una tabla por provider | Escala sin cambiar el schema |
| Lógica geográfica en DB | Hardcodear en código | Permite cambiar recomendaciones sin deploy |
| Transferencia manual como base | Forzar integración de pago | El plan Catálogo funciona sin contratar nada externo |
| Webhooks para confirmación | Polling | Más eficiente, tiempo real, estándar de la industria |
