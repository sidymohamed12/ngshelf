# 0002 — Registre de ressources, variantes Tailwind et CSS, contrat de tokens, distribution

## Statut

Renvoi (2026-11-27, ADR 0007 et 0008) : `meta.json` au lieu de `meta.ts` (0007) ; contenu des zips, sélecteur `.dark`, densité par variables `--spacing-ngs-N` (0008). Corps inchangé.

Confirmation (2026-11-27, décisions de Sidy) : la décision 5 (copier, zips et JSON de registre) est confirmée (`docs/plans/arbitrage-contradictions-handoff.md`, section 3, question 9).

Nommage (préfixe, nom du fichier pont Tailwind) : remplacé par l'ADR 0006 (2026-11-27), préfixe `ngs` et `ngshelf-theme.css`. Le reste de l'ADR est inchangé.

accepté (2026-11-26, validation de Sidy relayée par le coordinateur) pour les décisions 1 à 4 : deux variantes, tokens communs, **deux sources testées en CI** (option 3). La décision 5 (format de distribution) n'a pas été tranchée explicitement : elle reste à confirmer par Sidy ; si elle change, un nouvel ADR la remplacera.

## Contexte

Chaque ressource doit pouvoir être vue en vrai, copiée et téléchargée, et suivre les designs (thèmes de tokens) du concept retenu, « B avec le réglage de C ». Il faut une seule source de vérité pour la page, l'aperçu, le code affiché, les zips et un futur CLI. Nouvelle exigence : deux variantes de style par ressource, Tailwind v4 (défaut) et CSS classique + tokens, sans double maintenance si c'est possible.

Le contrat de tokens existe déjà en maquette (`design/design-system/contrat-tokens.css`, v0.1, 12 tokens `--ngs-*`, 3 designs en clair et sombre). Le préfixe `ngs` a été tranché ensuite (ADR 0006).

## Décision 1 — Un registre dans le dépôt, source unique

Dossier `registry/` versionné. Un script Node au build lit le registre et produit toutes les sorties : index du catalogue, code coloré, zips, JSON de registre, `sitemap.xml`. Aucune sortie n'est écrite à la main. Le modèle des métadonnées (catégorie, type, secteur, designs, tags, dépendances) est décrit dans l'[ADR 0004](0004-taxonomie-routes-registre.md).

Règles imposées à toute ressource : standalone, signals, `OnPush`, compatible prérendu (aucun accès navigateur hors `afterNextRender`), accessible, **aucune dépendance d'icônes** (SVG en ligne), ni GSAP ni Tailwind runtime, aucune valeur de couleur, police, rayon ou durée en dur (seulement les tokens).

## Décision 2 — Les tokens, une seule définition pour les deux variantes

Les tokens restent des **variables CSS `--ngs-*`** (le contrat). C'est le point commun des deux variantes : un design est un fichier qui donne des valeurs à ces variables, et ce même fichier sert en Tailwind comme en CSS.

**Variante CSS + tokens.** Le CSS du composant lit chaque valeur via `var(--ngs-color-action, #0b0b0c)`. Copié seul, il marche (valeurs de repli = design Planche clair) ; il suit un design dès que les variables sont posées.

**Variante Tailwind v4.** Un fichier de thème unique, `ngshelf-theme.css` (nom à aligner sur le nom du site), que l'utilisateur importe une fois après `@import "tailwindcss";`. Il contient :

```css
/* 1. Valeurs par défaut du contrat (design Planche clair) */
:root { --ngs-color-action: #0b0b0c; --ngs-radius: 10px; --ngs-density: 1; /* … */ }

/* 2. Pont vers Tailwind : utilitaires nommés qui lisent les tokens */
@theme inline {
  --color-ngs-action: var(--ngs-color-action);
  --color-ngs-surface: var(--ngs-color-surface);
  --radius-ngs: var(--ngs-radius);
  --radius-ngs-lg: calc(var(--ngs-radius) * 1.4);
  --font-ngs: var(--ngs-font-family);
  /* … */
}

/* 3. Densité : utilitaires fonctionnels multipliés par --ngs-density */
@utility p-ngs-* { padding: calc(var(--ngs-density) * --value(integer) * 1px); }
@utility gap-ngs-* { gap: calc(var(--ngs-density) * --value(integer) * 1px); }
/* idem px, py, h, w, min-h : liste fermée fixée dans le spike */
```

