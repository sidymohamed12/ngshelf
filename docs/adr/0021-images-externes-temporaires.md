# 0021 — Images externes temporaires dans les aperçus

## Statut

proposé (2026-11-28), **temporaire**. Assouplit, pour `/apercu/*` seulement et pour la seule directive `img-src`, la CSP de l'ADR 0010 (« aucune ressource externe »). La CSP du site (ADR 0009) ne change pas.

## Contexte

Sidy demande de réutiliser, en attendant des images locales, les images externes des composants d'origine (`picsum.photos`, `images.unsplash.com`) à la place des huit illustrations SVG locales (`projects/apercus/public/images/*.svg`).

## Décision

1. **Une source de vérité.** `projects/apercus/src/app/images-demo.ts` : l'interrupteur `IMAGES_EXTERNES_ACTIVES`, la liste blanche `HOTES_IMAGES_TEMPORAIRES` et les images de chaque scène (`imagesDemo('galerie-roue')`…). Les scènes `registry/blocs/*/demo/` n'écrivent aucune URL. Les SVG locaux restent là ; **retour en local en un geste** : `IMAGES_EXTERNES_ACTIVES = false`, puis retirer les trois hôtes de `img-src` dans `public/_headers` (`verifier:dist` le réclame).
2. **Hôtes admis, uniquement en `img-src` de `/apercu/*`** : `picsum.photos`, `images.unsplash.com`, et **`fastly.picsum.photos`** : `picsum.photos` répond 302 vers ce sous-domaine (constaté le 2026-11-28), et une CSP contrôle aussi les redirections ; sans lui aucune image ne charge. Rien d'autre (ni `pbs.twimg.com`, ni caractères, ni scripts, ni connexions : `connect-src 'none'`, `script-src 'self'` inchangés). Les serveurs de développement n'envoient pas de CSP (`angular.json` : seulement `Access-Control-Allow-Origin`) : rien à y assouplir.
3. **Zips.** Les scènes `demo/` ne sont jamais livrées : aucun zip ne contient d'URL tierce (vérifié par `verifier:dist`, qui lit aussi les zips non compressés).
4. **Garde-fou** (`scripts/dist/hotes-tiers.ts`, appelé par `npm run verifier:dist`) : échec si, dans `dist/…/apercu/`, un hôte hors liste blanche et hors hôtes neutres (espaces de noms, liens de documentation) apparaît ; échec si un hôte d'image temporaire apparaît hors de `/apercu/` (site, zips) ; échec si la CSP du site admet un hôte tiers ou si celle de `/apercu/*` diffère de la liste blanche (ou n'est pas vide quand l'interrupteur est coupé). Tant que l'interrupteur est actif, `verifier:dist` écrit un **avertissement** rappelant le caractère temporaire.
5. **Textes alternatifs.** Les photos sont aléatoires : `alt` générique (« Photographie de démonstration n »). Les titres des galeries (« Forêt verte »…) ne décrivent plus l'image ; à reprendre avec les vraies images.
6. `media-extensible` n'avait pas d'image externe d'origine : photo picsum 1043 choisie.

## Conséquences

- **Vie privée.** Une page d'aperçu (la fiche d'une galerie, mais aussi les cases du catalogue qui en montrent) fait des requêtes vers `picsum.photos`, `fastly.picsum.photos` et `images.unsplash.com` : l'adresse IP et le user-agent du visiteur leur sont exposés. `Referrer-Policy: no-referrer` s'applique aux aperçus (pas de page d'origine transmise). Aucun cookie du site n'est envoyé (origine opaque). À remplacer vite par des images locales ; mention à reprendre dans la politique de confidentialité tant que c'est actif.
- Disponibilité et poids dépendent de tiers ; hors ligne, les galeries montrent des cadres vides.
- Mesuré : sous la CSP de `_headers` (serveur de contrôle), aucune violation, images chargées.

## Sources

`scripts/dist/hotes-tiers.ts`, `public/_headers`, composants d'origine (zip fourni par Sidy, lecture seule), `curl -I https://picsum.photos/id/1015/900/1200` (302 vers `fastly.picsum.photos`) le 2026-11-28.
