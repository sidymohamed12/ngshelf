import { SITE } from '@core/config/site.config';
import { Categorie, Secteur, TypeRessource } from '@shared/models/taxonomie.model';

/**
 * Textes de l'interface, en français (v1). Source unique des chaînes du site
 * (équivalent de design/maquette/js/textes.fr.js).
 *
 * Chaque texte est marqué pour l'internationalisation (ADR 0001) : `$localize` avec l'identifiant
 * `@@clé` de la maquette. Une version anglaise = un fichier de traductions extrait par
 * `ng extract-i18n`, sans toucher à ce fichier. Les templates lisent ces constantes : aucun texte
 * visible en dur dans un composant.
 */
const NOM = SITE.nom;

export const TEXTES = {
  commun: {
    evitement: $localize`:@@lien.evitement:Aller au contenu`,
    navigationPrincipale: $localize`:@@nav.principale:Navigation principale`,
    accueilDe: $localize`:@@nav.accueil:Accueil de ${NOM}:nom:`,
    marque: $localize`:@@marque.nom:${NOM}:nom:`,
    pageIntrouvable: $localize`:@@page.introuvable:Page introuvable`,
  },
  nav: {
    catalogue: $localize`:@@nav.catalogue:Catalogue`,
    composants: $localize`:@@nav.composants:Composants`,
    blocs: $localize`:@@nav.blocs:Blocs`,
    templates: $localize`:@@nav.templates:Templates`,
    designs: $localize`:@@nav.designs:Designs`,
    apropos: $localize`:@@nav.apropos:À propos`,
    github: $localize`:@@nav.github:Code source sur GitHub`,
    menuOuvrir: $localize`:@@nav.menu.ouvrir:Ouvrir le menu`,
    menuFermer: $localize`:@@nav.menu.fermer:Fermer le menu`,
  },
  theme: {
    titre: $localize`:@@theme.titre:Thème du site`,
    clair: $localize`:@@theme.clair:Clair`,
    sombre: $localize`:@@theme.sombre:Sombre`,
    systeme: $localize`:@@theme.systeme:Système`,
    /** Libellé du bouton : le choix courant, en minuscules. */
    bouton: (choix: string) => $localize`:@@theme.bouton:Thème du site : ${choix}:choix:`,
  },
  pied: {
    texte: $localize`:@@pied.texte:${NOM}:nom: est un catalogue open source de ressources Angular. Code sous licence MIT, sans compte ni paiement.`,
    catalogue: $localize`:@@pied.catalogue:Catalogue`,
    projet: $localize`:@@pied.projet:Projet`,
    contribuer: $localize`:@@pied.contribuer:Contribuer`,
    licence: $localize`:@@pied.licence:Licence MIT`,
    mentions: $localize`:@@pied.mentions:Mentions légales`,
    confidentialite: $localize`:@@pied.confidentialite:Confidentialité`,
    marque: $localize`:@@pied.marque:Angular est une marque de Google LLC. ${NOM}:nom: est un projet indépendant, non affilié à Google.`,
    provisoire: $localize`:@@pied.provisoire:Les ressources visibles sur ce site sont des démonstrations provisoires.`,
    suivre: $localize`:@@pied.suivre:Suivre Sidy`,
    instagram: $localize`:@@pied.instagram:Instagram de Sidy`,
    tiktok: $localize`:@@pied.tiktok:TikTok de Sidy`,
    linkedin: $localize`:@@pied.linkedin:LinkedIn de Sidy`,
    github: $localize`:@@pied.github:GitHub de Sidy`,
    email: $localize`:@@pied.email:Écrire un e-mail à Sidy`,
    signature: $localize`:@@pied.signature:Développé par`,
    signatureAria: $localize`:@@pied.signature.aria:Développé par Sidy : voir son portfolio`,
  },
  /** Recherche globale (dialogue ⌘K / Ctrl+K). */
  recherche: {
    declencheur: $localize`:@@recherche.declencheur:Rechercher une ressource`,
    label: $localize`:@@recherche.label:Rechercher dans le catalogue`,
    placeholder: $localize`:@@recherche.placeholder:Calendrier, formulaire, thème…`,
    fermer: $localize`:@@recherche.fermer:Fermer la recherche`,
    aide: $localize`:@@recherche.aide:Flèches pour choisir, Entrée pour ouvrir, Échap pour fermer.`,
    toutes: $localize`:@@recherche.toutes:Toutes les ressources`,
    raccourciCtrl: $localize`:@@recherche.raccourci-ctrl:Ctrl K`,
    chargement: $localize`:@@recherche.chargement:Chargement de la recherche`,
    videTitre: (requete: string) =>
      $localize`:@@recherche.vide.titre:Aucune ressource ne correspond à « ${requete}:requete: »`,
    videTexte: $localize`:@@recherche.vide.texte:Essayez un mot plus court, ou parcourez le catalogue.`,
    /** Annonce aux lecteurs d'écran après chaque frappe. */
    annonce: (n: number) =>
      n === 1
        ? $localize`:@@recherche.annonce.un:${n}:n: résultat`
        : $localize`:@@recherche.annonce.plusieurs:${n}:n: résultats`,
    voirTous: (famille: string, n: number) =>
      $localize`:@@recherche.voir-tous:Voir tout : ${famille}:famille: (${n}:n:)`,
  },
  /** États communs des zones qui chargent le registre (chunk d'index) : chargement, erreur. */
  etats: {
    chargement: $localize`:@@etat.chargement:Chargement du catalogue`,
    erreurTitre: $localize`:@@etat.erreur.titre:Le catalogue n’a pas pu se charger`,
    erreurTexte: $localize`:@@etat.erreur.texte:Vérifiez votre connexion, puis réessayez.`,
    reessayer: $localize`:@@etat.reessayer:Réessayer`,
  },
  pages: {
    accueil: {
      titrePage: $localize`:@@accueil.titre-page:${NOM}:nom: — composants Angular à copier ou télécharger`,
      h1: $localize`:@@accueil.h1:Des composants Angular à prendre tels quels.`,
      lead: $localize`:@@accueil.lead:Composants, blocs et thèmes en code ouvert, sous licence MIT. Essayez-les ici, copiez le code ou téléchargez-les. Aucun compte, aucun paiement.`,
      cta: $localize`:@@accueil.cta:Parcourir le catalogue`,
    },
    catalogue: {
      titrePage: $localize`:@@catalogue.titre-page:Catalogue — ${NOM}:nom:`,
      h1: $localize`:@@catalogue.h1:Toutes les ressources Angular`,
      lead: $localize`:@@catalogue.lead:Chaque ressource fonctionne dans la page : essayez-la avant de copier son code.`,
    },
    apropos: {
      titrePage: $localize`:@@apropos.titre-page:À propos — ${NOM}:nom:`,
      h1: $localize`:@@apropos.h1:Des pièces Angular libres, sans compte ni achat`,
      lead: $localize`:@@apropos.lead:${NOM}:nom: rassemble des composants, des blocs et des designs Angular. Vous les essayez dans la page, puis vous copiez leur code ou vous le téléchargez. Ce code est sous licence MIT : il est à vous dès que vous le prenez.`,
    },
    /** Pages de liste prérendues : catégorie (/composants), type (/blocs/navbar) et secteur. */
    listes: {
      /** « Navbar Angular — NgShelf » : le nom d'une catégorie ou d'un type. */
      titrePage: (nom: string) => $localize`:@@liste.titre-page:${nom}:nom: Angular — ${NOM}:site:`,
      titrePageSecteur: (secteur: string) =>
        $localize`:@@liste.titre-page-secteur:${secteur}:secteur: : ressources Angular — ${NOM}:site:`,
      types: $localize`:@@liste.types:Par type`,
      secteur: $localize`:@@liste.secteur:Secteur`,
      secteurAide: $localize`:@@liste.secteur-aide:Domaine d’activité pour lequel la ressource a été pensée : restaurant, voyage, transport…`,
    },
    ressource: {
      titrePage: (titre: string) =>
        $localize`:@@ressource.titre-page:${titre}:titre: — ${NOM}:nom:`,
      introuvableTitre: $localize`:@@ressource.introuvable.titre:Cette ressource n’existe pas`,
      introuvableTexte: $localize`:@@ressource.introuvable.texte:Elle a peut-être été renommée. Retrouvez-la depuis le catalogue.`,
      introuvableCta: $localize`:@@ressource.introuvable.cta:Retour au catalogue`,
    },
    introuvable: {
      titrePage: $localize`:@@page.introuvable.titre-page:Page introuvable — ${NOM}:nom:`,
      h1: $localize`:@@page.introuvable.h1:Cette page n’existe pas`,
      texte: $localize`:@@page.introuvable.texte:Elle a peut-être été déplacée ou l’adresse contient une faute de frappe. Retrouvez ce que vous cherchez depuis le catalogue.`,
      cta: $localize`:@@page.introuvable.cta:Aller au catalogue`,
      accueil: $localize`:@@page.introuvable.accueil:Retour à l’accueil`,
    },
  },
} as const;

