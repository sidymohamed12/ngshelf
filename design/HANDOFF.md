# HANDOFF — NgShelf : de la maquette à l'intégration Angular 22

> Document de passation du designer vers `frontend-dev`. Version du 27 novembre 2026, établie sur `DESIGN.md` v0.8 et sur la maquette `design/maquette/` en l'état. **La maquette n'a pas encore reçu de validation finale écrite de Sidy** : tant qu'elle ne l'a pas, ce document décrit ce qui est à intégrer, pas ce qui est approuvé (voir « Points ouverts »).
>
> Règle de lecture : les fichiers cités sont la référence, ce document dit où regarder. Les références `fichier:ligne` valent pour l'état actuel des fichiers ; si une ligne a bougé, cherchez le nom de la fonction ou de la classe.
> Ne rien réinventer. Si la maquette et un ADR se contredisent, la section 13 dit lequel suit quoi ; sinon, ne tranchez pas en codant : posez la question à Sidy.

## 1. Résumé

**Produit.** NgShelf est un catalogue public, gratuit et open source (MIT) de ressources Angular 22 : composants, blocs, templates et designs (jeux de tokens). Pas de compte, pas de paiement, pas de back-end. Le visiteur essaie chaque ressource vivante dans la page, règle son design, puis copie le code ou télécharge un zip. `DESIGN.md:21`.

