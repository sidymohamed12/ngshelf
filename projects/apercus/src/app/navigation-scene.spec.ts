import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { neutraliserSoumissions, premiereNavigationSeulement } from './navigation-scene';

function garde(navigated: boolean): boolean | unknown {
  TestBed.configureTestingModule({
    providers: [{ provide: Router, useValue: { navigated } }],
  });
  return TestBed.runInInjectionContext(() =>
    premiereNavigationSeulement({} as never, {} as never),
  );
}

describe('premiereNavigationSeulement', () => {
  it('autorise la première navigation', () => {
    expect(garde(false)).toBe(true);
  });

  it('annule toute navigation suivante (clic sur un routerLink de la ressource)', () => {
    expect(garde(true)).toBe(false);
  });
});

describe('neutraliserSoumissions', () => {
  it('annule la soumission d’un formulaire de la scène, pas celle d’ailleurs', () => {
    const main = document.createElement('main');
    main.innerHTML = '<form id="dans"><button type="submit">Envoyer</button></form>';
    const dehors = document.createElement('form');
    document.body.append(main, dehors);
    const retirer = neutraliserSoumissions(document);

    const dans = new Event('submit', { bubbles: true, cancelable: true });
    main.querySelector('form')?.dispatchEvent(dans);
    const hors = new Event('submit', { bubbles: true, cancelable: true });
    dehors.dispatchEvent(hors);

    expect(dans.defaultPrevented).toBe(true);
    expect(hors.defaultPrevented).toBe(false);
    retirer();
    main.remove();
    dehors.remove();
  });
});
