import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { RessourceComponent } from './ressource.component';

function creer(donnees: unknown): HTMLElement {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(RessourceComponent);
  fixture.componentRef.setInput('donnees', donnees);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('fiche : états sans données', () => {
  it('annonce une ressource introuvable avec un lien vers le catalogue', () => {
    const page = creer({ etat: 'introuvable' });
    expect(page.querySelector('h1')?.textContent).toContain(
      TEXTES.pages.ressource.introuvableTitre,
    );
    expect(page.querySelector('a[href="/catalogue"]')).not.toBeNull();
    expect(page.querySelector('iframe')).toBeNull();
  });

  it('propose « Réessayer » quand le chargement a échoué', () => {
    const page = creer({ etat: 'erreur' });
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(TEXTES.etats.reessayer);
    expect(page.querySelector('iframe')).toBeNull();
  });
});

describe('fiche : barre de réglages au-dessus de l’aperçu (ADR 0019)', () => {
  const jeu = {
    '--ngs-color-action': '#0b6464',
    '--ngs-color-on-action': '#ffffff',
    '--ngs-color-surface': '#ffffff',
    '--ngs-color-surface-alt': '#f4f4f5',
    '--ngs-color-text': '#0b0b0c',
    '--ngs-color-text-muted': '#55555e',
    '--ngs-color-border': '#d9d9de',
    '--ngs-color-danger': '#b3261e',
    '--ngs-radius': '8px',
    '--ngs-density': '1',
    '--ngs-font-family': 'system-ui',
    '--ngs-duration': '160ms',
  };
  const fiche = {
    meta: {
      slug: 'boutons',
      categorie: 'composant',
      type: 'bouton',
      titre: { fr: 'Boutons' },
      description: { fr: 'Des boutons.' },
      contratTokens: 1,
      statut: 'publie',
      angularMin: '22.0',
      licence: 'MIT',
      ajouteLe: '2026-11-28',
      designsMisEnAvant: ['planche'],
      motion: null,
    },
    usage: '',
    api: [],
    fichiers: [],
    pont: '',
    designs: [
      { slug: 'planche', nom: 'Planche', clair: jeu, sombre: jeu },
      { slug: 'fleuve', nom: 'Fleuve', clair: jeu, sombre: jeu },
    ],
  };

  function page(): HTMLElement {
    return creer({ etat: 'ok', fiche });
  }

  it('place la barre dans la carte de l’aperçu, avant le cadre, avec taille, mode, design, animations et version du code', () => {
    const el = page();
    const barre = el.querySelector('.ngs-preview .fiche-barre');
    expect(barre).not.toBeNull();
    const groupes = [...(barre?.querySelectorAll('[role="radiogroup"]') ?? [])].map(
      (g) => g.getAttribute('aria-label') ?? g.getAttribute('aria-labelledby'),
    );
    expect(groupes).toHaveLength(4);
    expect(barre?.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(barre?.compareDocumentPosition(el.querySelector('app-apercu-frame') as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('sort l’identité de la colonne de gauche : le titre est au-dessus de la ligne aperçu + panneau', () => {
    const el = page();
    const corps = el.querySelector('.fiche-corps');
    expect(el.querySelector('.fiche-identite')?.closest('.fiche-corps')).toBeNull();
    expect(corps?.querySelector('.ngs-preview')).not.toBeNull();
  });

  it('garde le panneau de réglages à droite de l’aperçu, avec ses groupes repliables', () => {
    const el = page();
    const corps = el.querySelector('.fiche-corps');
    const enfants = [...(corps?.children ?? [])].map((c) => c.tagName.toLowerCase());
    expect(enfants[0]).toBe('section');
    expect(enfants.at(-1)).toBe('app-reglages-fiche');
    expect(corps?.querySelectorAll('aside details.ngs-reglage').length).toBeGreaterThanOrEqual(6);
  });

  it('range les tailles 390, 768 et 1280 dans la barre', () => {
    const el = page();
    const libelles = [...el.querySelectorAll('.fiche-barre [role="radio"]')].map((b) =>
      b.textContent?.trim(),
    );
    expect(libelles).toEqual(expect.arrayContaining(['390', '768', '1280']));
  });
});
