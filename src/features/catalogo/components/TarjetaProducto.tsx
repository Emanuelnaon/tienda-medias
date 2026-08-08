'use client';

import toast from 'react-hot-toast';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCarritoStore } from '@/src/features/carrito/store'; // Ajusta la ruta relativa si es necesario
import type { Database } from '@/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

export function TarjetaProducto({ producto }: { producto: Producto }) {
    const { nombre, descripcion, precio, stock, talles_disponibles, imagen_url, id } = producto;
    const agregarItem = useCarritoStore((state) => state.agregarItem);

    // Seleccionamos el primer talle por defecto para agilizar
    const [talleSeleccionado, setTalleSeleccionado] = useState(talles_disponibles?.[0] || '');

    const handleAgregarCarrito = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!talleSeleccionado) {
            toast.error('Selecciona un talle primero');
            return;
        }
      
        agregarItem({
            id,
            nombre,
            precio: Number(precio),
            cantidad: 1,
            talle_seleccionado: talleSeleccionado,
        });
        // Podrías cambiar este alert por un Toast más adelante
        toast.success(`${nombre} agregado 🛒`);
    };

    const handleCompartir = async () => {
        const url = `${window.location.origin}/producto/${id}`;
        if (navigator.share) {
            await navigator.share({ title: nombre, url });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('¡Enlace copiado!');
        }
    };

    return (
        <div className="group flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 w-full overflow-hidden relative">
            {/* PARTE 1: NAVEGACIÓN AL DETALLE (Imagen y Título) */}
            <Link href={`/producto/${id}`} className="flex-1 flex flex-col">
                {/* Imagen */}
                <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {imagen_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={imagen_url}
                            alt={nombre}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <span className="text-xs text-gray-400">Sin imagen</span>
                    )}
                    {/* Insignia de Stock flotante sobre la imagen (no estorba) */}
                    {stock > 0 && (
                        <div
                            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full ${stock > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {stock > 5 ? 'En Stock' : `¡Solo ${stock}!`}
                        </div>
                    )}
                </div>

                {/* Info Textual */}
                <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 uppercase">{nombre}</h3>
                    <span className="text-lg font-extrabold text-blue-600 mt-1">
                        ${Number(precio).toLocaleString('es-AR')}
                    </span>
                </div>
            </Link>

            {/* PARTE 2: BARRA DE ACCIÓN (Quick Add - Fuera del Link) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 border-t border-gray-100">
                {/* Fila 1: Talle */}
                {talles_disponibles && talles_disponibles.length > 0 && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase hidden sm:block">Talle</label>
                        <select
                            value={talleSeleccionado}
                            onChange={(e) => setTalleSeleccionado(e.target.value)}
                            className="w-16 text-sm text-black bg-white border border-gray-300 rounded px-1 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer">
                            {talles_disponibles.map((talle) => (
                                <option key={talle} value={talle}>
                                    {talle}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Fila 2: Botones de Acción */}
                <div className="flex items-center gap-2 flex-1 justify-end min-w-fit">
                    {/* Compartir */}
                    <button
                        onClick={handleCompartir}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Compartir">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                        </svg>
                    </button>

                    {/* Agregar al Carrito */}
                    <button
                        onClick={handleAgregarCarrito}
                        className="flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white py-1.5 px-3 rounded text-sm font-semibold transition-colors whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        <span>Agregar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
