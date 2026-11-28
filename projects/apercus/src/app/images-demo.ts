/**
 * Images des scènes de démonstration (`registry/**\/demo/`, jamais livrées dans les zips).
 *
 * TEMPORAIRE (ADR 0021) : tant que le site n'a pas de photographies locales, les galeries et les blocs
 * d'image réutilisent les images externes des composants d'origine (picsum.photos et images.unsplash.com).
 * TODO : remplacer par des images locales (`public/images/`), puis passer `IMAGES_EXTERNES_ACTIVES` à
 * `false` ET retirer les hôtes de la directive `img-src` de `/apercu/*` dans `public/_headers`.
 * Retour en local en un geste : `IMAGES_EXTERNES_ACTIVES = false` (les huit illustrations SVG locales
 * reviennent) ; `npm run verifier:dist` refuse alors tout hôte tiers resté dans `dist/`.
 *
 * Seule source de vérité de ces adresses : aucune scène n'écrit d'URL elle-même. Fichier sans import, lu
 * aussi par `scripts/dist/verifier.ts`.
 */
export const IMAGES_EXTERNES_ACTIVES = true;

/** Hôtes tiers admis, et seulement en `img-src` de `/apercu/*`. picsum.photos redirige vers fastly.picsum.photos. */
export const HOTES_IMAGES_TEMPORAIRES: readonly string[] = [
  'picsum.photos',
  'fastly.picsum.photos',
  'images.unsplash.com',
];

export interface ImageDemo {
  readonly src: string;
  readonly alt: string;
}

export type CleImages =
  | 'galerie-roue'
  | 'galerie-accordeon'
  | 'galerie-dome'
  | 'mur-images'
  | 'media-extensible'
  | 'revelation-iris'
  | 'carrousel-temoignages'
  | 'hero-grille-defilante'
  | 'galerie-incurvee';

const PHOTO = (numero: number): string => `Photographie de démonstration ${numero}`;

function picsum(id: number, largeur: number, hauteur: number): string {
  return `https://picsum.photos/id/${id}/${largeur}/${hauteur}`;
}

function unsplash(photo: string): string {
  return `https://images.unsplash.com/photo-${photo}?q=80&w=774&auto=format&fit=crop`;
}

function portraitsLocaux(): readonly ImageDemo[] {
  return ['moussa', 'cheikh', 'aminata', 'ibrahima', 'khady', 'fatou'].map((nom) => ({
    src: `images/portrait-${nom}.svg`,
    alt: `Portrait illustré de ${nom} (personnage fictif)`,
  }));
}

/** Ordre : Moussa, Cheikh, Aminata, Ibrahima, Khady, Fatou (même ordre que la démo). */
const PORTRAITS_UNSPLASH: readonly string[] = [
  '1507003211169-0a1dd7228f2d',
  '1500648767791-00dcc994a43e',
  '1580489944761-15a19d654956',
  '1472099645785-5658abf4ff4e',
  '1494790108377-be9c29b29330',
  '1531427186611-ecfd6d936c79',
];

function portraitsExternes(): readonly ImageDemo[] {
  return PORTRAITS_UNSPLASH.map((photo) => ({
    src: `https://images.unsplash.com/photo-${photo}?q=80&w=600&h=800&auto=format&fit=crop&crop=faces`,
    alt: "Portrait d'illustration (photo libre de droits, personnage fictif)",
  }));
}

function externes(adresses: readonly string[]): readonly ImageDemo[] {
  return adresses.map((src, i) => ({ src, alt: PHOTO(i + 1) }));
}

