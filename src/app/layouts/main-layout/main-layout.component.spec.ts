import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';

async function monter() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(MainLayoutComponent);
  await fixture.whenStable();
  return { fixture, racine: fixture.nativeElement as HTMLElement };
}

describe('MainLayoutComponent', () => {
  afterEach(() => {
    document.documentElement.style.overflow = '';
  });

  it('assemble lien d’évitement, header, contenu et pied de page', async () => {
    const { racine } = await monter();
    expect(racine.querySelector('a.ngs-skip')?.textContent).toContain('Aller au contenu');
    expect(racine.querySelector('header.ngs-header')).not.toBeNull();
    expect(racine.querySelector('main#contenu')).not.toBeNull();
    expect(racine.querySelector('footer.ngs-footer')).not.toBeNull();
  });

  it('place le focus sur le contenu avec le lien d’évitement, sans naviguer', async () => {
    const { racine } = await monter();
    const evitement = racine.querySelector('a.ngs-skip') as HTMLAnchorElement;
    const evenement = new MouseEvent('click', { bubbles: true, cancelable: true });
    evitement.dispatchEvent(evenement);
    expect(evenement.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(racine.querySelector('main'));
  });

  it('propose la navigation principale vers le catalogue et la page à propos', async () => {
    const { racine } = await monter();
    const nav = racine.querySelector('nav[aria-label="Navigation principale"]') as HTMLElement;
    const liens = [...nav.querySelectorAll('.ngs-nav-link')].map((a) => a.textContent?.trim());
    expect(liens).toEqual(['Catalogue', 'Composants', 'Blocs', 'Designs', 'À propos']);
  });

  it('liste les secteurs avec leurs compteurs dans le menu mobile, sans lien pour un secteur vide', async () => {
    const { racine } = await monter();
    const menu = racine.querySelector('#menu-mobile') as HTMLElement;
    expect(menu.querySelector('details summary')?.textContent).toContain('Par secteur');
    expect(menu.querySelector('a[href="/secteurs/restaurant"]')?.textContent).toContain(
      'Restaurant',
    );
    expect(menu.querySelector('a[href="/secteurs/finance"]')).toBeNull();
  });

  it('ne montre pas le lien GitHub tant que le dépôt n’existe pas', async () => {
    const { racine } = await monter();
    expect(racine.querySelector('.ngs-header__github')).toBeNull();
  });

  it('ouvre le menu mobile, bloque le défilement, y place le focus puis le ferme avec Échap', async () => {
    const { fixture, racine } = await monter();
    const ouvrir = racine.querySelector('.ngs-menu-btn') as HTMLButtonElement;
    const menu = racine.querySelector('#menu-mobile') as HTMLElement;
    expect(menu.hasAttribute('inert')).toBe(true);

    ouvrir.click();
    await fixture.whenStable();
    expect(ouvrir.getAttribute('aria-expanded')).toBe('true');
    expect(menu.hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Fermer le menu');

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(menu.hasAttribute('inert')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('expose les réseaux de Sidy dans le pied de page, les liens externes s’ouvrant à part', async () => {
    const { racine } = await monter();
    const reseaux = [...racine.querySelectorAll<HTMLAnchorElement>('.ngs-reseau')];
    expect(reseaux).toHaveLength(5);
    const mail = reseaux.find((a) => a.href.startsWith('mailto:'));
    expect(mail?.hasAttribute('target')).toBe(false);
    for (const lien of reseaux.filter((a) => a !== mail)) {
      expect(lien.getAttribute('target')).toBe('_blank');
      expect(lien.getAttribute('rel')).toContain('noopener');
    }
  });
});
