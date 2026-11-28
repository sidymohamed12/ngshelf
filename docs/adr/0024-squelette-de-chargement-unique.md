# 0024 — Un seul squelette pour tous les chargements

## Statut

proposé (2026-11-28). Complète les ADR 0011 (mouvement réduit) et 0015 (aperçus des cases) : l'icône d'une case n'est plus l'état de chargement.

## Contexte

Les cases affichaient l'icône de la ressource pendant le chargement de leur aperçu, alors que la planche, la fiche et la recherche utilisaient chacune leur squelette. Sidy veut un seul état de chargement cohérent.

## Décision

1. Composant partagé `app-squelette` (`shared/components/squelette`) : formes `plein` (remplit son parent), `bloc` et `ligne`, libellé facultatif (région `status` pour les lecteurs d'écran). Il s'appuie sur `.ngs-skeleton` (tokens `--color-surface-hover`, `--color-shimmer`).
2. Utilisé par : cases de la planche (fantômes et placeholder `@defer` hors écran), aperçu d'une case (attente du viewport, du délai de démarrage, d'une place et chargement de l'iframe), cadre d'aperçu de la fiche, chargement du code CSS, index de recherche.
3. L'icône de la ressource reste le repli d'erreur : échec ou délai de 10 s dépassé, et « économie de données » (l'aperçu ne viendra pas ; un squelette éternel serait un faux chargement). Les designs, sans aperçu, gardent leur icône.
4. Mouvement réduit : le reflet est coupé par la règle `prefers-reduced-motion` de `components.css` (la préférence que lit `MotionService`) ; le bloc gris reste.

## Conséquences

- Un test vérifie qu'aucune icône n'est montrée en attente ni en chargement, et que l'icône apparaît en repli.
- L'application d'aperçus (iframe) garde son propre état d'erreur, sans chargement visible.
