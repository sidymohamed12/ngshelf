import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalerieAccordeonComponent } from '../galerie-accordeon.component';

const ELEMENTS = ['a', 'b', 'c', 'd', 'e'].map((nom) => ({
  image: `images/${nom}.svg`,
  legende: `Image ${nom}`,
}));

describe('GalerieAccordeonComponent', () => {
  let fixture: ComponentFixture<GalerieAccordeonComponent>;
  let racine: HTMLElement;
  let observateur: (() => void) | undefined;

  const elements = (): HTMLElement[] => [...racine.querySelectorAll<HTMLElement>('li')];
  const boutons = (): HTMLButtonElement[] => [...racine.querySelectorAll('button')];
  const ouvert = (): number => elements().findIndex((li) => li.dataset['actif'] === 'true');

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    fixture = TestBed.createComponent(GalerieAccordeonComponent);
    fixture.componentRef.setInput('elements', ELEMENTS);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(rappel: () => void) {
          observateur = rappel;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    observateur = undefined;
  });

  it('affiche un panneau par image, celui de l’index initial ouvert', async () => {
    await monter();
    expect(elements()).toHaveLength(5);
    expect(ouvert()).toBe(2);
    expect(boutons().map((b) => b.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false',
    ]);
  });

  it('borne l’index initial à la liste', async () => {
    await monter({ indexInitial: 99 });
    expect(ouvert()).toBe(4);
  });

  it('ne met dans l’ordre de tabulation que le panneau ouvert', async () => {
    await monter();
    expect(boutons().map((b) => b.getAttribute('tabindex'))).toEqual(['-1', '-1', '0', '-1', '-1']);
  });

  it('ouvre un panneau au clic, quel que soit le déclencheur', async () => {
    await monter({ declencheur: 'clic' });
    boutons()[0]?.click();
    await fixture.whenStable();
    expect(ouvert()).toBe(0);
  });

  it('ouvre au survol seulement si le déclencheur est « survol »', async () => {
    await monter({ declencheur: 'survol' });
    boutons()[4]?.dispatchEvent(new Event('pointerenter'));
    await fixture.whenStable();
    expect(ouvert()).toBe(4);

    fixture.destroy();
    await monter({ declencheur: 'clic' });
    boutons()[4]?.dispatchEvent(new Event('pointerenter'));
    await fixture.whenStable();
    expect(ouvert()).toBe(2);
  });

  it('se parcourt aux flèches, à Début et à Fin, en bouclant, et déplace le focus', async () => {
    await monter({ indexInitial: 4 });
    document.body.appendChild(racine);
    const frappe = async (touche: string): Promise<void> => {
      (document.activeElement ?? boutons()[ouvert()])?.dispatchEvent(
        new KeyboardEvent('keydown', { key: touche, bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();
    };
    boutons()[4]?.focus();
    await frappe('ArrowRight');
    expect(ouvert()).toBe(0);
    expect(document.activeElement).toBe(boutons()[0]);
    await frappe('End');
    expect(ouvert()).toBe(4);
    await frappe('Home');
    expect(ouvert()).toBe(0);
    await frappe('ArrowUp');
    expect(ouvert()).toBe(4);
    racine.remove();
  });

  it('donne au panneau ouvert la part demandée de la rangée, bornée entre 0,2 et 0,9', async () => {
    await monter({ ratioOuverture: 0.5 });
    // 4 panneaux fermés de poids 1 : le ouvert pèse 0,5 × 4 / 0,5 = 4.
    expect(elements()[2]?.style.flexGrow).toBe('4');
    fixture.componentRef.setInput('ratioOuverture', 5);
    await fixture.whenStable();
    expect(Number(elements()[2]?.style.flexGrow)).toBeCloseTo((0.9 * 4) / 0.1);
  });

  it('incline les panneaux fermés de part et d’autre de l’ouvert, sans inclinaison pour celui-ci', async () => {
    await monter({ inclinaison: 10 });
    const incl = elements().map((li) => li.style.getPropertyValue('--ngs-incl'));
    expect(incl).toEqual(['10', '10', '0', '-10', '-10']);
  });

  it('coupe les transitions avec animations = false (classe sur l’hôte)', async () => {
    await monter({ animations: false });
    expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
  });

  it('masque les légendes à la demande et prend la légende comme texte alternatif', async () => {
    await monter({ legendes: false });
    expect(racine.querySelector('[class*="legende"]')).toBeNull();
    expect(racine.querySelector('img')?.getAttribute('alt')).toBe('Image a');
  });

  it('s’empile quand le bloc devient étroit, quelle que soit l’orientation demandée', async () => {
    await monter({ orientation: 'horizontal' });
    const liste = racine.querySelector('ul');
    expect(liste?.getAttribute('data-orientation')).toBe('horizontal');
    Object.defineProperty(racine, 'clientWidth', { value: 400, configurable: true });
    observateur?.();
    await fixture.whenStable();
    expect(liste?.getAttribute('data-orientation')).toBe('vertical');
  });
});
