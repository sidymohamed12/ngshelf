import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaExtensibleComponent } from '../media-extensible.component';

describe('MediaExtensibleComponent', () => {
  let fixture: ComponentFixture<MediaExtensibleComponent>;
  let racine: HTMLElement;

  const progression = (): number =>
    Number(
      racine.querySelector<HTMLElement>('[data-defilement]')?.style.getPropertyValue('--ngs-p'),
    );
  const contenu = (): HTMLElement | null =>
    racine.querySelector('[inert], div > div > div > div:last-child');

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    fixture = TestBed.createComponent(MediaExtensibleComponent);
    fixture.componentRef.setInput('src', 'images/a.svg');
    fixture.componentRef.setInput('alt', 'Un paysage');
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  afterEach(() => vi.unstubAllGlobals());

  it('affiche l’image avec son texte alternatif, et une vidéo muette sur demande', async () => {
    await monter();
    expect(racine.querySelector('img')?.getAttribute('alt')).toBe('Un paysage');
    expect(racine.querySelector('video')).toBeNull();
    fixture.componentRef.setInput('typeMedia', 'video');
    fixture.componentRef.setInput('poster', 'images/p.svg');
    await fixture.whenStable();
    const video = racine.querySelector('video');
    expect(video?.hasAttribute('muted') || video?.muted).toBe(true);
    expect(video?.hasAttribute('loop')).toBe(true);
    expect(video?.getAttribute('aria-label')).toBe('Un paysage');
  });

  it('pose la progression imposée en pilotage manuel, bornée entre 0 et 1', async () => {
    await monter({ pilotage: 'manuel', progression: 0.4 });
    expect(progression()).toBe(0.4);
    fixture.componentRef.setInput('progression', 7);
    await fixture.whenStable();
    expect(progression()).toBe(1);
    fixture.componentRef.setInput('progression', -2);
    await fixture.whenStable();
    expect(progression()).toBe(0);
  });

  it('démarre à zéro en pilotage par le défilement', async () => {
    await monter();
    expect(progression()).toBe(0);
  });

  it('rend le contenu projeté atteignable seulement en fin de course', async () => {
    await monter({ pilotage: 'manuel', progression: 0.3 });
    expect(racine.querySelector('[inert]')).not.toBeNull();
    fixture.componentRef.setInput('progression', 0.9);
    await fixture.whenStable();
    expect(racine.querySelector('[inert]')).toBeNull();
    expect(contenu()).not.toBeNull();
  });

  it('nomme le titre h2 par défaut, h1 sur demande, et masque indice et titre quand ils sont vides', async () => {
    await monter();
    expect(racine.querySelector('h2')).toBeNull();
    expect(racine.textContent).not.toContain('Défiler');
    fixture.componentRef.setInput('titre', 'Un titre');
    fixture.componentRef.setInput('indice', 'Défiler');
    await fixture.whenStable();
    expect(racine.querySelector('h2')?.textContent?.trim()).toBe('Un titre');
    expect(racine.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('Défiler');
    fixture.componentRef.setInput('niveauTitre', 1);
    await fixture.whenStable();
    expect(racine.querySelector('h1')?.textContent?.trim()).toBe('Un titre');
  });

  it('transmet la taille de départ, le zoom et le voile en variables CSS', async () => {
    await monter({
      largeurDepart: 50,
      hauteurDepart: 60,
      zoomDepart: 1.2,
      voile: 0.3,
      distance: 2,
    });
    const style = racine.querySelector<HTMLElement>('[data-defilement]')?.style;
    expect(style?.getPropertyValue('--ngs-lg')).toBe('50');
    expect(style?.getPropertyValue('--ngs-ht')).toBe('60');
    expect(style?.getPropertyValue('--ngs-zoom')).toBe('1.2');
    expect(style?.getPropertyValue('--ngs-voile')).toBe('0.3');
    expect(style?.getPropertyValue('--ngs-defil')).toBe('2');
  });

  it('suit le défilement de la fenêtre, puis retire ses écouteurs à la destruction', async () => {
    const ajout = vi.spyOn(window, 'addEventListener');
    const retrait = vi.spyOn(window, 'removeEventListener');
    await monter({ lissage: 0 });
    expect(ajout).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    fixture.destroy();
    expect(retrait).toHaveBeenCalledWith('scroll', expect.any(Function));
    ajout.mockRestore();
    retrait.mockRestore();
  });

  it('coupe le mouvement avec animations = false (classe sur l’hôte)', async () => {
    await monter({ animations: false });
    expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
  });
});
