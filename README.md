# Dépôt — deux projets

Ce dépôt contient deux projets indépendants :

| Dossier | Projet |
| --- | --- |
| [`atelier-alger/`](atelier-alger/README.md) | **Site vitrine & catalogue Atelier Alger** — céramique algérienne peinte à la main (Astro + Tailwind + TypeScript). C'est le projet à déployer : voir son README. |
| racine (`src/`, `index.html`, `vite.config.js`) | Outil d'analyse ROI GetAround (React + Vite), antérieur et sans rapport. Documenté ci-dessous. |

---

# Analyse ROI — Achat & location GetAround

## Déploiement gratuit (le plus simple : Netlify Drop)

1. Sur ton PC : dézippe ce dossier, ouvre un terminal dedans, puis :
   ```
   npm install
   npm run build
   ```
   Cela crée un dossier `dist/`.
2. Va sur https://app.netlify.com/drop
3. Glisse-dépose le dossier `dist/` sur la page.
4. Tu obtiens une URL publique en quelques secondes (ex: `https://xxxx.netlify.app`).

## Alternative : Vercel

1. Crée un compte gratuit sur https://vercel.com
2. Installe la CLI : `npm i -g vercel`
3. Dans le dossier du projet : `vercel`
4. Suis les instructions (déploiement automatique, URL fournie).

## Alternative : sans rien installer (StackBlitz)

1. Va sur https://stackblitz.com/fork/vite-react
2. Remplace le contenu de `src/App.jsx` par celui de `src/ROITool.jsx` (import à adapter)
3. Ajoute les dépendances `recharts` et `lucide-react` dans le panneau de gauche
4. StackBlitz te donne une URL de preview partageable instantanément

## Développement local

```
npm install
npm run dev
```
Puis ouvre http://localhost:5173
