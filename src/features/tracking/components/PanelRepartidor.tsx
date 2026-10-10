'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bike, LoaderCircle, PackageCheck, Play, Square } from 'lucide-react';
import { ESTADOS_PEDIDO, type EstadoPedido } from '@/src/features/logistica';
import { cn } from '@/src/lib/utils/cn';
import { actionActualizarPosicion } from '@/src/features/tracking/actions/actionActualizarPosicion';
import { actionMarcarEntregado } from '@/src/features/tracking/actions/actionMarcarEntregado';
import { debeReportarPosicion, distanciaMetros } from '@/src/features/tracking/utils';
import type { Coordenadas } from '@/src/features/tracking/types';

const EDAD_MAXIMA_POSICION_MS = 10_000;
const TIMEOUT_GEOLOCALIZACION_MS = 30_000;

const CLASES_POR_COLOR: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
};

type EnvioRealizado = {
    readonly ms: number;
    readonly coordenadas: Coordenadas;
};

type PanelRepartidorProps = {
    readonly pedidoId: string;
    readonly token: string;
    readonly estado: EstadoPedido;
};

export function PanelRepartidor({ pedidoId, token, estado }: PanelRepartidorProps) {
    const [estadoActual, setEstadoActual] = useState<EstadoPedido>(estado);
    const [estaCompartiendo, setEstaCompartiendo] = useState(false);
    const [estaEntregando, setEstaEntregando] = useState(false);
    const [ultimoEnvioMs, setUltimoEnvioMs] = useState<number | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const envioRealizadoRef = useRef<EnvioRealizado | null>(null);
    const avisoFalloEnvioRef = useRef(false);

    const detenerSeguimiento = useCallback(() => {
        if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setEstaCompartiendo(false);
    }, []);

    const reportarPosicion = useCallback(
        (coordenadas: Coordenadas, ahoraMs: number) => {
            const previo = envioRealizadoRef.current;
            const distanciaDesdeUltimoReporte =
                previo === null
                    ? Number.POSITIVE_INFINITY
                    : distanciaMetros(previo.coordenadas, coordenadas);

            const correspondeReportar = debeReportarPosicion({
                ahoraMs,
                ultimoReporteMs: previo === null ? null : previo.ms,
                distanciaDesdeUltimoReporteM: distanciaDesdeUltimoReporte,
            });

            if (!correspondeReportar) {
                return;
            }

            envioRealizadoRef.current = { ms: ahoraMs, coordenadas };

            void (async () => {
                try {
                    await actionActualizarPosicion(pedidoId, token, coordenadas.lat, coordenadas.lng);
                    avisoFalloEnvioRef.current = false;
                    setUltimoEnvioMs(ahoraMs);
                } catch (error) {
                    envioRealizadoRef.current = previo;

                    // Un toast por racha de fallos: el watchPosition sigue
                    // disparando cada vez que supera el filtro de 15 s / 50 m.
                    if (!avisoFalloEnvioRef.current) {
                        avisoFalloEnvioRef.current = true;
                        toast.error(
                            error instanceof Error
                                ? error.message
                                : 'No se pudo actualizar la ubicación.',
                        );
                    }
                }
            })();
        },
        [pedidoId, token],
    );

    // Solo se libera el recurso externo: en el unmount no hace falta tocar estado.
    useEffect(
        () => () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        },
        [],
    );

    const handleCompartirUbicacion = () => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            toast.error('Este dispositivo no permite compartir la ubicación.');
            return;
        }

        if (watchIdRef.current !== null) {
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (posicion) => {
                reportarPosicion(
                    { lat: posicion.coords.latitude, lng: posicion.coords.longitude },
                    Date.now(),
                );
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    detenerSeguimiento();
                    toast.error('Habilitá la ubicación del navegador para poder compartirla.');
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: EDAD_MAXIMA_POSICION_MS,
                timeout: TIMEOUT_GEOLOCALIZACION_MS,
            },
        );

        setEstaCompartiendo(true);
    };

    const handleMarcarEntregado = async () => {
        setEstaEntregando(true);

        try {
            await actionMarcarEntregado(pedidoId, token);
            detenerSeguimiento();
            setEstadoActual('entregado');
            toast.success('Entrega confirmada. Gracias.');
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'No se pudo confirmar la entrega.',
            );
        } finally {
            setEstaEntregando(false);
        }
    };

    const estaCerrado = estadoActual === 'entregado' || estadoActual === 'cancelado';
    const clasesEstado = CLASES_POR_COLOR[ESTADOS_PEDIDO[estadoActual].color];

    return (
        <div className="space-y-6">
            <section
                aria-labelledby="titulo-panel-repartidor"
                className={cn('rounded-lg border border-border p-6 text-center', clasesEstado)}
            >
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                    Estado del pedido
                </p>
                <h1 id="titulo-panel-repartidor" className="mt-2 text-3xl font-bold text-foreground">
                    {ESTADOS_PEDIDO[estadoActual].label}
                </h1>
                <p className="mt-2 text-sm opacity-90">Pedido #{pedidoId.split('-')[0]}</p>
            </section>

            {estadoActual === 'entregado' && (
                <p className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-foreground">
                    Pedido entregado. Gracias por completar la entrega.
                </p>
            )}

            <div className="space-y-3">
                {estaCompartiendo ? (
                    <button
                        type="button"
                        onClick={detenerSeguimiento}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground disabled:opacity-50"
                        disabled={estaCerrado}
                    >
                        <Square className="h-4 w-4" aria-hidden="true" />
                        Dejar de compartir ubicación
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleCompartirUbicacion}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={estaCerrado}
                    >
                        <Play className="h-4 w-4" aria-hidden="true" />
                        Compartir mi ubicación
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleMarcarEntregado}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={estaCerrado || estaEntregando}
                >
                    {estaEntregando ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <PackageCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    Marcar como entregado
                </button>
            </div>

            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Bike className="h-4 w-4" aria-hidden="true" />
                {estaCompartiendo && ultimoEnvioMs !== null
                    ? `Ubicación compartida cada 15 s si avanzás más de 50 m. Último envío: ${new Date(ultimoEnvioMs).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`
                    : 'Al compartir la ubicación se pide permiso al navegador: se comparte solo si avanzás más de 50 m y al menos cada 15 s.'}
            </p>
        </div>
    );
}