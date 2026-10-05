import type { Database } from '@/src/types/supabase';

export const METODOS_ENVIO = {
    retiro: 'retiro',
    mensajeria_local: 'mensajeria_local',
    correo: 'correo',
} as const;

export type MetodoEnvio = (typeof METODOS_ENVIO)[keyof typeof METODOS_ENVIO];

export const MOTIVOS_ENVIO_INVALIDO = {
    CP_INVALIDO: 'CP_INVALIDO',
    SIN_ZONA: 'SIN_ZONA',
    ZONAS_SOLAPADAS: 'ZONAS_SOLAPADAS',
    CARRITO_VACIO: 'CARRITO_VACIO',
} as const;

export type MotivoEnvioInvalido =
    (typeof MOTIVOS_ENVIO_INVALIDO)[keyof typeof MOTIVOS_ENVIO_INVALIDO];

type ZonaEnvioRow = Database['public']['Tables']['zonas_envio']['Row'];

export type ZonaEnvio = Omit<ZonaEnvioRow, 'metodo'> & {
    readonly metodo: MetodoEnvio;
};

export type ResultadoEnvioValido = {
    readonly esValido: true;
    readonly costo: number;
    readonly metodo: MetodoEnvio;
    readonly zonaId: string;
    readonly estaFijoGratis: boolean;
};

export type ResultadoEnvioInvalido = {
    readonly esValido: false;
    readonly motivo: MotivoEnvioInvalido;
};

export type ResultadoEnvio = ResultadoEnvioValido | ResultadoEnvioInvalido;

export type CoberturaEnvio = {
    readonly estaHabilitado: boolean;
    readonly zonas: ReadonlyArray<ZonaEnvio>;
};
