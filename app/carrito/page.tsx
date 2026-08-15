'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCarritoStore } from '../../src/features/carrito/store';
import { generarLinkWhatsApp } from '../../src/features/carrito/actions/generarCheckout';

export default function CarritoPage() {
    const { items, removerItem, actualizarCantidad, limpiarCarrito, obtenerTotal } = useCarritoStore();
    const [isPending, setIsPending] = useState(false);

    const handleCheckoutWhatsApp = async () => {
        if (items.length === 0) return;

        setIsPending(true);
        try {
            const itemsMapeados = items.map((item) => ({
                id: item.id,
                cantidad: item.cantidad,
            }));

            const url = await generarLinkWhatsApp(itemsMapeados);
            
            // Limpiamos el carrito porque la compra ya se procesó
            limpiarCarrito();

            // Redireccionamos a la URL de WhatsApp
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Ocurrió un error al procesar la compra');
        } finally {
            setIsPending(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] bg-background text-foreground px-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío 🛒</h1>
                <p className="text-muted-foreground mb-8">¡Es un buen momento para buscar unas medias geniales!</p>
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
                        <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-foreground text-lg">{item.nombre}</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Talle: {item.talle_seleccionado}</span>
                                <span className="text-border">|</span>
                                <div className="flex items-center gap-2 border border-border rounded-md px-2 py-0.5 bg-background">
                                    <button
                                        disabled={item.cantidad <= 1}
                                        onClick={() => actualizarCantidad(item.id, item.talle_seleccionado, item.cantidad - 1)}
                                        className="text-foreground hover:opacity-80 disabled:opacity-30 px-1 font-bold"
                                        title="Reducir cantidad"
                                    >
                                        -
                                    </button>
                                    <span className="font-semibold text-foreground px-1">{item.cantidad}</span>
                                    <button
                                        onClick={() => actualizarCantidad(item.id, item.talle_seleccionado, item.cantidad + 1)}
                                        className="text-foreground hover:opacity-80 px-1 font-bold"
                                        title="Aumentar cantidad"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-bold text-foreground text-lg">${item.precio * item.cantidad}</span>
                            <button
                                onClick={() => removerItem(item.id, item.talle_seleccionado)}
                                className="text-destructive hover:opacity-80 font-medium text-sm transition-colors p-2"
                                title="Eliminar producto">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumen Total y Checkout */}
            <div className="mt-8 p-6 border border-border rounded-lg bg-muted flex flex-col items-end gap-4">
                <div className="flex items-center gap-4 text-2xl">
                    <span className="text-foreground">Total:</span>
                    <span className="font-extrabold text-blue-600">${obtenerTotal()}</span>
                </div>

                <button
                    onClick={handleCheckoutWhatsApp}
                    disabled={isPending}
                    className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isPending ? 'Procesando...' : 'Finalizar Compra por WhatsApp'}
                </button>
            </div>
        </div>
    );
}
