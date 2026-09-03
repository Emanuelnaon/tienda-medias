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
                    className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                {isOpen && (
                    <div
                        id="admin-mobile-menu"
                        className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        <NavigationLinks pathname={pathname} onNavigate={() => setIsOpen(false)} />
                        <p className="mt-2 truncate border-t border-slate-100 px-3 pt-3 text-xs text-slate-500">
                            {email}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
            <div className="border-b border-slate-100 px-6 py-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-600">Socks Store</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">Panel de administración</h2>
                <p className="mt-1 truncate text-xs text-slate-500">{email}</p>
            </div>
            <nav aria-label="Navegación de administración" className="flex-1 px-4 py-6">
                <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Gestión del negocio
                </p>
                <NavigationLinks pathname={pathname} />
            </nav>
            <div className="mx-4 mb-5 rounded-lg bg-slate-950 px-4 py-3 text-xs text-slate-300">
                <p className="font-semibold text-white">Centro de operaciones</p>
                <p className="mt-1">Todo tu negocio, en un solo lugar.</p>
            </div>
        </aside>
    );
}

function NavigationLinks({ pathname, onNavigate }: Readonly<{ pathname: string; onNavigate?: () => void }>) {
    return (
        <div className="space-y-1">
            {navigationItems.map(({ href, label, description, icon: Icon }) => {
                const isActive = isActiveRoute(pathname, href);

                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                            isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                        }`}>
                        <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold">{label}</span>
                            <span
                                className={`block truncate text-xs ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {description}
                            </span>
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
