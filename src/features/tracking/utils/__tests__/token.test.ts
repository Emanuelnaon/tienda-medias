import { describe, expect, it } from 'vitest';
import { normalizarToken } from '../token';

describe('normalizarToken', () => {
    it('devuelve el token tal cual cuando es un string válido', () => {
        expect(normalizarToken('abc123')).toBe('abc123');
    });

    it('recorta los espacios del token', () => {
        expect(normalizarToken('  abc123  ')).toBe('abc123');
    });

    it('toma el primer valor cuando el query string repite la clave', () => {
        expect(normalizarToken(['abc123', 'otro'])).toBe('abc123');
    });

    it('devuelve null para un token vacío o solo espacios', () => {
        expect(normalizarToken('')).toBeNull();
        expect(normalizarToken('    ')).toBeNull();
        expect(normalizarToken([])).toBeNull();
    });

    it('devuelve null cuando el parámetro no existe', () => {
        expect(normalizarToken(undefined)).toBeNull();
        expect(normalizarToken(null)).toBeNull();
    });
});