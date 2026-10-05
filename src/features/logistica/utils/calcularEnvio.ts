import type { ResultadoEnvio, ZonaEnvio } from '@/src/features/logistica/types';
import { MOTIVOS_ENVIO_INVALIDO } from '@/src/features/logistica/types';

const CODIGO_POSTAL_VALIDO = /^\d{4}$/;

function normalizarCodigoPostal(codigoPostal: string): string {
    return codigoPostal.trim().replace(/[\s-]/g, '');
}

function contieneCodigoPostal(zona: ZonaEnvio, codigoPostal: string): boolean {
    const desde = zona.codigo_postal_desde;
    const hasta = zona.codigo_postal_hasta;
    const superaDesde = desde === null || desde <= codigoPostal;
    const estaAntesDeHasta = hasta === null || codigoPostal <= hasta;
    return zona.activo === true && superaDesde && estaAntesDeHasta;
}

export function calcularEnvio(
    zonas: ReadonlyArray<ZonaEnvio>,
    codigoPostal: string,
    subtotal: number,
): ResultadoEnvio {
    if (subtotal <= 0) {
        return { esValido: false, motivo: MOTIVOS_ENVIO_INVALIDO.CARRITO_VACIO };
    }

    const codigoPostalNormalizado = normalizarCodigoPostal(codigoPostal);

    if (!CODIGO_POSTAL_VALIDO.test(codigoPostalNormalizado)) {
        return { esValido: false, motivo: MOTIVOS_ENVIO_INVALIDO.CP_INVALIDO };
    }

    const coincidencias = zonas.filter((zona) =>
        contieneCodigoPostal(zona, codigoPostalNormalizado),
    );

    if (coincidencias.length === 0) {
        return { esValido: false, motivo: MOTIVOS_ENVIO_INVALIDO.SIN_ZONA };
    }

    if (coincidencias.length > 1) {
        return { esValido: false, motivo: MOTIVOS_ENVIO_INVALIDO.ZONAS_SOLAPADAS };
    }

    const zona = coincidencias[0];
    const aplicaEnvioGratis =
        zona.minimo_envio_gratis !== null && subtotal >= zona.minimo_envio_gratis;
    const costo = aplicaEnvioGratis ? 0 : zona.costo;

    return {
        esValido: true,
        costo,
        metodo: zona.metodo,
        zonaId: zona.id,
        estaFijoGratis: costo === 0,
    };
}
