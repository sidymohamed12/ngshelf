import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { IconeComponent } from './icone.component';
import { CHEMIN_SPRITE, NOMS_ICONES } from './icones';

@Component({
  imports: [IconeComponent],
  template: '<svg appIcone="sun" taille="sm"></svg>',
})
class Hote {}

describe('IconeComponent', () => {
  it("référence le symbole du sprite et masque l'icône aux lecteurs d'écran", async () => {
    const fixture = TestBed.createComponent(Hote);
    await fixture.whenStable();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg') as SVGElement;
    const use = svg.querySelector('use');
    expect(use?.getAttribute('href')).toBe(`${CHEMIN_SPRITE}#sun`);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.classList.contains('ngs-icon')).toBe(true);
    expect(svg.classList.contains('ngs-icon--sm')).toBe(true);
  });

  it('liste exactement les symboles du sprite public/icons/sprite.svg', () => {
    const sprite = readFileSync('public/icons/sprite.svg', 'utf8');
    const ids = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]).sort();
    expect([...NOMS_ICONES]).toEqual(ids);
  });
});
