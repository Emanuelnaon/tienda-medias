'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function signInWithMagicLink(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createSupabaseServerClient();
        const headersList = await headers();
        const origin = headersList.get('origin') || 'http://localhost:3000';
        
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
}
