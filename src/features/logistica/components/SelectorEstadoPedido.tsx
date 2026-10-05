'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/src/lib/utils/cn';
import { actionCambiarEstadoPedido } from '@/src/features/admin/actions/pedidosActions';
import { ESTADOS_PEDIDO, esEstadoPedido, proximosEstados } from '@/src/features/logistica/utils';
import type { EstadoPedido } from '@/src/features/logistica/utils';

type SelectorEstadoPedidoProps = Readonly<{
    pedidoId: string;
    estadoActual: string | null;
    onEstadoCambiado?: (estado: EstadoPedido) => void;
}>;

const LONGITUD_MINIMA_NOTAS = 5;

export function SelectorEstadoPedido({
    pedidoId,
    estadoActual,
    onEstadoCambiado,
}: SelectorEstadoPedidoProps) {
    const estadoNormalizado = esEstadoPedido(estadoActual) ? estadoActual : null;
    const estadosDisponibles = proximosEstados(estadoNormalizado);

    const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoPedido | ''>('');
    const [notas, setNotas] = useState('');
    const [isPending, setIsPending] = useState(false);

    const esCancelacion = estadoSeleccionado === 'cancelado';
    const notasInvalidas = esCancelacion && notas.trim().length < LONGITUD_MINIMA_NOTAS;

    const handleConfirmar = async () => {
        if (estadoSeleccionado === '') {
            toast.error('Elegí el nuevo estado del pedido.');
            return;
        }

        if (notasInvalidas) {
            toast.error('Indicá el motivo de la cancelación.');
            return;
        }

        setIsPending(true);
        try {
            const resultado = await actionCambiarEstadoPedido(
                pedidoId,
                estadoSeleccionado,
                notas.trim() === '' ? undefined : notas.trim(),
            );
            toast.success(`Pedido actualizado a ${ESTADOS_PEDIDO[resultado.estado].label}`);
            setEstadoSeleccionado('');
            setNotas('');
            onEstadoCambiado?.(resultado.estado);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'No se pudo actualizar el estado del pedido',
            );
        } finally {
            setIsPending(false);
        }
    };

    if (estadosDisponibles.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                    Estado del pedido
                </h2>
                <p className="mt-2 text-sm text-foreground/60">Sin estados disponibles</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                Cambiar estado del pedido
            </h2>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                    value={estadoSeleccionado}
                    onChange={(evento) => {
                        setEstadoSeleccionado(evento.target.value as EstadoPedido | '');
                        if (evento.target.value !== 'cancelado') {
                            setNotas('');
                        }
                    }}
                    aria-label="Nuevo estado del pedido"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground sm:w-auto"
                >
                    <option value="">Elegí el próximo estado</option>
                    {estadosDisponibles.map((estado) => (
                        <option key={estado} value={estado}>
                            {ESTADOS_PEDIDO[estado].label}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    disabled={isPending || estadoSeleccionado === ''}
                    onClick={handleConfirmar}
                    className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    {isPending ? 'Guardando...' : 'Actualizar estado'}
                </button>
            </div>

            {esCancelacion && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="notas_cancelacion" className="text-sm font-bold">
                        Motivo de la cancelación (obligatorio)
                    </label>
                    <textarea
                        id="notas_cancelacion"
                        value={notas}
                        onChange={(evento) => setNotas(evento.target.value)}
                        rows={3}
                        placeholder="Ej. El cliente pidió cancelar por falta de stock"
                        className={cn(
                            'w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground',
                            notasInvalidas ? 'border-destructive' : 'border-border',
                        )}
                    />
                    {notasInvalidas && (
                        <p className="text-xs text-destructive">
                            Contanos el motivo de la cancelación (mínimo {LONGITUD_MINIMA_NOTAS}{' '}
                            caracteres).
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}