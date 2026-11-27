# Catalogue Angular — plan d'exécution

Plan du site catalogue (NgShelf). Rien n'est construit. ADR 0001, 0002 (décisions 1 à 4), 0004 et 0005 acceptés le 2026-11-26 ; ADR 0003 et la décision 5 de l'ADR 0002 restent `proposé`. L'arbitrage initial des 17 questions du designer est conservé en annexe.

## 1. Objectif

Un site public, gratuit et open source (MIT), sans compte ni achat, en français en v1, qui présente des ressources Angular 22 vivantes (composants, blocs, templates, designs), classées par catégorie, type et secteur, chacune livrée **en Tailwind CSS v4 (par défaut) et en CSS + tokens**, à copier ou télécharger. Concept : B « Planche spécimen » avec le réglage par tokens de C (validé).

Hors périmètre v1 : back-end, comptes, favoris, statistiques, version anglaise, CLI npm, schematics, dépendances entre ressources ou vers des paquets npm (champ réservé seulement), mode sombre complet du site.

## 2. Décisions

| Sujet | Décision | ADR | Statut |
| --- | --- | --- | --- |
| Version | Angular 22, zoneless, standalone, signals | [0001](../adr/0001-site-statique-prerendu-angular-22.md) | validé |
| Concept | B avec le réglage de C | — | validé |
| Langue | français en v1 ; textes du site marqués `i18n`, textes du registre en `{ fr, en? }` pour l'anglais plus tard | [0001](../adr/0001-site-statique-prerendu-angular-22.md), [0004](../adr/0004-taxonomie-routes-registre.md) | validé (préparation `À VALIDER`) |
| Licence | MIT, site et ressources | — | validé |
| Ressources v1 | 6 à 8 ressources provisoires (badge « provisoire ») | [0004](../adr/0004-taxonomie-routes-registre.md) | validé |
| Rendu, hébergement | prérendu statique complet, Cloudflare Pages gratuit | [0001](../adr/0001-site-statique-prerendu-angular-22.md) | validé |
| Deux variantes | Tailwind v4 par défaut + CSS et tokens, tokens `--ngs-*` communs, pont `@theme inline` | [0002](../adr/0002-registre-tokens-distribution.md) | validé (principe) |
| Produire les variantes | deux sources écrites, `.ts` commun, équivalence de structure et visuelle bloquante en CI ; option « une source Tailwind compilée » réévaluée fin du lot 4 | [0002](../adr/0002-registre-tokens-distribution.md) | validé |
| Distribution | copier + 2 zips statiques ; JSON de registre pour un futur CLI | [0002](../adr/0002-registre-tokens-distribution.md) | `À VALIDER` |
| Aperçus | Shadow DOM en variante CSS (accueil, grille), iframe sandbox en variante Tailwind (détail) | [0003](../adr/0003-apercus-live-isoles.md) | `À VALIDER` |
| Taxonomie | catégorie, type, secteur (libellé « Secteur »), vocabulaire de l'ADR 0004, design dérivé du contrat, tags libres | [0004](../adr/0004-taxonomie-routes-registre.md) | validé |
| Routes | `/<categorie>/<type>/<slug>` ; pages prérendues pour catégorie, type et secteur ; combinaisons filtrées côté client | [0004](../adr/0004-taxonomie-routes-registre.md) | URL validée ; filtres côté client `À VALIDER` |
| Dépendances | champ `dependances` réservé, vide obligatoire en v1 | [0004](../adr/0004-taxonomie-routes-registre.md) | `À VALIDER` |
| Splash | conforme au skill et plafonné si le budget LCP tient, sinon non masquant | [0005](../adr/0005-splash-transitions-de-page.md) | validé |
| Transitions | `withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated })`, sorties en CSS | [0005](../adr/0005-splash-transitions-de-page.md) | validé |
| Footer | réseaux sociaux de Sidy et « Développé par » lus dans une config centrale `core/config/site.config.ts` | — | décidé ; réseaux fournis par Sidy (Instagram, TikTok, LinkedIn, GitHub, e-mail ; portfolio pour « Développé par »), saisis dans la config au lot 3, pas dans `docs/` |

