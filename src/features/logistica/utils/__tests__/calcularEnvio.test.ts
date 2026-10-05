import { describe, expect, it } from 'vitest';
import type { ZonaEnvio } from '@/src/features/logistica/types';
import { calcularEnvio } from '../calcularEnvio';

function crearZona(overrides: Partial<ZonaEnvio> = {}): ZonaEnvio {
    return {
        id: '11111111-1111-4111-8111-111111111111',
        tenant_id: '22222222-2222-4222-8222-222222222222',
        nombre: 'Zona centro',
        codigo_postal_desde: '1000',
        codigo_postal_hasta: '2000',
        metodo: 'mensajeria_local',
        costo: 1500,
        minimo_envio_gratis: null,
        activo: true,
        created_at: '2026-10-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('calcularEnvio', () => {
    it('retorna CARRITO_VACIO cuando el subtotal es 0', () => {
        const resultado = calcularEnvio([crearZona()], '1500', 0);

        expect(resultado).toEqual({ esValido: false, motivo: 'CARRITO_VACIO' });
    });

    it('retorna CARRITO_VACIO cuando el subtotal es negativo', () => {
        const resultado = calcularEnvio([crearZona()], '1500', -500);

        expect(resultado).toEqual({ esValido: false, motivo: 'CARRITO_VACIO' });
    });

    it('retorna CARRITO_VACIO antes de validar el código postal', () => {
        const resultado = calcularEnvio([crearZona()], 'abc', 0);

        expect(resultado).toEqual({ esValido: false, motivo: 'CARRITO_VACIO' });
    });

    it('retorna CP_INVALIDO cuando el código postal contiene letras', () => {
        const resultado = calcularEnvio([crearZona()], '15a0', 10000);

        expect(resultado).toEqual({ esValido: false, motivo: 'CP_INVALIDO' });
    });

    it('retorna CP_INVALIDO cuando el código postal tiene 3 dígitos', () => {
        const resultado = calcularEnvio([crearZona()], '150', 10000);

        expect(resultado).toEqual({ esValido: false, motivo: 'CP_INVALIDO' });
    });

    it('retorna CP_INVALIDO cuando el código postal tiene 5 dígitos', () => {
        const resultado = calcularEnvio([crearZona()], '15000', 10000);

        expect(resultado).toEqual({ esValido: false, motivo: 'CP_INVALIDO' });
    });

    it('retorna CP_INVALIDO cuando el código postal está vacío', () => {
        const resultado = calcularEnvio([crearZona()], '', 10000);

        expect(resultado).toEqual({ esValido: false, motivo: 'CP_INVALIDO' });
    });

    it('retorna SIN_ZONA cuando el código postal es válido pero no hay zona configurada', () => {
        const resultado = calcularEnvio([], '1500', 10000);

        expect(resultado).toEqual({ esValido: false, motivo: 'SIN_ZONA' });
    });

    it('retorna SIN_ZONA cuando la zona que cubre el código postal está inactiva', () => {
        const zonas = [crearZona({ activo: false })];

        const resultado = calcularEnvio(zonas, '1500', 10000);

        expect(resultado).toEqual({ esValido: false, motivo: 'SIN_ZONA' });
    });

    it('retorna el costo fijo de la zona cuando corresponde', () => {
        const zonas = [crearZona({ id: 'zona-centro', costo: 1800, minimo_envio_gratis: 50000 })];

        const resultado = calcularEnvio(zonas, '1500', 10000);

        expect(resultado).toEqual({
            esValido: true,
            costo: 1800,
            metodo: 'mensajeria_local',
            zonaId: 'zona-centro',
            estaFijoGratis: false,
        });
    });

    it('retorna costo 0 cuando el subtotal supera el mínimo de envío gratis', () => {
        const zonas = [crearZona({ costo: 1800, minimo_envio_gratis: 30000 })];

        const resultado = calcularEnvio(zonas, '1500', 30000);

        expect(resultado).toEqual({
            esValido: true,
            costo: 0,
            metodo: 'mensajeria_local',
            zonaId: '11111111-1111-4111-8111-111111111111',
            estaFijoGratis: true,
        });
    });

    it('aplica el costo fijo cuando el subtotal queda por debajo del mínimo de envío gratis', () => {
        const zonas = [crearZona({ costo: 1800, minimo_envio_gratis: 30000 })];

        const resultado = calcularEnvio(zonas, '1500', 29999.99);

        expect(resultado).toMatchObject({ esValido: true, costo: 1800, estaFijoGratis: false });
    });

    it('nunca aplica envío gratis cuando minimo_envio_gratis es null', () => {
        const zonas = [crearZona({ costo: 1800, minimo_envio_gratis: null })];

        const resultado = calcularEnvio(zonas, '1500', 9999999);

        expect(resultado).toMatchObject({ esValido: true, costo: 1800, estaFijoGratis: false });
    });

    it('retorna ZONAS_SOLAPADAS cuando dos zonas coinciden en el mismo código postal', () => {
        const zonas = [
            crearZona({ id: 'zona-a', codigo_postal_desde: '1000', codigo_postal_hasta: '2000' }),
            crearZona({ id: 'zona-b', codigo_postal_desde: '1200', codigo_postal_hasta: '1800' }),
        ];

        const resultado = calcularEnvio(zonas, '1500', 10000);

        expect(resultado).toEqual({ esValido: false, motivo: 'ZONAS_SOLAPADAS' });
    });

    it('retorna el metodo retiro y costo 0 para la zona de retiro en el local', () => {
        const zonas = [
            crearZona({
                id: 'zona-retiro',
                metodo: 'retiro',
                costo: 0,
                codigo_postal_desde: null,
                codigo_postal_hasta: null,
            }),
        ];

        const resultado = calcularEnvio(zonas, '1500', 10000);

        expect(resultado).toEqual({
            esValido: true,
            costo: 0,
            metodo: 'retiro',
            zonaId: 'zona-retiro',
            estaFijoGratis: true,
        });
    });

    it('normaliza guiones y espacios del código postal antes de buscar la zona', () => {
        const zonas = [crearZona({ id: 'zona-centro', costo: 2200 })];

        const resultado = calcularEnvio(zonas, ' 1-5 0 0 ', 10000);

        expect(resultado).toMatchObject({ esValido: true, zonaId: 'zona-centro', costo: 2200 });
    });

    it('incluye los extremos del rango de la zona', () => {
        const zonas = [crearZona({ id: 'zona-centro', costo: 900 })];

        const resultadoDesde = calcularEnvio(zonas, '1000', 10000);
        const resultadoHasta = calcularEnvio(zonas, '2000', 10000);

        expect(resultadoDesde).toMatchObject({ esValido: true, zonaId: 'zona-centro', costo: 900 });
        expect(resultadoHasta).toMatchObject({ esValido: true, zonaId: 'zona-centro', costo: 900 });
    });

    it('excluye el código postal si queda fuera del rango configurado', () => {
        const zonas = [crearZona()];

        const resultadoAntes = calcularEnvio(zonas, '0999', 10000);
        const resultadoDespues = calcularEnvio(zonas, '2001', 10000);

        expect(resultadoAntes).toEqual({ esValido: false, motivo: 'SIN_ZONA' });
        expect(resultadoDespues).toEqual({ esValido: false, motivo: 'SIN_ZONA' });
    });
});
