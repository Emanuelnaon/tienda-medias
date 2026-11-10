import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Flujo principal de compra', () => {
    test('debe permitir agregar un producto al carrito y visualizar el botón de checkout', async ({ page }) => {
        // 1. Navegar a la página principal
        await page.goto('/');

        // Keep product identity and purchase action scoped to the same available card.
        const primeraTarjeta = page.locator('div:has(> a[href^="/producto/"])').filter({
            has: page.getByRole('button', { name: 'Comprar', exact: true }),
        }).first();
        await expect(primeraTarjeta, 'Staging requiere un producto disponible para el humo').toBeVisible({ timeout: 15000 });
        const nombreProducto = await primeraTarjeta.getByRole('heading', { level: 3 }).innerText();
        const primerBotonComprar = primeraTarjeta.getByRole('button', { name: 'Comprar', exact: true });
        await expect(primerBotonComprar).toBeEnabled();
        await primerBotonComprar.click();

        const resumen = page.getByRole('heading', { name: /Resumen del Pedido/ }).locator('..').locator('..');
        await expect(resumen.getByText(nombreProducto, { exact: true })).toBeVisible();
        await resumen.getByRole('button', { name: 'Cerrar carrito', exact: true }).click();

        // 4. Ir al Carrito
        const linkCarrito = page.getByRole('link', { name: /carrito/i }).first();
        await expect(linkCarrito).toBeVisible();
        await linkCarrito.click();

        // Verificar URL
        await expect(page).toHaveURL(/\/carrito/);

        // 5. Verificar elementos dentro del carrito
        const carrito = page.getByRole('main');
        await expect(carrito.getByText(nombreProducto, { exact: true })).toBeVisible();
        const botónEliminar = carrito.getByRole('button', { name: /Eliminar/i }).first();
        await expect(botónEliminar).toBeVisible({ timeout: 5000 });

        // 6. Verificar que el botón de finalizar compra/checkout por WhatsApp exista
        const botónFinalizar = carrito.getByRole('button', {
            name: /Finalizar compra por WhatsApp/i,
        });

        await expect(botónFinalizar).toBeVisible();

        // 7. Auditoría de accesibilidad en la página del carrito
        const accessibilityResults = await new AxeBuilder({ page }).analyze();
        expect(
            accessibilityResults.violations.map(({ id, nodes }) => `${id}: ${nodes.length} nodos`).join(', '),
            'Violaciones Axe en carrito (mantener visibles como baseline hasta el lote visual correspondiente)',
        ).toBe('');
    });
});
