'use server';

import { revalidatePath } from 'next/cache';
import { obtenerTenantIdAdmin, verificarAdministrador } from '@/src/lib/auth/admin';
import type { Database } from '@/src/types/supabase';

export type DatosProductoConVariantes = Readonly<{
    id?: string;
    nombre: string;
    codigoCorto: string | null;
    descripcion: string | null;
    precio: number;
    imagenUrl: string | null;
    galeriaImagenes: ReadonlyArray<string> | null;
    categoriaId: string | null;
    tallesDisponibles: ReadonlyArray<string>;
    variantes: ReadonlyArray<{
        readonly talle: string;
        readonly stock: number;
    }>;
}>;

export type ProductoRow = Database['public']['Tables']['productos']['Row'];
export type ProductoInsert = Database['public']['Tables']['productos']['Insert'];

export type VarianteInsert = {
    id?: string;
    producto_id: string;
    talle: string;
    stock: number;
};

/**
 * Revalidación centralizada de rutas
 */
function revalidarRutasProductos(productoId?: string) {
    revalidatePath('/admin');
    revalidatePath('/admin/nuevo');
    revalidatePath('/catalogo');
    if (productoId) {
        revalidatePath(`/admin/editar/${productoId}`);
        revalidatePath(`/producto/${productoId}`);
    }
}

/**
 * Upsert de cabecera de producto (Reducción de Complejidad Cognitiva)
 */
async function upsertProductoBase(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    datos: DatosProductoConVariantes,
    tenantId: string,
): Promise<string> {
    const productoData: ProductoInsert = {
        ...(datos.id ? { id: datos.id } : {}),
        nombre: datos.nombre,
        codigo_corto: datos.codigoCorto ?? undefined,
        descripcion: datos.descripcion ?? undefined,
        precio: datos.precio,
        imagen_url: datos.imagenUrl ?? undefined,
        galeria_imagenes: datos.galeriaImagenes ? [...datos.galeriaImagenes] : undefined,
        categoria_id: datos.categoriaId ?? undefined,
        talles_disponibles: datos.tallesDisponibles.length > 0 ? [...datos.tallesDisponibles] : undefined,
        stock: datos.variantes.reduce((sum, v) => sum + v.stock, 0),
        tenant_id: tenantId,
    };

    if (datos.id) {
        const { error: updateError } = await supabase.from('productos').update(productoData).eq('id', datos.id);

        if (updateError) {
            throw new Error(`Error al actualizar el producto: ${updateError.message}`);
        }
        return datos.id;
    }

    const { data: nuevoProducto, error: insertError } = await supabase
        .from('productos')
        .insert(productoData)
        .select('id')
        .single();

    if (insertError || !nuevoProducto) {
        throw new Error(`Error al crear el producto: ${insertError?.message || 'Sin retorno de ID'}`);
    }

    return (nuevoProducto as { id: string }).id;
}

/**
 * Sincroniza variantes conservando los IDs que puedan estar referenciados
 * por pedidos históricos.
 */
async function sincronizarVariantesProducto(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    productoId: string,
    variantes: ReadonlyArray<{ readonly talle: string; readonly stock: number }>,
) {
    const { data: variantesExistentes, error: selectError } = await supabase
        .from('producto_variantes')
        .select('id, talle')
        .eq('producto_id', productoId);

    if (selectError) {
        throw new Error(`Error al consultar variantes anteriores: ${selectError.message}`);
    }

    const existentesPorTalle = new Map<string, string>(
        (variantesExistentes ?? []).map((variante: { id: string; talle: string }) => [
            variante.talle,
            variante.id,
        ]),
    );
    const tallesActivos = new Set(variantes.map((variante) => variante.talle));

    for (const variante of variantes) {
        const varianteId = existentesPorTalle.get(variante.talle);
        const consulta = varianteId
            ? supabase.from('producto_variantes').update({ stock: variante.stock }).eq('id', varianteId)
            : supabase.from('producto_variantes').insert({
                producto_id: productoId,
                talle: variante.talle,
                stock: variante.stock,
            } satisfies VarianteInsert);
        const { error } = await consulta;

        if (error) {
            throw new Error(`Error al guardar la variante ${variante.talle}: ${error.message}`);
        }
    }

    const idsInactivos = (variantesExistentes ?? [])
        .filter((variante: { id: string; talle: string }) => !tallesActivos.has(variante.talle))
        .map((variante: { id: string; talle: string }) => variante.id);

    if (idsInactivos.length > 0) {
        const { error: desactivarError } = await supabase
            .from('producto_variantes')
            .update({ stock: 0 })
            .in('id', idsInactivos);

        if (desactivarError) {
            throw new Error(`Error al desactivar variantes anteriores: ${desactivarError.message}`);
        }
    }
}

/**
 * Guardar o actualizar producto con variantes por talle (Sprint 6)
 */
export async function guardarProductoConVariantes(
    datos: DatosProductoConVariantes,
): Promise<{ success: boolean; productoId: string; mensaje: string }> {
    if (!datos.nombre || datos.precio < 0) {
        throw new Error('El nombre y un precio válido son requeridos.');
    }

    if (!datos.variantes || datos.variantes.length === 0) {
        throw new Error('Debes asignar al menos una variante (talle + stock).');
    }

    try {
        const supabase = await verificarAdministrador('realizar esta operación');
        const tenantId = await obtenerTenantIdAdmin();

        // 1. Guardar/Actualizar cabecera del producto
        const productoId = await upsertProductoBase(supabase, datos, tenantId);

        // 2. Sincronizar variantes sin romper referencias de pedidos históricos
        await sincronizarVariantesProducto(supabase, productoId, datos.variantes);

        // 3. Revalidación
        revalidarRutasProductos(productoId);

        return {
            success: true,
            productoId,
            mensaje: `Producto "${datos.nombre}" guardado con éxito con ${datos.variantes.length} variante(s).`,
        };
    } catch (error) {
        const mensajeError = error instanceof Error ? error.message : 'Error al procesar el producto.';
        console.error('Error en guardarProductoConVariantes:', mensajeError);
        throw new Error(mensajeError);
    }
}

/**
 * Eliminar un producto y sus variantes atómicamente desde el Server (SSOT)
 */
export type ResultadoEliminarProducto =
    | { readonly success: true }
    | { readonly success: false; readonly mensaje: string };

export async function eliminarProductoAction(id: string): Promise<ResultadoEliminarProducto> {
    if (!id) {
        return { success: false, mensaje: 'No se pudo identificar el producto.' };
    }

    try {
        const supabase = await verificarAdministrador('realizar esta operación');

        const { error } = await supabase.from('productos').delete().eq('id', id);

        if (error) {
            if (error.code === '23503') {
                return {
                    success: false,
                    mensaje: 'No se puede eliminar porque forma parte de pedidos históricos.',
                };
            }
            return {
                success: false,
                mensaje: 'No se pudo eliminar el producto. Actualizá la lista y volvé a intentar.',
            };
        }

        revalidarRutasProductos(id);

        return { success: true };
    } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error al eliminar producto.';
        console.error('Error en eliminarProductoAction:', mensaje);
        return {
            success: false,
            mensaje: 'No se pudo eliminar el producto. Actualizá la lista y volvé a intentar.',
        };
    }
}
