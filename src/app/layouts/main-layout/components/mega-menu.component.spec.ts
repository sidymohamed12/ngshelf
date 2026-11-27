import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegistreService } from '@core/registre/registre.service';
import { MegaMenuComponent } from './mega-menu.component';

describe('MegaMenuComponent', () => {
  let fixture: ComponentFixture<MegaMenuComponent>;

  const racine = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const bouton = (): HTMLButtonElement => racine().querySelector('button') as HTMLButtonElement;
  const panneau = (): HTMLElement => racine().querySelector('.ngs-mega') as HTMLElement;

  async function monter(): Promise<void> {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
    fixture = TestBed.createComponent(MegaMenuComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
  }

  function touche(cible: EventTarget, key: string): KeyboardEvent {
    const evenement = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    cible.dispatchEvent(evenement);
    return evenement;
  }

  afterEach(() => {
    vi.useRealTimers();
    fixture.nativeElement.remove();
  });

  it('est fermé au départ : bouton à divulgation, panneau inerte mais présent dans le HTML', async () => {
    await monter();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
    expect(bouton().getAttribute('aria-controls')).toBe(panneau().id);
    expect(panneau().hasAttribute('inert')).toBe(true);
    expect(panneau().querySelectorAll('a[href]').length).toBeGreaterThan(0);
  });

  it('montre les familles avec leur compteur, les types et les secteurs', async () => {
    await monter();
    const compteurs = TestBed.inject(RegistreService).compteurs;
    const composants = panneau().querySelector('a[href="/composants"]') as HTMLElement;
    expect(composants.textContent).toContain('Composants');
    expect(composants.textContent).toContain(`${compteurs.categories.composant} ressources`);
    expect(panneau().querySelector('a[href="/blocs/navbar"]')).not.toBeNull();
    expect(panneau().querySelector('a[href="/secteurs/restaurant"]')).not.toBeNull();
    expect(panneau().querySelector('a[href="/catalogue"]')?.textContent).toContain(
      'Tout le catalogue',
    );
  });

  it('ne lie pas un type ou un secteur sans ressource, mais l’affiche avec un compteur à zéro', async () => {
    await monter();
    expect(panneau().querySelector('a[href="/composants/modale"]')).toBeNull();
    expect(panneau().querySelector('a[href="/secteurs/finance"]')).toBeNull();
    const vides = [...panneau().querySelectorAll('span.ngs-mega__lien')];
    const modale = vides.find((el) => el.textContent?.includes('Modale'));
    expect(modale?.textContent).toContain('0 ressource');
  });

  it('s’ouvre au clic souris sans déplacer le focus, et se referme au second clic', async () => {
    await monter();
    bouton().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('true');
    expect(panneau().hasAttribute('inert')).toBe(false);
    expect(panneau().classList.contains('is-open')).toBe(true);
    expect(racine().contains(document.activeElement)).toBe(false);
    bouton().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
  });

  it('s’ouvre au clavier (Entrée) en plaçant le focus sur le premier lien', async () => {
    await monter();
    bouton().click();
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(panneau().querySelector('a[href]'));
  });

  it('s’ouvre avec la flèche bas, puis Échap le ferme et rend le focus au bouton', async () => {
    await monter();
    const flèche = touche(bouton(), 'ArrowDown');
    await fixture.whenStable();
    expect(flèche.defaultPrevented).toBe(true);
    expect(panneau().hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(panneau().querySelector('a[href]'));
    touche(document.body, 'Escape');
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(bouton());
  });

  it('se referme quand le focus sort du menu, et sur un clic ailleurs dans la page', async () => {
    await monter();
    bouton().click();
    await fixture.whenStable();
    const dehors = document.createElement('button');
    document.body.appendChild(dehors);
    panneau()
      .querySelector('a')
      ?.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: dehors }));
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
    bouton().click();
    await fixture.whenStable();
    dehors.click();
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
    dehors.remove();
  });

  it('reste ouvert quand le focus passe d’un lien du panneau à un autre', async () => {
    await monter();
    bouton().click();
    await fixture.whenStable();
    const liens = panneau().querySelectorAll('a');
    liens[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: liens[1] }));
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('true');
  });

  it('se referme après un clic sur un lien du panneau', async () => {
    await monter();
    bouton().click();
    await fixture.whenStable();
    panneau()
      .querySelector<HTMLAnchorElement>('a[href="/blocs"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
  });

  it('s’ouvre au survol de la souris avec un délai, se ferme avec un délai, et ignore le toucher', async () => {
    await monter();
    vi.useFakeTimers();
    const evenement = (type: string, pointerType: string) =>
      Object.assign(new Event(type, { bubbles: true }), { pointerType });
    bouton().dispatchEvent(evenement('pointerenter', 'touch'));
    vi.advanceTimersByTime(500);
    expect(bouton().getAttribute('aria-expanded')).toBe('false');

    bouton().dispatchEvent(evenement('pointerenter', 'mouse'));
    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
    vi.advanceTimersByTime(50);
    fixture.detectChanges();
    expect(bouton().getAttribute('aria-expanded')).toBe('true');

    bouton().dispatchEvent(evenement('pointerleave', 'mouse'));
    panneau().dispatchEvent(evenement('pointerenter', 'mouse'));
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(bouton().getAttribute('aria-expanded')).toBe('true');

    panneau().dispatchEvent(evenement('pointerleave', 'mouse'));
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(bouton().getAttribute('aria-expanded')).toBe('false');
  });
});
