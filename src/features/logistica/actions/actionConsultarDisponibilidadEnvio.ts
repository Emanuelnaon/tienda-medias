'use server';

import { consultarCoberturaEnvio } from '@/src/features/logistica/api/queries';

export async function actionConsultarDisponibilidadEnvio(): Promise<{
    readonly hayZonasActivas: boolean;
}> {
    try {
        const cobertura = await consultarCoberturaEnvio();
        return { hayZonasActivas: cobertura.estaHabilitado };
    } catch (error) {
        console.error('Error al consultar la disponibilidad de envío:', error);
        return { hayZonasActivas: false };
    }
}