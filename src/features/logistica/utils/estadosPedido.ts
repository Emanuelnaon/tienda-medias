export const ESTADOS_PEDIDO = {
    pendiente: { label: 'Pendiente', color: 'yellow' },
    confirmado: { label: 'Confirmado', color: 'blue' },
    preparando: { label: 'Preparando', color: 'purple' },
    en_camino: { label: 'En camino', color: 'orange' },
    entregado: { label: 'Entregado', color: 'green' },
    cancelado: { label: 'Cancelado', color: 'red' },
} as const;

export type EstadoPedido = keyof typeof ESTADOS_PEDIDO;

export function esEstadoPedido(valor: unknown): valor is EstadoPedido {
    return typeof valor === 'string' && valor in ESTADOS_PEDIDO;
}

const MATRIZ_TRANSICIONES: { readonly [K in EstadoPedido]: ReadonlyArray<EstadoPedido> } = {
    pendiente: ['confirmado', 'cancelado'],
    confirmado: ['preparando', 'cancelado'],
    preparando: ['en_camino', 'cancelado'],
    en_camino: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: [],
};

export function proximosEstados(estadoActual: EstadoPedido | null): Array<EstadoPedido> {
    if (estadoActual === null) {
        return [];
    }

    return [...MATRIZ_TRANSICIONES[estadoActual]];
}
