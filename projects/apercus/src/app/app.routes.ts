import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { SCENES_APERCUS, SLUGS_APERCUS } from '@generated-apercus/scenes';
import { ApercuService } from './apercu.service';

/** Une scène par ressource, chargée à la demande : seul le code de la ressource montrée est téléchargé. */
export const routes: Routes = [
  ...SLUGS_APERCUS.map((slug) => ({
    path: slug,
    canActivate: [
      () => {
        inject(ApercuService).ouvrir(slug);
        return true;
      },
    ],
    loadComponent: SCENES_APERCUS[slug],
  })),
  {
    path: '**',
    loadComponent: () => import('./introuvable').then((m) => m.IntrouvableComponent),
  },
];
