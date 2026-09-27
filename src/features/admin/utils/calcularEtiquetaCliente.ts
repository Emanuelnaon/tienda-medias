import type { EtiquetaCliente } from '../types/clientesTypes';

const ETIQUETAS_CLIENTE = {
    nuevo: {
        texto: 'Nuevo',
        estilos: 'border-amber-500/40 text-amber-700 dark:text-amber-300',
    },
    regular: {
        texto: 'Regular',
        estilos: 'border-slate-400/40 text-slate-700 dark:text-slate-300',
    },
    frecuente: {
        texto: 'Frecuente',
        estilos: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
    },
} as const;

type TipoEtiquetaCliente = keyof typeof ETIQUETAS_CLIENTE;

function normalizarCantidadPedidos(cantidadPedidos: number | null): number {
    return cantidadPedidos ?? 0;
}

function resolverTipoEtiqueta(cantidad: number): TipoEtiquetaCliente | null {
    if (cantidad === 0) return null;
    if (cantidad === 1) return 'nuevo';
    if (cantidad === 2) return 'regular';
    return 'frecuente';
}

export function calcularEtiquetaCliente(cantidadPedidos: number | null): EtiquetaCliente | null {
    const cantidad = normalizarCantidadPedidos(cantidadPedidos);
    const tipo = resolverTipoEtiqueta(cantidad);
    return tipo ? ETIQUETAS_CLIENTE[tipo] : null;
}
