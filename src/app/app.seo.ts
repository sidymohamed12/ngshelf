import { inject } from '@angular/core';
import { SITE } from '@core/config/site.config';
import {
  LIBELLES_CATEGORIE,
  LIBELLES_SECTEUR,
  LIBELLES_TYPE,
  TEXTES,
  libelleCompte,
} from '@core/i18n/textes.fr';
import { TEXTES_SEO } from '@core/i18n/textes-seo';
import {
  cheminCategorie,
  cheminRessource,
  cheminSecteur,
  cheminType,
} from '@core/registre/chemins';
import { RegistreService } from '@core/registre/registre.service';
import {
  MaillonAriane,
  ficheCode,
  filAriane,
  pageAPropos,
  pageCollection,
  siteWeb,
} from '@core/seo/json-ld';
import { FabriquePageSeo, JsonLd, PageSeo } from '@core/seo/page-seo';
import { ResultatFiche } from '@features/ressource/services/fiche.service';
import {
  Categorie,
  CategorieTypee,
  SECTEURS,
  TYPES_PAR_CATEGORIE,
  TypeRessource,
} from '@shared/models/taxonomie.model';

/**
 * SEO de chaque page : description, chemin, indexation et données structurées. Le titre reste celui de
 * la route (`title`). Une fabrique par type de page, branchée dans `data.seo` de `app.routes.ts` ; elles
 * s'exécutent dans un contexte d'injection (`TitreSeoStrategy`). Rien n'est inventé : chaque phrase vient
 * des textes du site, des libellés de la taxonomie, des compteurs ou du `meta.json` de la ressource.
 */

const CHEMIN_ACCUEIL = '/';
const CHEMIN_CATALOGUE = '/catalogue';
const CHEMIN_A_PROPOS = '/a-propos';
const CHEMIN_INTROUVABLE = '/404';

function ariane(...maillons: readonly MaillonAriane[]): JsonLd {
  return filAriane(
    [{ nom: TEXTES_SEO.arianeAccueil, chemin: CHEMIN_ACCUEIL }, ...maillons],
    SITE.url,
  );
}

/** Page qui n'existe pas (404, type ou secteur inconnu, ressource introuvable) : `noindex`, sans canonique. */
export function pageIntrouvableSeo(): PageSeo {
  return {
    description: TEXTES_SEO.introuvable,
    chemin: CHEMIN_INTROUVABLE,
    indexable: false,
    jsonLd: [],
  };
}

export const seoAccueil: FabriquePageSeo = () => ({
  description: TEXTES_SEO.accueil,
  chemin: CHEMIN_ACCUEIL,
  indexable: true,
  jsonLd: [siteWeb(SITE)],
});

export const seoCatalogue: FabriquePageSeo = () => {
  const page = {
    nom: TEXTES.pages.catalogue.h1,
    description: TEXTES_SEO.catalogue,
    chemin: CHEMIN_CATALOGUE,
  };
  return {
    description: page.description,
    chemin: page.chemin,
    indexable: true,
    jsonLd: [pageCollection(page, SITE), ariane({ nom: TEXTES.nav.catalogue })],
  };
};

export const seoAPropos: FabriquePageSeo = () => {
  const page = {
    nom: TEXTES.nav.apropos,
    description: TEXTES_SEO.apropos,
    chemin: CHEMIN_A_PROPOS,
  };
  return {
    description: page.description,
    chemin: page.chemin,
    indexable: true,
    jsonLd: [pageAPropos(page, SITE), ariane({ nom: page.nom })],
  };
};

/** Une page de liste vide n'a rien à indexer : `noindex` (et hors sitemap, voir scripts/dist/seo.ts). */
function pageListe(
  page: { nom: string; description: string; chemin: string },
  compte: number,
  fil: readonly MaillonAriane[],
): PageSeo {
  return {
    description: page.description,
    chemin: page.chemin,
    indexable: compte > 0,
    jsonLd: [pageCollection(page, SITE), ariane(...fil)],
  };
}

function descriptionListe(nom: string, compte: number): string {
  return compte > 0 ? TEXTES_SEO.liste(nom, libelleCompte(compte)) : TEXTES_SEO.listeVide(nom);
}

export function seoCategorie(categorie: Categorie): FabriquePageSeo {
  return () => {
    const nom = LIBELLES_CATEGORIE[categorie].pluriel;
    const compte = inject(RegistreService).compteurs.categories[categorie];
    const chemin = cheminCategorie(categorie);
    return pageListe({ nom, chemin, description: descriptionListe(nom, compte) }, compte, [
      { nom },
    ]);
  };
}

function typeDeLaCategorie(
  categorie: CategorieTypee,
  valeur: string | null,
): TypeRessource | undefined {
  return TYPES_PAR_CATEGORIE[categorie].find((t) => t === valeur);
}

export function seoType(categorie: CategorieTypee): FabriquePageSeo {
  return (route) => {
    const type = typeDeLaCategorie(categorie, route.paramMap.get('type'));
    if (!type) return pageIntrouvableSeo();
    const nom = LIBELLES_TYPE[type];
    const compte = inject(RegistreService).compteurs.types[type] ?? 0;
    return pageListe(
      {
        nom,
        chemin: cheminType(categorie, type),
        description: descriptionListe(nom, compte),
      },
      compte,
      [{ nom: LIBELLES_CATEGORIE[categorie].pluriel, chemin: cheminCategorie(categorie) }, { nom }],
    );
  };
}

export const seoSecteur: FabriquePageSeo = (route) => {
  const secteur = SECTEURS.find((s) => s === route.paramMap.get('secteur'));
  if (!secteur) return pageIntrouvableSeo();
  const nom = LIBELLES_SECTEUR[secteur];
  const compte = inject(RegistreService).compteurs.secteurs[secteur] ?? 0;
  return pageListe(
    {
      nom,
      chemin: cheminSecteur(secteur),
      description: TEXTES_SEO.listeSecteur(nom, libelleCompte(compte)),
    },
    compte,
    [{ nom }],
  );
};

/** Fiche : lue dans le résultat du resolver (`data.donnees`) ; introuvable ou en erreur, la page est `noindex`. */
export const seoFiche: FabriquePageSeo = (route) => {
  const resultat = route.data['donnees'] as ResultatFiche | undefined;
  if (resultat?.etat !== 'ok') return pageIntrouvableSeo();
  const { meta } = resultat.fiche;
  const nom = meta.titre.fr;
  const description = meta.description.fr;
  const chemin = cheminRessource(meta.categorie, meta.type, meta.slug);
  const fiche = {
    nom,
    description,
    chemin,
    motsCles: meta.tags,
    ajouteLe: meta.ajouteLe,
    modifieLe: meta.modifieLe,
    auteur: meta.auteur,
    angularMin: meta.angularMin,
  };
  return {
    description,
    chemin,
    indexable: meta.statut !== 'deprecie',
    jsonLd: [
      ficheCode(fiche, SITE),
      ariane(
        {
          nom: LIBELLES_CATEGORIE[meta.categorie].pluriel,
          chemin: cheminCategorie(meta.categorie),
        },
        { nom: LIBELLES_TYPE[meta.type], chemin: cheminType(meta.categorie, meta.type) },
        { nom },
      ),
    ],
  };
};
