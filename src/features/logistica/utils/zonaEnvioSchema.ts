import { z } from 'zod';
import { METODOS_ENVIO } from '@/src/features/logistica/types';

const CODIGO_POSTAL = /^\d{4}$/;

function codigoPostalOpcional(mensaje: string) {
    return z
        .string()
        .trim()
        .refine((valor) => valor === '' || CODIGO_POSTAL.test(valor), { message: mensaje });
}

export const zonaEnvioSchema = z
    .object({
        nombre: z.string().trim().min(1, 'Ingresá el nombre de la zona'),
        codigo_postal_desde: codigoPostalOpcional('El código postal desde debe tener 4 dígitos'),
        codigo_postal_hasta: codigoPostalOpcional('El código postal hasta debe tener 4 dígitos'),
        metodo: z.enum(
            [METODOS_ENVIO.retiro, METODOS_ENVIO.mensajeria_local, METODOS_ENVIO.correo],
            { errorMap: () => ({ message: 'Seleccioná un método de envío' }) },
        ),
        costo: z
            .number({
                required_error: 'Ingresá el costo de envío',
                invalid_type_error: 'Ingresá el costo de envío',
            })
            .finite('Ingresá el costo de envío')
            .min(0, 'El costo no puede ser negativo')
            // Opcional solo para el método retiro: el input queda deshabilitado
            // y React Hook Form no envía valores de inputs deshabilitados.
            .optional(),
        minimo_envio_gratis: z
            .string()
            .trim()
            .refine(
                (valor) => valor === '' || (Number.isFinite(Number(valor)) && Number(valor) >= 0),
                { message: 'Ingresá un número válido mayor o igual a 0' },
            ),
    })
    .superRefine((zona, ctx) => {
        if (zona.metodo !== METODOS_ENVIO.retiro && typeof zona.costo !== 'number') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['costo'],
                message: 'Ingresá el costo de envío',
            });
        }

        if (zona.metodo === METODOS_ENVIO.retiro && zona.costo !== undefined && zona.costo !== 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['costo'],
                message: 'El retiro en el local siempre tiene costo 0',
            });
        }

        const desde = zona.codigo_postal_desde;
        const hasta = zona.codigo_postal_hasta;

        if (desde !== '' && hasta !== '' && desde > hasta) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['codigo_postal_hasta'],
                message: 'El código postal hasta no puede ser menor al desde',
            });
        }
    });

export type ZonaEnvioInput = z.infer<typeof zonaEnvioSchema>;