'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Database } from '@/src/types/supabase';
import { obtenerLinkCompartirAdmin } from '@/src/features/carrito/actions/generarCheckout';
import { eliminarProductoAction } from '@/src/features/admin/actions/productosActions';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;
type Producto = Database['public']['Tables']['productos']['Row'] & {
    categorias?: CategoriaResumen | null;
};

export type TablaProductosProps = Readonly<{
    productosIniciales: ReadonlyArray<Producto>;
}>;

function obtenerColorBadgeStock(stock: number): string {
    if (stock > 5) return 'bg-emerald-soft text-emerald-soft-foreground border-emerald';
    if (stock > 0) return 'bg-warning text-warning-foreground border-warning';
    return 'bg-muted text-muted-foreground border-border';
}

export function TablaProductos({ productosIniciales }: TablaProductosProps) {
    const [productos, setProductos] = useState<ReadonlyArray<Producto>>(productosIniciales);
    const [copiandoId, setCopiandoId] = useState<string | null>(null);

    const handleEliminar = async (id: string, nombre: string) => {
        const confirmar = window.confirm(`¿Eliminar permanentemente "${nombre}"?\nEsta acción no se puede deshacer.`);
        if (!confirmar) return;

        try {
            await eliminarProductoAction(id);
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
                window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
            }, 600);
        } catch (error: unknown) {
            console.error(error);
            toast.error('Error al copiar el texto. Verifica los permisos del navegador.');
        }
    };

    return (
        <div className="flex min-w-0 w-full flex-col gap-5 text-foreground">
            <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                <div className="text-xs font-bold text-muted-foreground tabular-nums md:text-sm">Total: {productos.length} productos</div>
                <Link
                    href="/admin/nuevo"
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-xs transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Producto
                </Link>
            </div>

            <div className="min-w-0 max-w-full overflow-x-auto rounded-2xl border border-border bg-surface text-foreground shadow-xs">
                <table className="w-full min-w-208 border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-border bg-background text-xs tracking-wider text-muted-foreground uppercase">
                            <th className="p-4 font-semibold">Imagen</th>
                            <th className="p-4 font-semibold">Nombre</th>
                            <th className="p-4 font-semibold">Precio</th>
                            <th className="p-4 font-semibold">Stock Total</th>
                            <th className="p-4 font-semibold">Categoría</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {productos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                    No hay productos en el catálogo.
                                </td>
                            </tr>
                        ) : (
                            productos.map((producto) => (
                                <tr key={producto.id} className="bg-surface transition-colors hover:bg-background motion-reduce:transition-none">
                                    {/* Imagen */}
                                    <td className="p-4">
                                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background md:h-14 md:w-14">
                                            {producto.imagen_url ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={producto.imagen_url}
                                                    alt={producto.nombre}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-center text-xs text-muted-foreground">Sin Img</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Nombre + Talles */}
                                    <td className="p-4">
                                        <div className="min-w-40 max-w-64 break-words text-sm font-bold leading-snug text-foreground">{producto.nombre}</div>
                                        <div className="mt-1 max-w-64 break-words text-xs font-medium text-muted-foreground">
                                            {producto.talles_disponibles?.join(', ') || 'Sin talles'}
                                        </div>
                                    </td>

                                    {/* Precio */}
                                    <td className="p-4 font-sans text-sm font-extrabold whitespace-nowrap text-foreground tabular-nums">
                                        ${Number(producto.precio).toLocaleString('es-AR')}
                                    </td>

                                    {/* Stock Total */}
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap tabular-nums ${obtenerColorBadgeStock(producto.stock)}`}>
                                            {producto.stock} uds
                                        </span>
                                    </td>

                                    {/* Categoría */}
                                    <td className="p-4">
                                        <span className="inline-flex max-w-48 items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold break-words text-foreground">
                                            {producto.categorias?.nombre || 'Sin categoría'}
                                        </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handlePrepararPublicacion(producto)}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-violet hover:bg-violet-soft hover:text-violet-soft-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none cursor-pointer"
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
                                                type="button"
                                                disabled={copiandoId === producto.id}
                                                onClick={() => handleCopiarLink(producto.id)}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-emerald hover:bg-emerald-soft hover:text-emerald-soft-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-violet hover:bg-violet-soft hover:text-violet-soft-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none cursor-pointer"
                                                title="Editar variantes y datos">
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
                                                type="button"
                                                onClick={() => handleEliminar(producto.id, producto.nombre)}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-danger hover:bg-danger hover:text-danger-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none cursor-pointer"
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
