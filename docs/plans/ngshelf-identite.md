# Identité NgShelf : nom, préfixe, logo, splash, couleurs

Étude du 2026-11-27, **aucune modification faite** (code, maquette et design system intacts). Statut : **appliqué le 2026-11-27 selon l'ADR 0006** (document historique figé : il cite volontairement l'ancien nom et l'ancien préfixe ; la recommandation « logo sans pied » est remplacée par « pieds vides »). Avant : à trancher par Sidy, puis application par `designer`. Le projet n'est pas un dépôt git : aucune branche ni PR n'a été créée.

## 0. Constats de départ (à lire avant les choix)

1. **Le nom n'est pas « en un seul endroit »** (contrairement à ce que dit `DESIGN.md` ligne 3). L'ancien nom de travail est **« Gabarit »**. Seuls les `<span data-nom>` et le texte du splash sont remplacés au chargement par `GB.site.nom` (`js/app.js` ligne 24). Restent en dur : `<title>`, `<meta description>`, `aria-label` du logo, texte du pied de page, `sr-only` du splash, 3 textes de `textes.fr.js`, commentaires CSS/JS, ADR, plan.
2. **Description du logo à corriger.** Dans `ngshelf-v1-corrige.svg`, les lettres « n » et « g » ne sont **pas** bleu nuit : ce sont des **découpes transparentes (blanches sur fond blanc) dans deux tuiles carrées arrondies bleu nuit** `#191f42`. Le « g » a en plus un petit tracé plein pour son œil. L'étagère est un `rect` orange `#fd6437` (896×64, rx 32) ; les deux équerres sont les deux derniers tracés. `…-pieds-vides.svg` = mêmes tuiles et même planche, équerres en contour seul.
3. **Conséquence en mode sombre** : sur `#111113`, les tuiles `#191f42` valent **1,18:1** (invisibles) et les lettres découpées prennent la couleur du fond. Le logo actuel est inutilisable tel quel en sombre : il faut éclaircir les tuiles (voir 2).
4. Le fichier SVG fait 1536×1024 avec beaucoup de vide ; boîte réelle (mesurée au navigateur) : tuiles x 369,5 à 1168,3 ; planche x 320 à 1216, y 548 à 612 ; haut des tuiles y 236 ; équerres jusqu'à y 716.
5. Aucun favicon, aucune image sociale (`og:image`) n'existe aujourd'hui.

## 1. Renommage

### 1.1 Inventaire exact

Compté par recherche dans tout le projet (occurrences, hors `node_modules`).

**Ancien nom « Gabarit » / « gabarit »** : 61 + 18 occurrences, 21 fichiers.

| Fichier(s) | Lignes concernées | Nature |
| --- | --- | --- |
| `design/maquette/index.html` | 9 | titre, nom du splash, `aria-label`, pied (x2), texte de pied |
| `catalogue.html` | 10 | idem + `meta description` |
| `ressource.html` | 10 | idem |
| `a-propos.html` | 12 | idem + `lead` et rôle de Sidy |
| `js/textes.fr.js` | 3 | `code.variante.aide.tailwind`, `zip.installation.tailwind`, `apropos.qui.role` |
| `js/contrat.js` | 1 | commentaire « gabarit-theme.css » |
| `design-system/index.html` | 6 | titre « Gabarit (nom de travail) », marque, phrase « nom de travail » |
| `design-system/tokens.css`, `components.css`, `contrat-tokens.css`, `load.js` | 1 chacun | en-têtes, `console.error('[Gabarit] styles')` |
| `DESIGN.md` | 1 | `gabarit-theme.css` ligne 52 (et ligne 3 fausse sur « un seul endroit ») |
| `docs/adr/0002-…` | 3 | `gabarit-theme.css` (lignes 25, 106, +1) |
| `docs/plans/catalogue-arbitrage-design.md` | 5 | « nom de travail », `gabarit-theme.css`, question « nom du site » |
| `docs/diagrams/catalogue-architecture.md` | 2 | `gabarit-theme.css` |
| `design/brief.md` (2), `design/concepts.md` (4), `design/demos-concepts/*.html` (4 fichiers, 1 chacun) | 10 | **archives de la phase de choix du nom et des concepts** |

Déjà au bon nom : `design/README.md`, titre de `DESIGN.md`, `config.js` (`nom: 'NgShelf'`).

