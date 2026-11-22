import React from 'react';
import { FormularioLogin } from '@/src/features/auth/components/FormularioLogin';

export default function LoginPage() {
    return (
        <div className="flex min-h-96 flex-col items-center justify-center px-4">
            <FormularioLogin />
        </div>
    );
}
