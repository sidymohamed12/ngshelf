import { TestBed } from '@angular/core/testing';
import { SqueletteComponent } from './squelette.component';

describe('squelette de chargement', () => {
  function creer(entrees: Record<string, string> = {}): HTMLElement {
    const fixture = TestBed.createComponent(SqueletteComponent);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('est décoratif sans libellé : masqué aux lecteurs d’écran', () => {
    const el = creer();
    expect(el.classList).toContain('ngs-skeleton');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
  });

  it('s’annonce comme une région « status » avec son libellé', () => {
    const el = creer({ libelle: 'Chargement de l’aperçu' });
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.querySelector('.sr-only')?.textContent).toBe('Chargement de l’aperçu');
  });

  it('prend la forme demandée', () => {
    expect(creer({ forme: 'plein' }).classList).toContain('ngs-skeleton--plein');
    expect(creer({ forme: 'ligne' }).classList).toContain('ngs-skeleton--ligne');
    expect(creer().classList).not.toContain('ngs-skeleton--plein');
  });
});
