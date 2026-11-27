import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { RegistreService } from '@core/registre/registre.service';

/** Site 100 % statique (ADR 0001) : tout est prérendu, y compris chaque fiche du registre. */
export const serverRoutes: ServerRoute[] = [
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
