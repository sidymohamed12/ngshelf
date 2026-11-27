import { TailleCase } from '@shared/models/taxonomie.model';

/** Classes de la planche (components.css) qui donnent à une case sa taille : 1×1, 2×1, 1×2 ou 2×2. */
export const CLASSES_TAILLE_CASE: Readonly<Record<TailleCase, string>> = {
  normale: '',
  large: 'ngs-case--wide',
  haute: 'ngs-case--tall',
  'large-haute': 'ngs-case--wide ngs-case--tall',
};
