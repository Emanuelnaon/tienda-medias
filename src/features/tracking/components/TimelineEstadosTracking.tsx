'use client';

import { useEffect, useRef } from 'react';
import {
    CircleCheck,
    CircleX,
    Clock3,
    Package,
    PackageCheck,
    RefreshCw,
    Truck,
    type LucideIcon,
} from 'lucide-react';
import { ESTADOS_PEDIDO, esEstadoPedido, type EstadoPedido } from '@/src/features/logistica';
import { cn } from '@/src/lib/utils/cn';
import { useTrackingRealtime } from '@/src/features/tracking/hooks/useTrackingRealtime';
import { actionObtenerHistorial } from '@/src/features/tracking/actions/actionObtenerHistorial';
import type { EntradaHistorial } from '@/src/features/tracking/types';

const INTERVALO_ACTUALIZACION_MS = 30_000;

const FORMATO_FECHA = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const ICONOS_ESTADO: Record<EstadoPedido, LucideIcon> = {
    pendiente: Clock3,
    confirmado: CircleCheck,
    preparando: Package,
    en_camino: Truck,
    entregado: PackageCheck,
    cancelado: CircleX,
};

const CLASES_POR_COLOR: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
};

const ETIQUETAS_ORIGEN: Record<string, string> = {
    sistema: 'Sistema',
    admin: 'Tienda',
    cliente: 'Cliente',
};

type TimelineEstadosTrackingProps = {
    readonly pedidoId: string;
    readonly historialInicial: ReadonlyArray<EntradaHistorial>;
    readonly token?: string | null;
};

function formatearFecha(iso: string): string {
    const marca = Date.parse(iso);

    return Number.isNaN(marca) ? 'Fecha no disponible' : FORMATO_FECHA.format(new Date(marca));
}

function firmaHistorial(historial: ReadonlyArray<EntradaHistorial>): string {
    return historial
        .map((entrada) => `${entrada.changed_at}|${entrada.estado_nuevo}|${entrada.estado_anterior ?? ''}`)
        .join('||');
}

export function TimelineEstadosTracking({
    pedidoId,
    historialInicial,
    token = null,
}: TimelineEstadosTrackingProps) {
    const {
        historial,
        estaDegradado,
        haRecibidoEvento,
        fusionarHistorial,
        marcarRealtimeInutil,
    } = useTrackingRealtime({ pedidoId, historialInicial });

    const firmaRef = useRef(firmaHistorial(historial));

    useEffect(() => {
        firmaRef.current = firmaHistorial(historial);
    }, [historial]);

    useEffect(() => {
        if (token === null) {
            return;
        }

        const intervalo = setInterval(() => {
            void (async () => {
                const historialServidor = await actionObtenerHistorial(pedidoId, token);

                if (historialServidor === null) {
                    return;
                }

                if (firmaHistorial(historialServidor) === firmaRef.current) {
                    return;
                }

                fusionarHistorial(historialServidor);

                if (!haRecibidoEvento) {
                    marcarRealtimeInutil();
                }
            })();
        }, INTERVALO_ACTUALIZACION_MS);

        return () => clearInterval(intervalo);
    }, [fusionarHistorial, haRecibidoEvento, marcarRealtimeInutil, pedidoId, token]);

    const entradas = [...historial].reverse();

    return (
        <section aria-labelledby="titulo-tracking" className="rounded-lg border border-border p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="titulo-tracking" className="text-base font-semibold text-foreground">
                    Seguimiento del pedido
                </h2>
                {estaDegradado && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                        Actualización manual
                    </span>
                )}
            </header>

            {entradas.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                    Todavía no hay actualizaciones de estado.
                </p>
            ) : (
                <ol className="mt-4 space-y-4">
                    {entradas.map((entrada, indice) => {
                        const esEstadoConocido = esEstadoPedido(entrada.estado_nuevo);
                        const estado = esEstadoConocido ? entrada.estado_nuevo : null;
                        const Icono = estado === null ? Clock3 : ICONOS_ESTADO[estado];
                        const clasesColor =
                            estado === null
                                ? 'bg-muted text-foreground'
                                : CLASES_POR_COLOR[ESTADOS_PEDIDO[estado].color];

                        return (
                            <li key={`${entrada.changed_at}-${entrada.estado_nuevo}-${indice}`}>
                                <div className="flex items-start gap-3">
                                    <span
                                        className={cn(
                                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                                            clasesColor,
                                        )}
                                    >
                                        <Icono className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium text-foreground">
                                                {estado === null
                                                    ? entrada.estado_nuevo
                                                    : ESTADOS_PEDIDO[estado].label}
                                            </p>
                                            {indice === 0 && (
                                                <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-background">
                                                    Estado actual
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {formatearFecha(entrada.changed_at)}
                                            {' · '}
                                            {ETIQUETAS_ORIGEN[entrada.origen] ?? entrada.origen}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}