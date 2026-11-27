# 0003 — Aperçus live isolés des ressources

## Statut

Renvoi (2026-11-27) : protocole `postMessage`, sandbox et en-têtes précisés par l'ADR 0010 (accepté) ; accepté par Sidy le 2026-11-27 (`docs/plans/arbitrage-contradictions-handoff.md`, section 3, question 8).

accepté (2026-11-27, décisions de Sidy). Auparavant : proposé (2026-11-26, révisé le 2026-11-26 pour les deux variantes de style de l'ADR 0002)

## Contexte

Le concept retenu (B, planche spécimen, avec le réglage de C) montre un mur de composants vivants sur l'accueil et le catalogue, et un aperçu de détail avec bascule 390 / 768 / 1280 px. Deux contraintes : le CSS du site (Tailwind, préflight, polices) ne doit pas contaminer l'aperçu ; la bascule de largeur doit déclencher les vraies media queries du composant. Le code des ressources viendra aussi de contributeurs externes. Nouveau : chaque ressource existe en deux variantes (Tailwind et CSS) au rendu identique (ADR 0002).

## Options

1. **Iframe vers une application d'aperçu séparée** (projet `apercus` du même workspace, prérendu, servi sous `/apercu/<slug>`).
   - Avantages : isolation totale du CSS et du JS, vraies media queries, `sandbox` pour le code contribué.
   - Coûts : chaque iframe démarre une app ; un mur de 8 à 30 iframes est lourd.
2. **Rendu dans la page, enveloppe en Shadow DOM.**
   - Avantages : léger, réglage par tokens instantané (variables posées sur l'hôte), transitions entre case et page possibles.
   - Coûts : pas de vraies media queries ; isolation seulement CSS. Tailwind v4 sous Shadow DOM pose un problème connu : il déclare ses variables internes avec `@property`, qui n'agit pas dans une racine Shadow DOM, et des utilitaires comme les ombres ou les anneaux disparaissent (tickets Tailwind #15005, #15799, discussion #16772).
3. **Mixte** : option 2 pour l'accueil et la grille du catalogue, option 1 pour le détail.

## Décision

Option 3, à confirmer par le spike, avec une règle de variante :

| Aperçu | Isolation | Variante rendue | Pourquoi |
| --- | --- | --- | --- |
| Accueil, grille du catalogue | Shadow DOM, `@defer (on viewport)` | **CSS + tokens** | pas de `@property`, pas de compilation Tailwind à injecter dans chaque racine, plus léger |
| Détail `/apercu/<slug>` | iframe `sandbox="allow-scripts"` (sans `allow-same-origin`) | **Tailwind** (variante par défaut) | prouve que la variante livrée par défaut marche ; l'app d'aperçu a son propre build Tailwind qui lit `registry/**/tailwind/*.html` |

Le visiteur voit le même rendu partout parce que l'équivalence visuelle des deux variantes est un contrôle bloquant de la CI (ADR 0002). Chaque ressource est chargée en lazy (`import()` généré depuis le registre). L'iframe reçoit le design, le mode clair / sombre et les réglages par `postMessage` (côté aperçu, origine du site vérifiée ; côté site, `event.source` comparé à la fenêtre de l'iframe, dont l'origine sandbox vaut `null`) ; les paramètres d'URL (`?design=…&mode=…`) ne servent qu'à l'état initial, lu côté navigateur, et le HTML prérendu de l'aperçu montre le design par défaut.

## Conséquences

- Le build produit deux applications (site et aperçus) ; le pipeline les assemble dans un seul dossier statique.
- `/apercu/*` est `noindex`, exclu du sitemap.
- Le spike mesure : démarrage d'une iframe d'aperçu, coût d'un mur de 8 composants en Shadow DOM, styles sous Shadow DOM, et confirme que la variante CSS n'a besoin d'aucun `@property`.
- Si une ressource ne peut pas être rendue en Shadow DOM (cas limite à découvrir), sa case affiche une capture statique générée au build, avec un lien vers le détail.

## Sources

Consultées le 2026-11-26.

- `@property` et Shadow DOM avec Tailwind v4 : https://github.com/tailwindlabs/tailwindcss/discussions/16772 et ticket #15799 corrigé par la PR #15975 (officiel, dépôt Tailwind ; état actuel du ticket #15005 à revérifier dans le spike)
- Contournements décrits (copie des `@property` au niveau du document) : https://meefik.github.io/2025/03/19/tailwindcss-and-shadow-dom (retour d'expérience)
