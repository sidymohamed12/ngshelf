/**
 * Textes de la page d'aperçu autonome. L'application d'aperçus n'embarque pas `$localize` (elle doit rester
 * légère, ADR 0003) : les textes sont ici, en français, et nulle part ailleurs.
 */
export const TEXTES_APERCU = {
  retour: 'Retour à la fiche',
  retourCatalogue: 'Retour au catalogue',
  reglages: 'Réglages de l’aperçu',
  design: 'Design',
  mode: 'Mode',
  clair: 'Clair',
  sombre: 'Sombre',
  animations: 'Animations',
  animationsReduit: 'Coupées : votre système demande moins de mouvement.',
  animationsAucune: 'Cette ressource n’a pas d’animation propre.',
  parametres: 'Paramètres de la ressource',
  reinitialiser: 'Réinitialiser',
  chargement: 'Chargement de l’aperçu',
  erreurTitre: 'L’aperçu n’a pas pu se charger',
  erreurTexte: 'Vérifiez votre connexion, puis rechargez la page.',
  recharger: 'Recharger la page',
  introuvableTitre: 'Cet aperçu n’existe pas',
  introuvableTexte: 'La ressource demandée est inconnue ou a été retirée du catalogue.',
  titreParDefaut: 'Aperçu',
} as const;
