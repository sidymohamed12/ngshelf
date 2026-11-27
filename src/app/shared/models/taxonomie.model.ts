/**
 * Taxonomie du catalogue (ADR 0004). Les libellés affichés sont dans core/i18n/textes.fr.ts.
 * Une valeur hors de ces listes ne compile pas : c'est ce qui empêche le catalogue de se fragmenter.
 */

/** Catégorie telle qu'écrite dans les métadonnées d'une ressource. */
export const CATEGORIES = ['composant', 'bloc', 'template', 'design'] as const;
export type Categorie = (typeof CATEGORIES)[number];

/** Catégorie telle qu'écrite dans l'URL (/composants, /blocs/navbar…). */
export const SEGMENT_CATEGORIE = {
  composant: 'composants',
  bloc: 'blocs',
  template: 'templates',
  design: 'designs',
} as const satisfies Record<Categorie, string>;
export type SegmentCategorie = (typeof SEGMENT_CATEGORIE)[Categorie];

/** Catégories qui contiennent des ressources typées (un design n'a pas de type). */
export type CategorieTypee = Exclude<Categorie, 'design'>;

export const TYPES_PAR_CATEGORIE = {
  composant: [
    'bouton',
    'champ',
    'selection',
    'case-a-cocher',
    'interrupteur',
    'badge',
    'avatar',
    'carte',
    'modale',
    'tiroir',
    'menu-deroulant',
    'onglets',
    'accordeon',
    'infobulle',
    'notification',
    'alerte',
    'tableau',
    'pagination',
    'fil-d-ariane',
    'calendrier',
    'chargement',
    'etapes',
  ],
  bloc: [
    'navbar',
    'footer',
    'hero',
    'fonctionnalites',
    'pricing',
    'temoignages',
    'faq',
    'appel-a-l-action',
    'formulaire',
    'equipe',
    'statistiques',
    'galerie',
    'logos',
    'newsletter',
    'section-contenu',
  ],
  template: [
    'landing',
    'vitrine',
    'tableau-de-bord',
    'authentification',
    'blog',
    'portfolio',
    'boutique',
    'page-erreur',
  ],
} as const satisfies Record<CategorieTypee, readonly string[]>;

export type TypeComposant = (typeof TYPES_PAR_CATEGORIE.composant)[number];
export type TypeBloc = (typeof TYPES_PAR_CATEGORIE.bloc)[number];
export type TypeTemplate = (typeof TYPES_PAR_CATEGORIE.template)[number];
export type TypeRessource = TypeComposant | TypeBloc | TypeTemplate;

/** Secteur : « pour quel métier le contenu de démo est pensé » (jamais « thème », réservé au clair / sombre). */
export const SECTEURS = [
  'voyage',
  'restaurant',
  'transport',
  'sante',
  'immobilier',
  'education',
  'commerce',
  'finance',
  'evenementiel',
  'beaute-bien-etre',
  'sport',
  'saas',
  'associatif',
  'creatif',
] as const;
export type Secteur = (typeof SECTEURS)[number];
