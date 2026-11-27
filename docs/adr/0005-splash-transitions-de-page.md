# 0005 — Splash au chargement et transitions de page (View Transitions)

## Statut

Renvoi (2026-11-27, ADR proposés 0009 et 0011) : splash sans script d'amorçage (0009) ; périmètre de Lenis et GSAP, pas de transitions entre documents, pas de repli GSAP, mouvement réduit (0011). Corps inchangé.

Forme du splash (scénario, couleurs) et minimum affiché passé à 600 ms : précisés par l'ADR 0006 (2026-11-27). Le reste est inchangé.

accepté (2026-11-26, validation de Sidy relayée par le coordinateur) : splash plein écran plafonné si le LCP mobile tient, sinon non masquant ; transitions selon la décision 2.

## Contexte

Le site est prérendu (ADR 0001) : le HTML de chaque page arrive complet, puis Angular hydrate. `angular-sidy` impose un splash dans `src/index.html`, retiré une fois l'app prête, qui ne doit masquer le contenu ni aux robots ni si le JS échoue (`<noscript>` et minuteur CSS de sécurité), et respecte `prefers-reduced-motion`. Sidy veut aussi des animations de sortie entre pages. Le skill prévoit `withViewTransitions()` dans `provideRouter`.

Tension propre au prérendu : un splash opaque couvre un contenu déjà affiché, ce qui peut dégrader le premier affichage perçu et la mesure LCP (à mesurer, supposition).

## Décision 1 — Splash

Options :

1. **Splash plein écran, conforme au skill, plafonné.** Logo et indicateur en CSS en ligne, retiré par fondu après `ApplicationRef.whenStable()` (donc après l'hydratation) ; minuteur CSS de sécurité qui le retire seul au plus tard à 1,2 s (valeur à régler avec le designer) ; `<noscript><style>#splash{display:none}</style></noscript>` ; en `prefers-reduced-motion`, retrait sans fondu.
   - Avantages : identité forte dès la première image, conforme à la convention.
   - Coûts : masque un contenu déjà prêt pendant l'hydratation ; risque sur le LCP mobile.
2. **Splash non masquant.** Même déclenchement et même retrait, mais limité à une bande ou un voile partiel (logo et barre de progression) : le contenu prérendu reste visible et lisible dessous.
   - Avantages : aucun contenu masqué, LCP inchangé, toujours conforme à l'esprit du skill (indiquer que l'app se charge).
   - Coûts : effet moins marqué ; demande au designer une forme spécifique.

Recommandation : **option 1 si le spike tient le budget** (LCP mobile ≤ 2,5 s et Lighthouse performance ≥ 90 sur l'accueil prérendu, splash compris), sinon **option 2**. Dans les deux cas, le splash ne s'affiche qu'au premier chargement d'un document (les navigations suivantes sont des navigations du router, sans splash), et sa sortie s'enchaîne avec l'intro de l'accueil (à régler par le designer). Validé par Sidy.

## Décision 2 — Transitions entre pages

`provideRouter(routes, withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated }), …)`. `withViewTransitions` et `ViewTransitionsFeatureOptions` sont **stables depuis Angular 22.3**.

Compatibilité avec le prérendu : une fois le premier document chargé et hydraté, chaque navigation est une navigation du router dans la même page, donc une transition « même document » ; le prérendu ne change rien à ce mécanisme. Le seul point sensible est le chargement initial : `skipInitialTransition: true` évite qu'une transition capture la page pendant l'hydratation et le retrait du splash. Les transitions « entre documents » (`@view-transition { navigation: auto; }`) ne servent pas ici (rechargement complet seulement) et ne sont pas activées.

Règles :

- **Sortie et entrée en CSS** sur `::view-transition-old(contenu)` et `::view-transition-new(contenu)` ; `view-transition-name: contenu` posé sur la zone principale du layout seulement, l'en-tête et le footer ne bougent pas. Sortie ≤ 200 ms, entrée ≤ 300 ms (pendant la transition la page ne répond pas aux clics).
- **Sauter la transition** dans `onViewTransitionCreated` (`transition.skipTransition()`) quand : `prefers-reduced-motion: reduce` ; seuls les paramètres d'URL ou le fragment changent (filtres du catalogue, ancres de la doc) ; la route de destination est la même.
- **Sens de la transition** (vers le détail, retour à la liste) : par un attribut `data-transition` posé sur `<html>` dans `onViewTransitionCreated` d'après les routes source et destination, retiré à `transition.finished`. Pas de « types » de View Transitions : Firefox 144 ne les implémente pas.
- **Élément partagé** facultatif (case du catalogue vers l'aperçu de détail) : un seul `view-transition-name` à la fois, posé sur la case cliquée juste avant la navigation, sinon deux noms identiques annulent la transition. À décider avec le designer.
- Navigateurs sans View Transitions : le router navigue sans animation (amélioration progressive, aucun code de repli).
- Lenis (accueil seulement) est arrêté avant la transition et détruit à la sortie de l'accueil ; GSAP n'anime jamais un changement de route.

## Conséquences

- Le designer spécifie : forme du splash, enchaînement avec l'intro de l'accueil, durées et courbes de sortie et d'entrée, élément partagé oui ou non, comportement en mouvement réduit.
- Le spike vérifie : `skipInitialTransition` avec l'hydratation d'une page prérendue, saut de la transition sur un changement de paramètres, mesure du LCP avec splash.
- Tests Playwright : une navigation liste vers détail ne laisse aucun pseudo-élément `::view-transition` actif ; en `reducedMotion: 'reduce'`, aucune transition.

## Sources

Consultées le 2026-11-26.

- `withViewTransitions`, stable depuis v22.3 : https://angular.dev/api/router/withViewTransitions (officiel)
- `ViewTransitionsFeatureOptions` (`skipInitialTransition`, `onViewTransitionCreated`), stable depuis v22.3 : https://angular.dev/api/router/ViewTransitionsFeatureOptions (officiel)
- Guide des animations de transition de route, saut de transition et repli sans support : https://angular.dev/guide/routing/route-transition-animations (officiel, doc v22.3.0)
- Transitions « même document » Baseline depuis Firefox 144, sans les types de transition, publié le 2025-10-16 : https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available (officiel, équipe Chrome)
