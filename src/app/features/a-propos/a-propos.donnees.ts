import { PieceVitrine } from '@shared/components/piece-vitrine/piece-vitrine.component';

/** Une pièce du hero : sa composition libre (CSS), sa profondeur au pointeur, sa rotation et son départ. */
export interface PieceApesanteur {
  readonly piece: PieceVitrine;
  readonly classe: 'cal' | 'inter' | 'boutons' | 'notif' | 'curseur';
  readonly profondeur: number;
  readonly rotation: number;
  /** Départ de l'arrivée « de loin », en pixels (x, y), réduit sur mobile. */
  readonly depart: readonly [number, number];
  readonly ratio: string;
}

const composant = (slug: string, type: PieceVitrine['type'], libelle?: string): PieceVitrine => ({
  slug,
  categorie: 'composant',
  type,
  libelle,
});

/** Les cinq vraies pièces du hero (maquette a-propos.html). Un test les compare au registre. */
export const PIECES_APESANTEUR: readonly PieceApesanteur[] = [
  {
    piece: composant('calendrier', 'calendrier'),
    classe: 'cal',
    profondeur: 6,
    rotation: -2,
    depart: [-60, -260],
    ratio: '19 / 21',
  },
  {
    piece: composant('interrupteur', 'interrupteur', 'Interrupteur'),
    classe: 'inter',
    profondeur: 14,
    rotation: 3,
    depart: [-320, -120],
    ratio: '5 / 2',
  },
  {
    piece: composant('boutons', 'bouton', 'Boutons'),
    classe: 'boutons',
    profondeur: 10,
    rotation: -3,
    depart: [-280, 180],
    ratio: '3 / 2',
  },
  {
    piece: composant('notifications', 'notification', 'Notifications'),
    classe: 'notif',
    profondeur: 18,
    rotation: 2,
    depart: [40, 300],
    ratio: '5 / 2',
  },
  {
    piece: composant('curseur', 'champ', 'Curseur'),
    classe: 'curseur',
    profondeur: 12,
    rotation: -4,
    depart: [320, 120],
    ratio: '5 / 2',
  },
];

/** Les trois pièces montrées dans « Régler » et dans le panneau de « Comment c'est fait ». */
export const PIECES_HABIT: readonly PieceVitrine[] = [
  composant('interrupteur', 'interrupteur'),
  composant('curseur', 'champ'),
  composant('champ-email', 'champ'),
];

export const PIECE_CALENDRIER = composant('calendrier', 'calendrier');
export const PIECE_NOTIFICATIONS = composant('notifications', 'notification');

export const DESIGNS = ['planche', 'fleuve', 'laterite'] as const;
export type DesignApropos = (typeof DESIGNS)[number];
export const NOMS_DESIGNS: Readonly<Record<DesignApropos, string>> = {
  planche: 'Planche',
  fleuve: 'Fleuve',
  laterite: 'Latérite',
};

/** Arborescence d'un dossier de ressource (maquette ; `meta.json` : ADR 0007, la maquette disait `meta.ts`). */
export const DOSSIER_RESSOURCE = {
  racine: 'registry/composants/carte-sejour/',
  fichiers: [
    'meta.json',
    'carte-sejour.component.ts',
    'tailwind/carte-sejour.component.html',
    'tailwind/carte-sejour.component.css',
    'css/carte-sejour.component.html',
    'css/carte-sejour.component.css',
    'demo/demo.component.ts',
  ],
} as const;

/** Lignes du panneau « Comment c'est fait » : extraits de code courts. */
export const LIGNES_EXTRAIT_TS = 10;
export const LIGNES_EXTRAIT_HTML = 8;
