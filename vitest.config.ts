import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'node',
        globals: true,
        include: ['**/*.test.ts'],
        exclude: ['**/*.spec.ts', 'node_modules', '.kilo'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
})
