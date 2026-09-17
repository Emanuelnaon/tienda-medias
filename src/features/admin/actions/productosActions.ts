'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/supabase';

export type DatosProductoConVariantes = Readonly<{
    id?: string;
    nombre: string;
    codigoCorto: string | null;
    descripcion: string | null;
    precio: number;
    imagenUrl: string | null;
    galeriaImagenes: ReadonlyArray<string> | null;
    categoria: string | null;
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
 * Validar autenticación y permisos de administrador
 */
async function verificarAdministrador() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Debes iniciar sesión para realizar esta operación.');
    }

    const { data: administrador, error } = await supabase.from('admin_users').select('id').eq('id', user.id).single();

    if (error || !administrador) {
        throw new Error('No tienes permisos suficientes de administración.');
    }

    return supabase;
}

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
): Promise<string> {
    const productoData: ProductoInsert = {
        ...(datos.id ? { id: datos.id } : {}),
        nombre: datos.nombre,
        codigo_corto: datos.codigoCorto ?? undefined,
        descripcion: datos.descripcion ?? undefined,
        precio: datos.precio,
        imagen_url: datos.imagenUrl ?? undefined,
        galeria_imagenes: datos.galeriaImagenes ? [...datos.galeriaImagenes] : undefined,
        categoria: datos.categoria ?? undefined,
        talles_disponibles: datos.tallesDisponibles.length > 0 ? [...datos.tallesDisponibles] : undefined,
        stock: datos.variantes.reduce((sum, v) => sum + v.stock, 0),
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
 * Reemplazo atómico de variantes de producto
 */
async function reemplazarVariantesProducto(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    productoId: string,
    variantes: ReadonlyArray<{ readonly talle: string; readonly stock: number }>,
) {
    const { error: deleteError } = await supabase.from('producto_variantes').delete().eq('producto_id', productoId);

    if (deleteError) {
        throw new Error(`Error al limpiar variantes anteriores: ${deleteError.message}`);
    }

    const variantesData: VarianteInsert[] = variantes.map((v) => ({
        producto_id: productoId,
        talle: v.talle,
        stock: v.stock,
    }));

    const { error: insertVariantesError } = await supabase.from('producto_variantes').insert(variantesData);

    if (insertVariantesError) {
        throw new Error(`Error al insertar variantes: ${insertVariantesError.message}`);
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
        const supabase = await verificarAdministrador();

        // 1. Guardar/Actualizar cabecera del producto
        const productoId = await upsertProductoBase(supabase, datos);

        // 2. Reemplazar variantes por talle
        await reemplazarVariantesProducto(supabase, productoId, datos.variantes);

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
export async function eliminarProductoAction(id: string): Promise<{ success: boolean }> {
    if (!id) {
        throw new Error('Se requiere un ID de producto válido.');
    }

    try {
        const supabase = await verificarAdministrador();

        const { error } = await supabase.from('productos').delete().eq('id', id);

        if (error) {
            throw new Error(`Error al eliminar producto: ${error.message}`);
        }

        revalidarRutasProductos(id);

        return { success: true };
    } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error al eliminar producto.';
        console.error('Error en eliminarProductoAction:', mensaje);
        throw new Error(mensaje);
    }
}