Le template utilise `bg-ngs-action`, `rounded-ngs`, `font-ngs`, `gap-ngs-14`, `duration-(--ngs-duration)`. Pourquoi `@theme inline` : les valeurs des tokens sont posées plus bas dans le DOM (classe de design, hôte d'aperçu) ; sans `inline`, Tailwind résout la variable là où elle est définie et le changement de design ne serait pas suivi (documentation Tailwind, section `@theme inline`). Pourquoi des noms préfixés `ngs` dans le thème : ils ne remplacent aucune couleur ni aucun espacement de l'utilisateur (on ne touche ni à `--spacing` ni à `--color-primary`).

Conséquence : un design (`designs/<slug>`) est livré en **un seul fichier de valeurs**, valable pour les deux variantes ; seul le pont `@theme` est propre à Tailwind, et il est identique pour toutes les ressources.

## Décision 3 — Produire les deux variantes : une source ou deux

Options :

1. **Une source Tailwind, variante CSS compilée.** On écrit le template en utilitaires ; le build compile, avec le compilateur Tailwind, les seuls utilitaires utilisés en un `<slug>.component.css` (tokens réécrits en `var(--ngs-…, repli)`), et le template garde les noms d'utilitaires.
   - Avantages : une seule source, générateur simple (Tailwind fait le travail), aucune divergence possible.
   - Coûts : la variante CSS n'est pas du « vrai » CSS lisible : template plein de classes utilitaires, CSS généré avec les variables internes de Tailwind (`--tw-*`) et ses règles `@property`, plus un petit reset à livrer (Tailwind suppose son préflight). Le public qui choisit « CSS » est justement celui qui ne veut pas d'utilitaires.
2. **Une source sémantique (`@apply`) et un transpileur maison qui produit les deux.** Template en classes sémantiques (`ngs-interrupteur__piste`), CSS source en `@apply` ; le build inline les utilitaires dans le template (variante Tailwind) et compile le CSS (variante CSS).
   - Avantages : deux sorties idiomatiques, une seule source.
   - Coûts : outil maison le plus risqué. Il doit traduire `:host` en classes d'hôte, les états de parent (`.x[aria-checked="true"] .y` devient `group` + `group-aria-checked:`), les descendants, les media queries ; il interdit `[class.x]` aux contributeurs. À maintenir à chaque version de Tailwind.
3. **Deux sources écrites à la main, une logique commune, équivalence testée en CI.** Le `.ts` est commun ; seuls le template (attributs `class`) et le CSS diffèrent. Deux contrôles automatiques : (a) **équivalence de structure** : les deux templates, attributs `class` retirés, doivent être identiques ; (b) **équivalence visuelle** : capture Playwright des deux variantes sous 2 designs, en clair et sombre, à 390 et 1280 px, écart de pixels sous un seuil à fixer.
   - Avantages : deux sorties idiomatiques et lisibles, outillage simple et standard, la divergence est détectée par la CI. Les 6 ressources de la maquette sont déjà écrites en CSS : il reste à écrire leur template Tailwind.
   - Coûts : le style est écrit deux fois (un template de plus par ressource, de l'ordre de 20 à 40 % du temps d'une ressource, estimation) ; les tests visuels demandent une image de référence stable (polices auto-hébergées, animations coupées).

Recommandation : **option 3 en v1**, avec ses deux contrôles bloquants en CI. L'option 2 est écartée (outil maison le plus coûteux pour un gain que l'option 3 obtient par des tests). Le spike produit aussi, pour 2 ressources, la sortie de l'option 1 : si Sidy juge le CSS généré acceptable, on bascule vers l'option 1 avant que le catalogue grossisse (point de décision à la fin du lot 4 ; une bascule ferait l'objet d'un nouvel ADR). Validé par Sidy le 2026-11-26.

Organisation d'une ressource (option 3) :

```
registry/<categorie>/<slug>/
  meta.ts                         # métadonnées typées (ADR 0004)
  <slug>.component.ts             # logique commune, sans styleUrl
  tailwind/<slug>.component.html  # variante par défaut
  css/<slug>.component.html
  css/<slug>.component.css        # var(--ngs-…, repli) uniquement
  demo/demo.component.ts          # démo commune aux deux variantes
```

Le build ajoute `styleUrl` au `.ts` de la variante CSS en sortie ; il n'y a donc qu'un seul fichier de logique à maintenir. Une animation `@keyframes` propre à une ressource vit dans un `tailwind/<slug>.component.css` minimal, seule exception au « pas de CSS » de la variante Tailwind.

## Décision 4 — Ce que voit le visiteur

- Sélecteur **Tailwind | CSS** sur la page de détail, Tailwind par défaut ; choix gardé dans un cookie fonctionnel (`ngs_variante`, `SameSite=Lax`, `Max-Age` un an), jamais `localStorage`.
- Le code coloré (Shiki, au build) de la variante par défaut est dans le HTML prérendu ; celui de l'autre variante est un fragment statique chargé au premier basculement (la page ne double pas de poids).
- « Copier » copie les fichiers de la variante choisie ; « Copier avec mes réglages » ajoute le bloc de valeurs du design réglé (identique pour les deux variantes).

