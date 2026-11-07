'use server';

import { createSupabaseServerClient, createSupabasePublicClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/supabase';
import { WHATSAPP_SUPPORT_NUMBER } from '@/src/lib/constants';

export interface CarritoItemInput {
    id: string;
    cantidad: number;
    talle: string;
}

export interface ClienteCheckoutInput {
    nombre_completo: string;
    telefono: string;
    codigo_postal?: string;
    direccion_entrega?: string;
}

export type ResultadoCheckout =
    | { ok: true; pedidoId: string; token: string; linkWhatsApp: string }
    | { ok: false; error: string };

async function obtenerNumeroWhatsAppAdmin(): Promise<string> {
    const supabase = await createSupabaseServerClient();
    const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('whatsapp')
        .limit(1)
        .maybeSingle();
    const adminWhatsapp = adminData as Pick<Database['public']['Tables']['admin_users']['Row'], 'whatsapp'> | null;

    if (adminError) {
        console.error('Error al obtener número de WhatsApp de admin:', adminError);
    }

    return adminWhatsapp?.whatsapp?.replace(/[^\d+]/g, '') || WHATSAPP_SUPPORT_NUMBER;
}

export async function generarLinkWhatsApp(
    carrito: CarritoItemInput[],
    cliente: ClienteCheckoutInput,
): Promise<ResultadoCheckout> {
    const supabase = createSupabasePublicClient();

    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'default')
        .single();

    if (tenantError || !tenant) {
        console.error('Error al resolver tenant:', tenantError);
        return { ok: false, error: 'No pudimos registrar tu pedido. Intentá de nuevo.' };
    }

    const { data, error } = await supabase.rpc('registrar_pedido_checkout', {
        p_tenant_id: tenant.id,
        p_nombre: cliente.nombre_completo,
        p_telefono: cliente.telefono,
        p_items: carrito.map(({ id, cantidad, talle }) => ({
            producto_id: id,
            talle,
            cantidad,
        })),
        p_codigo_postal: cliente.codigo_postal ?? undefined,
        p_direccion: cliente.direccion_entrega ?? undefined,
    });

    if (error || !data) {
        const msg = error?.message ?? '';
        let friendly = 'No pudimos registrar tu pedido. Intentá de nuevo.';
        let mapped = false;
        if (msg.includes('Cliente bloqueado')) {
            friendly = 'No pudimos procesar tu pedido. Contactá al comercio por WhatsApp.';
            mapped = true;
        } else if (msg.includes('Teléfono inválido')) {
            friendly = 'Revisá tu teléfono: tiene que tener al menos 8 dígitos.';
            mapped = true;
        } else if (msg.includes('NOMBRE_INVALIDO')) {
            friendly = 'Ingresá tu nombre completo.';
            mapped = true;
        } else if (msg.includes('CARRITO_INVALIDO')) {
            friendly = 'Tu carrito tiene un problema. Volvé a armarlo.';
            mapped = true;
        } else if (msg.includes('PRODUCTO_NO_DISPONIBLE')) {
            friendly = 'Algún producto de tu carrito ya no está disponible.';
            mapped = true;
        } else if (msg.includes('SIN_STOCK')) {
            friendly = 'No hay stock suficiente de algún producto de tu carrito.';
            mapped = true;
        } else if (msg.includes('CP_INVALIDO')) {
            friendly = 'Ingresá un código postal de 4 dígitos.';
            mapped = true;
        } else if (msg.includes('SIN_COBERTURA')) {
            friendly = 'Por ahora no realizamos envíos a ese código postal.';
            mapped = true;
        }
        if (!mapped) {
            console.error('Error al registrar pedido:', error);
        }
        return { ok: false, error: friendly };
    }

    const result = data as {
        pedido_id: string;
        token: string;
        subtotal: number;
        costo_envio: number;
        total: number;
        metodo_envio: string | null;
        whatsapp: string | null;
        items: { nombre: string; cantidad: number; precio: number }[];
    };

    const numeroAdmin = (result.whatsapp ?? '').replace(/[^\d+]/g, '') || WHATSAPP_SUPPORT_NUMBER;

    let mensaje = '¡Hola! Quiero confirmar mi pedido.\n';
    for (const item of result.items) {
        mensaje += `- ${item.cantidad}x ${item.nombre} ($${item.precio})\n`;
    }
    mensaje += `Subtotal: $${result.subtotal}\n`;
    if (result.costo_envio) {
        mensaje += `Envío: $${result.costo_envio}\n`;
    }
    mensaje += `Total a pagar: $${result.total}\n`;
    mensaje += `*Número de Orden: ${result.pedido_id.split('-')[0]}*`;

    const textoCodificado = encodeURIComponent(mensaje);
    const linkWhatsApp = `https://wa.me/${numeroAdmin}?text=${textoCodificado}`;
    return { ok: true, pedidoId: result.pedido_id, token: result.token, linkWhatsApp };
}

export async function obtenerLinkCompartirAdmin(productoId: string): Promise<string> {
    if (!productoId) {
        throw new Error('ID de producto no proporcionado');
    }

    const supabase = await createSupabaseServerClient();
    const numeroAdmin = await obtenerNumeroWhatsAppAdmin();

    const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('id', productoId)
        .single();

    const producto = prodData as Database['public']['Tables']['productos']['Row'] | null;

    if (prodError || !producto) {
        console.error('Error al consultar producto:', prodError);
        throw new Error('Producto no encontrado');
    }

    const codigoMostrar = producto.codigo_corto || 'Sin código';
    const mensaje = `Hola, quiero consultar el stock de: ${producto.nombre} (Código: ${codigoMostrar})`;

    const textoCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${numeroAdmin}?text=${textoCodificado}`;
}