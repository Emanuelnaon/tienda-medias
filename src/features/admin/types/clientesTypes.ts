import type { Database } from '@/src/types/supabase';

export type ClienteRow = Database['public']['Tables']['clientes']['Row'];

export type PedidoResumen = Pick<
    Database['public']['Tables']['pedidos']['Row'],
    'id' | 'created_at' | 'total' | 'estado' | 'comprobante_numero'
>;

export type ClienteConPedidos = ClienteRow & {
    readonly pedidos: ReadonlyArray<PedidoResumen>;
};

export type EtiquetaCliente = {
    readonly texto: string;
    readonly estilos: string;
};

export type ClienteConEtiqueta = ClienteRow & {
    readonly etiqueta: EtiquetaCliente | null;
};
