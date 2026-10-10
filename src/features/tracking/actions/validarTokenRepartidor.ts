'use server';

import { METODOS_ENVIO, esEstadoPedido, type MetodoEnvio } from '@/src/features/logistica';
import type { ValidacionTokenRepartidor } from '@/src/features/tracking/types';
import { obtenerTrackingInicial } from '@/src/features/tracking/api/queries';

function esMetodoEnvio(valor: unknown): valor is MetodoEnvio {
    return typeof valor === 'string' && valor in METODOS_ENVIO;
}

/**
 * El repartidor no tiene sesión: su única credencial es el `token_seguimiento`
 * que viaja en el enlace. Se reusa `get_pedido_tracking`, que ya valida el
 * token dentro de PostgreSQL antes de devolver estado y método de envío.
 */
export async function validarTokenRepartidor(
    pedidoId: string,
    token: string,
): Promise<ValidacionTokenRepartidor> {
    const tracking = await obtenerTrackingInicial(pedidoId, token);

    if (tracking === null) {
        return {
            valido: false,
            pedidoId: null,
            estado: null,
            metodoEnvio: null,
        };
    }

    return {
        valido: true,
        pedidoId,
        estado: esEstadoPedido(tracking.estado) ? tracking.estado : null,
        metodoEnvio: esMetodoEnvio(tracking.metodo_envio) ? tracking.metodo_envio : null,
    };
}