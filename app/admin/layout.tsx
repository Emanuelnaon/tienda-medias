import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createSupabaseServerClient();

    // 1. Verificar si hay una sesión activa
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    // 2. Verificar el rol de administrador en la base de datos
    const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', session.user.id)
        .single();

    // Si hay error (no encontró la fila) o no hay data, es un usuario estándar
    if (error || !adminUser) {
        redirect('/'); // Expulsar a la página principal
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="border-b border-border bg-background p-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold font-mono tracking-tight">PANEL DE CONTROL</h1>
                <span className="text-sm font-medium opacity-70">{session.user.email}</span>
            </header>
            
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
