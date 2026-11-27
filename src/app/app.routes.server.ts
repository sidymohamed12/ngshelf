import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { SEGMENT_SECTEURS } from '@core/registre/chemins';
import { RegistreService } from '@core/registre/registre.service';
import { CATEGORIES_TYPEES, SEGMENT_CATEGORIE } from '@shared/models/taxonomie.model';

/** Pages de type : seulement celles qui ont au moins une ressource (ADR 0004). */
const routesTypes: ServerRoute[] = CATEGORIES_TYPEES.map((categorie) => ({
  path: `${SEGMENT_CATEGORIE[categorie]}/:type`,
  renderMode: RenderMode.Prerender,
  getPrerenderParams: async () =>
    inject(RegistreService)
      .typesNonVides(categorie)
      .map((type) => ({ type })),
}));

/** Site 100 % statique (ADR 0001) : tout est prérendu, y compris chaque fiche du registre. */
export const serverRoutes: ServerRoute[] = [
  ...routesTypes,
  {
    path: `${SEGMENT_SECTEURS}/:secteur`,
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      inject(RegistreService)
        .secteursNonVides()
        .map((secteur) => ({ secteur })),
  },
  {
    path: ':categorie/:type/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => inject(RegistreService).parametresPrerendu(),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
