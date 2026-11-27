# Concepts — catalogue open source de composants Angular

Trois directions réellement différentes. Chacune part du métier (construire une interface à partir de pièces), pas d'une tendance. Fond blanc partout (`#FFFFFF`), une seule bibliothèque d'icônes, aucun élément du §10 (pas de halo, pas de texte en dégradé, pas d'eyebrow, pas de violet, pas de cartes identiques icône + titre + texte).

Contrastes **calculés** (formule WCAG 2.x) sur blanc et sur la surface de chaque concept. Les couleurs marquées « jamais en texte » n'ont pas le contraste pour du texte et ne servent qu'à des traits, repères ou aplats.

Point commun aux trois : les **aperçus live** des composants sont posés sur une surface neutre (blanc ou gris très clair, bordure fine), sans couleur du site autour, pour ne pas se battre avec le style des composants exposés.

---

## Concept A — « Vue éclatée »

**Idée tirée du métier.** Un composant n'est pas une image : c'est un empilement de couches (structure HTML, styles, états, logique TypeScript, accessibilité). Les manuels techniques montrent une machine en *vue éclatée* : chaque pièce décollée de la suivante, cotée, numérotée. Le site montre chaque composant de cette façon, puis le referme, prêt à copier. Univers : dessin technique, plan d'atelier, traits de cote, sans pastiche de « blueprint » bleu.

**Ambiance.** Précise, calme, outil de professionnel. Beaucoup de blanc, des traits fins, un seul rouge qui agit.

**Palette.**

| Nom | Hex | Rôle | Contraste blanc / surface |
| --- | --- | --- | --- |
| Blanc | `#FFFFFF` | canvas | — |
| Gris plan | `#F5F6F8` | surface, fond des aperçus | — |
| Encre | `#14161B` | texte, blocs de code (fond) | 18.10 / 16.74 |
| Graphite | `#5A606B` | texte secondaire, cotes | 6.32 / 5.85 |
| Rouge traceur | `#C8102E` | primary : action, focus, sélection | 5.88 / 5.44 (blanc sur rouge 5.88) |
| Jaune repère | `#F5B700` | accent : traits de cote, repères de la vue éclatée — **jamais en texte sur blanc** (1.80) ; lisible sur fond Encre (10.05) | 1.80 / 1.67 |
| Trait | `#DADDE2` | bordures | 1.36 (bordure décorative ; les contrôles auront une bordure plus foncée ≥ 3:1) |

**Paire typographique.**
- Titres et texte : **Schibsted Grotesk** (grotesque de presse, nette, chiffres solides) — https://fonts.google.com/specimen/Schibsted+Grotesk — OFL 1.1.
- Code et données uniquement : **JetBrains Mono** (lisibilité du code, ligatures désactivables) — https://www.jetbrains.com/lp/mono/ — OFL 1.1.

**Mise en page.** Grille 12 colonnes, conteneur `max-w-7xl`, alignement à gauche, titres larges. Les annotations (numéros de couche, traits de cote) vivent dans une colonne de marge, comme un plan.

```
ACCUEIL (desktop)
┌──────────────────────────────────────────────────────────────┐
│ NgShelf   Composants  Blocs  Templates  Designs   [Rechercher ⌘K] │
├──────────────────────────────────────────────────────────────┤
│                                    ┌ ─ ─ couche 5 : a11y ─ ┐  │
│ Des composants Angular             │ ┌ ─ couche 4 : états ┐ │  │
│ à copier, pas à installer.         │ │ ┌ couche 3 : style ┐│ │  │
│                                    │ │ │ ┌ HTML ────────┐ ││ │  │
│ Code ouvert, sans compte.          │ │ │ │ [date picker]│ ││ │  │
│ [Parcourir les composants]         │ │ │ └──────────────┘ ││ │  │
│ [Voir sur GitHub]                  └ ─ ┴ ─ ┴ ─ ─ ─ ─ ─ ─ ─┘  │
│                         (scène 3D : vraie pièce, éclatée)    │
├──────────────────────────────────────────────────────────────┤
│ MOMENT PINÉ : la pièce se referme au scroll ; chaque couche   │
│ s'arrête devant une ligne d'explication (gauche) + son code   │
├──────────────────────────────────────────────────────────────┤
│ Catalogue : grande liste typographique, l'aperçu live suit    │
│ le survol de chaque ligne                                     │
├──────────────────────────────────────────────────────────────┤
│ Copier / Télécharger : deux gestes, démontrés en vrai         │
├──────────────────────────────────────────────────────────────┤
│ Contribuer (GitHub) · Footer                                 │
└──────────────────────────────────────────────────────────────┘

DÉTAIL
┌─────────────────────────────┬────────────────────────────────┐
│ Sélecteur de date           │ [Aperçu] [Couches] [Code]      │
│ Composant · Angular 21      │ ┌────────────────────────────┐ │
│ [Copier le code]            │ │ aperçu live (iframe)       │ │
│ [Télécharger le composant]  │ │ 390 / 768 / 1280 px        │ │
│ Installation, dépendances,  │ └────────────────────────────┘ │
│ API (inputs, outputs)       │ code avec onglets .ts/.html/.css│
└─────────────────────────────┴────────────────────────────────┘
```

**Traitement image.** Peu de photos : le contenu, ce sont les composants. Visuels = vrais rendus des composants (captures nettes, ratio fixe 4/3 et 16/10), posés sur Gris plan avec une ombre douce. Pour la section « Contribuer », éventuellement des photos réelles de développeurs au travail (Pexels / Unsplash, provisoires), en noir et blanc léger pour rester dans le registre du plan.

**L'élément mémorable.** Le hero : un **vrai composant du catalogue en vue éclatée 3D** (couches de plaques translucides empilées dans l'espace, reliées par des traits de cote jaunes, chaque couche étiquetée). Au scroll, la pièce **se referme couche par couche** et devient le composant fonctionnel, cliquable. La 3D représente le produit lui-même, pas un décor (conforme au §14).

