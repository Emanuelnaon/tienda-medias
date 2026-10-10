import type { EstadoPedido, MetodoEnvio } from '@/src/features/logistica';

export type Coordenadas = {
    readonly lat: number;
    readonly lng: number;
};

/**
 * Fila del historial tal como la devuelve el RPC `get_pedido_tracking`
 * (json_build_object sin columna de notas ni id).
 */
export type EntradaHistorial = {
    readonly estado_nuevo: string;
    readonly estado_anterior: string | null;
    readonly changed_at: string;
    readonly origen: string;
};

/**
 * Retorno de `get_pedido_tracking(p_pedido_id, p_token)`.
 */
export type PedidoTracking = {
    readonly estado: string | null;
    readonly metodo_envio: string | null;
    readonly estado_anterior: string | null;
    readonly historial: ReadonlyArray<EntradaHistorial>;
};

/**
 * Retorno de `get_delivery_position(p_pedido_id, p_token)` cuando el repartidor
 * ya reportó al menos una posición.
 */
export type PosicionRepartidor = Coordenadas & {
    readonly updated_at: string;
};

export type ValidacionTokenRepartidor = {
    readonly valido: boolean;
    readonly pedidoId: string | null;
    readonly estado: EstadoPedido | null;
    readonly metodoEnvio: MetodoEnvio | null;
};

export const ORIGENES_HISTORIAL = {
    sistema: 'sistema',
    admin: 'admin',
    cliente: 'cliente',
} as const;

export type OrigenHistorial = (typeof ORIGENES_HISTORIAL)[keyof typeof ORIGENES_HISTORIAL];