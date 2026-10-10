import {
    ORIGENES_HISTORIAL,
    type EntradaHistorial,
    type PedidoTracking,
    type PosicionRepartidor,
} from '@/src/features/tracking/types';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function leerTexto(valor: unknown): string | null {
    return typeof valor === 'string' ? valor : null;
}

function leerNumero(valor: unknown): number | null {
    return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

/**
 * Los RPC de tracking devuelven `json`: se valida la forma en runtime antes de
 * castear para no confiar en el `Json` crudo. Vive en `utils` porque lo usan
 * tanto las queries de servidor como los hooks de Realtime del cliente.
 */
export function normalizarEntrada(valor: unknown): EntradaHistorial | null {
    if (!esObjeto(valor)) {
        return null;
    }

    const estadoNuevo = leerTexto(valor.estado_nuevo);
    const changedAt = leerTexto(valor.changed_at);

    if (estadoNuevo === null || changedAt === null) {
        return null;
    }

    return {
        estado_nuevo: estadoNuevo,
        estado_anterior: leerTexto(valor.estado_anterior),
        changed_at: changedAt,
        origen: leerTexto(valor.origen) ?? ORIGENES_HISTORIAL.sistema,
    };
}

export function normalizarHistorial(valor: unknown): ReadonlyArray<EntradaHistorial> {
    if (!Array.isArray(valor)) {
        return [];
    }

    return valor
        .map(normalizarEntrada)
        .filter((entrada): entrada is EntradaHistorial => entrada !== null);
}

export function normalizarTracking(valor: unknown): PedidoTracking | null {
    if (!esObjeto(valor)) {
        return null;
    }

    return {
        estado: leerTexto(valor.estado),
        metodo_envio: leerTexto(valor.metodo_envio),
        estado_anterior: leerTexto(valor.estado_anterior),
        historial: normalizarHistorial(valor.historial),
    };
}

export function normalizarPosicion(valor: unknown): PosicionRepartidor | null {
    if (!esObjeto(valor)) {
        return null;
    }

    const lat = leerNumero(valor.lat);
    const lng = leerNumero(valor.lng);
    const updatedAt = leerTexto(valor.updated_at);

    if (lat === null || lng === null || updatedAt === null) {
        return null;
    }

    return { lat, lng, updated_at: updatedAt };
}