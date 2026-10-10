import { redirect } from 'next/navigation';
import type { EstadoPedido } from '@/src/features/logistica';
import { PanelRepartidor, normalizarToken, validarTokenRepartidor } from '@/src/features/tracking';

const ESTADOS_HABILITADOS: ReadonlyArray<EstadoPedido> = ['en_camino', 'entregado'];

type DeliveryPageProps = Readonly<{
    params: Promise<{ pedido_id: string }>;
    searchParams: Promise<{ t?: string | string[] }>;
}>;

export default async function DeliveryPage({ params, searchParams }: DeliveryPageProps) {
    const [{ pedido_id }, parametrosBusqueda] = await Promise.all([params, searchParams]);
    const token = normalizarToken(parametrosBusqueda.t);

    if (token === null) {
        redirect('/');
    }

    const validacion = await validarTokenRepartidor(pedido_id, token);

    if (!validacion.valido || validacion.estado === null) {
        redirect('/');
    }

    if (!ESTADOS_HABILITADOS.includes(validacion.estado)) {
        redirect('/');
    }

    return (
        <article className="mx-auto w-full max-w-md px-4 py-8">
            <PanelRepartidor pedidoId={pedido_id} token={token} estado={validacion.estado} />
        </article>
    );
}