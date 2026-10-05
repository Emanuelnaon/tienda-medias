import { describe, expect, it } from 'vitest';
import type { EstadoPedido } from '../estadosPedido';
import { ESTADOS_PEDIDO, proximosEstados } from '../estadosPedido';

describe('proximosEstados', () => {
    it('desde pendiente ofrece confirmar o cancelar', () => {
        expect(proximosEstados('pendiente')).toEqual(['confirmado', 'cancelado']);
    });

    it('desde confirmado ofrece preparar o cancelar', () => {
        expect(proximosEstados('confirmado')).toEqual(['preparando', 'cancelado']);
    });

    it('desde preparando ofrece enviar o cancelar', () => {
        expect(proximosEstados('preparando')).toEqual(['en_camino', 'cancelado']);
    });

    it('desde en_camino ofrece entregar o cancelar', () => {
        expect(proximosEstados('en_camino')).toEqual(['entregado', 'cancelado']);
    });

    it('desde entregado no ofrece ningún estado destino', () => {
        expect(proximosEstados('entregado')).toEqual([]);
    });

    it('desde cancelado no ofrece ningún estado destino', () => {
        expect(proximosEstados('cancelado')).toEqual([]);
    });

    it('con estado null no ofrece ningún estado destino', () => {
        expect(proximosEstados(null)).toEqual([]);
    });

    it('entregado y cancelado son estados terminales', () => {
        const terminales: ReadonlyArray<EstadoPedido> = ['entregado', 'cancelado'];

        terminales.forEach((estado) => {
            expect(proximosEstados(estado)).toHaveLength(0);
        });
    });

    it('solo los estados no terminales ofrecen la cancelación', () => {
        const estados: ReadonlyArray<EstadoPedido> = [
            'pendiente',
            'confirmado',
            'preparando',
            'en_camino',
        ];

        estados.forEach((estado) => {
            expect(proximosEstados(estado)).toContain('cancelado');
        });
    });

    it('devuelve una copia mutable y no la matriz interna', () => {
        const primera = proximosEstados('pendiente');
        primera.push('entregado');

        expect(proximosEstados('pendiente')).toEqual(['confirmado', 'cancelado']);
    });
});

describe('ESTADOS_PEDIDO', () => {
    it('expone los seis estados del dominio con su etiqueta en español', () => {
        expect(ESTADOS_PEDIDO).toEqual({
            pendiente: { label: 'Pendiente', color: 'yellow' },
            confirmado: { label: 'Confirmado', color: 'blue' },
            preparando: { label: 'Preparando', color: 'purple' },
            en_camino: { label: 'En camino', color: 'orange' },
            entregado: { label: 'Entregado', color: 'green' },
            cancelado: { label: 'Cancelado', color: 'red' },
        });
    });

    it('tiene etiqueta y color para todos los estados', () => {
        Object.values(ESTADOS_PEDIDO).forEach(({ label, color }) => {
            expect(label.length).toBeGreaterThan(0);
            expect(color.length).toBeGreaterThan(0);
        });
    });
});
