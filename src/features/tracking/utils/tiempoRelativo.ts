const MINUTOS_POR_HORA = 60;
const MINUTOS_POR_DIA = 1440;
const MS_POR_MINUTO = 60_000;

const TEXTO_SIN_DATOS = 'sin datos';

/**
 * Minutos transcurridos desde una marca de tiempo ISO. `null` si la fecha no
 * es parseable, para no mostrar "NaN min" en la interfaz.
 */
export function minutosDesde(iso: string, ahora: Date = new Date()): number | null {
    const marca = Date.parse(iso);

    if (Number.isNaN(marca)) {
        return null;
    }

    return Math.max(0, Math.floor((ahora.getTime() - marca) / MS_POR_MINUTO));
}

/**
 * "hace 4 min" · "hace 2 h" · "hace 3 d".
 */
export function formatearTiempoRelativo(iso: string, ahora: Date = new Date()): string {
    const minutos = minutosDesde(iso, ahora);

    if (minutos === null) {
        return TEXTO_SIN_DATOS;
    }

    if (minutos < 1) {
        return 'hace instantes';
    }

    if (minutos < MINUTOS_POR_HORA) {
        return `hace ${minutos} min`;
    }

    if (minutos < MINUTOS_POR_DIA) {
        return `hace ${Math.floor(minutos / MINUTOS_POR_HORA)} h`;
    }

    return `hace ${Math.floor(minutos / MINUTOS_POR_DIA)} d`;
}

/**
 * ¿La marca de tiempo superó el umbral de frescura configurado?
 */
export function esAntigua(iso: string, minutosUmbral: number, ahora: Date = new Date()): boolean {
    const minutos = minutosDesde(iso, ahora);

    if (minutos === null) {
        return true;
    }

    return minutos > minutosUmbral;
}