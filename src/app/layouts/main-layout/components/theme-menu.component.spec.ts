import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@core/theme/theme.service';
import { ThemeMenuComponent } from './theme-menu.component';

function monter() {
  const fixture = TestBed.createComponent(ThemeMenuComponent);
  const racine = fixture.nativeElement as HTMLElement;
  const declencheur = racine.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
  const options = () => [...racine.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
  return { fixture, racine, declencheur, options };
}

describe('ThemeMenuComponent', () => {
  afterEach(() => {
    document.cookie = 'ngs_theme=; Max-Age=0; Path=/';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-choix');
  });

  it('démarre fermé, avec trois choix dont « Système » coché', async () => {
    const { fixture, racine, declencheur, options } = monter();
    await fixture.whenStable();
    expect(declencheur.getAttribute('aria-expanded')).toBe('false');
    expect(declencheur.getAttribute('aria-label')).toBe('Thème du site : système');
    expect(racine.querySelector('#menu-theme')?.hasAttribute('inert')).toBe(true);
    expect(options().map((o) => o.textContent?.trim())).toEqual(['Clair', 'Sombre', 'Système']);
    expect(options().map((o) => o.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
    ]);
  });

  it('s’ouvre au clic et place le focus sur le choix courant', async () => {
    const { fixture, racine, declencheur, options } = monter();
    await fixture.whenStable();
    declencheur.click();
    await fixture.whenStable();
    expect(declencheur.getAttribute('aria-expanded')).toBe('true');
    expect(racine.querySelector('#menu-theme')?.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(options()[2]);
  });

  it('applique le choix, se ferme et rend le focus au bouton', async () => {
    const { fixture, declencheur, options } = monter();
    const theme = TestBed.inject(ThemeService);
    await fixture.whenStable();
    declencheur.click();
    await fixture.whenStable();

    options()[1].click();
    await fixture.whenStable();
    expect(theme.choix()).toBe('sombre');
    expect(declencheur.getAttribute('aria-expanded')).toBe('false');
    expect(declencheur.getAttribute('aria-label')).toBe('Thème du site : sombre');
    expect(document.activeElement).toBe(declencheur);
  });

  it('se déplace aux flèches, en boucle, et se ferme avec Échap', async () => {
    const { fixture, declencheur, options } = monter();
    await fixture.whenStable();
    declencheur.click();
    await fixture.whenStable();

    options()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(options()[0]);
    options()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(options()[2]);

    options()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(declencheur.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(declencheur);
  });

  it('se ferme au clic en dehors', async () => {
    const { fixture, declencheur } = monter();
    await fixture.whenStable();
    declencheur.click();
    await fixture.whenStable();
    document.body.click();
    await fixture.whenStable();
    expect(declencheur.getAttribute('aria-expanded')).toBe('false');
  });
});
