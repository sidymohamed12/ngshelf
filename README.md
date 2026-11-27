# NgShelf

Catalogue public de ressources Angular : composants à voir en vrai, à copier et à adapter. Site 100 % statique, prérendu au build, sans serveur ni back-end (voir l'ADR 0001 dans `docs/adr/`).

## Stack

| Élément     | Choix                                                               |
| ----------- | ------------------------------------------------------------------- |
| Framework   | Angular 22 (zoneless, `OnPush` par défaut, signals)                 |
| Langage     | TypeScript 6, mode `strict` et `strictTemplates`                    |
| Style       | Tailwind CSS v4 (`@tailwindcss/postcss`)                            |
| Rendu       | Prérendu statique (`outputMode: "static"`), hydratation côté client |
| Tests       | Vitest via `ng test`                                                |
| Hébergement | Cloudflare Pages (plan gratuit)                                     |
| Outils      | Node 26, npm 11                                                     |

## Démarrage

```bash
npm ci
npm start
```

Le site est servi sur `http://localhost:4200/` et se recharge à chaque modification.

## Scripts

| Commande               | Rôle                                                                  |
| ---------------------- | --------------------------------------------------------------------- |
| `npm start`            | serveur de développement                                              |
| `npm run build`        | build de production avec prérendu, sortie dans `dist/ngshelf/browser` |
| `npm run build:dev`    | build de développement (sans optimisation, avec sourcemaps)           |
| `npm run watch`        | build de développement en continu                                     |
| `npm run lint`         | analyse ESLint (angular-eslint, règles angular-sidy)                  |
| `npm test`             | tests unitaires (Vitest)                                              |
| `npm run format`       | formate le dépôt avec Prettier                                        |
| `npm run format:check` | vérifie le formatage sans modifier les fichiers                       |

## Structure

```
src/
├── app/
│   ├── core/       services singleton : config du site, textes fr, registre, cookies, thème
│   ├── shared/     éléments réutilisés par au moins deux features : modèles, icône, marque
│   ├── features/   une feature par dossier (accueil, catalogue, ressource, à propos, 404)
│   └── layouts/    gabarit de page : header, menu mobile, menu du thème, pied de page
├── styles/         tokens.css, components.css (copies du design system) et contrat/ (tokens --ngs-*)
├── index.html
├── main.ts / main.server.ts
└── styles.css      Tailwind, tokens et composants
public/             favicon, icônes, fonts/, icons/sprite.svg, theme-init.js, robots.txt, _headers
```

Les imports passent par les alias `@core/*`, `@shared/*`, `@features/*` et `@layouts/*`, jamais par des chemins relatifs remontants.

## Design, thème et textes

- **Tokens** : `src/styles/tokens.css` (thème Tailwind `@theme`) et `components.css` (classes `.ngs-*`) sont des copies de `design/design-system/` ; ne modifier une valeur que là-bas. Aucune couleur, police ni durée en dur dans un composant.
- **Contrat des ressources** : `src/styles/contrat/` (12 tokens `--ngs-*`, pont Tailwind `ngshelf-theme.css`). Ces fichiers ne sont pas chargés par le site lui-même.
- **Polices** : Chivo et Chivo Mono, auto-hébergées dans `public/fonts/` (SIL OFL 1.1, notice jointe). Si un fichier change, le renommer : le cache est immuable.
- **Icônes** : sprite Phosphor `public/icons/sprite.svg`, utilisé par `<svg appIcone="nom">` ; les noms valides sont typés dans `shared/components/icone/icones.ts`.
- **Thème** : clair, sombre ou système, mémorisé dans le cookie `ngs_theme` (jamais `localStorage`). `public/theme-init.js` pose `data-theme` avant le premier rendu ; `ThemeService` reprend ensuite côté navigateur.
- **Textes** : tous dans `core/i18n/textes.fr.ts`, marqués `$localize` avec l'identifiant `@@clé` (`@angular/localize`, langue source `fr`). Nom du site et liens de Sidy : `core/config/site.config.ts`.
- **Routes** : toutes lazy ; `/:categorie/:type/:slug` est prérendue pour chaque ressource du registre (`getPrerenderParams`).

## Déploiement : Cloudflare Pages

Le build produit uniquement des fichiers statiques, sans serveur Node.

| Réglage Cloudflare Pages | Valeur                 |
| ------------------------ | ---------------------- |
| Commande de build        | `npm run build`        |
| Dossier de sortie        | `dist/ngshelf/browser` |
| Variable `NODE_VERSION`  | `26`                   |

`public/_headers` est copié dans la sortie : cache long et immuable sur les fichiers hachés (`.js`, `.css`, `.woff2`), pas de cache forcé sur le HTML, en-têtes de sécurité et Content-Security-Policy stricte (aucun script en ligne, d'où `inlineCritical: false` en production).

`public/robots.txt` ne contient pas de ligne `Sitemap` tant que le nom de domaine n'est pas connu.

## Prérequis

- Node 26
- npm 11

## Intégration continue

Le workflow `.github/workflows/ci.yml` s'exécute sur chaque pull request et sur chaque push vers `dev`, `preprod` et `main`. Il lance quatre jobs indépendants aux noms stables : `lint` (`npm run lint`), `format` (`npm run format:check`), `build` (`npm run build`) et `test` (`npm test -- --no-watch`). Rien n'est déployé : la CI ne fait que vérifier le code, sans secret.
