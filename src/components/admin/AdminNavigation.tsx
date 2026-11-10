'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Menu, Package, Settings, ShoppingCart, Users, X, type LucideIcon } from 'lucide-react';

type AdminNavigationProps = Readonly<{
    email: string;
    mobileOnly?: boolean;
}>;

type NavigationItem = {
    href: string;
    label: string;
    description: string;
    icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
    {
        href: '/admin',
        label: 'Dashboard',
        description: 'Resumen general',
        icon: LayoutDashboard,
    },
    {
        href: '/admin/productos',
        label: 'Catálogo & Stock',
        description: 'Productos e inventario',
        icon: Package,
    },
    {
        href: '/admin/pedidos',
        label: 'Ventas & Pedidos',
        description: 'Gestionar ventas',
        icon: ShoppingCart,
    },
    {
        href: '/admin/clientes',
        label: 'CRM Clientes',
        description: 'Relación con clientes',
        icon: Users,
    },
    {
        href: '/admin/configuracion',
        label: 'Configuración',
        description: 'Ajustes del tenant',
        icon: Settings,
    },
];

function isActiveRoute(pathname: string, href: string): boolean {
    return href === '/admin' ? pathname === href : pathname.startsWith(href);
}

export function AdminNavigation({ email, mobileOnly = false }: AdminNavigationProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    if (mobileOnly) {
        return (
            <div className="relative lg:hidden">
                <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls="admin-mobile-menu"
                    aria-label={isOpen ? 'Cerrar menú de administración' : 'Abrir menú de administración'}
                    onClick={() => setIsOpen((open) => !open)}
                    className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-border-soft focus:outline-none focus:ring-2 focus:ring-violet">
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                {isOpen && (
                    <div
                        id="admin-mobile-menu"
                        className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-border bg-surface p-2 shadow-xl">
                        <NavigationLinks pathname={pathname} onNavigate={() => setIsOpen(false)} />
                        <p className="mt-2 truncate border-t border-border px-3 pt-3 text-xs text-muted-foreground">
                            {email}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <section className="hidden lg:block bg-surface border border-border rounded-2xl p-5 lg:p-6 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
                        Socks Store
                    </p>
                    <h2 className="font-display font-extrabold text-2xl lg:text-3xl text-foreground tracking-tight">
                        Panel de administración
                    </h2>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-background px-3 py-1.5 rounded-lg border border-border self-start sm:self-auto">
                    {email}
                </span>
            </div>
            <nav aria-label="Navegación de administración" className="flex gap-2 overflow-x-auto pb-1">
                <NavigationLinks pathname={pathname} />
            </nav>
        </section>
    );
}

function NavigationLinks({ pathname, onNavigate }: Readonly<{ pathname: string; onNavigate?: () => void }>) {
    return (
        <div className="space-y-1 lg:flex lg:gap-2 lg:space-y-0">
            {navigationItems.map(({ href, label, description, icon: Icon }) => {
                const isActive = isActiveRoute(pathname, href);

                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors lg:shrink-0 ${
                            isActive
                                ? 'bg-violet-soft text-violet-soft-foreground'
                                : 'border border-transparent text-muted-foreground hover:bg-border-soft hover:text-foreground'
                        }`}>
                        <Icon size={19} strokeWidth={isActive ? 2.4 : 2} className={isActive ? 'text-violet-soft-foreground' : 'text-muted-foreground'} />
                        <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${isActive ? 'text-violet-soft-foreground' : 'text-foreground'}`}>
                                {label}
                            </span>
                            <span
                                className={`block truncate text-xs ${isActive ? 'text-violet-soft-foreground font-medium' : 'text-muted-foreground'}`}>
                                {description}
                            </span>
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
