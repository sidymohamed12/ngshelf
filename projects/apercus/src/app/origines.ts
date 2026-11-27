import { SITE } from '@core/config/site.config';

/**
 * Origines du site autorisées à envoyer des messages à l'aperçu (ADR 0010, décision 4) : la production
 * quand l'adresse est connue, les ports de développement et de prévisualisation locale. Le domaine
 * d'aperçu des pull requests s'ajoutera ici au choix de l'hébergement (ADR 0013, lot 5).
 * Un message venu d'une autre origine est ignoré ; au pire, une page locale pose les 12 variables du contrat.
 */
export const ORIGINES_SITE: readonly string[] = [
  ...(SITE.url ? [SITE.url] : []),
  'http://localhost:4200',
  'http://localhost:4300',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:4300',
];
