'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { PedidoPendiente } from '@/src/features/admin/actions/pedidosActions';
import { confirmarPedido } from '@/src/features/admin/actions/pedidosActions';
import { cn } from '@/src/lib/utils/cn';

interface TablaPedidosProps {
    readonly pedidosIniciales: ReadonlyArray<PedidoPendiente>;
    readonly estadoInicial: string;
}

function formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha));
}

function badgeEstado(estado: string | null): string {
    if (estado === 'confirmado') {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
}

export function TablaPedidos({ pedidosIniciales, estadoInicial }: TablaPedidosProps) {
    const [pedidos, setPedidos] = useState<ReadonlyArray<PedidoPendiente>>(pedidosIniciales);
    const [pedidoConfirmandoId, setPedidoConfirmandoId] = useState<string | null>(null);

    const handleConfirmar = async (pedidoId: string, nombreCliente: string) => {
        setPedidoConfirmandoId(pedidoId);
        try {
            await confirmarPedido(pedidoId);
            setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
            toast.success(`Pedido de "${nombreCliente}" acreditado con éxito.`);
        } catch (error: unknown) {
            const mensaje = error instanceof Error ? error.message : 'Error desconocido al confirmar el pedido.';
            toast.error(mensaje);
        } finally {
            setPedidoConfirmandoId(null);
        }
    };

    if (pedidos.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground sm:px-10">
                No hay pedidos {estadoInicial === 'todos' ? '' : estadoInicial}.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-max text-left text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">Fecha</th>
                        <th scope="col" className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">Número de orden</th>
                        <th scope="col" className="px-4 py-4 font-semibold sm:px-5">Cliente</th>
                        <th scope="col" className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">Teléfono</th>
                        <th scope="col" className="px-4 py-4 text-right font-semibold sm:px-5">Total</th>
                        <th scope="col" className="px-4 py-4 font-semibold sm:px-5">Estado</th>
                        <th scope="col" className="px-4 py-4 text-right font-semibold sm:px-5">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {pedidos.map((pedido) => (
                        <tr key={pedido.id} className="transition-colors hover:bg-muted/50">
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground sm:px-5">{formatearFecha(pedido.created_at)}</td>
                            <td className="whitespace-nowrap px-4 py-4 font-sans text-xs font-semibold tabular-nums text-muted-foreground sm:px-5">
                                {pedido.id.slice(0, 8)}
                            </td>
                            <td className="max-w-56 px-4 py-4 sm:px-5">
                                <Link
                                    href={`/admin/pedidos/${pedido.id}`}
                                    className="font-semibold text-foreground underline-offset-4 hover:text-violet hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                                >
                                    {pedido.cliente?.nombre_completo ?? 'Cliente sin nombre'}
                                </Link>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 font-sans text-xs tabular-nums text-muted-foreground sm:px-5">
                                {pedido.cliente?.telefono ?? 'Sin teléfono'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right font-sans font-bold tabular-nums text-foreground sm:px-5">
                                ${Number(pedido.total).toLocaleString('es-AR')}
                            </td>
                            <td className="px-4 py-4 sm:px-5">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-lg border border-transparent px-2.5 py-1 text-xs font-bold capitalize',
                                        badgeEstado(pedido.estado),
                                    )}
                                >
                                    {pedido.estado ?? 'pendiente'}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-right sm:px-5">
                                {pedido.estado === 'pendiente' ? (
                                    <button
                                        type="button"
                                        disabled={pedidoConfirmandoId === pedido.id}
                                        onClick={() =>
                                            handleConfirmar(
                                                pedido.id,
                                                pedido.cliente?.nombre_completo ?? 'este pedido',
                                            )
                                        }
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
                                    >
                                        {pedidoConfirmandoId === pedido.id ? (
                                            <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            'Confirmar Acreditación'
                                        )}
                                    </button>
                                ) : (
                                    <span className="text-xs text-foreground/50">Confirmado</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    );
}
