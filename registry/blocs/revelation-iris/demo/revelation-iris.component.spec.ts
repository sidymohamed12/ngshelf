import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevelationIrisComponent } from '../revelation-iris.component';

describe('RevelationIrisComponent', () => {
  let fixture: ComponentFixture<RevelationIrisComponent>;
  let racine: HTMLElement;

  const section = (): HTMLElement | null => racine.querySelector('section');
  const progression = (): number => Number(section()?.style.getPropertyValue('--ngs-p'));

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    fixture = TestBed.createComponent(RevelationIrisComponent);
    fixture.componentRef.setInput('image', 'images/a.svg');
    fixture.componentRef.setInput('titre', 'Un titre');
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  it('nomme la section par son titre, h2 par défaut et h1 sur demande', async () => {
    await monter();
    const titre = racine.querySelector('h2');
    expect(titre?.textContent?.trim()).toBe('Un titre');
    expect(section()?.getAttribute('aria-labelledby')).toBe(titre?.id);
    fixture.componentRef.setInput('niveauTitre', 1);
    await fixture.whenStable();
    expect(racine.querySelector('h1')?.textContent?.trim()).toBe('Un titre');
  });

  it('laisse l’image décorative par défaut et reprend le texte alternatif demandé', async () => {
    await monter();
    expect(racine.querySelector('img')?.getAttribute('alt')).toBe('');
    fixture.componentRef.setInput('alt', 'Un coucher de soleil');
    await fixture.whenStable();
    expect(racine.querySelector('img')?.getAttribute('alt')).toBe('Un coucher de soleil');
  });

  it('n’affiche surtitre et indice que s’ils ont un texte, et cache l’indice aux lecteurs d’écran', async () => {
    await monter();
    expect(racine.textContent).not.toContain('Défiler');
    fixture.componentRef.setInput('surtitre', 'Carnet');
    fixture.componentRef.setInput('indice', 'Défiler');
    await fixture.whenStable();
    expect(racine.querySelector('p')?.textContent?.trim()).toBe('Carnet');
    const indice = [...racine.querySelectorAll('[aria-hidden="true"]')].find((e) =>
      e.textContent?.includes('Défiler'),
    );
    expect(indice).toBeDefined();
  });

  it('pose la progression en pilotage manuel, bornée entre 0 et 1', async () => {
    await monter({ pilotage: 'manuel', progression: 0.25 });
    expect(progression()).toBe(0.25);
    fixture.componentRef.setInput('progression', 9);
    await fixture.whenStable();
    expect(progression()).toBe(1);
  });

  it('démarre à zéro en pilotage par le défilement', async () => {
    await monter();
    expect(progression()).toBe(0);
  });

  it('transmet longueur, hauteur, zoom et douceur en variables CSS, et les coins arrondis en attribut', async () => {
    await monter({ longueur: 4, hauteur: 80, zoomDepart: 2, douceur: 50, arrondi: true });
    const style = section()?.style;
    expect(style?.getPropertyValue('--ngs-longueur')).toBe('4');
    expect(style?.getPropertyValue('--ngs-haut')).toBe('80');
    expect(style?.getPropertyValue('--ngs-zoom')).toBe('2');
    expect(style?.getPropertyValue('--ngs-douceur')).toBe('50');
    expect(racine.querySelector('[data-arrondi]')?.getAttribute('data-arrondi')).toBe('true');
  });

  it('suit le défilement de la fenêtre et de sa taille, puis retire ses écouteurs à la destruction', async () => {
    const retrait = vi.spyOn(window, 'removeEventListener');
    await monter();
    fixture.destroy();
    expect(retrait).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(retrait).toHaveBeenCalledWith('resize', expect.any(Function));
    retrait.mockRestore();
  });

  it('coupe le mouvement avec animations = false (classe sur l’hôte)', async () => {
    await monter({ animations: false });
    expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
  });
});