**Motion prévue.**
- Hero : assemblage de la scène au chargement (≈ 1.4 s), titre en SplitText par lignes depuis des masques. Poster WebP immédiat, Three.js chargé ensuite.
- Moment fort 1 (pin + scrub) : la pièce se referme, une couche par étape, texte et extrait de code synchronisés.
- Moment fort 2 : liste du catalogue où l'aperçu suit le pointeur (`quickTo`), traits de cote qui se dessinent (SVG).
- Catalogue : Flip sur les filtres ; transition de route carte → détail avec élément partagé.
- Détail : onglet « Couches » qui rejoue la vue éclatée en 2D (CSS 3D transforms), retour « Copié » avec coche dessinée.
- Lenis : oui (moments scrubés). Poids estimé : GSAP + ScrollTrigger + SplitText + Flip ≈ 70 Ko gzip, Lenis ≈ 4 Ko, Three.js ≈ 160 Ko gzip chargé à la demande sur l'accueil seulement.

**Relecture contre le brief.** Première version : un hero « code qui s'écrit tout seul » dans un faux éditeur, comme sur beaucoup de sites de librairies. Remplacé par la vue éclatée, qui montre ce que le site apporte de spécifique (comprendre et prendre une pièce entière) et justifie la 3D.

**Risques.** Le plus coûteux à produire (modèle de couches à construire, poster, fallback). Le mobile reçoit une version 2D (couches en CSS, pas de WebGL).

---

## Concept B — « Planche spécimen »

**Idée tirée du métier.** Les fonderies de caractères publient des *planches spécimen* : chaque lettre, chaque graisse, montrée en vrai, à prendre. Ici, la planche montre des **composants vivants** : un mur de pièces réelles, toutes utilisables sur place. On ne regarde pas une capture, on manipule. L'identité du site est typographique, presque éditoriale, et laisse les pièces parler.

**Ambiance.** Généreuse, joueuse, affiche imprimée. Grands titres, beaucoup d'air, pièces qui répondent au doigt.

