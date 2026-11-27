import {
  LIBELLES_CATEGORIE,
  LIBELLES_SECTEUR,
  LIBELLES_TYPE,
  libelleCompte,
} from '@core/i18n/textes.fr';
import { cheminCategorie, cheminSecteur, cheminType } from '@core/registre/chemins';
import { NomIcone } from '@shared/components/icone/icones';
import { Compteurs } from '@shared/models/index-catalogue.model';
import {
  CATEGORIES,
  CategorieTypee,
  SECTEURS,
  TYPES_PAR_CATEGORIE,
} from '@shared/models/taxonomie.model';
import { ICONE_SECTEUR, classeCategorie } from '@shared/utils/taxonomie-affichage';

/** Une ligne du méga-menu ou de la liste des secteurs : un libellé, son compteur, et un lien s'il existe une page. */
export interface LienCompte {
  readonly libelle: string;
  /** Null quand il n'y a aucune ressource : la page n'est pas prérendue (ADR 0004), donc pas de lien mort. */
  readonly chemin: string | null;
  readonly compte: number;
  /** « 3 ressources », lu par les lecteurs d'écran à la place du chiffre seul. */
  readonly compteTexte: string;
  readonly icone: NomIcone | null;
  /** Classe de famille (.ngs-cat-*) qui colore le repère de la ligne. */
  readonly classe: string | null;
}

export interface MenuCatalogue {
  readonly familles: readonly LienCompte[];
  readonly composants: readonly LienCompte[];
  readonly blocs: readonly LienCompte[];
  readonly secteurs: readonly LienCompte[];
}

function ligne(
  libelle: string,
  chemin: string,
  compte: number,
  extra: { icone?: NomIcone; classe?: string } = {},
): LienCompte {
  return {
    libelle,
    chemin: compte > 0 ? chemin : null,
    compte,
    compteTexte: libelleCompte(compte),
    icone: extra.icone ?? null,
    classe: extra.classe ?? null,
  };
}

function typesDe(categorie: CategorieTypee, compteurs: Compteurs): LienCompte[] {
  return TYPES_PAR_CATEGORIE[categorie].map((type) =>
    ligne(LIBELLES_TYPE[type], cheminType(categorie, type), compteurs.types[type] ?? 0),
  );
}

/**
 * Contenu du méga-menu : les quatre familles, tous les types de composants et de blocs, tous les
 * secteurs, chacun avec son compteur. Les familles restent des liens même à zéro (leur page existe
 * toujours) ; types et secteurs vides sont du texte.
 */
export function construireMenuCatalogue(compteurs: Compteurs): MenuCatalogue {
  return {
    familles: CATEGORIES.map((categorie) => ({
      ...ligne(
        LIBELLES_CATEGORIE[categorie].pluriel,
        cheminCategorie(categorie),
        compteurs.categories[categorie],
        { classe: classeCategorie(categorie) },
      ),
      chemin: cheminCategorie(categorie),
    })),
    composants: typesDe('composant', compteurs),
    blocs: typesDe('bloc', compteurs),
    secteurs: SECTEURS.map((secteur) =>
      ligne(LIBELLES_SECTEUR[secteur], cheminSecteur(secteur), compteurs.secteurs[secteur] ?? 0, {
        icone: ICONE_SECTEUR[secteur],
      }),
    ),
  };
}
