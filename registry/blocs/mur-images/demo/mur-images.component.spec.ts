import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MurImagesComponent } from '../mur-images.component';

const IMAGES = ['a', 'b', 'c', 'd'].map((nom) => `images/${nom}.svg`);

describe('MurImagesComponent', () => {
  let fixture: ComponentFixture<MurImagesComponent>;
  let racine: HTMLElement;

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(MurImagesComponent);
    fixture.componentRef.setInput('images', IMAGES);
    fixture.componentRef.setInput('titre', 'Un titre');
    fixture.componentRef.setInput('texte', 'Une phrase.');
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  const images = (): HTMLImageElement[] => [...racine.querySelectorAll('img')];

  it('répète chaque rangée deux fois, pour une boucle sans couture', async () => {
    await monter({ nombreLignes: 3, parLigne: 6 });
    expect(images()).toHaveLength(3 * 6 * 2);
  });

  it('décale les images d’une rangée à l’autre', async () => {
    await monter({ nombreLignes: 2, parLigne: 4 });
    const premiere = images()
      .slice(0, 4)
      .map((i) => i.getAttribute('src'));
    const seconde = images()
      .slice(8, 12)
      .map((i) => i.getAttribute('src'));
    expect(premiere).toEqual(['images/a.svg', 'images/b.svg', 'images/c.svg', 'images/d.svg']);
    expect(seconde).toEqual(['images/d.svg', 'images/a.svg', 'images/b.svg', 'images/c.svg']);
  });

  it('décore seulement : les images ont un alt vide et le mur est masqué aux lecteurs d’écran', async () => {
    await monter();
    expect(images().every((i) => i.getAttribute('alt') === '')).toBe(true);
    expect(images()[0]?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('nomme la section par son titre, h2 par défaut et h1 sur demande', async () => {
    await monter();
    const titre = racine.querySelector('h2');
    expect(titre?.textContent?.trim()).toBe('Un titre');
    expect(racine.querySelector('section')?.getAttribute('aria-labelledby')).toBe(titre?.id);
    fixture.componentRef.setInput('niveauTitre', 1);
    await fixture.whenStable();
    expect(racine.querySelector('h1')?.textContent?.trim()).toBe('Un titre');
    expect(racine.querySelector('h2')).toBeNull();
  });

  it('n’affiche l’action et le lien que s’ils ont un libellé', async () => {
    await monter();
    expect(racine.querySelectorAll('a')).toHaveLength(0);
    fixture.componentRef.setInput('action', 'Voir');
    fixture.componentRef.setInput('routeAction', '/voir');
    fixture.componentRef.setInput('lien', 'Plus');
    fixture.componentRef.setInput('routeLien', '/plus');
    await fixture.whenStable();
    const liens = [...racine.querySelectorAll('a')];
    expect(liens.map((a) => a.getAttribute('href'))).toEqual(['/voir', '/plus']);
  });

  it('transmet la durée, la perspective et la rotation en variables CSS', async () => {
    await monter({ duree: 90, perspective: 1000, rotation: 12 });
    const section = racine.querySelector('section');
    expect(section?.style.getPropertyValue('--ngs-dur')).toBe('90s');
    expect(section?.style.getPropertyValue('--ngs-persp')).toBe('1000px');
    expect(section?.style.getPropertyValue('--ngs-rot')).toBe('12deg');
  });

  it('coupe le mouvement avec animations = false (classe sur l’hôte)', async () => {
    await monter({ animations: false });
    expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
  });

  it('n’affiche aucune rangée sans image', async () => {
    await monter({ images: [] });
    expect(images()).toHaveLength(0);
  });
});
