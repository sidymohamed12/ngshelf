import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { FicheService, ResultatFiche } from './fiche.service';

/**
 * Charge la fiche AVANT la navigation (ADR 0011) : la View Transition capture l'état final, sinon le
 * morph de la case viserait un cadre vide. Ne rejette jamais : l'échec devient un état de la page.
 */
export const ficheResolver: ResolveFn<ResultatFiche> = (route) =>
  inject(FicheService).charger({
    categorie: route.paramMap.get('categorie') ?? undefined,
    type: route.paramMap.get('type') ?? undefined,
    slug: route.paramMap.get('slug') ?? undefined,
  });
