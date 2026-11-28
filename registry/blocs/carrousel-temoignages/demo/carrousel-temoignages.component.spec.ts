import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarrouselTemoignagesComponent } from '../carrousel-temoignages.component';

const ENTREPRISES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];
const TEMOIGNAGES = ENTREPRISES.map((entreprise, i) => ({
  image: `images/portrait-${i}.svg`,
  citation: `Citation ${entreprise}`,
  nom: `Personne ${i}`,
  fonction: 'Directrice',
  entreprise,
}));
const LOGOS = ENTREPRISES.map((nom) => ({ nom }));
const DUREE_S = 4;

describe('CarrouselTemoignagesComponent', () => {
  let fixture: ComponentFixture<CarrouselTemoignagesComponent>;
  let racine: HTMLElement;

  const cartes = (): HTMLElement[] => [...racine.querySelectorAll<HTMLElement>('[data-position]')];
  const positions = (): string[] => cartes().map((c) => c.getAttribute('data-position') ?? '');
  const logos = (): HTMLButtonElement[] => [
    ...racine.querySelectorAll<HTMLButtonElement>('ul button'),
  ];
  const logoActif = (): string | undefined =>
    logos()
      .find((b) => b.getAttribute('aria-pressed') === 'true')
      ?.textContent?.trim();
  const bouton = (libelle: string): HTMLButtonElement | null =>
    racine.querySelector<HTMLButtonElement>(`button[aria-label="${libelle}"]`);
  const scene = (): HTMLElement =>
    racine.querySelector<HTMLElement>('[role="group"]') as HTMLElement;

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    fixture = TestBed.createComponent(CarrouselTemoignagesComponent);
    fixture.componentRef.setInput('temoignages', TEMOIGNAGES);
    fixture.componentRef.setInput('logos', LOGOS);
    fixture.componentRef.setInput('titre', 'Ceux qui planifient ici.');
    fixture.componentRef.setInput('lectureAuto', false);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('affiche une carte et un logo par témoignage, le premier au centre', async () => {
    await monter();
    expect(cartes()).toHaveLength(6);
    expect(logos()).toHaveLength(6);
    expect(positions()).toEqual(['0', '1', '2', '2', '-2', '-1']);
    expect(logoActif()).toBe('Alpha');
  });

  it('ne montre que la légende de la carte active aux lecteurs d’écran', async () => {
    await monter();
    const cadres = [...racine.querySelectorAll('figure')];
    expect(cadres.map((c) => c.getAttribute('aria-hidden'))).toEqual([
      null,
      'true',
      'true',
      'true',
      'true',
      'true',
    ]);
  });

  it('active le témoignage de l’entreprise dont on clique le logo', async () => {
    await monter();
    logos()
      .find((b) => b.textContent?.includes('Delta'))
      ?.click();
    await fixture.whenStable();
    expect(positions()[3]).toBe('0');
    expect(logoActif()).toBe('Delta');
  });

  it('active une carte voisine quand on clique le bouton qui la couvre', async () => {
    await monter();
    racine.querySelector<HTMLButtonElement>('[data-position="1"] button')?.click();
    await fixture.whenStable();
    expect(positions()[1]).toBe('0');
    expect(logoActif()).toBe('Bravo');
  });

  it('ne pose un bouton que sur les cartes voisines', async () => {
    await monter();
    const avecBouton = cartes().map((c) => c.querySelector('button') !== null);
    expect(avecBouton).toEqual([false, true, false, false, false, true]);
  });

  it('passe au suivant et au précédent avec les boutons, et boucle aux extrémités', async () => {
    await monter();
    bouton('Témoignage précédent')?.click();
    await fixture.whenStable();
    expect(logoActif()).toBe('Foxtrot');
    bouton('Témoignage suivant')?.click();
    await fixture.whenStable();
    expect(logoActif()).toBe('Alpha');
  });

  it('suit les flèches gauche et droite du clavier', async () => {
    await monter();
    scene().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    await fixture.whenStable();
    expect(logoActif()).toBe('Bravo');
    scene().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    await fixture.whenStable();
    expect(logoActif()).toBe('Alpha');
  });

  it('repositionne sans transition la carte qui traverse la scène en bouclant', async () => {
    await monter();
    bouton('Témoignage précédent')?.click();
    await fixture.whenStable();
    expect(cartes().some((c) => c.getAttribute('data-saut') === 'true')).toBe(true);
  });

  it('a un nom accessible et un texte alternatif par défaut', async () => {
    await monter({ libelle: 'Avis clients' });
    expect(scene().getAttribute('aria-label')).toBe('Avis clients');
    expect(racine.querySelector('img')?.getAttribute('alt')).toBe('Portrait de Personne 0');
  });

  it('titre en h2 par défaut, en h1 sur demande', async () => {
    await monter();
    expect(racine.querySelector('h2')?.textContent).toContain('Ceux qui planifient ici.');
    expect(racine.querySelector('h1')).toBeNull();
    fixture.componentRef.setInput('niveauTitre', 1);
    await fixture.whenStable();
    expect(racine.querySelector('h1')).not.toBeNull();
  });

  it('n’affiche les boutons d’action que s’ils ont un texte', async () => {
    await monter();
    expect(racine.querySelectorAll('a')).toHaveLength(0);
    fixture.componentRef.setInput('action', 'Essayer');
    fixture.componentRef.setInput('routeAction', '/essai');
    fixture.componentRef.setInput('lien', 'Lire');
    fixture.componentRef.setInput('routeLien', '/lire');
    await fixture.whenStable();
    expect([...racine.querySelectorAll('a')].map((a) => a.textContent?.trim())).toEqual([
      'Essayer',
      'Lire',
    ]);
  });

  describe('lecture automatique', () => {
    it('passe au témoignage suivant à chaque durée écoulée', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      await monter({ lectureAuto: true, dureeAffichage: DUREE_S });
      expect(logoActif()).toBe('Alpha');
      vi.advanceTimersByTime(DUREE_S * 1000);
      await fixture.whenStable();
      expect(logoActif()).toBe('Bravo');
      vi.advanceTimersByTime(DUREE_S * 1000);
      await fixture.whenStable();
      expect(logoActif()).toBe('Charlie');
    });

    it('s’arrête avec le bouton Pause et reprend avec le même bouton', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      await monter({ lectureAuto: true, dureeAffichage: DUREE_S });
      bouton('Mettre le défilement en pause')?.click();
      await fixture.whenStable();
      vi.advanceTimersByTime(DUREE_S * 2000);
      expect(logoActif()).toBe('Alpha');
      expect(bouton('Relancer le défilement')?.getAttribute('aria-pressed')).toBe('true');
      bouton('Relancer le défilement')?.click();
      await fixture.whenStable();
      vi.advanceTimersByTime(DUREE_S * 1000);
      await fixture.whenStable();
      expect(logoActif()).toBe('Bravo');
    });

    it('se met en pause au survol', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      await monter({ lectureAuto: true, dureeAffichage: DUREE_S });
      const panneau = scene().parentElement as HTMLElement;
      panneau.dispatchEvent(new Event('pointerenter'));
      await fixture.whenStable();
      vi.advanceTimersByTime(DUREE_S * 2000);
      expect(logoActif()).toBe('Alpha');
      panneau.dispatchEvent(new Event('pointerleave'));
      await fixture.whenStable();
      vi.advanceTimersByTime(DUREE_S * 1000);
      await fixture.whenStable();
      expect(logoActif()).toBe('Bravo');
    });

    it('ne tourne pas quand les animations sont coupées, et n’a alors pas de bouton Pause', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      await monter({ lectureAuto: true, animations: false, dureeAffichage: DUREE_S });
      vi.advanceTimersByTime(DUREE_S * 3000);
      expect(logoActif()).toBe('Alpha');
      expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
    });

    it('annonce les changements (aria-live) seulement quand la lecture est arrêtée', async () => {
      await monter({ lectureAuto: true });
      expect(scene().getAttribute('aria-live')).toBe('off');
      bouton('Mettre le défilement en pause')?.click();
      await fixture.whenStable();
      expect(scene().getAttribute('aria-live')).toBe('polite');
    });

    it('n’affiche pas le bouton Pause sans lecture automatique', async () => {
      await monter({ lectureAuto: false });
      expect(bouton('Mettre le défilement en pause')).toBeNull();
    });
  });
});
