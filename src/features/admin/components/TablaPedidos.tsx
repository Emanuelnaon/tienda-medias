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
            <div className="rounded-lg border border-border p-10 text-center text-foreground/60">
                No hay pedidos {estadoInicial === 'todos' ? '' : estadoInicial}.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
            <table className="w-full min-w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/30 text-foreground/70 uppercase tracking-wider">
                        <th className="px-4 py-3 font-semibold">Fecha</th>
                        <th className="px-4 py-3 font-semibold">Número de orden</th>
                        <th className="px-4 py-3 font-semibold">Cliente</th>
                        <th className="px-4 py-3 font-semibold">Teléfono</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {pedidos.map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-foreground/5 transition-colors">
                            <td className="px-4 py-3">{formatearFecha(pedido.created_at)}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                                {pedido.id.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3">
                                <Link
                                    href={`/admin/pedidos/${pedido.id}`}
                                    className="font-medium text-foreground hover:underline"
                                >
                                    {pedido.cliente?.nombre_completo ?? 'Cliente sin nombre'}
                                </Link>
                            </td>
                            <td className="px-4 py-3 text-foreground/70">
                                {pedido.cliente?.telefono ?? 'Sin teléfono'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                                ${Number(pedido.total).toLocaleString('es-AR')}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                                        badgeEstado(pedido.estado),
                                    )}
                                >
                                    {pedido.estado ?? 'pendiente'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
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
                                        className="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
    );
}
