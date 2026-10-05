'use server';

import { createSupabaseServerClient, createSupabasePublicClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/supabase';
import { WHATSAPP_SUPPORT_NUMBER } from '@/src/lib/constants';
import {
    calcularEnvio,
    describirLineaEnvio,
    describirMotivoEnvio,
} from '@/src/features/logistica';
import { consultarCoberturaEnvio } from '@/src/features/logistica/server';

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

export interface ResultadoCheckout {
    pedidoId: string;
    linkWhatsApp: string;
}

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
    if (!carrito || carrito.length === 0) {
        throw new Error('El carrito está vacío');
    }
    if (!cliente.nombre_completo.trim() || !cliente.telefono.trim()) {
        throw new Error('Nombre y teléfono son obligatorios');
    }

    const supabase = createSupabasePublicClient();
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

    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'default')
        .single();

    if (tenantError || !tenant) {
        throw new Error('Tenant no encontrado');
    }

    // Envío: el costo nunca viaja desde el navegador. Se recalcula acá con el
    // subtotal real de la base de datos contra las zonas activas del tenant.
    const codigoPostal = cliente.codigo_postal?.trim() ?? '';
    const direccionEntrega = cliente.direccion_entrega?.trim() ?? '';
    const cobertura = await consultarCoberturaEnvio();

    let costoEnvio = 0;
    let lineaEnvio: string | null = null;

    if (cobertura.estaHabilitado) {
        if (codigoPostal === '') {
            throw new Error('Ingresá tu código postal para calcular el costo de envío');
        }

        const resultadoEnvio = calcularEnvio(cobertura.zonas, codigoPostal, totalReal);

        if (!resultadoEnvio.esValido) {
            throw new Error(describirMotivoEnvio(resultadoEnvio.motivo));
        }

        costoEnvio = resultadoEnvio.costo;
        lineaEnvio = describirLineaEnvio(resultadoEnvio);
    }

    const clientePayload: Pick<Database['public']['Tables']['clientes']['Row'], 'nombre_completo' | 'telefono' | 'tenant_id'> = {
        nombre_completo: cliente.nombre_completo.trim(),
        telefono: cliente.telefono.trim(),
        tenant_id: tenant.id,
    };
    const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('telefono', clientePayload.telefono)
        .maybeSingle();

    let clienteId: string | null;

    if (clienteExistente) {
        clienteId = clienteExistente.id;
    } else {
        const { data: nuevoClienteId, error: clienteError } = await supabase.rpc('crear_cliente_checkout', {
            p_nombre_completo: clientePayload.nombre_completo,
            p_telefono: clientePayload.telefono,
            p_tenant_id: tenant.id,
        });

        if (clienteError || !nuevoClienteId) {
            console.error('Error al guardar cliente:', clienteError);
            throw new Error('No se pudo guardar la información del cliente');
        }
        clienteId = nuevoClienteId;
    }

    const clienteData = { id: clienteId };

    const itemsJson = itemsPedido.map((item) => ({
        producto_id: item.producto_id,
        nombre_producto: item.nombre_producto,
        talle: item.talle,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
    }));

    const { data: pedidoId, error: pedidoError } = await supabase
        .rpc('crear_pedido_checkout', {
            p_cliente_id: clienteData.id,
            p_total: totalReal + costoEnvio,
            p_tenant_id: tenant.id,
            p_items: itemsJson,
        });

    if (pedidoError || !pedidoId) {
        console.error('Error al guardar pedido:', pedidoError);
        throw new Error('No se pudo registrar el pedido');
    }

    if (lineaEnvio !== null) {
        mensaje += `${lineaEnvio}\n`;
    }

    if (codigoPostal !== '') {
        mensaje += `Código postal: ${codigoPostal}\n`;
    }

    if (direccionEntrega !== '') {
        mensaje += `Dirección de entrega: ${direccionEntrega}\n`;
    }

    mensaje += `Total a pagar: $${totalReal + costoEnvio}\n`;
    mensaje += `*Número de Orden: ${pedidoId.split('-')[0]}*`;

    // 5. Retorno: Codifica el string con encodeURIComponent y devuelve pedidoId + linkWhatsApp.
    const textoCodificado = encodeURIComponent(mensaje);
    const linkWhatsApp = `https://wa.me/${numeroAdmin}?text=${textoCodificado}`;
    return { pedidoId, linkWhatsApp };
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
