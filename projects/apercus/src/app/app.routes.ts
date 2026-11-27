import { Routes } from '@angular/router';
import { SCENES_APERCUS, SLUGS_APERCUS } from '@generated-apercus/scenes';

/** Une scène par ressource, chargée à la demande : seul le code de la ressource montrée est téléchargé. */
export const routes: Routes = [
  ...SLUGS_APERCUS.map((slug) => ({
    path: slug,
    loadComponent: SCENES_APERCUS[slug],
  })),
  {
    path: '**',
    loadComponent: () => import('./introuvable').then((m) => m.IntrouvableComponent),
  },
];
