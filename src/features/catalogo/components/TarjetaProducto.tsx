'use client';

import toast from 'react-hot-toast';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCarritoStore } from '@/src/features/carrito/store';
import { useDrawerCarritoStore } from '@/src/features/carrito/drawerStore';
import { useFavoritosStore } from '@/src/features/favoritos/store/useFavoritosStore';
import { Heart } from 'lucide-react';
import type { Database } from '@/src/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

export function TarjetaProducto({ producto }: { producto: Producto }) {
    const { nombre, precio, stock, talles_disponibles, imagen_url, id } = producto;
    const agregarItem = useCarritoStore((state) => state.agregarItem);
    const openDrawer = useDrawerCarritoStore((state) => state.openDrawer);
    const { toggleFavorito, esFavorito } = useFavoritosStore();
    const isFavorito = esFavorito(id);

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

        openDrawer();
    };

    const handleQuickAdd = (e: React.MouseEvent) => {
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

        toast.success(`${nombre} agregado 🛒`, { duration: 1500 });
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

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorito(producto);
                        }}
                        className={`absolute top-2 right-2 z-20 p-2 rounded-full transition-all duration-200 active:scale-90 cursor-pointer shadow-sm ${
                            isFavorito
                                ? 'bg-white dark:bg-zinc-900 text-red-500 fill-red-500'
                                : 'bg-white/80 dark:bg-zinc-900/80 text-gray-600 hover:text-red-500'
                        }`}
                        title={isFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                        <Heart className="w-5 h-5" />
                    </button>
                </div>

                {/* Info Textual (Título y Precio) */}
                <div className="p-3 pb-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{nombre}</h3>
                    <span className="text-lg font-extrabold text-foreground mt-0.5">
                        ${Number(precio).toLocaleString('es-AR')}
                    </span>
                </div>
            </Link>

            {/* Zona de Acción (Quick Add CRO + Talles) */}
            <div className="p-3 flex flex-col gap-3 mt-auto">
                <div className="flex items-center justify-between gap-2">
                    {/* Selector de Talles (Píldoras) */}
                    {talles_disponibles && talles_disponibles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 flex-1">
                            {talles_disponibles.map((talle) => (
                                <button
                                    key={talle}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTalleSeleccionado(talle);
                                    }}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border cursor-pointer ${
                                        talleSeleccionado === talle
                                            ? 'bg-foreground text-background border-foreground shadow-md'
                                            : 'bg-transparent text-zinc-500 border-border hover:border-foreground hover:text-foreground'
                                    }`}>
                                    {talle}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Botón de Agregar Rápido (+) alineado con los talles */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleQuickAdd(e);
                        }}
                        disabled={stock <= 0}
                        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-foreground text-white hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all duration-200 animate-[pulse_2s_infinite] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                        title="Agregar al carrito">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* CTA Full Width: Botón Comprar destacado con animación de glow/pulse sutil */}
                <button
                    onClick={handleAgregarCarrito}
                    disabled={stock <= 0}
                    className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg text-sm font-extrabold transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 animate-[pulse_2s_infinite] disabled:opacity-50 disabled:cursor-not-allowed">
                    Comprar
                </button>
            </div>
        </div>
    );
}
