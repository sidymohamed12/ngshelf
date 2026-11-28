# 0027 — Rendu « grand écran » des aperçus de blocs larges

## Statut

proposé (2026-11-28). Complète l'ADR 0026 (la taille de rendu `apercuCase` reste, un rendu nommé s'y ajoute) et l'ADR 0023 (taille de rendu déclarée). Les ADR 0015 et 0017 (plafond de 12 aperçus vivants, manipulation par prise de main) sont inchangés.

## Contexte

Sidy veut voir les galeries et les heros « complètement et mis en valeur » dans leur case : rendus à 960 px de large, ils prenaient leur disposition étroite (colonne ou panneaux resserrés). Il demande donc qu'ils soient rendus comme sur un écran de bureau (≥ 1440 px) puis mis à l'échelle pour tenir dans la case, et que les petits composants gardent un rendu étroit.

## Décision

1. **Champ `rendu` du `meta.json`.** Valeur facultative, `"grand-ecran"` seule pour l'instant (`RENDUS_APERCU`, `taxonomie.model.ts`). Un nom plutôt qu'une paire de nombres répétée dans sept fichiers : si la taille change, elle change à un seul endroit (`DIMENSIONS_RENDU`). `rendu` et `apercuCase` sont exclusifs (le validateur refuse les deux) ; un `rendu` inconnu est refusé.
2. **Taille du rendu grand écran : 1440 × 1080 px.** 1440 px est le seuil des grands écrans du site ; 1080 px donne le rapport 4 / 3 de la zone d'aperçu (`--ratio-case`, ADR 0026) : l'iframe remplit la zone, sans bande, à 390, 768, 1024, 1440, 1920 et 2560 px de page (mesuré : cadre égal à la zone, à 1 px d'arrondi près). Un bloc moins haut que 1080 px (galeries, heros : 350 à 640 px) y est centré par sa propre page, et le fond de la page d'aperçu prolonge celui de la zone (ADR 0026 décision 4).
3. **L'index porte le résultat, pas le nom.** `scripts/registre/sorties.ts` écrit `apercuCase: { largeur: 1440, hauteur: 1080 }` dans l'index pour une ressource `rendu: "grand-ecran"`. La planche, la fiche (« autres ressources ») et l'accueil lisent le même champ : aucun code d'affichage ne change, et le mode vient de la même donnée partout.
4. **Ressources passées en grand écran** (7) : `galerie-accordeon`, `galerie-roue`, `galerie-dome`, `hero-restaurant`, `mur-images`, `media-extensible`, `revelation-iris`.
   - Galeries et heros : à 960 px la mise en page est serrée (mur d'images : titre sur quatre lignes et texte collé aux images ; galeries : 930 px utiles) ; à 1440 px elle prend sa largeur de bureau (titre sur trois lignes, 1024 à 1152 px utiles). C'est ce que Sidy veut voir.
   - `media-extensible` et `revelation-iris` : pleine largeur de page ; rendus à 1440 × 1080 px, le cadre épinglé remplit la case de bord à bord.
5. **Ressources restées en rendu étroit** : tous les composants (boutons, champ e-mail, interrupteur, curseur, notifications, calendrier, carte de séjour) ; `questions-frequentes` (colonne de 684 px max : la même à 960 et à 1440 px, le grand écran ne ferait que la réduire à 0,23, soit des questions de 3,3 px, contre 0,46 aujourd'hui) ; `navbar-restaurant` (à 1440 px la barre est un bandeau de 68 px de haut qui ferait 16 px dans la case, alors que le rendu étroit montre la version repliable et lisible).
6. **Manipulation.** Inchangée : l'iframe est la même, seule sa taille de départ change. Mesuré à 1440 px : clic dans l'aperçu, bouton « Manipuler l'aperçu », Échap, molette rendue à la page avant la prise de main, molette reçue par l'aperçu après (média extensible : course de défilement parcourue). Comme l'iframe est réduite, la molette l'avance de `1 / échelle` : la course du média extensible (1734 px d'iframe, soit environ 410 px de molette à 1440 px de page) est plus longue qu'avec le rendu à 960 px (897 px d'iframe, environ 315 px de molette) ; le reste de la molette passe à la page, comme avant.
7. **Performance.** Plafond de 12 aperçus vivants inchangé et atteint (12 iframes à 2560 × 1440 px). Mesures Chromium headless (3 essais, avant et après, même page `/catalogue`) : octets des aperçus identiques (10,4 Mo, mêmes images), LCP de la page 64 à 80 ms dans les deux cas, 0 image de plus de 50 ms au défilement dans les deux cas, temps CPU du navigateur 1,7 à 1,8 s dans les deux cas, mémoire non distinguable du bruit (1,2 à 1,5 Go au total en headless, écart entre essais plus grand qu'entre états).

## Conséquences

- Échelle d'affichage des 7 aperçus : 0,22 (page de 1024 px, case de 319 px) à 0,29 (2560 px, case de 417 px), 0,23 à 1440 px. Le texte de corps (13 à 16 px) tombe à 3 ou 4 px : il n'est pas lisible, c'est une vignette ; les titres (35 à 67 px) restent lisibles (8 à 16 px), les boutons de heros à peine. La fiche montre la taille réelle.
- Les blocs plafonnés en largeur (galeries, hero avec photo : 1024 px) n'occupent que 70 % de la largeur de la case à 1440 px ; plus larges que la colonne de 720 px de l'ADR 0023, ils paraissent donc plus petits qu'avant dans leur case. Les blocs pleine largeur (mur d'images, média extensible, révélation en iris) occupent toute la case. Rendre les galeries plus grandes sans rogner demanderait une case de rapport plus large (non retenu : ADR 0026).
- Un aperçu rendu à 1440 px charge les mêmes ressources qu'à 960 px (mêmes images) ; seul le calcul de mise en page change.
- Une nouvelle ressource large déclare `"rendu": "grand-ecran"` ; une ressource à contenu étroit ne déclare rien (ou `apercuCase` si elle dépasse 520 px).

## Sources

Mesures du dépôt (scripts Playwright, Chromium headless, 2026-11-28) : cadre et zone des 19 cases à 390, 768, 1024, 1440, 1920 et 2560 px en clair et en sombre ; tailles de police relevées dans les aperçus ; comparaison avant/après sur un build de la branche précédente.
