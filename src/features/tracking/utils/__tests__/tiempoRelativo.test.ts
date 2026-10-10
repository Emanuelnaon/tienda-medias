import { describe, expect, it } from 'vitest';
import { esAntigua, formatearTiempoRelativo, minutosDesde } from '../tiempoRelativo';

const AHORA = new Date('2026-10-05T12:00:00.000Z');

function haceMinutos(minutos: number): string {
    return new Date(AHORA.getTime() - minutos * 60_000).toISOString();
}

describe('minutosDesde', () => {
    it('devuelve la cantidad de minutos transcurridos', () => {
        expect(minutosDesde(haceMinutos(7), AHORA)).toBe(7);
    });

    it('redondea hacia abajo los minutos parciales', () => {
        expect(minutosDesde(haceMinutos(7.9), AHORA)).toBe(7);
    });

    it('devuelve 0 cuando el registro es del mismo instante', () => {
        expect(minutosDesde(AHORA.toISOString(), AHORA)).toBe(0);
    });

    it('nunca devuelve negativos ante relojes desfasados', () => {
        expect(minutosDesde(haceMinutos(-10), AHORA)).toBe(0);
    });

    it('devuelve null si la fecha no es parseable', () => {
        expect(minutosDesde('no-es-fecha', AHORA)).toBeNull();
    });
});

describe('formatearTiempoRelativo', () => {
    it('usa "hace instantes" paramenos de un minuto', () => {
        expect(formatearTiempoRelativo(haceMinutos(0.4), AHORA)).toBe('hace instantes');
    });

    it('usa minutos mientras pasa de una hora', () => {
        expect(formatearTiempoRelativo(haceMinutos(1), AHORA)).toBe('hace 1 min');
        expect(formatearTiempoRelativo(haceMinutos(59), AHORA)).toBe('hace 59 min');
    });

    it('usa horas desde la primera hora', () => {
        expect(formatearTiempoRelativo(haceMinutos(60), AHORA)).toBe('hace 1 h');
        expect(formatearTiempoRelativo(haceMinutos(143), AHORA)).toBe('hace 2 h');
    });

    it('usa días a partir de las 24 horas', () => {
        expect(formatearTiempoRelativo(haceMinutos(1440), AHORA)).toBe('hace 1 d');
        expect(formatearTiempoRelativo(haceMinutos(4320), AHORA)).toBe('hace 3 d');
    });

    it('informa que no hay dato cuando la fecha es inválida', () => {
        expect(formatearTiempoRelativo('no-es-fecha', AHORA)).toBe('sin datos');
    });
});

describe('esAntigua', () => {
    it('es falsa mientras la marca está dentro del umbral', () => {
        expect(esAntigua(haceMinutos(30), 30, AHORA)).toBe(false);
    });

    it('es verdadera al superar el umbral', () => {
        expect(esAntigua(haceMinutos(31), 30, AHORA)).toBe(true);
    });

    it('trata una fecha inválida como desactualizada', () => {
        expect(esAntigua('no-es-fecha', 30, AHORA)).toBe(true);
    });
});