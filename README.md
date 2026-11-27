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

| Commande                 | Rôle                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| `npm start`              | serveur de développement                                              |
| `npm run build`          | build de production avec prérendu, sortie dans `dist/ngshelf/browser` |
| `npm run build:dev`      | build de développement (sans optimisation, avec sourcemaps)           |
| `npm run watch`          | build de développement en continu                                     |
| `npm run registre:build` | lit `registry/`, le valide et écrit `src/generated/registre/`         |
| `npm run lint`           | analyse ESLint (angular-eslint, règles angular-sidy)                  |
| `npm test`               | tests unitaires (Vitest)                                              |
| `npm run format`         | formate le dépôt avec Prettier                                        |
| `npm run format:check`   | vérifie le formatage sans modifier les fichiers                       |

`registre:build` est lancé automatiquement avant `start`, `build`, `build:dev`, `watch`, `test` et `lint` (scripts `pre…` de npm) : passez par `npm run …`, pas par `ng` directement, sinon les sorties peuvent manquer ou être périmées.

## Registre

`registry/<categorie>/<slug>/meta.json` est la source unique des ressources (ADR 0002 et 0004) : `composants/`, `blocs/`, `templates/`, `designs/`. Pour ajouter une ressource, créer son dossier et son `meta.json` (modèle : `shared/models/ressource.model.ts`, textes au format `{ "fr": "…" }`), puis lancer `npm run registre:build`. Le script (`scripts/registre/`) refuse le build si un type ou un secteur est hors de la taxonomie (`shared/models/taxonomie.model.ts`), un slug en double, plus de 3 secteurs ou 8 tags, une dépendance non vide, un texte français absent, un champ inconnu, une valeur de `animee` qui n'est pas un booléen, une `tailleCase` hors de `normale`, `large`, `haute`, `large-haute`.

Champs de la planche du catalogue (facultatifs, repris dans les index) : `animee` (la ressource a ses propres animations : badge « Animée » et filtre ; absent = faux) et `tailleCase` (taille de sa case dans la planche : 1×1, 2×1, 1×2 ou 2×2 ; absent = `normale`). Une ressource est « réglable » quand `contratTokens` vaut 1.

Sorties, dans `src/generated/registre/` (non versionnées) : un index par catégorie (`index-<categorie>.json`, chargé à la demande, jamais dans le bundle initial) et `compteurs.json` (ressources publiées par catégorie, type et secteur, plus le nombre de ressources réglables et animées ; dans le bundle initial pour le méga-menu).

## Structure

```
src/
├── app/
│   ├── core/       services singleton : config du site, textes fr, registre, cookies, thème
│   ├── shared/     éléments réutilisés par au moins deux features : modèles, icône, marque
│   ├── features/   une feature par dossier (accueil, catalogue, ressource, à propos, 404)
│   └── layouts/    gabarit de page : header, menu mobile, menu du thème, pied de page
├── generated/      sorties du registre (non versionnées, voir « Registre »)
├── styles/         tokens.css, components.css (copies du design system) et contrat/ (tokens --ngs-*)
├── index.html
├── main.ts / main.server.ts
└── styles.css      Tailwind, tokens et composants
registry/           ressources du catalogue : un meta.json par ressource
scripts/registre/   script Node de build du registre (TypeScript, exécuté tel quel par Node 26) et ses tests
public/             favicon, icônes, fonts/, icons/sprite.svg, theme-init.js, robots.txt, _headers
```

Les imports passent par les alias `@core/*`, `@shared/*`, `@features/*`, `@layouts/*` et `@generated/*`, jamais par des chemins relatifs remontants.

## Design, thème et textes

- **Tokens** : `src/styles/tokens.css` (thème Tailwind `@theme`) et `components.css` (classes `.ngs-*`) sont des copies de `design/design-system/` ; ne modifier une valeur que là-bas. Aucune couleur, police ni durée en dur dans un composant.
- **Contrat des ressources** : `src/styles/contrat/` (12 tokens `--ngs-*`, pont Tailwind `ngshelf-theme.css`). Ces fichiers ne sont pas chargés par le site lui-même.
- **Polices** : Chivo et Chivo Mono, auto-hébergées dans `public/fonts/` (SIL OFL 1.1, notice jointe). Si un fichier change, le renommer : le cache est immuable.
- **Icônes** : sprite Phosphor `public/icons/sprite.svg`, utilisé par `<svg appIcone="nom">` ; les noms valides sont typés dans `shared/components/icone/icones.ts`.
- **Thème** : clair, sombre ou système, mémorisé dans le cookie `ngs_theme` (jamais `localStorage`). `public/theme-init.js` pose `data-theme` avant le premier rendu ; `ThemeService` reprend ensuite côté navigateur.
- **Textes** : tous dans `core/i18n/textes.fr.ts`, marqués `$localize` avec l'identifiant `@@clé` (`@angular/localize`, langue source `fr`). Nom du site et liens de Sidy : `core/config/site.config.ts`.
- **Recherche et menus** : dialogue ⌘K / Ctrl+K (`<dialog>` natif, recherche locale sur les index chargés à la première ouverture), méga-menu « Catalogue » du header et liste des secteurs du menu mobile, tous alimentés par `compteurs.json`.
- **Routes** : toutes lazy. Prérendues depuis le registre (`getPrerenderParams`) : `/<categorie>` (composants, blocs, templates, designs), `/<categorie>/<type>` et `/secteurs/<secteur>` seulement si au moins une ressource, `/<categorie>/<type>/<slug>` pour chaque fiche. Un type ou un secteur sans ressource n'a pas de page : il n'est pas un lien dans la navigation.

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
