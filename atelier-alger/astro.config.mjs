// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Site statique : sortie 100 % HTML, déployable sur Vercel / Netlify / tout hébergeur de fichiers.
export default defineConfig({
  site: 'https://atelier-alger.example',
  vite: {
    plugins: [tailwindcss()],
  },
});
