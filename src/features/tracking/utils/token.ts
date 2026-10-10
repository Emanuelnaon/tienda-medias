/**
 * El token viaja en el query string (`?t=TOKEN`), que puede llegar repetido.
 * Se normaliza a string plano recortado o `null` si no es utilizable.
 */
export function normalizarToken(valor: string | string[] | undefined | null): string | null {
    const bruto = Array.isArray(valor) ? valor[0] : valor;

    if (typeof bruto !== 'string') {
        return null;
    }

    const token = bruto.trim();

    return token === '' ? null : token;
}