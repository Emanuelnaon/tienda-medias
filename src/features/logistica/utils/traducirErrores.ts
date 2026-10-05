import { ESTADOS_PEDIDO, type EstadoPedido } from '@/src/features/logistica/utils/estadosPedido';

const TRANSICION_INVALIDA = /Transici[oó]n de estado inv[aá]lida:\s*(\S+)\s*(?:→|->)\s*(\S+)/;

const CODIGO_PERMISO_DENEGADO = '42501';
const CODIGO_VIOLACION_CHECK = '23514';
const CODIGO_UNIQUEDAD = '23505';

function etiquetaEstado(estado: string): string {
    return estado in ESTADOS_PEDIDO
        ? ESTADOS_PEDIDO[estado as EstadoPedido].label
        : estado;
}

export function traducirErrorCambioEstado(mensaje: string, codigo?: string): string {
    if (codigo === CODIGO_PERMISO_DENEGADO) {
        return 'No tenés permisos para modificar pedidos de esta tienda.';
    }

    const transicion = TRANSICION_INVALIDA.exec(mensaje);

    if (transicion) {
        return `Transición no permitida: de ${etiquetaEstado(transicion[1])} a ${etiquetaEstado(transicion[2])}.`;
    }

    if (codigo === CODIGO_VIOLACION_CHECK || mensaje.includes('pedidos_estado_check')) {
        return 'El estado seleccionado no es un estado válido de pedido.';
    }

    return `No se pudo actualizar el estado del pedido: ${mensaje}`;
}

export function traducirErrorZonaEnvio(mensaje: string, codigo?: string): string {
    if (codigo === CODIGO_PERMISO_DENEGADO) {
        return 'No tenés permisos para gestionar las zonas de envío de esta tienda.';
    }

    if (codigo === CODIGO_VIOLACION_CHECK || mensaje.includes('zonas_envio_')) {
        if (mensaje.includes('zonas_envio_metodo_check')) {
            return 'El método de envío seleccionado no es válido.';
        }

        if (mensaje.includes('zonas_envio_costo_check') || mensaje.includes('zonas_envio_minimo_check')) {
            return 'Los montos de la zona no pueden ser negativos.';
        }

        if (mensaje.includes('zonas_envio_cp_order_check')) {
            return 'El rango de códigos postales es inválido: el código hasta no puede ser menor al desde.';
        }

        return 'Los datos de la zona de envío no son válidos.';
    }

    if (codigo === CODIGO_UNIQUEDAD) {
        return 'Ya existe una zona de envío con esos datos.';
    }

    return `No se pudo guardar la zona de envío: ${mensaje}`;
}