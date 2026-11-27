# 0014 — Paramètres propres réglables d'une ressource

## Statut

proposé (2026-11-27, phase 5). Complète les ADR 0002 (contrat de 12 tokens) et 0010 (protocole de l'aperçu).

## Contexte

Une ressource se règle par les 12 tokens `--ngs-*` (couleur, rayon, densité, police, durée, clair/sombre). Les composants de Sidy portés en phase 5 (galeries, scroll) ont en plus leurs propres réglages : orientation, hauteur, inclinaison, lecture automatique… Sidy veut que le visiteur puisse les essayer dans la fiche, sans que l'aperçu accepte n'importe quoi.

## Décision

1. **Définition dans le `meta.json`**, champ facultatif `parametres` (1 à 8 entrées). Trois genres : `choix` (liste fermée de 2 à 8 options), `nombre` (min, max, pas, unité facultative) et `interrupteur`. Chaque entrée porte `nom` (l'input du composant, en camelCase), `libelle`, `defaut`.
2. **Documentés** : chaque `nom` doit figurer dans le tableau « Paramètres » de `fiche.json` ; le build échoue sinon (`scripts/registre/valider-parametres.ts`). Le tableau reste la source de lecture, `parametres` en est le sous-ensemble réglable.
3. **Fiche** : un groupe « Paramètres de la ressource » dans les réglages (segmenté, curseur ou interrupteur), état dans `EtatFiche`, remis à zéro par « Réinitialiser ».
4. **Protocole** : `ngs-reglages` gagne `params` (valeurs scalaires). Le message reste en version 1 : un site ancien n'envoie pas `params`, l'aperçu le lit comme vide.
5. **Liste blanche en deux temps** : à la lecture, la forme seulement (16 entrées au plus, noms simples, valeurs scalaires courtes) ; ensuite `resoudreParametres` ne garde que les noms déclarés par la ressource, avec le bon type, dans la liste ou les bornes (sinon le défaut). L'aperçu reçoit la définition au build (`PARAMETRES_APERCUS`, généré).
6. **Scènes** : la scène de démonstration lit les valeurs par `ApercuService.choix / nombre / booleen`, qui re-vérifient la valeur (aucune conversion de type).
7. L'URL de l'aperçu autonome (ADR 0016) reprend les paramètres sous la forme `p.<nom>=…`, lus avec la même résolution.

## Conséquences

- Les paramètres n'entrent pas dans `tokens.css` ni dans le zip « avec mes réglages » : ils décrivent l'usage du composant, pas son habillage. Le bloc « Utilisation » n'est pas réécrit selon les paramètres (à envisager plus tard).
- Une ressource sans `parametres` ne change pas.

## Sources

Fichiers du dépôt lus le 2026-11-27 (officiel : code du projet).
