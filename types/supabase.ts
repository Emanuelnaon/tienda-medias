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
    };
  };
}
