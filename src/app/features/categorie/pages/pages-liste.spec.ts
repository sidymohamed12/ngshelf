import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import compteurs from '@generated/registre/compteurs.json';
import { routes } from '../../../app.routes';
import { TEXTES, TEXTES_CATALOGUE } from '@core/i18n/textes.fr';
import { CHARGEUR_INDEX, ChargeurIndex, chargerIndexGenere } from '@core/registre/registre.donnees';

/** Les pages prérendues de catégorie, de type et de secteur, avec le vrai registre du dépôt. */
describe('pages de liste', () => {
  async function ouvrir(url: string, chargeur?: ChargeurIndex): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        ...(chargeur ? [{ provide: CHARGEUR_INDEX, useValue: chargeur }] : []),
      ],
    });
    const harness = await RouterTestingHarness.create(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  const principal = (): HTMLElement => document.querySelector('main') ?? document.body;

  it('liste les ressources d’une catégorie et les types qui ont une page', async () => {
    await ouvrir('/composants');
    const page = principal();
    expect(page.querySelector('h1')?.textContent).toBe('Composants');
    expect(page.querySelectorAll('li.ngs-case')).toHaveLength(compteurs.categories.composant);
    const types = [...page.querySelectorAll('nav a.ngs-chip')].map((a) => a.getAttribute('href'));
    expect(types).toContain('/composants/champ');
    expect(types).not.toContain('/composants/modale');
  });

  it('affiche l’état vide d’une catégorie sans ressource', async () => {
    await ouvrir('/templates');
    expect(principal().textContent).toContain(TEXTES_CATALOGUE.templatesTitre);
  });

  it('liste les ressources d’un type, avec le lien de retour vers sa catégorie', async () => {
    await ouvrir('/composants/champ');
    const page = principal();
    expect(page.querySelector('h1')?.textContent).toBe('Champ de formulaire');
    expect(page.querySelectorAll('li.ngs-case')).toHaveLength(2);
    expect(page.querySelector('a.ngs-link')?.getAttribute('href')).toBe('/composants');
  });

  it('affiche « page introuvable » pour un type qui n’existe pas dans la catégorie', async () => {
    await ouvrir('/composants/navbar');
    expect(principal().querySelector('h1')?.textContent).toBe(TEXTES.pages.introuvable.h1);
  });

  it('liste les ressources d’un secteur, toutes catégories confondues', async () => {
    await ouvrir('/secteurs/restaurant');
    const page = principal();
    expect(page.querySelector('h1')?.textContent).toBe('Restaurant');
    expect(page.querySelectorAll('li.ngs-case')).toHaveLength(2);
  });

  it('affiche « page introuvable » pour un secteur inconnu', async () => {
    await ouvrir('/secteurs/jardinage');
    expect(principal().querySelector('h1')?.textContent).toBe(TEXTES.pages.introuvable.h1);
  });

  it('affiche une erreur avec « Réessayer » quand l’index ne se charge pas, puis la liste au nouvel essai', async () => {
    let echec = true;
    const reel: ChargeurIndex = async (categorie) => {
      if (echec) throw new Error('réseau coupé');
      return chargerIndexGenere(categorie);
    };
    await ouvrir('/blocs', reel);
    const page = principal();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(TEXTES.etats.erreurTitre);
    echec = false;
    page.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(page.querySelectorAll('li.ngs-case')).toHaveLength(compteurs.categories.bloc);
  });
});
