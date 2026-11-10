import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Flujo principal de compra', () => {
    test('debe permitir agregar un producto al carrito y visualizar el botón de checkout', async ({ page }) => {
        // 1. Navegar a la página principal
        await page.goto('/');

        // 2. Esperar a que el catálogo cargue y tomar el primer elemento/tarjeta de producto
        const primeraTarjeta = page.locator('a[href^="/producto/"]').first();
        await expect(primeraTarjeta).toBeVisible({ timeout: 15000 });

        // 3. Buscar el botón "Comprar" dentro de la primera tarjeta
        const primerBotonComprar = page.getByRole('button', { name: /comprar/i }).first();
        await expect(primerBotonComprar).toBeVisible({ timeout: 5000 });
        await primerBotonComprar.click();

        // 4. Ir al Carrito
        const linkCarrito = page.getByRole('link', { name: /carrito/i }).first();
        await expect(linkCarrito).toBeVisible();
        await linkCarrito.click();

        // Verificar URL
        await expect(page).toHaveURL(/\/carrito/);

        // 5. Verificar elementos dentro del carrito
        const botónEliminar = page.getByRole('button', { name: /Eliminar/i }).first();
        await expect(botónEliminar).toBeVisible({ timeout: 5000 });

        // 6. Verificar que el botón de finalizar compra/checkout por WhatsApp exista
        const botónFinalizar = page.getByRole('button', {
            name: /Finalizar compra por WhatsApp/i,
        });

        await expect(botónFinalizar).toBeVisible();

        // 7. Auditoría de accesibilidad en la página del carrito
        const accessibilityResults = await new AxeBuilder({ page }).analyze();
        expect(accessibilityResults.violations).toEqual([]);
    });
});