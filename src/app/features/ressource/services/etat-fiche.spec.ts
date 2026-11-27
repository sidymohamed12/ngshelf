import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CookieService } from '@core/cookies/cookie.service';
import { FicheRessource } from '@shared/models/fiche.model';
import { MetaRessource } from '@shared/models/ressource.model';
import { COOKIE_VARIANTE, EtatFiche, versSurcharges } from './etat-fiche';

const TOKENS = [
  '--ngs-color-action',
  '--ngs-color-on-action',
  '--ngs-color-surface',
  '--ngs-color-surface-alt',
  '--ngs-color-text',
  '--ngs-color-text-muted',
  '--ngs-color-border',
  '--ngs-color-danger',
  '--ngs-radius',
  '--ngs-density',
  '--ngs-font-family',
  '--ngs-duration',
] as const;

function jeu(action: string): FicheRessource['designs'][number]['clair'] {
  return Object.fromEntries(
    TOKENS.map((t) => [t, t === '--ngs-color-action' ? action : '1']),
  ) as FicheRessource['designs'][number]['clair'];
}

const FICHE = {
  meta: {
    slug: 'boutons',
    titre: { fr: 'Boutons' },
    designsMisEnAvant: ['fleuve'],
    motion: null,
  } as unknown as MetaRessource,
  usage: '',
  api: [],
  fichiers: [],
  pont: '',
  designs: [
    { slug: 'planche', nom: 'Planche', clair: jeu('#0b0b0c') },
    {
      slug: 'fleuve',
      nom: 'Fleuve',
      clair: jeu('#0b6464'),
      sombre: { '--ngs-color-action': '#9fd' },
    },
  ],
} as FicheRessource;

function creer(cookie: string | null = null): EtatFiche {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  TestBed.configureTestingModule({
    providers: [
      EtatFiche,
      { provide: CookieService, useValue: { lire: () => cookie, ecrire: vi.fn() } },
    ],
  });
  const etat = TestBed.inject(EtatFiche);
  TestBed.inject(ApplicationRef).tick();
  etat.ouvrir(FICHE);
  return etat;
}

describe('versSurcharges', () => {
  it('traduit les réglages en tokens du contrat', () => {
    expect(versSurcharges({ couleur: '#fff', rayon: 4, densite: 1.2, police: 'serif' })).toEqual({
      '--ngs-color-action': '#fff',
      '--ngs-radius': '4px',
      '--ngs-density': '1.2',
      '--ngs-font-family': expect.stringContaining('ui-serif'),
    });
    expect(versSurcharges({})).toEqual({});
  });
});

describe('EtatFiche', () => {
  it('démarre sur le design mis en avant de la ressource', () => {
    const etat = creer();
    expect(etat.design()).toBe('fleuve');
    expect(etat.valeurs()?.['--ngs-color-action']).toBe('#0b6464');
  });

  it('suit le mode : valeurs sombres du design', () => {
    const etat = creer();
    etat.mode.set('sombre');
    expect(etat.valeurs()?.['--ngs-color-action']).toBe('#9fd');
  });

  it('applique les réglages, recalcule le texte sur l’action et le tokens.css', () => {
    const etat = creer();
    etat.regler({ couleur: '#f4f4f5', densite: 1.2 });
    expect(etat.aDesReglages()).toBe(true);
    expect(etat.valeurs()?.['--ngs-color-on-action']).toBe('#0b0b0c');
    expect(etat.tokensCss()).toContain('Design : Fleuve (réglé par vous)');
    expect(etat.tokensCss()).toContain('--ngs-density: 1.2;');
    expect(etat.contraste().conforme).toBe(true);
  });

  it('change de design en effaçant les réglages, et se réinitialise', () => {
    const etat = creer();
    etat.regler({ rayon: 2 });
    etat.choisirDesign('planche');
    expect(etat.aDesReglages()).toBe(false);
    etat.regler({ rayon: 2 });
    etat.reinitialiser();
    expect(etat.design()).toBe('fleuve');
    expect(etat.aDesReglages()).toBe(false);
  });

  it('lit la variante du cookie après le rendu, tailwind sinon, et l’écrit au choix', () => {
    expect(creer().variante()).toBe('tailwind');
    TestBed.resetTestingModule();
    expect(creer('css').variante()).toBe('css');
    const etat = TestBed.inject(EtatFiche);
    etat.choisirVariante('tailwind');
    expect(TestBed.inject(CookieService).ecrire).toHaveBeenCalledWith(
      COOKIE_VARIANTE,
      'tailwind',
      expect.objectContaining({ dureeSecondes: 31_536_000 }),
    );
  });

  it('prépare le message de l’aperçu avec les 12 valeurs', () => {
    const etat = creer();
    const message = etat.messageApercu();
    expect(Object.keys(message?.vars ?? {})).toHaveLength(12);
    expect(message?.animations).toBe(true);
  });

  it('règle les paramètres propres sur leur définition et les envoie à l’aperçu', () => {
    const etat = creer();
    etat.ouvrir({
      ...FICHE,
      meta: {
        ...FICHE.meta,
        parametres: [
          {
            nom: 'hauteur',
            genre: 'nombre',
            libelle: { fr: 'H' },
            min: 100,
            max: 500,
            pas: 50,
            defaut: 300,
          },
          { nom: 'legendes', genre: 'interrupteur', libelle: { fr: 'L' }, defaut: true },
        ],
      },
    });
    expect(etat.parametres()).toEqual({ hauteur: 300, legendes: true });
    etat.reglerParametre('hauteur', 9999);
    etat.reglerParametre('legendes', false);
    etat.reglerParametre('intrus', 'x');
    expect(etat.parametres()).toEqual({ hauteur: 500, legendes: false });
    expect(etat.messageApercu()?.params).toEqual({ hauteur: 500, legendes: false });
    etat.reinitialiser();
    expect(etat.parametres()).toEqual({ hauteur: 300, legendes: true });
  });
});
