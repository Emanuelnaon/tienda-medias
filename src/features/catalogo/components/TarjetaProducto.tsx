'use client';

import toast from 'react-hot-toast';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCarritoStore } from '@/src/features/carrito/store';
import type { Database } from '@/src/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

export function TarjetaProducto({ producto }: { producto: Producto }) {
    const { nombre, precio, stock, talles_disponibles, imagen_url, id } = producto;
    const agregarItem = useCarritoStore((state) => state.agregarItem);

    // Seleccionamos el primer talle por defecto
    const [talleSeleccionado, setTalleSeleccionado] = useState(talles_disponibles?.[0] || '');

    const handleAgregarCarrito = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!talleSeleccionado) {
            toast.error('Selecciona un talle');
            return;
        }

        agregarItem({
            id,
            nombre,
            precio: Number(precio),
            cantidad: 1,
            talle_seleccionado: talleSeleccionado,
        });

        toast.success(`${nombre} agregado 🛒`);
    };

    // Lógica para etiquetas de escasez (FOMO)
    const renderEtiqueta = () => {
        if (stock <= 0)
            return (
                <div className="absolute top-2 left-2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                    Agotado
                </div>
            );
        if (stock <= 3)
            return (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider animate-pulse">
                    ¡Últimos {stock}!
                </div>
            );
        return (
            <div className="absolute top-2 left-2 bg-background text-foreground text-[10px] font-bold px-2 py-1 rounded-sm border border-border uppercase tracking-wider shadow-sm">
                Nuevo
            </div>
        );
    };

    return (
        /* Efectos 3D de Tailwind: hover:-translate-y-1 hover:shadow-xl */
        <div className="group flex flex-col bg-background border border-border rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full overflow-hidden relative">
            <Link href={`/producto/${id}`} className="flex-1 flex flex-col">
                {/* Contenedor de Imagen */}
                <div className="relative w-full aspect-4/5 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                    {imagen_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={imagen_url}
                            alt={nombre}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <span className="text-xs text-zinc-400">Sin imagen</span>
                    )}

                    {renderEtiqueta()}
                </div>

                {/* Info Textual (Título y Precio) */}
                <div className="p-3 pb-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{nombre}</h3>
                    <span className="text-lg font-extrabold text-foreground mt-0.5">
                        ${Number(precio).toLocaleString('es-AR')}
                    </span>
                </div>
            </Link>

            {/* Zona de Acción (Quick Add CRO) */}
            <div className="p-3 flex flex-col gap-3 mt-auto">
                {/* Selector de Talles (Píldoras) */}
                {talles_disponibles && talles_disponibles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {talles_disponibles.map((talle) => (
                            <button
                                key={talle}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTalleSeleccionado(talle);
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border ${
                                    talleSeleccionado === talle
                                        ? 'bg-foreground text-background border-foreground shadow-md'
                                        : 'bg-transparent text-zinc-500 border-border hover:border-foreground hover:text-foreground'
                                }`}>
                                {talle}
                            </button>
                        ))}
                    </div>
                )}

                {/* CTA Full Width */}
                <button
                    onClick={handleAgregarCarrito}
                    disabled={stock <= 0}
                    className="w-full flex items-center justify-center gap-2 bg-foreground hover:bg-zinc-800 text-background py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Agregar al Pedido
                </button>
            </div>
        </div>
    );
}
