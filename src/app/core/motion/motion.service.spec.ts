import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';

interface FauxMedia {
  declencher(reduit: boolean): void;
}

function simulerPreference(reduit: boolean): FauxMedia {
  const ecouteurs = new Set<(e: MediaQueryListEvent) => void>();
  const media = { matches: reduit };
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return media.matches;
    },
    addEventListener: (_: string, e: (ev: MediaQueryListEvent) => void) => ecouteurs.add(e),
    removeEventListener: (_: string, e: (ev: MediaQueryListEvent) => void) => ecouteurs.delete(e),
  }));
  return {
    declencher(valeur) {
      media.matches = valeur;
      ecouteurs.forEach((ecouteur) => ecouteur({ matches: valeur } as MediaQueryListEvent));
    },
  };
}

/** Crée le service puis déclenche le cycle de rendu : c'est là qu'afterNextRender lit la préférence. */
function demarrer(): MotionService {
  const service = TestBed.inject(MotionService);
  TestBed.inject(ApplicationRef).tick();
  return service;
}

describe('MotionService', () => {
  it('lit prefers-reduced-motion après le premier rendu', () => {
    simulerPreference(true);
    const service = demarrer();
    expect(service.mouvementReduit()).toBe(true);
  });

  it('vaut faux quand le système ne demande pas de réduction', () => {
    simulerPreference(false);
    expect(demarrer().mouvementReduit()).toBe(false);
  });

  it('suit les changements du système', () => {
    const media = simulerPreference(false);
    const service = demarrer();
    media.declencher(true);
    expect(service.mouvementReduit()).toBe(true);
    media.declencher(false);
    expect(service.mouvementReduit()).toBe(false);
  });
});
