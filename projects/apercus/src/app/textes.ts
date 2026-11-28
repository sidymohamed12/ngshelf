/**
 * Textes de l'application d'aperçus (états d'erreur et aperçu introuvable). Elle n'embarque pas `$localize`
 * (elle doit rester légère, ADR 0003) : les textes sont ici, en français, et nulle part ailleurs.
 */
export const TEXTES_APERCU = {
  retourCatalogue: 'Retour au catalogue',
  erreurTitre: 'L’aperçu n’a pas pu se charger',
  erreurTexte: 'Vérifiez votre connexion, puis rechargez la page.',
  recharger: 'Recharger la page',
  introuvableTitre: 'Cet aperçu n’existe pas',
  introuvableTexte: 'La ressource demandée est inconnue ou a été retirée du catalogue.',
} as const;
