# 0004 — Taxonomie, modèle de données du registre et routes prérendues

## Statut

Renvoi (2026-11-27, ADR 0007 et 0012, acceptés) : `meta.json`, champ `motion`, `tailleCase` (0007) ; route `/catalogue` et paramètres (0012). Corps inchangé.

Confirmation (2026-11-27, décisions de Sidy) : les décisions 3 (filtres côté client) et 4 (`dependances` vide) sont confirmées (`docs/plans/arbitrage-contradictions-handoff.md`, section 3, question 9).

accepté (2026-11-26, validation de Sidy relayée par le coordinateur) : taxonomie et vocabulaire initial, libellé « Secteur », URL de détail `/<categorie>/<type>/<slug>`. Les pages de filtres en mode mixte (décision 3, partie échelle) et le champ réservé `dependances` (décision 4) n'ont pas été validés explicitement : ils restent à confirmer par Sidy ; un changement passera par un nouvel ADR.

## Contexte

Sidy veut beaucoup de types de ressources (navbar, footer, hero, formulaire, boutons, card, section, modale, tableau, pricing…) et des **thèmes métier** (voyage, restaurant, transport…) distincts des **designs** (thèmes de tokens, ADR 0002). Le catalogue doit rester navigable, bien référencé et léger à des centaines puis des milliers de ressources. Le site est 100 % statique (ADR 0001) : toute page indexable est générée au build, et Cloudflare Pages gratuit limite le déploiement à 20 000 fichiers. Une évolution est déjà annoncée : les dépendances d'une ressource (paquets npm, autres ressources).

## Décision 1 — Cinq axes, chacun avec un rôle distinct

| Axe | Valeurs | Cardinalité par ressource | Sert à | Page prérendue |
| --- | --- | --- | --- | --- |
| **Catégorie** | liste fermée : `composant`, `bloc`, `template`, `design` | exactement 1 | grain de la ressource (pièce, section de page, page complète, thème) | oui |
| **Type** | vocabulaire contrôlé, chaque type appartient à **une** catégorie | exactement 1 (aucun pour `design`) | ce que c'est : bouton, modale, navbar, pricing, landing… | oui |
| **Secteur** (le « thème métier ») | vocabulaire contrôlé : voyage, restaurant, transport… | 0 à 3 (0 = générique) | pour quel métier le contenu de démo et la mise en page sont pensés | oui |
| **Design compatible** | dérivé, pas saisi | — | sous quels designs la ressource se règle | non (filtre) |
| **Tags** | libres, normalisés (minuscules, tirets), 8 au plus | 0 à 8 | recherche plein texte | non |

Nommage : le modèle et l'interface disent **« secteur »** et non « thème métier », pour ne jamais confondre avec « design » ni avec le thème clair / sombre (libellé « Secteur » validé par Sidy).

Compatibilité de design : elle n'est pas une liste saisie à la main (qui serait fausse dès qu'un design est ajouté). Chaque ressource et chaque design déclarent la **version du contrat de tokens** qu'ils suivent ; une ressource est compatible avec tous les designs de même version majeure. Une ressource hors contrat (`contratTokens: null`) n'est compatible qu'avec son style propre et n'a pas le badge « réglable ». Un champ facultatif `designsMisEnAvant` choisit seulement les designs montrés dans la vignette.

Type et secteur sont des **listes contrôlées** dans `registry/taxonomie/` (slug, libellé, description pour le SEO, ordre). Une valeur inconnue fait échouer le build : c'est ce qui empêche le catalogue de se fragmenter (« navbar », « nav-bar », « barre-de-nav »).

Vocabulaire initial (validé par Sidy ; libellés affichés affinés par le designer) :

- **composant** : `bouton`, `champ`, `selection`, `case-a-cocher`, `interrupteur`, `badge`, `avatar`, `carte`, `modale`, `tiroir`, `menu-deroulant`, `onglets`, `accordeon`, `infobulle`, `notification`, `alerte`, `tableau`, `pagination`, `fil-d-ariane`, `calendrier`, `chargement`, `etapes`
- **bloc** : `navbar`, `footer`, `hero`, `fonctionnalites`, `pricing`, `temoignages`, `faq`, `appel-a-l-action`, `formulaire`, `equipe`, `statistiques`, `galerie`, `logos`, `newsletter`, `section-contenu`
- **template** : `landing`, `vitrine`, `tableau-de-bord`, `authentification`, `blog`, `portfolio`, `boutique`, `page-erreur`
- **secteurs** : `voyage`, `restaurant`, `transport`, `sante`, `immobilier`, `education`, `commerce`, `finance`, `evenementiel`, `beaute-bien-etre`, `sport`, `saas`, `associatif`, `creatif`

