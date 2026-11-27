# 0008 — Livraison des ressources : zips, mode sombre, densité

## Statut

proposé (2026-11-27). Arbitrage : points 5, 9, 10.

## Contexte

Trois écarts : l'ADR 0002 met seulement `ngshelf-theme.css` dans le zip Tailwind et `tokens.css` « facultatif » dans le zip CSS, la maquette met `tokens.css` dans les deux ; le mode sombre du code livré a trois sélecteurs (`.ngs-sombre`, `.dark`, `html.sombre`) ; la densité est prévue en `@utility`, le front a un pont `--spacing-ngs-N`.

## Décision 1 — Zips

| Zip | Fichiers |
| --- | --- |
| `<slug>-tailwind.zip` | `.ts`, `.html` (+ `.component.css` si `@keyframes`), `ngshelf-theme.css` (pont `@theme inline` **et** valeurs par défaut Planche clair), `tokens.css`, `README.md`, `LICENSE` |
| `<slug>-css.zip` | `.ts` (avec `styleUrl`), `.html`, `.css`, `tokens.css`, `README.md`, `LICENSE` |

`tokens.css` : valeurs du design choisi (ou « avec mes réglages »), `:root { … }` puis `.dark { … }` ; à importer **après** le pont. Facultatif pour le rendu clair par défaut, nécessaire pour un autre design ou le mode sombre ; le README le dit.

## Décision 2 — Sélecteur sombre

- Code livré : **`.dark`** (convention Tailwind et shadcn), posé sur `<html>` ou un parent. Les ressources lisent des variables et n'utilisent jamais `dark:` : l'utilisateur n'a rien à configurer dans Tailwind. Le README donne la ligne pour faire correspondre `.dark` à un autre sélecteur.
- L'iframe d'aperçu charge le `tokens.css` livré et bascule par `.dark` (l'aperçu doit prouver ce qui est copié).
- Interne, inchangé : `[data-theme="sombre"]` (site) et `.ngs-theme-X.ngs-sombre` (choix de design du site).

## Décision 3 — Densité

Pont `--spacing-ngs-1` à `-16` dans `@theme inline` (`calc(var(--ngs-density) * pas)`), **pas** de `@utility` : le namespace `--spacing-*` de Tailwind v4 génère tous les utilitaires d'espacement. Limite : 16 pas fixes. À confirmer par le premier test d'équivalence. Piste non décidée : pas en `rem` (suivi de la taille de police), à tester avec le designer.

## Conséquences

- Générateur de `tokens.css` à écrire (lot 4) ; l'ADR 0002 porte un renvoi ; la décision 5 de l'ADR 0002 (format de distribution) reste à confirmer par Sidy.
- Test d'équivalence visuelle : les deux variantes, sous 2 designs, clair et sombre (`.dark`).

## Sources

Fichiers du dépôt lus le 2026-11-27. Tailwind, `@theme inline` : https://tailwindcss.com/docs/theme (officiel, cité par l'ADR 0002).
