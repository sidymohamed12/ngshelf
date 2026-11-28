import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PieceVitrine, PieceVitrineComponent } from './piece-vitrine.component';

const CALENDRIER: PieceVitrine = { slug: 'calendrier', categorie: 'composant', type: 'calendrier' };

describe('PieceVitrineComponent', () => {
  function afficher(piece: PieceVitrine, coin: 'gauche' | 'droite' = 'gauche'): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PieceVitrineComponent);
    fixture.componentRef.setInput('piece', piece);
    fixture.componentRef.setInput('coin', coin);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it("nomme l'étiquette par le type et l'envoie vers la fiche", () => {
    const hote = afficher(CALENDRIER);
    const lien = hote.querySelector<HTMLAnchorElement>('a.ngs-etiquette');
    expect(lien?.textContent?.trim()).toBe('Calendrier');
    expect(lien?.getAttribute('href')).toBe('/composants/calendrier/calendrier');
  });

  it('prend la couleur de la famille de la ressource', () => {
    const hote = afficher({ slug: 'navbar-restaurant', categorie: 'bloc', type: 'navbar' });
    expect(hote.classList.contains('ngs-cat-blocs')).toBe(true);
    expect(hote.querySelector('a')?.getAttribute('href')).toBe('/blocs/navbar/navbar-restaurant');
  });

  it("garde l'aperçu décoratif : la scène est cachée aux lecteurs d'écran", () => {
    const hote = afficher(CALENDRIER);
    expect(hote.querySelector('.ngs-piece__scene')?.getAttribute('aria-hidden')).toBe('true');
  });

  it("place l'étiquette à droite à la demande", () => {
    const hote = afficher(CALENDRIER, 'droite');
    expect(hote.querySelector('a')?.classList.contains('ngs-etiquette--droite')).toBe(true);
  });
});