« Formulaire » existe à deux grains : les champs sont des composants (`champ`, `selection`…), le formulaire complet (contact, inscription) est un bloc. « Section » est le grain `bloc` lui-même, pas un type.

## Décision 2 — Modèle des métadonnées

Un fichier `meta.ts` typé par ressource, validé au build (schéma Zod ou équivalent, choisi dans le spike). Les textes visibles sont au format `{ fr, en? }` dès la v1 pour préparer l'anglais sans migration.

```ts
type Texte = { readonly fr: string; readonly en?: string };

interface MetaRessource {
  readonly schema: 1;                      // version du format de meta
  readonly slug: string;                   // kebab-case, unique dans tout le registre, immuable
  readonly categorie: 'composant' | 'bloc' | 'template';
  readonly type: string;                   // slug d'un type de registry/taxonomie, de la même catégorie
  readonly titre: Texte;
  readonly description: Texte;             // 160 caractères au plus (meta description)
  readonly secteurs: readonly string[];    // 0 à 3 slugs de secteur
  readonly tags: readonly string[];        // 0 à 8
  readonly contratTokens: 1 | null;        // version majeure du contrat suivie, null = non réglable
  readonly designsMisEnAvant?: readonly string[];
  readonly variantes: readonly ('tailwind' | 'css')[]; // v1 : les deux obligatoires (ADR 0002)
  readonly angularMin: string;             // ex. '22.0'
  readonly licence: 'MIT';
  readonly auteur: { readonly nom: string; readonly url?: string };
  readonly statut: 'provisoire' | 'publie' | 'deprecie';
  readonly ajouteLe: string;               // AAAA-MM-JJ, sert aux « nouveautés »
  readonly modifieLe?: string;
  readonly anciensChemins?: readonly string[]; // URL précédentes, redirections 301 générées
  readonly dependances: Dependances;       // réservé, voir décision 4
}

interface MetaDesign {
  readonly schema: 1;
  readonly slug: string;
  readonly categorie: 'design';
  readonly titre: Texte;
  readonly description: Texte;
  readonly secteurs: readonly string[];
  readonly tags: readonly string[];
  readonly contratTokens: 1;
  readonly valeurs: { readonly clair: Readonly<Record<string, string>>; readonly sombre?: Readonly<Record<string, string>> };
  readonly licence: 'MIT';
  readonly statut: 'provisoire' | 'publie' | 'deprecie';
  readonly ajouteLe: string;
}
```

Les ressources de démonstration v1 portent `statut: 'provisoire'` (badge affiché). Une ressource `deprecie` garde sa page (pas de lien cassé), hors des listes.

## Décision 3 — Routes et pages prérendues

