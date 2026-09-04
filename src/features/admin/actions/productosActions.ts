'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type DatosProductoConVariantes = {
    readonly id?: string;
    readonly nombre: string;
    readonly codigoCorto: string | null;
    readonly descripcion: string | null;
    readonly precio: number;
    readonly imagenUrl: string | null;
    readonly galeriaImagenes: ReadonlyArray<string> | null;
    readonly categoria: string | null;
    readonly tallesDisponibles: ReadonlyArray<string>;
    readonly variantes: ReadonlyArray<{
        readonly talle: string;
        readonly stock: number;
    }>;
};

type VarianteInsert = {
    producto_id: string;
    talle: string;
    stock: number;
};

/**
 * Validar que el usuario sea administrador
 */
async function verificarAdministrador() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Debes iniciar sesión para crear productos.');
    }

    const { data: administrador, error } = await supabase.from('admin_users').select('id').eq('id', user.id).single();

    if (error || !administrador) {
        throw new Error('No tienes permisos para crear productos.');
    }

    return supabase;
}

/**
 * Guardar producto con variantes por talle (Sprint 6)
 */
export async function guardarProductoConVariantes(
    datos: DatosProductoConVariantes,
): Promise<{ success: boolean; productoId: string; mensaje: string }> {
    if (!datos.nombre || datos.precio < 0) {
        throw new Error('Nombre y precio son requeridos y válidos.');
    }

    if (!datos.variantes || datos.variantes.length === 0) {
        throw new Error('Debes asignar al menos una variante (talle + stock).');
    }

    try {
        const supabase = await verificarAdministrador();

        // PASO 1: Guardar el producto en la tabla `productos`
        const productoData: Database['public']['Tables']['productos']['Insert'] = {
            id: datos.id,
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

        let productoId: string = datos.id || '';

        if (datos.id) {
            // UPDATE: Producto existente
            const { error: updateError } = await (
                supabase.from('productos') as unknown as {
                    update: (data: typeof productoData) => {
                        eq: (column: string, val: string) => Promise<{ error: Error | null }>;
                    };
                }
            )
                .update(productoData)
                .eq('id', datos.id);

            if (updateError) {
                throw new Error(`Error al actualizar producto: ${updateError.message}`);
            }
        } else {
            // INSERT: Nuevo producto
            const { data: productoInserido, error: insertError } = await (
                supabase.from('productos') as unknown as {
                    insert: (data: (typeof productoData)[]) => {
                        select: (cols: string) => {
                            single: () => Promise<{ data: { id: string } | null; error: Error | null }>;
                        };
                    };
                }
            )
                .insert([productoData])
                .select('id')
                .single();

            if (insertError || !productoInserido) {
                throw new Error(`Error al crear producto: ${insertError?.message || 'ID no retornado'}`);
            }

            productoId = productoInserido.id;
        }

        // PASO 2: Limpiar variantes existentes y crear nuevas
        const { error: deleteError } = await supabase.from('producto_variantes').delete().eq('producto_id', productoId);

        if (deleteError) {
            throw new Error(`Error al limpiar variantes: ${deleteError.message}`);
        }

        const variantesData: VarianteInsert[] = datos.variantes.map((v) => ({
            producto_id: productoId,
            talle: v.talle,
            stock: v.stock,
        }));

        // Cast explicito para evitar el error 'never[]'
        const { error: insertVariantesError } = await (
            supabase.from('producto_variantes') as unknown as {
                insert: (data: VarianteInsert[]) => Promise<{ error: Error | null }>;
            }
        ).insert(variantesData);

        if (insertVariantesError) {
            throw new Error(`Error al crear variantes: ${insertVariantesError.message}`);
        }

        // PASO 3: Revalidar rutas
        revalidatePath('/admin');
        revalidatePath('/admin/nuevo');
        revalidatePath('/admin/editar/[id]');
        revalidatePath('/catalogo');

        return {
            success: true,
            productoId,
            mensaje: `Producto "${datos.nombre}" guardado con éxito. ${datos.variantes.length} variante(s) creadas.`,
        };
    } catch (error) {
        const mensajeError = error instanceof Error ? error.message : 'Error desconocido al guardar el producto.';
        console.error('Error en guardarProductoConVariantes:', mensajeError);
        throw new Error(mensajeError);
    }
}
