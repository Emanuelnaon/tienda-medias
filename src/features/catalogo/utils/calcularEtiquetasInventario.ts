export type TipoEtiqueta = 'agotado' | 'ultimas_unidades' | 'nuevo';

export interface ProductoParaEtiquetas {
    readonly stock: number;
    readonly created_at: string;
    readonly producto_variantes?: ReadonlyArray<{ readonly stock: number }> | null;
}

export interface EtiquetasInventario {
    readonly primary: TipoEtiqueta | null;
    readonly secondary: TipoEtiqueta | null;
}

/**
 * Determina si un producto fue creado hace 7 días o menos.
 */
export function esProductoNuevo(createdAt: string): boolean {
    const sieteDiasEnMs = 7 * 24 * 60 * 60 * 1000;
    const fechaCreacion = new Date(createdAt).getTime();
    const fechaLimite = Date.now() - sieteDiasEnMs;
    return fechaCreacion >= fechaLimite;
}

/**
 * Calcula las etiquetas primarias y secundarias de un producto basadas en el stock y fecha de creación.
 */
export function calcularEtiquetasInventario(producto: ProductoParaEtiquetas): EtiquetasInventario {
    const variantes = producto.producto_variantes;
    const tieneVariantes = Array.isArray(variantes) && variantes.length > 0;

    // 1. Determinar si está agotado
    const esAgotado = tieneVariantes
        ? variantes.every((v) => v.stock === 0)
        : producto.stock === 0;

    // 2. Determinar si tiene bajo stock (Últimas unidades)
    // Al menos una variante con stock > 0 y stock <= 3
    const tieneBajoStock = !esAgotado && (tieneVariantes
        ? variantes.some((v) => v.stock > 0 && v.stock <= 3)
        : (producto.stock > 0 && producto.stock <= 3));

    // 3. Determinar si es nuevo (creado hace menos de 7 días)
    const esNuevo = esProductoNuevo(producto.created_at);

    // 4. Asignar etiquetas primarias y secundarias
    let primary: TipoEtiqueta | null = null;
    if (esAgotado) {
        primary = 'agotado';
    } else if (tieneBajoStock) {
        primary = 'ultimas_unidades';
    }

    const secondary: TipoEtiqueta | null = esNuevo ? 'nuevo' : null;

    return { primary, secondary };
}
