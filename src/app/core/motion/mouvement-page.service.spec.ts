import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Bibliotheques, BibliothequesMouvementService } from './bibliotheques-mouvement.service';
import {
  CLASSE_MOTION,
  ContexteMouvement,
  Demontage,
  MouvementPageService,
} from './mouvement-page.service';

/** Faux GSAP : juste ce que le service touche (matchMedia, ticker) ; les animations sont l'affaire des pages. */
function fauxGsap() {
  let nettoyage: Demontage | void;
  const journal = { montages: 0, retours: 0, rafraichissements: 0 };
  const bibliotheques = {
    gsap: {
      matchMedia: () => ({
        add: (_conditions: unknown, fonction: (c: unknown) => Demontage | void) => {
          journal.montages++;
          nettoyage = fonction({ conditions: { large: true, pointeurFin: false } });
        },
        revert: () => {
          journal.retours++;
          if (nettoyage) nettoyage();
        },
      }),
      ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
    },
    ScrollTrigger: {
      refresh: () => journal.rafraichissements++,
      update: vi.fn(),
    },
    SplitText: {},
  } as unknown as Bibliotheques;
  return { bibliotheques, journal };
}

function simulerPreference(reduit: boolean): void {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: reduit,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

@Component({ selector: 'app-page-test', template: '', providers: [MouvementPageService] })
class PageTestComponent {
  readonly donnees = signal(true);
  readonly contextes: ContexteMouvement[] = [];
  readonly demontages = vi.fn();

  constructor() {
    inject(MouvementPageService).demarrer({
      pret: () => this.donnees(),
      monter: (contexte) => {
        this.contextes.push(contexte);
        return this.demontages;
      },
    });
  }
}

describe('MouvementPageService', () => {
  function preparer(reduit: boolean) {
    simulerPreference(reduit);
    const faux = fauxGsap();
    const charger = vi.fn().mockResolvedValue(faux.bibliotheques);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BibliothequesMouvementService, useValue: { charger, chargerLenis: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(PageTestComponent);
    const page = fixture.componentInstance;
    return { fixture, page, charger, ...faux };
  }

  async function stabiliser(fixture: ReturnType<typeof preparer>['fixture']): Promise<void> {
    for (let i = 0; i < 4; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resoudre) => setTimeout(resoudre));
    }
  }

  it('ne télécharge rien et ne monte rien quand le système demande moins de mouvement', async () => {
    const { fixture, page, charger, journal } = preparer(true);
    await stabiliser(fixture);
    expect(charger).not.toHaveBeenCalled();
    expect(page.contextes).toHaveLength(0);
    expect(journal.montages).toBe(0);
    expect(fixture.nativeElement.classList.contains(CLASSE_MOTION)).toBe(false);
  });

  it('charge les bibliothèques, monte la scène et pose la classe de la page', async () => {
    const { fixture, page, charger, journal } = preparer(false);
    await stabiliser(fixture);
    expect(charger).toHaveBeenCalledTimes(1);
    expect(journal.montages).toBe(1);
    expect(page.contextes).toHaveLength(1);
    expect(page.contextes[0]?.large).toBe(true);
    expect(page.contextes[0]?.pointeurFin).toBe(false);
    expect(fixture.nativeElement.classList.contains(CLASSE_MOTION)).toBe(true);
  });

  it('attend que les données soient prêtes avant de monter', async () => {
    const { fixture, page } = preparer(false);
    page.donnees.set(false);
    await stabiliser(fixture);
    expect(page.contextes).toHaveLength(0);
    page.donnees.set(true);
    await stabiliser(fixture);
    expect(page.contextes).toHaveLength(1);
  });

  it('défait la scène, rend le ticker et retire la classe à la destruction', async () => {
    const { fixture, page, journal } = preparer(false);
    await stabiliser(fixture);
    fixture.destroy();
    expect(journal.retours).toBe(1);
    expect(page.demontages).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.classList.contains(CLASSE_MOTION)).toBe(false);
  });
});
