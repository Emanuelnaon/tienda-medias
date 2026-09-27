export interface DeepLinkApp {
    nombre: string;
    scheme: string;
    fallbackUrl: string;
}

export const DEEP_LINK_APPS: DeepLinkApp[] = [
    {
        nombre: 'Mercado Pago',
        scheme: 'mercadopago://',
        fallbackUrl: 'https://www.mercadopago.com.ar',
    },
    {
        nombre: 'Naranja X',
        scheme: 'naranjax://',
        fallbackUrl: 'https://www.naranjax.com.ar',
    },
    {
        nombre: 'Brubank',
        scheme: 'brubank://',
        fallbackUrl: 'https://www.brubank.com.ar',
    },
];