const EXTERNES: Readonly<Record<CleImages, readonly ImageDemo[]>> = {
  'galerie-roue': externes(
    [1011, 1016, 1020, 1024, 1025, 1035, 1036].map((id) => picsum(id, 800, 1000)),
  ),
  'galerie-accordeon': externes([1015, 1018, 1039, 1043, 1044].map((id) => picsum(id, 900, 1200))),
  'galerie-dome': externes(
    [
      '1755331039789-7e5680e26e8f',
      '1755569309049-98410b94f66d',
      '1755497595318-7e5e3523854f',
      '1755353985163-c2a0fe5ac3d8',
      '1745965976680-d00be7dc0377',
      '1752588975228-21f44630bb3c',
    ].map(unsplash),
  ),
  'mur-images': externes(
    [1015, 1016, 1018, 1019, 1036, 1039, 1043, 1044].map((id) => picsum(id, 800, 520)),
  ),
  'media-extensible': externes([picsum(1043, 1600, 900)]),
  'revelation-iris': externes([picsum(1018, 1920, 1080)]),
  'hero-grille-defilante': externes(
    [
      '1755331039789-7e5680e26e8f',
      '1755569309049-98410b94f66d',
      '1755497595318-7e5e3523854f',
      '1755353985163-c2a0fe5ac3d8',
      '1745965976680-d00be7dc0377',
      '1752588975228-21f44630bb3c',
    ].map(unsplash),
  ),
  'galerie-incurvee': externes([
    ...[
      '1755331039789-7e5680e26e8f',
      '1755569309049-98410b94f66d',
      '1755497595318-7e5e3523854f',
      '1755353985163-c2a0fe5ac3d8',
      '1745965976680-d00be7dc0377',
      '1752588975228-21f44630bb3c',
    ].map(unsplash),
    picsum(1043, 1000, 800),
    picsum(1018, 1000, 800),
  ]),
  // Portraits illustrés et fictifs, créés pour NgShelf : jamais d'hôte tiers, quel que soit l'interrupteur.
  'carrousel-temoignages': portraitsExternes(),
};

const ILLUSTRATIONS: Readonly<Record<string, string>> = {
  'aube-ocre': 'un soleil pâle sur des reliefs ocre',
  'rose-poudre': 'un ciel rose au-dessus de collines framboise',
  'foret-verte': 'une lune claire sur des crêtes vert sombre',
  'nuit-bleue': 'une lune sur des reliefs bleu nuit',
  'or-chaud': 'un grand soleil doré sur des terres brunes',
  'ciel-clair': 'un ciel pâle au-dessus de collines bleues',
  crepuscule: 'un soleil orangé sur des crêtes violettes',
  'vert-profond': 'une lune pâle sur des reliefs vert très sombre',
};

function locales(noms: readonly string[]): readonly ImageDemo[] {
  return noms.map((nom) => ({
    src: `images/${nom}.svg`,
    alt: `Illustration abstraite : ${ILLUSTRATIONS[nom]}.`,
  }));
}

const HUIT = [
  'aube-ocre',
  'rose-poudre',
  'foret-verte',
  'nuit-bleue',
  'or-chaud',
  'ciel-clair',
  'crepuscule',
  'vert-profond',
];

const LOCALES: Readonly<Record<CleImages, readonly ImageDemo[]>> = {
  'galerie-roue': locales([
    'aube-ocre',
    'rose-poudre',
    'foret-verte',
    'nuit-bleue',
    'crepuscule',
    'ciel-clair',
    'or-chaud',
  ]),
  'galerie-accordeon': locales([
    'aube-ocre',
    'rose-poudre',
    'foret-verte',
    'nuit-bleue',
    'or-chaud',
  ]),
  'galerie-dome': locales(HUIT),
  'mur-images': locales(HUIT),
  'media-extensible': locales(['or-chaud']),
  'revelation-iris': locales(['crepuscule']),
  'hero-grille-defilante': locales(HUIT),
  'galerie-incurvee': locales(HUIT),
  'carrousel-temoignages': portraitsLocaux(),
};

/** Images de la scène `cle` : externes tant que le retour au local n'est pas fait. */
export function imagesDemo(cle: CleImages): readonly ImageDemo[] {
  return IMAGES_EXTERNES_ACTIVES ? EXTERNES[cle] : LOCALES[cle];
}
