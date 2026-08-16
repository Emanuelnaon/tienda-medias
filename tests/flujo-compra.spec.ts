import { test, expect } from '@playwright/test';

test.describe('Flujo principal de compra', () => {
    test('debe permitir agregar un producto al carrito y visualizar el botón de checkout', async ({ page }) => {
        // 1. Navegar a la página principal
        await page.goto('/');

        // 2. Verificar que el catálogo haya renderizado correctamente
        // Buscamos que exista al menos una tarjeta de producto visible
        const primeraTarjeta = page.locator('.group').first();
        await expect(primeraTarjeta).toBeVisible({ timeout: 15000 });

        // 3. Hacer clic en el botón de "Agregar al Pedido" del primer producto disponible
        const botonAgregar = page.locator('button:has-text("Agregar al Pedido")').first();
        await expect(botonAgregar).toBeVisible();
        await botonAgregar.click();

        // 4. Abrir el carrito haciendo clic en el enlace/ícono del carrito
        const linkCarrito = page.locator('a[href="/carrito"]').first();
        await expect(linkCarrito).toBeVisible();
        await linkCarrito.click();

        // Verificar que hayamos navegado a la página del carrito
        await expect(page).toHaveURL(/\/carrito/);

        // 5. Verificar que el producto agregado aparezca dentro del carrito
        // En el carrito, cada item tiene un botón "Eliminar"
        const botonEliminar = page.locator('button:has-text("Eliminar")').first();
        await expect(botonEliminar).toBeVisible();

        // 6. Verificar que el botón de "Finalizar Compra por WhatsApp" esté visible en el resumen
        const botonFinalizar = page.getByRole('button', { name: /Finalizar Compra/i });
        await expect(botonFinalizar).toBeVisible();
    });
});
