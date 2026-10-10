'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import type { EntradaHistorial } from '@/src/features/tracking/types';
import { normalizarEntrada } from '@/src/features/tracking/utils/normalizarTracking';

/**
 * Ventana de gracia para la conexión de Realtime. Si en 5 s el canal no
 * confirmó suscripción, la UI pasa a modo degradado (badge + polling).
 */
const TIMEOUT_CONEXION_MS = 5000;

const ESTADOS_DEGRADADOS = ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'];

type EstadoConexion = 'conectando' | 'conectado' | 'degradado';

type Parametros = {
    readonly pedidoId: string;
    readonly historialInicial: ReadonlyArray<EntradaHistorial>;
};

function claveEntrada(entrada: EntradaHistorial): string {
    return `${entrada.changed_at}|${entrada.estado_nuevo}|${entrada.estado_anterior ?? ''}`;
}

function ordenarPorFecha(entradas: ReadonlyArray<EntradaHistorial>): ReadonlyArray<EntradaHistorial> {
    return [...entradas].sort(
        (primera, segunda) => Date.parse(primera.changed_at) - Date.parse(segunda.changed_at),
    );
}

function desduplicar(
    historial: ReadonlyArray<EntradaHistorial>,
    nuevas: ReadonlyArray<EntradaHistorial>,
): ReadonlyArray<EntradaHistorial> {
    const unicas = new Map<string, EntradaHistorial>();

    [...historial, ...nuevas].forEach((entrada) => {
        unicas.set(claveEntrada(entrada), entrada);
    });

    return ordenarPorFecha([...unicas.values()]);
}

export function useTrackingRealtime({
    pedidoId,
    historialInicial,
}: Parametros) {
    const supabase = useMemo(() => createClient(), []);

    const [historial, setHistorial] = useState<ReadonlyArray<EntradaHistorial>>(historialInicial);
    const [estadoConexion, setEstadoConexion] = useState<EstadoConexion>('conectando');
    const [haRecibidoEvento, setHaRecibidoEvento] = useState(false);

    const fusionarHistorial = useCallback((entradas: ReadonlyArray<EntradaHistorial>) => {
        if (entradas.length === 0) {
            return;
        }

        setHistorial((previo) => desduplicar(previo, entradas));
    }, []);

    const marcarRealtimeInutil = useCallback(() => {
        setEstadoConexion('degradado');
    }, []);

    // Resincroniza con el historial del servidor solo si su contenido cambió de
    // verdad: si no, cada render del padre borraría lo agregado por Realtime.
    const firmaHistorial = useMemo(
        () => historialInicial.map(claveEntrada).join('||'),
        [historialInicial],
    );
    const ultimaFirmaRef = useRef(firmaHistorial);

    useEffect(() => {
        if (firmaHistorial === ultimaFirmaRef.current) {
            return;
        }

        ultimaFirmaRef.current = firmaHistorial;
        setHistorial(historialInicial);
    }, [firmaHistorial, historialInicial]);

    useEffect(() => {
        const canal = supabase
            .channel(`pedido-historial-${pedidoId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'pedidos_historial',
                    filter: `pedido_id=eq.${pedidoId}`,
                },
                (payload) => {
                    const entrada = normalizarEntrada(payload.new);

                    if (entrada === null) {
                        return;
                    }

                    setHaRecibidoEvento(true);
                    fusionarHistorial([entrada]);
                },
            )
            .subscribe((estado) => {
                if (estado === 'SUBSCRIBED') {
                    setEstadoConexion((previo) => (previo === 'degradado' ? previo : 'conectado'));
                    return;
                }

                if (ESTADOS_DEGRADADOS.includes(estado)) {
                    setEstadoConexion('degradado');
                }
            });

        const temporizador = setTimeout(() => {
            setEstadoConexion((previo) => (previo === 'conectando' ? 'degradado' : previo));
        }, TIMEOUT_CONEXION_MS);

        return () => {
            clearTimeout(temporizador);
            void supabase.removeChannel(canal);
        };
    }, [fusionarHistorial, pedidoId, supabase]);

    return {
        historial,
        estaDegradado: estadoConexion === 'degradado',
        haRecibidoEvento,
        fusionarHistorial,
        marcarRealtimeInutil,
    };
}