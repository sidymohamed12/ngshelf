import { inject } from '@angular/core';
import { ResolveFn, Route, Routes } from '@angular/router';
import {
  seoAPropos,
  seoAccueil,
  seoCatalogue,
  seoCategorie,
  seoFiche,
  seoSecteur,
  seoType,
  pageIntrouvableSeo,
} from './app.seo';
import { LIBELLES_CATEGORIE, LIBELLES_SECTEUR, LIBELLES_TYPE, TEXTES } from '@core/i18n/textes.fr';
import { SEGMENT_SECTEURS } from '@core/registre/chemins';
import { FicheService } from '@features/ressource/services/fiche.service';
import { ficheResolver } from '@features/ressource/services/ressource.resolver';
import { CLE_SEO } from '@core/seo/page-seo';
import { ficheVitrineResolver } from '@shared/vitrine/donnees-vitrine';
import { donneesVitrineResolver } from '@shared/vitrine/donnees-vitrine';
import {
  CATEGORIES,
  CATEGORIES_TYPEES,
  SECTEURS,
  SEGMENT_CATEGORIE,
  TYPES_PAR_CATEGORIE,
} from '@shared/models/taxonomie.model';

const titreFiche: ResolveFn<string> = async (route) => {
  const resultat = await inject(FicheService).charger({
    categorie: route.paramMap.get('categorie') ?? undefined,
    type: route.paramMap.get('type') ?? undefined,
    slug: route.paramMap.get('slug') ?? undefined,
  });
  return resultat.etat === 'ok'
    ? TEXTES.pages.ressource.titrePage(resultat.fiche.meta.titre.fr)
    : TEXTES.pages.ressource.introuvableTitre;
};

/** Page d'une catégorie : /composants, /blocs, /templates, /designs. */
const routesCategories: Route[] = CATEGORIES.map((categorie) => ({
  path: SEGMENT_CATEGORIE[categorie],
  title: TEXTES.pages.listes.titrePage(LIBELLES_CATEGORIE[categorie].pluriel),
  data: { categorie, [CLE_SEO]: seoCategorie(categorie) },
  loadComponent: () =>
    import('@features/categorie/pages/categorie.component').then((m) => m.CategorieComponent),
}));

/** Page d'un type : /composants/modale, /blocs/navbar… Un type inconnu reçoit le titre « introuvable ». */
const routesTypes: Route[] = CATEGORIES_TYPEES.map((categorie) => ({
  path: `${SEGMENT_CATEGORIE[categorie]}/:type`,
  data: { categorie, [CLE_SEO]: seoType(categorie) },
  title: ((route) => {
    const type = TYPES_PAR_CATEGORIE[categorie].find((t) => t === route.paramMap.get('type'));
    return type
      ? TEXTES.pages.listes.titrePage(LIBELLES_TYPE[type])
      : TEXTES.pages.introuvable.titrePage;
  }) satisfies ResolveFn<string>,
  loadComponent: () =>
    import('@features/categorie/pages/type.component').then((m) => m.TypeComponent),
}));

const titreSecteur: ResolveFn<string> = (route) => {
  const secteur = SECTEURS.find((s) => s === route.paramMap.get('secteur'));
  return secteur
    ? TEXTES.pages.listes.titrePageSecteur(LIBELLES_SECTEUR[secteur])
    : TEXTES.pages.introuvable.titrePage;
};

/** Toutes les routes sont lazy. L'ordre compte : les chemins fixes avant la fiche, le joker en dernier. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        title: TEXTES.pages.accueil.titrePage,
        data: { [CLE_SEO]: seoAccueil },
        resolve: { donnees: donneesVitrineResolver },
        loadComponent: () =>
          import('@features/accueil/pages/accueil.component').then((m) => m.AccueilComponent),
      },
      {
        path: 'catalogue',
        title: TEXTES.pages.catalogue.titrePage,
        data: { [CLE_SEO]: seoCatalogue },
        loadComponent: () =>
          import('@features/catalogue/pages/catalogue.component').then((m) => m.CatalogueComponent),
      },
      ...routesCategories,
      ...routesTypes,
      {
        path: `${SEGMENT_SECTEURS}/:secteur`,
        title: titreSecteur,
        data: { [CLE_SEO]: seoSecteur },
        loadComponent: () =>
          import('@features/secteur/pages/secteur.component').then((m) => m.SecteurComponent),
      },
      {
        path: 'a-propos',
        title: TEXTES.pages.apropos.titrePage,
        data: { [CLE_SEO]: seoAPropos },
        resolve: { fiche: ficheVitrineResolver },
        loadComponent: () =>
          import('@features/a-propos/pages/a-propos.component').then((m) => m.AProposComponent),
      },
      {
        path: ':categorie/:type/:slug',
        title: titreFiche,
        data: { [CLE_SEO]: seoFiche },
        resolve: { donnees: ficheResolver },
        loadComponent: () =>
          import('@features/ressource/pages/ressource.component').then((m) => m.RessourceComponent),
      },
      // Prérendue en /404/, puis copiée en 404.html à la racine du build (scripts/dist/seo.ts) : l'hébergeur la
      // sert avec le statut 404 à toute adresse inconnue.
      {
        path: '404',
        title: TEXTES.pages.introuvable.titrePage,
        data: { [CLE_SEO]: pageIntrouvableSeo },
        loadComponent: () =>
          import('@features/not-found/pages/not-found.component').then((m) => m.NotFoundComponent),
      },
      {
        path: '**',
        title: TEXTES.pages.introuvable.titrePage,
        data: { [CLE_SEO]: pageIntrouvableSeo },
        loadComponent: () =>
          import('@features/not-found/pages/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
