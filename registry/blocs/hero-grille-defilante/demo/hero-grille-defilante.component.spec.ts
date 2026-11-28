import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroGrilleDefilanteComponent } from '../hero-grille-defilante.component';

const IMAGES = ['a.svg', 'b.svg', 'c.svg', 'd.svg'];

describe('HeroGrilleDefilanteComponent', () => {
  let fixture: ComponentFixture<HeroGrilleDefilanteComponent>;
  let racine: HTMLElement;

  const section = (): HTMLElement => racine.querySelector('section') as HTMLElement;
  const progression = (): number => Number(section().style.getPropertyValue('--ngs-p'));

  async function monter(entrees: Record<string, unknown> = {}): Promise<void> {
    fixture = TestBed.createComponent(HeroGrilleDefilanteComponent);
    fixture.componentRef.setInput('images', IMAGES);
    fixture.componentRef.setInput('titre', 'Un titre');
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    racine = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  it('nomme la section par son titre, h2 par défaut et h1 sur demande', async () => {
    await monter();
    const titre = racine.querySelector('h2');
    expect(titre?.textContent?.trim()).toBe('Un titre');
    expect(section().getAttribute('aria-labelledby')).toBe(titre?.id);
    fixture.componentRef.setInput('niveauTitre', 1);
    await fixture.whenStable();
    expect(racine.querySelector('h1')?.textContent?.trim()).toBe('Un titre');
  });

  it('construit trois colonnes de `rangs` images décoratives, cachées aux lecteurs d’écran', async () => {
    await monter({ rangs: 2 });
    const colonnes = [...racine.querySelectorAll('[data-col]')].map((c) =>
      c.getAttribute('data-col'),
    );
    expect(colonnes).toEqual(['gauche', 'gauche', 'centre', 'centre', 'droite', 'droite']);
    expect(racine.querySelectorAll('img')).toHaveLength(6);
    expect(racine.querySelector('[aria-hidden="true"] img')).not.toBeNull();
    for (const image of racine.querySelectorAll('img')) expect(image.getAttribute('alt')).toBe('');
  });

  it('arrondit `rangs` au nombre pair pour garder un espace au centre, sous le titre', async () => {
    await monter({ rangs: 3 });
    expect(section().style.getPropertyValue('--ngs-rangs')).toBe('4');
    const rangs = [...racine.querySelectorAll<HTMLElement>('[data-col="centre"]')].map((t) =>
      t.style.getPropertyValue('--r'),
    );
    expect(rangs).toEqual(['-1.5', '-0.5', '0.5', '1.5']);
    fixture.componentRef.setInput('rangs', 1);
    await fixture.whenStable();
    expect(section().style.getPropertyValue('--ngs-rangs')).toBe('2');
  });

  it('fait descendre les colonnes de côté et monter celle du centre', async () => {
    await monter();
    const cote = (col: string): string | undefined =>
      racine.querySelector<HTMLElement>(`[data-col="${col}"]`)?.style.getPropertyValue('--cote');
    expect([cote('gauche'), cote('centre'), cote('droite')]).toEqual(['1', '0', '1']);
  });

  it('répartit les images en quinconce et les répète pour remplir la grille', async () => {
    await monter({ rangs: 2 });
    const sources = ['gauche', 'centre', 'droite'].map((col) =>
      [...racine.querySelectorAll(`[data-col="${col}"] img`)].map((image) =>
        image.getAttribute('src'),
      ),
    );
    expect(sources).toEqual([
      ['a.svg', 'd.svg'],
      ['b.svg', 'a.svg'],
      ['c.svg', 'b.svg'],
    ]);
  });

  it('n’affiche l’indice que s’il a un texte, caché aux lecteurs d’écran', async () => {
    await monter();
    expect(racine.textContent).not.toContain('Défiler');
    fixture.componentRef.setInput('indice', 'Défiler');
    await fixture.whenStable();
    const indice = [...racine.querySelectorAll('[aria-hidden="true"]')].find((e) =>
      e.textContent?.includes('Défiler'),
    );
    expect(indice).toBeDefined();
  });

  it('n’affiche rien sans image', async () => {
    await monter({ images: [] });
    expect(racine.querySelectorAll('img')).toHaveLength(0);
  });

  it('n’affiche texte et bouton que s’ils ont un contenu', async () => {
    await monter();
    expect(racine.querySelector('p')).toBeNull();
    expect(racine.querySelector('button, a')).toBeNull();
    fixture.componentRef.setInput('texte', 'Un texte');
    fixture.componentRef.setInput('libelle', 'Commencer');
    await fixture.whenStable();
    expect(racine.querySelector('p')?.textContent?.trim()).toBe('Un texte');
    expect(racine.querySelector('button')?.textContent?.trim()).toBe('Commencer');
  });

  it('émet `action` au clic sur le bouton, et devient un lien quand `lien` est renseigné', async () => {
    await monter({ libelle: 'Commencer' });
    const action = vi.fn();
    fixture.componentInstance.action.subscribe(action);
    racine.querySelector('button')?.click();
    expect(action).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('lien', '/inscription');
    await fixture.whenStable();
    expect(racine.querySelector('button')).toBeNull();
    expect(racine.querySelector('a')?.getAttribute('href')).toBe('/inscription');
  });

  it('pose la progression en pilotage manuel, bornée entre 0 et 1', async () => {
    await monter({ pilotage: 'manuel', progression: 0.25 });
    expect(progression()).toBe(0.25);
    expect(section().dataset['fin']).toBe('non');
    fixture.componentRef.setInput('progression', 9);
    await fixture.whenStable();
    expect(progression()).toBe(1);
    expect(section().dataset['fin']).toBe('oui');
  });

  it('démarre à zéro en pilotage par le défilement', async () => {
    await monter();
    expect(progression()).toBe(0);
  });

  it('transmet longueur et rangs en variables CSS', async () => {
    await monter({ longueur: 6, rangs: 6 });
    expect(section().style.getPropertyValue('--ngs-longueur')).toBe('6');
    expect(section().style.getPropertyValue('--ngs-rangs')).toBe('6');
  });

  it('retire ses écouteurs de défilement et de taille à la destruction', async () => {
    const retrait = vi.spyOn(window, 'removeEventListener');
    await monter();
    fixture.destroy();
    expect(retrait).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(retrait).toHaveBeenCalledWith('resize', expect.any(Function));
    retrait.mockRestore();
  });
});
