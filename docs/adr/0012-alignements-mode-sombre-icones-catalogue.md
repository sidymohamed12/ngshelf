# 0012 — Alignements : mode sombre, icônes, URL du catalogue

## Statut

proposé (2026-11-27). Arbitrage : points 2, 6, 7.

## Contexte

Le plan met le mode sombre hors périmètre (Q12), prévoit `@ng-icons/phosphor-icons` (Q13) ; la maquette a un mode sombre, un sprite d'icônes et `?c=` pour la catégorie. Le front les implémente déjà.

## Décision

1. **Mode sombre inclus en v1** : choix `clair`, `sombre`, `système` (défaut), cookie fonctionnel `ngs_theme` (un an, `SameSite=Lax`), attribut `data-theme="sombre"` posé par `theme-init.js` avant le premier rendu, jamais `localStorage`. La politique cookies cite `ngs_theme` et `ngs_variante`.
2. **Icônes : sprite SVG** `public/icons/sprite.svg` (Phosphor, MIT) via `IconeComponent`, noms typés, test liste = sprite. Pas de `@ng-icons`. Les ressources gardent des SVG en ligne.
3. **Catalogue** : les pages de chemin (`/composants`, `/blocs/navbar`, `/secteurs/restaurant`) sont prérendues et indexées (ADR 0004). `/catalogue` est l'explorateur global, `?c=` (catégorie), `type`, `secteur`, `q`, `tri`, `reglables`, `animees` y vivent dans l'URL : `noindex`, canonique vers le chemin concerné ou `/catalogue`. L'ADR 0004 gagne la ligne `/catalogue` dans son tableau (par renvoi).

## Conséquences

- Plan : Q12, Q13 et « Hors périmètre » sont périmés (ligne d'historique).
- Vérifier au lot 7 que `/catalogue?c=blocs` a bien pour canonique `/blocs`.

## Sources

Fichiers du dépôt lus le 2026-11-27 (`theme.service.ts`, `icones.ts`, `filtres.ts`, `indexation.service.ts`).
