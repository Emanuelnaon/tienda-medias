'use client';

import { useEffect, useState } from 'react';
import { Map, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Navigation } from 'lucide-react';
import { useEnvioPosicion } from '@/src/features/tracking/hooks/useEnvioPosicion';
import { esAntigua, formatearTiempoRelativo } from '@/src/features/tracking/utils';
import type { PosicionRepartidor } from '@/src/features/tracking/types';

const MINUTOS_MAXIMOS_PARA_FRESCA = 30;
const INTERVALO_REFRESCO_TIEMPO_MS = 60_000;
const ZOOM_INICIAL = 14;

const CLAVE_MAPTILER = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const ESTILO_MAPA = `https://api.maptiler.com/maps/streets/style.json?key=${CLAVE_MAPTILER}`;

export type MapaRepartidorProps = {
    readonly pedidoId: string;
    readonly token: string;
    readonly posicionInicial?: PosicionRepartidor | null;
};

/**
 * Mapa de la posición del repartidor. Solo se monta para envíos con
 * `mensajeria_local` y cuando hay una posición reported.
 */
export function MapaRepartidor({ pedidoId, token, posicionInicial = null }: MapaRepartidorProps) {
    const { posicion } = useEnvioPosicion({ pedidoId, token, posicionInicial });
    const [referenciaTiempo, setReferenciaTiempo] = useState(() => new Date());

    useEffect(() => {
        const intervalo = setInterval(
            () => setReferenciaTiempo(new Date()),
            INTERVALO_REFRESCO_TIEMPO_MS,
        );

        return () => clearInterval(intervalo);
    }, []);

    if (posicion === null || !CLAVE_MAPTILER) {
        return null;
    }

    const estaDesactualizada = esAntigua(
        posicion.updated_at,
        MINUTOS_MAXIMOS_PARA_FRESCA,
        referenciaTiempo,
    );

    return (
        <section aria-labelledby="titulo-mapa" className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="titulo-mapa" className="text-base font-semibold text-foreground">
                    Ubicación del repartidor
                </h2>
                {estaDesactualizada && (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                        Posición desactualizada
                    </span>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Posición actualizada {formatearTiempoRelativo(posicion.updated_at, referenciaTiempo)}
            </p>

            <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
                {/* react-map-gl v8 no acepta className en <Map>: el alto y el
                    ancho del contenedor entran por la prop `style`. */}
                <Map
                    initialViewState={{
                        longitude: posicion.lng,
                        latitude: posicion.lat,
                        zoom: ZOOM_INICIAL,
                    }}
                    mapStyle={ESTILO_MAPA}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Marker longitude={posicion.lng} latitude={posicion.lat} anchor="center">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-2 ring-white">
                            <Navigation className="h-4 w-4" aria-hidden="true" />
                        </span>
                    </Marker>
                </Map>
            </div>
        </section>
    );
}