import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    talle_seleccionado: string;
}

interface CartStore {
    items: CartItem[];
    agregarItem: (item: CartItem) => void;
    removerItem: (id: string, talle: string) => void;
    limpiarCarrito: () => void;
    obtenerTotal: () => number;
}

// Envolvemos nuestra lógica con persist()
export const useCarritoStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            agregarItem: (nuevoItem) =>
                set((state) => {
                    const itemExistente = state.items.find(
                        (i) => i.id === nuevoItem.id && i.talle_seleccionado === nuevoItem.talle_seleccionado,
                    );
                    if (itemExistente) {
                        return {
                            items: state.items.map((i) =>
                                i.id === nuevoItem.id && i.talle_seleccionado === nuevoItem.talle_seleccionado
                                    ? { ...i, cantidad: i.cantidad + nuevoItem.cantidad }
                                    : i,
                            ),
                        };
                    }
                    return { items: [...state.items, nuevoItem] };
                }),
            removerItem: (id, talle) =>
                set((state) => ({
                    items: state.items.filter((i) => !(i.id === id && i.talle_seleccionado === talle)),
                })),
            limpiarCarrito: () => set({ items: [] }),
            obtenerTotal: () => {
                return get().items.reduce((total, item) => total + item.precio * item.cantidad, 0);
            },
        }),
        {
            name: 'carrito-almacenamiento', // El nombre con el que se guarda en el navegador
        },
    ),
);
