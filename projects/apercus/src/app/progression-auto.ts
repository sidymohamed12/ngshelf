import {
  DOCUMENT,
  DestroyRef,
  Signal,
  afterNextRender,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ApercuService } from './apercu.service';

const PERIODE_MS = 7000;
const PROGRESSION_FIGEE = 0.62;
const DEUX_PI = 2 * Math.PI;

/**
 * Progression qui va et vient entre 0 et 1, pour les ressources pilotées par le défilement : une vignette
 * de planche n'a pas de défilement, elle rejoue donc l'effet en boucle. Figée à mi-parcours quand les
 * animations sont coupées (réglage de la fiche, ou mouvement réduit du système). Navigateur seulement.
 */
export function creerProgressionAuto(): Signal<number> {
  const document = inject(DOCUMENT);
  const contexte = inject(ApercuService);
  const destroyRef = inject(DestroyRef);
  const valeur = signal(PROGRESSION_FIGEE);
  const pret = signal(false);
  let image = 0;
  afterNextRender(() => pret.set(true));
  const arreter = (): void => {
    if (image) document.defaultView?.cancelAnimationFrame(image);
    image = 0;
  };
  effect(() => {
    arreter();
    const fenetre = document.defaultView;
    if (!pret() || !fenetre) return;
    if (!contexte.animations()) {
      valeur.set(PROGRESSION_FIGEE);
      return;
    }
    let debut: number | null = null;
    const pas = (t: number): void => {
      debut ??= t;
      valeur.set(0.5 - 0.5 * Math.cos(((t - debut) / PERIODE_MS) * DEUX_PI));
      image = fenetre.requestAnimationFrame(pas);
    };
    image = fenetre.requestAnimationFrame(pas);
  });
  destroyRef.onDestroy(arreter);
  return valeur.asReadonly();
}
