import { z } from 'zod';

export const datosBancariosSchema = z.object({
    cbu: z
        .string()
        .trim()
        .optional()
        .refine((v) => !v || /^\d{22}$/.test(v), {
            message: 'El CBU debe tener exactamente 22 dígitos numéricos',
        }),
    alias_bancario: z
        .string()
        .trim()
        .optional()
        .refine((v) => !v || /^[A-Za-z0-9]{1,20}$/.test(v), {
            message: 'El alias debe ser alfanumérico (máximo 20 caracteres)',
        }),
    banco: z.string().trim().optional(),
    titular_cuenta: z.string().trim().optional(),
    meta_pixel_id: z.string().trim().optional(),
});

export type DatosBancariosInput = z.input<typeof datosBancariosSchema>;