/** Nombre de ressources : « 0 ressource », « 1 ressource », « 7 ressources » (le zéro est singulier en français). */
export function libelleCompte(n: number): string {
  return n <= 1
    ? $localize`:@@liste.compte.un:${n}:n: ressource`
    : $localize`:@@liste.compte.plusieurs:${n}:n: ressources`;
}

/** Liste de ressources : titre masqué pour les lecteurs d'écran, états, mentions des fiches. */
export const TEXTES_LISTE = {
  titre: $localize`:@@liste.titre:Ressources`,
  provisoire: $localize`:@@badge.provisoire:Démo provisoire`,
  videTitre: $localize`:@@liste.vide.titre:Rien à afficher pour l’instant`,
  videTexte: $localize`:@@liste.vide.texte:Cette page n’a pas encore de ressource. Parcourez le catalogue pour en trouver d’autres.`,
  videCta: $localize`:@@liste.vide.cta:Voir le catalogue`,
} as const;

/** Phrase d'introduction d'une catégorie (page /composants, /blocs…). */
export const DESCRIPTIONS_CATEGORIE: Record<Categorie, string> = {
  composant: $localize`:@@cat.composants.texte:Des pièces d’interface autonomes : champs, interrupteurs, calendriers, notifications.`,
  bloc: $localize`:@@cat.blocs.texte:Des sections de page complètes, prêtes à recevoir votre contenu.`,
  template: $localize`:@@cat.templates.texte:Des pages entières, de la navigation au pied de page.`,
  design: $localize`:@@cat.designs.texte:Des habillages visuels prêts à l’emploi : couleurs, rayons, densité et police (tokens), en clair et en sombre.`,
};

