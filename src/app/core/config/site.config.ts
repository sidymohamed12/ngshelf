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

export interface SiteConfig {
  readonly nom: string;
  /** Adresse publique du site, sans barre finale ; null tant que le domaine n'est pas choisi. */
  readonly url: string | null;
  /** Texte de la marque à côté du logo (le logo contient déjà « ng »). */
  readonly nomCourt: string;
  /** Préfixe des tokens (--ngs-*) et des classes (ngs-*), ADR 0006. */
  readonly prefixe: string;
  /** Dépôt GitHub du projet ; null tant qu'il n'est pas créé (les liens « code source » sont alors masqués). */
  readonly depot: string | null;
  readonly licence: string;
  readonly angular: string;
  readonly langue: string;
  readonly auteur: AuteurConfig;
}

export const SITE: SiteConfig = {
  nom: 'NgShelf',
  url: null,
  nomCourt: 'Shelf',
  prefixe: 'ngs',
  depot: null,
  licence: 'MIT',
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