Schémas : [docs/diagrams/catalogue-architecture.md](../diagrams/catalogue-architecture.md). Flux de la page de détail : [docs/flows/detail-ressource-variantes.md](../flows/detail-ressource-variantes.md).

## 3. Lots et tâches

| n° | tâche | agent | dépend de | branche | critère de fin |
| --- | --- | --- | --- | --- | --- |
| 0 | Spike technique (voir prompt) | `frontend-dev` | ADR acceptés (fait) | `core/spike-registre-variantes` | build statique en aperçu Cloudflare ; mesures et sortie CSS compilée (option 1 de l'ADR 0002) jointes à la PR |
| 1 | Design system, contrat de tokens avec annexe Tailwind, maquette : filtres, pages de type et de secteur, sélecteur Tailwind / CSS, splash, transitions, footer ; `HANDOFF.md` | `designer` | concept validé (en cours dans `design/`) | `docs/design-system-maquette` | maquette validée par Sidy |
| 2 | Vocabulaire de la taxonomie : validé par Sidy (ADR 0004) ; le designer affine seulement les libellés affichés | `designer` | ADR 0004 | (dans le lot 1) | libellés reportés dans `HANDOFF.md` |
| 3 | Socle : Angular 22, Tailwind v4, alias, layouts, routes générées depuis la taxonomie, SEO, pages légales, 404, `_headers`, `_redirects`, splash, View Transitions, config du site et footer | `frontend-dev` | 0, 1 | `core/socle-site` | `ng build` sans erreur ni alerte, un chunk lazy par feature, Lighthouse SEO 100, test Playwright des transitions (aucune en mouvement réduit) |
| 4 | Pipeline du registre : schéma et validation, index par catégorie, Shiki, zips × 2, JSON × 2, sitemap, lint de style des deux variantes, contrôles d'équivalence | `frontend-dev` | 0 | `core/pipeline-registre` | la CI échoue sur chaque cas listé en ADR 0004 « Conséquences » ; toutes les sorties générées pour 2 ressources ; point de décision option 1 / option 3 noté dans la PR |
| 5 | CI GitHub Actions : build, validation et équivalence du registre, Playwright, déploiement Cloudflare | `frontend-dev` | 4 | `ci/build-registre-deploiement` | une PR de test qui casse l'équivalence est rouge ; une PR saine produit un aperçu déployé |
| 6 | Porter les 6 ressources et 3 designs de la maquette dans `registry/`, en deux variantes | `frontend-dev` | 1, 4 | `feat/ressources-provisoires` | 6 ressources et 3 designs passent validation et équivalence |
| 7 | Catalogue : pages de catégorie, de type, de secteur ; filtres client (secteur, design, tags) dans l'URL ; recherche | `frontend-dev` | 3, 6 | `feat/catalogue-filtres` | parcours Playwright vert, tous les états de `angular-sidy` §4 (vide, aucun résultat), canonique sans paramètres |
| 8 | Page de détail : aperçu, sélecteur de variante (cookie), code, copier, télécharger, réglages | `frontend-dev` | 3, 6 | `feat/detail-ressource` | flux de `docs/flows/detail-ressource-variantes.md` couvert par Playwright, copie et zips vérifiés dans les deux variantes sur 3 ressources |
| 9 | Accueil et motion | `frontend-dev` | 1, 7 | `feat/accueil-motion` | budget JS tenu, LCP mobile ≤ 2,5 s, `prefers-reduced-motion` respecté |
| 10 | README, Démarrer (prérequis par variante), Contribuer (format du registre, deux variantes) | `documentaliste` | 4 à 9 | `docs/readme-contribuer` | un contributeur ajoute une ressource sans aide |

Les lots 0 et 1 tournent en parallèle. 7 et 8 peuvent avancer en parallèle après 3 et 6. Aucun agent de la chaîne ne relit le code Angular (`reviewer` et `security-reviewer` portent sur Java / back-end) : la relecture repose sur Sidy et sur `angular-sidy` §13.

## 4. Contrats

Pas d'API : les contrats sont le format du registre, les routes et les fichiers servis.

- **Métadonnées** : `MetaRessource`, `MetaDesign`, `Dependances` de l'[ADR 0004](../adr/0004-taxonomie-routes-registre.md), décision 2. Toute évolution du format incrémente `schema`.
- **Arborescence d'une ressource** : ADR 0002, décision 3.
- **Thème Tailwind** : `ngshelf-theme.css`, unique pour toutes les ressources, table token ↔ utilitaire fixée par le designer (annexe du contrat).
- **Routes** : ADR 0004, décision 3. Paramètres de filtre : `secteur`, `design`, `tag`, `q` (valeurs = slugs), jamais indexés.
- **Fichiers statiques par ressource** : `/<categorie>/<type>/<slug>/index.html`, `/apercu/<slug>/index.html`, `/telechargements/<slug>-tailwind.zip`, `/telechargements/<slug>-css.zip`, `/r/<slug>.json`, `/r/<slug>-css.json`, `/code/<slug>-css.html` (fragment). Noms exacts confirmés au lot 4.
- **Messages iframe** (site vers aperçu) : `{ type: 'reglages', design, mode, valeurs }` ; (aperçu vers site) : `{ type: 'pret' }`, `{ type: 'hauteur', px }`. Forme finale fixée au spike.
- **Config du site** (`core/config/site.config.ts`) : nom, URL de production (depuis l'environnement), dépôt GitHub, `developpePar: { nom, url }`, `reseaux: { reseau, url, libelle }[]` (icônes Phosphor). Seule source pour le footer, les mentions légales et le `sameAs` du JSON-LD.

## 6. Points d'attention

- **Sécurité** : du code contribué s'exécute sur le site. Aperçu de détail en iframe `sandbox="allow-scripts"`, CSP dans `_headers`, relecture obligatoire de chaque PR qui touche `registry/` (deux variantes). Aucun secret côté front.
- **Persistance** : cookies fonctionnels seulement (`ngs_variante`, et le mode de l'aperçu s'il est gardé) ; jamais `localStorage`. La politique cookies le dit en une ligne ; pas de bandeau.
- **Tailwind sous Shadow DOM** : `@property` inopérant, d'où la variante CSS dans les aperçus en page (ADR 0003).
- **Hébergement** : ≈ 7 fichiers par ressource, limite pratique ≈ 2 800 ressources sur Cloudflare Pages gratuit.
- **i18n** : marquer les textes `i18n` dès le socle coûte peu ; ne pas le faire rend l'anglais plus cher.
- **`angular-sidy` écrit pour Angular 21 et Netlify** : le projet part en 22 et sur Cloudflare, écarts assumés, le reste du skill s'applique.
- **Brief** : `design/brief.md` dit Angular 21 ; le designer le reporte en 22 dans `HANDOFF.md`.

## 7. Risques et questions ouvertes

- Double écriture du style (option 3) : coût réel à mesurer sur les 6 ressources du lot 6 ; décision de bascule vers la compilation à la fin du lot 4.
- Stabilité des captures visuelles en CI (polices, anticrénelage) : seuil à régler au lot 5.
- Utilitaires de densité `@utility … --value()` : couverture à confirmer au spike.
- Splash et LCP sur page prérendue : mesure du spike, décide entre les deux options de l'ADR 0005.
- Grammaires Shiki `angular-ts` / `angular-html` et compatibilité du CLI shadcn avec Angular : spike.
- En attente de Sidy : informations des mentions légales (avant le lot 3), création du dépôt GitHub, format de distribution (ADR 0002, décision 5), aperçus (ADR 0003), filtres côté client et champ `dependances` (ADR 0004).

## 8. Prompts prêts à donner

**Lot 0** — « Utilise l'agent frontend-dev pour le spike technique du catalogue, branche `core/spike-registre-variantes`, PR vers `dev`. Lis `docs/plans/catalogue-arbitrage-design.md`, les ADR 0001 à 0005 et `design/design-system/contrat-tokens.css`. Construis un workspace Angular 22 jetable avec deux apps (site, apercus) et un registre de 2 ressources (interrupteur, carte) en deux variantes. Vérifie et mesure : prérendu de `/<categorie>/<type>/<slug>` via `getPrerenderParams` ; pont `@theme inline` et utilitaires de densité `@utility` ; contrôles d'équivalence de structure et visuel Playwright ; sortie de l'option 1 (variante CSS compilée par Tailwind) pour comparaison ; aperçu Shadow DOM en variante CSS et iframe en variante Tailwind ; Shiki ; zip au build ; `withViewTransitions({ skipInitialTransition: true })` avec hydratation et saut sur changement de paramètres ; LCP avec splash ; test du CLI shadcn sur un projet Angular 22. Critère de fin : aperçu Cloudflare déployé, tableau des mesures et sortie CSS compilée dans la PR. »

**Lot 1** — « Utilise l'agent designer pour compléter le design system et la maquette du catalogue dans `design/`. Lis les ADR 0002, 0004 et 0005. Ajoute : l'annexe Tailwind du contrat de tokens (table token ↔ utilitaire, liste des utilitaires de densité) ; le vocabulaire des types et secteurs (proposition de l'ADR 0004, libellés en français) ; les pages de type et de secteur et les filtres client ; le sélecteur Tailwind | CSS de la fiche ; la forme du splash (deux options de l'ADR 0005) ; les durées et courbes des transitions de sortie et d'entrée, élément partagé oui ou non ; le footer avec réseaux sociaux et « Développé par ». Mets à jour `HANDOFF.md` (Angular 22). Critère de fin : maquette validée par Sidy. »

**Lot 3** — « Utilise l'agent frontend-dev pour le socle du site, branche `core/socle-site`, PR vers `dev`. Suis `angular-sidy` (setup, alias, lazy, SEO, pages légales, 404, splash), avec Angular 22, prérendu `outputMode: "static"`, Tailwind v4, `lang="fr"` et textes marqués `i18n`. Routes générées depuis `registry/taxonomie/` (ADR 0004). `provideRouter` avec `withViewTransitions` selon l'ADR 0005. Config centrale `core/config/site.config.ts` lue par le footer. `public/_headers` et `_redirects` pour Cloudflare Pages. Critère de fin : `ng build` sans erreur, un chunk lazy par feature, Lighthouse SEO 100, Playwright des transitions vert. »

**Lot 4** — « Utilise l'agent frontend-dev pour le pipeline du registre, branche `core/pipeline-registre`, PR vers `dev`. Lis les ADR 0002 et 0004. Script Node de build : validation du schéma et de la taxonomie, refus d'un champ `dependances` non vide, index par catégorie, code coloré Shiki (variante Tailwind dans la page, fragment pour la variante CSS), zips `-tailwind` et `-css`, JSON de registre (`<slug>`, `<slug>-css`, `ngshelf-theme`), `sitemap.xml`, `_redirects` depuis `anciensChemins`, lint de style des deux variantes, contrôles d'équivalence. Critère de fin : chaque cas d'échec de l'ADR 0004 a un test qui fait échouer la CI ; sorties générées pour 2 ressources ; avis option 1 / option 3 dans la PR. »

**Lot 5** — « Utilise l'agent frontend-dev pour la CI, branche `ci/build-registre-deploiement`, PR vers `dev` : workflow GitHub Actions qui lance validation, lint, équivalence, build et Playwright, puis le déploiement Cloudflare Pages (secrets dans GitHub, jamais dans le dépôt). Copie `conventions.yml` et `check-conventions.mjs` de `git-sidy`. Critère de fin : une PR qui casse l'équivalence est rouge, une PR saine déploie un aperçu. »

**Lot 6** — « Utilise l'agent frontend-dev pour porter dans `registry/` les 6 ressources et les 3 designs de `design/maquette/js/registre.js`, branche `feat/ressources-provisoires`. Variante CSS reprise de la maquette, variante Tailwind écrite avec le pont `@theme`, `.ts` commun, `statut: 'provisoire'`. Critère de fin : validation et équivalence vertes pour les 9 entrées. »

**Lot 7** — « Utilise l'agent frontend-dev pour le catalogue, branche `feat/catalogue-filtres`. Pages prérendues de catégorie, type et secteur (ADR 0004), filtres client secteur, design, tag et recherche dans les paramètres d'URL, index lazy par catégorie, canonique sans paramètres, tous les états de `angular-sidy` §4. Critère de fin : parcours Playwright vert. »

**Lot 8** — « Utilise l'agent frontend-dev pour la page de détail, branche `feat/detail-ressource`. Suis `docs/flows/detail-ressource-variantes.md` et les ADR 0002 et 0003 : aperçu iframe, sélecteur Tailwind | CSS en cookie `ngs_variante`, code, copier, copier avec mes réglages, zips. Critère de fin : flux nominal et cas d'erreur couverts par Playwright sur 3 ressources, dans les deux variantes. »

**Lot 9** — « Utilise l'agent frontend-dev pour l'accueil et sa motion, branche `feat/accueil-motion`, selon `DESIGN.md` et `HANDOFF.md` ; GSAP et Lenis dans `afterNextRender`, accueil seulement. Critère de fin : LCP mobile ≤ 2,5 s, budget JS tenu, mouvement réduit respecté. »

**Lot 10** — « Utilise l'agent documentaliste pour le README, la page Démarrer et le guide Contribuer, branche `docs/readme-contribuer` : prérequis de chaque variante, import de `ngshelf-theme.css`, format du registre et taxonomie. Critère de fin : un contributeur ajoute une ressource sans aide. »

## 9. Historique

- 2026-11-26 : création, arbitrage des 17 questions de l'étape 1 du designer.
- 2026-11-26 : passage en plan d'exécution après les choix de Sidy (B avec le réglage de C, français en v1, MIT, ressources provisoires, Angular 22). Ajout des deux variantes Tailwind / CSS (ADR 0002 révisé), de la taxonomie, du modèle du registre et des routes (ADR 0004), du splash et des View Transitions (ADR 0005), du champ réservé `dependances`, de la config centrale du footer. ADR 0003 révisé (variante rendue par type d'aperçu). Lots renumérotés : CI et portage des ressources deviennent des lots à part.
- 2026-11-26 : Sidy valide deux sources testées en CI, l'URL `/<categorie>/<type>/<slug>`, le splash plafonné ou non masquant selon le LCP, le vocabulaire et le libellé « Secteur », Cloudflare Pages ; ADR 0001, 0002 (décisions 1 à 4), 0004 et 0005 passés en `accepté`. Réseaux du footer fournis (valeurs non recopiées ici).
- 2026-11-27 : arbitrage des contradictions du HANDOFF (`docs/plans/arbitrage-contradictions-handoff.md`, ADR 0007 à 0013 proposés). Périmés après validation de Sidy : « 6 à 8 ressources » (10 + 3 designs), « mode sombre hors périmètre » (inclus), Q13 icônes (sprite), Q14 GSAP et Lenis (accueil, À propos, catalogue, fiche), prompt du lot 6 (10 ressources), messages d'iframe du §4 (ADR 0010), hébergeur (ADR 0013). Corps non réécrit.

## Annexe — arbitrage initial des questions du designer (mis à jour)

- **Q1 concept** : B avec le réglage de C, validé.
- **Q4 langue** : français en v1 (validé, conforme à `angular-sidy`), anglais plus tard (préparation : ADR 0001, 0004).
- **Q8 tokens** : contrat `--ngs-*` commun aux deux variantes (ADR 0002, décision 2).
- **Q9 téléchargement** : copier + un zip par variante, JSON de registre pour un futur CLI, schematics écartés.
- **Q10 licence** : MIT, validé.
- **Q11 pages** : accueil ; catégories, types et secteurs prérendus ; détail `/<categorie>/<type>/<slug>` ; Démarrer ; Contribuer ; Licence ; mentions légales, politique de confidentialité et cookies ; 404 ; `/apercu/<slug>` en `noindex`.
- **Q12 mode sombre** : site clair en v1, blocs de code sombres, bascule clair / sombre dans l'aperçu ; tokens du site sémantiques pour un mode sombre ultérieur.
- **Q13 icônes** : Phosphor via `@ng-icons/phosphor-icons` sur le site ; aucune bibliothèque d'icônes dans les ressources.
- **Q14 Three.js, Lenis, GSAP** : pas de Three.js (concept A non retenu) ; Lenis et GSAP sur l'accueil seulement ; jamais GSAP dans une ressource.
- **Q16 maquette** : HTML/CSS.
- **Q17 Git** : dépôt public unique, `main` en production, `dev` par défaut et cible des PR ; protection de `main` ; conventions `git-sidy` en CI. Le dépôt n'est pas encore initialisé (constaté le 2026-11-26).