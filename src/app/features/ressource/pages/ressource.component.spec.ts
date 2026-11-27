import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { RessourceComponent } from './ressource.component';

function creer(donnees: unknown): HTMLElement {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(RessourceComponent);
  fixture.componentRef.setInput('donnees', donnees);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('fiche : états sans données', () => {
  it('annonce une ressource introuvable avec un lien vers le catalogue', () => {
    const page = creer({ etat: 'introuvable' });
    expect(page.querySelector('h1')?.textContent).toContain(
      TEXTES.pages.ressource.introuvableTitre,
    );
    expect(page.querySelector('a[href="/catalogue"]')).not.toBeNull();
    expect(page.querySelector('iframe')).toBeNull();
  });

  it('propose « Réessayer » quand le chargement a échoué', () => {
    const page = creer({ etat: 'erreur' });
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(TEXTES.etats.reessayer);
    expect(page.querySelector('iframe')).toBeNull();
  });
});
