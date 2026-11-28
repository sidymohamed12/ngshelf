/**
 * Configuration du site : LE seul endroit où vivent le nom et les liens de Sidy
 * (équivalent de design/maquette/js/config.js). Changer `nom` suffit à renommer le site.
 * Aucune valeur secrète ici : tout est public.
 */
export interface AuteurConfig {
  readonly nom: string;
  readonly nomComplet: string;
  readonly portfolio: string;
  readonly instagram: string;
  readonly tiktok: string;
  readonly linkedin: string;
  readonly github: string;
  readonly email: string;
}

/** Hébergeur du site (mentions légales, politique de confidentialité). Même valeur que la maquette. */
export type Hebergeur = 'cloudflare' | 'netlify';

export interface CoordonneesHebergeur {
  readonly nom: string;
  readonly adresse: string;
  readonly site: string;
}

/** Coordonnées lues sur les politiques de confidentialité officielles (27 novembre 2026). */
export const HEBERGEURS: Readonly<Record<Hebergeur, CoordonneesHebergeur>> = {
  cloudflare: {
    nom: 'Cloudflare, Inc.',
    adresse: '101 Townsend Street, San Francisco, CA 94107, États-Unis',
    site: 'https://www.cloudflare.com/',
  },
  netlify: {
    nom: 'Netlify, Inc.',
    adresse: '101 2nd Street, San Francisco, CA 94105, États-Unis',
    site: 'https://www.netlify.com/',
  },
};

export interface SiteConfig {
  readonly nom: string;
  /** Adresse publique du site, sans barre finale ; null tant que le domaine n'est pas choisi. */
  readonly url: string | null;
  /** Texte de la marque à côté du logo (le logo contient déjà « ng »). */
  readonly nomCourt: string;
  /** Préfixe des tokens (--ngs-*) et des classes (ngs-*), ADR 0006. */
  readonly prefixe: string;
  /** Dépôt GitHub du projet (remote origin) ; null le ferait disparaître du header, du menu et du pied. */
  readonly depot: string | null;
  readonly licence: string;
  /** ADR 0013 : Cloudflare (Pages ou Workers Static Assets, choix au lot 5). */
  readonly hebergeur: Hebergeur;
  readonly angular: string;
  readonly langue: string;
  readonly auteur: AuteurConfig;
}

export const SITE: SiteConfig = {
  nom: 'NgShelf',
  url: null,
  nomCourt: 'Shelf',
  prefixe: 'ngs',
  depot: 'https://github.com/sidymohamed12/ngshelf',
  licence: 'MIT',
  hebergeur: 'cloudflare',
  angular: '22',
  langue: 'fr',
  auteur: {
    nom: 'Sidy',
    nomComplet: 'Sidy Mohamed Saizonou',
    portfolio: 'https://sidy-mohamed-saizonou.netlify.app/',
    instagram: 'https://www.instagram.com/sidymohamed_12/',
    tiktok: 'https://www.tiktok.com/@sidymohamed_12',
    linkedin: 'https://www.linkedin.com/in/sidy-mohamed-saizonou/',
    github: 'https://github.com/sidymohamed12',
    email: 'mohamedsaizonou86@gmail.com',
  },
};
