import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
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

describe('fiche : disposition (ADR 0019 et 0020)', () => {
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

  it('place la barre dans la carte de l’aperçu, avant le cadre, avec la taille et le mode seulement', () => {
    const el = page();
    const barre = el.querySelector('.ngs-preview .fiche-barre');
    expect(barre).not.toBeNull();
    const groupes = [...(barre?.querySelectorAll('[role="radiogroup"]') ?? [])].map(
      (g) => g.getAttribute('aria-label') ?? g.getAttribute('aria-labelledby'),
    );
    expect(groupes).toHaveLength(2);
    expect(barre?.querySelector('input[type="checkbox"]')).toBeNull();
    expect(barre?.compareDocumentPosition(el.querySelector('app-apercu-frame') as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('propose « Agrandir l’aperçu » en bouton (fenêtre modale), jamais en lien vers une autre page', () => {
    const el = page();
    const bouton = el.querySelector('.fiche-barre button[aria-haspopup="dialog"]');
    expect(bouton?.textContent).toContain(TEXTES_FICHE.apercu.ouvrir);
    expect(bouton?.querySelector('use')?.getAttribute('href')).toContain('#arrows-out');
    expect(el.querySelector('.fiche-barre a[target="_blank"]')).toBeNull();
  });

  it('ne duplique aucun réglage : design et animations sont dans le panneau seul, une fois', () => {
    const el = page();
    const reglages = [...el.querySelectorAll('summary > span:first-child')].map((s) =>
      s.textContent?.trim(),
    );
    expect(reglages.filter((r) => r === 'Design')).toHaveLength(1);
    expect(reglages.filter((r) => r === 'Animations')).toHaveLength(1);
    expect(el.querySelectorAll('input[type="checkbox"]').length).toBeLessThanOrEqual(1);
    expect(el.querySelector('.fiche-barre [aria-labelledby="barre-design"]')).toBeNull();
  });

  it('range la version du code (Tailwind, CSS) dans l’en-tête du bloc Code, pas dans la barre', () => {
    const el = page();
    const entete = el.querySelector('.code-entete');
    const boutons = [...(entete?.querySelectorAll('[role="radio"]') ?? [])].map((b) =>
      b.textContent?.trim(),
    );
    expect(boutons).toEqual(['Tailwind', 'CSS']);
    expect(el.querySelector('.fiche-barre')?.textContent).not.toContain('Tailwind');
  });

  it('met l’identité en bandeau linéaire : titre, actions sur la même ligne, fiche technique en dessous', () => {
    const el = page();
    const identite = el.querySelector('app-fiche-identite .fiche-identite');
    expect(identite?.closest('.fiche-corps')).toBeNull();
    const tete = identite?.querySelector('.fiche-identite__tete');
    expect(tete?.querySelector('h1')).not.toBeNull();
    expect(tete?.querySelectorAll('.fiche-identite__actions button')).toHaveLength(2);
    expect(identite?.querySelectorAll('.fiche-meta > div')).toHaveLength(5);
    expect(tete?.compareDocumentPosition(identite?.querySelector('.fiche-meta') as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('garde le panneau de réglages à droite de l’aperçu, à hauteur égale, avec ses groupes repliables', () => {
    const el = page();
    const corps = el.querySelector('.fiche-corps');
    const enfants = [...(corps?.children ?? [])].map((c) => c.tagName.toLowerCase());
    expect(enfants[0]).toBe('section');
    expect(corps?.lastElementChild?.classList).toContain('fiche-corps__reglages');
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
