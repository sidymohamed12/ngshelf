import { MetaRessource } from '@shared/models/ressource.model';

/**
 * Jeu minimal et PROVISOIRE : de quoi typer les routes et prérendre quelques fiches.
 * Remplacé par la sortie du script de registre (registry/, ADR 0002) quand il existera ;
 * les 10 ressources de la maquette ne sont pas reprises ici.
 */
const AUTEUR = { nom: 'Sidy' } as const;
const SANS_DEPENDANCE = { npm: [], ressources: [] } as const;

export const REGISTRE_PROVISOIRE: readonly MetaRessource[] = [
  {
    schema: 1,
    slug: 'interrupteur',
    categorie: 'composant',
    type: 'interrupteur',
    titre: { fr: 'Interrupteur' },
    description: {
      fr: 'Un réglage qui s’active ou se coupe d’un geste, annoncé comme un « switch » aux lecteurs d’écran.',
    },
    secteurs: [],
    tags: ['formulaire', 'réglage', 'switch', 'toggle'],
    contratTokens: 1,
    variantes: ['tailwind', 'css'],
    angularMin: '22.0',
    licence: 'MIT',
    auteur: AUTEUR,
    statut: 'provisoire',
    ajouteLe: '2026-11-27',
    dependances: SANS_DEPENDANCE,
  },
  {
    schema: 1,
    slug: 'navbar-restaurant',
    categorie: 'bloc',
    type: 'navbar',
    titre: { fr: 'Barre de navigation' },
    description: {
      fr: 'Une navbar qui s’adapte à la largeur de son conteneur (container queries) : liens en ligne, ou menu repliable annoncé.',
    },
    secteurs: ['restaurant'],
    tags: ['navbar', 'navigation', 'header', 'menu', 'restaurant'],
    contratTokens: 1,
    variantes: ['tailwind', 'css'],
    angularMin: '22.0',
    licence: 'MIT',
    auteur: AUTEUR,
    statut: 'provisoire',
    ajouteLe: '2026-11-27',
    dependances: SANS_DEPENDANCE,
  },
];
