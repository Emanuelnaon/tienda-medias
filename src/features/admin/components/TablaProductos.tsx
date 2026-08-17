'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/src/lib/supabase/client';
import type { Database } from '@/src/types/supabase';
import { obtenerLinkCompartirAdmin } from '../../carrito/actions/generarCheckout';

type Producto = Database['public']['Tables']['productos']['Row'];

export function TablaProductos({ productosIniciales }: { productosIniciales: Producto[] }) {
    const [productos, setProductos] = useState<Producto[]>(productosIniciales);
    const [copiandoId, setCopiandoId] = useState<string | null>(null);
    const supabase = createClient();

    const handleEliminar = async (id: string, nombre: string) => {
        const confirmar = window.confirm(`¿Eliminar permanentemente "${nombre}"?\nEsta acción no se puede deshacer.`);
        if (!confirmar) return;

        try {
            const { error } = await supabase.from('productos').delete().eq('id', id);

            if (error) {
                throw new Error(error.message);
            }

            setProductos((prev) => prev.filter((p) => p.id !== id));
            toast.success(`"${nombre}" eliminado del catálogo.`);
        } catch (error: unknown) {
            const mensajeError = error instanceof Error ? error.message : String(error);
            toast.error(`Error al eliminar el producto: ${mensajeError}`);
        }
    };

    const handleCopiarLink = async (productoId: string) => {
        setCopiandoId(productoId);
        try {
            const url = await obtenerLinkCompartirAdmin(productoId);
            await navigator.clipboard.writeText(url);
            toast.success('¡Link copiado!');
        } catch (error: unknown) {
            console.error(error);
            const mensajeError = error instanceof Error ? error.message : String(error);
            toast.error(`Error al copiar el enlace: ${mensajeError}`);
        } finally {
            setCopiandoId(null);
        }
    };

    const handlePrepararPublicacion = async (producto: Producto) => {
        try {
            const codigoMostrar = producto.codigo_corto || 'Sin código';
            const textoGenerado = `🔥 ¡Atención a este ingreso!\n✨ ${producto.nombre}    💰 Precio: $${producto.precio}\n\n🛒 Búscalo súper rápido en nuestra web ingresando el código: #${codigoMostrar}\n🔗 Link directo en nuestra bio.`;

            await navigator.clipboard.writeText(textoGenerado);
            toast.success('¡Copy guardado!');

            setTimeout(() => {
                window.open('https://www.instagram.com/', '_blank');
            }, 600);
        } catch (error: unknown) {
            console.error(error);
            toast.error('Error al copiar el texto. Verifica los permisos del navegador.');
        }
    };

    const handleActualizarStock = async (id: string, stockActual: number, incremento: number) => {
        const nuevoStock = stockActual + incremento;
        if (nuevoStock < 0) return;

        setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p)));

        try {
            const { error } = await supabase.from('productos').update({ stock: nuevoStock }).eq('id', id);

            if (error) {
                throw new Error(error.message);
            }
        } catch (error: unknown) {
            const mensajeError = error instanceof Error ? error.message : String(error);
            toast.error(`Error al actualizar el stock: ${mensajeError}`);
            setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, stock: stockActual } : p)));
        }
    };

    return (
        <div className="flex flex-col gap-4 text-foreground bg-background">
            {/* Barra de herramientas superior */}
            <div className="flex justify-between items-center bg-background text-foreground">
                <div className="text-sm text-foreground/70 font-medium">Total: {productos.length} productos</div>
                <Link
                    href="/admin/nuevo"
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Producto
                </Link>
            </div>

            {/* Contenedor de la Tabla con scroll horizontal para Mobile */}
            <div className="bg-background border border-border rounded-lg shadow-sm overflow-x-auto text-foreground">
                <table className="w-full text-left border-collapse min-w-[800px] bg-background">
                    <thead>
                        <tr className="bg-background border-b border-border text-sm text-foreground/70 uppercase tracking-wider">
                            <th className="p-4 font-semibold">Imagen</th>
                            <th className="p-4 font-semibold">Nombre</th>
                            <th className="p-4 font-semibold">Precio</th>
                            <th className="p-4 font-semibold">Stock</th>
                            <th className="p-4 font-semibold">Categoría</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {productos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-foreground/60 bg-background">
                                    No hay productos en el catálogo.
                                </td>
                            </tr>
                        ) : (
                            productos.map((producto) => (
                                <tr key={producto.id} className="hover:bg-foreground/5 transition-colors bg-background">
                                    {/* 1. Imagen */}
                                    <td className="p-4">
                                        <div className="w-12 h-12 bg-transparent rounded overflow-hidden flex items-center justify-center border border-border">
                                            {producto.imagen_url ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={producto.imagen_url}
                                                    alt={producto.nombre}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-foreground/50">Sin Img</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* 2. Nombre + Talles */}
                                    <td className="p-4">
                                        <div className="font-bold text-foreground">{producto.nombre}</div>
                                        <div className="text-xs text-foreground/60 truncate max-w-[200px]">
                                            {producto.talles_disponibles?.join(', ') || 'Sin talles'}
                                        </div>
                                    </td>

                                    {/* 3. Precio */}
                                    <td className="p-4 font-mono font-medium text-foreground">
                                        ${Number(producto.precio).toLocaleString('es-AR')}
                                    </td>

                                    {/* 4. Stock con botones (+ / -) */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={producto.stock <= 0}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleActualizarStock(producto.id, producto.stock, -1);
                                                }}
                                                className="w-6 h-6 flex items-center justify-center rounded-md border border-border bg-background hover:bg-foreground hover:text-background text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                title="Restar 1 unidad">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M20 12H4"
                                                    />
                                                </svg>
                                            </button>

                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border border-border ${
                                                    producto.stock > 5
                                                        ? 'text-foreground'
                                                        : producto.stock > 0
                                                          ? 'text-foreground/80'
                                                          : 'text-foreground/50'
                                                }`}>
                                                {producto.stock} uds
                                            </span>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleActualizarStock(producto.id, producto.stock, 1);
                                                }}
                                                className="w-6 h-6 flex items-center justify-center rounded-md border border-border bg-background hover:bg-foreground hover:text-background text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                title="Sumar 1 unidad">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>

                                    {/* 5. Categoría (¡AHORA EN SU PROPIA COLUMNA!) */}
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-foreground border border-border">
                                            {producto.categoria || 'Sin categoría'}
                                        </span>
                                    </td>

                                    {/* 6. Acciones */}
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={async () => await handlePrepararPublicacion(producto)}
                                                className="p-2 text-foreground/70 hover:text-foreground bg-transparent border border-border hover:bg-foreground/5 rounded transition-colors cursor-pointer"
                                                title="Preparar Publicación (Instagram)">
                                                <svg
                                                    className="w-4 h-4"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round">
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                                </svg>
                                            </button>
                                            <button
                                                disabled={copiandoId === producto.id}
                                                onClick={() => handleCopiarLink(producto.id)}
                                                className="p-2 text-foreground/70 hover:text-foreground bg-transparent border border-border hover:bg-foreground/5 rounded transition-colors disabled:opacity-50 cursor-pointer"
                                                title="Copiar Link de WhatsApp">
                                                {copiandoId === producto.id ? (
                                                    <div className="w-4 h-4 border-2 border-foreground/70 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                            <Link
                                                href={`/admin/editar/${producto.id}`}
                                                className="p-2 text-foreground/70 hover:text-foreground bg-transparent border border-border hover:bg-foreground/5 rounded transition-colors cursor-pointer"
                                                title="Editar">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleEliminar(producto.id, producto.nombre)}
                                                className="p-2 text-foreground/70 hover:text-foreground bg-transparent border border-border hover:bg-foreground/5 rounded transition-colors cursor-pointer"
                                                title="Eliminar">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