**Concept.** « B, planche spécimen » avec le réglage par tokens de « C, Signal ». Élément mémorable : la planche vivante du hero (de vraies pièces qui fonctionnent, qu'on peut « habiller » d'un autre design, et une case qui grandit jusqu'à devenir sa fiche). `DESIGN.md:22-33`.

**Périmètre v1.**
- Langue : français (`lang="fr"`). L'anglais est préparé, pas livré : textes marqués `i18n` / `$localize`, textes du registre au format `{ fr, en? }`.
- Pages : accueil, catalogue (avec pages de catégorie, de type et de secteur), fiche ressource, « À propos », pages légales, 404.
- Thème du site clair, sombre ou système (livré depuis la v0.3).

**Décisions validées et leurs ADR.**

| Sujet | Décision | ADR | Statut |
| --- | --- | --- | --- |
| Rendu et hébergement | Angular 22, prérendu statique (`outputMode: "static"`), Cloudflare Pages gratuit | `docs/adr/0001` | accepté |
| Registre, variantes, tokens | Deux variantes de code (Tailwind v4 par défaut, CSS + tokens), 12 tokens `--ngs-*` communs, pont `@theme inline`, deux sources écrites à la main avec équivalence testée en CI | `docs/adr/0002` décisions 1 à 4 | accepté |
| Distribution | Copier + un zip par variante, JSON de registre pour un futur CLI | `docs/adr/0002` décision 5 | **proposé, à valider** |
| Aperçus isolés | Shadow DOM (accueil, grille), iframe sandbox (fiche) | `docs/adr/0003` | **proposé, à valider** |
| Taxonomie et routes | Catégorie, type, secteur ; `/<categorie>/<type>/<slug>` ; pages prérendues pour catégorie, type, secteur | `docs/adr/0004` | accepté ; filtres client et champ `dependances` non validés explicitement |
| Splash et transitions | Splash plafonné, View Transitions du router, sorties en CSS | `docs/adr/0005` | accepté |
| Identité | Nom NgShelf, préfixe `ngs`, logo avec pieds vides, splash en CSS, couleurs de marque réservées au logo | `docs/adr/0006` | accepté |

**Hors périmètre v1** (`docs/plans/catalogue-arbitrage-design.md:9`) : back-end, comptes, favoris, statistiques, version anglaise, CLI npm, schematics, dépendances entre ressources ou vers des paquets (le champ est réservé et vide), Three.js, bouton global « Réduire les animations » (proposé seulement).

## 2. Stack et setup

| Élément | Choix | Remarque |
| --- | --- | --- |
| Framework | Angular `^22.3.0`, zoneless, standalone, signals, `OnPush` | Déjà en place dans `ngshelf-frontend/package.json` |
| Rendu | Prérendu statique, `outputMode: "static"`, `getPrerenderParams` pour les routes dynamiques | ADR 0001. Aucun serveur Node |
| Hébergement | **Cloudflare Pages ou Netlify, pas encore choisi** (Sidy, 27 nov. 2026) ; Cloudflare Pages gratuit si retenu : build `npm run build`, sortie `dist/ngshelf/browser`, `NODE_VERSION=26` | `ngshelf-frontend/README.md`, section Déploiement |
| Style | Tailwind CSS v4 via `@tailwindcss/postcss` | La maquette utilise `@tailwindcss/browser@4.3.5` ; **fixer la même version 4.3.5** (le projet a `^4.1.12`) |
| Tokens | `design/design-system/tokens.css`, repris tel quel dans le `@theme` du projet | Voir section 4 |
| Composants du site | `design/design-system/components.css` (classes `.ngs-*`) | Déjà copiés dans `src/styles/` ; ne modifier qu'à la source |
| Polices | Chivo (variable 400–800) et Chivo Mono (variable 400–600), SIL OFL 1.1, **auto-hébergées**, `font-display: swap`, repli « Chivo Fallback » | Fichiers dans `design/design-system/assets/fonts/`, déjà dans `public/fonts/`. Preload des deux. Voir `tokens.css:15-38` |
| Icônes | **Sprite SVG Phosphor** (regular, MIT), une seule bibliothèque, aucune dépendance npm d'icônes | `design/design-system/assets/icons/sprite.svg` (62 symboles, dont `ngshelf-logo`). Déjà dans `public/icons/` avec `<svg appIcone="nom">`. Le plan parlait de `@ng-icons/phosphor-icons` (Q13) : **le sprite l'emporte**, il est déjà intégré |
| Animation | GSAP 3.15.1 + ScrollTrigger + Flip + SplitText, Lenis 1.3.28 | Voir ci-dessous. Non installés dans le projet à ce jour |
| 3D | Aucune (pas de Three.js) | `DESIGN.md:46` |

**Bibliothèques d'animation : versions et lieux autorisés.** Versions exactes de la maquette (`index.html:459-466`) ; mêmes versions en npm, sans `^`. Poids mesuré en gzip : GSAP 28,5 Ko, ScrollTrigger 18,0 Ko, Flip 9,7 Ko, SplitText 3,6 Ko, Lenis 5,4 Ko, soit environ 65 Ko (`DESIGN.md:316-326`).

| Bibliothèque | Autorisée | Interdite |
| --- | --- | --- |
| GSAP core + ScrollTrigger | Accueil, « À propos », catalogue (cascade), fiche (entrées, `quickTo`) | Dans une ressource publiée, dans un changement de route (ADR 0005 : GSAP n'anime jamais une route) |
| Flip | **Catalogue** (réarrangement au filtrage). Le voile case vers fiche de la maquette est un repli, voir section 8 | Ailleurs |
| SplitText | Titres de l'accueil et de « À propos » | Texte courant |
| Lenis | **Accueil et « À propos » seulement**, arrêté avant une transition de route et détruit en quittant la page (ADR 0005). Ignoré dans `pre`, les dialogues et le menu. Ancres avec un décalage de 80 px. Coupé en reduced-motion | Catalogue, fiche, pages légales |

Obligations Angular : toute création GSAP ou Lenis se fait dans `afterNextRender()` (rien ne doit casser le prérendu), avec `gsap.context()` ou `gsap.matchMedia()` et nettoyage dans `DestroyRef.onDestroy` (`revert()`, `kill()` des ScrollTrigger, `lenis.destroy()`). Licence GSAP « Standard No Charge » : gratuite, pas OSI ; elle ne s'applique qu'au site, jamais aux ressources livrées.

**Déjà fait dans `ngshelf-frontend`** (constat du 27 novembre 2026, branche `feat/mega-menu`, 38 commits) : Angular 22.3, ESLint, Prettier, CI GitHub, tokens et components copiés, polices, sprite d'icônes, `site.config.ts`, textes `$localize`, routes lazy, layout (header, menu mobile, pied, menu de thème, recherche ⌘K, méga-menu), cookie et service de thème, script `registre:build`, pages de catégorie, de type et de secteur, `registry/` avec 10 `meta.json` et 3 designs. **Pas encore fait** : accueil, catalogue à facettes, fiche, « À propos » (squelettes de 4 à 26 lignes), splash, View Transitions, GSAP et Lenis, code coloré, copie et zip, aperçus, pages légales, `_redirects`, sitemap.

## 3. Ordre de travail

Source : `docs/plans/catalogue-arbitrage-design.md:34-103`. Une branche et une PR par lot (skill `git-sidy`), PR vers `dev`. Les critères de fin sont ceux du plan ; la colonne « Ce que ce document apporte » dit où trouver le design de chaque lot.

| Lot | Contenu | Branche | Critère de fin | Ce que ce document apporte |
| --- | --- | --- | --- | --- |
| **0** | **Spike** : prérendu de `/<categorie>/<type>/<slug>`, pont `@theme inline`, équivalence Playwright, sortie CSS compilée (option 1 de l'ADR 0002), aperçu Shadow DOM et iframe, Shiki (grammaires `angular-ts` / `angular-html`), zip au build, `withViewTransitions({ skipInitialTransition: true })`, LCP avec splash, CLI shadcn sur Angular 22 | `core/spike-registre-variantes` | Aperçu Cloudflare déployé ; tableau des mesures et sortie CSS compilée jointes à la PR | Sections 7, 8, 10 (mesures attendues). **Aucune trace du spike dans le dépôt** : à confirmer avec Sidy si le lot a été fait ou sauté |
| 1 | Design system et maquette (fait par le designer) | `docs/design-system-maquette` | Maquette validée par Sidy | Ce document est le livrable du lot 1 |
| 3 | Socle : routes depuis la taxonomie, SEO, pages légales, 404, `_headers`, `_redirects`, splash, View Transitions, config du site, pied de page | `core/socle-site` | `ng build` sans erreur ni alerte, un chunk lazy par feature, Lighthouse SEO 100, Playwright des transitions (aucune en mouvement réduit) | Sections 4, 5, 6, 8, 9. **En grande partie fait** (voir section 2) ; restent splash, View Transitions, pages légales, `_redirects` |
| 4 | Pipeline du registre : schéma, index par catégorie, Shiki, zips × 2, JSON × 2, sitemap, lint de style, contrôles d'équivalence | `core/pipeline-registre` | La CI échoue sur chaque cas listé en ADR 0004 « Conséquences » ; sorties pour 2 ressources ; avis option 1 / option 3 noté dans la PR | Section 7. **Commencé** (`registre:build`, index, compteurs) ; restent Shiki, zips, JSON, sitemap, équivalence |
| 5 | CI : validation, équivalence, build, Playwright, déploiement Cloudflare | `ci/build-registre-deploiement` | Une PR qui casse l'équivalence est rouge ; une PR saine produit un aperçu | Section 14 |
| 6 | Porter les ressources et 3 designs de `registre.js` dans `registry/`, en deux variantes | `feat/ressources-provisoires` | Validation et équivalence vertes pour toutes les entrées | Section 7. **La maquette compte 10 ressources et 3 designs, pas 6** (voir section 13) |
| 7 | Catalogue : pages de catégorie, de type, de secteur ; filtres client dans l'URL ; recherche | `feat/catalogue-filtres` | Parcours Playwright vert, états de `angular-sidy` §4, canonique sans paramètres | Section 5 (catalogue) |
| 8 | Fiche : aperçu, variante (cookie), code, copier, télécharger, réglages | `feat/detail-ressource` | Flux de `docs/flows/detail-ressource-variantes.md` couvert par Playwright, copie et zips vérifiés dans les deux variantes sur 3 ressources | Sections 5 (fiche), 7 |
| 9 | Accueil et motion | `feat/accueil-motion` | Budget JS tenu, LCP mobile ≤ 2,5 s, `prefers-reduced-motion` respecté | Section 8 |
| 10 | README, Démarrer, Contribuer | `docs/readme-contribuer` | Un contributeur ajoute une ressource sans aide | Section 11 |

Les lots 7 et 8 peuvent avancer en parallèle après 3 et 6. « À propos » n'a pas de lot dans le plan : à rattacher au lot 9 (même motion, même Lenis), à confirmer.

## 4. Tokens

**Règle absolue : aucune couleur, police, rayon, ombre ni durée en dur dans un composant.** Tout passe par un token. Le lint de la CI doit l'imposer (ADR 0002, « Conséquences »).

### 4.1 Tokens du site (`@theme`)

Le fichier `design/design-system/tokens.css` est **la seule source**. Le projet en garde une copie identique (`src/styles/tokens.css`) importée par `src/styles.css`. Ne jamais modifier la copie seule. Il utilise `@theme static` : toutes les variables sont émises, car les composants les lisent en `var()`.

| Groupe | Lignes de `tokens.css` | Contenu |
| --- | --- | --- |
| Primitives (encre, familles) | 41-62 | Neutres froids `--color-ink-*`, couleurs `vert`, `bleu`, `rouille`, `framboise` |
| Marque | 64-69 | `--logo-tuile-clair` `#191f42`, `--logo-tuile-sombre` `#ededf0`, `--logo-tuile` (suit le thème), `--logo-etagere` `#fd6437` |
| Sémantique | 71-123 | canvas, surface, text, text-muted, primary, border, border-strong, focus, familles `--color-cat-*` (+ `-soft`), succès, avertissement, erreur, code |
| Typographie | 125-158 | `--font-famille`, `--font-mono`, échelle `--text-*`, graisses `--wght-*` |
| Espacement, conteneur | 160-175 | `--spacing` 0,25rem, `--space-section`, `--space-gutter`, `--space-inline`, `--container-site` 90rem, `--container-wide` 112rem, points de rupture |
| Rayons, ombres, z-index | 176-195 | 8 / 12 / 20 / plein ; `--shadow-raise`, `--shadow-overlay`, `--shadow-flottant` ; 0 / 10 / 20 / 40 / 100 / 1000 |
| Motion | 197-218 | Durées et courbes (section 8) |
| Mode sombre | 220-270 | Bloc `[data-theme="sombre"]` |

Valeurs de couleur et contrastes calculés : `DESIGN.md:92-149` (clair et sombre). La page `design/design-system/index.html` les recalcule en direct (section Couleurs et « Mode sombre du site »).

**Mode sombre.** `[data-theme="sombre"]` n'est pas limité à `:root` : une zone peut être forcée en sombre (la bande « Qui le développe » de « À propos » porte `data-theme="sombre"`, `a-propos.html:641`). Toute variable sémantique qui change y est redéfinie, car une `var()` se résout là où elle est déclarée. Le variant Tailwind `dark:` est déjà défini dans `src/styles.css` (`@custom-variant dark`).

**Blocs de code** : toujours sombres, dans les deux thèmes (`--color-code-*`).

### 4.2 Contrat public des ressources : 12 tokens `--ngs-*` et 3 designs

Source : `design/design-system/contrat-tokens.css` (copie : `src/styles/contrat/contrat-tokens.css`). Le contrat **n'est pas chargé par le site** : il est injecté dans les aperçus et généré dans le code copié et les zips. Les composants des ressources lisent chaque valeur par `var(--ngs-…, repli)` ; les replis valent le design Planche clair.

| Token | Rôle | Planche | Fleuve | Latérite |
| --- | --- | --- | --- | --- |
| `--ngs-color-action` | action, sélection, focus | `#0b0b0c` | `#0b6464` | `#b4361c` |
| `--ngs-color-on-action` | texte sur l'action | `#ffffff` | `#ffffff` | `#ffffff` |
| `--ngs-color-surface` | fond du composant | `#ffffff` | `#ffffff` | `#ffffff` |
| `--ngs-color-surface-alt` | fond secondaire | `#f4f4f5` | `#eef6f6` | `#f4f2f1` |
| `--ngs-color-text` | texte principal | `#0b0b0c` | `#0f1a1a` | `#1c1210` |
| `--ngs-color-text-muted` | texte secondaire | `#5f5f66` | `#4d5f5f` | `#66524d` |
| `--ngs-color-border` | bordure de contrôle (≥ 3:1) | `#8a8a93` | `#7f9696` | `#9a847f` |
| `--ngs-color-danger` | erreur | `#b42318` | `#b42318` | `#9f1239` |
| `--ngs-radius` | rayon de base | 10px | 18px | 3px |
| `--ngs-density` | multiplicateur d'espacement | 1 | 1.2 | 0.85 |
| `--ngs-font-family` | police | `system-ui…` | `ui-rounded…` | `ui-serif…` |
| `--ngs-duration` | durée de base | 160ms | 220ms | 120ms |

Les valeurs sombres de chaque design sont dans `contrat-tokens.css:45-105` (classe `.ngs-sombre`). Les 48 paires de contraste passent AA (tableau sur la page de design system, section « Contrat de tokens », `index.html:412`). Un « design » du catalogue est un jeu de valeurs de ces 12 tokens.

### 4.3 Pont Tailwind `ngshelf-theme.css`

Fichier unique, identique pour toutes les ressources, livré avec chaque variante Tailwind. Version du projet : `ngshelf-frontend/src/styles/contrat/ngshelf-theme.css`. Il contient : (1) les valeurs par défaut du contrat dans `:root` ; (2) un `@theme inline` qui relie les utilitaires aux variables : `bg-ngs-action`, `text-ngs-text`, `border-ngs-border`, `rounded-ngs`, `rounded-ngs-lg`, `font-ngs`, et `p-ngs-N`, `gap-ngs-N`… pour N de 1 à 16 (valeur `calc(var(--ngs-density) * N × 4px)`). `inline` est indispensable : les tokens sont posés plus bas dans le DOM, sans lui le changement de design ne serait pas suivi.

Écart connu avec l'ADR 0002 : l'ADR prévoyait des `@utility p-ngs-* { … --value(integer) … }`, le fichier actuel utilise des variables `--spacing-ngs-N` (liste fermée de 16). La couverture des `@utility` était à confirmer par le spike (lot 0). La table token ↔ utilitaire doit devenir l'annexe du contrat (le plan l'attribuait au designer, elle n'est pas écrite : point ouvert 13).

### 4.4 Tokens de marque `--logo-*`

`--logo-tuile` (bleu nuit `#191f42` en clair, `#ededf0` en sombre) et `--logo-etagere` (orange `#fd6437`) servent **uniquement** au logo, au splash, au favicon et à l'image sociale. Jamais en action, état, famille ni texte (ADR 0006, décision 8). Le contrat de tokens des ressources ne change pas. Logos : `design/logo/` (`ngshelf-clair.svg`, `ngshelf-sombre.svg`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) ; symbole `ngshelf-logo` dans le sprite, `viewBox="320 236 896 491"`.

## 5. Pages et routes

Routes (ADR 0004, décision 3, tableau). Le projet a déjà : `/`, `/composants`, `/blocs`, `/templates`, `/designs`, `/<categorie>/<type>`, `/secteurs/<secteur>`, `/<categorie>/<type>/<slug>`, `/catalogue`, `/a-propos` (voir `src/app/app.routes.ts`).

Points de rupture communs (`DESIGN.md:420-431`) : 320-639, 640-1023, 1024-1919, ≥ 1920 px ; Tailwind `sm 40rem`, `md 48rem`, `lg 64rem`, `xl 90rem`, `2xl 120rem`. Aucun défilement horizontal, vérifié à 320, 390, 768, 1024, 2560 px. Cibles de 44 px.

### 5.1 Accueil `/` (mode Convaincre, motion niveau 1)

Maquette : `design/maquette/index.html` ; script `js/accueil.js`.

| Section | Lignes `index.html` | Contenu |
| --- | --- | --- |
| Hero | 236-287 | `h1` « Des composants Angular à prendre tels quels. », deux actions au plus, **vitrine** : un faux site (« Chez Awa ») assemblé avec les ressources `navbar-restaurant` et `hero-restaurant`, calendrier et notification flottants, étiquettes qui ouvrent la fiche, bouton « Habiller avec un design » |
| Planche | 288-298 | Toutes les pièces en vrai, cases 1×1, 2×1, 2×2 |
| Quatre familles | 299-307 | Section épinglée en défilement horizontal (≥ 1024 px) |
| Deux gestes | 308-350 | Copier et télécharger, démonstration collante, copie et téléchargement réels |
| Douze tokens | 351-375 | Témoins collants, chaque jeton s'allume au scroll |
| Contribuer | 376-403 | Parcours en 4 étapes tracé en SVG |

États : pas d'état de chargement propre (contenu prérendu). Responsive : < 1024 px, familles empilées, gestes empilés, vitrine sous le texte ; planche 1 colonne, puis 2 à 640 px, 3 à 1024, 4 à 1280.

### 5.2 Catalogue `/catalogue` et ses déclinaisons (mode Expérience, niveau 2)

Maquette : `catalogue.html` ; `js/catalogue.js`. Un seul gabarit pour `/catalogue`, `/<categorie>`, `/<categorie>/<type>`, `/secteurs/<secteur>` : le titre et la liste de départ changent.

- **Facettes** (`catalogue.html:193`) : Famille (radio), Type (cases, 8 visibles puis « Afficher les n autres types »), Secteur (cases avec icônes), Options (« Réglables seulement », « Animées seulement »). Les compteurs de chaque facette tiennent compte des autres filtres ; une valeur vide reste visible en grisé (`.is-vide`). Colonne collante ≥ 1024 px ; **tiroir** (bottom sheet, `role="dialog"`, focus piégé, fond) sous 1024 px, ouvert par « Filtres (n) », avec « Tout effacer » et « Voir les résultats (n) » (`catalogue.js:225-250`).
- **Filtres actifs** : puces retirables ; tri « Les plus récentes » / « De A à Z » ; pagination « Afficher plus » par 24.
- **URL** (`catalogue.js:13-25`) : `?c=<famille>&type=a,b&secteur=x,y&q=…&tri=az&reglables=1&animees=1`. **En production, la catégorie, le type et le secteur sont des chemins prérendus** ; seuls `secteur`, `design`, `tag`, `q` (et les options) restent en paramètres, jamais indexés, canonique sans paramètres (plan `:59`). Un changement de filtre n'est pas une navigation : pas de transition de page, pas de scroll (ADR 0005).
- **Flip** : voir ligne « Catalogue, grille » du tableau de la section 8.
- **États** (`catalogue.js:285-310`) : chargement (`?etat=chargement`, squelettes à la forme des cases, `.ngs-skeleton`) ; erreur (`?etat=erreur`, `.ngs-state--error`, bouton « Réessayer » qui relance le chargement) ; vide d'une catégorie (`?c=templates` : « Templates » n'a aucune ressource) ; aucun résultat filtré (message avec « Tout effacer »). Les états `hors-ligne` et `serveur injoignable` de `angular-sidy` §4 n'ont pas de maquette : réutiliser `.ngs-state--error` avec un texte dédié (point ouvert).
- **Responsive** : planche 1, 2, 3, 4 colonnes aux seuils ci-dessus ; rangées alignées en haut, cases d'une rangée à hauteur égale, scène 1×1 à hauteur minimale commune de 17,5rem (`DESIGN.md:191`).

### 5.3 Fiche `/<categorie>/<type>/<slug>` (mode Expérience, zones Lire)

Maquette : `ressource.html?r=<slug>` ; `js/ressource.js`. La maquette garde `?r=` ; la route réelle est celle de l'ADR 0004. Flux complet : `docs/flows/detail-ressource-variantes.md`.

| Zone | Lignes `ressource.html` | Contenu |
| --- | --- | --- |
| Fil d'Ariane | 198-201 | Catalogue / famille / type / titre |
| Identité et actions | 204-228 | Badges, `h1`, description, « Copier le code », « Télécharger le composant », note de variante, métadonnées. Collante ≥ 1280 px |
| Aperçu | 231-264 | Largeurs Auto / 390 / 768 / 1280, boutons « Rejouer l'entrée » / « Rejouer la sortie » (si `motion.rejouer`), segment Clair / Sombre |
| Réglages | 266-337 | Groupes repliables (`details`) : design, couleur d'action, rayon, densité, animations ; « Réinitialiser » |
| Code | 339-363 | Onglets de fichiers, sélecteur **Tailwind / CSS**, « Tout copier » |
| Utilisation, installation, dépendances, paramètres | 364-388 | Dépendances : « Aucune : seulement Angular 22 » + ligne grisée réservée |
| Autres ressources | 389-396 | Cases |
| Introuvable | 398-407 | « Cette ressource n'existe pas », lien vers le catalogue |

États : chargement du code (squelette), aperçu qui ne répond pas (`erreur` + « Recharger l'aperçu »), presse-papiers refusé (« Copie impossible, sélectionnez le code » + sélection du bloc), fragment ou zip injoignable (« Réessayer »), ressource introuvable. Les trois premiers viennent du flux, pas de la maquette : prévoir leur design avec `.ngs-state--error`.
Responsive : colonnes 8/12 (aperçu) + 4/12 (réglages collants) dès 1024 px, puis 3/6/3 dès 1280 px ; empilé en dessous.

### 5.4 « À propos » `/a-propos` (mode Convaincre, niveau 1)

Maquette : `a-propos.html` ; `js/a-propos.js`.

| Section | Lignes | Contenu |
| --- | --- | --- |
| Hero | 389-428 | 5 vraies pièces qui arrivent de loin et s'assemblent, 3 faits (« Licence MIT », « 0 € », « Aucun compte ») |
| Le catalogue aujourd'hui | 429-461 | Mosaïque de tuiles dont **toutes les valeurs viennent du registre et du contrat** (jamais de chiffre inventé) |
| Copier, Régler, Livrer | 462-506 | **Épinglée**, 220 % de scroll |
| Pourquoi | 507-521 | Gratuit, MIT, sans compte |
| Pour qui | 522-555 | **Épinglée** (≥ 1024 px), 160 % de scroll : manifeste mot à mot + avant / après d'un calendrier |
| Comment c'est fait | 556-610 | Photo de Lagos, panneau illustré, quatre vues empilées |
| Contribuer | 611-640 | Arborescence d'un dossier de ressource, parcours en 4 étapes |
| Qui le développe | 641-668 | Bande sombre forcée, portrait, nom, liens lus dans `config.js` |

Mobile : rien d'épinglé, séquences jouées une fois à l'entrée.

### 5.5 Pages légales, 404 et pages à créer

**Maquettées en v0.9** : `404.html`, `mentions-legales.html`, `confidentialite.html`, `cookies.html` (mêmes blocs partagés que les 4 autres pages, vérifiés identiques). Routes proposées : `/mentions-legales`, `/confidentialite`, `/cookies` (prérendues, ADR 0004 ligne « pages légales ») ; la 404 est `404.html`, servie avec le statut 404 (Cloudflare Pages et Netlify prennent `404.html` à la racine de la sortie de build), `noindex`.

- **404** : `.ngs-state` n'est pas utilisé ; l'étagère est propre à la page (`<style>` de `404.html`, valeurs en tokens). Animation CSS seule (aucun GSAP), uniquement sous `prefers-reduced-motion: no-preference`. L'adresse demandée vient de `location` (texte seulement). Le formulaire envoie `?q=` au catalogue. Les pièces (`ngs-apercu` : Interrupteur, Boutons) prennent le design `planche` (`NGS.habiller`, `js/erreur-404.js`).
- **Pages légales** : un seul gabarit **`.ngs-lecture`** (déjà dans `components.css`, démontré dans la section « Lecture » du design system) ; `js/legal.js` : sommaire déplié sur ordinateur, replié sur mobile, section lue marquée. **Pas de Lenis, pas de GSAP d'entrée.** Les contenus sont dans `textes.fr.js` (clés `legal.*`) ; en Angular, les mettre en données TypeScript (sections, blocs) plutôt qu'en innerHTML, avec les liens internes en `routerLink`.
- **Valeurs lues dans la config, jamais en dur** : `{auteur}`, `{email}` (`site.config.ts`), et l'hébergeur (`hebergeur` = `null` | `'cloudflare'` | `'netlify'` + table `hebergeurs`). **L'hébergeur n'est pas choisi** : tant que la valeur est `null`, la page affiche des champs « à compléter ». À reporter dans `site.config.ts`.
- **Champs à compléter par Sidy** (visibles en pointillés, `.ngs-acompleter`) : statut de l'éditeur, adresse postale, téléphone, NINEA / RCCM, conditions d'utilisation du nom et du logo, formalité auprès de la CDP (récépissé ou « sans objet »), durée de conservation des e-mails, hébergeur (Cloudflare ou Netlify). **Ne pas mettre en ligne tant qu'il en reste.**
- **Section « Ressources d'autres serveurs » de la confidentialité** : vraie si GSAP, Lenis, polices et icônes sont servis par le site (npm, CSP `default-src 'self'` du `_headers`). **La maquette, elle, charge jsdelivr** (GSAP 3.15.1, ScrollTrigger, Flip, SplitText, Lenis 1.3.28 et `lenis.css`, Tailwind navigateur 4.3.5) : écart voulu, propre à la maquette. Si un CDN est gardé en production, la section et la page « Cookies » doivent le dire.
- **Cookies** : seuls `ngs_theme` et `ngs_variante` sont posés (vérifié dans le code de la maquette et dans `cookie.service.ts`). `ngs_motion` n'existe pas (point ouvert n° 2) : s'il était ajouté, le tableau de la page « Cookies » et la politique de confidentialité changeraient.
- **Reste à créer, sans maquette** : « Démarrer », « Contribuer », « Licence » (le lien « Licence MIT » du pied reste `#`), états `hors-ligne` et `serveur injoignable`.
- Textes à **faire relire par un juriste** (droit sénégalais, RGPD) avant la mise en ligne.

## 6. Composants du site

Tous existent en CSS dans `design/design-system/components.css` (numéros de ligne ci-dessous) et sont montrés dans tous leurs états sur `design/design-system/index.html` (section Composants, ligne 195). Liste exhaustive : `DESIGN.md:330-359`. Chaque composant devient un composant Angular standalone `OnPush` ; conserver les noms de classes `.ngs-*`. Survol réservé à `(hover: hover) and (pointer: fine)` ; tout fonctionne au tap et au clavier.

| Composant | Classes (`components.css`) | Variantes et états | Accessibilité |
| --- | --- | --- | --- |
| Lien d'évitement | `:53` | visible au focus | « Aller au contenu » en premier ; `main id="contenu" tabindex="-1"` |
| Marque | `.ngs-brand` `:94` | clair, sombre (tuiles claires) | Lien d'en-tête : `aria-label="Accueil de NgShelf"`. Tiroir et pied : `role="img"` + `aria-label="NgShelf"`, logo et « Shelf » masqués aux aides techniques |
| Header | `.ngs-header` `:182` | repos, `is-scrolled` (bordure à 8 px de scroll) | `nav aria-label`, `aria-current="page"` sur le lien actif, focus jamais masqué par l'en-tête fixe |
| Méga-menu « Catalogue » | `.ngs-mega` `:561` | s'ouvre au clic ou au survol (120 ms), familles, types, secteurs avec compteurs (`compteurs.json`) | `aria-expanded`, `aria-controls`, Échap ferme, descente de 6 px |
| Menu du thème | `.ngs-theme` `:717` | Clair, Sombre, Système ; icône soleil, lune ou écran | Bouton 44 px `aria-haspopup="menu"` ; trois `menuitemradio` ; flèches, Début, Fin, Échap, retour du focus au bouton ; `inert` quand fermé |
| Recherche ⌘K | `.ngs-dialog`, `.ngs-results` `:464-496` | repos, résultats, aucun résultat | `<dialog>`, combobox, flèches, Entrée, Échap ; raccourcis ⌘K, Ctrl K, `/` |
| Tiroir mobile (menu) | `.ngs-menu` | ouvert, fermé ; liens en cascade de 40 ms | `role="dialog" aria-modal="true"`, focus au premier élément, `aria-expanded` sur le bouton |
| Tiroir de filtres | `.ngs-tiroir` `:615` | ouvert, fermé | `role="dialog"` seulement quand ouvert, Échap, `inert` fermé, défilement de la page bloqué |
| Pied de page | `.ngs-reseaux`, `.ngs-signature` `:596` | signature « Développé par Sidy » avec monogramme qui se dessine | `nav aria-labelledby`, liens des réseaux avec `aria-label` explicite, `rel="me noopener"` |
| Splash | critique en ligne (`index.html:30-67`, SVG `:156`) | clair (fond blanc), sombre (`#191f42`) | `role="status" aria-live="polite"`, texte masqué visuellement, masqué en reduced-motion et sans JS |
| Bouton | `.ngs-btn` `:103` | plein, `--secondary`, `--ghost`, `--danger` (réservé), `--sm` `--lg` `--icon` `--block`, `.is-loading`, `.is-done` | Survol : −1 px et fond plus foncé ; clic : `scale(.985)` ; désactivé + indicateur pendant un envoi |
| Lien | `.ngs-link` `:159` | trait qui se dessine, flèche de 3 px | — |
| Champs | `.ngs-field`, `.ngs-input` `:240` | repos, focus (anneau de 3 px), erreur | Label visible, aide et erreur sous le champ, `aria-describedby` |
| Badges | `.ngs-badge` `:265` | famille `.ngs-cat-*`, `--reglable`, `--provisoire`, `--neutre`, `--secteur` `:556`, **`--anime`** `:750` | Le nom de la famille est toujours écrit ; badge « Animée » : icône `wave-sine`, contour de contrôle |
| Case de planche | `.ngs-case` (`__stage` + `__foot`) `:284` | repos, survol (monte de 2 px par `translate`), chargement | **Seule carte du site.** La scène est interactive, le pied (`.ngs-case__link`) ouvre la fiche. Aucun `transform` au repos |
| Puce de filtre, facette | `.ngs-chip` `:361`, `.ngs-facette`, `.ngs-option` | repos, active (couleur de la famille), vide | Vrais liens ou `details` / cases |
| Contrôles | `.ngs-switch`, `.ngs-seg`, `.ngs-swatch`, `.ngs-range` `:350-409` | segments en `radiogroup` (flèches), icônes seules sous 400 px | Rôles `radio`, `aria-checked`, libellés `aria-label` sur les segments d'icônes |
| Onglets | `.ngs-tabs` `:333` | indicateur qui glisse (260 ms) | Rôle `tablist`, flèches |
| Bloc de code | `.ngs-code`, `.ngs-copy`, `.tok-*` `:410` | toujours sombre ; coloration **Shiki au build** | Retour à la ligne, `pre` focalisable, bouton Copier avec libellé d'état |
| Réglages repliables | `.ngs-reglage` `:673` | replié (valeur courante lisible), ouvert | `details` / `summary` |
| Cadre d'aperçu, panneau | `.ngs-preview` `:534`, `.ngs-panel` `:548` | + contraste de l'action calculé en direct (`.ngs-contrast`) | iframe avec `title` |
| Vitrine | `.ngs-vitrine`, `.ngs-etiquette` `:687` | — | Les étiquettes sont des liens vers la fiche |
| Toasts | `.ngs-toasts`, `.ngs-toast` `:447` | `--success`, `--error` ; montent de 12 px | Région `aria-live`, jamais seul porteur d'un message critique |
| États | `.ngs-skeleton` `:497`, `.ngs-state` `:506` | chargement (shimmer), vide, `--error` | Icône + message + action ; erreur = problème + solution + « Réessayer » |
| Métadonnées, tableau | `.ngs-meta`, `.ngs-table` `:519-529` | — | `dl`, tableau avec en-têtes |

Pour la marque (`DESIGN.md:359`) : le texte à côté du logo est « Shelf » seulement (le logo contient « ng »).

## 7. Registre des ressources

### 7.1 Modèle de données

Source de vérité : ADR 0004, décision 2 (`MetaRessource`, `MetaDesign`), déjà typé dans `ngshelf-frontend/src/app/shared/models/ressource.model.ts`. Chaque ressource est un dossier de `registry/` ; le script `registre:build` valide et génère `src/generated/registre/`.

**Écarts entre la maquette, l'ADR et le projet à régler avant le lot 6** :

| Sujet | Maquette (`registre.js`) | ADR 0004 / projet | À faire |
| --- | --- | --- | --- |
| Champ `motion` | `{ resume, moments: ['entree'\|'sortie'\|'survol'\|'ouverture'\|'changement'], technique, rejouer?: { entree: true, sortie: 'hero-sortie' } }` ou `null` | **Absent de `MetaRessource`** (le projet n'a pas ce champ) | Ajouter `readonly motion: { resume: Texte; moments: readonly Moment[]; technique: string; rejouer?: { entree: boolean; sortie?: string } } \| null` et incrémenter `schema` (`DESIGN.md:287`, point ouvert 13) |
| Libellés visibles | Chaînes simples (`titre`, `description`) | `Texte = { fr, en? }` | Convertir. `motion.resume` doit aussi devenir un `Texte` |
| Format de `meta` | — | ADR : `meta.ts` typé ; projet : `meta.json` | Garder `meta.json` (déjà en place) et mettre l'ADR à jour |
| Catégorie | `famille` (pluriel) et `categorie` (singulier) | `categorie` singulier ; segment de route au pluriel | Utiliser `categorie` ; le segment vient de `SEGMENT_CATEGORIE` |
| Champs d'affichage | `api[]` (nom, type, défaut, rôle), `usage`, `composition` (design), `taille`, `reglable` | Non prévus dans `MetaRessource` | À décider : fichiers à côté du `meta.json` (ex. `api.json`) ; ne pas gonfler `meta` |
| Dépendances | `dependances: []` | `{ npm: [], ressources: [] }`, vide obligatoire | Suivre l'ADR |
| Nombre de ressources | 7 composants (interrupteur, calendrier, curseur, champ-email, notifications, boutons, carte-sejour), 3 blocs (questions-frequentes, navbar-restaurant, hero-restaurant), 3 designs | Le plan dit « 6 à 8 », le lot 6 dit « 6 ressources et 3 designs » | Porter **les 10 + 3** (le projet a déjà leurs `meta.json`) |

Statut des ressources de démonstration : `provisoire` (badge « Démo provisoire »), à dire dans le pied de page tant que c'est vrai (`pied.provisoire`).

Animations propres des ressources (`DESIGN.md:273-309`) : sobres, `transform` et `opacity` uniquement (plus la hauteur de `::details-content` avec `interpolate-size`), durées dérivées de `--ngs-duration`, jamais de rebond ; CSS (`@keyframes`) ou `animate.enter` / `animate.leave` d'Angular, **jamais** `@angular/animations` ni GSAP. Toujours désactivables par trois voies : input `animations` (`booleanAttribute`) relié à l'hôte par `host: { '[class.ngs-sans-animation]': '!animations()' }` ; classe `.ngs-sans-animation` sur un parent ; `prefers-reduced-motion` (`@media (prefers-reduced-motion: no-preference)` ou `motion-safe:`). Sortie par l'hôte : la règle `:host(.hero-sortie)` vit dans le CSS du composant (`DESIGN.md:306`).

### 7.2 Les deux variantes de code

- **Tailwind (défaut)** et **CSS + tokens**. Le choix est gardé dans le cookie fonctionnel `ngs_variante` (`SameSite=Lax`, `Max-Age` 31536000, jamais `localStorage`), lu avec « tailwind » comme valeur par défaut si le cookie est absent ou inconnu (`ressource.js:31`, `:309`).
- Produire : **deux sources écrites** (option 3, ADR 0002), `.ts` commun, `tailwind/<slug>.component.html`, `css/<slug>.component.html` + `.css`. La maquette génère la variante Tailwind depuis une table `tw` (classe BEM → utilitaires, `variantes.js:9-58`) : **c'est un artifice de maquette, pas l'architecture cible**. Le lot 6 écrit réellement les deux gabarits.
- Contrôles CI bloquants : équivalence de structure (gabarits identiques une fois les attributs `class` retirés) et équivalence visuelle Playwright (2 designs, clair et sombre, 390 et 1280 px).
- Le code Angular exact attendu pour chaque ressource est dans `registre.js` (propriété `angular`) : standalone, `OnPush`, `input()` / `model()`, `inject()`, `@if` / `@for` avec `track`, `NgOptimizedImage`, aucune icône tierce (SVG en ligne).

### 7.3 Aperçus isolés (ADR 0003, proposé)

| Aperçu | Isolation | Variante rendue |
| --- | --- | --- |
| Accueil, grille du catalogue | Shadow DOM, `@defer (on viewport)` | CSS + tokens (Tailwind sous Shadow DOM : `@property` inopérant) |
| Fiche `/apercu/<slug>` | iframe `sandbox="allow-scripts"` **sans** `allow-same-origin`, `noindex`, app d'aperçus séparée | Tailwind |

La maquette fait déjà : `<ngs-apercu ressource="…">` en Shadow DOM (`apercu.js`) et iframe en `srcdoc` (`ressource.js:47-120`). **Ne pas transposer** le `srcdoc` : en production l'iframe pointe vers `/apercu/<slug>`, application prérendue avec son propre build Tailwind. Les tokens `--ngs-*` posés sur l'hôte traversent la frontière Shadow DOM par héritage.

Messages : la maquette utilise `ngs-tokens` (site vers aperçu), `ngs-sortie`, `ngs-pret`, `ngs-sortie-fin`, avec la cible `'*'`. Le plan fixe `{ type: 'reglages', design, mode, valeurs }`, `{ type: 'pret' }`, `{ type: 'hauteur', px }`. **Forme finale à fixer au spike.** Dans tous les cas : côté site, comparer `event.source` à la fenêtre de l'iframe (l'origine sandbox vaut `null`) ; côté aperçu, vérifier l'origine du site ; ignorer tout autre message ; ne jamais utiliser `'*'` en production.

### 7.4 Copier, télécharger, zip

Maquette : `livraison.js:33-86`, `contrat.js`, `zip.js`. En production :
- **Zips standards** produits au build (un par variante), servis statiquement ; seul le zip « avec mes réglages » est assemblé dans le navigateur (bibliothèque zip en `import()` à la demande ; `zip.js` de la maquette est un zip « stored » maison pour la maquette seulement).
- Contenu de `<slug>-tailwind.zip` : `.ts`, `.html` (+ `.component.css` si `@keyframes`), `ngshelf-theme.css`, `tokens.css`, `README.md`, `LICENSE` (MIT). `<slug>-css.zip` : `.ts` (avec `styleUrl`), `.html`, `.css`, `tokens.css`, `README.md`, `LICENSE`. Le README remplace bien `{slug}` dans les étapes d'installation (corrigé en v0.8). Texte du README : clés `zip.*` de `textes.fr.js`.
- **Écart à trancher** : l'ADR 0002 met `ngshelf-theme.css` seul dans le zip Tailwind et `tokens.css` « facultatif » dans le zip CSS ; la maquette met `tokens.css` dans les deux et ne contient pas les valeurs par défaut dans le pont. Suivre l'ADR si Sidy ne dit pas le contraire.
- « Copier le code » copie les fichiers de la variante choisie ; « Copier avec mes réglages » ajoute le bloc de valeurs du design réglé. Les lignes de `tokens.css` modifiées s'allument en vert puis s'éteignent (1,2 s).
- **Mode sombre dans le code livré : trois sélecteurs différents dans les sources.** `.ngs-sombre` (`contrat-tokens.css`), `.dark` (`tokens.css` généré par `contrat.js` (fonction `fichier`, lignes 78-95), et son en-tête dit « ajoutez la classe .dark sur `<html>` »), `html.sombre` (iframe de la maquette). **À unifier** avant la génération réelle ; choix recommandé : `.dark`, convention de Tailwind (point ouvert 13).
- Hors ligne ou 404 sur un zip : état `erreur` avec « Réessayer ».

### 7.5 Bug corrigé en v0.5 : largeur nulle d'un hôte `@container`

Dans la variante Tailwind, l'hôte de la carte de séjour est un conteneur (`@container`, donc `container-type: inline-size`, sans largeur intrinsèque). Posé dans une enveloppe `[data-piece]` qui s'ajuste à son contenu, il retombait à **0 px de large** : l'aperçu était vide. Ce n'était ni la sortie, ni la balise cachée, ni l'animation d'entrée. Correction (`ressource.js:71-76`) : l'enveloppe de chaque pièce occupe toute la largeur (`[data-piece]{width:100%;min-width:0;display:grid;justify-items:center}`). **À reproduire dans la page d'aperçu de l'app `apercus`, pour toute ressource dont l'hôte est un `@container`**, et à couvrir par un test visuel.

## 8. Motion

Niveaux : 1 accueil et « À propos », 2 catalogue et fiche, « Lire » pour les pages légales (micro-interactions seulement). Le tableau ci-dessous reprend **toutes les lignes** de `DESIGN.md:237-271`, complétées des durées et courbes lues dans les scripts. En cas de doute, la maquette fait foi.

### 8.1 Tokens de durée et de courbe

| Token | Valeur | Token | Valeur |
| --- | --- | --- | --- |
| `--duration-press` | 90 ms | `--ease-out` | `cubic-bezier(.2,.8,.2,1)` (UI) |
| `--duration-out` | 120 ms | `--ease-enter` | `cubic-bezier(.22,1,.36,1)` (entrées) |
| `--duration-in` | 150 ms | `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` (déplacements) |
| `--duration-panel-in` / `-out` | 200 / 120 ms | `--duration-theme` | 420 ms |
| `--duration-image-in` / `-out` | 600 / 400 ms | Sortie / entrée de page | 180 / 300 ms |

Sortie plus rapide que l'entrée (60 à 70 %), jamais de rebond sur l'UI, animations interruptibles.

### 8.2 Tableau des animations

Conventions : « GSAP » = timeline ou tween dans `afterNextRender`, « batch » = `ScrollTrigger.batch`. **Mobile** = moins de 1024 px sauf mention. **Reduced** = `prefers-reduced-motion: reduce`. Les valeurs en `s` viennent des scripts (`accueil.js`, `a-propos.js`, `catalogue.js`, `ressource.js`, `app.js`).

| # | Page / section | Animation | Déclencheur | Durée, courbe | Mobile | Reduced |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Toutes, **splash** | SVG en ligne et `@keyframes` CSS (sans GSAP) : planche (`scaleX` .15 → 1), tuile « n » qui tombe avec impact (`scaleY` .94) et rebond, puis « g » ; sortie par `clip-path` | Premier chargement d'un document seulement (pas en navigation interne, pas de `sessionStorage`) | Planche 220 ms ; chute 380 ms (« n » dès 100 ms, « g » 120 ms après) ; sortie 320 ms `cubic-bezier(.65,0,.35,1)` ; **min 600 ms, sortie lancée au plus tard à 880 ms, filet CSS à 1,2 s** | Identique | Absent ; `noscript` le masque aussi |
| 2 | Accueil, hero | `h1` ligne par ligne depuis des masques (SplitText `lines`), texte et boutons en cascade ; vitrine qui s'ouvre (`clip-path` bas vers haut, scale .97 → 1) ; pièces, calendrier (y 60, −3° → 0), notification, étiquettes (scale .6 → 1) | Fin du splash (promesse déclenchée 120 ms après le début de la sortie) | Timeline d'environ 2 s, `expo.out` ; lignes 1 s (stagger .09), vitrine 1,1 s, étiquettes .5 s | Identique | Tout affiché directement |
| 3 | Accueil, planche | Cases rangée par rangée (y 36 → 0, scale .96 → 1) avec états finaux explicites et `clearProps` | Entrée dans l'écran, une fois (`batch`) | .8 s `expo.out`, stagger 60 ms | Identique | Affichées |
| 4 | Accueil, vitrine | Profondeur au pointeur : calendrier et notification suivent la souris (8 à 14 px) | Pointeur fin, ≥ 1024 px | `quickTo` .8 s `power3.out` | Coupé | Coupé |
| 5 | Toutes, **sortie et entrée de page** | Ancienne vue : fondu et montée de 8 px ; nouvelle : arrivée de 8 px plus bas, 60 ms de décalage ; en-tête immobile | Navigation du router (pas sur changement de paramètres seuls) | 180 ms / 300 ms, courbes `--ease-in-out` / `--ease-enter` | Identique | Aucune ; sans support : navigation directe |
| 6 | Case → fiche, fiche → liste | La scène de la case devient le cadre d'aperçu de la fiche (morph, nom `apercu-ressource`) et inversement | Clic sur la case ; retour arrière ou fil d'Ariane | 480 ms `cubic-bezier(.65,0,.35,1)` | Identique | Aucune |
| 7 | Recherche, menu, tiroir de filtres | Sortie animée (fondu et 6 px ; tiroir qui redescend) | Fermeture (Échap, bouton, fond) | 120 ms | Identique | Immédiat |
| 8 | Accueil, CTA principal | Bouton magnétique discret (±5 px) | Pointeur fin | `quickTo` .35 s `power3.out`, sans rebond | Coupé | Coupé |
| 9 | Accueil, « Habiller avec un design » | Vague : vitrine puis chaque case reçoivent les tokens du design, décalage et pulsation | Clic | 70 ms de décalage ; pulsation .985 en .12 s `power2.out` ; couleurs via les transitions des ressources | Identique | Changement immédiat, sans pulsation |
| 10 | Accueil, « Quatre familles » | **Moment fort 1 (épinglé)** : défilement horizontal des 4 panneaux ; la graisse du nom passe de 460 à 800 (`--wght`) et l'approche se resserre | Scroll, pin + scrub 1 | `ease: none` ; distance calculée | Panneaux empilés, entrée en cascade (`batch`, y 32, .8 s `expo.out`, stagger .08) | Empilés et immobiles |
| 11 | Accueil, « Deux gestes » | **Moment fort 2** : démonstration collante ; code copiable puis contenu du zip par `clip-path`, fichiers en cascade | Scroll (rangée active), clic | `clip-path` .7 s `expo.out` ; fichiers .45 s stagger 50 ms | Vues empilées, révélation à l'entrée | Les deux visibles |
| 12 | Accueil, « Douze tokens » | **Moment fort 3** (non épinglé) : chaque jeton à 62 % de l'écran s'allume et applique sa valeur Fleuve aux témoins ; en remontant, valeur Planche | Scroll réversible (`onEnter` / `onLeaveBack`) | Changement d'état | Identique | Même comportement |
| 13 | Accueil, titres h2 | Mots qui montent depuis un masque (SplitText `words`) | Scroll, une fois (`top 85%`) | .8 s `expo.out`, stagger 50 ms, `yPercent` 105 | Identique | Affichés |
| 14 | Accueil, « Contribuer » | Le parcours se dessine (`stroke-dashoffset`), étapes qui apparaissent | Scroll, scrub .8 | `ease: none` | Identique | Tracé complet |
| 15 | Case → fiche (repli) | Voile gris qui grandit depuis la case (FLIP manuel), puis navigation ; la fiche entre par fondu et scale .985 → 1 | Clic sur le pied de case, **seulement sans View Transitions** | .5 s `expo.inOut` (`app.js`) ; `DESIGN.md` dit 550 ms | Identique | Navigation directe |
| 16 | Catalogue, grille | Première arrivée en cascade ; à chaque filtre, **Flip** : cases gardées qui glissent, nouvelles qui entrent (scale .94 → 1), `clearProps` à la fin | Chargement, saisie (anti-rebond 140 ms), clic | Cascade .5 s `expo.out` stagger 50 ms ; Flip .45 s `power2.inOut`, entrée .35 s avec .1 s de retard | Identique | Remplacement immédiat |
| 17 | Catalogue, chargement | Squelettes à la forme des cases (shimmer) | Chargement | CSS | Identique | Squelette fixe |
| 18 | Fiche, onglets de code | Indicateur qui glisse sous l'onglet actif | Clic, flèches | 260 ms | Identique | Immédiat |
| 19 | Fiche, version du code | Passage Tailwind ↔ CSS : fichiers et aperçu régénérés, code qui remonte en fondu | Clic | 300 ms | Identique | Immédiat |
| 20 | Fiche, réglages | L'aperçu suit les tokens avec la durée du design ; lignes modifiées de `tokens.css` allumées en vert puis éteintes, point sur l'onglet | Changement de réglage | 1,2 s pour la surbrillance | Identique | Surbrillance sans fondu |
| 21 | Fiche, largeur d'aperçu | Fondu de l'iframe pendant le changement ; **la largeur n'est jamais animée** (vraies media queries) | Clic | .1 s puis .2 s | Identique | Immédiat |
| 22 | Fiche, copier / télécharger | « Copier le code » devient « Code copié » + toast ; « Télécharger » passe en chargement puis « Zip téléchargé » | Clic | Retour < 100 ms | Identique | Identique |
| 23 | Header, menu du thème | Descente de 6 px en fondu ; le changement de thème est immédiat | Clic, clavier | 200 ms ouverture, 120 ms fermeture | Identique | Immédiat |
| 24 | À propos, hero | Mots du titre qui basculent depuis des masques (rotation 8° → 0) ; 5 pièces qui arrivent de loin en tournoyant (±22°, scale .7) et s'assemblent ; 3 faits (scale .4 → 1) ; étiquettes | Chargement, après le splash | Titre 1 s stagger .06 ; pièces 1,3 s `expo.out` ; faits .6 s ; étiquettes .45 s | 3 pièces en colonne, départs courts | Affichées, immobiles |
| 25 | À propos, pièces du hero | Au pointeur, pièces et faits flottent selon leur profondeur ; au scroll, elles se démontent | Pointeur fin ; scroll scrub .7 | `quickTo` .9 s `power3.out` | Coupé | Coupé |
| 26 | À propos, « Le catalogue aujourd'hui » | Tuiles révélées en `clip-path` ; compteurs qui montent ; carrés par ressource ; 12 jetons ; 3 pastilles de design ; bascule Tailwind / CSS ; « Créer un compte » rayé. **Valeurs tirées du registre et du contrat** | Scroll, une fois | Tuiles 1 s `expo.inOut` stagger .1 ; compteurs .9 à 1,6 s `power2.out` | 1 ou 2 colonnes | Valeurs finales |
| 27 | À propos, « Copier, Régler, Livrer » | **Moment fort (épinglé, 220 %)** : barre de progression ; étape active en graisse 800 ; scène du code aux pièces vivantes (3 designs en direct) puis au zip | Scroll, pin + scrub .8, réversible | Étapes .3 s ; `clip-path` .4 s `power2.inOut` | Empilé, révélation à l'entrée, le design change en traversant « Régler » | Tout affiché, design Planche |
| 28 | À propos, titres de section | Mots qui montent depuis un masque | Scroll, une fois | .8 s `expo.out`, stagger 50 ms | Identique | Affichés |
| 29 | À propos, promesses et liste | Rangées qui arrivent de la gauche (x −16 → 0) | Scroll, une fois (`batch`) | .7 s `expo.out`, stagger 70 ms | Identique | Affichées |
| 30 | À propos, « Pour qui » | **Moment épinglé (160 %, ≥ 1024 px)** : manifeste mot à mot (opacité .16 → 1) ; code « avant » écrit ligne à ligne, chaque « À faire » rayé et coché ; puis le vrai calendrier prend la place | Scroll, pin + scrub .8, réversible | Mots .3 s stagger .06 ; calendrier .45 s `expo.out` | Rien d'épinglé, séquence jouée une fois, l'avant reste au-dessus de l'après | État final (lignes rayées, calendrier visible) |
| 31 | À propos, « Comment c'est fait » | Photo révélée en masque ; 4 vues empilées dans la même cellule, fondu croisé et révélation de haut en bas ; le point actif suit la progression | Scroll (desktop), clic, clavier | 550 ms | Panneau sous la photo, choix au toucher | Changement immédiat |
| 32 | À propos, « Contribuer » | Bloc du dossier révélé (`clip-path`), lignes en cascade, 4 étapes qui montent | Scroll, une fois | .9 s `expo.out`, stagger 50 ms | Identique | Tout affiché |
| 33 | À propos, « Qui le développe » | Portrait révélé de bas en haut et dézoome (1,18 → 1) ; 4 carrés de famille ; nom lettre par lettre (SplitText `chars`) ; cartes de liens en cascade ; parallaxe léger | Scroll, une fois ; parallaxe en scrub | Révélation par figure 1,1 s `expo.inOut`, dézoom 1,4 s `expo.out` | Identique, sans parallaxe | Affichés, immobiles |
| 34 | Accueil et À propos, **Lenis** | Défilement doux synchronisé avec ScrollTrigger | Scroll | `autoRaf: false`, `lenis.raf` branché sur le ticker GSAP | Actif | Coupé |
| 35 | Header, menu, dialogue, toasts | Bordure du header à 8 px de scroll ; menu plein écran (descente de 6 px, liens à 40 ms) ; recherche (fondu + 6 px) ; toasts (12 px) | Scroll, clic, clavier | `--duration-panel-*` | Identique | Immédiat |

**Sections épinglées : au plus 3, jamais deux de suite.** Accueil : une seule (« Quatre familles »). « À propos » : deux, « Copier, Régler, Livrer » puis « Pour qui », **séparées par « Pourquoi »** (ne pas supprimer cette section intercalaire). Aucune autre page n'épingle. À l'intégration : recalculer les épinglages dans l'ordre de la page (`refreshPriority`, `a-propos.js:280` et `:309`), sinon « Pour qui » et « Comment c'est fait » démarrent trop tôt ; `ScrollTrigger.refresh()` après le chargement des polices et des images.

**Effets liés au pointeur : deux au maximum** (bouton magnétique, profondeur de la vitrine) plus la profondeur des pièces de « À propos ».

### 8.3 View Transitions et animation de sortie (ADR 0005)

- `provideRouter(routes, withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated }))`. Stable depuis Angular 22.3. Sortie et entrée en CSS sur `::view-transition-old(contenu)` et `::view-transition-new(contenu)`, avec `view-transition-name: contenu` sur la zone principale seulement : l'en-tête et le pied ne bougent pas. Valeurs : sortie 180 ms (fondu, −8 px), entrée 300 ms avec 60 ms de décalage (fondu, +8 px).
- **Sauter** la transition (`transition.skipTransition()`) si `prefers-reduced-motion`, si seuls les paramètres d'URL ou le fragment changent, ou si la route est la même.
- **Sens** : attribut `data-transition` sur `<html>` posé dans `onViewTransitionCreated`, retiré à `transition.finished`. Pas de « types » de View Transitions (Firefox 144 ne les a pas).
- **Élément partagé** case → fiche : un seul `view-transition-name: apercu-ressource` à la fois, posé sur `.ngs-case__stage` juste avant la navigation, retiré après ; au retour, posé sur la case dont le slug correspond (maquette : `app.js:249-331`, dont `pagereveal` ligne 314). Durée du morph : 480 ms.
- **Important : la maquette utilise des transitions *entre documents*** (`@view-transition { navigation: auto; }`, nom `root`, en-tête nommé `entete`, `index.html:68-80`). **En Angular, ce sont des transitions du router dans le même document** : remplacer `root` par `contenu` et supprimer la règle `navigation: auto`. L'ADR 0005 prévoit « aucun code de repli » ; le repli GSAP de la maquette (sortie de `<main>` et voile, `sortirVers`, `app.js:284-298`) **n'est donc pas à porter**, sauf demande contraire de Sidy (point ouvert).
- Lenis est arrêté avant la transition ; GSAP n'anime jamais un changement de route.

### 8.4 Splash (ADR 0006, décision 7)

- Contenu : SVG en ligne (logo recadré `viewBox="320 236 896 491"`) et `@keyframes` CSS, **sans GSAP**. Markup : `index.html:156-162` ; CSS critique : `index.html:30-67`. Fond blanc en clair, bleu nuit `#191f42` en sombre (tuiles `#ededf0`, planche orange).
- Temps : minimum affiché **600 ms**, sortie (`clip-path`, 320 ms) lancée **au plus tard à 880 ms**, pour que le splash ait disparu à **1,2 s** ; un minuteur CSS (`animation: … 0s 1.2s forwards; visibility: hidden`) le masque seul si le JS échoue. `<noscript>` le masque. Mesure du plancher depuis `performance.now()` pris dans le `<head>`.
- Dans le projet : le CSS critique et le SVG vont dans `src/index.html` ; le retrait s'appuie sur `ApplicationRef.whenStable()` ; **le script d'amorçage doit être un fichier externe** (CSP `script-src 'self'`, `public/_headers`), comme `theme-init.js`. Un script en ligne casserait la CSP.
- **Écouter seulement `animationend` de `ngs-splash-sortie`** (`e.target === splash`) : les fins d'animation des tuiles remontent jusqu'à l'élément et le retiraient trop tôt (bug corrigé en v0.8, `app.js:343-350`).
- L'accueil enchaîne : son intro démarre pendant la sortie du splash (promesse résolue 120 ms après le début de la sortie).
- Premier chargement d'un document seulement ; la maquette détecte une navigation interne avec `document.referrer` (même origine), ce que le router remplace naturellement. Pas de `sessionStorage` (interdit).
- Si les mesures du lot 0 dépassent LCP mobile 2,5 s ou Lighthouse performance 90 sur l'accueil prérendu, **basculer sur l'option 2 de l'ADR 0005** (splash non masquant) : demander le design au designer.

### 8.5 Règles apprises (v0.3, à respecter partout)

1. **`transform` est réservé à GSAP.** Aucune transition CSS sur `transform` d'un élément que GSAP anime : la cause des « cases collées » de la v0.2 était une transition CSS sur `transform` de `.ngs-case` qui concurrençait un `from()`, laissant un décalage résiduel (`translate(0, 24 à 36 px) scale(.96)`).
2. **Survols par `translate` et `scale`** (propriétés individuelles), jamais par `transform`. Aucune case ne porte de `transform` au repos.
3. **`gsap.fromTo` avec état final explicite, puis `clearProps`** (`'transform,opacity,visibility'`) à la fin, plutôt que `from()`. Même chose après un Flip (`onComplete`).
4. Jamais d'animation de `width`, `height`, `top`, `left`, `margin`, `padding` ; `transform`, `opacity`, `clip-path`, `filter`, couleurs.
5. Les états cachés (`.ngs-motion …`) ne sont posés que par le script et retirés à la destruction : sans JS, tout reste visible.
6. Gouttière de la planche unique (`--space-gutter`), vérifiée à 320, 768, 1024, 1440, 1920 et 2560 px : une seule valeur d'écart horizontal et vertical, aucun chevauchement.

## 9. Thème clair, sombre, système

- Cookie fonctionnel **`ngs_theme`** : `clair`, `sombre` ou `systeme` (défaut), `SameSite=Lax`, `Max-Age=31536000`, `Path=/`. Jamais `localStorage`.
- **Un script bloquant dans le `<head>`, avant le premier rendu, sans flash** : il lit le cookie et `prefers-color-scheme`, pose `data-theme-choix` (le choix) et `data-theme="sombre"` (si sombre) sur `<html>`, et met à jour `<meta name="theme-color">` (`#111113` en sombre, `#ffffff` en clair). Maquette : `index.html:11-28`. Projet : `public/theme-init.js`, **fichier externe** à cause de la CSP (la maquette le met en ligne ; l'écart est voulu). Le fichier garde un nom stable donc un cache court (`_headers`).
- Une règle critique en ligne pose le fond `#111113` avant le chargement du CSS. En mode système, un changement du réglage de l'appareil est suivi en direct. `ThemeService` reprend ensuite le même choix (mêmes valeurs de cookie et d'attributs ; ne pas les diverger).
- Changement de thème : immédiat (un fondu de toute la page ralentirait le geste). Événement `ngs-theme` pour les composants qui recalculent (accueil : jetons déjà allumés).
- **Aperçu de la fiche : réglage propre.** L'aperçu démarre dans le thème du site, puis le segment « Clair / Sombre » de la fiche le règle indépendamment. **Ce réglage n'est pas mémorisé** dans la maquette (seul `ngs_variante` l'est ; le plan évoque « le mode de l'aperçu s'il est gardé » : point ouvert, par défaut ne pas le garder).
- Blocs de code : inchangés dans les deux thèmes. Hero et planche : les cases sans mode imposé prennent les valeurs sombres du design choisi quand le site est sombre.

## 10. Accessibilité et performance

**Accessibilité**
- Contrastes **AA** calculés (formule WCAG 2.x) dans les deux thèmes : texte 4,5:1, grands titres 3:1, contrôles et focus 3:1. Tableaux : `DESIGN.md:96-149` ; le logo orange est exempté (2,98:1, WCAG 1.4.3, ADR 0006). Jamais d'information portée par la couleur seule (le nom de la famille est toujours écrit).
- **Cibles de 44 px** minimum, 8 px d'écart (exception : cellules du calendrier à 30 px sous 360 px, 7 colonnes obligatoires). `touch-action: manipulation`.
- **Focus visible** : anneau de 2 px décalé de 2 px (`--color-focus`), jamais masqué par l'en-tête fixe ; champ : bordure d'action + anneau doux de 3 px.
- **Nom accessible de la marque** : voir section 6 (« Accueil de NgShelf » dans l'en-tête ; `role="img"` + `aria-label="NgShelf"` ailleurs).
- Navigation clavier complète, `tabindex` jamais > 0, un seul `h1` par page, niveaux sans saut, labels associés, `aria-current="page"`, lien d'évitement, retour du focus après fermeture d'un panneau.
- `prefers-reduced-motion` : tout se pose à l'état final, rien ne reste caché (`components.css:773`). Surfaces du navigateur thémées : `::selection`, `caret-color`, scrollbars, `accent-color`.
- Textes : accents vérifiés (é è à ç œ « »), insécable U+00A0 avant `: ; ? !` et dans les guillemets (l'espace fine U+202F est absente de Chivo : ne pas l'utiliser).

**Performance (budgets, `design-sidy` §16 et ADR 0005)**

| Mesure | Cible |
| --- | --- |
| LCP mobile | **≤ 2,5 s**, splash compris, sur l'accueil prérendu |
| Lighthouse | performance ≥ 90 (accueil, ADR 0005), SEO 100 (plan, lot 3) |
| CLS | < 0,1 (repli de police aux métriques calculées, dimensions d'images explicites) |
| Poids transféré | < 1,5 Mo ; images < 1,2 Mo |
| JavaScript initial | < 450 Ko ; GSAP, Lenis et leurs plugins ≈ 65 Ko gzip, chargés **seulement** sur les pages qui s'en servent (chunk lazy) |
| CSS | < 120 Ko |
| Polices | 2 familles, 2 fichiers (46 Ko), préchargés |
| Chunks | un chunk lazy par feature ; index du catalogue découpé par catégorie, jamais dans le bundle initial |

Image de l'accueil (LCP) : la photo de la vitrine est en `fetchpriority="high"`, jamais en différé, `sizes="(min-width: 1024px) 40vw, 90vw"`, WebP 640 / 1024 / 1600 px → `NgOptimizedImage` avec `priority`. Les photos de « À propos » : `lagos-code` 640 et 1024, `sidy` 360 et 540 (`srcset`, `width` et `height` renseignés).

## 11. Contenus

- **Textes** : `design/maquette/js/textes.fr.js` (≈ 370 clés) est la source unique. Les pages HTML gardent le même texte en dur et portent `data-t="clé"` ; un contrôle a vérifié 0 écart. En Angular : `$localize` avec `@@clé` (`@angular/localize`, langue source `fr`) ; le projet a déjà `core/i18n/textes.fr.ts`. Les clés contiennent `{nom}`, `{n}`, `{q}` (paramètres). Ne rien écrire en dur dans un composant. Version anglaise : un fichier avec les mêmes clés plus tard, un build `/en/` ; non faite en v1.
- **Pluriels** : clés `pluriel.ressource` / `pluriel.ressources` (`NGS.pluriel`).
- **Liens de l'auteur** : `design/maquette/js/config.js` (`NGS.site.auteur` : nom, nom complet, portfolio, Instagram, TikTok, LinkedIn, GitHub, e-mail). En Angular : `core/config/site.config.ts`, **seule source** du pied de page, des mentions légales et du `sameAs` du JSON-LD. Rien n'est recopié dans une page. `depot` vaut `null` : tant qu'il l'est, les liens « Code source sur GitHub » doivent être masqués ou neutres (la maquette les pointe vers `#`).
- **Images et crédits** : `design/maquette/assets/images/CREDITS.md`. Photos Unsplash (licence Unsplash, usage commercial autorisé, attribution faite quand même), converties en WebP, jamais chargées depuis Unsplash : `yassa-*` (Keesha's Kitchen, Restaurant), `stlouis-*` (Baptiste Riethmann, Voyage), `lagos-code-*` (@disruptxn), portrait `sidy-*` (fourni par Sidy). **Reprendre CREDITS.md dans le dépôt** (page « À propos » ou fichier de crédits) ; les photos Restaurant et Voyage sont marquées provisoires. Alt du portrait : « Sidy Mohamed Saizonou ».
- **Polices et icônes** : licences à reprendre telles quelles (`OFL-chivo.txt`, `LICENSE-phosphor.txt`, notice dans `public/fonts/NOTICE.txt`).
- **Ressources de démonstration provisoires** : les 10 ressources et 3 designs de `registre.js`, badge « Démo provisoire », mention dans le pied de page. Les compteurs viennent du registre : **aucun chiffre ni avis inventé**. Aucun logo réel redessiné ; mention « Angular est une marque de Google LLC. NgShelf est un projet indépendant » (`pied.marque`).

## 12. À ne pas transposer tel quel

| Dans la maquette | Pourquoi | Par quoi le remplacer |
| --- | --- | --- |
| `@tailwindcss/browser@4.3.5` (CDN) et `load.js` (`design-system/load.js` lit `tokens.css` et `components.css` par `fetch`, les injecte en `<style type="text/tailwindcss">`) | Outils de maquette ; exigent un serveur HTTP | Tailwind v4 compilé (`@tailwindcss/postcss`) ; `@import` de `tokens.css` et `components.css` dans `src/styles.css` |
| Chargement de `contrat-tokens.css` par `fetch` et `NGS.contrat.charger` | Idem | Données générées au build par `registre:build` (valeurs des designs en JSON typé) |
| Scripts GSAP, ScrollTrigger, Flip, SplitText, Lenis en CDN jsDelivr | Pas de CDN en production (CSP `script-src 'self'`) | Paquets npm aux versions exactes (3.15.1, 1.3.28), importés dans les chunks lazy des pages concernées |
| Données en JS global `window.NGS` (`registre.js`, `config.js`, `textes.fr.js`, `NGS.t`, `NGS.pret`, `NGS.motion`, `NGS.theme`) | Global mutable, sans type, incompatible avec le prérendu | `registry/*/meta.json` → `src/generated/registre/`, `site.config.ts`, `textes.fr.ts` (`$localize`), services injectables (`RegistreService`, `ThemeService`), un service d'état du mouvement réduit |
| Attributs `data-t`, `data-t-aria`, `NGS.appliquerTextes` | Substitution de texte au runtime | Templates avec `i18n` / `$localize` |
| Pages `.html` liées par `href="catalogue.html?c=…"`, `ressource.html?r=…` | Maquette multipage | `routerLink` vers les routes de l'ADR 0004 ; `RouterLinkActive` avec `ariaCurrentWhenActive` |
| Transitions entre documents (`@view-transition { navigation: auto }`, `root`, `entete`) et repli GSAP (`sortirVers`, `.ngs-voile`, `pagereveal`, `pageshow`) | Propres au multipage | `withViewTransitions` (section 8.3) |
| 404 de `/maquette/tailwindcss` | Dans l'iframe d'aperçu, un `<style>` contenant `@import "tailwindcss"` déclenchait une requête (corrigé en v0.8 par un `<script type="text/plain">`) | Sans objet : l'app `apercus` a son propre build Tailwind ; ne jamais écrire `@import "tailwindcss"` dans un document servi tel quel |
| Aperçu de la fiche en `srcdoc` avec `postMessage('*')` | Montage de maquette | Iframe vers `/apercu/<slug>` (`sandbox="allow-scripts"`), messages vérifiés (section 7.3) |
| Table `tw` et `NGS.mapperClasses` qui fabriquent la variante Tailwind depuis du BEM | Artifice de maquette | Deux gabarits écrits à la main + équivalence en CI (ADR 0002, option 3) |
| `zip.js` « stored » maison, coloration `code.js`, MIT généré par `livraison.js` | Maquette | Zips au build ; **Shiki au build** ; fichier LICENSE du dépôt |
| Script de thème et de splash **en ligne** dans le `<head>` | La CSP de production interdit les scripts en ligne | Fichiers externes (`theme-init.js`, script de splash) ; seul le CSS critique (`<style>`) reste en ligne (`style-src 'unsafe-inline'` autorisé) |
| Timer `setTimeout(fermerSplash, 880)` et `document.referrer` | Maquette multipage | Retrait après `whenStable()` ; premier chargement détecté par l'absence de navigation du router |
| Lien GitHub et « Licence MIT » en `#` | « Mentions légales », « Confidentialité » et « Cookies » pointent vers leurs pages (v0.9) ; « Licence » reste à créer | Vraie route ; lien GitHub depuis `site.config.ts` |
| `?etat=chargement`, `?etat=erreur` | Simulation de maquette | États réels du service de registre (signal d'état + `@defer`) |
| Style `html.ngs-js:not(.ngs-styled) body > … { opacity: 0 }` (filet contre le flash de Tailwind navigateur) | Sans objet avec un CSS compilé | Supprimer |

## 13. Points ouverts et contradictions des sources

**À ne pas résoudre en codant : poser la question à Sidy.**

| # | Point | Source |
| --- | --- | --- |
| 1 | **Validation finale de la maquette** : aucune validation écrite de Sidy trouvée ; `DESIGN.md` v0.8 est « à valider par Sidy ». Le tableau de motion n'a pas été validé séparément (`DESIGN.md:233`) | `DESIGN.md:3`, `:233` |
| 2 | **Bouton global « Réduire les animations »** : proposé (interrupteur dans le menu du thème, cookie `ngs_motion`, classe `ngs-motion-reduite` sur `<html>`), non validé, non implémenté. Le site suit seulement `prefers-reduced-motion`. Ne pas coder | `DESIGN.md:309` |
| 3 | **Champ `motion` du registre** absent de l'ADR 0004 et de `MetaRessource` (à ajouter par l'architecte, avec `rejouer`) | `DESIGN.md:287` |
| 4 | **Dépôt GitHub** : le plan dit « pas encore initialisé » et `site.config.ts` a `depot: null`, alors que `ngshelf-frontend` a un remote `github.com/sidymohamed12/ngshelf` et des PR fusionnées. **Les dossiers `design/`, `docs/` et `DESIGN.md` sont à la racine, qui n'est pas un dépôt git** : ils ne sont pas versionnés et les liens du README du front vers `docs/adr/` ne mènent nulle part dans le dépôt. Où vivent-ils ? | `docs/plans/…:123`, `ngshelf-frontend/src/app/core/config/site.config.ts` |
| 5 | **Image sociale `og:image`** : aucune n'existe ; à produire à partir de `ngshelf-clair.svg`. Pas de `og:image` dans la maquette non plus | ADR 0006 « Conséquences » |
| 6 | **Format de distribution** (ADR 0002, décision 5) non tranché ; JSON de registre produit dès la v1 pour ouvrir un futur CLI | ADR 0002 |
| 7 | **ADR 0003** (aperçus) toujours `proposé` ; à confirmer par le spike | ADR 0003 |
| 8 | **ADR 0004** : filtres client en mode mixte et champ `dependances` non validés explicitement | ADR 0004, Statut |
| 9 | **Mentions légales** : champs à compléter par Sidy (statut, adresse, téléphone, NINEA / RCCM, nom et logo, CDP, durée des e-mails) et **hébergeur à choisir** (Cloudflare Pages ou Netlify) ; maquette faite en v0.9, texte à faire relire | section 5.5 |
| 10 | **Pages sans maquette** : « Démarrer », « Contribuer », « Licence » ; états `hors-ligne` et `serveur injoignable` (la 404 et les pages légales ont leur maquette depuis la v0.9) | section 5.5 |
| 11 | **Repli des transitions** : l'ADR dit « aucun repli », la maquette en a un (voile GSAP case → fiche, 500 ms) ; ce voile n'est pas dans l'ADR | section 8.3 |
| 12 | **Nom du `<title>`, `<meta description>`, `aria-label`** : « NgShelf » écrit en dur dans chaque page de la maquette, en plus de `config.js` (`DESIGN.md:3`) ; en Angular, tout passer par `site.config.ts` | `DESIGN.md:3` |
| 13 | **À écrire par l'architecte ou le designer** : table token ↔ utilitaire (annexe du contrat) ; unification du sélecteur du mode sombre des ressources (`.ngs-sombre`, `.dark`, `html.sombre`) ; messages `postMessage` définitifs ; forme exacte de `motion` dans `MetaRessource` | section 4.3, 7.3, 7.4 |
| 14 | **Type `curseur`** absent du vocabulaire validé : la ressource « Curseur » est rangée sous `champ` ; aucun ajout proposé | `DESIGN.md:387-389` |
| 15 | **Lot 0 (spike)** sans trace dans le dépôt : à confirmer ; sans ses mesures (LCP avec splash, Shiki, CLI shadcn, équivalence), les choix de splash et de grammaires restent des suppositions | plan `:38` |
| 16 | **Splash** : le plafond de 1,2 s et le minimum de 600 ms n'ont pas été mesurés en production sur LCP mobile | ADR 0005, 0006 |
| 17 | **Rattachement de « À propos »** à un lot du plan | section 3 |

**Contradictions relevées entre les sources, avec la règle de lecture retenue.**

| Contradiction | Règle retenue |
| --- | --- |
| Le plan (`:9`, Q12 `:119`) classe le mode sombre « hors périmètre » / « clair en v1 » ; `DESIGN.md` l'a livré en v0.3 | **`DESIGN.md` (plus récent)** : mode sombre inclus |
| Le plan (Q14 `:121`) et l'ADR 0005 limitent GSAP et Lenis à « l'accueil » ; `DESIGN.md` les utilise aussi sur « À propos », GSAP sur le catalogue et la fiche | **`DESIGN.md`** : accueil et « À propos » pour Lenis ; GSAP aussi catalogue et fiche |
| Le plan parle de 6 à 8 ressources ; la maquette en a 10 + 3 designs ; `DESIGN.md:363-367` liste encore « 5 composants + 1 bloc » | **La maquette** (`registre.js`) |
| ADR 0002 : `meta.ts` ; projet : `meta.json` | Projet (`meta.json`) ; ADR à corriger |
| ADR 0002 : `@utility` de densité ; pont actuel : variables `--spacing-ngs-N` | Pont actuel, à confirmer au spike |
| Plan Q13 : `@ng-icons/phosphor-icons` ; `DESIGN.md` et projet : sprite | Sprite |
| `DESIGN.md:3` : le nom est « défini en un seul endroit » ; il est aussi en dur dans les pages | Voir point 12 |
| `DESIGN.md:356` : les règles des transitions sont dans `components.css` ; elles sont en ligne dans le `<head>` des pages (`index.html:68-80`) | En ligne dans la maquette ; en Angular, dans `styles.css` |
| `DESIGN.md` : script de thème « en ligne » ; projet : script externe (CSP) | Externe |
| `DESIGN.md` : voile case → fiche 550 ms ; `app.js` : 0,5 s | Détail de repli, sans conséquence |
| `DESIGN.md` journal : deux lignes « 0.8 » | Une seule version 0.8 à clarifier |
| `design/brief.md` dit Angular 21 | Angular 22 (plan `:72`) |
| `docs/diagrams/catalogue-architecture.md:3` dit « ADR 0001 à 0005 (statut `proposé`) » ; seuls les ADR 0003 et la décision 5 de l'ADR 0002 le sont encore | Voir tableau section 1 |

## 14. Checklist de recette finale

Comparer l'intégration à la maquette servie par `python3 -m http.server 4173 --directory /Users/sidymohamed_12/Documents/projets/ngshelf/design` (liens dans `design/README.md`). Captures à **390, 768, 1024, 1440 et 2560 px, en clair puis en sombre** ; états à tester : chargement, vide, erreur, aucun résultat, titres longs, noms sans espace.

**Transversal**
- [ ] `ng build` sans erreur ni alerte ; un chunk lazy par feature ; Lighthouse SEO 100 ; LCP mobile ≤ 2,5 s ; budgets de la section 10 tenus.
- [ ] Fond blanc ; aucune couleur, ombre, rayon, durée ni police en dur (recherche des `#`, `rgb(`, `px` de rayon dans les composants) ; une seule bibliothèque d'icônes (sprite Phosphor).
- [ ] Contrastes AA dans les deux thèmes ; cibles de 44 px ; focus visible partout ; lien d'évitement ; un `h1` par page.
- [ ] Aucun défilement horizontal à 320, 390, 768, 1024, 2560 px.
- [ ] Rien du « look IA » : pas de halo, dégradé de texte, eyebrow en capitales, `→` systématique, monospace hors code.
- [ ] Aucun `localStorage` ni `sessionStorage` ; cookies : `ngs_theme`, `ngs_variante` seulement.
- [ ] Rendu sans JS : le contenu prérendu est lisible, le splash masqué.
- [ ] Mouvement réduit : rien ne reste caché, aucune transition de page, splash absent, Lenis coupé.

**Splash et thème**
- [ ] Splash clair (fond blanc) et sombre (`#191f42`), minimum 600 ms, disparu à 1,2 s au plus, aucune coupure de la sortie, absent en navigation interne.
- [ ] Aucun flash de mauvais thème au rechargement, cookie `ngs_theme` respecté, mode système suivi en direct, `theme-color` à jour.

**Header et pied**
- [ ] Marque : nom accessible « Accueil de NgShelf » ; méga-menu avec compteurs ; menu du thème au clavier ; recherche ⌘K ; tiroir mobile.
- [ ] Pied : liens des réseaux et signature lus dans `site.config.ts`, liens légaux réels.

**Accueil** (`index.html`)
- [ ] Hero : `h1`, vitrine, étiquettes qui ouvrent les fiches, « Habiller avec un design ».
- [ ] Planche alignée (gouttière unique, aucun décalage résiduel) ; familles épinglées ≥ 1024 px, empilées sinon ; gestes (copie et zip réels) ; douze tokens réversibles ; parcours de contribution.
- [ ] Une seule section épinglée ; Lenis actif ; effets du tableau 8.2 (lignes 1 à 14, 34) présents au début, au milieu et à la fin du scroll.

**Catalogue** (`catalogue.html`)
- [ ] Facettes avec compteurs et valeurs vides grisées ; tiroir mobile ; filtres actifs retirables ; tri ; « Afficher plus » ; état dans l'URL partageable ; canonique sans paramètres.
- [ ] Flip fluide, cases de même hauteur par rangée, aucun `transform` résiduel ; chargement, erreur avec « Réessayer », catégorie vide, aucun résultat.
- [ ] Pages de catégorie, de type et de secteur prérendues et présentes dans le sitemap.

**Fiche** (`ressource.html`)
- [ ] Aperçu isolé (iframe sandbox), largeurs 390 / 768 / 1280 avec vraies media queries, mode Clair / Sombre indépendant du site.
- [ ] Réglages : design, couleur (contraste calculé), rayon, densité, animations ; `tokens.css` mis à jour en surbrillance.
- [ ] Sélecteur Tailwind / CSS, cookie `ngs_variante`, code identique à l'aperçu dans les deux variantes.
- [ ] Copier (variante choisie, avec réglages), télécharger (zip statique, zip réglé), toasts, presse-papiers refusé, zip injoignable.
- [ ] Hôte `@container` : largeur non nulle (bug v0.5) ; « Rejouer l'entrée / la sortie » ; ressource introuvable.
- [ ] Morph case → fiche et retour ; View Transitions sautées en mouvement réduit et sur changement de paramètres.

**À propos** (`a-propos.html`)
- [ ] Hero avec pièces utilisables ; mosaïque dont toutes les valeurs viennent du registre ; deux sections épinglées séparées par « Pourquoi » ; « Pour qui » sans épinglage sous 1024 px ; panneau « Comment c'est fait » contenu dans la photo ; bande « Qui le développe » sombre dans les deux thèmes.
- [ ] Crédits des photos présents ; alt du portrait.

**Registre et livraison**
- [ ] La CI échoue sur chaque cas de l'ADR 0004 « Conséquences » (type ou secteur inconnu, slug en double, plus de 3 secteurs ou 8 tags, `dependances` non vide, texte `fr` absent) ; équivalence de structure et visuelle verte pour les 10 ressources et 3 designs.
- [ ] Chaque zip contient README (`{slug}` remplacé), LICENSE, `ngshelf-theme.css` (Tailwind) ; aucune ressource n'importe GSAP, Tailwind runtime ni bibliothèque d'icônes.

**Si une vérification n'a pas pu être faite**, le dire dans la PR et donner la commande à lancer (Playwright, Lighthouse CI, `npm run build`).