## Décision 5 — Format de distribution

Options :

1. **Copier + zips générés au build**, un zip par variante.
   - Avantages : zéro paquet à publier, fidèle à « copier, pas installer », fichiers statiques mis en cache.
   - Coûts : pas de mise à jour automatique chez l'utilisateur (assumé).
2. **CLI `npx … add <slug>`** lisant le JSON de registre servi par le site.
   - Avantages : une commande, fichiers posés au bon endroit, dépendances résolues.
   - Coûts : un paquet npm à maintenir ; compatibilité réelle du CLI shadcn avec Angular à vérifier dans le spike.
3. **Schematics `ng add` / `ng generate`.**
   - Coûts : paquet versionné par majeure d'Angular, maintenance la plus lourde, contraire au positionnement « copier ».

Recommandation : **option 1 en v1**, JSON de registre produit dès la v1 pour ouvrir l'option 2 sans refonte ; option 3 écartée. `À VALIDER`.

Contenu des zips :

| Zip | Fichiers |
| --- | --- |
| `<slug>-tailwind.zip` (défaut) | `.ts`, `.html` (et `.css` si `@keyframes`), `ngshelf-theme.css`, `README.md` (prérequis : Angular ≥ version minimale, Tailwind v4 configuré ; ligne d'import du thème), `LICENSE` (MIT) |
| `<slug>-css.zip` | `.ts` (avec `styleUrl`), `.html`, `.css`, `tokens.css` (valeurs, facultatif puisque les replis suffisent), `README.md`, `LICENSE` |

Le zip « avec mes réglages » est construit dans le navigateur (bibliothèque zip chargée à la demande, choisie dans le spike) ; les zips standards restent statiques.

JSON de registre (pour le futur CLI) : deux entrées par ressource, `<slug>` (Tailwind) et `<slug>-css`, au format proche de `registry-item.json` de shadcn (`name`, `type`, `files[].target`, `dependencies`, `registryDependencies`, `cssVars`). Le pont `@theme` est une entrée à part (`ngshelf-theme`), dont dépend chaque entrée Tailwind. Le futur CLI choisit la variante par une option (`--css`) ou par la configuration du projet de l'utilisateur.

Impact sur l'hébergement : 7 fichiers par ressource environ (page de détail, aperçu, 2 zips, 2 JSON, fragment de code de l'autre variante), soit une limite pratique d'environ 2 800 ressources sous la limite de 20 000 fichiers de Cloudflare Pages gratuit (ADR 0001), sans compter les pages de liste.

## Conséquences

- Le contrat de tokens (livrable du `designer`) gagne une annexe : la table de correspondance token ↔ utilitaire Tailwind (`--ngs-color-action` ↔ `bg-ngs-action`, `text-ngs-action`…), et la liste fermée des utilitaires de densité.
- Le spike vérifie : rendu identique des deux variantes sur 2 ressources, utilitaires de densité `@utility … --value()`, sortie de l'option 1 pour comparaison, Tailwind sous Shadow DOM (voir ADR 0003).
- Le lint de style de la CI couvre les deux variantes : aucune couleur en dur dans `css/*.css`, aucune valeur arbitraire de couleur (`bg-[#…]`) dans `tailwind/*.html`.
- La relecture d'une PR de ressource porte sur les deux variantes.
- Une ressource contribuée plus tard avec une seule variante pourra être publiée avec un badge « Tailwind seulement » ; en v1, les deux variantes sont obligatoires.

## Sources

Consultées le 2026-11-26.

- Tailwind CSS, variables de thème, `@theme inline`, `@theme static`, partage d'un thème entre projets : https://tailwindcss.com/docs/theme (officiel)
- Tailwind CSS, dernière version publiée v4.3.5 (6 novembre) : https://github.com/tailwindlabs/tailwindcss/releases (officiel)
- Angular v22.3, installation de Tailwind (`@tailwindcss/postcss`, `.postcssrc.json`, `ng add tailwindcss`) : https://angular.dev/guide/tailwind (officiel)
- Format `registry-item.json` de shadcn (`dependencies`, `devDependencies`, `registryDependencies`, `files[].target`, `cssVars.theme` pour Tailwind v4) : https://ui.shadcn.com/docs/registry/registry-item-json (officiel)
- Registre shadcn « works with any project type and any framework » : https://ui.shadcn.com/docs/registry (officiel)
- Licence GSAP « Standard No Charge » (non OSI) : https://gsap.com/community/standard-license/ (officiel)
- Shiki v4.6.0 : https://shiki.style/languages (officiel ; grammaires `angular-ts` / `angular-html` à vérifier dans le spike)