**Palette.** Le noir agit (boutons, focus), et quatre couleurs servent **uniquement à repérer les catégories** (rôle précis, pas de décor) : une pastille et un trait dans la carte, la couleur du filtre actif.

| Nom | Hex | Rôle | Contraste blanc / surface |
| --- | --- | --- | --- |
| Blanc | `#FFFFFF` | canvas | — |
| Gris papier | `#F4F4F5` | surface, fond des aperçus | — |
| Noir d'impression | `#0B0B0C` | texte, primary (boutons pleins, focus) | 19.67 / 17.90 |
| Gris légende | `#5F5F66` | texte secondaire | 6.33 / 5.76 |
| Vert composants | `#0B6E4F` | catégorie « Composants » | 6.25 / 5.69 |
| Bleu blocs | `#1F4FD1` | catégorie « Blocs » | 6.78 / 6.17 |
| Rouille templates | `#B4361C` | catégorie « Templates » | 6.03 / 5.48 |
| Framboise designs | `#B0005E` | catégorie « Designs » | 6.98 / 6.35 |

Toutes passent AA en texte sur blanc et sur la surface. La catégorie est toujours écrite en toutes lettres à côté de sa couleur (jamais portée par la couleur seule).

**Paire typographique.**
- Titres et texte : **Bricolage Grotesque** (grotesque variable avec axe de largeur et de chasse optique : très grande en display, sage en texte) — https://fonts.google.com/specimen/Bricolage+Grotesque — OFL 1.1.
- Code uniquement : **IBM Plex Mono** — https://fonts.google.com/specimen/IBM+Plex+Mono — OFL 1.1.

**Mise en page.** Grille modulaire de type affiche : des cases de tailles différentes (1×1, 2×1, 2×2) qui s'emboîtent, alignées sur le conteneur, gouttières régulières. Chaque case contient un composant **fonctionnel**. Pas de cartes identiques : la taille de la case dépend de la pièce.

```
ACCUEIL (desktop)
┌──────────────────────────────────────────────────────────────┐
│ NgShelf                         Catalogue  GitHub  [⌘K]       │
├──────────────────────────────────────────────────────────────┤
│ Prenez les pièces.                                            │
│ Composants, blocs et templates Angular, en code ouvert.      │
│ [Parcourir le catalogue]                                     │
│ ┌────────┬───────────────┬────────┬────────┐                 │
│ │ toggle │  date picker  │ slider │ badge  │  ← vrais        │
│ │  (on)  │   (ouvert)    │  ──●── │        │    composants   │
│ ├────────┴──────┬────────┼────────┴────────┤    manipulables │
│ │ tableau trié  │ toast  │  formulaire     │                 │
│ └───────────────┴────────┴─────────────────┘                 │
├──────────────────────────────────────────────────────────────┤
│ MOMENT : on clique une case → elle grandit (Flip) jusqu'à     │
│ devenir la page de détail, code à côté                        │
├──────────────────────────────────────────────────────────────┤
│ Quatre familles : bandeau horizontal piné, une famille par    │
│ panneau (composants → blocs → templates → designs)            │
├──────────────────────────────────────────────────────────────┤
│ Copier / Télécharger · Contribuer · Footer                   │
└──────────────────────────────────────────────────────────────┘

CATALOGUE
┌──────────────┬───────────────────────────────────────────────┐
│ Filtres      │ ● Composants  ● Blocs  ● Templates  ● Designs │
│ catégorie    │ ┌──────┬──────┬─────────────┐                  │
│ type         │ │ live │ live │    live     │  grille mosaïque │
│ dépendances  │ ├──────┴──────┼──────┬──────┤  qui se réarrange│
│ Angular ≥    │ │    live     │ live │ live │  (Flip)          │
└──────────────┴───────────────────────────────────────────────┘
```

**Traitement image.** Presque aucune photo : les pièces sont vivantes. Les templates (pages complètes) sont montrés en captures plein cadre, ratio 16/10, qui défilent verticalement au survol pour révéler toute la page. Une photo réelle éventuelle pour « Contribuer ».