Noms de fichiers à renommer : `gabarit-theme.css` (fichier pont Tailwind, généré dans le zip : 22 mentions) devient `ngshelf-theme.css`. Le `<span data-nom>` des 4 emplacements de marque par page (splash, en-tête, tiroir mobile, pied) est déjà piloté par `config.js` mais la valeur de repli écrite dans le HTML doit aussi passer à « NgShelf » (prérendu, robots, JS coupé).

### 1.2 Le préfixe `gb`

Quatre usages distincts du même préfixe (occurrences, fichiers) :

| Famille | Exemples | Occ. | Fichiers | Public ? |
| --- | --- | --- | --- | --- |
| Tokens du contrat | `--gb-color-action`, `--gb-radius`, `--gb-density` (12 tokens, `.gb-theme-*`, `.gb-sombre`) | 444 | 20 | **Oui** : copiés dans le code de l'utilisateur et le zip |
| Utilitaires Tailwind du pont | `bg-gb-action`, `rounded-gb`, `p-gb-4`, `--color-gb-*`, `--radius-gb`, `--font-gb` | 230 (dont des variantes `-gb-` déjà comptées ci-dessus) | 6 | **Oui** (même raison) |
| Sélecteurs CSS / classes | `gb-btn`, `gb-icon`, `gb-splash`, `gb-case`… | 2 443 | 23 | Oui pour les classes des ressources dans `registre.js` (533) ; sinon site seulement |
| Espace de noms JS et divers | `window.GB` (456), `__gbDebut`, `gbStylesReady`, `_gbT`, `GbApercu` | 465 | 19 | Non |
| Cookies | `gb_theme` (16), `gb_variante` (11), `gb_motion` (1) | 28 | 14 | Visibles par l'utilisateur |

Pièges de remplacement mécanique : `rgb`, `srgb`, `rrggbb` (31 + 3 + 1 occurrences) contiennent « gb » et **ne doivent pas** être touchés ; les utilitaires Tailwind ont le préfixe au milieu (`text-gb-text`, `bg-gb-surface`) ; le contrat est lu par une expression régulière dans `contrat.js` ligne 16 (`/\.gb-theme-…/`) qui doit suivre.

**Options**

| | Contenu | Coût | Risque |
| --- | --- | --- | --- |
| P1. Ne pas renommer | `gb` reste partout | nul | « gb » ne veut plus rien dire ; chaque ressource copiée porte un préfixe sans rapport avec le produit ; renommer plus tard casse le code déjà copié par les utilisateurs |
| P2. Renommer le public seulement | tokens, utilitaires, cookies, fichier pont, classes des ressources | moyen | deux préfixes qui coexistent (`ngs-` public, `gb-` site) : source de confusion |
| P3. Tout renommer en une passe scriptée | les cinq familles | environ 3 400 remplacements, un seul commit, vérifiable par recherche (`gb` doit disparaître hors `rgb`) | une erreur de regex ; rien n'est publié donc rien ne casse chez un tiers |

**Recommandation : P3, maintenant**, avec le préfixe **`ngs`** (`--ngs-color-action`, `.ngs-btn`, `window.NGS`, `ngs_theme`, `bg-ngs-action`). Motif : le dépôt GitHub n'existe pas (`depot: null`), le catalogue n'est pas publié, le front Angular n'est pas écrit : c'est le moment le moins cher, et le préfixe fait partie du contrat public. `ng-` est écarté (préfixe réservé au framework Angular, et `design/brief.md` demande de ne pas se faire passer pour lui) ; `ns` est écarté (trop court, collisions fréquentes).
Méthode demandée au designer : remplacements ordonnés (cookies, `--gb-`, utilitaires `-gb-`, `gb-`, `GB.`, `__gb`), **liste d'exclusion `rgb|srgb|rrggbb`**, puis recherche `gb` résiduelle = 0, ouverture des 4 pages et de la page de design system dans le navigateur (console sans erreur, thème sombre, une ressource copiée en Tailwind et en CSS, zip généré).
Cookies : si la maquette n'a pas été partagée en ligne, renommer sans migration ; sinon lire l'ancien cookie en repli une fois (3 lignes dans le script en ligne).

### 1.3 Ce qu'il ne faut pas réécrire

