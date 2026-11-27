import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { RegistreService } from '@core/registre/registre.service';

const titreFiche: ResolveFn<string> = async (route) => {
  try {
    const ressource = await inject(RegistreService).trouver(route.params);
    return ressource
      ? TEXTES.pages.ressource.titrePage(ressource.titre.fr)
      : TEXTES.pages.ressource.introuvableTitre;
  } catch {
    // Index illisible : la page affiche son propre état d'erreur, le titre reste neutre.
    return TEXTES.pages.ressource.introuvableTitre;
  }
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
        loadComponent: () =>
          import('@features/accueil/pages/accueil.component').then((m) => m.AccueilComponent),
      },
      {
        path: 'catalogue',
        title: TEXTES.pages.catalogue.titrePage,
        loadComponent: () =>
          import('@features/catalogue/pages/catalogue.component').then((m) => m.CatalogueComponent),
      },
      {
        path: 'a-propos',
        title: TEXTES.pages.apropos.titrePage,
        loadComponent: () =>
          import('@features/a-propos/pages/a-propos.component').then((m) => m.AProposComponent),
      },
      {
        path: ':categorie/:type/:slug',
        title: titreFiche,
        loadComponent: () =>
          import('@features/ressource/pages/ressource.component').then((m) => m.RessourceComponent),
      },
      {
        path: '**',
        title: TEXTES.pages.introuvable.titrePage,
        loadComponent: () =>
          import('@features/not-found/pages/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
