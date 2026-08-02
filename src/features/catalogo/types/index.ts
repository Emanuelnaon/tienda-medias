import type { Database } from '@/types/supabase';

export type CatalogProducto = Database['public']['Tables']['productos']['Row'];

export interface CatalogoState {
    loading: boolean;
    error: string | null;
    items: CatalogProducto[];
}
