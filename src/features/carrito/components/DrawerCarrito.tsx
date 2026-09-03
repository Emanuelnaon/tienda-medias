'use client';

import React, { useEffect } from 'react';
import { useCarritoStore } from '@/src/features/carrito/store';
import { FormularioCheckout } from '@/src/features/carrito/components/FormularioCheckout';

interface DrawerCarritoProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

export function DrawerCarrito({ isOpen, onClose }: DrawerCarritoProps) {
    const { items, removerItem, actualizarCantidad, obtenerTotal } = useCarritoStore();

    // Bloquear scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <button
                    type="button"
                    aria-label="Cerrar carrito"
                    className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-99998 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Bottom Sheet / Side Drawer */}
            <div
                className={`fixed z-99999 bg-background text-foreground transition-transform duration-300 ease-in-out flex flex-col
                    bottom-0 left-0 right-0 w-full rounded-t-2xl max-h-[85vh]
                    md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-96 md:rounded-none md:max-h-screen
                    ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
                `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                    <h2 className="text-lg font-bold flex items-center gap-2">Resumen del Pedido 🛒</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-transparent text-foreground border border-border hover:border-foreground rounded-full transition-colors"
                        aria-label="Cerrar carrito">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-base font-semibold mb-2">Tu carrito está vacío</p>
                            <button
                                onClick={onClose}
                                className="text-xs font-bold underline text-foreground hover:opacity-85">
                                Seguir buscando
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {items.map((item) => (
                                <div
                                    key={`${item.id}-${item.talle_seleccionado}`}
                                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-foreground text-sm line-clamp-1">
                                            {item.nombre}
                                        </span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Talle: {item.talle_seleccionado}</span>
                                            <span className="text-border">|</span>
                                            <div className="flex items-center gap-1.5 border border-border rounded px-1.5 py-0.5 bg-background">
                                                <button
                                                    disabled={item.cantidad <= 1}
                                                    onClick={() =>
                                                        actualizarCantidad(
                                                            item.id,
                                                            item.talle_seleccionado,
                                                            item.cantidad - 1,
                                                        )
                                                    }
                                                    className="text-foreground hover:opacity-80 disabled:opacity-30 font-bold text-xs px-1">
                                                    -
                                                </button>
                                                <span className="font-semibold text-foreground text-xs">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        actualizarCantidad(
                                                            item.id,
                                                            item.talle_seleccionado,
                                                            item.cantidad + 1,
                                                        )
                                                    }
                                                    className="text-foreground hover:opacity-80 font-bold text-xs px-1">
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-foreground text-sm">
                                            ${item.precio * item.cantidad}
                                        </span>
                                        <button
                                            onClick={() => removerItem(item.id, item.talle_seleccionado)}
                                            className="text-destructive hover:opacity-80 font-medium text-[11px] p-1">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 border-t border-border bg-background flex flex-col gap-3">
                        <div className="flex items-center justify-between text-lg">
                            <span className="text-foreground font-medium">Total:</span>
                            <span className="font-extrabold text-blue-600">${obtenerTotal()}</span>
                        </div>
                        <FormularioCheckout onCompleted={onClose} />
                    </div>
                )}
            </div>
        </>
    );
}
