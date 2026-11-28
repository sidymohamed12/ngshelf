# 0023 — Cases adaptées à l'aperçu de chaque ressource

## Statut

proposé (2026-11-28). Amendé par l'ADR 0026 : la case ne prend plus le rapport de `apercuCase` (toutes les cases ont le même rapport, l'aperçu est mis à l'échelle dedans) ; `apercuCase` reste la taille de rendu. Complète les ADR 0015 et 0017 (aperçus des cases) ; la décision sur la taille de la scène (hauteur fixe de 13 rem, aperçu de 520 px réduit) est remplacée pour les ressources qui déclarent leur taille.

## Contexte

Sidy constate que des aperçus sont coupés dans les cases. Mesuré (Chromium, 19 ressources, de 390 à 2560 px) : la scène d'une case avait une hauteur de 280 px, quelle que soit la ressource ; les blocs dont le contenu mesure 460 à 840 px (galeries, heros, FAQ, calendrier, carte de séjour) n'en montraient que 32 à 85 %.

## Décision

1. **Taille de rendu déclarée.** Le champ facultatif `apercuCase: { largeur, hauteur }` du `meta.json` (entiers de 240 à 1600, marge de 16 px de l'aperçu comprise) dit à quelle taille l'aperçu est rendu. Il est validé par `scripts/registre`, copié dans l'index du catalogue et lu par la planche.
2. **La case prend le rapport.** La scène reçoit `aspect-ratio: largeur / hauteur` (classe `ngs-case__stage--ratio`, sans hauteur minimale) ; l'iframe garde `largeur × hauteur` et est réduite de `largeur de la case / largeur déclarée` : tout le contenu est visible, sans bande vide du côté de la largeur, quelle que soit la largeur de la case. Si une rangée étire la case (voisine plus haute), l'aperçu est centré verticalement.
3. **Sans `apercuCase`**, rien ne change (petits composants : aperçu de 520 px centré dans une scène d'au moins 13 rem).
4. **Valeurs retenues** (largeur × hauteur) : heros et sections pleine page 960 × 672 (mur d'images, présentation large) et 960 × 540 (média extensible, révélation en iris : le cadre épinglé joue sa boucle dans cette taille) ; galeries et blocs à colonne 720 × 492 à 592 ; hero avec photo 720 × 394 ; FAQ 720 × 330 ; calendrier 520 × 454 ; carte de séjour 520 × 470. Mesurées avec la hauteur du contenu + 32 px. Les cases « large-haute » du calendrier, du dôme et du hero avec photo passent à « normale » ou « large » : la hauteur vient désormais du rapport.
5. **Prise de main** (ADR 0017) : inchangée ; elle agit sur l'iframe réduite.

## Conséquences

- Une nouvelle ressource dont le contenu dépasse la scène par défaut déclare son `apercuCase` ; l'erreur de validation décrit le format.
- Le texte d'un aperçu réduit (jusqu'à 0,34 sur une case étroite de téléphone) devient petit : c'est une vignette, la fiche montre la taille réelle.
- La planche est un peu plus haute (cases de blocs de 320 à 575 px au lieu de 280).
- Les petits composants qui partagent une rangée avec un bloc gardent une case étirée, avec l'aperçu centré.

## Sources

Mesures du dépôt (scripts de vérification Playwright, 2026-11-28).
