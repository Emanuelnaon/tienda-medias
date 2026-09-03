'use server';

import { createSupabaseServerClient } from '@/src/lib/supabase/server';
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

export async function generarLinkWhatsApp(carrito: CarritoItemInput[], cliente: ClienteCheckoutInput): Promise<string> {
    if (!carrito || carrito.length === 0) {
        throw new Error('El carrito está vacío');
    }
    if (!cliente.nombre_completo.trim() || !cliente.telefono.trim()) {
        throw new Error('Nombre y teléfono son obligatorios');
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

    if (!data || data.length === 0 || data.length !== new Set(ids).size) {
        throw new Error('No se encontraron los productos seleccionados');
    }

    const productos = data as Database['public']['Tables']['productos']['Row'][];

    // Mapear productos por ID para acceso rápido O(1)
    const productosMap = new Map<string, Database['public']['Tables']['productos']['Row']>();
    productos.forEach((p) => {
        productosMap.set(p.id, p);
    });

    let totalReal = 0;
    const itemsPedido: Database['public']['Tables']['pedidos_items']['Insert'][] = [];
    let mensaje = '¡Hola! Quiero confirmar mi pedido.\n';

    carrito.forEach((item) => {
        const prodBD = productosMap.get(item.id);
        if (!prodBD || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
            throw new Error('El carrito contiene un producto o cantidad inválida');
        }

        const subtotal = prodBD.precio * item.cantidad;
        totalReal += subtotal;
        itemsPedido.push({
            pedido_id: '',
            producto_id: prodBD.id,
            nombre_producto: prodBD.nombre,
            talle: item.talle,
            cantidad: item.cantidad,
            precio_unitario: prodBD.precio,
        });

        mensaje += `- ${item.cantidad}x ${prodBD.nombre} ($${prodBD.precio})\n`;
    });

    const clientePayload: Pick<Database['public']['Tables']['clientes']['Row'], 'nombre_completo' | 'telefono'> = {
        nombre_completo: cliente.nombre_completo.trim(),
        telefono: cliente.telefono.trim(),
    };
    const { data: clienteRawData, error: clienteError } = await supabase
        .from('clientes')
        .upsert(clientePayload as never, { onConflict: 'telefono' })
        .select('id')
        .single();
    const clienteData = clienteRawData as Pick<Database['public']['Tables']['clientes']['Row'], 'id'> | null;

    if (clienteError || !clienteData) {
        console.error('Error al guardar cliente:', clienteError);
        throw new Error('No se pudo guardar la información del cliente');
    }

    const pedidoPayload: Pick<Database['public']['Tables']['pedidos']['Row'], 'cliente_id' | 'total' | 'estado'> = {
        cliente_id: clienteData.id,
        total: totalReal,
        estado: 'pendiente',
    };
    const { data: pedidoRawData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(pedidoPayload as never)
        .select('id')
        .single();
    const pedidoData = pedidoRawData as Pick<Database['public']['Tables']['pedidos']['Row'], 'id'> | null;

    if (pedidoError || !pedidoData) {
        console.error('Error al guardar pedido:', pedidoError);
        throw new Error('No se pudo registrar el pedido');
    }

    const itemsConPedido = itemsPedido.map((item) => ({ ...item, pedido_id: pedidoData.id }));
    const { error: itemsError } = await supabase.from('pedidos_items').insert(itemsConPedido as never[]);

    if (itemsError) {
        console.error('Error al guardar items del pedido:', itemsError);
        throw new Error('No se pudo registrar el detalle del pedido');
    }

    mensaje += `Total a pagar: $${totalReal}\n`;
    mensaje += `*Número de Orden: ${pedidoData.id.split('-')[0]}*`;

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
