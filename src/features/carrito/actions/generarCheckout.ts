'use server';

import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { WHATSAPP_SUPPORT_NUMBER } from '@/src/lib/constants';

interface CarritoItemInput {
    id: string;
    cantidad: number;
}

async function obtenerNumeroWhatsAppAdmin(): Promise<string> {
    const supabase = await createSupabaseServerClient();
    const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('whatsapp')
        .limit(1)
        .single();
    const adminWhatsapp = adminData as Pick<Database['public']['Tables']['admin_users']['Row'], 'whatsapp'> | null;

    if (adminError) {
        console.error('Error al obtener número de WhatsApp de admin:', adminError);
    }

    return adminWhatsapp?.whatsapp?.replace(/[^\d+]/g, '') || WHATSAPP_SUPPORT_NUMBER;
}

export async function generarLinkWhatsApp(carrito: CarritoItemInput[]): Promise<string> {
    if (!carrito || carrito.length === 0) {
        throw new Error('El carrito está vacío');
    }

    const supabase = await createSupabaseServerClient();
    const numeroAdmin = await obtenerNumeroWhatsAppAdmin();

    // 2. Precios Seguros: Extrae los IDs del carrito y haz un select a la tabla productos filtrando con .in('id', arrayDeIds).
    const ids = carrito.map((item) => item.id);
    const { data, error: prodError } = await supabase.from('productos').select('*').in('id', ids);

    if (prodError) {
        console.error('Error al consultar productos:', prodError);
        throw new Error('Error al validar el carrito con la base de datos');
    }

    if (!data || data.length === 0) {
        throw new Error('No se encontraron los productos seleccionados');
    }

    const productos = data as Database['public']['Tables']['productos']['Row'][];

    // Mapear productos por ID para acceso rápido O(1)
    const productosMap = new Map<string, Database['public']['Tables']['productos']['Row']>();
    productos.forEach((p) => {
        productosMap.set(p.id, p);
    });

    // 3. Cálculo: Itera sobre el carrito, busca el producto correspondiente en los datos de la BD,
    // multiplica la cantidad por el precio real del servidor y suma el totalReal.
    // 4. Mensaje: Construye un string con el resumen del pedido.
    let totalReal = 0;
    let mensaje = '¡Hola! Quiero hacer el siguiente pedido:\n';

    carrito.forEach((item) => {
        const prodBD = productosMap.get(item.id);
        if (!prodBD) return; // Si un ID no existe en la BD, se ignora

        const subtotal = prodBD.precio * item.cantidad;
        totalReal += subtotal;

        mensaje += `- ${item.cantidad}x ${prodBD.nombre} ($${prodBD.precio})\n`;
    });

    mensaje += `Total a pagar: $${totalReal}`;

    // 5. Retorno: Codifica el string con encodeURIComponent y devuelve exactamente la estructura requerida.
    const textoCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${numeroAdmin}?text=${textoCodificado}`;
}

export async function obtenerLinkCompartirAdmin(productoId: string): Promise<string> {
    if (!productoId) {
        throw new Error('ID de producto no proporcionado');
    }

    const supabase = await createSupabaseServerClient();
    const numeroAdmin = await obtenerNumeroWhatsAppAdmin();

    // 2. Consulte el nombre y codigo_corto del producto en la tabla productos.
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

    // 3. Construya el mensaje: "Hola, quiero consultar el stock de: ${producto.nombre} (Código: ${producto.codigo_corto})"
    const codigoMostrar = producto.codigo_corto || 'Sin código';
    const mensaje = `Hola, quiero consultar el stock de: ${producto.nombre} (Código: ${codigoMostrar})`;

    // 4. Devuelva la URL completa armada con la variable dinámica.
    const textoCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${numeroAdmin}?text=${textoCodificado}`;
}
