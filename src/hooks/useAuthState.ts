'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useCarritoStore } from '@/src/features/carrito/store';
import { useFavoritosStore } from '@/src/features/favoritos/store/useFavoritosStore';

const emptySubscribe = () => () => {};

export function useAuthState() {
    const router = useRouter();
    const [usuario, setUsuario] = useState<SupabaseUser | null>(null);

    const mounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );

    const items = useCarritoStore((state) => state.items);
    const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

    const favoritos = useFavoritosStore((state) => state.favoritos);
    const totalFavoritos = favoritos.length;

    const [animateBadge, setAnimateBadge] = useState(false);

    useEffect(() => {
        if (totalItems > 0) {
            const timer1 = setTimeout(() => setAnimateBadge(true), 10);
            const timer2 = setTimeout(() => setAnimateBadge(false), 300);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [totalItems]);

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data }) => setUsuario(data.user));

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUsuario(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUsuario(null);
        router.refresh();
        window.location.href = '/';
    };

    return {
        usuario,
        mounted,
        totalItems,
        totalFavoritos,
        animateBadge,
        handleSignOut,
    };
}
