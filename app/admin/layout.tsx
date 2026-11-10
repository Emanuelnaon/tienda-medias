import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { AdminNavigation } from '@/src/components/admin/AdminNavigation';

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const supabase = await createSupabaseServerClient();

    // 1. Verificar si hay una sesión activa
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // 2. Verificar el rol de administrador en la base de datos
    const { data: adminUser, error } = await supabase.from('admin_users').select('id').eq('id', user.id).single();

    // Si hay error (no encontró la fila) o no hay data, es un usuario estándar
    if (error || !adminUser) {
        redirect('/'); // Expulsar a la página principal
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-8 lg:hidden">
                <h1 className="text-lg font-bold tracking-tight text-foreground">Panel de administración</h1>
                <AdminNavigation email={user.email ?? 'Administrador'} mobileOnly />
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
                <AdminNavigation email={user.email ?? 'Administrador'} />
                <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
        </div>
    );
}
