import { test, expect } from '@playwright/test';

const CART_KEY = 'carrito-almacenamiento';
// Ajustar `id` a un producto real del entorno si la action valida contra DB.
// Un UUID inexistente provoca "No se encontraron los productos seleccionados" (server action).
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

test.describe.skip('Checkout WhatsApp (pendiente de reemplazo en H2)', () => {
  test('botón "Finalizar compra por WhatsApp" completa el pedido (diagnóstico)', async ({
    page,
  }) => {
    // Semilla antes de que la app lea localStorage / hidrate Zustand.
    await page.addInitScript(
      ({ key, value }) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // ignore
        }
      },
      { key: CART_KEY, value: SEEDED_CART },
    );

    await page.goto('/carrito');

    const finalizar = page.getByRole('button', {
      name: /Finalizar compra por WhatsApp/i,
    });
    await expect(finalizar).toBeVisible({ timeout: 15000 });

    // Diagnóstico: carrito vacío / no hidratado bloquea el submit.
    const disabled = await finalizar.isDisabled();
    if (disabled) {
      const label = await finalizar.textContent();
      throw new Error(
        `Botón deshabilitado (label="${label?.trim()}"). Posible causa: carrito vacío/no hidratado o items.length===0.`,
      );
    }

    await page.locator('#nombre_completo').fill('Cliente Prueba E2E');
    await page.locator('#telefono').fill('1112345678');

    const cp = page.locator('#codigo_postal');
    if (await cp.isVisible().catch(() => false)) {
      await cp.fill('1425');
      await cp.blur();

      // Esperar resolución de cotización (éxito o error) o timeout informativo.
      const envioInfo = page.getByText(
        /Envío:|No realizamos envíos|Ingresá tu código postal|código postal|Calculando envío/i,
      );
      await expect(envioInfo.first()).toBeVisible({ timeout: 20000 });

      const errorEnvio = page.getByText(
        /No realizamos envíos|No pudimos calcular|código postal.*válido/i,
      );
      if (await errorEnvio.first().isVisible().catch(() => false)) {
        const msg = (await errorEnvio.first().textContent())?.trim();
        throw new Error(
          `Checkout bloqueado por envío/CP (no es fallo del botón): ${msg ?? 'error de envío visible'}`,
        );
      }

      // Si sigue "Calculando envío..." mucho tiempo, el submit quedará bloqueado por falta de estimado.
      const calculando = page.getByText(/Calculando envío/i);
      if (await calculando.isVisible().catch(() => false)) {
        await expect(calculando).toBeHidden({ timeout: 15000 }).catch(() => {
          throw new Error(
            'Cotización de envío quedó en "Calculando envío..." — el botón puede estar funcional pero el submit se bloquea sin estimado.',
          );
        });
      }
    }

    // Capturar respuesta/errores visibles tras el click.
    await finalizar.click();

    // Resultado esperado: navegación a /pedido/<id>.
    const navigated = await page
      .waitForURL(/\/pedido\/.+/, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);

    if (navigated) return;

    // Diagnóstico de fallo sin navegación.
    const toastError = page.locator('[role="status"], [data-sonner-toast], .toast').filter({
      hasText: /error|No se encontraron|productos|envío|código postal|procesar/i,
    });
    const toastMsg = (await toastError.first().isVisible().catch(() => false))
      ? (await toastError.first().textContent())?.trim()
      : null;

    const stillOnCarrito = /\/carrito/.test(page.url());
    const finalLabel = (await finalizar.textContent().catch(() => null))?.trim();
    throw new Error(
      [
        'El botón no completó el flujo esperado (sin navegación a /pedido/:id).',
        `url=${page.url()} stillOnCarrito=${stillOnCarrito}`,
        `buttonLabel="${finalLabel ?? ''}"`,
        toastMsg ? `toast/errorVisible="${toastMsg}"` : 'toast/errorVisible=(no detectado)',
        'Posibles causas: server action rechazó (producto ID no existe, tenant/default, envío server-side), validación cliente bloqueó, o handler no disparó.',
      ].join(' | '),
    );
  });
});
