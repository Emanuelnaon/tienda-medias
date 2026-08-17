'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function signInWithEmailAndPassword(
    email: string,
    password: string,
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Fuerza a Next.js a reevaluar el árbol de componentes (incluidos layouts y navs)
    revalidatePath('/', 'layout');

    // Redirección del lado del servidor (Next.js actualiza la UI automáticamente)
    redirect('/');
}

export async function signOutAction(): Promise<void> {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}
