'use client';

import Link from 'next/link';
import { useCarritoStore } from '../../src/features/carrito/store';

export default function CarritoPage() {
    const { items, removerItem, limpiarCarrito, obtenerTotal } = useCarritoStore();

    const handleCheckoutWhatsApp = () => {
        // REEMPLAZA ESTE NÚMERO POR EL TUYO (Incluye código de país, ej: 54911 para CABA/GBA)
        const numeroWhatsApp = '5491172396962';

        if (items.length === 0) return;

        let mensaje = '👋 Hola! Quiero realizar el siguiente pedido:\n\n';

        items.forEach((item) => {
            mensaje += `▪ ${item.cantidad}x ${item.nombre} (Talle: ${item.talle_seleccionado}) - $${item.precio * item.cantidad}\n`;
        });

        mensaje += `\n💰 *Total a pagar: $${obtenerTotal()}*`;
        mensaje += '\n\nPor favor, confirmame cómo avanzamos con el pago y envío. ¡Gracias!';

        // Codificamos el mensaje para que los espacios y saltos de línea funcionen en la URL
        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

        // Limpiamos el carrito porque la compra ya se envió
        limpiarCarrito();

        // Abrimos WhatsApp en una nueva pestaña
        window.open(url, '_blank');
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] bg-background text-foreground px-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío 🛒</h1>
                <p className="text-zinc-500 mb-8">¡Es un buen momento para buscar unas medias geniales!</p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-foreground text-background font-semibold rounded-md hover:opacity-90 transition-opacity">
                    Volver al Catálogo
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 bg-background flex-1 h-full">
            <h1 className="text-3xl font-bold text-foreground mb-8">Tu Carrito</h1>

            <div className="flex flex-col gap-4">
                {/* Lista de Productos */}
                {items.map((item) => (
                    <div
                        key={`${item.id}-${item.talle_seleccionado}`}
                        className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-lg">{item.nombre}</span>
                            <span className="text-sm text-zinc-500">
                                Talle: {item.talle_seleccionado} | Cantidad: {item.cantidad}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-bold text-foreground text-lg">${item.precio * item.cantidad}</span>
                            <button
                                onClick={() => removerItem(item.id, item.talle_seleccionado)}
                                className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors p-2"
                                title="Eliminar producto">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumen Total y Checkout */}
            <div className="mt-8 p-6 border border-border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-end gap-4">
                <div className="flex items-center gap-4 text-2xl">
                    <span className="text-foreground">Total:</span>
                    <span className="font-extrabold text-blue-600">${obtenerTotal()}</span>
                </div>

                <button
                    onClick={handleCheckoutWhatsApp}
                    className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors text-lg shadow-md">
                    Finalizar Compra por WhatsApp
                </button>
            </div>
        </div>
    );
}
