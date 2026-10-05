import {
    METODOS_ENVIO,
    MOTIVOS_ENVIO_INVALIDO,
    type MotivoEnvioInvalido,
    type ResultadoEnvioValido,
} from '@/src/features/logistica/types';

export const ETIQUETAS_METODO_ENVIO = {
    retiro: 'Retiro en el local',
    mensajeria_local: 'Mensajería local',
    correo: 'Correo',
} as const;

const MENSAJES_MOTIVO: Record<MotivoEnvioInvalido, string> = {
    [MOTIVOS_ENVIO_INVALIDO.CP_INVALIDO]: 'Ingresá un código postal válido de 4 dígitos',
    [MOTIVOS_ENVIO_INVALIDO.SIN_ZONA]:
        'No tenemos cobertura de envío para ese código postal. Contactanos para coordinar la entrega.',
    [MOTIVOS_ENVIO_INVALIDO.ZONAS_SOLAPADAS]:
        'Ese código postal coincide con más de una zona de envío. Contactanos para resolverlo.',
    [MOTIVOS_ENVIO_INVALIDO.CARRITO_VACIO]:
        'Agregá productos al carrito para poder calcular el envío',
};

export function describirLineaEnvio(resultado: ResultadoEnvioValido): string {
    if (resultado.metodo === METODOS_ENVIO.retiro) {
        return 'Retiro sin costo';
    }

    return `Envío: $${resultado.costo} (${ETIQUETAS_METODO_ENVIO[resultado.metodo].toLowerCase()})`;
}

export function describirMotivoEnvio(motivo: MotivoEnvioInvalido): string {
    return MENSAJES_MOTIVO[motivo];
}