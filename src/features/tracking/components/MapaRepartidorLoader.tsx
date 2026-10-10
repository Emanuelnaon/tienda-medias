'use client';

import dynamic from 'next/dynamic';
import type { MapaRepartidorProps } from '@/src/features/tracking/components/MapaRepartidor';

/**
 * `next/dynamic` con `ssr: false` solo se permite dentro de Client Components.
 * El mapa se carga desde acá porque `maplibre-gl` usa `window` y rompería el
 * render de servidor.
 */
const MapaRepartidor = dynamic(
    () =>
        import('@/src/features/tracking/components/MapaRepartidor').then(
            (modulo) => modulo.MapaRepartidor,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 w-full animate-pulse rounded-lg border border-border bg-muted/30" />
        ),
    },
);

export function MapaRepartidorLoader(props: MapaRepartidorProps) {
    return <MapaRepartidor {...props} />;
}