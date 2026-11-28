import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VIGNETTES_SIMULTANEES_MAX, VignettesService } from '@core/apercu/vignettes.service';
import { messageManipulation, messagePret } from '@shared/apercu/protocole';
import { ValeursContrat } from '@shared/livraison/livraison';
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

  it('avec une taille déclarée, garde ses dimensions et remplit la case sans rien couper', () => {
    const d = dimensionsVignette(480, 270, { largeur: 960, hauteur: 540 });
    expect(d).toEqual({ largeur: 960, hauteur: 540, echelle: 0.5 });
    expect(d.hauteur * d.echelle).toBe(270);
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

  it('montre un squelette (jamais l’icône) en attente et pendant le chargement', async () => {
    demarrer();
    const hote = fixture.nativeElement as HTMLElement;
    expect(hote.querySelector('app-squelette')).not.toBeNull();
    expect(hote.querySelector('.ngs-vignette__icone')).toBeNull();
    await visible(true);
    expect(hote.getAttribute('data-etat')).toBe('chargement');
    expect(hote.querySelector('app-squelette')).not.toBeNull();
    expect(hote.querySelector('.ngs-vignette__icone')).toBeNull();
  });

  it('garde l’icône comme repli seulement : échec ou économie de données, sans squelette', async () => {
    demarrer(true);
    const hote = fixture.nativeElement as HTMLElement;
    expect(hote.querySelector('.ngs-vignette__icone')).not.toBeNull();
    expect(hote.querySelector('app-squelette')).toBeNull();
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

  it('envoie les réglages à l’aperçu prêt, puis à chaque changement, sans recharger l’iframe', async () => {
    demarrer();
    await visible(true);
    const iframe = cadre();
    const envoyer = vi.fn();
    Object.defineProperty(iframe?.contentWindow, 'postMessage', {
      value: envoyer,
      configurable: true,
    });
    const valeurs = { '--ngs-color-action': '#0b6464' } as unknown as ValeursContrat;
    fixture.componentRef.setInput('reglages', valeurs);
    fixture.detectChanges();
    expect(envoyer).not.toHaveBeenCalled();
    window.dispatchEvent(
      new MessageEvent('message', {
        data: messagePret(),
        origin: 'null',
        source: iframe?.contentWindow ?? null,
      }),
    );
    fixture.detectChanges();
    expect(envoyer).toHaveBeenCalledTimes(1);
    const [message, cible] = envoyer.mock.calls[0] ?? [];
    expect(cible).toBe('*');
    expect(message).toMatchObject({ v: 1, type: 'ngs-reglages', vars: valeurs, mode: 'clair' });
    fixture.componentRef.setInput('reglages', { '--ngs-color-action': '#b4361c' });
    fixture.detectChanges();
    expect(envoyer).toHaveBeenCalledTimes(2);
    expect(cadre()).toBe(iframe);
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

  describe('aperçu interactif (ADR 0017)', () => {
    function pret(): void {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: messagePret(),
          origin: 'null',
          source: cadre()?.contentWindow ?? null,
        }),
      );
      fixture.detectChanges();
    }

    function depuisLApercu(donnees: unknown, origine = 'null'): void {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: donnees,
          origin: origine,
          source: cadre()?.contentWindow ?? null,
        }),
      );
      fixture.detectChanges();
    }

    const bouton = (): HTMLButtonElement | null =>
      (fixture.nativeElement as HTMLElement).querySelector('button.ngs-vignette__manip');

    it('reste un décor sans bouton quand elle n’est pas interactive (vitrines)', async () => {
      demarrer();
      await visible(true);
      pret();
      expect(bouton()).toBeNull();
      expect(fixture.nativeElement.classList).not.toContain('ngs-vignette--interactif');
    });

    it('garde la sandbox et le tabindex -1, et ajoute un seul bouton « Manipuler l’aperçu » une fois prête', async () => {
      demarrer();
      fixture.componentRef.setInput('interactif', true);
      await visible(true);
      expect(bouton()).toBeNull();
      pret();
      const iframe = cadre();
      expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
      expect(iframe?.getAttribute('tabindex')).toBe('-1');
      expect(iframe?.getAttribute('allow')).toBe('');
      expect(iframe?.getAttribute('title')).toBe('Aperçu interactif de Boutons');
      expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
      expect(bouton()?.getAttribute('aria-label')).toBe('Manipuler l’aperçu de Boutons');
      expect(bouton()?.getAttribute('aria-pressed')).toBe('false');
    });

    it('donne le focus à l’iframe quand on active le bouton', async () => {
      demarrer();
      fixture.componentRef.setInput('interactif', true);
      await visible(true);
      pret();
      const focus = vi.spyOn(cadre() as HTMLIFrameElement, 'focus');
      bouton()?.click();
      expect(focus).toHaveBeenCalledOnce();
    });

    it('affiche l’état actif annoncé par l’aperçu et l’annonce aux lecteurs d’écran', async () => {
      demarrer();
      fixture.componentRef.setInput('interactif', true);
      await visible(true);
      pret();
      depuisLApercu(messageManipulation(true));
      expect(fixture.nativeElement.classList).toContain('ngs-vignette--actif');
      expect(bouton()?.getAttribute('aria-pressed')).toBe('true');
      expect(fixture.nativeElement.querySelector('.ngs-vignette__indice')?.textContent).toContain(
        'Échap',
      );
      expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
        'Échap pour rendre la main',
      );
      depuisLApercu(messageManipulation(false));
      expect(fixture.nativeElement.classList).not.toContain('ngs-vignette--actif');
      expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    });

    it('reprend le focus sur le bouton quand l’aperçu rend la main avec Échap', async () => {
      demarrer();
      fixture.componentRef.setInput('interactif', true);
      await visible(true);
      pret();
      const focus = vi.spyOn(bouton() as HTMLButtonElement, 'focus');
      depuisLApercu(messageManipulation(true));
      depuisLApercu(messageManipulation(false, false));
      expect(focus).not.toHaveBeenCalled();
      depuisLApercu(messageManipulation(true));
      depuisLApercu(messageManipulation(false, true));
      expect(focus).toHaveBeenCalledOnce();
    });

    it('ignore une manipulation qui ne vient pas de l’iframe de la case', async () => {
      demarrer();
      fixture.componentRef.setInput('interactif', true);
      await visible(true);
      pret();
      window.dispatchEvent(
        new MessageEvent('message', {
          data: messageManipulation(true),
          origin: 'null',
          source: window,
        }),
      );
      fixture.detectChanges();
      expect(fixture.nativeElement.classList).not.toContain('ngs-vignette--actif');
      depuisLApercu(messageManipulation(true), 'https://evil.test');
      expect(fixture.nativeElement.classList).not.toContain('ngs-vignette--actif');
    });

    it('rend la main quand la case sort du viewport', async () => {
      demarrer();
      fixture.componentRef.setInput('interactif', true);
      await visible(true);
      pret();
      depuisLApercu(messageManipulation(true));
      await visible(false);
      expect(fixture.nativeElement.classList).not.toContain('ngs-vignette--actif');
      expect(bouton()).toBeNull();
    });
  });
});
