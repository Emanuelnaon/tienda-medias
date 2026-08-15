import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { MobileNav } from '@/src/components/layout/MobileNav';
import { ThemeProvider } from '@/src/components/ThemeProvider';
import { GoogleAnalytics } from '@next/third-parties/google';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Socks Store',
    description: 'La mejor tienda online de medias',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
            <body className="h-screen overflow-hidden bg-background text-foreground flex flex-col lg:flex-row">
                {/* Sidebar para desktop - Fijo a la izquierda */}
                <ThemeProvider>
                <Sidebar />

                {/* Contenedor del contenido principal - Scrollea de forma independiente */}
                <div className="flex-1 h-full overflow-y-auto pb-16 lg:pb-0 lg:pl-64 bg-background">
                    <main className="w-full max-w-7xl mx-auto p-4 md:p-8">{children}</main>
                </div>

                {/* Navegación móvil - Fija en la base */}
                <MobileNav />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#333',
                            color: '#fff',
                            borderRadius: '8px',
                        },
                    }}
                />
                </ThemeProvider>
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                )}
            </body>
        </html>
    );
}
