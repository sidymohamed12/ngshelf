# NgShelf

Catalogue public de ressources Angular : composants à voir en vrai, à copier et à adapter. Site 100 % statique, prérendu au build, sans serveur ni back-end (voir l'ADR 0001 dans `docs/adr/`).

## Stack

| Élément     | Choix                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Framework   | Angular 22 (zoneless, `OnPush` par défaut, signals)                   |
| Langage     | TypeScript 6, mode `strict` et `strictTemplates`                      |
| Style       | Tailwind CSS v4 (`@tailwindcss/postcss`)                              |
| Rendu       | Prérendu statique (`outputMode: "static"`), hydratation côté client   |
| Animation   | GSAP 3.15.1 et Lenis 1.3.28 (npm, versions exactes, import dynamique) |
| Tests       | Vitest via `ng test`                                                  |
| Hébergement | Cloudflare Pages (plan gratuit)                                       |
| Outils      | Node 26, npm 11                                                       |

## Démarrage

```bash
npm ci
npm start
```

`npm start` lance ensemble le site (`http://localhost:4200/`) et l'application d'aperçus (`http://localhost:4201/apercu/`) : sans elle, les cases du catalogue et les fiches n'ont pas d'aperçu vivant. Les deux se rechargent à chaque modification, et Ctrl+C arrête les deux. Si le port 4200 est pris : `PORT_SITE=4210 npm start`. Pour ne lancer que l'un des deux : `npm run start:site` ou `npm run start:apercus`.

Sans le serveur des aperçus, `/apercu/*` répond une page « Aperçus indisponibles » (503, `proxy.conf.mjs`) qui dit quoi lancer ; les cases gardent leur icône et la fiche affiche son état d'erreur.

## Scripts

| Commande                 | Rôle                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| `npm start`              | site (4200) et aperçus (4201) ensemble, dans un seul terminal         |
| `npm run start:site`     | site seul (relaie `/apercu` vers le port 4201)                        |
| `npm run start:apercus`  | application d'aperçus seule (`/apercu/`, port 4201)                   |
| `npm run build`          | build de production avec prérendu, sortie dans `dist/ngshelf/browser` |
| `npm run build:dev`      | build de développement (sans optimisation, avec sourcemaps)           |
| `npm run watch`          | build de développement en continu                                     |
| `npm run registre:build` | lit `registry/`, le valide et écrit `src/generated/registre/`         |
| `npm run lint`           | analyse ESLint (angular-eslint, règles angular-sidy)                  |
| `npm test`               | tests unitaires (Vitest)                                              |
| `npm run format`         | formate le dépôt avec Prettier                                        |
| `npm run format:check`   | vérifie le formatage sans modifier les fichiers                       |

`registre:build` est lancé automatiquement avant `start`, `start:site`, `start:apercus`, `build`, `build:dev`, `watch`, `test` et `lint` (scripts `pre…` de npm) : passez par `npm run …`, pas par `ng` directement, sinon les sorties peuvent manquer ou être périmées.

## Registre

`registry/<categorie>/<slug>/meta.json` est la source unique des ressources (ADR 0002 et 0004) : `composants/`, `blocs/`, `templates/`, `designs/`. Pour ajouter une ressource, créer son dossier et son `meta.json` (modèle : `shared/models/ressource.model.ts`, textes au format `{ "fr": "…" }`), puis lancer `npm run registre:build`. Le script (`scripts/registre/`) refuse le build si un type ou un secteur est hors de la taxonomie (`shared/models/taxonomie.model.ts`), un slug en double, plus de 3 secteurs ou 8 tags, une dépendance non vide, un texte français absent, un champ inconnu, un `motion` absent ou mal formé (au moins un moment ; `rejouer.sortie` exige `sortie` dans les moments ; l'ancien champ `animee` est refusé), un `apercuCase` hors des bornes ou mal formé, un `rendu` inconnu ou combiné à `apercuCase`, ou l'ancien champ `tailleCase` (supprimé, ADR 0026).

Champs de la planche du catalogue : `motion` (obligatoire, ADR 0007 : `null` ou `{ resume, moments, technique, rejouer? }` ; `animee` en est dérivé dans les index, il sert au badge « Animée » et au filtre) et `apercuCase` (facultatif, ADR 0023 et 0026 : `{ largeur, hauteur }` de rendu de l'aperçu, mis à l'échelle pour tenir en entier dans la zone d'aperçu des cases, qui est la même, en 4 / 3, pour toutes les ressources). Les blocs larges (galeries, heros, pleine largeur) déclarent à la place `rendu: "grand-ecran"` (ADR 0027) : leur aperçu est rendu à 1440 × 1080 px, comme sur un écran de bureau, puis mis à l'échelle ; l'index en dérive `apercuCase`, et les deux champs ensemble sont refusés. Une ressource est « réglable » quand `contratTokens` vaut 1.

Sorties, dans `src/generated/registre/` (non versionnées) : un index par catégorie (`index-<categorie>.json`, chargé à la demande, jamais dans le bundle initial) et `compteurs.json` (ressources publiées par catégorie, type et secteur, plus le nombre de ressources réglables et animées ; dans le bundle initial pour le méga-menu).

## Fiche et aperçus isolés

- `/<categorie>/<type>/<slug>` : fiche chargée par un `ResolveFn` avant la transition de page (morph `apercu-ressource`). Aperçu à 390, 768 et 1280 px, design, mode clair ou sombre, réglages des 12 tokens `--ngs-*`, code Tailwind ou CSS (choix mémorisé dans le cookie `ngs_variante`), copie, zip.
- L'aperçu est une application Angular séparée (`projects/apercus`, `baseHref /apercu/`) montée dans `<iframe sandbox="allow-scripts">` sans `allow-same-origin` (jamais `srcdoc`). Protocole `postMessage` typé `{ v: 1, type }` dans `src/app/shared/apercu/protocole.ts` ; source ET origine contrôlées des deux côtés. En-têtes `/apercu/*` dans `public/_headers` (non testés sur Cloudflare).
- `npm run registre:build` assemble les sources de l'aperçu (`projects/apercus/src/generated`, ignoré par git) depuis `registry/` : exactement les fichiers Tailwind livrés, plus `demo/` (scène non livrée), et produit fiches JSON, fragments de code CSS et zips (`src/generated/`).
- `npm run build` construit le site, les aperçus, puis les assemble dans `dist/ngshelf/browser/apercu`. `npm run verifier:dist` refuse tout script en ligne dans `dist/`.
- Développement : `npm start` lance le site et les aperçus (cible `serve` du projet `apercus`, port 4201) ; `proxy.conf.mjs` relaie `/apercu` et répond un 503 explicatif si les aperçus ne tournent pas. Les deux serveurs ajoutent `Access-Control-Allow-Origin: *` (option `headers` d'`angular.json`), comme `_headers` en production : l'iframe sandbox a une origine opaque et charge scripts et polices en mode CORS.
- **Paramètres propres** (ADR 0014) : le champ facultatif `parametres` du `meta.json` (choix, nombre, interrupteur) déclare les inputs réglables d'une ressource, en plus des 12 tokens ; chacun doit figurer dans le tableau `api` de `fiche.json`. La fiche les règle, `ngs-reglages` les transmet (`params`), l'aperçu ne retient que ce que la définition prévoit. Les scènes de `demo/` les lisent par `ApercuService.choix`, `nombre` et `booleen`.
- **Page d'aperçu autonome** (ADR 0016) : « Ouvrir l'aperçu seul » ouvre `/apercu/<slug>?design=…&mode=…&p.<nom>=…` dans un nouvel onglet ; hors d'une iframe, l'aperçu affiche sa barre (retour à la fiche, design, mode, animations, paramètres).
- **Images externes TEMPORAIRES** (ADR 0021) : les scènes de galerie et d'image des aperçus chargent des photos de `picsum.photos` (redirige vers `fastly.picsum.photos`) et `images.unsplash.com` en attendant des images locales. Source unique : `projects/apercus/src/app/images-demo.ts` (`IMAGES_EXTERNES_ACTIVES`) ; hôtes admis seulement en `img-src` de `/apercu/*` dans `public/_headers` ; `npm run verifier:dist` avertit tant que c'est actif et échoue si un autre hôte tiers apparaît. Les IP des visiteurs sont exposées à ces hôtes : à remplacer vite.
- **Vignettes vivantes et manipulables** (ADR 0015 et 0017) : chaque case de la planche charge, par `@defer (on viewport)`, une iframe de `/apercu/<slug>?vignette=1` (12 au plus en même temps, détruites hors viewport, jamais en économie de données). Clic, glisser, saisie et survol marchent d'emblée ; la molette, le défilement et le clavier restent à la page jusqu'à la prise de main (clic dans l'aperçu ou bouton « Manipuler l'aperçu », Échap pour rendre). Le lien vers la fiche couvre le pied de la case, pas la scène. Une ressource pilotée par le défilement lit `ApercuService.manipulation()` pour passer de sa boucle au vrai défilement.
- Tests d'une ressource : `registry/<categorie>/<slug>/demo/<slug>.component.spec.ts` (non livré), exécuté dans le projet `apercus` contre la variante Tailwind.

## Motion des pages vitrines

L'accueil et « À propos » sont animés par GSAP (ScrollTrigger, SplitText) et Lenis, installés en paquets npm à version exacte (jamais de CDN : CSP `script-src 'self'`). Ils sont importés dynamiquement, après le premier rendu dans le navigateur, dans des chunks à part (`BibliothequesMouvementService`). `MouvementPageService` (à fournir dans les `providers` de la page) monte la mise en scène, la défait dans `DestroyRef` (ScrollTrigger, SplitText, Lenis, ticker) et arrête Lenis dès le début d'une navigation. `MotionService` est le seul à lire `prefers-reduced-motion` : en mouvement réduit, rien n'est téléchargé et la page reste à son état final. Les états de départ (éléments cachés) ne sont posés que par le script : le HTML prérendu est complet et lisible sans JavaScript. Licences : GSAP « Standard "no charge" license » (gratuite, usage commercial permis, non redistribuée), Lenis MIT.

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
scripts/seo/        sitemap, robots.txt et contrôles SEO du build (fonctions pures, testées) ; scripts/dist/seo.ts les lance
scripts/dev/        lanceur de `npm start` (site et aperçus ensemble)
scripts/registre/   script Node de build du registre (TypeScript, exécuté tel quel par Node 26) et ses tests
public/             favicon, icônes, ngshelf-og.png, fonts/, icons/sprite.svg, theme-init.js, robots.txt, _headers
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
- **Catalogue filtrable** : `/catalogue`, `/<categorie>`, `/<categorie>/<type>` et `/secteurs/<secteur>` partagent `ExplorateurComponent` (facettes, recherche, tri, puces, planche, « Afficher plus » par 24). Les filtres sont dans l'URL (`?c=composants&type=a,b&secteur=x&q=…&tri=az&reglables=1&animees=1`, logique pure et testée dans `core/registre/filtres.ts`) ; un changement de filtre remplace les paramètres sans entrée d'historique ni remontée de la page. Ces URL ne sont ni prérendues ni indexées : `IndexationService` pose le canonique du chemin sans paramètres et `noindex, follow` dès qu'un paramètre est présent. Les cases montrent l'aperçu vivant de la ressource (voir « Fiche et aperçus isolés »).
- **Routes** : toutes lazy. Prérendues depuis le registre (`getPrerenderParams`) : `/<categorie>` (composants, blocs, templates, designs), `/<categorie>/<type>` et `/secteurs/<secteur>` seulement si au moins une ressource, `/<categorie>/<type>/<slug>` pour chaque fiche. Un type ou un secteur sans ressource n'a pas de page : il n'est pas un lien dans la navigation.

## Référencement (SEO)

- **Source unique du domaine : `SITE.url`** (`src/app/core/config/site.config.ts`, `null` tant que le domaine n'est pas choisi). Format : `https://votre-domaine`, sans barre finale ni chemin (le build refuse le reste). Jamais de domaine deviné.
  - **Renseignée** : canoniques, `og:url`, `og:image`, `twitter:image` et adresses du JSON-LD absolus ; `sitemap.xml` généré ; ligne `Sitemap:` ajoutée à `robots.txt`.
  - **`null`** : le build affiche un `AVERTISSEMENT SEO`, les canoniques restent relatifs (`/blocs`), `og:url`, `og:image`, `twitter:image` et les adresses du JSON-LD sont omis (une adresse relative y serait invalide), pas de sitemap ni de ligne `Sitemap:`.
- **`SeoService`** (`core/seo/`) est le seul propriétaire du `<head>` pour le référencement : description, canonique, `robots`, Open Graph, Twitter Card et JSON-LD, rendus depuis un état complet (titre, page, indexation d'une liste filtrée), donc sans doublon ni ordre à respecter. Le titre reste celui de `title` de chaque route ; `TitreSeoStrategy` (remplace la stratégie de titre du routeur) le transmet au service avec le SEO de la page, déclaré dans `data.seo` de `app.routes.ts` (fabriques de `app.seo.ts`). Textes : `core/i18n/textes-seo.ts` (descriptions de 160 caractères au plus, testé).
- **Pages non indexables** (`noindex, follow`, sans canonique) : 404, type ou secteur inconnu, ressource introuvable, catégorie sans ressource (`/templates` tant qu'elle est vide). **Listes filtrées** (`/catalogue?c=blocs`, ADR 0012) : `noindex` et canonique vers la page de chemin, via `IndexationService`, qui délègue à `SeoService`.
- **Données structurées** (JSON-LD, un `<script type="application/ld+json">` par bloc, `<` échappé) : `WebSite` avec `author: Person` (accueil), `AboutPage` (À propos), `CollectionPage` (catalogue, catégories, types, secteurs), `SoftwareSourceCode` (fiches : code à copier sous licence MIT, pas `SoftwareApplication` qui suppose un produit installable) et `BreadcrumbList` partout sauf l'accueil. L'auteur est une `Person` (projet individuel, pas une organisation), `sameAs` lu dans `SITE.auteur`, e-mail jamais publié. La CSP `script-src 'self'` ne concerne pas ces blocs de données non exécutables ; `verifier:dist` les accepte et refuse un JSON-LD invalide.
- **Build** : `npm run build` enchaîne `scripts/dist/seo.ts` : `404.html` (la route `/404` prérendue, déplacée à la racine : l'hébergeur la sert avec le statut 404), `sitemap.xml` (catégories, types et secteurs non vides, fiches non dépréciées ; ni `/apercu/*`, ni paramètres ; sans `lastmod` car la date de modification n'est pas connue) et `robots.txt`. `npm run verifier:dist` recoupe chaque adresse du sitemap avec une page prérendue.
- **Image de partage** : `public/ngshelf-og.png` (1200 × 630, logo sur fond blanc, fournie par `design/logo/`). **Pas de `hreflang`** : il n'existe qu'une version française. Pas de manifeste web : aucun n'est prévu dans le design.

## Déploiement : Cloudflare Pages

Le build produit uniquement des fichiers statiques, sans serveur Node.

| Réglage Cloudflare Pages | Valeur                 |
| ------------------------ | ---------------------- |
| Commande de build        | `npm run build`        |
| Dossier de sortie        | `dist/ngshelf/browser` |
| Variable `NODE_VERSION`  | `26`                   |

`public/_headers` est copié dans la sortie : cache long et immuable sur les fichiers hachés (`.js`, `.css`, `.woff2`), pas de cache forcé sur le HTML, en-têtes de sécurité et Content-Security-Policy stricte (aucun script en ligne, d'où `inlineCritical: false` en production).

`public/robots.txt` ne contient pas de ligne `Sitemap` : `npm run build` l'ajoute dans la sortie quand `SITE.url` est renseignée (voir « Référencement (SEO) »).

## Prérequis

- Node 26
- npm 11

## Intégration continue

Le workflow `.github/workflows/ci.yml` s'exécute sur chaque pull request et sur chaque push vers `dev`, `preprod` et `main`. Il lance quatre jobs indépendants aux noms stables : `lint` (`npm run lint`), `format` (`npm run format:check`), `build` (`npm run build`) et `test` (`npm test -- --no-watch`). Rien n'est déployé : la CI ne fait que vérifier le code, sans secret.