**L'élément mémorable.** Le **mur de composants vivants** du hero : tout fonctionne (on bascule le toggle, on ouvre le date picker, on trie le tableau), et une case cliquée **grandit en continu jusqu'à devenir sa page de détail** (transition Flip / View Transitions, élément partagé). Le « wow » vient du fait que rien n'est une image.

**Motion prévue.**
- Hero : la planche se compose au chargement, cases qui se posent en cascade avec un léger décalage de profondeur, titre en très grande taille dont l'axe de largeur de Bricolage s'anime (variable font) une fois.
- Moment fort 1 : case → page de détail (Flip + View Transitions), aussi utilisé dans tout le catalogue.
- Moment fort 2 (pin + scrub) : défilement horizontal des quatre familles, la couleur de catégorie prend la zone de titre à chaque panneau.
- Catalogue : filtres en Flip, la mosaïque se réarrange ; compteur de résultats qui se met à jour.
- Détail : bouton « Copier le code » avec retour « Copié » ; bascule de taille d'aperçu animée.
- Lenis : oui, léger (un seul moment scrubé). Poids estimé : GSAP + ScrollTrigger + Flip ≈ 60 Ko gzip, Lenis ≈ 4 Ko, pas de Three.js.

**Relecture contre le brief.** Première version : une grille de vignettes statiques avec survol, l'équivalent de n'importe quel catalogue. Changé en mur de pièces fonctionnelles, ce qui montre la promesse (du code qui marche) au lieu de la décrire.

**Risques.** Le hero dépend de composants réels : il faut au moins 6 à 8 composants prêts et beaux pour la maquette. Sur mobile, le mur devient une colonne de pièces que l'on fait défiler, toujours manipulables.

---

## Concept C — « Signal »

**Idée tirée du métier.** Angular moderne repose sur les **signals** : on change une valeur, et tout ce qui en dépend se met à jour, précisément. Le site rend ce principe visible. Une valeur (une couleur, un rayon, une densité, un thème) est un nœud ; des fils la relient aux composants ; quand on la change, une impulsion parcourt les fils et **chaque composant se met à jour en direct**. On ne montre pas des composants figés : on montre qu'ils se règlent.

**Ambiance.** Vive, précise, laboratoire de réglage. Lignes fines, une impulsion orange qui circule, un vert qui agit.

**Palette.**

| Nom | Hex | Rôle | Contraste blanc / surface |
| --- | --- | --- | --- |
| Blanc | `#FFFFFF` | canvas | — |
| Gris banc | `#F6F7F7` | surface, fond des aperçus | — |
| Encre | `#101314` | texte, fond des blocs de code | 18.66 / 17.39 |
| Gris mesure | `#586064` | texte secondaire | 6.42 / 5.98 |
| Vert réglage | `#00775A` | primary : action, focus, sélection | 5.55 / 5.17 (blanc sur vert 5.55) |
| Orange impulsion | `#F2600C` | accent : l'impulsion sur les fils, nœud actif — trait et icônes seulement (3.25, ≥ 3:1), **jamais en texte courant** | 3.25 / 3.03 |
| Orange texte | `#C2410C` | variante de l'accent si un texte doit le porter | 5.18 / 4.82 |

**Paire typographique.**
- Titres et texte : **Instrument Sans** (grotesque étroite et précise, bonne en grands titres serrés) — https://fonts.google.com/specimen/Instrument+Sans — OFL 1.1.
- Code et valeurs des nœuds uniquement : **Martian Mono** (mono large, très lisible en petits chiffres) — https://fonts.google.com/specimen/Martian+Mono — OFL 1.1.

**Mise en page.** Deux zones qui se répondent : à gauche les réglages (nœuds), à droite les pièces ; les fils SVG traversent la gouttière. Conteneur `max-w-7xl`, alignement à gauche, sections d'un écran.

