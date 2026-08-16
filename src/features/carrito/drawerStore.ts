'use client';

import { create } from 'zustand';

interface DrawerState {
    isOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
}

export const useDrawerCarritoStore = create<DrawerState>((set) => ({
    isOpen: false,
    openDrawer: () => set({ isOpen: true }),
    closeDrawer: () => set({ isOpen: false }),
}));
