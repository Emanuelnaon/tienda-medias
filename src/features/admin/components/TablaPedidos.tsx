'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import type { PedidoPendiente } from '@/src/features/admin/actions/pedidosActions';
import {
    actionCambiarEstadoPedido,
    confirmarPedido,
} from '@/src/features/admin/actions/pedidosActions';
import { ESTADOS_PEDIDO, esEstadoPedido, proximosEstados } from '@/src/features/logistica';
import type { EstadoPedido } from '@/src/features/logistica';
import { cn } from '@/src/lib/utils/cn';

interface TablaPedidosProps {
    readonly pedidos: ReadonlyArray<PedidoPendiente>;
    readonly estadoActivo: string;
    readonly ordenActivo: string;
}

const ESTADOS_FILTRO_PEDIDOS = new Set([
    'pendiente', 'confirmado', 'preparando', 'en_camino', 'entregado', 'cancelado', 'todos',
]);

const ORDENES_VALIDAS = new Set(['recientes', 'antiguos', 'total_desc', 'total_asc']);

function formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha));
}

function badgeEstado(estado: string | null): string {
    if (estado === 'confirmado') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
}

export function TablaPedidos({ pedidos, estadoActivo, ordenActivo }: TablaPedidosProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pedidoGuardandoId, setPedidoGuardandoId] = useState<string | null>(null);
    const [isRefreshing, startTransition] = useTransition();
    const isBusy = pedidoGuardandoId !== null || isRefreshing;
    const estadoSeguro = ESTADOS_FILTRO_PEDIDOS.has(estadoActivo) ? estadoActivo : 'pendiente';
    const ordenSeguro = ORDENES_VALIDAS.has(ordenActivo) ? ordenActivo : 'recientes';

    const handleActualizar = () => startTransition(() => router.refresh());

    const handleOrdenar = (orden: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('estado', estadoSeguro);
        params.set('orden', orden);
        router.push(`?${params.toString()}`);
    };

    const handleCambiarEstado = async (pedido: PedidoPendiente, nuevoEstado: EstadoPedido) => {
        const nombreCliente = pedido.cliente?.nombre_completo ?? 'este pedido';
        const mensaje = nuevoEstado === 'confirmado'
            ? `¿Confirmar la acreditación del pedido de "${nombreCliente}"?`
            : `¿Cambiar el estado del pedido de "${nombreCliente}" a ${ESTADOS_PEDIDO[nuevoEstado].label}?`;
        if (isBusy || !window.confirm(mensaje)) return;

        setPedidoGuardandoId(pedido.id);
        try {
            if (nuevoEstado === 'confirmado') {
                const resultado = await confirmarPedido(pedido.id);
                if (!resultado.success) {
                    toast.error(resultado.mensaje);
                    startTransition(() => router.refresh());
                    return;
                }
                toast.success(`Pedido de "${nombreCliente}" acreditado con éxito.`);
            } else {
                const resultado = await actionCambiarEstadoPedido(pedido.id, nuevoEstado);
                if (!resultado.success) throw new Error('No se pudo actualizar el estado del pedido.');
                toast.success(`Pedido actualizado a ${ESTADOS_PEDIDO[resultado.estado].label}.`);
            }
            startTransition(() => router.refresh());
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el pedido.');
            startTransition(() => router.refresh());
        } finally {
            setPedidoGuardandoId(null);
        }
    };

    const ordenFecha = ordenSeguro === 'recientes' ? 'antiguos' : 'recientes';
    const ordenTotal = ordenSeguro === 'total_asc' ? 'total_desc' : 'total_asc';

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleActualizar}
                    disabled={isBusy}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet disabled:cursor-wait disabled:opacity-50"
                >
                    {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>
            {pedidos.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground sm:px-10">
                    No hay pedidos {estadoSeguro === 'todos' ? '' : estadoSeguro}.
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="overflow-x-auto overscroll-x-contain">
                        <table className="w-full min-w-max text-left text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <th scope="col" aria-sort={ordenSeguro === 'antiguos' || ordenSeguro === 'recientes' ? (ordenSeguro === 'antiguos' ? 'ascending' : 'descending') : 'none'} className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">
                                        <button type="button" disabled={isBusy} onClick={() => handleOrdenar(ordenFecha)} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-violet">Fecha{ordenSeguro === 'recientes' ? ' (desc.)' : ordenSeguro === 'antiguos' ? ' (asc.)' : ''}</button>
                                    </th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">Número de orden</th>
                                    <th scope="col" className="px-4 py-4 font-semibold sm:px-5">Cliente</th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-4 font-semibold sm:px-5">Teléfono</th>
                                    <th scope="col" aria-sort={ordenSeguro === 'total_asc' || ordenSeguro === 'total_desc' ? (ordenSeguro === 'total_asc' ? 'ascending' : 'descending') : 'none'} className="px-4 py-4 text-right font-semibold sm:px-5">
                                        <button type="button" disabled={isBusy} onClick={() => handleOrdenar(ordenTotal)} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-violet">Total{ordenSeguro === 'total_desc' ? ' (desc.)' : ordenSeguro === 'total_asc' ? ' (asc.)' : ''}</button>
                                    </th>
                                    <th scope="col" className="px-4 py-4 font-semibold sm:px-5">Estado</th>
                                    <th scope="col" className="px-4 py-4 text-right font-semibold sm:px-5">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pedidos.map((pedido) => {
                                    const estadoPedido = pedido.estado;
                                    const destinos = esEstadoPedido(estadoPedido)
                                        ? proximosEstados(estadoPedido).filter((estado) => estado !== 'cancelado')
                                        : [];
                                    return (
                                        <tr key={pedido.id} className="transition-colors hover:bg-muted/50">
                                            <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground sm:px-5">{formatearFecha(pedido.created_at)}</td>
                                            <td className="whitespace-nowrap px-4 py-4 font-sans text-xs font-semibold tabular-nums text-muted-foreground sm:px-5">{pedido.id.slice(0, 8)}</td>
                                            <td className="max-w-56 px-4 py-4 sm:px-5">
                                                <Link
                                                    href={`/admin/pedidos/${encodeURIComponent(pedido.id)}?estado=${encodeURIComponent(estadoSeguro)}&orden=${encodeURIComponent(ordenSeguro)}`}
                                                    className="font-semibold text-foreground underline-offset-4 hover:text-violet hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                                                >
                                                    {pedido.cliente?.nombre_completo ?? 'Cliente sin nombre'}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 font-sans text-xs tabular-nums text-muted-foreground sm:px-5">{pedido.cliente?.telefono ?? 'Sin teléfono'}</td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right font-sans font-bold tabular-nums text-foreground sm:px-5">${Number(pedido.total).toLocaleString('es-AR')}</td>
                                            <td className="px-4 py-4 sm:px-5">
                                                <span className={cn('inline-flex items-center rounded-lg border border-transparent px-2.5 py-1 text-xs font-bold capitalize', badgeEstado(estadoPedido))}>
                                                    {estadoPedido ?? 'Sin estado'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right sm:px-5">
                                                <div className="flex flex-col items-end gap-2">
                                                    {estadoPedido === 'pendiente' ? (
                                                        <button type="button" disabled={isBusy} onClick={() => void handleCambiarEstado(pedido, 'confirmado')} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50">
                                                            {pedidoGuardandoId === pedido.id ? 'Confirmando...' : 'Confirmar acreditación'}
                                                        </button>
                                                    ) : destinos.map((destino) => (
                                                        <button key={destino} type="button" disabled={isBusy} onClick={() => void handleCambiarEstado(pedido, destino)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet disabled:cursor-wait disabled:opacity-50">
                                                            {pedidoGuardandoId === pedido.id ? 'Guardando...' : `Pasar a ${ESTADOS_PEDIDO[destino].label}`}
                                                        </button>
                                                    ))}
                                                    {(estadoPedido === 'entregado' || estadoPedido === 'cancelado' || !destinos.length && estadoPedido !== 'pendiente') && (
                                                        <Link href={`/admin/pedidos/${encodeURIComponent(pedido.id)}?estado=${encodeURIComponent(estadoSeguro)}&orden=${encodeURIComponent(ordenSeguro)}`} className="text-xs font-semibold text-violet underline-offset-4 hover:underline">Ver detalle</Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
