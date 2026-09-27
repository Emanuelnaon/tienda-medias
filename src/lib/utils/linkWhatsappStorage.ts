const PREFIJO_CLAVE = 'pedido-whatsapp-';

function claveLinkWhatsapp(pedidoId: string): string {
    return `${PREFIJO_CLAVE}${pedidoId}`;
}

export function guardarLinkWhatsApp(pedidoId: string, link: string): void {
    try {
        localStorage.setItem(claveLinkWhatsapp(pedidoId), link);
    } catch {}
}

export function leerLinkWhatsApp(pedidoId: string): string | null {
    try {
        return localStorage.getItem(claveLinkWhatsapp(pedidoId));
    } catch {
        return null;
    }
}
