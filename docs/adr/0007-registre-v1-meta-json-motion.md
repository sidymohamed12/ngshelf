# 0007 — Registre v1 : contenu, `meta.json`, champ `motion`

## Statut

accepté (2026-11-27, décisions de Sidy). Arbitrage : `docs/plans/arbitrage-contradictions-handoff.md`, points 1, 4, 13.

## Contexte

Le plan prévoyait 6 à 8 ressources et des `meta.ts` (ADR 0002, 0004). La maquette a 10 ressources et 3 designs, le front a 13 `meta.json` validés par `scripts/registre/valider.ts`, avec deux champs absents de l'ADR 0004 (`animee`, `tailleCase`). `DESIGN.md` demande un champ `motion` à reporter dans `MetaRessource`.

## Options

1. Suivre les ADR : 6 à 8 ressources, `meta.ts`, pas de `motion`. Coût : défaire le front, la maquette affiche des compteurs et des pièces qui n'existent pas.
2. Aligner les ADR sur la maquette et le front (recommandé). Coût : une migration de 3 fichiers.

## Décision

- **v1 : 10 ressources et 3 designs** (7 composants, 3 blocs, 3 designs), tous `statut: 'provisoire'`. Aucun chiffre affiché qui ne vienne du registre.
- **`meta.json`**, validé au build par `scripts/registre/valider.ts` (types partagés `MetaRessource`, `MetaDesign`). Pas de `meta.ts` : un fichier exécutable relu en PR est un risque inutile pour un dépôt qui accepte des contributions.
- **Champ `motion: Motion | null`** obligatoire, remplace `animee` (dérivé dans l'index) :

```ts
type Moment = 'entree' | 'sortie' | 'survol' | 'ouverture' | 'changement';
interface Motion {
  readonly resume: Texte;
  readonly moments: readonly Moment[];   // au moins un
  readonly technique: string;
  readonly rejouer?: { readonly entree?: true; readonly sortie?: string };
}
```

- `tailleCase?: 'normale' | 'large' | …` (valeurs de `TAILLES_CASE` du front) est ajouté au modèle documenté.
- `schema` reste 1 : rien n'est publié.
- `dependances` : champ obligatoire et vide (ADR 0004 décision 4, confirmé).

## Conséquences

- Le build échoue en plus sur : `moments` vide, `rejouer.sortie` sans `sortie` dans `moments`, `animee` présent.
- À modifier : `ressource.model.ts`, `valider.ts`, `sorties.ts`, 3 `meta.json`. Lot 6 : porter les 10 ressources.
- Les ADR 0002 et 0004 portent une ligne de renvoi.

## Sources

Fichiers du dépôt lus le 2026-11-27 (officiel : code du projet).
