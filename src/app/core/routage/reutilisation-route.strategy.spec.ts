import { Component, Service, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CLE_RECREER_SI_PARAMS, ReutilisationRouteStrategy } from './reutilisation-route.strategy';

@Service({ autoProvided: false })
class Compteur {
  creations = 0;
}

@Component({ selector: 'app-page-test', template: '' })
class PageTestComponent {
  constructor() {
    inject(Compteur).creations++;
  }
}

function preparer(recreer: boolean): Compteur {
  const compteur = new Compteur();
  TestBed.configureTestingModule({
    providers: [
      { provide: Compteur, useValue: compteur },
      { provide: RouteReuseStrategy, useExisting: ReutilisationRouteStrategy },
      provideRouter([
        {
          path: ':categorie/:type/:slug',
          data: recreer ? { [CLE_RECREER_SI_PARAMS]: true } : {},
          component: PageTestComponent,
        },
      ]),
    ],
  });
  return compteur;
}

describe('réutilisation des routes (fiche à fiche)', () => {
  it('recrée la page quand le slug change, sur une route marquée', async () => {
    const compteur = preparer(true);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blocs/hero/hero-restaurant');
    await harness.navigateByUrl('/blocs/hero/mur-images');
    expect(compteur.creations).toBe(2);
  });

  it('garde la page quand rien ne change (même adresse, simple fragment)', async () => {
    const compteur = preparer(true);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blocs/hero/hero-restaurant');
    await harness.navigateByUrl('/blocs/hero/hero-restaurant#code');
    expect(compteur.creations).toBe(1);
  });

  it('garde le comportement du routeur sur une route non marquée', async () => {
    const compteur = preparer(false);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blocs/hero/hero-restaurant');
    await harness.navigateByUrl('/blocs/hero/mur-images');
    expect(compteur.creations).toBe(1);
  });
});
