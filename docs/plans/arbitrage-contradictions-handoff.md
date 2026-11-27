# Arbitrage des contradictions de `design/HANDOFF.md` section 13

Document de travail de l'architecte, 2026-11-27. **Rien n'est accepté** : chaque décision structurante a un ADR `proposé` (0007 à 0013). Ce document dit ce que je recommande ; la section 3 liste ce qui demande le choix de Sidy. Aucun fichier de `design/`, `DESIGN.md` ou du code n'a été modifié.

Sources lues : `design/HANDOFF.md`, `DESIGN.md`, plan `docs/plans/catalogue-arbitrage-design.md`, ADR 0001 à 0006, maquette (`design/maquette/`), `ngshelf-frontend/` (branche `feat/catalogue-filtres`, 43 commits : `public/_headers`, `public/theme-init.js`, `src/styles/`, `registry/`, `scripts/registre/`, routes, `app.config.ts`). Vérifications web du 2026-11-27 : voir « Sources » en fin de document.

## 1. Synthèse

| # | Point | Recommandation | ADR | Validation Sidy |
| --- | --- | --- | --- | --- |
| 1 | Nombre de ressources | **10 ressources + 3 designs** en v1 (la maquette et `registry/` du front). Le « 6 à 8 » du plan et le « 5 + 1 » de `DESIGN.md` sont périmés | 0007 | oui (rapide) |
| 2 | Mode sombre | **Inclus en v1** (déjà livré dans le site et le front) ; le plan est périmé | 0012 | oui |
| 3 | GSAP / Lenis : périmètre | GSAP : accueil, À propos, catalogue, fiche. Lenis : accueil et À propos. Chunks lazy, jamais dans une ressource | 0011 | non (suit `DESIGN.md`) |
| 4 | `meta.ts` ou `meta.json` | **`meta.json`** (déjà en place) ; l'ADR 0002 et l'ADR 0004 sont corrigés par renvoi | 0007 | non |
| 5 | Densité : `@utility` ou `--spacing-ngs-N` | **Garder le pont `--spacing-ngs-N`** (couvre tous les utilitaires d'espacement) ; passer à `rem` à étudier | 0008 | non |
| 6 | Icônes | **Sprite SVG** (déjà en place), pas `@ng-icons` | 0012 | non |
| 7 | `?c=` ou chemins prérendus | **Les deux, comme dans le front** : chemins prérendus indexés ; `/catalogue?c=` = vue filtrée, `noindex`, canonique vers le chemin | 0012 | non |
| 8 | Transitions de page | **View Transitions du router seulement** ; pas de transitions entre documents ; **pas de repli GSAP** (voile) | 0011 | oui |
| 9 | Sélecteur sombre des ressources | **`.dark`** dans le code livré **et** dans l'iframe d'aperçu ; `.ngs-sombre` reste interne au site | 0008 | oui |
| 10 | Contenu des zips | **`ngshelf-theme.css` (pont + valeurs par défaut) et `tokens.css` dans les deux zips** | 0008 | oui |
| 11 | Scripts de thème et splash en ligne | **Aucun script en ligne** : `theme-init.js` externe (à compléter) ; le splash n'a **pas** de script d'amorçage, il est piloté par Angular + filet CSS | 0009 | non (suit la CSP) |
| 12 | `postMessage` de l'aperçu | Iframe `sandbox="allow-scripts"` sur `/apercu/<slug>`, `targetOrigin '*'` imposé par l'origine opaque, **contrôle de `source`, d'origine, de forme et liste blanche de clés** | 0010 | non |
| 13 | Champ `motion`, `dependances` | `motion` remplace `animee` dans `meta.json` ; `dependances` vide obligatoire confirmé | 0007 | `dependances` : oui |
| 14 | ADR 0003, ADR 0002 décision 5 | **Accepter** 0003 (détail en iframe ; Shadow DOM de la grille confirmé par mesure) et confirmer « copier + zips » | — | oui |
| 15 | Bouton « Réduire les animations » | **Après la v1** ; `MotionService` unique dès maintenant | 0011 | oui |
| 16 | GSAP, Lenis, polices : CDN ou npm | **npm, versions exactes, import dynamique** ; polices auto-hébergées ; Tailwind compilé | 0009 | non |
| 17 | Hébergement (message de Sidy) | **Cloudflare** ; Netlify gratuit trop limité ; choisir Pages ou Workers Static Assets au lot 5 | 0013 | oui |

## 2. Détail de chaque point

### 1. Nombre de ressources

- **Sources** : plan `:19` (« 6 à 8 »), plan lot 6 `:44` (« 6 ressources et 3 designs »), `DESIGN.md:363-367` (5 composants + 1 bloc), `design/maquette/js/registre.js` (10 slugs : lignes 43, 170, 515, 624, 758, 945, 1047, 1186, 1308, 1502), `ngshelf-frontend/registry/` (7 composants, 3 blocs, 3 designs, **seulement des `meta.json`** : le code n'est pas encore porté).
- **Options** : (A) 6 comme prévu ; (B) 10 comme la maquette ; (C) 6 d'abord, 4 ensuite.
- **Recommandation : B**, porté en deux vagues dans le lot 6 (C comme ordre de travail, pas comme périmètre). Raisons : la maquette affiche des compteurs « tirés du registre » (aucun chiffre inventé) ; l'accueil et « À propos » montrent de vraies pièces (carte de séjour, calendrier, notifications, hero, navbar) ; les 10 `meta.json` existent déjà et passent la validation. Le « 6 à 8 » n'était pas une décision d'ADR, seulement une estimation du plan. Coût : 10 ressources x 2 variantes ; les deux variantes existent déjà dans la maquette (CSS et table `tw`).
- **Front** : rien à changer côté métadonnées. Lot 6 : porter les 10 (vague 1 : interrupteur, calendrier, curseur, champ-email, notifications, questions-frequentes ; vague 2 : boutons, carte-sejour, navbar-restaurant, hero-restaurant).
- **Maquette / DESIGN.md** : corriger `DESIGN.md:363-367` (5 + 1 devient 7 composants + 3 blocs).

### 2. Mode sombre

- **Sources** : plan `:9` (hors périmètre), Q12 `:119` (clair en v1) ; `DESIGN.md` v0.3 (livré) ; front : `public/theme-init.js`, `src/styles/tokens.css:215-230` (`[data-theme="sombre"]`), `ThemeService`, `theme-menu.component`.
- **Options** : (A) retirer le sombre pour suivre le plan ; (B) le garder.
- **Recommandation : B.** Il est livré, contrasté AA (`DESIGN.md:96-149`) et codé dans le front ; le retirer coûterait plus que le garder. Le plan est plus ancien. Conséquences à porter : cookie fonctionnel `ngs_theme` à citer dans la politique cookies (le plan ne nomme que `ngs_variante`), logo sombre (ADR 0006).
- **Front** : `theme-init.js` ne met pas à jour `<meta name="theme-color">` (la maquette et HANDOFF §9 le font) : à ajouter.
- **Plan** : Q12 et « Hors périmètre » corrigés par la ligne d'historique.

### 3. GSAP et Lenis : périmètre

- **Sources** : plan Q14 `:121` et lot 9 (« accueil seulement ») ; ADR 0005 décision 2 (« Lenis (accueil seulement) ») ; `DESIGN.md:270, 315`.
- **Recommandation** : `DESIGN.md` fait foi (plus récent). GSAP : accueil, À propos, catalogue (Flip), fiche. Lenis : accueil et À propos, **une instance** créée dans `afterNextRender`, détruite dans `DestroyRef`, arrêtée avant une transition de page. Un chargeur unique `chargerGsap()` mémorisé (un seul `registerPlugin`), import dynamique, jamais `gsap/all`. Aucune ressource n'importe GSAP (ADR 0002).
- **Front** : rien d'installé aujourd'hui ; budget initial à aligner (`angular.json` : warning 500 kB, HANDOFF : 450 Ko).

### 4. `meta.ts` ou `meta.json`

- **Sources** : ADR 0002 « Organisation d'une ressource » (`meta.ts`), ADR 0004 décision 2 (« fichier `meta.ts` typé ») ; front : 13 `meta.json` et `scripts/registre/valider.ts`.
- **Options** : (A) `meta.ts` ; (B) `meta.json` validé par script.
- **Recommandation : B.** `meta.ts` est du code exécuté par le build : une PR de contributeur pourrait y mettre n'importe quoi, ce qui pèse sur la sécurité d'un dépôt qui accepte des contributions externes. Un JSON se lit sans l'exécuter. La validation de forme est faite par `valider.ts` (types TypeScript partagés `MetaRessource`). Option : publier un JSON Schema pour l'autocomplétion éditeur, plus tard.
- **ADR** : ligne de renvoi dans 0002 et 0004, sans réécriture.

### 5. Densité

- **Sources** : ADR 0002 décision 2 (`@utility p-ngs-* … --value(integer)`, « liste fermée fixée dans le spike ») ; front : `src/styles/contrat/ngshelf-theme.css` (16 variables `--spacing-ngs-1` à `-16` dans `@theme inline`) ; maquette : `registre.js` utilise `h-ngs-7`, `gap-ngs-2`, `translate-x-ngs-5`, `max(44px, var(--spacing-ngs-12))`.
- **Options** : (A) `@utility` par propriété ; (B) pont `--spacing-ngs-N`.
- **Recommandation : B.** Dans Tailwind v4 le namespace `--spacing-*` génère d'un coup tous les utilitaires d'espacement (`p`, `m`, `gap`, `h`, `w`, `size`, `translate`, `inset`…) ; avec `@utility` il faut une règle par propriété, et la « liste fermée » est un risque d'oubli (ex. `translate-x`). Coût de B : 16 pas fixes (pas de `p-ngs-17`), acceptable pour un contrat à 12 tokens. À valider au premier test d'équivalence (le spike n'a pas eu lieu).
- **Piste, non tranchée** : écrire les pas en `rem` (`calc(var(--ngs-density) * .25rem * N)`) pour suivre la taille de police du navigateur (accessibilité) ; à demander au designer car le rendu change pour les utilisateurs qui agrandissent le texte, pas pour les autres.

### 6. Icônes

- **Sources** : plan Q13 `:120` (`@ng-icons/phosphor-icons`), plan §4 « Config du site » ; `DESIGN.md` et front : `public/icons/sprite.svg`, `IconeComponent`, `NOMS_ICONES` typé avec test liste = sprite.
- **Recommandation : sprite.** Une requête, même origine (`img-src 'self'` suffit), rien dans le JS initial, rendu prérendu correct (`<svg><use>`), nom typé. Une dépendance de plus (`@ng-icons`) ajouterait des icônes au JS et un maillon d'approvisionnement sans bénéfice. Les ressources gardent leurs SVG en ligne (ADR 0002).
- **Plan** : Q13 et §4 corrigés par renvoi.

### 7. Catalogue : `?c=` ou chemins

- **Sources** : maquette `catalogue.js` (`?c=`) ; ADR 0004 décision 3 (chemins prérendus, filtres combinés en paramètres, canonique sans paramètres) ; front : route `catalogue` + `/composants`, `/blocs/:type`, `/secteurs/:secteur` prérendus, `filtres.ts:64` (`c`), `IndexationService` (noindex + canonique).
- **Recommandation** : **il n'y a pas de contradiction réelle, le front fait déjà les deux.** `/catalogue` est l'explorateur global, `?c=` y sert de facette interactive (Flip fluide, pas de navigation) ; la page de chemin (`/blocs`) est l'URL indexée ; `IndexationService` met `noindex` et le canonique sur le chemin quand des paramètres existent. Il manque seulement la ligne `/catalogue` dans le tableau de routes de l'ADR 0004 (renvoi dans 0012). Vérifier au lot 7 que `/catalogue?c=blocs` a bien pour canonique `/blocs`.

### 8. Transitions de page (étude « les deux »)

- **Sources** : maquette `index.html:68-80` (`@view-transition { navigation: auto }`, noms `root`, `entete`) ; ADR 0005 décision 2 et HANDOFF §8.3 (router, `contenu`, « aucun repli ») ; HANDOFF §13 (voile GSAP `app.js:284-298`). Front : `app.config.ts` n'a **pas encore** `withViewTransitions`.
- **Ce que fait chaque mécanisme** :
  - *Même document (router)* : toute navigation interne de l'app hydratée (`routerLink`, `router.navigate`, retour arrière entre entrées créées par `pushState`) = `history.pushState`, donc **aucun chargement de document**. Seul ce cas existe pour 99 % des navigations.
  - *Entre documents (`@view-transition`)* : ne s'applique qu'à un **vrai chargement de document de même origine** déclenché par la page (lien sans `routerLink`, retour arrière vers une entrée d'un autre document, redirection interne). Ne s'applique pas au rechargement, ni à l'arrivée depuis un site externe (non même origine), ni au premier chargement. La prise en charge de la saisie dans la barre d'adresse est une supposition non vérifiée.
- **Quand les deux s'activeraient sur la même navigation** : jamais, une navigation est soit `pushState`, soit un chargement de document. **Le vrai conflit est ailleurs** : (1) les deux utilisent des pseudo-éléments `::view-transition-*(root)` ; si la règle `root` de la maquette est conservée, elle anime aussi la page entière lors d'une transition du router (qui capture `root` par défaut) et fait bouger l'en-tête, contre HANDOFF §8.3 ; (2) un chargement de document déclenche le splash plein écran : l'entrée de 300 ms jouerait sur le splash, puis le splash se rejouerait ; (3) `skipInitialTransition` ne couvre que le router ; (4) deux jeux de CSS et de tests (`pageswap`/`pagereveal`, `reducedMotion`) pour un cas qui se produit presque jamais dans une SPA.
- **Navigateurs** (Baseline) : même document : Chrome 111, Safari 18, **Firefox 144 (octobre 2025)**, donc tous les navigateurs courants en novembre 2026. Entre documents : Chrome 126 et Safari 18.2, **pas Firefox** (supposition issue de la doc web.dev lue, à recontrôler) : un comportement différent selon le navigateur.
- **Options** : (A) router seul ; (B) router + entre documents ; (C) entre documents seul (la maquette).
- **Recommandation : A.** C est impossible : une SPA hydratée ne recharge pas de document. B ajoute des cas de conflit pour un gain quasi nul. Sans support, la navigation se fait sans animation (amélioration progressive).
- **Repli GSAP (voile case → fiche)** : **ne pas porter.** Il contredit la règle de l'ADR 0005 (GSAP n'anime jamais une route), double le morph natif, et le public sans View Transitions est maintenant marginal. Si Sidy tient à un repli, il serait un ADR séparé.
- **Pièges d'implémentation à consigner** : la fiche doit avoir ses données (`ResolveFn`, déjà utilisé pour le titre) avant la capture, sinon le morph vise un cadre vide ; un seul `view-transition-name: apercu-ressource` à la fois ; `data-transition` posé par `onViewTransitionCreated` et retiré à `finished`.
- **Maquette** : conserver pour la démo ; ne rien porter. Retirer du HANDOFF §8.3 et §12 la mention « point ouvert » (tranchée).

### 9. Sélecteur sombre des ressources

- **Sources** : `contrat-tokens.css:45, 71, 97` (`.ngs-theme-X.ngs-sombre`) ; `contrat.js:85-95` (`.dark`, en-tête « ajoutez la classe .dark sur `<html>` ») ; `ressource.js:69` (`html.sombre`) ; site : `[data-theme="sombre"]`.
- **Ce sont quatre rôles différents** : (a) site : `data-theme="sombre"` (interne, inchangé) ; (b) source du contrat : classes `.ngs-theme-X.ngs-sombre` (mécanisme de choix de design du site, interne) ; (c) **code livré** : `tokens.css` ; (d) iframe d'aperçu.
- **Recommandation** : (c) `.dark` (convention de Tailwind et de shadcn, documentée dans le README : « ajoutez `.dark` sur `<html>` ou sur un parent »). (d) **l'aperçu doit charger exactement le `tokens.css` livré et basculer par `.dark`** : sinon l'aperçu prouve autre chose que ce qui est copié (c'est le but de l'ADR 0003). Les ressources n'utilisent jamais `dark:` : elles lisent des variables, donc aucune configuration `@custom-variant` n'est demandée à l'utilisateur. Le README explique en une ligne comment faire correspondre `.dark` à un autre sélecteur.
- **Front** : générateur de `tokens.css` à écrire (le front n'a pas `contrat.js`) avec `:root{…}` et `.dark{…}` ; l'app `apercus` bascule `.dark`.
- **Maquette** : `ressource.js:69` (`html.sombre`) devient `html.dark` ; `contrat-tokens.css` inchangé.

### 10. Contenu des zips

- **Sources** : ADR 0002 décision 5 (Tailwind : pas de `tokens.css` ; CSS : `tokens.css` « facultatif ») ; HANDOFF `:285-286` et `contrat.js` (`tokens.css` dans les deux ; pas de valeurs par défaut dans le pont).
- **Recommandation** : **les deux zips contiennent `tokens.css`** ; **`ngshelf-theme.css` contient pont + valeurs par défaut Planche clair** (comme dans le front). `tokens.css` est celui du design choisi (ou « avec mes réglages »), avec `:root` et `.dark`, importé **après** le pont : le même fichier sert aux deux variantes, le README le dit une fois. Sans `tokens.css`, tout marche en Planche clair ; sans lui il n'y a pas de mode sombre ni d'autre design, d'où sa présence systématique. Détail des fichiers : ADR 0008.
- **ADR 0002** : ligne de renvoi.

### 11. Scripts en ligne (thème, splash)

- **Sources** : maquette `index.html:11-28` ; HANDOFF §8.4, §9, §12 ; `public/_headers` (`script-src 'self'`) ; Angular, guide de sécurité (consulté 2026-11-27).
- **Options** : (A) fichiers externes ; (B) script en ligne + hash `sha256-…` dans la CSP ; (C) nonce.
  - **C est exclu** : un nonce doit être unique par réponse (doc Angular) ; le HTML prérendu est identique pour tous et mis en cache, il faudrait un calcul en bordure (Pages Functions ou Worker) qui supprime l'intérêt d'un site purement statique.
  - **B est possible** mais fragile : le hash doit être recalculé et réécrit dans `_headers` à chaque modification du script, et `security.autoCsp` d'Angular est documenté « non compatible avec le SSR » (compatibilité avec le prérendu statique non vérifiée).
  - **A** : un fichier même origine, aucune dépendance de build. Coût : une requête bloquante avant le premier rendu (≈ 0,5 Ko, HTTP/2, cache court). Acceptable.
- **Recommandation : A pour le thème** (déjà fait : `public/theme-init.js`, avec `Cache-Control` court). À **compléter** : `meta[name=theme-color]`. **Pour le splash : aucun script d'amorçage.** Le markup et le CSS du splash sont dans `index.html` (CSS en ligne autorisé : `style-src 'unsafe-inline'`, nécessaire de toute façon aux styles de composants d'Angular), la chorégraphie et le filet à 1,2 s sont en CSS, et la sortie anticipée est déclenchée par Angular après `whenStable()` en lisant `performance.getEntriesByName('first-paint')`. Le « `performance.now()` du `<head>` » de la maquette est inutile (`performance.now()` part déjà de la navigation) et la détection par `document.referrer` n'a plus d'objet (la navigation interne ne recharge pas le document). Le splash disparaît de lui-même si le JS échoue.
- **Garde-fou CI** : un test qui échoue si un fichier de `dist/` contient `<script>` sans `src` exécutable ou un attribut `on…=`. Le bloc `<script type="application/json" id="ng-state">` d'Angular est une donnée, pas un script exécuté. `withNoIncrementalHydration` et `inlineCritical: false` sont déjà en place pour cette raison : les garder.
- **Cohérence** : ADR 0005 dit « retrait sans fondu » en mouvement réduit, HANDOFF §8.2 ligne 1 dit « absent » ; recommandation : **absent** (cohérent avec la maquette).

### 12. `postMessage` de l'aperçu

- **Sources** : maquette `ressource.js:89-95, 108-120` (`ngs-tokens`, `ngs-pret`, `ngs-sortie`, `ngs-sortie-fin`, cible `'*'`, `srcdoc`) ; plan `:61` (`reglages`, `pret`, `hauteur`) ; ADR 0003 (« origine du site vérifiée », `event.source`) ; HANDOFF §12 et §7.3.
- **Faits** : une iframe `sandbox="allow-scripts"` sans `allow-same-origin` a une **origine opaque** (`"null"`). On ne peut donc pas viser une `targetOrigin` précise **depuis le parent** : `'*'` est le seul choix possible et il est acceptable parce que la fenêtre cible est celle de l'iframe elle-même et que rien de secret n'est envoyé (valeurs de design). Le risque réel est de **recevoir** des messages falsifiés.
- **Recommandation** :
  1. Production : `<iframe src="/apercu/<slug>" sandbox="allow-scripts" referrerpolicy="no-referrer" allow="" loading="lazy">`. Jamais `srcdoc` (hérite de la CSP du parent, contenu fabriqué par le client).
  2. Côté site : accepter un message seulement si `e.source === iframe.contentWindow` **et** `e.origin === 'null'` **et** la forme est valide.
  3. Côté aperçu : accepter seulement si `e.source === window.parent` **et** `e.origin` est dans la liste d'origines du site fournie au build (production, `localhost`, domaine d'aperçu de PR).
  4. Format : union discriminée typée, `{ v: 1, type: … }`, partagée par les deux apps. Noms retenus (ceux de la maquette, préfixés, `ngs-tokens` renommé) : `ngs-reglages` (site vers aperçu : `vars`, `mode`, `animations`), `ngs-sortie`, `ngs-pret`, `ngs-sortie-fin`, `ngs-hauteur` (aperçu vers site). Un `type` inconnu est ignoré.
  5. **Liste blanche de clés** : seules les 12 clés `--ngs-*` du contrat sont posées par `style.setProperty` ; valeur : chaîne courte (≤ 120 caractères) sans `url(`, `;`, `{`, `}`, `@`. `mode` ∈ {`clair`, `sombre`} ; `animations` booléen.
  6. **En-têtes pour `/apercu/*`** : une iframe à origine opaque charge les modules JS et les polices en mode CORS avec `Origin: null`. Il faut donc `Access-Control-Allow-Origin: *` sur les scripts et polices de l'app d'aperçus (ressources publiques, sans identifiants). **Je ne l'ai pas testé : à vérifier au premier test de l'aperçu.** Pour les scripts, placer l'app `apercus` sous `/apercu/` (`baseHref`) pour limiter la règle ; pour les polices, la règle `/fonts/*`.
  7. Défense en profondeur : en-tête `Content-Security-Policy: sandbox allow-scripts` sur `/apercu/*` (le document reste sandboxé même ouvert seul) ; CSP propre `script-src 'self'`. `!` retire un en-tête hérité d'une règle plus large (`_headers`).
- **Front** : iframe et app `apercus` pas encore créées (un seul projet dans `angular.json`).
- **Maquette** : `srcdoc` et `'*'` restent (montage de maquette) ; renommer `ngs-tokens` en `ngs-reglages` si le designer met à jour la maquette.

### 13. Champs `motion` et `dependances`

- **Sources** : `DESIGN.md:281-287` (forme de `motion`, « à reporter dans `MetaRessource` par l'architecte »), ADR 0004 (aucun `motion`), front : `MetaRessource.animee?`, `tailleCase?` (absents de l'ADR 0004).
- **Recommandation** : `motion: Motion | null` obligatoire dans `meta.json` (`null` si la ressource n'a pas d'animation) :

  ```ts
  type Moment = 'entree' | 'sortie' | 'survol' | 'ouverture' | 'changement';
  interface Motion {
    readonly resume: Texte;
    readonly moments: readonly Moment[];   // au moins un
    readonly technique: string;            // ex. « animate.enter / animate.leave, @keyframes CSS »
    readonly rejouer?: { readonly entree?: true; readonly sortie?: string }; // sortie = classe posée sur l'hôte
  }
  ```

  `animee` n'est plus saisi : il est **dérivé** (`motion !== null`) dans l'index généré, pour avoir une seule source. `tailleCase` est ajouté au modèle documenté. **Le schéma reste `schema: 1`** parce que rien n'est publié (le plan impose d'incrémenter dès qu'un format publié change). `dependances` : champ obligatoire et vide, validé par le build, déjà implémenté : **à confirmer** (ADR 0004 décision 4).
- **Front** : `ressource.model.ts`, `valider.ts` (+ cas : `moments` vide, `rejouer.sortie` sans `sortie` dans `moments`), `sorties.ts` (calcul de `animee`), 3 `meta.json` à migrer (`animee: true` vers `motion`).

### 14. ADR 0003 et décision 5 de l'ADR 0002

- **0003** : toujours `proposé`, « à confirmer par le spike ». Le lot 0 n'a pas laissé de trace et le front a avancé sans lui. Le détail en iframe sandbox est maintenant le choix de la maquette, de la sécurité (code contribué) et du plan. **Recommandation : accepter 0003**, en retenant le détail en iframe tel quel et en gardant le Shadow DOM de la grille « confirmé par mesure » aux lots 7 et 9 (le front rend aujourd'hui des vignettes **statiques** dans `planche` ; le Shadow DOM n'est pas codé). Si la mesure échoue, la grille garde des vignettes statiques : repli déjà prévu par l'ADR. À Sidy de valider.
- **0002 décision 5** : copier + zips au build + JSON de registre, CLI plus tard. **Recommandation : confirmer** ; c'est ce que le HANDOFF et la maquette implémentent.
- **0004 décisions 3 (filtres client) et 4 (`dependances`)** : implémentés dans le front, validés par la pratique ; **recommandation : confirmer**.

### 15. Bouton « Réduire les animations » et cookie `ngs_motion`

- **Sources** : `DESIGN.md:309` (proposé, non validé, non implémenté) ; HANDOFF §13 ligne 2 et §14 (« cookies : `ngs_theme`, `ngs_variante` seulement »).
- **Options** : (A) v1 : `prefers-reduced-motion` seul ; (B) interrupteur dans le menu du thème + cookie.
- **Recommandation : A pour la v1.** Le réglage système est la norme et respecte WCAG 2.3.3 ; la pause d'un contenu animé de plus de 5 s (WCAG 2.2.2) est couverte par le réglage « Animations » de la fiche et par le fait que le site n'a pas de mouvement automatique long. Coût de B : un troisième cookie, une deuxième voie de mouvement réduit à tenir synchronisée avec toutes les règles `@media (prefers-reduced-motion)` et `motion-safe:` du site, un état de plus à tester. Bon compromis : écrire dès maintenant **un seul `MotionService`** (`mouvementReduit` signal, lecture de la media query, suivi des changements) que GSAP, Lenis, les transitions de page et le splash lisent ; ajouter B plus tard revient alors à brancher un cookie sur ce service. Quand B viendra : réutiliser la classe `.ngs-sans-animation` déjà comprise par toutes les ressources plutôt que d'inventer `ngs-motion-reduite`.
- **Docs** : `DESIGN.md:309` passe de « proposé » à « reporté après la v1 ».

### 16. GSAP, Lenis, polices : CDN ou npm (avis de Sidy : npm)

**Sidy a raison.** Évaluation :

| Critère | CDN (maquette : jsDelivr) | npm bundlé, import dynamique |
| --- | --- | --- |
| CSP | `script-src` doit ajouter `https://cdn.jsdelivr.net` (domaine tiers, surface élargie), `connect-src`/`style-src` pour le CSS de Lenis | `script-src 'self'` inchangé |
| Intégrité | SRI à maintenir par version | Intégrité du paquet dans `package-lock.json` (sha512), `npm ci` |
| Chaîne d'approvisionnement | dépendance à la disponibilité et à l'intégrité d'un tiers à chaque visite (un CDN compromis ou un script servi différemment touche tous les visiteurs ; l'incident polyfill.io de 2024 est le cas d'école, **retour d'expérience cité de mémoire, non revérifié ici**) | risque ramené au moment du build : versions exactes, `npm audit`, relecture des mises à jour (Dependabot) |
| Cache | le cache partagé entre sites n'existe plus (navigateurs récents partitionnent le cache, supposition issue de la connaissance générale) : l'avantage historique du CDN a disparu ; DNS + TLS en plus | fichiers hachés, `Cache-Control: immutable` (déjà dans `_headers`), même connexion HTTP/2 |
| Poids | identique (≈ 65 Ko gzip mesurés) | identique ; **ne pas importer `gsap/all`**, importer les modules utilisés |
| Chargement | `<script>` bloquants dans la maquette | `await import()` dans `afterNextRender`, par feature : le prérendu et le LCP n'attendent rien ; l'intro de l'accueil attend de toute façon le splash (≥ 600 ms), ce qui masque le chargement du chunk |
| Prérendu | sans objet | l'import dynamique dans `afterNextRender` ne s'exécute jamais côté serveur ; les états cachés (`.ngs-motion`) sont posés par le script seulement (HANDOFF §8.5 règle 5) : le HTML prérendu est lisible sans JS |
| Licence | GSAP « Standard No Charge » (consultée 2026-11-27, mise à jour par GSAP le 2025-05-30) : gratuite, usage commercial couvert, plugins (SplitText…) inclus, interdit pour des outils visuels concurrents de Webflow ; la page ne tranche pas la **redistribution** : le site embarque GSAP dans son build, il ne le redistribue pas dans les zips (règle de l'ADR 0002 : aucune ressource n'importe GSAP). Lenis : MIT. |

- **Versions** (npm, 2026-11-27) : `gsap` 3.15.1 (identique à la maquette) ; `lenis` **1.3.29** (la maquette utilise 1.3.28 ; HANDOFF aussi) : figer exactement la version choisie après lecture de la note de version. `npm install --save-exact`, `.npmrc` `ignore-scripts=true` si le projet n'en a pas besoin.
- **Tailwind** : le chargeur navigateur `@tailwindcss/browser@4.3.5` est un outil de maquette (lit `tokens.css` par `fetch`, évalue du CSS à l'exécution). En production : `@tailwindcss/postcss` (déjà dans `.postcssrc.json`) ; l'app `apercus` a son propre build Tailwind ; le changement de design de l'aperçu passe par des variables CSS, sans compilation côté navigateur. Rien du chargeur n'est porté.
- **Polices** : Chivo et Chivo Mono en WOFF2 déjà dans `public/fonts/` (2 fichiers, `font-src 'self'`, préchargées avec `crossorigin`). À vérifier : `font-display`, repli de métriques calculées (CLS < 0,1) ; `Access-Control-Allow-Origin: *` sur `/fonts/*` pour l'aperçu en iframe opaque (point 12). Licence OFL à garder (`OFL-chivo.txt`, `NOTICE.txt`).
- **Pas de CDN ni de `preconnect` tiers** en production. Détail : ADR 0009.

### 17. Hébergement (message de Sidy) : Cloudflare Pages ou Netlify

- **Sources** : ADR 0001 (Cloudflare Pages) ; README du front (« Cloudflare Pages ») ; front : `public/_headers` (syntaxe Cloudflare, `!` pour retirer un en-tête), pas de `_redirects` ni de `netlify.toml`, `.github/workflows/ci.yml` **sans** étape de déploiement.
- **Comparaison** (pages consultées le 2026-11-27) :

  | | Cloudflare Pages (gratuit) | Netlify (gratuit) |
  | --- | --- | --- |
  | Quotas | 500 builds/mois, 20 000 fichiers, 25 MiB/fichier ; **aucune limite de bande passante indiquée** sur la page des limites | **300 crédits/mois** pour tout : 15 crédits par déploiement de production (≈ 20 déploiements), 20 crédits/Go de bande passante (≈ 15 Go si seule) ; aperçus de PR illimités |
  | En-têtes, redirections | `_headers` (100 règles, 2 000 caractères par ligne), `_redirects` (2 000 statiques) ; les règles qui correspondent **s'additionnent** (concaténation par virgule) ; `!` retire un en-tête | `_headers`, `_redirects` ou `netlify.toml` ; `!` : je n'ai pas vérifié, donc le fichier actuel pourrait demander un ajustement |
  | CSP, nonce | statique : pas de nonce par requête sans Worker | idem (fonctions edge payantes ou limitées) |
  | Aperçus de PR | oui (Pages), URL publiques par défaut | oui, illimités |
  | Statistiques | Web Analytics sans cookie (connaissance générale, à vérifier) | **non inclus dans le gratuit** |
  | Déjà fait dans le projet | `_headers`, README, ADR 0001 | rien (le skill `angular-sidy` décrit Netlify) |

- **Fait nouveau** : Cloudflare recommande désormais **Workers avec Static Assets** pour les nouveaux projets, Pages continuant de fonctionner ; je n'ai pas trouvé de date de fin de Pages (guide de migration officiel daté août 2026 dans un aperçu de la doc). `_headers` et `_redirects` existent aussi dans Static Assets (100 règles). Les limites de fichiers de Static Assets en gratuit sont à vérifier avant de choisir.
- **Recommandation : Cloudflare.** Le quota de crédits Netlify (≈ 20 déploiements de production par mois, ≈ 15 Go) est trop serré pour un catalogue qui déploie à chaque PR fusionnée et sert des zips ; Cloudflare convient mieux au projet et rien n'est à refaire. Choisir **Pages ou Workers Static Assets au lot 5** (CI), selon les limites vérifiées à ce moment-là. Garder `_headers` simple pour rester portable.
- **ADR** : nouvel ADR **0013 `proposé`** (hébergeur). L'ADR 0001 reçoit une ligne de renvoi, son corps n'est pas réécrit.

## 3. Décisions à faire valider par Sidy

Questions courtes, avec ma recommandation entre parenthèses.

1. Hébergeur : Cloudflare ? (oui ; Pages ou Static Assets tranché au lot 5.)
2. Garder 10 ressources + 3 designs en v1, au lieu de 6 à 8 ? (oui)
3. Garder le mode sombre en v1 ? (oui)
4. Transitions : router seulement, sans transitions entre documents ni repli GSAP voile ? (oui)
5. Sélecteur sombre du code livré : `.dark` ? (oui)
6. `tokens.css` dans les deux zips, `ngshelf-theme.css` avec valeurs par défaut ? (oui)
7. Bouton « Réduire les animations » et `ngs_motion` : après la v1 ? (oui)
8. Accepter l'ADR 0003 (iframe sandbox pour le détail, Shadow DOM de la grille confirmé par mesure) ? (oui)
9. Confirmer ADR 0002 décision 5 (copier + zips + JSON) et ADR 0004 décisions 3 (filtres client) et 4 (`dependances` vide) ? (oui)
10. Où versionner `docs/`, `design/` et `DESIGN.md` ? Ils sont à la racine, qui n'est pas un dépôt git (section 13, point 4). (les copier dans `ngshelf-frontend/` à la racine du dépôt GitHub après contrôle du poids : `design/` = 2,5 Mo, `docs/` = 128 Ko ; sinon un second dépôt. **Tant que ce n'est pas fait, mes fichiers ne sont pas versionnés et je n'ai ni branche ni PR à ouvrir.**)

Autres points de la section 13, sans choix à faire : #5 `og:image` : le designer exporte un PNG 1200x630 depuis `ngshelf-clair.svg` dans `public/` ; #9 mentions légales : informations à fournir par Sidy avant le lot 3 ; #10 pages sans maquette : au designer (404 et pages légales en cours) ; #12 nom en dur : tout passe par `site.config.ts` côté Angular ; #15 lot 0 : le spike n'a pas eu lieu, ses mesures (LCP avec splash, équivalence, Shiki) se font aux lots 3, 4, 5 et 9 ; #16 plafond du splash : mesurer en Lighthouse CI sur l'accueil prérendu, bascule vers l'option 2 de l'ADR 0005 si LCP mobile > 2,5 s ; #17 « À propos » : l'ajouter au lot 9 (accueil, motion et À propos). Contradictions mineures : `DESIGN.md:356` (règles de transition dans `components.css`) : en Angular, dans `styles.css` ; voile 550 ms ou 0,5 s : sans objet (non porté) ; deux lignes « 0.8 » du journal et « Angular 21 » du brief : corrections du designer ; `docs/diagrams/catalogue-architecture.md:3` : à mettre à jour après validation (les statuts changent).

## 4. Listes d'actions

### Designer (rien n'est exécuté ici)

- `DESIGN.md:363-367` : 7 composants + 3 blocs + 3 designs.
- `DESIGN.md` : mode sombre « livré » (le plan est corrigé de mon côté) ; transitions : router seulement ; supprimer ou marquer « maquette seulement » le repli GSAP (§ transitions, tableau 8.2 ligne 15) ; `DESIGN.md:309` : « Réduire les animations » reporté après la v1 ; `DESIGN.md:356` : règles de transition dans `styles.css` en Angular ; journal : une seule ligne 0.8.
- `HANDOFF.md` : §7.4 (zips : `tokens.css` dans les deux, pont avec valeurs par défaut) ; §7.3 et §12 (messages `ngs-reglages`, `ngs-sortie`, `ngs-pret`, `ngs-sortie-fin`, `ngs-hauteur`, `v: 1`, liste blanche) ; §8.3 et §13 (transitions tranchées) ; §8.4 et §9 (le splash n'a pas de script, `theme-init.js` seul, `theme-color` ; mouvement réduit : splash absent) ; §9 (sélecteur `.dark` pour le code livré) ; §10 (budget JS 450 Ko aligné sur `angular.json`) ; §13 : remplacer les lignes tranchées par un renvoi vers `docs/plans/arbitrage-contradictions-handoff.md`, une fois Sidy d'accord.
- Maquette : `ressource.js:69` `html.sombre` devient `html.dark` ; `contrat.js` inchangé (`.dark` déjà bon) ; renommer `ngs-tokens` en `ngs-reglages` (optionnel) ; fournir le PNG `og:image` ; décider du passage de la densité en `rem` (point 5) et le tester à 200 % de taille de texte.

### frontend-dev (lots du plan, après validation)

- Lot 3 : `provideRouter(…, withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated }))`, `MotionService` ; splash dans `index.html` (SVG + CSS, filet 1,2 s, `noscript`), sortie anticipée par Angular après `whenStable()` ; compléter `theme-init.js` (`theme-color`) ; test CI « aucun script en ligne » sur `dist/` ; `_headers` : règle `/apercu/*` (CSP `sandbox allow-scripts`, `!` pour remplacer la CSP du site) et `/fonts/*` (`Access-Control-Allow-Origin: *`).
- Lot 4 : générateur de `tokens.css` (`:root` + `.dark`), `ngshelf-theme.css` avec valeurs par défaut, zips avec les deux fichiers ; `motion` dans `ressource.model.ts`, `valider.ts`, `sorties.ts` (dérive `animee`) ; migrer les 3 `meta.json` animés.
- Lot 6 : porter les 10 ressources en deux vagues.
- Lots 7 à 9 : `chargerGsap()` mémorisé, `npm install --save-exact gsap lenis`, import dynamique dans `afterNextRender`, CSS de Lenis recopié dans `src/styles/`, `ScrollTrigger.refresh()` après polices et images ; vérifier `/catalogue?c=` (noindex, canonique) ; app `apercus` et protocole de l'ADR 0010 ; mesures LCP, Shadow DOM de la grille.
- Lot 5 : choisir Pages ou Static Assets après vérification des limites ; déploiement.

### À versionner (Sidy, puis documentaliste)

- Après validation : passer les ADR 0007 à 0013 en `accepté` (ou `remplacé`), mettre à jour `docs/diagrams/catalogue-architecture.md:3`, mettre le README du front en cohérence.

## Sources (consultées le 2026-11-27)

- Licence GSAP « Standard No Charge » : https://gsap.com/community/standard-license/ (officiel, page modifiée le 2025-05-30)
- Versions npm `gsap` 3.15.1 (mise à jour 2026-11-11), `lenis` 1.3.29 (2026-11-26, MIT), `@angular/core` 22.3.0, `@tailwindcss/postcss` 4.3.5 : `npm view` (officiel, registre npm)
- Angular, sécurité : CSP, nonce par requête, scripts en ligne, `autoCsp`, Trusted Types : https://angular.dev/best-practices/security (officiel)
- Limites Cloudflare Pages : https://developers.cloudflare.com/pages/platform/limits/ (officiel)
- `_headers` de Workers Static Assets (100 règles, `!`, concaténation) : https://developers.cloudflare.com/workers/static-assets/headers/ (officiel)
- Migration Pages vers Workers, recommandation de Workers pour les nouveaux projets : https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/ (officiel, résumé de recherche ; date de fin de Pages non trouvée)
- Tarifs Netlify gratuit (300 crédits) : https://www.netlify.com/pricing/ (officiel)
- Transitions « même document », Baseline Firefox 144 : https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available (officiel, cité par l'ADR 0005, 2025-10-16) ; prise en charge des transitions entre documents : non revérifiée dans cette passe.

## Historique

- 2026-11-27 : création (mission de Sidy : section 13 du HANDOFF).
