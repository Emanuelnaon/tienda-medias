export interface Database {
    public: {
        Tables: {
            productos: {
                Row: {
                    id: string;
                    nombre: string;
                    descripcion: string | null;
                    precio: number;
                    stock: number;
                    talles_disponibles: string[];
                    imagen_url: string | null;
                    galeria_imagenes: string[] | null;
                    user_id: string | null;
                    created_at: string;
                    codigo_corto: string | null;
                    categoria: string | null;
                };
                Insert: {
                    id?: string;
                    nombre: string;
                    descripcion?: string | null;
                    precio?: number;
                    stock?: number;
                    talles_disponibles?: string[];
                    imagen_url?: string | null;
                    galeria_imagenes?: string[] | null;
                    user_id?: string | null;
                    created_at?: string;
                    codigo_corto?: string | null;
                    categoria?: string | null;
                };
                Update: {
                    id?: string;
                    nombre?: string;
                    descripcion?: string | null;
                    precio?: number;
                    stock?: number;
                    talles_disponibles?: string[];
                    imagen_url?: string | null;
                    galeria_imagenes?: string[] | null;
                    user_id?: string | null;
                    created_at?: string;
                    codigo_corto?: string | null;
                    categoria?: string | null;
                };
            };
            admin_users: {
                Row: {
                    id: string;
                    email: string;
                    whatsapp: string | null;
                };
                Insert: {
                    id?: string;
                    email: string;
                    whatsapp?: string | null;
                };
                Update: {
                    id?: string;
                    email?: string;
                    whatsapp?: string | null;
                };
            };
            clientes: {
                Row: {
                    id: string;
                    created_at: string | null;
                    nombre_completo: string;
                    telefono: string;
                    email: string | null;
                    estado: string | null;
                    total_gastado: number | null;
                    cantidad_pedidos: number | null;
                    notas: string | null;
                };
                Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id'> & { id?: string };
                Update: Partial<Database['public']['Tables']['clientes']['Insert']>;
            };
            pedidos: {
                Row: {
                    id: string;
                    created_at: string | null;
                    cliente_id: string | null;
                    estado: string | null;
                    total: number;
                    comprobante_url: string | null;
                    tenant_id: string | null;
                };
                Insert: Partial<Database['public']['Tables']['pedidos']['Row']>;
                Update: Partial<Database['public']['Tables']['pedidos']['Row']>;
            };
            pedidos_items: {
                Row: {
                    id: string;
                    pedido_id: string | null;
                    producto_id: string | null;
                    nombre_producto: string;
                    talle: string | null;
                    cantidad: number;
                    precio_unitario: number;
                };
                Insert: Partial<Database['public']['Tables']['pedidos_items']['Row']>;
                Update: Partial<Database['public']['Tables']['pedidos_items']['Row']>;
            };
            producto_variantes: {
                Row: {
                    id: string;
                    producto_id: string;
                    talle: string;
                    stock: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    producto_id: string;
                    talle: string;
                    stock?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    producto_id?: string;
                    talle?: string;
                    stock?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Functions: {
            confirmar_venta_y_actualizar_crm: {
                Args: { pedido_id: string };
                Returns: unknown;
            };
        };
    };
}
