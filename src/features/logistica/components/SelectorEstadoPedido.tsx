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
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Estado del pedido
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Sin estados disponibles</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="border-b border-border pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cambiar estado del pedido
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                    value={estadoSeleccionado}
                    onChange={(evento) => {
                        setEstadoSeleccionado(evento.target.value as EstadoPedido | '');
                        if (evento.target.value !== 'cancelado') {
                            setNotas('');
                        }
                    }}
                    aria-label="Nuevo estado del pedido"
                    className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/20 sm:w-auto"
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
                    className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    {isPending ? 'Guardando...' : 'Actualizar estado'}
                </button>
            </div>

            {esCancelacion && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="notas_cancelacion" className="text-sm font-bold text-foreground">
                        Motivo de la cancelación (obligatorio)
                    </label>
                    <textarea
                        id="notas_cancelacion"
                        value={notas}
                        onChange={(evento) => setNotas(evento.target.value)}
                        rows={3}
                        placeholder="Ej. El cliente pidió cancelar por falta de stock"
                        className={cn(
                            'min-h-24 w-full rounded-xl border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-2 focus:ring-violet/20',
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
