# 0006 — Identité NgShelf : nom, préfixe `ngs`, logo, splash, couleurs

## Statut

accepté (2026-11-27, décisions de Sidy). Remplace le nommage de l'ADR 0002 (préfixe, fichier pont Tailwind) et précise la forme du splash de l'ADR 0005. Étude préalable : `docs/plans/ngshelf-identite.md` (corrigée par les décisions ci-dessous, notamment sur le logo).

## Contexte

Le nom de travail précédent et son préfixe de deux lettres n'avaient plus de sens une fois le nom « NgShelf » retenu. Rien n'est publié (pas de dépôt, pas de front Angular) : c'est le moment le moins coûteux pour renommer le contrat public (tokens, utilitaires, cookies, fichiers générés).

## Décisions

1. **Nom** : NgShelf. Le préfixe `ng-` seul est écarté (réservé à Angular).
2. **Préfixe `ngs`**, en une passe scriptée sur tout le projet : tokens `--ngs-*`, classes `ngs-*`, utilitaires Tailwind `*-ngs-*` (`bg-ngs-action`, `rounded-ngs`), espace de noms `window.NGS`, cookies `ngs_theme`, `ngs_variante`, `ngs_motion` (renommés sans migration : maquette jamais partagée). Les mots contenant la séquence en dehors du préfixe (`rgb`, `srgb`, `rrggbb`) restent intacts. Fichier pont Tailwind : `ngshelf-theme.css`.
3. **Ancien nom de travail** supprimé partout, archives (`design/brief.md`, `design/concepts.md`, `design/demos-concepts/`) et ADR comprises, remplacé par NgShelf. Seule l'étude `docs/plans/ngshelf-identite.md` le garde, comme document historique figé.
4. **Logo avec pieds, version « pieds vides »** (`design/logo/ngshelf-v1-corrige-pieds-vides.svg` : équerres triangulaires en contour). Cela remplace la recommandation « sans pied » de l'étude. Cadrage `viewBox="320 236 896 491"`. Favicon carré recentré (équerres pleines et épaisses pour rester lisibles à 32 px), apple-touch 180, icônes 192 et 512, symbole `ngshelf-logo` dans le sprite, `ngshelf-clair.svg` et `ngshelf-sombre.svg`.
5. **Mode sombre du logo** : tuiles claires `#ededf0`, planche orange, équerres de la couleur des tuiles. Tokens `--logo-tuile` et `--logo-etagere`.
6. **Marque en texte** : logo + « Shelf » seulement (le logo contient « ng »), lecture « ng Shelf ». Les carrés 2×2 aux couleurs de famille quittent la marque.
7. **Splash** : SVG en ligne et `@keyframes` CSS, sans GSAP. Scénario : la planche (équerres comprises) se pose (220 ms), la tuile « n » tombe avec impact et rebond (dès 100 ms), puis la tuile « g » (dès 220 ms). Minimum affiché 600 ms, plafond 1,2 s, sortie par `clip-path` en 320 ms, premier chargement d'un document seulement (pas de `sessionStorage`), masqué en mouvement réduit. Fond : blanc en thème clair, bleu nuit `#191f42` en thème sombre (tuiles claires, planche orange).
8. **Couleurs, option B** : bleu nuit et orange servent uniquement au logo, au splash, au favicon et à l'image sociale. Jamais en action, état, famille ni texte. Contrat de tokens (12 tokens `--ngs-*`) inchangé.

## Contrastes (calculés)

| Paire | Rapport |
| --- | --- |
| tuile `#191f42` / blanc | 15,96 |
| tuile claire `#ededf0` / canvas sombre `#111113` | 16,14 |
| tuile claire / surface sombre `#1a1a1e` | 14,85 |
| tuile claire / splash bleu nuit | 13,66 |
| orange / canvas sombre | 6,34 |
| orange / splash bleu nuit | 5,36 |
| orange / blanc | 2,98 (le logo est exempté du seuil, WCAG 1.4.3 ; la planche ne porte pas de texte) |

## Conséquences

- Le splash passe de 420 à 600 ms de minimum : à mesurer par le spike (LCP mobile ≤ 2,5 s, Lighthouse ≥ 90) ; sinon, option 2 de l'ADR 0005.
- À la sortie du splash sombre, le fond passe du bleu nuit au canvas sombre `#111113` (écart faible, masqué par le `clip-path`).
- L'orange du logo est proche de la famille Templates (teinte 14° contre 10°) : le logo n'apparaît qu'en en-tête, pied de page, splash et favicon, et les puces Templates portent leur nom écrit.
- Pas d'image sociale (`og:image`) produite à ce stade : à créer avec `ngshelf-clair.svg`.
- Le front Angular reprend le bloc du splash dans `index.html`, `ngshelf.svg` / le symbole du sprite, et les tokens `--logo-*`.
