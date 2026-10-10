'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import type { PosicionRepartidor } from '@/src/features/tracking/types';
import { actionConsultarPosicion } from '@/src/features/tracking/actions/actionConsultarPosicion';
import { normalizarPosicion } from '@/src/features/tracking/utils/normalizarTracking';

const TIMEOUT_CONEXION_MS = 5000;
const INTERVALO_CONSULTA_MS = 30_000;

const ESTADOS_DEGRADADOS = ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'];

type Parametros = {
    readonly pedidoId: string;
    readonly token: string;
    readonly posicionInicial?: PosicionRepartidor | null;
};

function esMasReciente(entrada: PosicionRepartidor, actual: PosicionRepartidor | null): boolean {
    if (actual === null) {
        return true;
    }

    return Date.parse(entrada.updated_at) > Date.parse(actual.updated_at);
}

export function useEnvioPosicion({
    pedidoId,
    token,
    posicionInicial = null,
}: Parametros) {
    const supabase = useMemo(() => createClient(), []);

    const [posicion, setPosicion] = useState<PosicionRepartidor | null>(posicionInicial);
    const [estadoConexion, setEstadoConexion] = useState<'conectando' | 'conectado' | 'degradado'>(
        'conectando',
    );

    const posicionRef = useRef<PosicionRepartidor | null>(posicionInicial);
    const llegoPorRealtimeRef = useRef(false);

    const fijarPosicion = useCallback((entrada: PosicionRepartidor | null) => {
        if (entrada === null) {
            return;
        }

        if (esMasReciente(entrada, posicionRef.current)) {
            posicionRef.current = entrada;
            setPosicion(entrada);
        }
    }, []);

    useEffect(() => {
        const registrar = (payload: { readonly new: Record<string, unknown> }) => {
            const entrada = normalizarPosicion(payload.new);

            if (entrada !== null) {
                llegoPorRealtimeRef.current = true;
                fijarPosicion(entrada);
            }
        };

        const canal = supabase
            .channel(`pedido-envio-${pedidoId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'delivery_tracking',
                    filter: `pedido_id=eq.${pedidoId}`,
                },
                registrar,
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'delivery_tracking',
                    filter: `pedido_id=eq.${pedidoId}`,
                },
                registrar,
            )
            .subscribe((estado) => {
                if (estado === 'SUBSCRIBED') {
                    setEstadoConexion('conectado');
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
    }, [fijarPosicion, pedidoId, supabase]);

    useEffect(() => {
        const intervalo = setInterval(() => {
            void (async () => {
                const consultada = await actionConsultarPosicion(pedidoId, token);

                if (consultada === null) {
                    return;
                }

                if (!llegoPorRealtimeRef.current && esMasReciente(consultada, posicionRef.current)) {
                    setEstadoConexion('degradado');
                }

                fijarPosicion(consultada);
            })();
        }, INTERVALO_CONSULTA_MS);

        return () => clearInterval(intervalo);
    }, [fijarPosicion, pedidoId, token]);

    return {
        posicion,
        estaDegradado: estadoConexion === 'degradado',
    };
}