- **ADR acceptés** (0001 à 0005) : on ne les réécrit pas. Un nouvel **ADR 0006 « Identité NgShelf »** (créé après validation par Sidy) porte la table `gb → ngs`, `gabarit-theme.css → ngshelf-theme.css`, et note dans l'ADR 0002 « nommage remplacé par 0006 » (ajout d'une ligne de statut, pas de réécriture du corps). Le plan `catalogue-arbitrage-design.md` est vivant : mise à jour directe + une ligne d'historique.
- **Archives** `design/brief.md`, `design/concepts.md`, `design/demos-concepts/` : conserver « Gabarit » (comparaisons historiques), ajouter une ligne d'en-tête « archive, ancien nom de travail ». Ne pas les compter dans la passe de renommage.
- `DESIGN.md` : corriger la ligne 3, les tableaux de marque (ligne 355) et splash (lignes 222, 233, 352), le nom du pont Tailwind.
- Les textes « Angular est une marque de Google LLC. NgShelf est un projet indépendant » restent ; vérifier que le nom « NgShelf » reste conforme à la règle du brief (« ng-X » accepté, pas « Angular X »).

## 2. Logo « sans pied »

« Sans pied » = tuiles + planche, sans les deux équerres. Les équerres ne sont utiles qu'en grande taille ; à 28 px de haut elles deviennent des taches.

**Assemblage vérifié** (rendu navigateur, clair et sombre, tailles 400, 140, 64, 32 px) :

1. Séparer le tracé composé en deux tuiles : couper la chaîne `d` du premier `<path>` à `zm677.83 237.31` ; la tuile du « g » repart de `M1126.27 538.3l` suivi du reste. La découpe du « n » et celle du « g » restent à l'intérieur de leur tuile (règle de remplissage par défaut : les lettres sont des trous).
2. Garder le petit tracé plein de l'œil du « g » (`M956.51 366.5…`), même couleur que les tuiles.
3. Supprimer les deux équerres. Garder le `rect` de l'étagère tel quel.
4. Recadrer : **`viewBox="320 236 896 376"`** (boîte exacte des tuiles et de la planche, rapport 2,38:1). Aucune marge dans le fichier ; la marge se règle en CSS.
5. Passer SVGO (précision 2) et contrôler l'œil : les arêtes sont tracées à la main (coins légèrement différents, nombres comme `17.930`), sans défaut visible jusqu'à 400 px. Pas de redessin nécessaire.

Squelette du fichier maître (les `d` viennent des étapes 1 et 2) :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="320 236 896 376" role="img" aria-label="NgShelf">
  <title>NgShelf</title>
  <g fill="var(--logo-tuile, #191f42)">
    <path id="tuile-n" d="…"/>
    <path id="tuile-g" d="…"/>
    <path id="oeil-g"  d="M956.51 366.5…"/>
  </g>
  <rect x="320" y="548" width="896" height="64" rx="32" fill="var(--logo-etagere, #fd6437)"/>
</svg>
```

**Fichiers livrables (dans `design/logo/`, originaux conservés)**

| Fichier | Usage | Couleurs |
| --- | --- | --- |
| `ngshelf.svg` (symbole `ngshelf-logo` ajouté au `sprite.svg`, appelé par `<use>`) | en-tête, tiroir mobile, pied de page, design system | tuiles = `var(--logo-tuile)`, planche = `var(--logo-etagere)` : suit le thème du site |
| `ngshelf-clair.svg`, `ngshelf-sombre.svg` | image autonome (README, Open Graph, partage) | clair `#191f42` ; sombre `#ededf0` ; planche `#fd6437` dans les deux |
| `favicon.svg` | onglet, signet | même dessin recentré dans un carré : **`viewBox="300 -44 936 936"`** (centre de la boîte = 768, 424) ; `@media (prefers-color-scheme: dark)` interne pour les tuiles `#ededf0` |
| `apple-touch-icon.png` 180×180, `icon-192.png`, `icon-512.png` | iOS et PWA éventuelle | fond blanc plein (pas de transparence), marge 12 % |

Valeurs de thème à ajouter dans `tokens.css` : `--logo-tuile: #191f42` (clair) / `#ededf0` (sombre) ; `--logo-etagere: #fd6437` (identique). **En sombre les tuiles s'éclaircissent** et les lettres, toujours découpées, laissent voir le fond `#111113` : l'identité reste lisible, tuile `#ededf0` sur `#111113` = **16,14:1**, sur surface `#1a1a1e` = 14,85:1. Les variables CSS traversent le `<use>` du sprite (héritage des propriétés personnalisées) : un seul symbole suffit. Dans un `<img>` autonome elles n'agissent pas : d'où les fichiers `-clair` et `-sombre`.

