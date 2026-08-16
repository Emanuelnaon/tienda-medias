'use client';

import React from 'react';
import { useDrawerCarritoStore } from '@/src/features/carrito/drawerStore';
import { DrawerCarrito } from '@/src/features/carrito/components/DrawerCarrito';

export function MainLayoutWrapper() {
    const isOpen = useDrawerCarritoStore((state) => state.isOpen);
    const closeDrawer = useDrawerCarritoStore((state) => state.closeDrawer);

    return <DrawerCarrito isOpen={isOpen} onClose={closeDrawer} />;
}