```
ACCUEIL (desktop)
┌──────────────────────────────────────────────────────────────┐
│ NgShelf   Catalogue  Documentation  GitHub          [⌘K]      │
├──────────────────────────────────────────────────────────────┤
│ Des composants Angular                                        │
│ qui se règlent en direct.                                     │
│ [Parcourir les composants]                                   │
│                                                              │
│  ( couleur ●)─────────╮        ┌──────────┐                  │
│  ( rayon   8)──────╮  ╰───────▶│ bouton   │                  │
│  ( densité  )───╮  ╰──────────▶│ carte    │  ← changent      │
│  ( thème clair)─╰─────────────▶│ champ    │    en direct     │
│                  impulsion ▶   └──────────┘                  │
├──────────────────────────────────────────────────────────────┤
│ MOMENT PINÉ : un seul composant, le scroll ajoute un réglage  │
│ à la fois ; le code à côté change ligne par ligne             │
├──────────────────────────────────────────────────────────────┤
│ Catalogue : grille, tous les aperçus suivent les réglages     │
│ globaux posés dans une barre fixe (« thème de démo »)         │
├──────────────────────────────────────────────────────────────┤
│ Copier / Télécharger (le code copié contient vos réglages)    │
├──────────────────────────────────────────────────────────────┤
│ Contribuer · Footer                                          │
└──────────────────────────────────────────────────────────────┘

DÉTAIL
┌──────────────────┬──────────────────────────┬────────────────┐
│ Réglages         │ aperçu live              │ code généré    │
│ couleur ●        │                          │ (mis à jour    │
│ rayon ──●──      │  [composant]             │  avec les      │
│ taille S M L     │                          │  réglages)     │
│ [Réinitialiser]  │ 390 / 768 / 1280 px      │ [Copier le code]│
└──────────────────┴──────────────────────────┴────────────────┘
```

**Traitement image.** Pas de photo dans le hero : la démonstration est l'image. Templates montrés en captures 16/10. Une photo réelle éventuelle pour « Contribuer ».

**L'élément mémorable.** Le **graphe de réglages vivant** : l'utilisateur tourne une valeur et voit l'impulsion orange parcourir les fils jusqu'aux composants, qui changent instantanément. Et surtout : **le code copié contient ses réglages** (tokens personnalisés). C'est à la fois l'effet « wow » et une fonction utile, propre à ce site.

**Motion prévue.**
- Hero : les fils SVG se dessinent depuis les nœuds (`stroke-dashoffset`), puis une première impulsion part seule et règle les composants (une fois, ≈ 1.5 s) ; titre en SplitText par lignes.
- Couche interactive : impulsion à chaque réglage (GSAP MotionPath sur le fil), composants qui changent en transition de couleur / rayon.
- Moment fort 1 (pin + scrub) : un composant se construit réglage après réglage, le code évolue à côté.
- Moment fort 2 : catalogue qui se recolore entièrement quand on change le thème de démo (vague de mise à jour en cascade de gauche à droite).
- Catalogue : Flip sur filtres ; transition carte → détail.
- Lenis : oui, léger. Pas de Three.js (le graphe en SVG est plus net et plus léger). Poids estimé : GSAP + ScrollTrigger + SplitText + Flip + MotionPath ≈ 75 Ko gzip, Lenis ≈ 4 Ko.

**Relecture contre le brief.** Première version : un « playground » classique (panneau de props à gauche, aperçu à droite), présent sur beaucoup de documentations. Changé pour rendre visible le lien entre la valeur et les composants (fils + impulsion) et pour que ce réglage serve vraiment (code copié personnalisé). Le concept s'appuie sur une idée propre à Angular, pas transposable telle quelle à une autre librairie.

**Risques.** Demande que les composants du catalogue exposent des tokens communs (couleur, rayon, densité). Si les composants sont hétérogènes (chacun son style figé), le réglage global ne marche que sur une partie du catalogue : à confirmer côté architecture.

---

## Comparaison rapide

