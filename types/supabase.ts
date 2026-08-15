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
