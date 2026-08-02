import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import type { Database } from '@/types/supabase';

export async function getProductos() {
    // Llamamos a la función con un await y SIN argumentos
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.from('productos').select('*');

    if (error) throw new Error(error.message);
    return data;
}
