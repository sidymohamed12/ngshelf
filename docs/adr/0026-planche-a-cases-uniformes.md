# 0026 — Planche à cases uniformes

## Statut

proposé (2026-11-28). Amende l'ADR 0023 (cases adaptées à l'aperçu : le rapport de la case ne vient plus de `apercuCase`) et l'ADR 0007 (le champ `tailleCase` est supprimé), et précise le nombre de colonnes de l'ADR 0018 (pas de sixième colonne). L'ADR 0017 (aperçu manipulable) est inchangé.

## Contexte

Sidy demande une planche régulière : toutes les cases de la même taille, la zone d'aperçu arrondie en haut, le texte dessous, comme sur une grille de cartes de référence qu'il a envoyée. Le contenu et le style de nos cartes restent (titre, type, secteurs, badge « Animée », « Voir la fiche »). Jusqu'ici la planche était une mosaïque : cases larges ou hautes (`tailleCase`), rapport de la scène pris sur `apercuCase` (ADR 0023), donc des cases de 334 à 575 px de haut côte à côte.

## Décision

1. **Une seule taille de case.** La zone d'aperçu (`.ngs-case__stage`) a le même rapport pour toutes les ressources : `--ratio-case: 4 / 3` (`tokens.css`). Les cases ne s'étirent plus sur plusieurs colonnes ni plusieurs rangées. Les rangées ont toutes la même hauteur (`grid-auto-rows: 1fr`) : un pied de case plus long (badges sur deux lignes) ne décale pas la rangée suivante.
2. **`tailleCase` supprimé.** Le champ disparaît du `meta.json`, du validateur (un `tailleCase` laissé dans un meta est refusé comme champ inconnu), de l'index, du modèle et de l'accueil. `apercuCase` reste, avec un autre rôle : les dimensions de rendu de l'aperçu.
3. **Mise à l'échelle « contain ».** Avec `apercuCase`, l'iframe garde `largeur × hauteur` et est réduite de `min(largeur de la zone / largeur déclarée, hauteur de la zone / hauteur déclarée)`, centrée dans les deux sens : rien n'est coupé. Sans `apercuCase` (petits composants), l'iframe est rendue à 520 px de large au moins et remplit la zone.
4. **Pas de bande visible.** Quand le rapport déclaré diffère de 4 / 3, l'espace restant (de 0 à 51 px, mesuré de 390 à 2560 px) prend le fond de la page d'aperçu : un token par design et par mode, `--apercu-fond-planche`, `--apercu-fond-fleuve`, `--apercu-fond-laterite` (`tokens.css`, valeurs de la surface du contrat). Les réglages poussés à l'aperçu (habillage de l'accueil) déplacent aussi ce fond. Avant que l'aperçu soit prêt, le fond neutre de la case reste.
5. **Colonnes.** Planche générale : 1 colonne sous 40 rem, 2 dès 40 rem, 3 dès 64 rem, 4 dès 80 rem, 5 dès 120 rem (la sixième colonne de l'ADR 0018 disparaît : à 2560 px, 5 colonnes de 480 px montrent mieux l'aperçu). Planche à côté des filtres : 1, 2 dès 40 rem, 3 dès 80 rem, 4 dès 110 rem, 5 dès 140 rem.
6. **Squelettes.** Ceux de la planche reprennent la même case (même zone au même rapport, même pied) : pas de saut de mise en page au chargement.
7. **Accueil.** La planche composée à la main (`DISPOSITION_PLANCHE`, tailles variables) devient une liste ordonnée de douze ressources (`SLUGS_PLANCHE`) dans la même grille. Douze : la dernière rangée est pleine à 1, 2, 3 et 4 colonnes. Elle reste à 4 colonnes au plus en très grand écran. La ressource ajoutée est la galerie en dôme.

## Conséquences

- Le choix du rapport 4 / 3 est un compromis : les blocs larges (hero, média extensible, FAQ) gardent une marge au-dessus et en dessous, les composants hauts (calendrier, carte de séjour, dôme) une marge de chaque côté ; ces marges ont la couleur de la page de l'aperçu et ne se voient pas.
- Une nouvelle ressource n'a plus de taille à choisir ; elle déclare `apercuCase` seulement si son contenu dépasse 520 px de large ou de haut.
- Le texte d'un aperçu de bloc large reste petit dans une case (échelle de 0,35 à 0,43 pour un aperçu rendu à 960 px, de 390 à 2560 px d'écran) : c'est une vignette, la fiche montre la taille réelle.
- `DESIGN.md` et `design/` décrivent encore la mosaïque (cases 1×1, 2×1, 2×2) : à reporter par `designer`.

## Sources

Mesures du dépôt (scripts Playwright, 2026-11-28) : zone de 337 × 253 px à 1440 px, 16 aperçus prêts, fond de la zone relevé pixel par pixel contre celui de l'aperçu, en clair et en sombre.
