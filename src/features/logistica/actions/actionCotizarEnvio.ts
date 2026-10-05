'use server';

import { consultarCoberturaEnvio } from '@/src/features/logistica/api/queries';
import { calcularEnvio } from '@/src/features/logistica/utils/calcularEnvio';
import type { ResultadoEnvio } from '@/src/features/logistica/types';

export async function actionCotizarEnvio(
    codigoPostal: string,
    subtotal: number,
): Promise<ResultadoEnvio> {
    const subtotalSeguro = Number.isFinite(subtotal) ? subtotal : 0;
    const cobertura = await consultarCoberturaEnvio();

    return calcularEnvio(cobertura.zonas, codigoPostal ?? '', subtotalSeguro);
}