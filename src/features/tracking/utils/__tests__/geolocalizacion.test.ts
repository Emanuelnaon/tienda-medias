import { describe, expect, it } from 'vitest';
import {
    DISTANCIA_MINIMA_REPORTE_METROS,
    INTERVALO_MINIMO_REPORTE_SEGUNDOS,
    debeReportarPosicion,
    distanciaMetros,
} from '../geolocalizacion';

describe('distanciaMetros', () => {
    it('devuelve 0 para el mismo punto', () => {
        expect(
            distanciaMetros({ lat: -34.6037, lng: -58.3816 }, { lat: -34.6037, lng: -58.3816 }),
        ).toBe(0);
    });

    it('calcula una distancia corta en metros con tolerancia de 5 m', () => {
        const distancia = distanciaMetros(
            { lat: -34.6037, lng: -58.3816 },
            { lat: -34.6038, lng: -58.3816 },
        );

        expect(distancia).toBeGreaterThan(9);
        expect(distancia).toBeLessThan(15);
    });

    it('detecta el orden inverso de los puntos', () => {
        const ida = distanciaMetros(
            { lat: -34.6037, lng: -58.3816 },
            { lat: -34.6137, lng: -58.3816 },
        );
        const vuelta = distanciaMetros(
            { lat: -34.6137, lng: -58.3816 },
            { lat: -34.6037, lng: -58.3816 },
        );

        expect(ida).toBeCloseTo(vuelta, 5);
    });

    it('mide una distancia larga en kilómetros', () => {
        const distancia = distanciaMetros({ lat: -34.6037, lng: -58.3816 }, { lat: 0, lng: 0 });

        // Buenos Aires → (0,0) es aproximadamente 7165 km.
        expect(distancia).toBeGreaterThan(7_100_000);
        expect(distancia).toBeLessThan(7_200_000);
    });
});

describe('debeReportarPosicion', () => {
    const ahora = 1_700_000_000_000;

    it('reporta siempre la primera posición', () => {
        expect(
            debeReportarPosicion({
                ahoraMs: ahora,
                ultimoReporteMs: null,
                distanciaDesdeUltimoReporteM: 0,
            }),
        ).toBe(true);
    });

    it('no reporta si pasaron menos de 15 s aunque se movió', () => {
        expect(
            debeReportarPosicion({
                ahoraMs: ahora,
                ultimoReporteMs: ahora - 5_000,
                distanciaDesdeUltimoReporteM: 500,
            }),
        ).toBe(false);
    });

    it('no reporta si se movió menos de 50 m aunque pasaron los 15 s', () => {
        expect(
            debeReportarPosicion({
                ahoraMs: ahora,
                ultimoReporteMs: ahora - 60_000,
                distanciaDesdeUltimoReporteM: DISTANCIA_MINIMA_REPORTE_METROS - 1,
            }),
        ).toBe(false);
    });

    it('reporta cuando pasaron los 15 s y se movió más de 50 m', () => {
        expect(
            debeReportarPosicion({
                ahoraMs: ahora,
                ultimoReporteMs: ahora - INTERVALO_MINIMO_REPORTE_SEGUNDOS * 1000,
                distanciaDesdeUltimoReporteM: DISTANCIA_MINIMA_REPORTE_METROS + 1,
            }),
        ).toBe(true);
    });
});