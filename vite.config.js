import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command, isPreview }) => ({ base: command === 'build' || isPreview ? '/Lumen/' : '/', plugins: [react()], server: { port: 5173, strictPort: true }, worker: { format: 'es' }, build: { target: 'es2022' } }));
