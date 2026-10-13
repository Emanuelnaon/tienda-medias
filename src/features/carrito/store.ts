import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackPixel } from '@/src/features/tracking-pixel';

export interface CartItem {
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    talle_seleccionado: string;
    categoria: string;
    imagenUrl: string | null;
    stockMaximo: number;
}

interface CartStore {
    items: CartItem[];
    agregarItem: (item: CartItem) => void;
    removerItem: (id: string, talle: string) => void;
    actualizarCantidad: (id: string, talle: string, cantidad: number) => void;
    limpiarCarrito: () => void;
    obtenerTotal: () => number;
}

export const useCarritoStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            agregarItem: (nuevoItem) =>
                set((state) => {
                    const itemExistente = state.items.some(
                        (i) => i.id === nuevoItem.id && i.talle_seleccionado === nuevoItem.talle_seleccionado,
                    );

                    if (itemExistente) {
                        return {
                            items: state.items.map((i) => {
                                if (i.id === nuevoItem.id && i.talle_seleccionado === nuevoItem.talle_seleccionado) {
                                    const nuevaCantidad = i.cantidad + nuevoItem.cantidad;
                                    return {
                                        ...i,
                                        cantidad: Math.min(nuevaCantidad, i.stockMaximo),
                                    };
                                }
                                return i;
                            }),
                        };
                    }

                    if (typeof window !== 'undefined') {
                        trackPixel('AddToCart', {
                            content_name: nuevoItem.nombre,
                            content_ids: [nuevoItem.id],
                            value: nuevoItem.precio * nuevoItem.cantidad,
                            currency: 'ARS',
                        });
                    }

                    return { items: [...state.items, nuevoItem] };
                }),
            removerItem: (id, talle) =>
                set((state) => ({
                    items: state.items.filter((i) => !(i.id === id && i.talle_seleccionado === talle)),
                })),
            actualizarCantidad: (id, talle, cantidad) =>
                set((state) => ({
                    items: state.items.map((i) => {
                        if (i.id === id && i.talle_seleccionado === talle) {
                            const cantidadValidada = Math.min(Math.max(1, cantidad), i.stockMaximo);
                            return { ...i, cantidad: cantidadValidada };
                        }
                        return i;
                    }),
                })),
            limpiarCarrito: () => set({ items: [] }),
            obtenerTotal: () => {
                return get().items.reduce((total, item) => total + item.precio * item.cantidad, 0);
            },
        }),
        {
            name: 'carrito-almacenamiento',
        },
    ),
);
