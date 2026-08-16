import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '@/src/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

interface FavoritosStore {
    favoritos: Producto[];
    toggleFavorito: (producto: Producto) => void;
    esFavorito: (id: string) => boolean;
}

export const useFavoritosStore = create<FavoritosStore>()(
    persist(
        (set, get) => ({
            favoritos: [],
            toggleFavorito: (producto) =>
                set((state) => {
                    const existe = state.favoritos.some((p) => p.id === producto.id);
                    if (existe) {
                        return {
                            favoritos: state.favoritos.filter((p) => p.id !== producto.id),
                        };
                    }
                    return { favoritos: [...state.favoritos, producto] };
                }),
            esFavorito: (id) => {
                return get().favoritos.some((p) => p.id === id);
            },
        }),
        {
            name: 'wishlist-storage',
        },
    ),
);