| | A — Vue éclatée | B — Planche spécimen | C — Signal |
| --- | --- | --- | --- |
| Source du « wow » | Scène 3D d'une vraie pièce qui se referme | Mur de composants réels manipulables, case → page | Réglage en direct propagé par des fils |
| 3D | Oui (Three.js, hero) | Non | Non |
| Coût de production | Élevé | Moyen | Moyen à élevé (dépend des tokens des composants) |
| Neutralité autour des aperçus | Forte (plan, gris) | Forte (planche blanche) | Moyenne (les réglages modifient les aperçus) |
| Valeur d'usage ajoutée | Comprendre l'anatomie d'un composant | Tester avant de copier | Copier un code déjà personnalisé |
| Poids JS estimé (accueil) | ≈ 235 Ko gzip dont Three.js à la demande | ≈ 65 Ko gzip | ≈ 80 Ko gzip |

Les trois tiennent dans le budget (JS < 450 Ko). Une combinaison est possible (par exemple B pour l'accueil et le catalogue, avec le réglage de C sur la page de détail), mais je recommande de choisir **un** concept porteur, et d'emprunter au plus un mécanisme à un autre.

Ma recommandation : **B** si le catalogue doit sortir vite et rester très neutre ; **C** si les composants partagent des tokens communs (c'est le plus singulier et le plus utile) ; **A** si Sidy veut absolument de la 3D dans le hero.

---

## Questions à trancher (en un seul bloc)

**Concept et nom**
1. Quel concept : A « Vue éclatée », B « Planche spécimen », C « Signal » (ou un mélange précis) ?
2. Quel nom : NgShelf, Établi, Calque, Copeau, Spécimen, ou un autre ? (disponibilité domaine / npm / GitHub non vérifiée)
3. Y a-t-il déjà un logo, une couleur ou une police imposés ? Sinon, je crée un logotype typographique distinct du bouclier Angular.

**Public et langue**
4. Langue du site : français seul, anglais seul, ou bilingue FR / EN ? (Un catalogue open source vise souvent un public mondial ; cela change tous les textes.)
5. Public visé : développeurs Angular du monde entier, ou d'abord la communauté francophone / sénégalaise ?

**Contenu et périmètre**
6. Que recouvrent exactement « designs » et « et autres » ? (thèmes de tokens, kits Figma, icônes, animations, layouts… ?)
7. Combien de ressources existent déjà, et pouvez-vous fournir 6 à 8 composants réels (code ou captures) pour la maquette ? Sinon, je conçois avec des composants de démonstration signalés comme provisoires.
8. Les composants partagent-ils des tokens communs (couleur, rayon, densité) ? Décisif pour le concept C.
9. Format du téléchargement : zip du composant standalone, schematic `ng add` / `ng generate`, commande CLI type `npx …`, ou les trois ?
10. Licence des ressources publiées (MIT ?) et lien vers le dépôt GitHub : existe-t-il déjà ?
11. Pages prévues en plus de l'accueil, du catalogue et du détail : documentation d'installation, « Contribuer », changelog, licence ?

**Choix visuels et techniques**
12. Mode sombre : à prévoir pour tout le site, seulement pour les blocs de code, ou pas du tout ? (Le fond des pages reste blanc par défaut ; les développeurs s'attendent souvent à un thème sombre : à décider.)
13. Bibliothèque d'icônes : je propose **Lucide** (ISC, paquet Angular officiel `lucide-angular`, trait régulier proche de l'univers code). Alternatives : Phosphor (MIT), Heroicons (MIT). Laquelle ?
14. 3D Three.js dans le hero : oui (concept A) ou non ? Lenis (scroll fluide) : d'accord sur l'accueil seulement ?
15. Photos : y a-t-il de vraies photos (équipe, contributeurs, événements) ? Sinon, quasiment pas de photos, les composants vivants servent d'images.
16. Outil de maquette : **HTML/CSS** (recommandé ici, pour tester la vraie motion et l'interaction des composants) ou **Claude Design** ?

**Git**
17. Le dossier `/Users/sidymohamed_12/Documents/projet` n'est pas un dépôt Git. Dois-je l'initialiser (`git init`, branche `dev`) et existe-t-il un dépôt distant GitHub où pousser la branche `docs/brief-concepts-design` et ouvrir la PR vers `dev` ?
