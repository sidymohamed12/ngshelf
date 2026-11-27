# 0011 — Motion du site : périmètre GSAP et Lenis, transitions de page, mouvement réduit

## Statut

accepté (2026-11-27, décisions de Sidy). Précise l'ADR 0005. Arbitrage : points 3, 8, 15.

## Contexte

Plan et ADR 0005 limitent GSAP et Lenis à l'accueil ; `DESIGN.md` les emploie aussi sur « À propos » (Lenis), le catalogue et la fiche (GSAP). La maquette fait des transitions **entre documents** avec un repli GSAP ; l'ADR 0005 prévoit les transitions du **router** sans repli. Sidy demande pourquoi pas les deux.

## Options (transitions)

1. **Router seul** (recommandé). Toute navigation interne d'une SPA hydratée est un `pushState` : seule cette voie s'applique.
2. Router + `@view-transition { navigation: auto }`. La seconde ne joue que pour un chargement de document de même origine (lien sans `routerLink`, retour vers une autre entrée de document) ; elle rejoue sur le splash ; elle partage les pseudo-éléments `root` avec le router (l'en-tête bougerait) ; Firefox n'a pas les transitions entre documents (à recontrôler).
3. Entre documents seul (maquette). Impossible dans une SPA.

## Décision

- **Option 1.** `withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated })`, nom `contenu` sur la zone principale, morph case ↔ fiche par `apercu-ressource` (480 ms), saut en mouvement réduit et si seuls les paramètres changent. Pas de règle `@view-transition`, pas de nom `root` ni `entete`.
- **Pas de repli GSAP (voile)** : GSAP n'anime jamais une route (ADR 0005), le morph natif suffit, le public sans View Transitions est marginal. La fiche charge ses données par `ResolveFn` avant la capture.
- **Périmètre** : GSAP sur accueil, À propos, catalogue, fiche (chunks lazy, chargeur unique mémorisé). Lenis sur accueil et À propos, une instance, arrêtée avant une transition de page. Jamais dans une ressource.
- **Mouvement réduit** : `prefers-reduced-motion` seulement en v1 ; **pas de bouton « Réduire les animations » ni de cookie `ngs_motion`** avant une validation ultérieure. Un seul `MotionService` (signal `mouvementReduit`) lu par GSAP, Lenis, transitions et splash. Splash : absent en mouvement réduit.
- Si le bouton est ajouté : réutiliser la classe `.ngs-sans-animation` des ressources, un cookie fonctionnel de plus à citer dans la politique cookies.

## Conséquences

- Le plan (lot 9) et l'ADR 0005 portent un renvoi. À écrire au lot 3 : `withViewTransitions`, `MotionService`, test Playwright (aucune transition en mouvement réduit ni sur changement de paramètres).
- Le designer retire le repli GSAP de ses tableaux ou le marque « maquette seulement ».

## Sources

Consultées le 2026-11-27. https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available (officiel, 2025-10-16). Transitions entre documents : non revérifiées dans cette passe (supposition). https://angular.dev/guide/routing/route-transition-animations (officiel, cité par l'ADR 0005).
