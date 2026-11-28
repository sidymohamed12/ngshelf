import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalerieDomeComponent } from '../galerie-dome.component';

const IMAGES = ['a', 'b', 'c'].map((nom) => ({ src: `images/${nom}.svg`, alt: `Image ${nom}` }));

function pointeur(type: string, x: number, y: number, t: number): Event {
  const options = { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true };
  const evenement = new MouseEvent(type, options);
  Object.defineProperty(evenement, 'pointerId', { value: 1 });
  Object.defineProperty(evenement, 'pointerType', { value: 'mouse' });
  Object.defineProperty(evenement, 'timeStamp', { value: t });
  return evenement;
}

describe('GalerieDomeComponent', () => {
  let fixture: ComponentFixture<GalerieDomeComponent>;
  let racine: HTMLElement;

  const boutonsAcces = (): HTMLButtonElement[] => [
    ...racine.querySelectorAll<HTMLButtonElement>('ul button'),
  ];
  const visionneuse = (): HTMLElement | null => racine.querySelector('figure');
  const principal = (): HTMLElement =>
    racine.querySelector<HTMLElement>('[role="group"] > div') as HTMLElement;

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    fixture = TestBed.createComponent(GalerieDomeComponent);
    fixture.componentRef.setInput('images', IMAGES);
    fixture.componentRef.setInput('animations', false);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    document.body.appendChild(racine);
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });
  afterEach(() => {
    racine.remove();
    vi.unstubAllGlobals();
  });

  it('pose cinq tuiles par colonne, quelles que soient les images', async () => {
    await monter({ segments: 20 });
    expect(racine.querySelectorAll('img[alt=""]')).toHaveLength(100);
  });

  it('répartit les images sans deux voisines identiques', async () => {
    await monter({ segments: 20 });
    const sources = [...racine.querySelectorAll('img[alt=""]')].map((i) => i.getAttribute('src'));
    for (let i = 1; i < sources.length; i++) expect(sources[i]).not.toBe(sources[i - 1]);
  });

  it('borne le nombre de colonnes à 8 au minimum', async () => {
    await monter({ segments: 1 });
    expect(racine.querySelectorAll('img[alt=""]')).toHaveLength(40);
  });

  it('cache les tuiles aux lecteurs d’écran et offre une liste d’accès, une entrée par image distincte', async () => {
    await monter();
    expect(boutonsAcces().map((b) => b.textContent?.trim())).toEqual([
      'Image a',
      'Image b',
      'Image c',
    ]);
    expect(racine.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(racine.querySelectorAll('button[tabindex="-1"] img')).not.toHaveLength(0);
  });

  it('ouvre une image agrandie depuis la liste d’accès, avec une boîte de dialogue nommée', async () => {
    await monter();
    boutonsAcces()[1]?.click();
    await fixture.whenStable();
    const dialogue = visionneuse();
    expect(dialogue?.getAttribute('role')).toBe('dialog');
    expect(dialogue?.getAttribute('aria-modal')).toBe('true');
    expect(dialogue?.getAttribute('aria-label')).toBe('Image b');
    expect(dialogue?.querySelector('img')?.getAttribute('src')).toBe('images/b.svg');
  });

  it('se ferme par Échap et par le bouton, une fois le délai d’ouverture passé', async () => {
    vi.spyOn(window.performance, 'now').mockReturnValue(0);
    await monter();
    boutonsAcces()[0]?.click();
    await fixture.whenStable();
    expect(visionneuse()).not.toBeNull();
    // Dans le délai d’ouverture, Échap ne ferme pas encore : un double clic n’annule pas l’ouverture.
    visionneuse()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(visionneuse()).not.toBeNull();
    vi.mocked(window.performance.now).mockReturnValue(1000);
    visionneuse()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(visionneuse()).toBeNull();
    boutonsAcces()[0]?.click();
    await fixture.whenStable();
    vi.mocked(window.performance.now).mockReturnValue(3000);
    racine.querySelector<HTMLButtonElement>('figure button')?.click();
    await fixture.whenStable();
    expect(visionneuse()).toBeNull();
    vi.restoreAllMocks();
  });

  it('fait tourner le dôme au glisser, avec le sens et la sensibilité demandés', async () => {
    await monter({ sensibilite: 10, inclinaisonMax: 5 });
    principal().dispatchEvent(pointeur('pointerdown', 100, 100, 1));
    window.dispatchEvent(pointeur('pointermove', 150, 130, 20));
    window.dispatchEvent(pointeur('pointerup', 150, 130, 40));
    await fixture.whenStable();
    const racineDome = racine.querySelector<HTMLElement>('[role="group"]');
    // 50 px à droite / 10 = 5° ; 30 px vers le bas / 10 = -3°, borné à ±5°.
    expect(racineDome?.style.getPropertyValue('--ngs-ry')).toBe('5deg');
    expect(racineDome?.style.getPropertyValue('--ngs-rx')).toBe('-3deg');
  });

  it('borne l’inclinaison verticale', async () => {
    await monter({ sensibilite: 10, inclinaisonMax: 2 });
    principal().dispatchEvent(pointeur('pointerdown', 0, 0, 1));
    window.dispatchEvent(pointeur('pointermove', 0, 100, 20));
    window.dispatchEvent(pointeur('pointerup', 0, 100, 40));
    await fixture.whenStable();
    expect(
      racine.querySelector<HTMLElement>('[role="group"]')?.style.getPropertyValue('--ngs-rx'),
    ).toBe('-2deg');
  });

  it('coupe l’inertie avec animations = false (classe sur l’hôte)', async () => {
    await monter({ animations: false });
    expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
  });

  it('retire les écouteurs de la fenêtre à la destruction', async () => {
    await monter();
    const retrait = vi.spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(retrait).toHaveBeenCalledWith('pointermove', expect.any(Function));
    retrait.mockRestore();
  });
});
