# Plan: Prueba Playwright — botón “Finalizar compra por WhatsApp”

## Objetivo
Crear y ejecutar una prueba E2E (Playwright) que valide el comportamiento esperado del botón **“Finalizar compra por WhatsApp”** en `src/features/carrito/components/FormularioCheckout.tsx:317-322`, guardada en `D:\VscodeEma\tienda-medias\tests\checkout-whatsapp.spec.ts`. El usuario reporta que **el botón actualmente no funciona**; la prueba debe evidenciar el fallo (assert del flujo esperado) para guiar la corrección.

## Contexto (verificado en código)
- Formulario: `src/features/carrito/components/FormularioCheckout.tsx` (client). Campos: `nombre_completo`, `telefono`; si `hayZonasActivas` también exige `codigo_postal` (4 dígitos) y cotización válida (`estimado`). Submit llama server action `generarLinkWhatsApp` (`src/features/carrito/actions/generarCheckout.ts`) y luego navega a `/pedido/{pedidoId}`.
- Botón: `type="submit"`, texto `"Finalizar compra por WhatsApp"` / `"Registrando pedido..."`, deshabilitado si `isPending || items.length === 0`.
- Carrito: Zustand persist `carrito-almacenamiento` (`src/features/carrito/store.ts:81`), items con `id,nombre,precio,cantidad,talle_seleccionado,categoria,imagenUrl,stockMaximo`.
- Rutas UI: `/carrito` usa `FormularioCheckout` (`app/carrito/page.tsx:92`); drawer también lo usa.
- Playwright: `playwright.config.ts` (`testDir: './tests'`, `baseURL: http://localhost:3000`, `webServer: npm run dev`, chromium). Spec existente: `tests/flujo-compra.spec.ts`.
- Restricción de sesión: en modo plan solo se pueden crear/editar archivos Markdown de plan; la creación del `.spec.ts` y la ejecución de Playwright deben hacerla un agente con capacidad de implementación (o el usuario).

## Decisiones / supuestos (recomendados)
1. **Nuevo spec dedicado** (`tests/checkout-whatsapp.spec.ts`) — recomendado para aislar el fallo del botón y no mezclar con el flujo catálogo→carrito.
2. **Semilla determinista del carrito vía `localStorage`** antes de navegar a `/carrito` (clave `carrito-almacenamiento`, formato Zustand persist `{state:{items:[...]},version:0}`) para no depender de stock/catalog/UI de “agregar al carrito”. Usa un `id`/datos de producto que existan en la BD del entorno; si no, el submit fallará en `generarLinkWhatsApp` (“No se encontraron los productos seleccionados”) — el test debe capturar ese síntoma como dato útil.
3. **Assert principal (comportamiento esperado):** completar nombre/teléfono (+ CP si aparece), click en el botón, y verificar **uno** de: navegación a `/pedido/<id>` **o** POST/acción completada sin toast de error bloqueante + estado “Registrando pedido…” observado. Dado “botón no funciona”, se espera **falla**; registrar en el reporte si falla por: botón deshabilitado (carrito vacío), validación/zona activa sin estimado, error de server action, o ninguna navegación.
4. **No tocar `src/` ni estilos** (reglas del repo). No agregar dependencias.

## Archivos afectados (implementación)
- `tests/checkout-whatsapp.spec.ts` — **crear** (único cambio de código).

