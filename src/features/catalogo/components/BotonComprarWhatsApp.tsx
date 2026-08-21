'use client';

import React from 'react';
import { WHATSAPP_SUPPORT_NUMBER } from '@/src/lib/constants';

interface BotonComprarWhatsAppProps {
    nombreProducto: string;
    precio: number;
}

export function BotonComprarWhatsApp({ nombreProducto, precio }: BotonComprarWhatsAppProps) {
    const handleComprar = () => {
        const mensaje = encodeURIComponent(`Hola, quiero comprar ${nombreProducto} por $${precio}`);
        const url = `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${mensaje}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <button 
            onClick={handleComprar}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm w-full md:w-auto"
        >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 1.981 14.119.957 11.5.957c-5.442 0-9.868 4.371-9.872 9.799-.001 1.77.471 3.5 1.365 5.001l-.994 3.63 3.734-.972c1.554.851 3.123 1.299 4.819 1.299zm10.222-7.143c-.273-.138-1.618-.802-1.868-.894-.25-.092-.432-.138-.614.138-.182.276-.705.894-.864 1.077-.159.183-.318.206-.59.068-.273-.138-1.152-.427-2.195-1.363-.811-.727-1.358-1.626-1.517-1.898-.159-.272-.017-.419.119-.556.123-.122.273-.318.41-.477.136-.159.182-.272.272-.455.091-.183.046-.341-.023-.477-.068-.136-.614-1.487-.84-2.035-.22-.529-.442-.458-.614-.467-.16-.008-.341-.01-.522-.01s-.477.068-.727.341c-.25.273-.954.932-.954 2.27s.977 2.633 1.114 2.815c.137.182 1.923 2.937 4.658 4.123.65.282 1.158.45 1.553.577.653.208 1.248.178 1.717.108.523-.078 1.618-.662 1.846-1.3c.227-.638.227-1.185.159-1.3-.069-.114-.25-.183-.523-.321z" />
            </svg>
            Comprar
        </button>
    );
}
