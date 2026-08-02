import React from 'react';
import Link from 'next/link';
import { BotonComprarWhatsApp } from './BotonComprarWhatsApp';
import type { Database } from '@/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

export function TarjetaProducto({ producto }: { producto: Producto }) {
    const { nombre, descripcion, precio, stock, talles_disponibles, imagen_url } = producto;

    return (
        <Link
            href={`/producto/${producto.id}`}
            className="group flex flex-col border border-border rounded-lg overflow-hidden hover:border-foreground transition-colors">
            <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 w-full">
                {/* Imagen del producto */}
                <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center">
                    {imagen_url ? (
                        <img
                            src={imagen_url}
                            alt={'medias'}
                            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-12 h-12 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span className="text-xs">Sin imagen</span>
                        </div>
                    )}
                    {/* Insignia de Stock */}
                    <div
                        className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${stock > 5 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        Stock: {stock}
                    </div>
                </div>

                {/* Contenido */}
                <div className="flex flex-col flex-1 p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{nombre}</h3>
                    <p className="text-sm text-gray-600 mb-3 flex-1 line-clamp-2">
                        {descripcion || 'Sin descripción disponible.'}
                    </p>

                    {/* Talles */}
                    {talles_disponibles && talles_disponibles.length > 0 && (
                        <div className="mb-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Talles:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {talles_disponibles.map((talle) => (
                                    <span
                                        key={talle}
                                        className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200 font-medium">
                                        {talle}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Precio y Botón de WhatsApp */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto pt-2 gap-2 border-t border-gray-100">
                        <span className="text-xl font-extrabold text-blue-600">
                            ${Number(precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        <BotonComprarWhatsApp nombreProducto={nombre} precio={Number(precio)} />
                    </div>
                </div>
            </div>
        </Link>
    );
}
