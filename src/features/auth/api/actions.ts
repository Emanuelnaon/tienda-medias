'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function signInWithEmailAndPassword(
    email: string,
    password: string,
): Promise<{ success: boolean; error: string | null }> {
    try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Fuerza a Next.js a reevaluar el árbol de componentes (incluidos layouts )
    revalidatePath('/', 'layout'); 
        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
}

export async function signOutAction(): Promise<{ success: boolean }> {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    return { success: true };
}
