import { SITE } from '@core/config/site.config';

const NOM = SITE.nom;

/**
 * Textes destinés aux moteurs de recherche et aux réseaux (meta description, Open Graph) : mêmes règles que
 * textes.fr.ts. Chaque description tient en 160 caractères au plus (testé) et ne dit que ce que le site fait.
 */
export const TEXTES_SEO = {
  accueil: $localize`:@@seo.accueil:${NOM}:nom: rassemble des composants, des blocs et des designs Angular en code ouvert (licence MIT). Essayez-les dans la page, puis copiez ou téléchargez le code.`,
  catalogue: $localize`:@@seo.catalogue:Tout le catalogue ${NOM}:nom: : composants, blocs et designs Angular, à filtrer par famille, par type ou par secteur et à essayer avant de copier leur code.`,
  apropos: $localize`:@@seo.apropos:${NOM}:nom: est un catalogue libre de ressources Angular, sans compte ni paiement : à essayer dans la page, à copier ou à télécharger. Code sous licence MIT.`,
  /** Page d'un type ou d'une catégorie : « Calendrier Angular : 1 ressource… ». */
  liste: (nom: string, compte: string) =>
    $localize`:@@seo.liste:${nom}:nom: Angular : ${compte}:compte: à essayer dans la page, puis à copier ou à télécharger. Code sous licence MIT, sans compte.`,
  listeVide: (nom: string) =>
    $localize`:@@seo.liste-vide:${nom}:nom: Angular : aucune ressource n’est publiée pour l’instant.`,
  listeSecteur: (secteur: string, compte: string) =>
    $localize`:@@seo.liste-secteur:Ressources Angular pour le secteur ${secteur}:secteur: : ${compte}:compte: à essayer dans la page, puis à copier ou à télécharger. Code sous licence MIT.`,
  introuvable: $localize`:@@seo.introuvable:Cette page n’existe pas. Retrouvez les ressources Angular depuis le catalogue.`,
  /** Texte alternatif de l'image de partage (le logo, sans texte inventé). */
  imageAlt: $localize`:@@seo.image-alt:Logo ${NOM}:nom: : les lettres n et g posées sur une étagère`,
  /** Fil d'Ariane (données structurées). */
  arianeAccueil: $localize`:@@seo.ariane.accueil:Accueil`,
} as const;
