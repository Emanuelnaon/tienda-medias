import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calcularEtiquetasInventario } from '../calcularEtiquetasInventario';

const FECHA_BASE = new Date('2026-01-15T12:00:00Z');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FECHA_BASE);
});

afterEach(() => {
    vi.useRealTimers();
});

describe('calcularEtiquetasInventario', () => {
    it('retorna primary "agotado" cuando stock es 0', () => {
        const resultado = calcularEtiquetasInventario({
            stock: 0,
            created_at: FECHA_BASE.toISOString(),
        });
        expect(resultado.primary).toBe('agotado');
    });

    it('retorna primary "ultimas_unidades" cuando stock es 2', () => {
        const resultado = calcularEtiquetasInventario({
            stock: 2,
            created_at: FECHA_BASE.toISOString(),
        });
        expect(resultado.primary).toBe('ultimas_unidades');
    });

    it('retorna primary null y secondary "nuevo" cuando stock es 10 y created_at hace 3 dias', () => {
        const hace3Dias = new Date(FECHA_BASE.getTime() - 3 * 24 * 60 * 60 * 1000);
        const resultado = calcularEtiquetasInventario({
            stock: 10,
            created_at: hace3Dias.toISOString(),
        });
        expect(resultado.primary).toBeNull();
        expect(resultado.secondary).toBe('nuevo');
    });

    it('retorna primary "ultimas_unidades" y secondary "nuevo" cuando stock es 2 y created_at hace 3 dias', () => {
        const hace3Dias = new Date(FECHA_BASE.getTime() - 3 * 24 * 60 * 60 * 1000);
        const resultado = calcularEtiquetasInventario({
            stock: 2,
            created_at: hace3Dias.toISOString(),
        });
        expect(resultado.primary).toBe('ultimas_unidades');
        expect(resultado.secondary).toBe('nuevo');
    });

    it('retorna primary null cuando stock es 10 y created_at hace 30 dias', () => {
        const hace30Dias = new Date(FECHA_BASE.getTime() - 30 * 24 * 60 * 60 * 1000);
        const resultado = calcularEtiquetasInventario({
            stock: 10,
            created_at: hace30Dias.toISOString(),
        });
        expect(resultado.primary).toBeNull();
    });

    it('retorna primary "agotado" cuando stock es 0 y created_at hace 3 dias (agotado tiene prioridad sobre nuevo)', () => {
        const hace3Dias = new Date(FECHA_BASE.getTime() - 3 * 24 * 60 * 60 * 1000);
        const resultado = calcularEtiquetasInventario({
            stock: 0,
            created_at: hace3Dias.toISOString(),
        });
        expect(resultado.primary).toBe('agotado');
    });
});
