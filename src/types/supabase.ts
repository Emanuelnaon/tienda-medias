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
                Relationships: [];
            };
            producto_variantes: {
                Row: {
                    id: string;
                    producto_id: string;
                    talle: string;
                    stock: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    producto_id: string;
                    talle: string;
                    stock?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    producto_id?: string;
                    talle?: string;
                    stock?: number;
                    created_at?: string;
                };
                Relationships: [];
            };
            categorias: {
                Row: {
                    id: string;
                    nombre: string;
                    slug: string;
                    tenant_id: string;
                    es_preset: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    nombre: string;
                    slug: string;
                    tenant_id?: string;
                    es_preset?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    nombre?: string;
                    slug?: string;
                    tenant_id?: string;
                    es_preset?: boolean;
                    created_at?: string;
                };
                Relationships: [];
            };
            admin_users: {
                Row: {
                    id: string;
                    email: string;
                    whatsapp: string | null;
                    tenant_id: string | null;
                    role: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    whatsapp?: string | null;
                    tenant_id?: string | null;
                    role?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    whatsapp?: string | null;
                    tenant_id?: string | null;
                    role?: string;
                };
                Relationships: [];
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
                Relationships: [];
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
                Relationships: [];
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
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: {
            confirmar_pedido_transaccion: {
                Args: { pedido_id: string };
                Returns: { success: boolean; mensaje: string };
            };

            get_my_tenant_id: {
                Args: Record<string, never>;
                Returns: string;
            };
        };
    };
}