/** Libellés des catégories : pluriel (navigation, listes) et singulier (badges). */
export const LIBELLES_CATEGORIE: Record<Categorie, { pluriel: string; singulier: string }> = {
  composant: {
    pluriel: $localize`:@@cat.composants:Composants`,
    singulier: $localize`:@@cat.composants.un:Composant`,
  },
  bloc: {
    pluriel: $localize`:@@cat.blocs:Blocs`,
    singulier: $localize`:@@cat.blocs.un:Bloc`,
  },
  template: {
    pluriel: $localize`:@@cat.templates:Templates`,
    singulier: $localize`:@@cat.templates.un:Template`,
  },
  design: {
    pluriel: $localize`:@@cat.designs:Designs`,
    singulier: $localize`:@@cat.designs.un:Design`,
  },
};

/** Libellés des types (vocabulaire contrôlé, ADR 0004). */
export const LIBELLES_TYPE: Record<TypeRessource, string> = {
  bouton: $localize`:@@type.bouton:Bouton`,
  champ: $localize`:@@type.champ:Champ de formulaire`,
  selection: $localize`:@@type.selection:Liste de sélection`,
  'case-a-cocher': $localize`:@@type.case-a-cocher:Case à cocher`,
  interrupteur: $localize`:@@type.interrupteur:Interrupteur`,
  badge: $localize`:@@type.badge:Badge`,
  avatar: $localize`:@@type.avatar:Avatar`,
  carte: $localize`:@@type.carte:Carte`,
  modale: $localize`:@@type.modale:Modale`,
  tiroir: $localize`:@@type.tiroir:Tiroir`,
  'menu-deroulant': $localize`:@@type.menu-deroulant:Menu déroulant`,
  onglets: $localize`:@@type.onglets:Onglets`,
  accordeon: $localize`:@@type.accordeon:Accordéon`,
  infobulle: $localize`:@@type.infobulle:Infobulle`,
  notification: $localize`:@@type.notification:Notification`,
  alerte: $localize`:@@type.alerte:Alerte`,
  tableau: $localize`:@@type.tableau:Tableau`,
  pagination: $localize`:@@type.pagination:Pagination`,
  'fil-d-ariane': $localize`:@@type.fil-d-ariane:Fil d’Ariane`,
  calendrier: $localize`:@@type.calendrier:Calendrier`,
  chargement: $localize`:@@type.chargement:Chargement`,
  etapes: $localize`:@@type.etapes:Étapes`,
  navbar: $localize`:@@type.navbar:Navbar`,
  footer: $localize`:@@type.footer:Footer`,
  hero: $localize`:@@type.hero:Hero`,
  fonctionnalites: $localize`:@@type.fonctionnalites:Fonctionnalités`,
  pricing: $localize`:@@type.pricing:Tarifs`,
  temoignages: $localize`:@@type.temoignages:Témoignages`,
  faq: $localize`:@@type.faq:FAQ`,
  'appel-a-l-action': $localize`:@@type.appel-a-l-action:Appel à l’action`,
  formulaire: $localize`:@@type.formulaire:Formulaire`,
  equipe: $localize`:@@type.equipe:Équipe`,
  statistiques: $localize`:@@type.statistiques:Statistiques`,
  galerie: $localize`:@@type.galerie:Galerie`,
  logos: $localize`:@@type.logos:Logos`,
  newsletter: $localize`:@@type.newsletter:Newsletter`,
  'section-contenu': $localize`:@@type.section-contenu:Section de contenu`,
  landing: $localize`:@@type.landing:Landing`,
  vitrine: $localize`:@@type.vitrine:Site vitrine`,
  'tableau-de-bord': $localize`:@@type.tableau-de-bord:Tableau de bord`,
  authentification: $localize`:@@type.authentification:Authentification`,
  blog: $localize`:@@type.blog:Blog`,
  portfolio: $localize`:@@type.portfolio:Portfolio`,
  boutique: $localize`:@@type.boutique:Boutique`,
  'page-erreur': $localize`:@@type.page-erreur:Page d’erreur`,
};

/** Libellés des secteurs (vocabulaire contrôlé, ADR 0004). */
export const LIBELLES_SECTEUR: Record<Secteur, string> = {
  voyage: $localize`:@@secteur.voyage:Voyage`,
  restaurant: $localize`:@@secteur.restaurant:Restaurant`,
  transport: $localize`:@@secteur.transport:Transport`,
  sante: $localize`:@@secteur.sante:Santé`,
  immobilier: $localize`:@@secteur.immobilier:Immobilier`,
  education: $localize`:@@secteur.education:Éducation`,
  commerce: $localize`:@@secteur.commerce:Commerce`,
  finance: $localize`:@@secteur.finance:Finance`,
  evenementiel: $localize`:@@secteur.evenementiel:Événementiel`,
  'beaute-bien-etre': $localize`:@@secteur.beaute-bien-etre:Beauté et bien-être`,
  sport: $localize`:@@secteur.sport:Sport`,
  saas: $localize`:@@secteur.saas:SaaS`,
  associatif: $localize`:@@secteur.associatif:Associatif`,
  creatif: $localize`:@@secteur.creatif:Créatif`,
};
