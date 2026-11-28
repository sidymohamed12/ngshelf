import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementGalerie, GalerieIncurveeComponent } from '../galerie-incurvee.component';

const ELEMENTS: readonly ElementGalerie[] = Array.from({ length: 8 }, (_, i) => ({
  image: `images/${i}.svg`,
  titre: `Titre ${i + 1}`,
  legende: `Légende ${i + 1}`,
}));

describe('GalerieIncurveeComponent', () => {
  let fixture: ComponentFixture<GalerieIncurveeComponent>;
  let racine: HTMLElement;

  const cartes = (): HTMLElement[] => [...racine.querySelectorAll<HTMLElement>('[data-active]')];
  const places = (): number[] => cartes().map((c) => Number(c.style.getPropertyValue('--k')));
  const compteur = (): string =>
    racine.querySelector('p[aria-hidden="true"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const annonce = (): HTMLElement => racine.querySelector('[aria-live]') as HTMLElement;
  const fleche = (nom: string): HTMLButtonElement =>
    racine.querySelector(`button[aria-label="${nom}"]`) as HTMLButtonElement;

  /** Par défaut sans animation : chaque changement est immédiat et rien ne défile seul. */
  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    fixture = TestBed.createComponent(GalerieIncurveeComponent);
    fixture.componentRef.setInput('elements', ELEMENTS);
    fixture.componentRef.setInput('animations', false);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function cliquer(element: HTMLElement): Promise<void> {
    element.click();
    await fixture.whenStable();
  }

  it('place les cartes autour de l’image de départ, en boucle', async () => {
    await monter({ depart: 4 });
    expect(places()).toEqual([-4, -3, -2, -1, 0, 1, 2, 3]);
    expect(cartes()[4].dataset['active']).toBe('true');
    expect(compteur()).toBe('05 / 08');
  });

  it('ne rend cliquables que deux cartes de chaque côté', async () => {
    await monter({ depart: 0 });
    const visibles = cartes().filter((c) => c.dataset['visible'] === 'true');
    expect(visibles.map((c) => Number(c.style.getPropertyValue('--k')))).toEqual([0, 1, 2, -2, -1]);
  });

  it('avance et recule avec les flèches, en bouclant', async () => {
    await monter({ depart: 7 });
    await cliquer(fleche('Image suivante'));
    expect(compteur()).toBe('01 / 08');
    await cliquer(fleche('Image précédente'));
    await cliquer(fleche('Image précédente'));
    expect(compteur()).toBe('07 / 08');
  });

  it('amène une voisine au centre au clic et émet `changement`', async () => {
    await monter({ depart: 4 });
    const changement = vi.fn();
    fixture.componentInstance.changement.subscribe(changement);
    await cliquer(cartes()[6]);
    expect(compteur()).toBe('07 / 08');
    expect(places()[6]).toBe(0);
    expect(changement).toHaveBeenCalledWith(6);
  });

  it('suit les flèches du clavier', async () => {
    await monter({ depart: 0 });
    const section = racine.querySelector('section') as HTMLElement;
    section.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();
    expect(compteur()).toBe('02 / 08');
    section.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await fixture.whenStable();
    expect(compteur()).toBe('01 / 08');
  });

  it('suit le pointeur pendant un glissé, puis se cale sur l’image la plus proche', async () => {
    await monter({ depart: 0 });
    const scene = racine.querySelector('section > div') as HTMLElement;
    for (const carte of cartes()) Object.defineProperty(carte, 'offsetWidth', { value: 100 });
    scene.dispatchEvent(new PointerEvent('pointerdown', { clientX: 300, button: 0 }));
    scene.dispatchEvent(new PointerEvent('pointermove', { clientX: 150 }));
    expect(places()[1]).toBeCloseTo(1 - 150 / 105, 3);
    scene.dispatchEvent(new PointerEvent('pointerup', { clientX: 150 }));
    await fixture.whenStable();
    expect(compteur()).toBe('02 / 08');
    cartes()[3].click();
    await fixture.whenStable();
    expect(compteur()).toBe('02 / 08');
  });

  it('annonce le titre, la légende et la place de l’image active', async () => {
    await monter({ depart: 2 });
    expect(annonce().textContent?.trim()).toBe('Titre 3 : Légende 3 (3 sur 8)');
    expect(annonce().getAttribute('aria-live')).toBe('polite');
  });

  it('cache la piste aux lecteurs d’écran et nomme la galerie', async () => {
    await monter({ libelle: 'Architecture' });
    expect(racine.querySelector('section')?.getAttribute('aria-label')).toBe('Architecture');
    expect(racine.querySelector('[aria-hidden="true"] img')).not.toBeNull();
    for (const image of racine.querySelectorAll('img')) expect(image.getAttribute('alt')).toBe('');
  });

  it('transmet le reflet', async () => {
    await monter({ reflet: false });
    expect(racine.querySelector('section')?.dataset['reflet']).toBe('false');
  });

  describe('défilement automatique', () => {
    let rappels: FrameRequestCallback[];
    let horloge: number;

    beforeEach(() => {
      rappels = [];
      horloge = 0;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((rappel) => {
        rappels.push(rappel);
        return rappels.length;
      });
      vi.spyOn(performance, 'now').mockImplementation(() => horloge);
    });

    afterEach(() => vi.restoreAllMocks());

    /** Avance l'horloge de `ms` par pas de 16 ms en jouant les images demandées. */
    function avancer(ms: number): void {
      for (let t = 0; t < ms; t += 16) {
        horloge += 16;
        const enCours = rappels;
        rappels = [];
        for (const rappel of enCours) rappel(horloge);
      }
    }

    it('défile seul, lentement et en continu, après le délai sans interaction', async () => {
      await monter({ animations: true, depart: 0, vitesse: 4 });
      avancer(2000);
      expect(places()[0]).toBe(0);
      avancer(6000);
      const place = places()[1];
      expect(place).toBeLessThan(0);
      expect(place).toBeGreaterThan(-1);
      expect(Number.isInteger(place)).toBe(false);
      await fixture.whenStable();
      expect(compteur()).not.toBe('01 / 08');
    });

    it('s’arrête au survol', async () => {
      await monter({ animations: true, depart: 0 });
      const scene = racine.querySelector('section > div') as HTMLElement;
      scene.dispatchEvent(new PointerEvent('pointerenter'));
      avancer(8000);
      expect(places()[0]).toBe(0);
    });

    it('ne défile pas quand il est coupé', async () => {
      await monter({ animations: true, depart: 0, defilementAuto: false });
      avancer(8000);
      expect(places()[0]).toBe(0);
    });

    it('amène l’image suivante en douceur au clic sur la flèche', async () => {
      await monter({ animations: true, depart: 0, defilementAuto: false });
      fleche('Image suivante').click();
      avancer(300);
      const milieu = places()[1];
      expect(milieu).toBeGreaterThan(0);
      expect(milieu).toBeLessThan(1);
      avancer(600);
      expect(places()[1]).toBe(0);
      await fixture.whenStable();
      expect(compteur()).toBe('02 / 08');
    });
  });
});
