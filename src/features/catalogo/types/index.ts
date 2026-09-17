import type { Database } from '@/src/types/supabase';

export type CatalogProducto = Database['public']['Tables']['productos']['Row'];

export interface CatalogoState {
    loading: boolean;
    error: string | null;
    items: CatalogProducto[];
}
