export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          email: string
          id: string
          role: string
          tenant_id: string | null
          whatsapp: string | null
        }
        Insert: {
          email: string
          id: string
          role?: string
          tenant_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          email?: string
          id?: string
          role?: string
          tenant_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string | null
          es_preset: boolean
          id: string
          nombre: string
          padre_id: string | null
          slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          es_preset?: boolean
          id?: string
          nombre: string
          padre_id?: string | null
          slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          es_preset?: boolean
          id?: string
          nombre?: string
          padre_id?: string | null
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_padre_id_fkey"
            columns: ["padre_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cantidad_pedidos: number | null
          created_at: string | null
          email: string | null
          estado: string | null
          id: string
          nombre_completo: string
          notas: string | null
          telefono: string
          tenant_id: string
          total_gastado: number | null
        }
        Insert: {
          cantidad_pedidos?: number | null
          created_at?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre_completo: string
          notas?: string | null
          telefono: string
          tenant_id: string
          total_gastado?: number | null
        }
        Update: {
          cantidad_pedidos?: number | null
          created_at?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre_completo?: string
          notas?: string | null
          telefono?: string
          tenant_id?: string
          total_gastado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          comprobante_url: string | null
          created_at: string | null
          estado: string | null
          id: string
          tenant_id: string
          total: number
        }
        Insert: {
          cliente_id?: string | null
          comprobante_url?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          tenant_id: string
          total: number
        }
        Update: {
          cliente_id?: string | null
          comprobante_url?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          tenant_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_items: {
        Row: {
          cantidad: number
          id: string
          nombre_producto: string
          pedido_id: string | null
          precio_unitario: number
          producto_id: string | null
          talle: string | null
          variante_id: string | null
        }
        Insert: {
          cantidad: number
          id?: string
          nombre_producto: string
          pedido_id?: string | null
          precio_unitario: number
          producto_id?: string | null
          talle?: string | null
          variante_id?: string | null
        }
        Update: {
          cantidad?: number
          id?: string
          nombre_producto?: string
          pedido_id?: string | null
          precio_unitario?: number
          producto_id?: string | null
          talle?: string | null
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "producto_variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          plan: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          plan: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          plan?: string
        }
        Relationships: []
      }
      producto_variantes: {
        Row: {
          created_at: string | null
          id: string
          producto_id: string
          sku: string | null
          stock: number
          talle: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          producto_id: string
          sku?: string | null
          stock?: number
          talle: string
        }
        Update: {
          created_at?: string | null
          id?: string
          producto_id?: string
          sku?: string | null
          stock?: number
          talle?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_variantes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: string | null
          codigo_corto: string | null
          created_at: string
          descripcion: string | null
          galeria_imagenes: string[] | null
          id: string
          imagen_url: string | null
          nombre: string
          precio: number
          stock: number
          talles_disponibles: string[]
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          codigo_corto?: string | null
          created_at?: string
          descripcion?: string | null
          galeria_imagenes?: string[] | null
          id?: string
          imagen_url?: string | null
          nombre: string
          precio?: number
          stock?: number
          talles_disponibles?: string[]
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          codigo_corto?: string | null
          created_at?: string
          descripcion?: string | null
          galeria_imagenes?: string[] | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio?: number
          stock?: number
          talles_disponibles?: string[]
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          activo: boolean
          created_at: string
          email: string | null
          id: string
          nombre: string
          plan: string
          slug: string
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          plan?: string
          slug: string
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          plan?: string
          slug?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirmar_pedido_transaccion: {
        Args: { p_pedido_id: string }
        Returns: Json
      }
      confirmar_venta_y_actualizar_crm: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
      get_my_tenant_id: { Args: never; Returns: string }
      is_webmaster: { Args: never; Returns: boolean }
      crear_cliente_checkout: {
        Args: {
          p_nombre_completo: string
          p_telefono: string
          p_tenant_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
