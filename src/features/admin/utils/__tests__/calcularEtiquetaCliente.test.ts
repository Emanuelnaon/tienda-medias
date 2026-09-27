import { describe, it, expect } from 'vitest';
import { calcularEtiquetaCliente } from '../calcularEtiquetaCliente';

describe('calcularEtiquetaCliente', () => {
    it('retorna null cuando cantidadPedidos es null', () => {
        const resultado = calcularEtiquetaCliente(null);
        expect(resultado).toBeNull();
    });

    it('retorna null cuando cantidadPedidos es 0', () => {
        const resultado = calcularEtiquetaCliente(0);
        expect(resultado).toBeNull();
    });

    it('retorna texto "Nuevo" cuando cantidadPedidos es 1', () => {
        const resultado = calcularEtiquetaCliente(1);
        expect(resultado).not.toBeNull();
        expect(resultado!.texto).toBe('Nuevo');
    });

    it('retorna texto "Regular" cuando cantidadPedidos es 2', () => {
        const resultado = calcularEtiquetaCliente(2);
        expect(resultado).not.toBeNull();
        expect(resultado!.texto).toBe('Regular');
    });

    it('retorna texto "Frecuente" cuando cantidadPedidos es 3', () => {
        const resultado = calcularEtiquetaCliente(3);
        expect(resultado).not.toBeNull();
        expect(resultado!.texto).toBe('Frecuente');
    });

    it('retorna texto "Frecuente" cuando cantidadPedidos es 10', () => {
        const resultado = calcularEtiquetaCliente(10);
        expect(resultado).not.toBeNull();
        expect(resultado!.texto).toBe('Frecuente');
    });
});
