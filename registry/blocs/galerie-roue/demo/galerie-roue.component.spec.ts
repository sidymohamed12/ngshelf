import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalerieRoueComponent } from '../galerie-roue.component';

const ELEMENTS = ['a', 'b', 'c', 'd', 'e'].map((nom) => ({
  image: `images/${nom}.svg`,
  titre: `Titre ${nom}`,
  sousTitre: `Sous-titre ${nom}`,
}));

describe('GalerieRoueComponent', () => {
  let fixture: ComponentFixture<GalerieRoueComponent>;
  let racine: HTMLElement;

  const boutons = (): HTMLButtonElement[] => [...racine.querySelectorAll('button')];
  const actif = (): number => boutons().findIndex((b) => b.getAttribute('aria-current') === 'true');
  const variable = (i: number, nom: string): string =>
    racine.querySelectorAll('li')[i]?.style.getPropertyValue(nom) ?? '';

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    fixture = TestBed.createComponent(GalerieRoueComponent);
    fixture.componentRef.setInput('elements', ELEMENTS);
    fixture.componentRef.setInput('lectureAuto', false);
    fixture.componentRef.setInput('animations', false);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('affiche un titre par élément, celui de l’index initial actif et seul focalisable', async () => {
    await monter();
    expect(boutons()).toHaveLength(5);
    expect(actif()).toBe(2);
    expect(boutons().map((b) => b.getAttribute('tabindex'))).toEqual(['-1', '-1', '0', '-1', '-1']);
  });

  it('pose l’élément actif sur l’axe et les autres de part et d’autre, sur l’arc', async () => {
    await monter({ rayonArc: 400, angle: 15 });
    expect(variable(2, '--ngs-x')).toBe('0px');
    expect(variable(2, '--ngs-y')).toBe('0px');
    expect(variable(2, '--ngs-th')).toBe('0deg');
    expect(Number.parseFloat(variable(3, '--ngs-th'))).toBeCloseTo(15);
    expect(Number.parseFloat(variable(1, '--ngs-th'))).toBeCloseTo(-15);
    expect(Number.parseFloat(variable(3, '--ngs-y'))).toBeGreaterThan(0);
    expect(Number.parseFloat(variable(3, '--ngs-x'))).toBeLessThan(0);
  });

  it('rend le titre actif plein et masque ceux qui sont trop loin', async () => {
    await monter({ indexInitial: 0, boucle: false });
    expect(variable(0, '--ngs-act')).toBe('1');
    expect(boutons()[0]?.disabled).toBe(false);
    expect(boutons()[4]?.disabled).toBe(true);
    expect(boutons()[4]?.getAttribute('aria-hidden')).toBe('true');
  });

  it('va à un titre au clic, et l’image active suit', async () => {
    await monter();
    boutons()[4]?.dispatchEvent(new Event('click'));
    await fixture.whenStable();
    expect(actif()).toBe(4);
    const images = [...racine.querySelectorAll('img')];
    expect(images.map((i) => i.getAttribute('data-actif'))).toEqual([
      'false',
      'false',
      'false',
      'false',
      'true',
    ]);
    expect(images[0]?.getAttribute('aria-hidden')).toBe('true');
  });

  it('se parcourt aux flèches, à Début et à Fin, et boucle', async () => {
    await monter({ indexInitial: 4 });
    const frappe = async (touche: string): Promise<void> => {
      boutons()[actif()]?.dispatchEvent(
        new KeyboardEvent('keydown', { key: touche, bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();
    };
    await frappe('ArrowDown');
    expect(actif()).toBe(0);
    await frappe('ArrowUp');
    expect(actif()).toBe(4);
    await frappe('Home');
    expect(actif()).toBe(0);
    await frappe('End');
    expect(actif()).toBe(4);
  });

  it('s’arrête aux extrémités sans boucle', async () => {
    await monter({ indexInitial: 4, boucle: false });
    boutons()[4]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }),
    );
    await fixture.whenStable();
    expect(actif()).toBe(4);
  });

  it('laisse défiler la page à l’extrémité, et capte la molette ailleurs', async () => {
    await monter({ indexInitial: 4, boucle: false });
    const liste = racine.querySelector('ul');
    const bas = new WheelEvent('wheel', { deltaY: 120, cancelable: true });
    liste?.dispatchEvent(bas);
    expect(bas.defaultPrevented).toBe(false);
    const haut = new WheelEvent('wheel', { deltaY: -120, cancelable: true });
    liste?.dispatchEvent(haut);
    expect(haut.defaultPrevented).toBe(true);
    await fixture.whenStable();
    expect(actif()).toBe(3);
  });

  it('ignore la molette quand elle est désactivée', async () => {
    await monter({ molette: false });
    const evenement = new WheelEvent('wheel', { deltaY: 200, cancelable: true });
    racine.querySelector('ul')?.dispatchEvent(evenement);
    expect(evenement.defaultPrevented).toBe(false);
    expect(actif()).toBe(2);
  });

  it('remplit le titre actif pendant la lecture, puis passe au suivant', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    fixture = TestBed.createComponent(GalerieRoueComponent);
    fixture.componentRef.setInput('elements', ELEMENTS);
    fixture.componentRef.setInput('dureeLecture', 0.5);
    fixture.componentRef.setInput('pauseAuSurvol', false);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    await vi.waitFor(() => expect(Number(variable(2, '--ngs-p'))).toBeGreaterThan(0), {
      timeout: 2000,
    });
    expect(actif()).toBe(2);
    await vi.waitFor(() => expect(actif()).toBe(3), { timeout: 3000 });
  });

  it('suspend la lecture quand la souris est sur la galerie', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    fixture = TestBed.createComponent(GalerieRoueComponent);
    fixture.componentRef.setInput('elements', ELEMENTS);
    fixture.componentRef.setInput('dureeLecture', 0.5);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    racine.querySelector('[role="group"]')?.dispatchEvent(new Event('pointerenter'));
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(actif()).toBe(2);
  });

  it('coupe la lecture en mouvement réduit', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    fixture = TestBed.createComponent(GalerieRoueComponent);
    fixture.componentRef.setInput('elements', ELEMENTS);
    fixture.componentRef.setInput('dureeLecture', 0.5);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(actif()).toBe(2);
    expect(Number(variable(2, '--ngs-p'))).toBe(0);
  });

  it('ne lance jamais la lecture avec animations = false', async () => {
    await monter({ lectureAuto: true });
    expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
    expect(Number(variable(2, '--ngs-p'))).toBe(0);
  });
});
