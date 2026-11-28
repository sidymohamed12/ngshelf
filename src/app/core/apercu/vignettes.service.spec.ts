import { TestBed } from '@angular/core/testing';
import { VIGNETTES_SIMULTANEES_MAX, VignettesService } from './vignettes.service';

describe('VignettesService', () => {
  let service: VignettesService;

  beforeEach(() => {
    service = TestBed.inject(VignettesService);
  });

  it('accorde une place par vignette, jusqu’au maximum', () => {
    for (let i = 0; i < VIGNETTES_SIMULTANEES_MAX; i++) {
      expect(service.reserver(`v${i}`)).toBe(true);
    }
    expect(service.actives).toBe(VIGNETTES_SIMULTANEES_MAX);
    expect(service.reserver('de-trop')).toBe(false);
  });

  it('ne compte pas deux fois la même vignette', () => {
    expect(service.reserver('a')).toBe(true);
    expect(service.reserver('a')).toBe(true);
    expect(service.actives).toBe(1);
  });

  it('rend une place et le signale pour que les vignettes en attente réessayent', () => {
    for (let i = 0; i < VIGNETTES_SIMULTANEES_MAX; i++) service.reserver(`v${i}`);
    const avant = service.liberations();
    service.liberer('v0');
    expect(service.liberations()).toBe(avant + 1);
    expect(service.reserver('de-trop')).toBe(true);
  });

  it('ignore la libération d’une vignette qui n’a pas de place', () => {
    const avant = service.liberations();
    service.liberer('inconnue');
    expect(service.liberations()).toBe(avant);
  });
});
