/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import type { Database } from '@/types/supabase';
export type DatosProductoConVariantes = {
    id?: string;
    nombre: string;
    codigoCorto: string | null;
    descripcion: string | null;
    precio: number;
    imagenUrl: string | null;
    galeriaImagenes: string[] | null;
    categoria: string | null;
    tallesDisponibles: string[];
    variantes: Array<{
        talle: string;
        stock: number;
    }>;
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
 *
 * Ejecuta:
 * 1. INSERT/UPDATE en tabla `productos`
 * 2. DELETE + INSERT en tabla `producto_variantes` (upsert de variantes)
 * 3. Revalidar rutas
 */
export async function guardarProductoConVariantes(
    datos: DatosProductoConVariantes,
): Promise<{ success: boolean; productoId: string; mensaje: string }> {
    // Validaciones básicas
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
            galeria_imagenes: datos.galeriaImagenes ?? undefined,
            categoria: datos.categoria ?? undefined,
            talles_disponibles: datos.tallesDisponibles.length > 0 ? datos.tallesDisponibles : undefined,
            // El stock total se calcula como suma de variantes (opcional, pero mantener para compatibilidad)
            stock: datos.variantes.reduce((sum, v) => sum + v.stock, 0),
        };

        let productoId: string = datos.id || '';

        if (datos.id) {
            // UPDATE: Producto existente
            const updateResult: any = await (supabase.from('productos') as any).update(productoData).eq('id', datos.id);

            const { error: updateError } = updateResult;

            if (updateError) {
                throw new Error(`Error al actualizar producto: ${updateError.message}`);
            }
        } else {
            // INSERT: Nuevo producto
            const insertResult: any = await (supabase.from('productos') as any)
                .insert([productoData])
                .select('id')
                .single();

            const { data: productoInserido, error: insertError } = insertResult;

            if (insertError || !productoInserido) {
                throw new Error(`Error al crear producto: ${insertError?.message || 'ID no retornado'}`);
            }

            productoId = productoInserido.id;
        }

        // PASO 2: Limpiar variantes existentes y crear nuevas
        // Primero, eliminar todas las variantes actuales del producto
        const { error: deleteError } = await supabase.from('producto_variantes').delete().eq('producto_id', productoId);

        if (deleteError) {
            throw new Error(`Error al limpiar variantes: ${deleteError.message}`);
        }

        // Ahora insertar las nuevas variantes
        const variantesData: Database['public']['Tables']['producto_variantes']['Insert'][] = datos.variantes.map(
            (v) => ({
                producto_id: productoId,
                talle: v.talle,
                stock: v.stock,
            }),
        );

        const { error: insertVariantesError } = await supabase.from('producto_variantes').insert(variantesData);

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
