import React from 'react';
import { FormularioLogin } from '@/src/features/auth/components/FormularioLogin';

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <FormularioLogin />
        </div>
    );
}
