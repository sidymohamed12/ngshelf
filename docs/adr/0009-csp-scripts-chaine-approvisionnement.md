# 0009 — CSP stricte, scripts d'amorçage, bibliothèques et polices sans CDN

## Statut

accepté (2026-11-27, décisions de Sidy). Arbitrage : points 11 et 16.

## Contexte

La CSP du projet (`public/_headers`) vaut `script-src 'self'`. La maquette met en ligne le script de thème et celui du splash, et charge GSAP, Lenis, Tailwind (navigateur) depuis jsDelivr. Le site est prérendu : tout le HTML est identique pour tous les visiteurs.

## Options (scripts)

1. **Fichiers externes** (recommandé). Une requête de plus, aucune dépendance de build.
2. Script en ligne + hash dans la CSP. Hash à recalculer et à écrire dans `_headers` à chaque changement ; `security.autoCsp` d'Angular est documenté non compatible avec le SSR (prérendu statique non vérifié).
3. Nonce. Impossible sans calcul à chaque requête (la doc Angular exige un nonce unique par réponse) : contraire au site statique.

## Décision

- **Aucun script en ligne.** `public/theme-init.js` (externe, bloquant, cache court) pose `data-theme-choix`, `data-theme` et `meta[name=theme-color]`. **Le splash n'a pas de script d'amorçage** : markup et CSS dans `index.html`, filet CSS à 1,2 s, sortie anticipée par Angular après `whenStable()` (minimum 600 ms depuis `first-paint`).
- **CSS en ligne autorisé** (`style-src 'unsafe-inline'`, de toute façon requis par les styles de composants d'Angular). `inlineCritical: false` et `withNoIncrementalHydration` restent.
- **Pas de CDN** : GSAP (3.15.1) et Lenis (1.3.29 au 2026-11-26) en paquets npm à **version exacte**, importés dynamiquement dans `afterNextRender` par les features qui s'en servent ; jamais `gsap/all`. Tailwind compilé par `@tailwindcss/postcss` ; `@tailwindcss/browser` n'existe qu'en maquette. Polices Chivo auto-hébergées. Aucun `preconnect` tiers.
- Supply chain : `package-lock.json` commité, `npm ci` en CI, `npm audit` et mises à jour relues.
- Licence GSAP : le site l'embarque, les zips jamais (règle de l'ADR 0002).
- Trusted Types : à essayer en `Content-Security-Policy-Report-Only` (compatibilité GSAP et Lenis inconnue), pas en v1 bloquante.

## Conséquences

- Test CI : aucun `<script>` exécutable en ligne ni attribut `on…=` dans `dist/`.
- `theme-init.js` à compléter (`theme-color`). Budget initial JS aligné (450 Ko dans le HANDOFF, 500 kB en avertissement dans `angular.json`).
- Si un script en ligne devient inévitable : passer par l'option 2, avec un nouvel ADR.

## Sources

Consultées le 2026-11-27. Angular, sécurité et CSP : https://angular.dev/best-practices/security (officiel). Licence GSAP : https://gsap.com/community/standard-license/ (officiel, page du 2025-05-30). Versions : registre npm (officiel).