| Route | Exemple | Prérendue | Indexée |
| --- | --- | --- | --- |
| `/` | | oui | oui |
| `/<categorie>` | `/composants`, `/blocs`, `/templates`, `/designs` | oui | oui |
| `/<categorie>/<type>` | `/blocs/navbar`, `/composants/modale` | oui, si le type a au moins 1 ressource | oui |
| `/secteurs/<secteur>` | `/secteurs/restaurant` | oui, si au moins 1 ressource | oui |
| `/<categorie>/<type>/<slug>` | `/blocs/navbar/navbar-flottante` | oui | oui |
| `/designs/<slug>` | `/designs/fleuve` | oui | oui |
| `/apercu/<slug>` | | oui (app d'aperçus) | non |
| `/demarrer`, `/contribuer`, `/licence`, pages légales | | oui | oui |
| tout filtre combiné, recherche, tags | `/blocs?secteur=restaurant&design=fleuve` | non | non (canonique = chemin sans paramètres) |

Options considérées pour l'URL de détail :

1. **`/<categorie>/<type>/<slug>`** (recommandé) : fil d'Ariane naturel, aucune collision entre un slug de ressource et une page de type, mots-clés dans l'URL. Coût : changer le type d'une ressource change son URL, d'où une redirection 301 dans `public/_redirects` générée depuis le champ `anciensChemins` (rare).
2. **`/<categorie>/<slug>`** : URL plus courte et stable si le type change. Coût : collision possible avec `/<categorie>/<type>`, donc une règle « un slug ne peut pas être un nom de type », et un niveau de navigation en moins.
3. **`/r/<slug>`** : la plus stable. Coût : URL sans sens pour le visiteur et le référencement.

Pages de filtres et échelle — options :

1. **Prérendre chaque combinaison** (type × secteur × design) : des centaines de pages presque vides (contenu mince pour les moteurs) et une consommation rapide des 20 000 fichiers. Écarté.
2. **Tout filtrer côté client sur une seule page** : simple, mais un seul point d'entrée pour le référencement. Écarté.
3. **Mixte** (recommandé) : les axes à vocabulaire fermé et à intention de recherche (catégorie, type, secteur) ont leur page prérendue, avec la liste complète de leurs ressources en HTML ; les combinaisons, les designs, les tags et la recherche filtrent **côté client** sur cette page, l'état est dans les paramètres d'URL (partageable), et ces URL ne sont ni prérendues ni indexées.

Volume estimé (option 3) : pages fixes (≈ 12) + catégories (4) + types (≈ 45) + secteurs (≈ 14) + 2 pages par ressource, plus les fichiers statiques par ressource de l'ADR 0002 : environ 7 fichiers par ressource, soit ≈ 2 800 ressources avant la limite de Cloudflare Pages gratuit.

Index pour le filtrage : généré au build, **découpé par catégorie** et chargé en lazy (jamais dans le bundle initial). Une entrée ≈ 300 à 400 octets (slug, titre, type, secteurs, tags, contrat, statut, date) : environ 50 à 70 Ko compressés pour 1 000 ressources d'une catégorie (estimation à mesurer). Recherche v1 : correspondance normalisée (accents, casse) sur titre, type, secteur et tags, sans bibliothèque. Au-delà d'environ 1 500 ressources dans une catégorie, ou si la recherche plein texte devient un besoin, passer à un index de recherche statique (Pagefind par exemple, à vérifier à ce moment-là) : nouvel ADR.

## Décision 4 — Dépendances : champ réservé, non implémenté en v1

```ts
interface Dependances {
  readonly npm: readonly { readonly nom: string; readonly version: string; readonly dev?: boolean }[];
  readonly ressources: readonly string[];  // slugs d'autres ressources du registre
}
```

v1 : le champ est **obligatoire et vide** (`{ npm: [], ressources: [] }`) ; le build refuse une valeur non vide. Chaque ressource est donc autonome. Les prérequis de variante (Tailwind v4 pour la variante Tailwind, version d'Angular) ne sont pas des dépendances : ils viennent de `variantes` et `angularMin`.

Évolution prévue, chacune dans son propre lot et son ADR :

1. **Paquets npm** : la page de détail affiche les paquets et une commande `npm install` à copier ; le `README` du zip les liste ; le JSON de registre les expose en `dependencies` / `devDependencies` (mêmes noms que shadcn). Validation au build : nom de paquet existant, version en intervalle semver, licence relevée et affichée (une licence non OSI est signalée, cf. GSAP).
2. **Autres ressources** : le build vérifie que chaque slug existe, détecte les cycles et calcule la fermeture transitive ; la page affiche « Nécessite : … » avec liens ; le zip inclut les ressources requises (ou les liste, décision à prendre alors) ; le JSON les expose en `registryDependencies`, que le futur CLI résout.
3. Une dépendance peut devenir propre à une variante (`variantes: ['tailwind']`) si un besoin réel apparaît, pas avant.

## Conséquences

- `registry/taxonomie/` (types, secteurs) reprend le vocabulaire validé ; un ajout de type ou de secteur passe par une PR relue par Sidy.
- Le build échoue sur : type ou secteur inconnu, type d'une autre catégorie, slug non unique, plus de 3 secteurs ou 8 tags, `dependances` non vide, texte `fr` absent.
- Le `sitemap.xml` liste catégories, types et secteurs non vides, détails et designs ; jamais `/apercu/*` ni les URL à paramètres.
- Le JSON-LD : `BreadcrumbList` sur les pages de type et de détail, `CollectionPage` sur les listes.
- Les filtres modifient seulement les paramètres d'URL : la transition de page est sautée dans ce cas (ADR 0005).

## Sources

Consultées le 2026-11-26.

- Champs `dependencies`, `devDependencies`, `registryDependencies`, `categories` de shadcn : https://ui.shadcn.com/docs/registry/registry-item-json (officiel)
- Limites Cloudflare Pages, plan gratuit (20 000 fichiers) : https://developers.cloudflare.com/pages/platform/limits/ (officiel)
- Prérendu de routes paramétrées (`getPrerenderParams`) : https://angular.dev/guide/ssr (officiel, doc v22.3.0)
