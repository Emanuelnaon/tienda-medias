import { test, expect } from '@playwright/test';

test.describe('Flujo principal de compra', () => {
    test('debe permitir agregar un producto al carrito y visualizar el botón de checkout', async ({ page }) => {
        // 1. Navegar a la página principal
        await page.goto('/');

        // 2. Esperar a que el catálogo cargue y tomar el primer elemento/tarjeta de producto
        const primeraTarjeta = page.locator('a[href^="/producto/"]').first();
        await expect(primeraTarjeta).toBeVisible({ timeout: 15000 });

        // 3. Forzar el hover sobre la tarjeta por si los botones dependen de group-hover
        await primeraTarjeta.hover();

        // 4. Buscar el botón de agregar dentro de la primera tarjeta activa o en la grilla
        const botonAgregar = page.getByRole('button', { name: /agregar al carrito/i }).first();

        // Si el botón está presente, lo aseguramos en viewport y hacemos click
        await botonAgregar.scrollIntoViewIfNeeded();
        await expect(botonAgregar).toBeVisible({ timeout: 5000 });
        await botonAgregar.click({ force: true });

        // 5. Ir al Carrito
        const linkCarrito = page.locator('a[href="/carrito"]').first();
        await expect(linkCarrito).toBeVisible();
        await linkCarrito.click();

        // Verificar URL
        await expect(page).toHaveURL(/\/carrito/);

        // 6. Verificar elementos dentro del carrito
        // Si el carrito usa ícono de basura o texto de eliminar
        const botonEliminar = page
            .locator('button')
            .filter({ hasText: /eliminar/i })
            .or(page.locator('button:has(svg)'))
            .first();
        await expect(botonEliminar).toBeVisible({ timeout: 5000 });

        // 7. Verificar que el botón de finalizar compra/checkout por WhatsApp exista
        const botonFinalizar = page
            .getByRole('link', { name: /comprar por whatsapp|finalizar/i })
            .or(page.getByRole('button', { name: /comprar por whatsapp|finalizar/i }))
            .first();

        await expect(botonFinalizar).toBeVisible();
    });
});