Tailles : en-tête 28 px de haut (largeur 67 px, tuile 20 px, lettre environ 12 px, lisible) ; pied 24 px ; favicon : lisible à 32 px, deux blocs sur une ligne à 16 px (acceptable, vérifier à l'œil). Zone de respect : 1/2 hauteur de tuile autour du logo.

**Lien avec le nom dans le texte.** Le logo ne contient que « ng » (pas « Shelf »). Options : L1 logo + texte « NgShelf » (Chivo 800, comme aujourd'hui) ; L2 logo seul avec `aria-label` ; L3 logo + « Shelf ». **Recommandation : L1** : le nom complet doit exister en texte (accessibilité, référencement, lisibilité par un visiteur qui ne lit pas « ng » comme un préfixe Angular) ; la redondance « ng NgShelf » se corrige en réduisant le logo à 24 px et en passant le texte en graisse 800 comme actuellement. À tester par le designer sur maquette avant validation ; L3 si le rendu est lourd.

Emplacements à remplacer : 4 par page (splash, en-tête, tiroir mobile, pied) × 4 pages + 1 dans `design-system/index.html` = 17 environ (3 marques par page hors splash : en-tête, tiroir, pied ; à recompter par le designer) ; styles `.gb-brand` et `.gb-brand__mark` (carré 2×2 aux quatre couleurs de famille) dans `components.css` (7 mentions) à supprimer ; la ligne « Marque » de `DESIGN.md` (355) à réécrire. Conséquence assumée : les quatre carrés de famille quittent la marque (ils restent dans les puces, badges et panneaux).

## 3. Splash animé

### 3.1 Existant (ADR 0005, accepté)

- Splash plein écran en CSS en ligne dans le `<head>` de chaque page (4 copies dans la maquette), logo = grille 2×2 de carrés de famille + nom Chivo 34 px, entrée 380 à 540 ms, retrait par `clip-path` de bas en haut en 320 ms, **minimum affiché 420 ms**, **plafond 1,2 s** (minuteur CSS `gb-splash-filet` + `setTimeout` dans `app.js` ligne 555).
- Premier chargement d'un document seulement : classe `gb-sans-splash` posée si le `referrer` est de même origine ; masqué par `<noscript>` et par `prefers-reduced-motion` (`display: none`).
- Sortie enchaînée avec l'intro de l'accueil (`GB.splashFini`, résolue 120 ms après le début de la sortie).
- Fond `#fff` / `#111113`, valeurs recopiées en dur dans le CSS critique (le splash apparaît avant `tokens.css`).
- Transitions de page (View Transitions, `skipInitialTransition: true`) : **sans lien** avec le splash, qui n'existe qu'au chargement d'un document.

### 3.2 Technique

| | Avantage | Coût |
| --- | --- | --- |
| **T1. SVG en ligne + `@keyframes` CSS** | disponible avant tout JS (c'est exigé par l'ADR : CSS en ligne, noscript, minuteur de sécurité) ; transform et opacity seulement, aucune bibliothèque ; identique en Angular (`index.html`) | scénario figé à l'écriture |
| T2. GSAP | séquençage fin | GSAP est chargé après le premier rendu (CDN) : le splash démarrerait trop tard ; ADR 0005 : « GSAP n'anime jamais » le chargement initial ; poids |
| T3. Lottie / SMIL | rien | dépendance, SMIL déprécié en pratique |

**Recommandation : T1.** GSAP reste réservé à l'intro de l'accueil, qui démarre à `splashFini`.

### 3.3 Scénario (« ranger deux tuiles sur une étagère »)

Logo en SVG en ligne, largeur `clamp(160px, 28vw, 260px)`, centré, sur le fond du thème (`#fff` / `#111113`). Chaque pièce a `transform-box: fill-box` et son origine en bas pour l'écrasement à l'impact.

| Étape | Début | Durée | Pièce | Mouvement | Courbe |
| --- | --- | --- | --- | --- | --- |
| 1. L'étagère se pose | 0 ms | 220 ms | planche orange | `scaleX(0.15 → 1)` depuis le centre + opacité 0 → 1 | `--ease-enter` `cubic-bezier(.22,1,.36,1)` |
| 2. La tuile « n » tombe | 100 ms | 380 ms | tuile n | `translateY(-48 % → 0)` (62 % du temps, chute accélérée `cubic-bezier(.5,0,.9,.4)`), impact : `scaleY(.94)`, rebond `translateY(-4 %)` à 78 %, retour à 0 | chute ease-in, rebond `--ease-out` |
| 3. La tuile « g » tombe | 220 ms | 380 ms | tuile g + œil | même mouvement, décalé de 120 ms | idem |
| 4. Repos | 600 ms | jusqu'à « app prête » | tout | statique | : |
| 5. Sortie (inchangée) | prêt, mais pas avant 600 ms | 320 ms | écran | retrait `clip-path` de bas en haut | `--ease-in-out` `cubic-bezier(.65,0,.35,1)` |
| 6. Intro de l'accueil | début de sortie + 120 ms | : | page | GSAP, inchangé (`splashFini`) | : |

Bilan : entrée terminée à 600 ms, sortie terminée à 920 ms au plus tôt, **plafond de 1,2 s conservé** (minuteur CSS et `setTimeout` inchangés). Seul changement de règle : le minimum affiché passe de 420 à 600 ms, pour que la chute des deux tuiles aille au bout (+180 ms perçus).

- **Mouvement réduit** : inchangé, splash **masqué** (`display: none`) comme aujourd'hui. Variante possible (logo fixe 300 ms puis retrait sans fondu) : non recommandée, elle rallonge sans apporter d'information.
- **Une seule fois** : on garde la règle de l'ADR 0005 (premier chargement d'un document, sans `referrer` interne). Pas de `sessionStorage` : un rechargement ou un nouvel onglet rejoue 0,9 s, ce qui reste court ; un drapeau de session ajouterait un état à gérer pour peu de gain.
- **Accessibilité** : conserver `role="status"` et le texte `sr-only` « Chargement de NgShelf » (`{nom}` de `textes.fr.js`) ; SVG `aria-hidden`, aucun clignotement.
- **Thème** : tuiles `#191f42` en clair, `#ededf0` en sombre, planche `#fd6437` ; le fond reste celui de la page (pas de splash bleu nuit plein écran : choc clair-sombre à la sortie, et ce serait déjà du réalignement des couleurs, voir 4).
- **Performance** : transform et opacité seulement, pas de `will-change`, SVG en ligne d'environ 2 ko par page (4 copies dans la maquette, une seule dans `index.html` Angular).
- **À mesurer par le spike** (condition de l'ADR 0005) : LCP mobile ≤ 2,5 s et Lighthouse performance ≥ 90 avec le nouveau minimum de 600 ms ; sinon passer à l'option 2 de l'ADR (splash non masquant).
- **Variante écartée** : le logo du splash qui rétrécit jusqu'à celui de l'en-tête (FLIP) : trop long pour le plafond de 1,2 s et dépend de la position mesurée après hydratation.
- **Variante de scénario** : tuiles glissant depuis les côtés au lieu de tomber (plus calme, moins « rangement ») ; lettres qui se glissent dans des tuiles vides (exige de sortir les lettres des tuiles, donc un SVG à plus de pièces et des lettres non transparentes). Non recommandées.

Aucun nouvel ADR n'est requis pour le splash : l'ADR 0005 laisse la forme, les durées et les courbes au `designer`. Seule la ligne « Splash » de `DESIGN.md` (222, 233, 352) et le minimum de 600 ms sont à mettre à jour.

## 4. Couleurs

### 4.1 Mesures (WCAG 2.x, rapport de contraste calculé par script)

| Paire | Rapport | Lecture |
| --- | --- | --- |
| bleu nuit `#191f42` / blanc | **15,96** | passe AAA texte |
| bleu nuit / `#f4f4f5` (surface) | 14,52 | passe |
| bleu nuit / `#111113` (canvas sombre) | **1,18** | échec : invisible en sombre |
| orange `#fd6437` / blanc | **2,98** | échoue AA texte (4,5) et frôle le seuil graphique (3) |
| orange / `#f4f4f5` | 2,71 | échoue |
| orange / `#111113` | 6,34 | passe |
| orange / `#1a1a1e` | 5,83 | passe |
| orange / bleu nuit | 5,36 | passe |
| blanc / orange | 2,98 | un texte blanc sur orange échoue |
| noir `#0b0b0c` / orange | 6,61 | seul texte lisible sur fond orange |
| bleu nuit / orange | 5,36 | passe (texte bleu nuit sur orange) |
| orange assombri `#c2410c` / blanc | 5,18 ; sur `#f4f4f5` 4,71 | variante « texte » de l'orange, si jamais l'orange servait au texte |
| `#ededf0` / bleu nuit | 13,66 | texte clair sur fond bleu nuit |
| `#ededf0` / `#111113` | 16,14 | tuile claire du logo en sombre |

Teintes (HSL) : bleu nuit 231° (sat. 45 %), orange 14° (98 %) ; familles actuelles : Composants vert 161°, **Blocs bleu 224°**, **Templates rouille 10°**, Designs framboise 328°. Collisions : bleu nuit contre Blocs (231° / 224°, 2,35:1 entre eux), orange contre Templates (14° / 10°, **2,02:1 entre eux**, indiscernables pour un daltonien) ; en sombre orange contre Templates `#ff9b80` : 1,45:1.

Le logo n'est pas soumis à un seuil de contraste (WCAG 1.4.3 exempte les logotypes) ; le nom est porté par le texte « NgShelf » et l'`aria-label`.

### 4.2 Options

| | A. Garder tel quel | B. Marque en accent seulement | C. Action en bleu nuit, familles gardées | D. Réalignement complet |
| --- | --- | --- | --- | --- |
| Principe | logo avec ses couleurs, collées en dur dans le SVG | 2 tokens de marque (`--logo-tuile`, `--logo-etagere`) utilisés **uniquement** pour logo, splash, favicon, image sociale | `--color-primary` passe de noir `#0b0b0c` à `#191f42` (boutons, focus, sélection) | bleu nuit = action, orange = accent secondaire, 4 familles redéfinies, canvas sombre teinté bleu nuit |
| Site neutre autour des aperçus | oui | oui | non : chrome bleu nuit autour de l'aperçu « Planche » noir | non |
| Familles | inchangées | inchangées | **Blocs entre en collision** (231° / 224°) | **Blocs et Templates à remplacer**, donc les 4 teintes à revalider, `soft` clair et sombre, `on-cat` |
| Mode sombre | logo inversé codé à part | 2 tokens clair/sombre, logique centralisée | action en sombre = bleu nuit éclairci (nouvelle valeur à calculer, car 1,18:1) | tout le bloc sombre à recomposer (« gris très foncé, jamais noir pur » devient un gris bleuté) |
| Contrat de tokens (12 tokens `--ngs-*`) | inchangé | inchangé | inchangé en valeur ; mais le repli « Planche » `#0b0b0c` n'est plus celui du site (écart voulu à documenter) | idem, plus un 4e design « NgShelf » à décider |
| Orange en usage large | non | non (planche du logo seulement) | non | oui : texte ou fond orange exige `#c2410c` ou noir ; contrastes à recalculer sur ~30 emplacements |
| Travail | quasi nul | faible : 2 tokens, 1 règle dans `DESIGN.md` | moyen : boutons, focus, liens, toast, 20 contrastes | élevé : refonte de `tokens.css`, des 8 contrastes de famille, de `DESIGN.md` (ambiance, couleurs, sombre), de la maquette entière |
| Risque | couleurs de marque dispersées dans 4 pages et le favicon | l'orange du logo ressemble à Templates (voisins dans le même écran) | perte de la neutralité voulue par `DESIGN.md` ligne 27 | casse des décisions déjà validées (familles, sombre) pour un gain de marque |

**Recommandation : B.** Motifs : (1) `DESIGN.md` pose « le site reste neutre autour des aperçus » ; le contrat de tokens ne change pas et les aperçus restent isolés (ADR 0003) ; (2) les deux couleurs du logo entrent en collision de teinte avec deux des quatre familles (Blocs et Templates), un réalignement forcerait à les remplacer ; (3) l'orange a 2,98:1 sur blanc : inutilisable comme couleur de texte ou d'état sans variante dédiée, donc inutile de lui confier un rôle fonctionnel ; (4) le bleu nuit est quasi invisible en sombre, ce qui oblige de toute façon à des tokens clair / sombre pour le logo. Règle à écrire dans `DESIGN.md` : « Les deux couleurs de marque ne servent qu'au logo, au splash, au favicon et à l'image sociale. Jamais comme couleur d'action, d'état, de famille ni de texte. » Atténuation de la collision orange / Templates : le logo n'apparaît qu'en en-tête, pied de page et splash ; les puces Templates portent toujours leur nom écrit (règle déjà en place).

`theme-color` des `<meta>` reste `#ffffff` / `#111113` (inchangé en B).

## 5. Ordre d'application proposé pour le designer (après décisions)

1. Renommage `gb → ngs` et « Gabarit → NgShelf » (un seul commit scripté, hors archives) + correction de `DESIGN.md` ligne 3. Vérifier la page : console sans erreur, 4 pages, design system, zip et copie de code.
2. Logo : fichiers SVG, symbole dans le sprite, tokens `--logo-*`, remplacement des 17 emplacements, suppression de `.gb-brand__mark`, favicon et icônes, balises `<link rel="icon">` dans les 4 pages et le design system.
3. Splash : nouveau SVG et `@keyframes` dans le CSS critique des 4 pages, minimum 600 ms dans `app.js`, mise à jour de `DESIGN.md`.
4. Couleurs (option B) : 2 tokens, règle d'usage dans `DESIGN.md`.
5. Après validation : ADR 0006 « Identité NgShelf » (proposé, puis accepté), ligne de statut dans l'ADR 0002, plan `catalogue-arbitrage-design.md` mis à jour, `documentaliste` pour le README.

Prompt prêt pour l'étape 1 (à donner après arbitrage) : « Utilise l'agent designer pour renommer la maquette et le design system selon `docs/plans/ngshelf-identite.md` §1 (options retenues par Sidy : …). Lis ce plan, `DESIGN.md`, `design/maquette/js/config.js`. Critère de fin : recherche de `gb` et de `Gabarit` sans résultat hors `rgb`, `srgb`, `rrggbb` et archives, quatre pages sans erreur console, zip et copie de code générés avec `--ngs-*`. »

## 6. Questions à trancher par Sidy

1. **Préfixe.** (a) `ngs` partout, tout en une passe [recommandé] ; (b) `ngs` pour le public seulement (tokens, utilitaires, cookies, classes des ressources) et `gb` conservé pour le site ; (c) garder `gb`.
2. **Autre préfixe si (a)** : `ngs` [recommandé] ou un préfixe de ton choix (pas `ng-`).
3. **Cookies** : (a) renommer sans migration [recommandé si la maquette n'a jamais été partagée] ; (b) renommer avec lecture de l'ancien cookie une fois.
4. **Archives** (`brief.md`, `concepts.md`, `demos-concepts/`) : (a) conserver « Gabarit » avec une ligne « archive » [recommandé] ; (b) renommer aussi.
5. **Logo** : (a) tuiles + planche, sans équerres, tuiles claires en sombre [recommandé] ; (b) même chose mais tuiles bleu nuit conservées avec un liseré clair en sombre.
6. **Marque en texte** : (a) logo + « NgShelf » [recommandé] ; (b) logo seul ; (c) logo + « Shelf ».
7. **Favicon** : (a) même dessin recentré (tuiles + planche) [recommandé] ; (b) une seule tuile « n » sur planche, plus lisible à 16 px.
8. **Technique du splash** : (a) SVG en ligne + CSS [recommandé] ; (b) GSAP.
9. **Scénario** : (a) la planche se pose puis les tuiles « n » puis « g » tombent dessus [recommandé] ; (b) glissement latéral ; (c) autre, à préciser.
10. **Minimum d'affichage** : (a) 600 ms (+180 ms) [recommandé] ; (b) garder 420 ms et raccourcir l'animation à 420 ms.
11. **Fond du splash** : (a) fond de la page, blanc ou `#111113` [recommandé] ; (b) plein écran bleu nuit (touche à la palette : voir question 12).
12. **Mouvement réduit** : (a) splash masqué comme aujourd'hui [recommandé] ; (b) logo fixe 300 ms.
13. **Une seule fois** : (a) règle actuelle de l'ADR 0005 (premier chargement d'un document) [recommandé] ; (b) une fois par session d'onglet via `sessionStorage`.
14. **Couleurs** : (a) garder tel quel ; (b) marque en accent seulement, 2 tokens [recommandé] ; (c) action en bleu nuit, familles gardées ; (d) réalignement complet.
15. **ADR** : valider la création de l'ADR 0006 « Identité NgShelf » (statut `proposé` puis `accepté` après tes choix) : oui [recommandé] / non (tout dans `DESIGN.md`).

## Historique

- 2026-11-27 : étude initiale (renommage, logo, splash, couleurs). Aucune modification de code.
