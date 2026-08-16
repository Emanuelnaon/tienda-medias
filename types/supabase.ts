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
          user_id?: string | null;
          created_at?: string;
          codigo_corto?: string | null;
          categoria?: string | null;
        };
      };
      admin_users: {
        Row: {
          id: string;
          whatsapp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          whatsapp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          whatsapp?: string;
          created_at?: string;
        };
      };
    };
  };
}
