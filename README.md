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
│   ├── core/       services singleton (SEO, cookies, configuration)
│   ├── shared/     éléments réutilisés par au moins deux features
│   ├── features/   une feature par dossier, routes lazy
│   └── layouts/    gabarits de page
├── index.html
├── main.ts / main.server.ts
└── styles.css      Tailwind et tokens
public/             favicon, icônes, robots.txt, _headers
```

Les imports passent par les alias `@core/*`, `@shared/*`, `@features/*` et `@layouts/*`, jamais par des chemins relatifs remontants.

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

Le workflow `.github/workflows/ci.yml` s'exécute sur chaque pull request et sur chaque push vers `dev`, `preprod` et `main`. Il lance trois jobs indépendants aux noms stables : `lint` (`npm run lint`), `build` (`npm run build`) et `test` (`npm test -- --no-watch`). Rien n'est déployé : la CI ne fait que vérifier le code, sans secret.
