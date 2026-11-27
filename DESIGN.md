# DESIGN.md — NgShelf

> Version 0.9 du 27 novembre 2026, identité NgShelf (ADR 0006) ; **à valider par Sidy**. Le nom « NgShelf » a été retenu par Sidy. Il est défini dans `design/maquette/js/config.js` (`NGS.site.nom`, `nomCourt`, préfixe `ngs`), mais aussi écrit en dur dans les `<title>`, `<meta description>`, `aria-label` et textes de pied de page de chaque page ; un renommage touche ces emplacements.

## Journal des changements

| Version | Changements |
| --- | --- |
| 0.9 | **Page 404 et pages légales** (toutes les pages « sans maquette » du lot 3). 1. `404.html` : « étagère » de vraies pièces (Interrupteur, Boutons) posées sur des planches, un emplacement vide en pointillés portant « 404 » ; les pièces se posent l'une après l'autre (CSS seul, `translateY`, une fois), le contour de l'emplacement se trace ; sous `prefers-reduced-motion` : état final, aucune animation. Contenu : message, adresse demandée (texte seulement, `location`), recherche (`catalogue.html?q=`), accueil, catalogue, quatre familles ; `noindex`. 2. **Gabarit « Lecture »** `.ngs-lecture` (components.css + section du design system) : sommaire collant à 15 rem et texte à 42 rem centrés (≥ 1024 px), sommaire repliable sur mobile, section lue marquée (`aria-current="location"`), ancres avec `scroll-margin-top`, champ `.ngs-acompleter` (pointillés, couleur `--color-warning`). 3. `mentions-legales.html`, `confidentialite.html`, `cookies.html` : droit **sénégalais** (loi n° 2008-12 sur les données personnelles, loi n° 2008-08 sur les transactions électroniques, CDP) avec une rédaction compatible RGPD ; aucun article cité sauf la directive 2002/58/CE, art. 5 § 3 (vérifiée). 4. **Hébergeur non choisi** : `NGS.site.hebergeur` (`null`, `'cloudflare'` ou `'netlify'`) dans `config.js`, coordonnées des deux lues sur leurs politiques officielles ; `null` = champ « à compléter ». 5. Cookies : seuls `ngs_theme` et `ngs_variante` existent dans le code ; `ngs_motion` (point ouvert n° 2) n'existe pas et n'est donc pas listé. Pas de bandeau, la page « Cookies » dit pourquoi. 6. Pied de page des 8 pages : liens Mentions légales, Confidentialité, Cookies (blocs partagés identiques, vérifié par somme de contrôle). 7. Textes : ~190 clés `nf.*` et `legal.*` dans `textes.fr.js` ; `data-t-html` (innerHTML, textes de confiance seulement) et paramètres `{auteur}`, `{email}`, `{hebergeur}`… lus dans `config.js` (`NGS.paramsLegaux`). |
| 0.8 (correction du passage NgShelf) | Audit du passage NgShelf contre l'ADR 0006 et la v0.7, corrigé : 1. **Splash coupé** : l'écouteur `animationend` recevait les fins d'animation des tuiles (vers 600 ms) et retirait le splash 130 ms après le début de sa sortie, sans laisser jouer le `clip-path` de 320 ms. Il ne réagit plus qu'à `ngs-splash-sortie`. 2. **Plafond de 1,2 s** : le filet JS lançait la sortie à 1,2 s (fin à 1,52 s) ; il la lance au plus tard à 880 ms. 3. **Nom accessible de la marque** dans le tiroir mobile et le pied de page : on ne lisait que « Shelf » ; ils portent maintenant `role="img"` et `aria-label="NgShelf"` (l'en-tête lit « Accueil de NgShelf »). 4. **Page de design system** : la zone « thème clair » du logo n'était pas forcée en clair (en sombre, tuiles claires sur fond sombre) ; tokens fixes `--logo-tuile-clair` / `--logo-tuile-sombre` ajoutés, `--logo-tuile` en dérive ; pastille « v0.4 » corrigée en « v0.8 ». 5. **README du zip** : `{slug}` n'était pas remplacé dans les étapes d'installation (défaut plus ancien). Vérifié sans défaut : scénario et durées du splash, fond bleu nuit en sombre, masquage en mouvement réduit et en navigation interne, fichiers du logo (`viewBox`, pieds vides, favicon à équerres pleines), lisibilité à 24, 28 et 32 px, code généré (`--ngs-*`, `*-ngs-*`, `ngshelf-theme.css`), « À propos » v0.6 et v0.7 intacts. |
| 0.8 | 1. **Identité NgShelf (ADR 0006)** : ancien préfixe de deux lettres remplacé par `ngs` partout (tokens `--ngs-*`, classes `ngs-*`, `window.NGS`, cookies `ngs_*` sans migration, utilitaires Tailwind `*-ngs-*`, fichier pont `ngshelf-theme.css`) ; l'ancien nom de travail supprimé de tous les fichiers, archives comprises. 2. **Logo** avec pieds (version « pieds vides », équerres en contour), recadré (`viewBox` 320 236 896 491) ; en sombre, tuiles claires ; marque = logo + « Shelf » ; carrés 2×2 retirés ; favicon recentré (équerres pleines), apple-touch, icônes 192 et 512, symbole dans le sprite, `ngshelf-clair.svg` / `ngshelf-sombre.svg`. 3. **Splash** refait : SVG en ligne et `@keyframes`, minimum 600 ms, fond blanc ou bleu nuit. 4. **Couleurs** : option B, tokens `--logo-*`. 5. Section « Marque » dans le design system. 6. Corrigés au passage : 404 de l'`@import "tailwindcss"` dans l'iframe d'aperçu, 404 de la photo de la carte de séjour dans le design system. |
| 0.7 | 1. **Pied de page** : « Démarrer » retiré sur toutes les pages. 2. **« Pour qui » refait** autour d'une idée : un manifeste en très grand qui parle du développeur et de ce que la pièce lui épargne, et l'avant / après d'un calendrier (code « à faire » rayé, puis la vraie pièce), en moment épinglé ; plus de bande de pilules ni de trois cartes. 3. **« Comment c'est fait » corrigé** : panneau contenu dans le cadre de la photo, code en retour à la ligne et extraits courts, vues empilées (hauteur stable) avec fondu croisé, liste serrée et lisible, état actif clair. 4. **Épinglages recalculés dans l'ordre de la page** (`refreshPriority`), sinon « Pour qui » et « Comment c'est fait » démarraient trop tôt. La page compte deux sections épinglées, non consécutives (« Trois gestes », « Pour qui »). |
| 0.6 | 1. **Navigation** : lien « Démarrer » retiré du header et du menu mobile, sur toutes les pages (il reste dans le pied de page). 2. **« À propos », hero** refait : de vraies pièces du catalogue, libres, qui arrivent de loin et s'assemblent, réagissent au pointeur et se démontent au scroll ; les photos sans rapport (yassa, Saint-Louis) sont retirées de la page. 3. **« Le catalogue aujourd'hui »** : la phrase devient une mosaïque de tuiles avec grands compteurs et visuels tirés du registre (un carré par ressource, les 12 jetons, les 3 designs, la bascule Tailwind / CSS, « Créer un compte » rayé). 4. **« Pour qui »** : titres réels qui défilent au scroll et trois cas d'usage avec de vraies pièces ; **« Comment c'est fait »** : la photo de Lagos porte un panneau qui illustre le point actif (code, version, design, animations). Une seule section épinglée sur la page (« Trois gestes »). |
| 0.5 | 1. **Bug corrigé, aperçu vide de la carte de séjour** : dans la version Tailwind, l'hôte de la carte est un conteneur (`@container`, donc `container-type: inline-size`, sans largeur intrinsèque) placé dans une enveloppe `[data-piece]` qui s'ajuste à son contenu : il retombait à 0 px de large. Ce n'était ni la sortie `sejour-sortie`, ni la balise cachée, ni l'entrée `ngs-sejour-photo` (opacité 1 mesurée). Correction dans le document de l'aperçu : `[data-piece]` occupe toute la largeur (grille, contenu centré). Le défaut ne venait pas des animations de la v0.4 : la règle `@container` de la carte était déjà là avant. 2. **Photo de Lagos** (fournie par Sidy, Unsplash) en WebP 640 et 1024 pour « Comment c'est fait ». 3. **« À propos » recomposée** : phrase des chiffres en bande pleine largeur (vide réduit) ; « Pour qui » en rangée éditoriale (titre 4 colonnes, texte 7) ; « Comment c'est fait » : photo de code à gauche, liste à droite, même hauteur ; « Contribuer » : texte à gauche, arborescence d'un dossier de ressource et parcours en 4 étapes à droite ; les photos du yassa et de Saint-Louis ne sont plus répétées (déjà dans le hero). 4. **« Qui le développe »** : bande sombre pleine largeur, portrait, nom, une ligne de rôle (la phrase qui répétait le nom est supprimée), liens en cartes avec l'adresse lisible tirée de `config.js`. |
| 0.4 | 1. **Police** : paire C choisie par Sidy, **Chivo + Chivo Mono** (Omnibus-Type, OFL), partout ; Archivo et IBM Plex Mono retirées de la maquette et du design system (gardées pour `polices.html`). Chivo n'a pas d'axe de largeur : la signature des noms de famille passe par la graisse (460 → 800) et l'approche. Code en Chivo Mono avec zéro barré et sans ligatures. 2. **Entrées et sorties des ressources** : hero (entrée en cascade, sortie par `animate.leave`), barre de navigation (entrée en cascade), carte de séjour (sortie ajoutée) ; boutons « Rejouer l'entrée » et « Rejouer la sortie » à côté de l'aperçu. 3. **Page « À propos » refaite** en page vitrine : mosaïque familles et photos avec parallaxe, phrase dont les chiffres comptent, moment fort épinglé « Copier, Régler, Livrer », photos révélées en masque, portrait de Sidy révélé avec son nom lettre par lettre, Lenis. |
| 0.3 | 1. **Cases collées (accueil)** : cause trouvée, une transition CSS sur `transform` de `.ngs-case` concurrençait le `from()` GSAP, qui gardait un décalage résiduel (`translate(0, 24 à 36 px) scale(.96)`). Survols passés en `translate` / `scale`, entrées en `fromTo` avec état final et `clearProps`. Gouttière unique mesurée à toutes les largeurs. 2. **Cases mal alignées (catalogue)** : même cause, plus le Flip. Rangées alignées en haut, hauteur égale, scène d’aperçu commune (17,5rem) au catalogue. 3. **Animations des ressources** : champ `motion` du registre, badge « Animée », filtre « Animées seulement », réglage « Animations » de la fiche, 4 ressources animées, toujours désactivables. 4. **Police** : Archivo remplace Bricolage Grotesque (variable `--font-famille`), comparaison dans `design/demos-concepts/polices.html`. 5. **Mode sombre du site** : tokens `[data-theme="sombre"]`, menu clair / sombre / système dans le header, cookie `ngs_theme`, aucun flash. 6. **Page « À propos »** (`design/maquette/a-propos.html`), dans la navigation et le pied de page. |
| 0.2 | Retours de Sidy sur la première maquette (voir « Retours de Sidy intégrés »). |
| 0.1 | Design system et maquette initiaux, concept B avec le réglage de C. |

## Overview

- **Produit** : catalogue public, gratuit et open source (MIT) de ressources **Angular 22**. On y trouve des composants, des blocs, des templates et des designs (thèmes de tokens). Pas de compte ni de paiement. On essaie chaque ressource dans la page, puis on copie son code ou on la télécharge.
- **Concept retenu** : **B « Planche spécimen »**, avec le **réglage par tokens de C « Signal »**.
  - **Ce qu'on emprunte à C** : les réglages de la fiche, et l'habillage de la planche sur l'accueil.
  - **Idée de B** : une planche de fonderie qui montre chaque pièce en vrai. Ici, les pièces sont des **composants vivants** : on les manipule sur place, aucune n'est une image.
- **Modes de surface (design-sidy §1)** :
  - accueil : Convaincre, motion de niveau 1 ;
  - catalogue et fiche : Expérience, niveau 2 ;
  - documentation : Lire.
- **Ambiance** : fond blanc (gris très foncé en mode sombre), typographie d'affiche (Chivo, graisse variable, et Chivo Mono pour le code), noir d'impression pour agir, une couleur par famille pour se repérer. Le site reste neutre autour des aperçus pour ne pas concurrencer le style des ressources exposées.
- **Élément mémorable** : la **planche vivante** du hero.
  - Tout y fonctionne : on bascule, on choisit une date, on fait glisser.
  - On peut **l'habiller** d'un autre design : une vague recolore les pièces une à une.
  - Une case cliquée **grandit jusqu'à devenir sa fiche**.
- **Fichiers** :
  - [`design/design-system/tokens.css`](design/design-system/tokens.css) : `@theme` du site, seule source des valeurs.
  - [`design/design-system/contrat-tokens.css`](design/design-system/contrat-tokens.css) : contrat des ressources.
  - [`design/design-system/components.css`](design/design-system/components.css) : composants du site.
  - [`design/design-system/index.html`](design/design-system/index.html) : page de design system.
  - [`design/maquette/`](design/maquette/) : maquette jouable.
  - [`design/demos-concepts/`](design/demos-concepts/) : comparaison A / B / C.
- **Arbitrages d'architecture repris** (`docs/plans/catalogue-arbitrage-design.md`, ADR 0001 à 0003) :
  - Angular 22 ;
  - icônes Phosphor ;
  - site clair par défaut, **mode sombre du site depuis la v0.3** (choix du visiteur), blocs de code toujours sombres ; le mode de l'aperçu des ressources reste réglable à part dans la fiche ;
  - contrat de 12 tokens, ressources en CSS de composant avec `var(--token, repli)` ;
  - pas de Three.js ;
  - Lenis sur l'accueil et sur « À propos » (v0.4) ;
  - GSAP pour le site, jamais dans les ressources publiées (leurs animations propres sont en CSS ou en `animate.enter` / `animate.leave` d'Angular).

### Retours de Sidy intégrés (v0.2)

1. **Code en deux versions**, Tailwind v4 (par défaut) et CSS.
   - Un sélecteur sur la fiche ; la copie, le zip et l'aperçu suivent la version choisie (cookie fonctionnel `ngs_variante`).
   - En Tailwind, `ngshelf-theme.css` (`@theme inline`) relie les utilitaires `bg-ngs-action`, `rounded-ngs`, `p-ngs-4`… aux variables `--ngs-*` de `tokens.css`. Les réglages live marchent dans les deux versions.
   - Une seule source de balisage : les classes BEM du registre sont remplacées par les utilitaires (table `tw`, ADR 0002).
2. **Angular 22 idiomatique**, relu ressource par ressource :
   - standalone par défaut, `ChangeDetectionStrategy.OnPush` ;
   - `input()` / `input.required()` / `model()` avec `booleanAttribute` / `numberAttribute` ;
   - `inject()`, `viewChild.required()`, `afterNextRender({ injector })` ;
   - `@if` / `@for` avec `track` ;
   - `host: { class }` pour la version Tailwind ;
   - `NgOptimizedImage` (`ngSrc`, `priority`, `fill`), `RouterLink` / `RouterLinkActive` avec `ariaCurrentWhenActive`.
3. **Splash** au premier chargement : la planche du logo se pose, puis les tuiles « n » et « g » tombent dessus (impact, rebond) ; au moins 600 ms, plafonné à 1,2 s, absent en reduced-motion (ADR 0005 et 0006).
4. **Hero refait**, sur la gauche le texte et à droite une **vitrine** : un vrai site de restaurant (« Chez Awa »), assemblé avec des pièces du catalogue.
   - Les pièces : navbar et hero avec une vraie photo, calendrier et notification posés par-dessus.
   - Chaque pièce porte une étiquette qui ouvre sa fiche.
   - « Habiller avec un design » recolore la vitrine puis la planche.
5. **Taxonomie à grande échelle** (ADR 0004) :
   - catégorie (famille) ;
   - **type**, vocabulaire contrôlé : 22 types de composants, 15 de blocs, 8 de templates ;
   - **secteur** : 14 valeurs, 0 à 3 par ressource.
   - Facettes, filtres actifs, tri et pagination « Afficher plus » au catalogue, et un méga-menu « Catalogue » dans l'en-tête.
6. **Deux notions nommées clairement** :
   - **Design** = habillage visuel (tokens : Planche, Fleuve, Latérite) ;
   - **Secteur** = domaine d'activité (restaurant, voyage…), libellé validé par Sidy.
   - Le badge de secteur est neutre, avec une icône ; il n'est jamais dans la couleur d'une famille.
7. **Pied de page** :
   - liens réels de Sidy (Instagram, TikTok, LinkedIn, GitHub, e-mail) regroupés dans `config.js` ;
   - signature « Développé par Sidy », avec un monogramme « S » qui se dessine, vers son portfolio.
8. **Animation de sortie** entre pages : View Transitions, avec un repli dans la maquette.
9. **Fiche réalignée** :
   - les colonnes ont la même hauteur, l'aperçu s'étire jusqu'au bas des réglages ;
   - les réglages sont regroupés en sections repliables, avec la valeur courante dans l'en-tête ;
   - le bloc identité est collant à partir de 1280 px.
10. **Dépendances** : emplacement réservé sur la fiche (« Aucune : seulement Angular 22 »). Évolution notée plus bas.

**Publication** : la maquette est publiée comme page hébergée.
- Chemins relatifs uniquement, pas de chemin absolu.
- Aucun appel vers localhost.
- Scripts externes uniquement depuis `cdn.jsdelivr.net/npm/`, en version exacte : `gsap@3.15.1`, `lenis@1.3.28`, `@tailwindcss/browser@4.3.5`.

## Colors

**Couleurs de marque (v0.8, ADR 0006).** Bleu nuit `#191f42` (`--logo-tuile`, `#ededf0` en sombre) et orange `#fd6437` (`--logo-etagere`) ne servent qu'au logo, au splash, au favicon et à l'image sociale. Jamais comme couleur d'action, d'état, de famille ni de texte. Le contrat de tokens ne change pas.

Fond `#FFFFFF` partout. Les contrastes sont **calculés** (formule WCAG 2.x) en direct sur la page de design system ; ils sont recopiés ici pour mémoire.

| Rôle | Token | Valeur | Contraste sur blanc / surface |
| --- | --- | --- | --- |
| canvas | `--color-canvas` | `#ffffff` | — |
| surface (scène des cases, panneaux) | `--color-surface` | `#f4f4f5` | — |
| texte | `--color-text` | `#0b0b0c` | 19,67 / 17,90 |
| texte secondaire | `--color-text-muted` | `#5f5f66` | 6,33 / 5,76 |
| action, focus, sélection | `--color-primary` | `#0b0b0c` (survol `#2a2a2e`) | blanc sur action 19,67 |
| bordure décorative | `--color-border` | `#e4e4e7` | jamais seule pour un contrôle |
| bordure de contrôle | `--color-border-strong` | `#7c7c85` | 4,13 / 3,76 (seuil 3:1) |
| succès | `--color-success` | `#11703f` | 6,15 / 5,60 |
| avertissement | `--color-warning` | `#8a5300` | 6,33 / 5,76 |
| erreur | `--color-danger` | `#b42318` | 6,57 / 5,98 |
| famille Composants | `--color-cat-composants` | `#0b6e4f` (fond doux `#e8f3ef`) | 6,25 / 5,69 |
| famille Blocs | `--color-cat-blocs` | `#1f4fd1` (fond doux `#ebf0fc`) | 6,78 / 6,17 |
| famille Templates | `--color-cat-templates` | `#b4361c` (fond doux `#f8ece9`) | 6,03 / 5,48 |
| famille Designs | `--color-cat-designs` | `#b0005e` (fond doux `#f8e6ef`) | 6,98 / 6,35 |

- **Familles** : leurs couleurs servent uniquement au repérage (pastille, badge, puce active, panneau de famille). Le nom de la catégorie est toujours écrit à côté.
- **Blocs de code**, toujours sombres :
  - fond `#141416`, texte `#e7e7ea` (14,91:1) ;
  - commentaires `#9a9aa3` (6,59:1) ;
  - mots-clés `#f5a3c0`, chaînes `#8fd6b4`, balises `#9db8ff`, attributs `#ffb59e`, nombres `#f0c674` ;
  - tous au-dessus de 9:1.
- **Rôles ajoutés en v0.3** pour qu'aucun composant n'utilise une primitive : `--color-border-hover`, `--color-text-faint` (3,42:1, jamais seule), `--color-control-off` (piste d'interrupteur coupé, 4,13:1), `--color-ring`, `--color-backdrop`, `--color-selection-*`, `--color-scrollbar`, `--color-toast-bg` / `-text`, `--color-shimmer`, `--color-contour`, `--color-on-cat`, `--color-danger-soft`, `--shadow-flottant`.

### Mode sombre du site (v0.3)

- **Choix** : clair, sombre ou système (par défaut). Menu `.ngs-theme` dans le header (bouton icône 44 px : soleil, lune ou écran selon le choix ; trois `menuitemradio`). Gardé dans le cookie fonctionnel `ngs_theme` (`SameSite=Lax`, un an), comme `ngs_variante` (ADR 0002).
- **Pas de flash** : un script en ligne du `<head>` lit le cookie et `prefers-color-scheme`, pose `data-theme="sombre"` sur `<html>` et la couleur `theme-color`, avant tout rendu. Une règle critique en ligne pose le fond `#111113` avant Tailwind. En mode système, un changement du réglage de l'appareil est suivi en direct. En Angular : même script en ligne dans `index.html`.
- **Tokens** : bloc `[data-theme="sombre"]` de `tokens.css` (sélecteur non limité à `:root`, pour pouvoir forcer une zone). Toute variable sémantique qui change y est redéfinie.
- **Composé à part**, pas une inversion : gris très foncé, surfaces qui s'éclaircissent en s'élevant, familles éclaircies et désaturées, texte en encre sur une couleur de famille, ombres plus denses.

| Rôle | Sombre | Contraste sur canvas / surface |
| --- | --- | --- |
| canvas / surface / surface-hover | `#111113` / `#1a1a1e` / `#242429` | — |
| texte / secondaire | `#ededf0` / `#a4a4ae` | 16,14 / 14,85 ; 7,63 / 7,02 |
| action (et focus), texte sur action | `#ededf0`, `#111113` | 16,14 |
| bordure / de contrôle | `#2c2c32` / `#75757f` | décor ; 4,14 / 3,81 (seuil 3:1) |
| succès / avertissement / erreur | `#5fd394` / `#eab05c` / `#ff8b7d` | 10,09 / 9,76 / 8,30 sur canvas |
| Composants (doux) | `#4fca9d` (`#12271f`) | 9,22 / 8,48, sur son fond doux 7,69 |
| Blocs (doux) | `#93abff` (`#171e35`) | 8,54 / 7,86, sur son fond doux 7,47 |
| Templates (doux) | `#ff9b80` (`#2b1813`) | 9,21 / 8,47, sur son fond doux 8,25 |
| Designs (doux) | `#ff8dc5` (`#2c1522`) | 8,86 / 8,15, sur son fond doux 7,97 |
| texte sur couleur de famille (`--color-on-cat`) | `#111113` | 8,54 à 9,22 |
| toast | fond `#2a2a30`, texte `#ededf0` | 12,21 |

- Contrastes calculés (formule WCAG 2.x) par script, et recalculés en direct sur la page de design system (section « Mode sombre du site », zone forcée en sombre). Tous passent AA.
- **Splash** : fond bleu nuit `#191f42`, tuiles claires `#ededf0`, planche orange (CSS critique en ligne, valeurs de marque recopiées de `tokens.css`).
- **Hero et planche** : la vitrine et les cases sans mode imposé prennent les valeurs **sombres du design choisi** (Planche, Fleuve, Latérite), et se rhabillent si le visiteur change de thème. La photo du plat reste telle quelle ; son cadre et l'ombre des pièces flottantes s'adaptent.
- **Fiche** : l'aperçu démarre dans le thème du site, puis le segment Clair / Sombre de la fiche le règle indépendamment.
- **Blocs de code** : inchangés (toujours sombres), séparés du fond par leur bordure.
- **Contrat des ressources** (`contrat-tokens.css`) : 12 tokens `--ngs-*`, et 3 designs (Planche, Fleuve, Latérite) en clair et en sombre. Les 48 paires de contraste passent AA ; le tableau est sur la page de design system.

## Typography

- **Chivo** (Omnibus-Type), v0.4, choisie par Sidy (paire C de `design/demos-concepts/polices.html`) ; remplace Archivo (v0.3), qui remplaçait Bricolage Grotesque (v0.2).
  - Trouvée sur [1001 Fonts](https://www.1001fonts.com/chivo-font.html) (« Free for commercial use »), licence SIL OFL 1.1 lue dans le fichier officiel [OFL.txt](https://github.com/google/fonts/blob/main/ofl/chivo/OFL.txt) (copie : `assets/fonts/OFL-chivo.txt`).
  - Fichier `chivo-latin-var.woff2` (27 Ko) : variable, graisse 400–800, réduit au latin (fontTools). Chiffres de largeur fixe par défaut (tous à 615 unités), donc alignés dans les compteurs.
  - Grotesque robuste et chaleureux, de la même fonderie qu'Archivo : la voix « planche de fonderie » reste.
- **Chivo Mono** (Omnibus-Type), même licence ([OFL.txt](https://github.com/google/fonts/blob/main/ofl/chivomono/OFL.txt)), trouvée sur Google Fonts. Fichier `chivo-mono-latin-var.woff2` (19 Ko), variable 400–600. Réservée au code, aux noms de tokens et aux fichiers.
  - **Lisibilité vérifiée** dans les blocs de code (capture à 14 px, écran 2×) : zéro barré activé (`font-feature-settings: "zero"`), ligatures coupées (`font-variant-ligatures: none`, sinon `ffffff` se resserre), 0 / O / o, 1 / l / I et les petits chiffres des tailles de fichiers (`598 o`, `1,2 Ko`) restent distincts.
- **Pas d'axe de largeur** : l'effet signature des noms de famille passe par la **graisse** (`--wght-signature-de` 460 → `--wght-signature-a` 800) et l'**approche** qui se resserre (−0,02em → −0,047em), animées par GSAP via la variable `--wght`. Même logique pour les étapes « Copier, Régler, Livrer » de « À propos ». Marque et titres : graisses fixes (`--wght-logo` 800, `--wght-display` 760, `--wght-titre` 720).
- **Remplacement en un point** : les blocs `@font-face` et les variables `--font-famille` / `--font-mono` de `tokens.css`. Le splash reprend le nom de la police dans son CSS en ligne, et le preload du `<head>` les deux fichiers.
- **Couverture vérifiée avec fontTools** (Chivo et Chivo Mono) : é è ê ë à â ä ç œ Œ É È Ê À Â Ç î ï ô ö û ù ü ÿ Ÿ æ « » ’ … € – — et les chiffres sont présents.
  - L'espace fine insécable U+202F est **absente**. On utilise l'insécable U+00A0 avant `: ; ? !`.
- **Chargement** : 2 fichiers pour 2 familles (46 Ko), préchargés, `font-display: swap`, repli « Chivo Fallback » (Arial ajusté : `size-adjust` 105,6 %, `ascent-override` 89 %, `descent-override` 23,7 %, calculés depuis les métriques de Chivo 400).

| Rôle | Taille | Graisse | Interligne / approche |
| --- | --- | --- | --- |
| display (h1 accueil) | `clamp(3rem, 1.6rem + 6vw, 6rem)` | 760 | 0,95 / −0,025em |
| h2 | `clamp(2rem, 1.4rem + 2.6vw, 3.5rem)` | 720 | 1,02 / −0,03em |
| h3 | `clamp(1.375rem, …, 1.75rem)` | 620 | 1,15 |
| lead | `clamp(1.125rem, …, 1.3125rem)` | 400 | 1,5 |
| corps | 17 px | 400 | 1,6 |
| label | 14 px | 560 | 1,3 |
| code | 14 px Chivo Mono (zéro barré, sans ligatures) | 400 | 1,65 |
| nom de famille (signature) | jusqu'à 7,5rem | 460 → 800 au scroll (`--wght`) | 0,9 / −0,02em → −0,047em |

Principes : `text-wrap: balance` sur les titres, `pretty` sur le corps, chiffres tabulaires pour les compteurs, un seul `h1` par page.

## Layout

- **Espacement** : multiples de 4 px.
  - `--space-section` : 80 → 160 px.
  - `--space-inline` (marges latérales) : 16 → 48 px.
  - `--space-gutter` : 12 → 20 px.
- **Conteneur** : `--container-site: 90rem`, bords gauche et droit égaux.
- **Planche** : grille de 1 colonne, puis 2 à 640 px, 3 à 1024 px et 4 à 1280 px, en `grid-auto-flow: dense`. À partir de 1920 px, le conteneur passe à `--container-wide` (112rem).
  - Cases 1×1, 2×1 (`--wide`) ou 2×2 (`--wide --tall`).
  - Sur l'accueil, la composition est fixe : 4 rangées pleines à 1440 px.
  - Dans le catalogue, la taille vient du registre.
- **Blanc** : les sections respirent ; les cases sont séparées par **une seule gouttière** (`--space-gutter`, 12 → 20 px), identique en largeur et en hauteur, comme sur une planche imprimée.
- **Règle de grille (v0.3)** : aucune case ne porte de `transform` au repos. Le survol passe par `translate`, les entrées GSAP et le Flip par `transform` avec état final explicite et `clearProps`. Vérifié par mesure à 320, 768, 1024, 1440, 1920 et 2560 px : une seule valeur d'écart horizontal et vertical, aucun chevauchement, aucun décalage résiduel.
- **Catalogue** : rangées alignées en haut (étirement de la grille), cases d'une même rangée à hauteur égale, scène 1×1 à hauteur minimale commune (17,5rem) pour que la zone d'aperçu soit la même dans toutes les cases.

## Elevation

- `--shadow-raise` : case au survol, segment actif.
- `--shadow-overlay` : dialogue, toast.
- Pas d'autre ombre. On préfère une bordure fine sur fond blanc, et jamais plus de deux boîtes imbriquées : la case contient une scène, et la scène contient la ressource.
- z-index : 0 / 10 / 20 (barre de filtres) / 40 (header) / 100 (menu, voile de transition) / 1000 (toasts).

## Shapes

- **Rayons** : `--radius-chip` 8, `--radius-button` / `--radius-input` 12, `--radius-case` / `--radius-panel` 20, `--radius-full`.
- **Exception** : les puces de filtre sont des pilules, pour les distinguer des boutons.
- **Photos** : deux vraies photos libres de droits (Unsplash), au service du propos.
  - Un plat sénégalais pour le secteur Restaurant, montré dans le hero de l'accueil par la ressource « Hero avec photo ».
  - Saint-Louis pour le secteur Voyage, dans la « Carte de séjour ».
  - Ratios : 16/10 pour un hero, 4/3 pour une carte, `object-fit: cover`.
  - Crédits : `design/maquette/assets/images/CREDITS.md`.
  - Les templates, quand il y en aura, seront montrés en capture 16/10.

## Motion

Niveaux : 1 sur l'accueil, 2 sur le catalogue et la fiche, « Lire » sur la documentation.

Tokens :

| Token | Valeur |
| --- | --- |
| `--duration-press` | 90 ms |
| `--duration-out` | 120 ms |
| `--duration-in` | 150 ms |
| `--duration-panel-in` / `-out` | 200 / 120 ms |
| `--duration-theme` | 420 ms |
| `--duration-image-in` / `-out` | 600 / 400 ms |
| Sortie / entrée de page | 180 / 300 ms (View Transitions) |
| Splash | planche 220 ms, chute des tuiles 380 ms (« n » dès 100 ms, « g » à 220 ms), sortie 320 ms, minimum 600 ms, plafond 1,2 s (sortie lancée au plus tard à 880 ms) |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` |
| `--ease-enter` | `cubic-bezier(.22,1,.36,1)` |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` |

### Tableau des animations par section

**État : intégré dans la maquette, à valider avec elle.** Le coordinateur a demandé d'enchaîner les étapes ; ce tableau n'a donc pas été validé séparément.

| Page / section | Animation | Raison | Déclencheur | Référence (effet + lien) | Mobile / reduced-motion |
| --- | --- | --- | --- | --- | --- |
| Toutes les pages, splash | SVG en ligne et `@keyframes` CSS (sans GSAP) : la planche du logo (avec ses équerres) se pose (`scaleX` .15 → 1, 220 ms), la tuile « n » tombe avec impact (écrasement `scaleY` .94) et rebond (380 ms, dès 100 ms), puis la tuile « g » (120 ms plus tard) ; puis l'écran remonte par `clip-path` (320 ms) quand l'app est prête (au moins 600 ms, au plus 1,2 s). Fond blanc en thème clair, bleu nuit `#191f42` en thème sombre | Identité dès la première image (ranger deux tuiles sur une étagère), le temps de l'hydratation | Premier chargement d'un document seulement (pas en navigation interne, pas de `sessionStorage`) | angular-sidy (SSR + splash), ADR 0005 et 0006 | Absent en reduced-motion ; `noscript` ; minuteur CSS de sécurité à 1,2 s |
| Accueil, hero | `h1` ligne par ligne depuis des masques, puis texte et boutons en cascade. La **vitrine** s'ouvre (`clip-path` de bas en haut + scale .97 → 1), ses pièces (navbar, hero photo) montent en cascade, le calendrier se pose (y 60, rotation −3° → 0), la notification descend, puis les étiquettes apparaissent (scale .6 → 1). Timeline unique d'environ 2 s, lancée pendant la sortie du splash. **v0.3** : les cases de la planche ne sont plus dans cette timeline (ligne suivante) | La promesse, puis la preuve : un vrai site fait de pièces du catalogue | Chargement (une fois) | GSAP SplitText (`mask: 'lines'`), https://gsap.com/docs/v3/Plugins/SplitText/ ; staggers, https://gsap.com/resources/getting-started/Staggers | Même timeline ; reduced : tout est affiché directement |
| Accueil, planche (v0.3) | Les cases se posent rangée par rangée (y 36 → 0, scale .96 → 1, 60 ms d'écart) à leur entrée dans l'écran, avec état final explicite et `clearProps` : aucun décalage ne reste | Les pièces arrivent quand on les regarde, sans laisser la grille de travers | Scroll (entrée, une fois, `ScrollTrigger.batch`) | GSAP `ScrollTrigger.batch`, https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.batch() | Reduced : affichées directement |
| Accueil, vitrine | Profondeur au pointeur : calendrier et notification suivent la souris (8 à 14 px, `quickTo`) | Donne du relief à la page assemblée sans toucher au texte | Pointeur fin, ≥ 1024 px | React Bits *Magnet* (principe), https://reactbits.dev/animations/magnet | Coupé au tactile et en reduced |
| Toutes les pages, sortie et entrée | Ancienne vue : fondu et montée de 8 px (180 ms) ; nouvelle vue : arrivée de 8 px plus bas (300 ms, 60 ms de décalage) ; en-tête immobile | Quitter une page se voit, sans ralentir | Navigation (lien interne, retour de la fiche au catalogue) | View Transitions entre documents (`@view-transition`) dans la maquette ; `withViewTransitions` du router en Angular (ADR 0005) | Rien en reduced ; sans support : repli GSAP dans la maquette, navigation directe en Angular |
| Case → fiche, fiche → liste | La scène de la case devient le cadre d'aperçu de la fiche (morph `apercu-ressource`, 480 ms), et inversement au retour | Continuité : la pièce devient sa page, puis y retourne | Clic sur la case ; retour arrière ou fil d'Ariane | View Transitions, élément partagé (un seul nom à la fois) | Rien en reduced ; repli : voile GSAP depuis la case |
| Dialogue de recherche, menu, tiroir de filtres | Sortie animée (fondu et 6 px, 120 ms ; tiroir qui redescend) | La fermeture d'un panneau est un geste visible | Fermeture (Échap, bouton, fond) | `transition-behavior: allow-discrete` sur `dialog` | Immédiat en reduced |
| Accueil, CTA principal | Bouton magnétique discret (±5 px) | Attire la main vers l'action principale sans la déplacer | Pointeur fin | React Bits *Magnet*, https://reactbits.dev/animations/magnet (réécrit avec `gsap.quickTo`, sans rebond) | Coupé au tactile et en reduced |
| Accueil, « Habiller avec un design » | Vague : la vitrine, puis chaque case reçoit les tokens du design avec 70 ms de décalage et une pulsation (.985) ; les couleurs passent par les transitions des ressources | Montre que les pièces partagent un contrat et se règlent ensemble (mécanisme de C) | Clic | Concept C (étape 1), staggers GSAP | Reduced : changement immédiat, sans pulsation |
| Accueil, « Quatre familles » | **Moment fort 1** : section épinglée, défilement horizontal des 4 panneaux en scrub ; v0.4 : la **graisse** du nom de chaque famille passe de 460 à 800 et son approche se resserre en arrivant au centre (Chivo n'a pas d'axe de largeur) | Fait sentir l'étendue du catalogue et sa signature typographique | Scroll (pin + scrub 1) | ScrollTrigger (`pin`, `scrub`, `containerAnimation` pour les tweens internes), https://gsap.com/docs/v3/Plugins/ScrollTrigger/ ; idée d'axe variable : React Bits *Variable Proximity*, https://reactbits.dev/text-animations/variable-proximity | < 1024 px : panneaux empilés, entrée en cascade (`batch`) ; reduced : empilés et immobiles |
| Accueil, « Deux gestes » | **Moment fort 2** : démonstration collante à droite. La rangée active fait passer du code (copier) au contenu du zip (télécharger) par révélation `clip-path`, puis les fichiers entrent en cascade. Copie et téléchargement fonctionnent vraiment | Prouve que les deux gestes sont réels, au lieu de les décrire | Scroll (rangée active) et clic | Magic UI *Animated List*, https://magicui.design/docs/components/animated-list (cascade de lignes) | < 1024 px : les deux vues sont empilées, révélation à l'entrée ; reduced : les deux visibles |
| Accueil, « Douze tokens » | **Moment fort 3** (non épinglé) : témoins collants ; chaque jeton qui atteint 62 % de l'écran s'allume et applique sa valeur Fleuve aux trois composants témoins ; en remontant, il rend la valeur Planche | Le contrat devient concret : on voit chaque token agir | Scroll (entrée / sortie, réversible) | ScrollTrigger `onEnter` / `onLeaveBack` ; concept C | Même comportement (changement d'état, pas de mouvement) ; reduced : pas d'atténuation des lignes |
| Accueil, titres h2 | Mots qui montent depuis un masque | Variante courte, différente du hero | Scroll (entrée, une fois) | GSAP SplitText (`mask: 'words'`) | Reduced : affichés |
| Accueil, « Contribuer » | Le parcours (dossier, demande de fusion, relecture, publication) se dessine et ses étapes apparaissent | Une vraie séquence, montrée comme un chemin | Scroll (scrub 0,8) | Tracé SVG par `stroke-dashoffset` (GSAP core) | Reduced : tracé complet |
| Toutes les pages, case → fiche | Un voile gris de la couleur de la scène grandit depuis la case jusqu'au plein écran (FLIP manuel en `transform`, 550 ms `expo.inOut`), puis navigation ; la fiche entre par un fondu et un scale .985 → 1 | Continuité : la pièce devient sa page | Clic sur le pied de case | GSAP Flip (principe), https://gsap.com/docs/v3/Plugins/Flip/ ; freefrontend *Tilt Grid Content Reveal* (partie FLIP seulement), https://freefrontend.com/code/tilt-grid-content-reveal-2026-03-07/ | Reduced : navigation directe |
| Catalogue, grille | Première arrivée en cascade (`batch`, 50 ms) ; à chaque filtre (catégorie, recherche, réglables, animées), **Flip** : les cases gardées glissent, les nouvelles entrent (scale .94 → 1). v0.3 : états finaux explicites et `clearProps` à la fin du Flip | Le filtrage se lit comme un réarrangement, pas comme un rechargement | Chargement, saisie, clic | GSAP Flip, https://gsap.com/docs/v3/Plugins/Flip/ | Reduced : remplacement immédiat |
| Catalogue, chargement | Squelette à la forme des cases (shimmer), puis contenu | Attente lisible | Chargement | — | Reduced : squelette fixe |
| Fiche, onglets de code | Indicateur qui glisse sous l'onglet actif (260 ms) | Situe le fichier affiché | Clic, flèches du clavier | ui.shadcn.com (onglets accessibles) | Reduced : déplacement immédiat |
| Fiche, version du code | Passage Tailwind ↔ CSS : les fichiers et l'aperçu sont régénérés, le code remonte en fondu (300 ms) | Montre que les deux versions donnent le même rendu | Clic | — | Reduced : immédiat |
| Fiche, réglages | L'aperçu (iframe) suit les tokens avec la durée du design. Les lignes modifiées de `tokens.css` s'allument en vert puis s'éteignent (1,2 s), et un point signale l'onglet `tokens.css` | Relie le réglage au code qu'on emporte (mécanisme de C) | Changement de réglage | Concept C (étape 1) | Reduced : surbrillance sans fondu |
| Fiche, largeur d'aperçu | Fondu de l'iframe pendant le changement de largeur. La largeur n'est **jamais animée** : il faut de vraies media queries | Évite un saut brutal | Clic | — | Reduced : immédiat |
| Fiche, copier / télécharger | « Copier le code » devient « Code copié » avec toast ; « Télécharger » passe en chargement, puis « Zip téléchargé » | Retour d'action en moins de 100 ms | Clic | details.so (inspiration, détails de produits réels) | Identique |
| Header, menu du thème (v0.3) | Le menu clair / sombre / système descend de 6 px en fondu (200 ms, sortie 120 ms) ; le changement de thème est immédiat | Micro-interaction §12 ; un fondu de toute la page ralentirait le geste | Clic, clavier (flèches, Échap) | ui.shadcn.com, menu déroulant (rôles et clavier) | Reduced : immédiat |
| À propos, hero (v0.6) | Les mots du titre basculent en place depuis des masques (yPercent 115, rotation 8° → 0) ; cinq vraies pièces du catalogue (calendrier, interrupteur, boutons, notification, curseur) arrivent de loin en tournoyant (±22°, scale .7) et s'assemblent, légèrement inclinées, comme posées sur une table ; puis trois faits (« Licence MIT », « 0 € », « Aucun compte ») et les étiquettes des pièces apparaissent. Les pièces restent utilisables | Montre le message « libres, sans compte ni achat » avec de vraies pièces, au lieu de photos sans rapport | Chargement (après le splash) | GSAP SplitText (`mask: 'words'`) ; principe des pièces « en apesanteur » : React Bits *Magnet*, https://reactbits.dev/animations/magnet (réécrit avec `quickTo`) | < 1024 px : trois pièces en colonne, départs courts ; reduced : affichées, immobiles |
| À propos, pièces du hero (v0.6) | Au pointeur (souris), chaque pièce et chaque fait flottent selon leur profondeur (`quickTo` sur xPercent / yPercent) ; au scroll, elles se démontent (montent et tournent chacune dans sa direction, scrub 0,7) | Rend la composition vivante et lie le geste au propos « pièces libres » | Pointeur fin ; scroll (scrub) | GSAP `quickTo`, ScrollTrigger | Coupé sous 1024 px, au tactile et en reduced |
| À propos, « Le catalogue aujourd'hui » (v0.6) | Tuiles en mosaïque (13 ressources sur deux rangées, 12 tokens, 3 designs, 2 versions, 0 compte) révélées en `clip-path` (100 ms d'écart) ; grands compteurs qui montent ; un carré par ressource, dans la couleur de sa famille, qui se pose (70 ms) avec la légende des vrais comptes ; les 12 jetons s'allument un à un ; les 3 pastilles de design arrivent ; la bascule Tailwind / CSS glisse et revient ; « Créer un compte » se raye. Toutes les valeurs viennent du registre et du contrat | Rend le contenu du catalogue visible d'un coup d'œil (demande explicite de Sidy de mettre les chiffres en scène) | Scroll (entrée, une fois) | React Bits *Count Up*, https://reactbits.dev/text-animations/count-up (principe) ; révélation `clip-path` | Mobile : une ou deux colonnes ; reduced : valeurs finales, tout affiché |
| À propos, « Copier, Régler, Livrer » (v0.4) | **Moment fort** (seule section épinglée de la page, 220 % de scroll) : une barre de progression se remplit ; l'étape active passe en graisse 800, les autres en 460 et s'estompent ; la scène passe par révélation `clip-path` du code (copiable) aux pièces vivantes, qui changent de design en direct (Planche, Fleuve, Latérite), puis au zip dont les fichiers entrent en cascade (téléchargeable) | Raconte le parcours réel d'une ressource avec de vraies pièces | Scroll (pin + scrub 0,8), réversible | ScrollTrigger `pin` + `scrub` ; idée de scène qui change avec l'étape : sections « sticky storytelling » primées sur awwwards.com (inspiration seulement) | < 1024 px : empilé, chaque vue se révèle à l'entrée, le design change en traversant « Régler » ; reduced : tout affiché, design Planche |
| À propos, titres de section (v0.4) | Mots qui montent depuis un masque | Rythme de lecture, variante de celui du hero | Scroll (entrée, une fois) | GSAP SplitText (`mask: 'words'`) | Reduced : affichés |
| À propos, promesses et liste (v0.4) | Les rangées arrivent de la gauche en cascade (70 ms) | Lecture rangée par rangée | Scroll (`batch`, une fois) | GSAP `ScrollTrigger.batch` | Reduced : affichées |
| À propos, « Pour qui » (v0.7) | **Moment épinglé** (160 % de scroll, desktop) : à gauche, un manifeste en très grand (« Pour les développeurs Angular qui ont mieux à faire que réécrire, une fois de plus, un calendrier accessible. ») se lit mot à mot (opacité 0,16 → 1) ; à droite, le code « avant » d'un calendrier écrit à la main s'écrit ligne à ligne (`clip-path`), chaque « À faire » se raye et reçoit une coche ; puis le code s'efface et le vrai calendrier du catalogue prend sa place | Montre ce que la pièce épargne au développeur, avec la pièce elle-même : l'idée est l'avant / après | Scroll (pin + scrub 0,8), réversible | ScrollTrigger `pin`, `scrub` ; GSAP SplitText (`words`) ; lecture au scroll inspirée des textes « scroll-reveal » de React Bits, https://reactbits.dev/text-animations/scroll-reveal | Mobile : rien d'épinglé, séquence jouée une fois, l'avant reste au-dessus de l'après ; reduced : état final (lignes rayées, calendrier visible) |
| À propos, « Comment c'est fait » (v0.7) | Photo de Lagos (16/10) révélée en masque ; panneau posé sur le bas de la photo, avec la même marge à gauche et à droite, qui ne déborde jamais (code en retour à la ligne, extraits courts) ; les 4 vues sont empilées dans la même cellule : l'ancienne s'efface pendant que la nouvelle se révèle de haut en bas (fondu croisé, 550 ms) ; le point actif suit la progression du scroll dans la section (desktop) ou le toucher | Illustre chaque point par la chose elle-même, sans saut de hauteur | Scroll (desktop), clic, clavier | ScrollTrigger `onUpdate` (progression) ; fondu croisé GSAP | Mobile : panneau sous la photo, choix au toucher ; reduced : changement immédiat |
| À propos, « Contribuer » (v0.5) | Le bloc du dossier se révèle (`clip-path`), ses lignes entrent en cascade (50 ms), puis les 4 étapes du parcours montent | Montre ce qu'on dépose, dans l'ordre | Scroll (entrée, une fois) | GSAP timeline, staggers | Reduced : tout affiché |
| À propos, « Qui le développe » (v0.4) | Le portrait de Sidy se révèle de bas en haut et dézoome (1,18 → 1), les quatre carrés de famille se posent sur son coin, puis son nom monte lettre par lettre et les cartes de liens arrivent en cascade (v0.5 : bande sombre pleine largeur) ; parallaxe léger du portrait | Met l'auteur en valeur, avec la marque du site | Scroll (entrée, une fois ; parallaxe en scrub) | GSAP SplitText (`chars`), `clip-path` | Reduced : affichés, immobiles |
| À propos, défilement (v0.4) | Lenis sur cette page aussi (synchronisé avec ScrollTrigger, coupé en reduced) | Rend le moment épinglé et les parallaxes fluides | Scroll | Lenis 1.3.28 | Coupé en reduced |
| Header, menu, dialogue, toasts | Bordure du header à 8 px de scroll ; menu plein écran (descente de 6 px, liens en cascade de 40 ms) ; recherche ⌘ K (fondu + 6 px) ; toasts qui montent de 12 px | Micro-interactions §12 | Scroll, clic, clavier | — | Reduced : immédiat |

### Animations propres des ressources (v0.3)

Les ressources du catalogue peuvent avoir leurs propres animations. Le site, lui, garde GSAP ; une ressource publiée n'en dépend jamais.

- **Registre** : champ `motion` de chaque ressource, ou `null`.

  ```js
  motion: {
    resume: 'Chaque notification glisse depuis la droite en entrant, puis repart de la même façon.',
    moments: ['entree', 'sortie'],          // entree | sortie | survol | ouverture | changement
    technique: 'animate.enter / animate.leave d’Angular, @keyframes CSS'
  }
  ```

  À reporter dans `MetaRessource` (ADR 0004) par l'architecte : `readonly motion: { resume: Texte; moments: readonly Moment[]; technique: string } | null`.
- **Règles** : sobres et utiles ; uniquement `transform` et `opacity` (plus la hauteur de `::details-content` avec `interpolate-size`) ; durées tirées de `--ngs-duration` ; jamais de rebond.
- **Technique** : CSS (`@keyframes`, transitions), ou Angular 22 `animate.enter` / `animate.leave` (ils posent une classe et attendent la fin de l'animation, documentation v22.3 : https://angular.dev/guide/animations). `@angular/animations` n'est pas utilisé : les deux API ne se mélangent pas dans un même composant.
- **Toujours désactivables**, par trois voies :
  1. l'input `animations` (`input(true, { transform: booleanAttribute })`), relié à l'hôte par `host: { '[class.ngs-sans-animation]': '!animations()' }` ;
  2. la classe `.ngs-sans-animation` sur n'importe quel parent (`:host-context(...)` en CSS ; variante `in-[.ngs-sans-animation]:` en Tailwind, avec `!` pour primer) ;
  3. `prefers-reduced-motion` : les animations sont écrites dans `@media (prefers-reduced-motion: no-preference)` (CSS) ou `motion-safe:` (Tailwind). Sans animation, `animate.leave` retire l'élément tout de suite.
- **Ressources animées de démonstration** :

  | Ressource | Animation | Moments | Technique |
  | --- | --- | --- | --- |
  | Notifications | Entrée et sortie qui glissent de 16 px depuis la droite (1,75 × et 1 × `--ngs-duration`) | entrée, sortie | `animate.enter` / `animate.leave` |
  | Questions fréquentes | La réponse se déplie (hauteur), descend de 4 px en apparaissant, la flèche pivote | ouverture | transition sur `::details-content`, `@keyframes` |
  | Carte de séjour | La photo se pose (1,06 → 1) ; au survol, la carte monte de 2 px et la photo zoome (1,03) | entrée, survol | `@keyframes`, transitions |
  | Calendrier | Au changement de mois, les jours glissent de 12 px dans le sens de navigation | changement | `[animate.enter]` sur une grille clée par le mois |
  | Hero avec photo (v0.4) | Entrée : la photo se dévoile (`clip-path`) et se pose (1,08 → 1), puis titre, texte et boutons montent en cascade (délais 1 ×, 1,6 ×, 2,2 × `--ngs-duration`). Sortie : le hero s'efface en montant de 12 px | entrée, sortie | `@keyframes` ; sortie par `animate.leave="hero-sortie"` posé par le parent sur `<ngs-hero-restaurant>` (règle `:host(.hero-sortie)`) |
  | Barre de navigation (v0.4) | Entrée : la barre descend de 8 px, puis liens et action en cascade (45 ms) ; liens du menu replié qui glissent à l'ouverture | entrée, ouverture | `@keyframes` et délais |
  | Carte de séjour (v0.4) | Sortie ajoutée : retirée d'une liste, la carte s'efface en rétrécissant (.96) | sortie | `animate.leave="sejour-sortie"` (règle `:host(.sejour-sortie)`) |

  Pourquoi la sortie passe par l'hôte : `animate.leave` agit sur un élément retiré du template où il est écrit ; le hero et la carte sont retirés par le template parent. La règle `:host(.…-sortie)` vit dans le CSS du composant (dans les deux versions ; en Tailwind, dans le petit fichier `.component.css` déjà prévu pour les `@keyframes`).
- **Interface** : badge « Animée » (`.ngs-badge--anime`, icône Phosphor `wave-sine`) sur les cases et la fiche ; filtre « Animées seulement » dans les options du catalogue (`?animees=1`) ; ligne « Animations » dans les métadonnées de la fiche ; réglage **« Animations »** (activé par défaut) dans les réglages de la fiche. Il recharge l'aperçu avec ou sans la classe, et ajoute `[animations]="false"` au bloc « Utilisation ». Si le système demande moins de mouvement, l'aperçu reste sans animation et le réglage le dit.
- **Rejouer (v0.4)** : pour les ressources dont `motion.rejouer` est renseigné (hero, barre de navigation, carte de séjour), deux boutons fantômes à côté de l'aperçu : « Rejouer l'entrée » (recharge l'aperçu) et « Rejouer la sortie » (pose la classe de sortie sur l'hôte, comme `animate.leave`, puis recharge l'aperçu pour revoir l'entrée). Désactivés quand les animations sont coupées. Champ du registre : `motion.rejouer: { entree: true, sortie: 'hero-sortie' }`.
- **Bouton global du site** : il n'existe pas aujourd'hui (le site suit seulement `prefers-reduced-motion`). Proposition, à valider : un interrupteur « Réduire les animations » dans le menu du thème du header (même panneau, sous les trois choix), gardé dans un cookie `ngs_motion`, appliqué avant le premier rendu par le même script (classe `ngs-motion-reduite` sur `<html>`, lue par `NGS.motion.reduit` et les règles reduced-motion du CSS), et qui coupe aussi les animations des aperçus.

**Synthèse :**
- **Moments forts** : accueil : 1. familles épinglées ; 2. démonstration des gestes ; 3. tokens qui s'allument. À propos : « Copier, Régler, Livrer » épinglé, puis (v0.7) « Pour qui » épinglé, séparés par « Pourquoi ».
- **Effets liés au pointeur** : le bouton magnétique et la profondeur de la vitrine (deux au maximum).
- **Transitions de pages** : sortie et entrée de toutes les pages, et morph case ↔ fiche (View Transitions). Splash au premier chargement.
- **Lenis** : **oui, sur l'accueil et sur « À propos » (v0.4)**, pour les moments scrubés. Il est coupé en reduced-motion et ignoré dans `pre`, les dialogues et le menu. Ancres gérées avec un décalage de 80 px.
- **Poids JS mesuré**, en gzip, depuis le CDN :

  | Bibliothèque | Poids |
  | --- | --- |
  | GSAP 3.15.1 | 28,5 Ko |
  | ScrollTrigger | 18,0 Ko |
  | Flip | 9,7 Ko |
  | SplitText | 3,6 Ko |
  | Lenis 1.3.28 | 5,4 Ko |
  | **Total** | **≈ 65 Ko** |

  Pas de Three.js. Tailwind « navigateur » sert uniquement à la maquette.
- **Licences** : GSAP est sous licence « Standard No Charge » (gratuite, pas OSI), utilisée **uniquement par le site**. Lenis est sous licence MIT.

## Components

Tous sont dans `components.css` et montrés dans tous leurs états sur `design/design-system/index.html`.

| Composant | Classes | Notes |
| --- | --- | --- |
| Bouton | `.ngs-btn` (plein), `--secondary` (contour), `--ghost`, `--danger` (réservé), `--sm` / `--lg` / `--icon` / `--block` | États `.is-loading` et `.is-done` (libellés `__label-idle` / `__label-done`) |
| Lien | `.ngs-link`, `--rest` | Trait qui se dessine, flèche qui avance de 3 px |
| Header, navigation | `.ngs-header`, `.ngs-nav-link` (« Catalogue » ouvre le méga-menu ; pastille de famille, `aria-current`), `.ngs-search-trigger` + `.ngs-kbd` | Menu plein écran sous 1024 px : `.ngs-menu` |
| Recherche | `.ngs-dialog` + `.ngs-results` | Combobox, flèches, Entrée, Échap ; ⌘ K, Ctrl K ou `/` |
| Champs | `.ngs-field`, `.ngs-input`, `.ngs-input-wrap`, `__help`, `__error` | — |
| Badges | `.ngs-badge` + `.ngs-cat-*`, `--reglable`, `--provisoire`, `--neutre` | — |
| Puce de filtre | `.ngs-chip` | Lien réel vers `/<categorie>` ; active dans la couleur de la famille |
| Contrôles | `.ngs-switch`, `.ngs-seg` (radiogroup, flèches), `.ngs-swatch`, `.ngs-range` | — |
| **Case de planche** | `.ngs-case` (`__stage` + `__foot`) | Seule carte du site. La scène est interactive, le pied ouvre la fiche |
| Bloc de code | `.ngs-code`, `.ngs-tabs--dark`, `.ngs-copy`, `.tok-*` | Toujours sombre ; Shiki au build en production |
| Toasts | `.ngs-toasts` / `.ngs-toast` (`--success`, `--error`) | Région `aria-live` |
| États | `.ngs-skeleton`, `.ngs-state` (vide), `.ngs-state--error` | — |
| Méta, tableau | `.ngs-meta`, `.ngs-table` | — |
| Aperçu et réglages | `.ngs-preview`, `.ngs-panel` + `.ngs-contrast` | Contraste de l'action calculé en direct |
| Méga-menu | `.ngs-mega` (`__grille`, `__liste`, `__lien`, `__compte`) | Familles, types de composants et de blocs, secteurs, avec compteurs ; s'ouvre au clic ou au survol (120 ms), se ferme avec Échap |
| Facettes | `.ngs-facettes`, `.ngs-facette` (`details`), `.ngs-option` (`.is-vide`), `.ngs-filtre-actif`, `.ngs-select`, `.ngs-tiroir` | Colonne collante en desktop, tiroir en mobile |
| Badge secteur | `.ngs-badge--secteur` | Neutre, avec icône Phosphor du secteur |
| Réglages repliables | `.ngs-reglage` (`details`), `__valeur`, `__corps` | La valeur courante reste lisible même replié |
| Vitrine | `.ngs-vitrine` (`__cadre`, `__barre`, `__page`, `__piece`, `__flottant`), `.ngs-etiquette` | Composant signature du hero |
| Pied de page | `.ngs-reseaux` / `.ngs-reseau`, `.ngs-signature` (`__mono`, `__texte`) | Liens dans `config.js` (`auteur`), signature vers le portfolio |
| Splash | `.ngs-splash` (CSS critique en ligne dans le `<head>`, SVG en ligne) | Valeurs de marque recopiées de `tokens.css` : en Angular, ce bloc va dans `index.html` |
| Thème du site (v0.3) | `.ngs-theme` (`__menu`, `__titre`, `__option`, `__coche`), `.ngs-header__github` | Bouton icône + menu de trois `menuitemradio` ; le lien GitHub du header est masqué sous 30rem (il reste dans le menu mobile) |
| Badge « Animée » (v0.3) | `.ngs-badge--anime` | Contour de contrôle, icône `wave-sine` |
| Marque | `.ngs-brand` | Logo NgShelf (symbole `ngshelf-logo` du sprite : tuiles « n » et « g », planche orange, équerres en contour) suivi du seul texte « Shelf » (le logo contient déjà « ng », lecture « ng Shelf ») ; en sombre, tuiles claires `#ededf0`. Les carrés 2×2 aux couleurs de famille ont quitté la marque. Nom accessible : « Accueil de NgShelf » sur le lien de l'en-tête ; `role="img"` + `aria-label="NgShelf"` dans le tiroir et le pied (logo et « Shelf » masqués aux aides techniques) |

**Pages de la maquette** : accueil, catalogue, fiche, et **À propos** (`a-propos.html` ; v0.4 : page vitrine de niveau 1, avec Lenis et un moment fort épinglé). Contenu de « À propos » (v0.6) : hero avec de vraies pièces en apesanteur, « Le catalogue aujourd'hui » en tuiles (valeurs du registre), « Pour qui » en manifeste et avant / après épinglé, « Comment c'est fait » avec panneau illustré, « Copier, Régler, Livrer » avec de vraies pièces, pourquoi (gratuit, MIT, sans compte), pour qui (rangée éditoriale), comment c'est fait (photo de Lagos et liste), contribuer (arborescence d'un dossier de ressource et parcours), qui le développe (bande sombre, zone forcée en `data-theme="sombre"`, liens en cartes) (photo fournie par Sidy, `sidy-360.webp` / `sidy-540.webp`, recadrage 4:5, alt « Sidy Mohamed Saizonou »), contribuer (lien GitHub provisoire tant que `NGS.site.depot` vaut `null`), qui le développe (nom complet et liens lus dans `config.js`, `NGS.site.auteur`, rien n'est recopié dans la page).

**Ressources de démonstration** (provisoires, registre `design/maquette/js/registre.js`) :
- 5 composants : interrupteur, calendrier, curseur, champ e-mail, notifications ;
- 1 bloc : questions fréquentes ;
- 3 designs : Planche, Fleuve, Latérite ;
- 0 template : la catégorie s'affiche en état vide.

## Taxonomie, navigation à grande échelle

Vocabulaire de l'ADR 0004, recopié dans `design/maquette/js/registre.js` (`NGS.types`, `NGS.secteurs`). Les libellés sont dans `textes.fr.js` (`type.*`, `secteur.*`).

| Axe | Valeurs | Interface |
| --- | --- | --- |
| Catégorie (famille) | `composant`, `bloc`, `template`, `design` (routes au pluriel) | Couleur de famille, puce, facette radio, méga-menu |
| Type | 45 types contrôlés (bouton, champ, carte, modale, navbar, hero, footer, pricing, témoignages, landing…) | Badge en couleur de famille (« Navbar », « Carte »), facette à cases, 8 types visibles puis « Afficher les n autres types », méga-menu |
| Secteur | voyage, restaurant, transport, santé, immobilier, éducation, commerce, finance, événementiel, beauté et bien-être, sport, SaaS, associatif, créatif | Badge neutre avec icône Phosphor, facette à cases avec icônes, entrée « Par secteur » du méga-menu, titre « Secteur : Restaurant » |
| Design | Planche, Fleuve, Latérite | Réglage de la fiche, « Habiller avec un design » sur l'accueil |

- **Catalogue** :
  - desktop : colonne de facettes collante (Famille, Type, Secteur, Options) ;
  - sous 1024 px : tiroir (bottom sheet) ouvert par « Filtres (n) », avec « Tout effacer » et « Voir les résultats (n) ».
  - Les compteurs de chaque facette tiennent compte des autres filtres. Une valeur vide reste visible, en grisé.
  - Filtres actifs en puces retirables, tri (« Les plus récentes », « De A à Z »), pagination par 24.
  - L'état vit dans l'URL : `?c=…&type=…&secteur=…&q=…&tri=…`. Un changement de filtre n'est pas une navigation, donc pas de transition de page.
- **Fil d'Ariane** de la fiche : Catalogue / famille / type / titre, ce qui préfigure la route `/<categorie>/<type>/<slug>`. La maquette garde `ressource.html?r=<slug>`.
- **Ajouts proposés au vocabulaire** (à valider par Sidy et l'architecte) :
  - aucun ajout pour l'instant ;
  - le curseur de valeur est rangé sous `champ`, faute de type `curseur` dans le vocabulaire validé.

## Évolutions prévues (à ne pas faire maintenant)

- **Dépendances d'une ressource** (ADR 0004, décision 4) :
  - paquets npm, avec la commande `npm install` à copier ;
  - autres ressources requises (« Nécessite : … » avec liens).
  - L'emplacement est déjà réservé sur la fiche : section « Dépendances », qui affiche « Aucune : seulement Angular 22 » et une ligne grisée.
  - Le zip et le JSON de registre suivront dans leur propre lot.
- Version anglaise (`textes.en.js`), CLI.
- Bouton global « Réduire les animations » du site (proposition ci-dessus, section Motion).

## Do's and Don'ts

| À faire | À éviter |
| --- | --- |
| Montrer des pièces qui fonctionnent | Des captures à la place des composants |
| Une couleur de famille seulement pour repérer, avec son nom écrit | La couleur de famille en décor |
| Le noir pour agir | Le violet, les dégradés, les halos, le verre dépoli |
| Les blocs de code sombres | Une page sombre |
| Varier les entrées de section (masques, `clip-path`, Flip, tracé) | Le même fondu partout |
| Des textes centralisés dans `textes.fr.js` | Des chaînes en dur dans les composants |

Autres interdits :
- eyebrow en capitales ;
- `→` sur chaque lien ;
- chiffres inventés (les compteurs viennent du registre) ;
- faux avis ;
- monospace hors code ;
- GSAP, Tailwind ou bibliothèque d'icônes dans une ressource publiée.

## Responsive

| Largeur | Comportement |
| --- | --- |
| 320–639 px | Header : marque, recherche, thème, menu (GitHub dans le menu sous 480 px) ; une colonne ; scène des cases réduite ; calendrier à cellules de 30 à 44 px ; recherche en icône ; menu plein écran ; segments d'aperçu en icônes seules sous 400 px |
| 640–1023 px | Planche sur 2 colonnes ; familles empilées ; gestes empilés |
| 1024–1919 px | Recherche du header en icône (sans raccourci) jusqu'à 1280 px, pour laisser la place à « À propos » et au thème ; planche sur 3 colonnes, puis 4 dès 1280 px ; familles épinglées en horizontal ; fiche : aperçu 8/12 et réglages 4/12 (collants), puis 3/6/3 dès 1280 px |
| ≥ 1920 px | Conteneur élargi à 112rem, planche sur 4 colonnes plus larges, typographie au maximum de son clamp |

- **Débordement horizontal** : aucun, vérifié automatiquement à 320, 390, 768, 1024 et 2560 px (hors zones défilantes prévues : code, onglets, puces, piste des familles).
- **Cibles tactiles** : 44 px.
- **Exception** : le calendrier descend à 30 px par cellule sous 360 px (7 colonnes obligatoires).

## Textes

- **Source unique** : `design/maquette/js/textes.fr.js`, environ 360 clés (page « À propos », thème et animations ajoutés en v0.3).
- Les pages HTML gardent le même texte en dur, pour rester lisibles sans JS, et portent `data-t="clé"`.
- Un contrôle automatique vérifie que le HTML et le dictionnaire sont identiques : 0 écart sur 282 éléments (4 pages, v0.3).
- Version anglaise : un fichier `textes.en.js` avec les mêmes clés. Elle n'est pas faite en v1.
- **En Angular** : clés `$localize` / `@@clé`.
