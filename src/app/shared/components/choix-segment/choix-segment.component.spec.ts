import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChoixSegmentComponent, OptionSegment } from './choix-segment.component';

const OPTIONS: readonly OptionSegment[] = [
  { valeur: 'planche', libelle: 'Planche' },
  { valeur: 'fleuve', libelle: 'Fleuve' },
  { valeur: 'laterite', libelle: 'Latérite' },
];

@Component({
  selector: 'app-hote-test',
  imports: [ChoixSegmentComponent],
  template: `<app-choix-segment [options]="options" [(valeur)]="valeur" libelle="Design" />`,
})
class HoteTestComponent {
  readonly options = OPTIONS;
  readonly valeur = signal('planche');
}

describe('ChoixSegmentComponent', () => {
  function monter() {
    const fixture = TestBed.createComponent(HoteTestComponent);
    fixture.detectChanges();
    const boutons = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
      );
    return { fixture, boutons };
  }

  it('annonce un groupe de boutons radio dont un seul est dans la tabulation', () => {
    const { fixture, boutons } = monter();
    const groupe = (fixture.nativeElement as HTMLElement).querySelector('app-choix-segment');
    expect(groupe?.getAttribute('role')).toBe('radiogroup');
    expect(groupe?.getAttribute('aria-label')).toBe('Design');
    expect(boutons().map((b) => b.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(boutons().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  });

  it('choisit au clic', () => {
    const { fixture, boutons } = monter();
    boutons()[1]?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.valeur()).toBe('fleuve');
  });

  it('se déplace aux flèches, en bouclant, et avec Début et Fin', () => {
    const { fixture, boutons } = monter();
    const presser = (touche: string, i: number) => {
      boutons()[i]?.dispatchEvent(new KeyboardEvent('keydown', { key: touche, bubbles: true }));
      fixture.detectChanges();
    };
    presser('ArrowRight', 0);
    expect(fixture.componentInstance.valeur()).toBe('fleuve');
    presser('ArrowLeft', 0);
    expect(fixture.componentInstance.valeur()).toBe('laterite');
    presser('Home', 2);
    expect(fixture.componentInstance.valeur()).toBe('planche');
    presser('End', 0);
    expect(fixture.componentInstance.valeur()).toBe('laterite');
  });

  it('ignore les autres touches', () => {
    const { fixture, boutons } = monter();
    boutons()[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.valeur()).toBe('planche');
  });
});
