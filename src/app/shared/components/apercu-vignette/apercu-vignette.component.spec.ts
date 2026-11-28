import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VIGNETTES_SIMULTANEES_MAX, VignettesService } from '@core/apercu/vignettes.service';
import { messagePret } from '@shared/apercu/protocole';
import {
  ApercuVignetteComponent,
  DELAI_DEMARRAGE_MS,
  DELAI_VIGNETTE_MS,
  LARGEUR_NOMINALE_PX,
  dimensionsVignette,
  urlVignette,
} from './apercu-vignette.component';

describe('urlVignette', () => {
  it('demande la vignette, clair et animée par défaut', () => {
    expect(urlVignette({ slug: 'boutons', mode: 'clair', animations: true })).toBe(
      '/apercu/boutons?vignette=1',
    );
  });

  it('reporte le design, le mode sombre et les animations coupées', () => {
    const url = urlVignette({
      slug: 'hero-restaurant',
      design: 'laterite',
      mode: 'sombre',
      animations: false,
    });
    const recherche = new URLSearchParams(url.split('?')[1]);
    expect(url.startsWith('/apercu/hero-restaurant?')).toBe(true);
    expect(Object.fromEntries(recherche)).toEqual({
      vignette: '1',
      design: 'laterite',
      mode: 'sombre',
      animations: '0',
    });
  });
});

describe('dimensionsVignette', () => {
  it('garde la largeur de test et réduit pour tenir dans une case étroite', () => {
    const d = dimensionsVignette(LARGEUR_NOMINALE_PX / 2, 240);
    expect(d.largeur).toBe(LARGEUR_NOMINALE_PX);
    expect(d.echelle).toBeCloseTo(0.5);
    expect(d.hauteur).toBeCloseTo(480);
  });

  it('n’agrandit jamais : une case large reçoit l’aperçu à sa taille', () => {
    expect(dimensionsVignette(900, 300)).toEqual({ largeur: 900, hauteur: 300, echelle: 1 });
  });

  it('renvoie des dimensions nulles tant que la case n’est pas mesurée', () => {
    expect(dimensionsVignette(0, 0)).toEqual({ largeur: 0, hauteur: 0, echelle: 1 });
  });
});

describe('ApercuVignetteComponent', () => {
  let rappel: ((entrees: { isIntersecting: boolean }[]) => void) | undefined;
  let fixture: ComponentFixture<ApercuVignetteComponent>;

  function demarrer(saveData = false): void {
    vi.useFakeTimers();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entrees: { isIntersecting: boolean }[]) => void) {
          rappel = cb;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    Object.defineProperty(window.navigator, 'connection', {
      value: { saveData },
      configurable: true,
    });
    fixture = TestBed.createComponent(ApercuVignetteComponent);
    fixture.componentRef.setInput('slug', 'boutons');
    fixture.componentRef.setInput('titre', 'Boutons');
    fixture.componentRef.setInput('icone', 'cursor-click');
    fixture.detectChanges();
  }

  async function visible(oui: boolean): Promise<void> {
    rappel?.([{ isIntersecting: oui }]);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(DELAI_DEMARRAGE_MS + 10);
    fixture.detectChanges();
  }

  const cadre = (): HTMLIFrameElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector('iframe');

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window.navigator, 'connection');
    rappel = undefined;
  });

  it('ne crée aucune iframe tant que la case n’est pas visible', () => {
    demarrer();
    expect(cadre()).toBeNull();
    expect(fixture.nativeElement.getAttribute('data-etat')).toBe('veille');
  });

  it('crée une iframe sandboxée vers la vignette, après le délai de démarrage', async () => {
    demarrer();
    await visible(true);
    const iframe = cadre();
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(iframe?.getAttribute('tabindex')).toBe('-1');
    expect(iframe?.getAttribute('src')).toBe('/apercu/boutons?vignette=1');
    expect(fixture.nativeElement.getAttribute('data-etat')).toBe('chargement');
  });

  it('n’attend pas : une case qui sort avant le délai ne charge rien', async () => {
    demarrer();
    rappel?.([{ isIntersecting: true }]);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(DELAI_DEMARRAGE_MS / 2);
    rappel?.([{ isIntersecting: false }]);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(DELAI_DEMARRAGE_MS);
    fixture.detectChanges();
    expect(cadre()).toBeNull();
  });

  it('passe à « prêt » sur le message de la fenêtre de l’iframe, pas sur un autre', async () => {
    demarrer();
    await visible(true);
    window.dispatchEvent(
      new MessageEvent('message', { data: messagePret(), origin: 'null', source: window }),
    );
    expect(fixture.nativeElement.getAttribute('data-etat')).toBe('chargement');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: messagePret(),
        origin: 'null',
        source: cadre()?.contentWindow ?? null,
      }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-etat')).toBe('pret');
  });

  it('rend sa place et supprime l’iframe quand la case sort du viewport', async () => {
    demarrer();
    const vignettes = TestBed.inject(VignettesService);
    await visible(true);
    expect(vignettes.actives).toBe(1);
    await visible(false);
    expect(cadre()).toBeNull();
    expect(vignettes.actives).toBe(0);
    expect(fixture.nativeElement.getAttribute('data-etat')).toBe('veille');
  });

  it('reste sur l’icône quand toutes les places sont prises', async () => {
    demarrer();
    const vignettes = TestBed.inject(VignettesService);
    for (let i = 0; i < VIGNETTES_SIMULTANEES_MAX; i++) vignettes.reserver(`autre-${i}`);
    await visible(true);
    expect(cadre()).toBeNull();
  });

  it('ne charge rien en mode économie de données', async () => {
    demarrer(true);
    await visible(true);
    expect(cadre()).toBeNull();
  });

  it('abandonne sur l’icône si l’aperçu ne répond pas', async () => {
    demarrer();
    await visible(true);
    await vi.advanceTimersByTimeAsync(DELAI_VIGNETTE_MS + 10);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-etat')).toBe('erreur');
    expect(cadre()).toBeNull();
    expect(TestBed.inject(VignettesService).actives).toBe(0);
  });
});