## Plan de implementación (pasos ejecutables)
1. Crear `tests/checkout-whatsapp.spec.ts` con `@playwright/test`.
2. `test.beforeEach`/en el test: `page.addInitScript` o `page.goto('/')` + `page.evaluate` para setear `localStorage['carrito-almacenamiento']` con 1 ítem válido; luego `page.goto('/carrito')`.
3. Esperar `getByRole('heading', { name: /Tu Carrito/i })` y el botón `getByRole('button', { name: /Finalizar compra por WhatsApp/i })` visible y **enabled** (timeout generoso si hidrata Zustand).
4. Rellenar `#nombre_completo` y `#telefono`. Si `#codigo_postal` es visible (zonas activas), rellenar `1234`, esperar a que desaparezca “Calculando envío…” y que aparezca texto de envío estimado **o** error; si hay error de cobertura, el test debe fallar con mensaje claro (bloqueo legítimo del flujo en ese entorno).
5. Click en el botón de finalizar; `await expect(page).toHaveURL(/\/pedido\/.+/, { timeout: 30000 })` (ajustar si el flujo real difiere). Alternativa robusta: `Promise.all([page.waitForURL(/\/pedido\//), button.click()])`.
6. (Opcional, si estable) assert de que el carrito quedó vacío o heading de confirmación en `/pedido/[id]`.
7. Ejecutar: `npx playwright test tests/checkout-whatsapp.spec.ts --project=chromium` (desde la raíz del repo). Para depurar: `--headed --debug`.

## Contenido de referencia del spec (copiar al implementar)
```ts
import { test, expect } from '@playwright/test';

const CART_KEY = 'carrito-almacenamiento';
// Ajustar `id` a un producto real del entorno si la action valida contra DB.
const SEEDED_CART = JSON.stringify({
  state: {
    items: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        nombre: 'Producto prueba checkout',
        precio: 1000,
        cantidad: 1,
        talle_seleccionado: 'Único',
        categoria: 'Test',
        imagenUrl: null,
        stockMaximo: 99,
      },
    ],
  },
  version: 0,
});

test.describe('Checkout WhatsApp', () => {
  test('botón "Finalizar compra por WhatsApp" completa el pedido', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: CART_KEY, value: SEEDED_CART },
    );
    await page.goto('/carrito');

    const finalizar = page.getByRole('button', { name: /Finalizar compra por WhatsApp/i });
    await expect(finalizar).toBeVisible({ timeout: 15000 });
    await expect(finalizar).toBeEnabled();

    await page.locator('#nombre_completo').fill('Cliente Prueba E2E');
    await page.locator('#telefono').fill('1112345678');

    const cp = page.locator('#codigo_postal');
    if (await cp.isVisible().catch(() => false)) {
      await cp.fill('1425');
      // Esperar fin de cotización (éxito o error) según UI
      await expect(page.getByText(/Calculando envío|Envío:|No realizamos envíos|código postal/i).first()).toBeVisible({ timeout: 15000 });
      // Si hay error de envío, el flujo legítimamente bloquea; el test lo expondrá.
    }

    await Promise.all([
      page.waitForURL(/\/pedido\/.+/, { timeout: 30000 }),
      finalizar.click(),
    ]);
  });
});
```

## Validación / criterios de aceptación
- El archivo existe en `tests/checkout-whatsapp.spec.ts` y corre con `npx playwright test tests/checkout-whatsapp.spec.ts --project=chromium`.
- Con el **bug actual (“botón no funciona”)**, la prueba **debe fallar** y el reporte/screenshot/trace (`trace: on-first-retry` per config) debe indicar la causa (sin navegación, toast de error, botón disabled, request fallida, etc.).
- Una vez corregido el bug, la misma prueba debe **pasar** en un entorno con datos válidos (producto existente, tenant/default, envío cotizable si aplica).

## Riesgos / notas
- **Dependencia de datos reales**: `generarLinkWhatsApp` valida productos por `id` en DB; el ID sembrado puede no existir → fallo “No se encontraron los productos seleccionados”. Ajustar `SEEDED_CART.items[0].id` a un ID real o mockear/interceptar en una iteración posterior (mocking de server actions en Next+Playwright es no trivial).
- **Zonas/envío activas**: si hay zonas, sin cotización válida el submit muestra toast y no navega (comportamiento intencional) — no es “botón roto” sino precondición; el test debe distinguirlo.
- **`window.location.assign`**: Playwright captura la navegación; OK.
- Ejecución requiere app corriendo o `webServer` funcional + env/Supabase configurados.

## Preguntas abiertas
- Ninguna bloqueante para escribir el spec. Si al ejecutar falla por “producto no encontrado”, proporcionar un `producto.id` válido del entorno (o permitir interceptar la action/ruta) en una iteración de refinamiento.
