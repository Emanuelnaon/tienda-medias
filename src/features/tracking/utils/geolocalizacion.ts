import type { Coordenadas } from '@/src/features/tracking/types';

const RADIO_TIERRA_METROS = 6_371_000;

export const INTERVALO_MINIMO_REPORTE_SEGUNDOS = 15;
export const DISTANCIA_MINIMA_REPORTE_METROS = 50;

function aRadianes(grados: number): number {
    return (grados * Math.PI) / 180;
}

/**
 * Distancia en metros entre dos coordenadas (haversine).
 */
export function distanciaMetros(desde: Coordenadas, hasta: Coordenadas): number {
    const diferenciaLat = aRadianes(hasta.lat - desde.lat);
    const diferenciaLng = aRadianes(hasta.lng - desde.lng);

    const latDesde = aRadianes(desde.lat);
    const latHasta = aRadianes(hasta.lat);

    const h =
        Math.sin(diferenciaLat / 2) ** 2 +
        Math.cos(latDesde) * Math.cos(latHasta) * Math.sin(diferenciaLng / 2) ** 2;

    return 2 * RADIO_TIERRA_METROS * Math.asin(Math.min(1, Math.sqrt(h)));
}

type ReportePosicion = {
    readonly ahoraMs: number;
    readonly ultimoReporteMs: number | null;
    readonly distanciaDesdeUltimoReporteM: number;
};

/**
 * Freno de escritura del repartidor: la primera posición sale siempre y después
 * se exige que pasen 15 s Y que se haya movido más de 50 m.
 */
export function debeReportarPosicion({
    ahoraMs,
    ultimoReporteMs,
    distanciaDesdeUltimoReporteM,
}: ReportePosicion): boolean {
    if (ultimoReporteMs === null) {
        return true;
    }

    if (distanciaDesdeUltimoReporteM < DISTANCIA_MINIMA_REPORTE_METROS) {
        return false;
    }

    return ahoraMs - ultimoReporteMs >= INTERVALO_MINIMO_REPORTE_SEGUNDOS * 1000;
}