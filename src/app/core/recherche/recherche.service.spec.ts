import { TestBed } from '@angular/core/testing';
import { CHARGEUR_INDEX, ChargeurIndex } from '@core/registre/registre.donnees';
import { RechercheService } from './recherche.service';

describe('RechercheService', () => {
  let echecs: number;
  let appels: number;

  function service(): RechercheService {
    echecs = 0;
    appels = 0;
    const chargeur: ChargeurIndex = async (categorie) => {
      appels += 1;
      if (echecs > 0) {
        echecs -= 1;
        throw new Error('réseau coupé');
      }
      return categorie === 'composant'
        ? [
            {
              slug: 'a',
              categorie: 'composant',
              type: 'carte',
              titre: { fr: 'A' },
              description: { fr: 'a' },
              secteurs: [],
              tags: [],
              contratTokens: 1,
              animee: false,
              tailleCase: 'normale',
              statut: 'publie',
              ajouteLe: '2026-01-01',
            },
            {
              slug: 'b',
              categorie: 'composant',
              type: 'carte',
              titre: { fr: 'B' },
              description: { fr: 'b' },
              secteurs: [],
              tags: [],
              contratTokens: 1,
              animee: false,
              tailleCase: 'normale',
              statut: 'deprecie',
              ajouteLe: '2026-01-01',
            },
          ]
        : [];
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CHARGEUR_INDEX, useValue: chargeur }],
    });
    return TestBed.inject(RechercheService);
  }

  it('ouvre, ferme et bascule le dialogue', () => {
    const recherche = service();
    expect(recherche.ouverte()).toBe(false);
    expect(recherche.dejaOuverte()).toBe(false);
    recherche.ouvrir();
    expect(recherche.dejaOuverte()).toBe(true);
    expect(recherche.ouverte()).toBe(true);
    recherche.fermer();
    expect(recherche.ouverte()).toBe(false);
    expect(recherche.dejaOuverte()).toBe(true);
    recherche.basculer();
    expect(recherche.ouverte()).toBe(true);
  });

  it('construit l’index une seule fois, sans les ressources dépréciées', async () => {
    const recherche = service();
    const index = await recherche.indexRecherche();
    await recherche.indexRecherche();
    expect(index.map((e) => e.entree.slug)).toEqual(['a']);
    expect(appels).toBe(4);
  });

  it('ne mémorise pas un échec : le nouvel essai recharge', async () => {
    const recherche = service();
    echecs = 1;
    await expect(recherche.indexRecherche()).rejects.toThrow('réseau coupé');
    await expect(recherche.indexRecherche()).resolves.toHaveLength(1);
  });

  it('précharge sans lever d’erreur quand le chargement échoue', async () => {
    const recherche = service();
    echecs = 4;
    expect(() => recherche.precharger()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve));
    echecs = 0;
    await expect(recherche.indexRecherche()).resolves.toHaveLength(1);
  });
});
