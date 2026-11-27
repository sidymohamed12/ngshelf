import { readFileSync } from 'node:fs';
import {
  DesignContrat,
  ValeursContrat,
  contraste,
  genererLicence,
  genererReadme,
  genererTokensCss,
  texteSur,
  valeursDuDesign,
} from './livraison';

const CLAIR: ValeursContrat = {
  '--ngs-color-action': '#0b0b0c',
  '--ngs-color-on-action': '#ffffff',
  '--ngs-color-surface': '#ffffff',
  '--ngs-color-surface-alt': '#f4f4f5',
  '--ngs-color-text': '#0b0b0c',
  '--ngs-color-text-muted': '#5f5f66',
  '--ngs-color-border': '#8a8a93',
  '--ngs-color-danger': '#b42318',
  '--ngs-radius': '10px',
  '--ngs-density': '1',
  '--ngs-font-family': 'system-ui, sans-serif',
  '--ngs-duration': '160ms',
};

const PLANCHE: DesignContrat = {
  nom: 'Planche',
  clair: CLAIR,
  sombre: { '--ngs-color-action': '#f4f4f5', '--ngs-color-surface': '#111113' },
};

describe('contraste', () => {
  it('vaut 21 entre noir et blanc et 1 entre deux couleurs identiques', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contraste('#777', '#777777')).toBeCloseTo(1, 5);
  });

  it('choisit le texte lisible sur une couleur d’action', () => {
    expect(texteSur('#0b6464')).toBe('#ffffff');
    expect(texteSur('#f4f4f5')).toBe('#0b0b0c');
  });
});

describe('valeursDuDesign', () => {
  it('donne les valeurs claires, puis les valeurs sombres complétées par le clair', () => {
    expect(valeursDuDesign(PLANCHE, 'clair')['--ngs-color-action']).toBe('#0b0b0c');
    const sombre = valeursDuDesign(PLANCHE, 'sombre');
    expect(sombre['--ngs-color-action']).toBe('#f4f4f5');
    expect(sombre['--ngs-radius']).toBe('10px');
  });

  it('applique les réglages et recalcule le texte sur l’action', () => {
    const valeurs = valeursDuDesign(PLANCHE, 'clair', {
      '--ngs-color-action': '#f4f4f5',
      '--ngs-radius': '2px',
    });
    expect(valeurs['--ngs-radius']).toBe('2px');
    expect(valeurs['--ngs-color-on-action']).toBe('#0b0b0c');
  });
});

describe('genererTokensCss', () => {
  const css = genererTokensCss({ nomSite: 'NgShelf', titreRessource: 'Boutons', design: PLANCHE });

  it('écrit les 12 tokens dans :root et les 8 couleurs dans .dark', () => {
    const [racine, sombre] = css.split('.dark {');
    expect(racine.match(/--ngs-[a-z-]+:/g)).toHaveLength(12);
    expect(sombre?.match(/--ngs-[a-z-]+:/g)).toHaveLength(8);
    expect(sombre).toContain('--ngs-color-action: #f4f4f5;');
    expect(sombre).not.toContain('--ngs-radius');
  });

  it('dit le design, le mode sombre par .dark et ne parle jamais de dark: ni de ngs-sombre', () => {
    expect(css).toContain('Design : Planche\n');
    expect(css).toContain('ajoutez la classe .dark');
    expect(css).not.toMatch(/ngs-sombre|html\.sombre|dark:/);
  });

  it('signale les réglages du visiteur', () => {
    const regle = genererTokensCss({
      nomSite: 'NgShelf',
      titreRessource: 'Boutons',
      design: PLANCHE,
      surcharges: { '--ngs-density': '1.2' },
    });
    expect(regle).toContain('Design : Planche (réglé par vous)');
    expect(regle).toContain('--ngs-density: 1.2;');
  });

  it('suit les valeurs du pont : même défaut que le design Planche clair du registre', () => {
    const pont = readFileSync('src/styles/contrat/ngshelf-theme.css', 'utf8');
    const planche = JSON.parse(readFileSync('registry/designs/planche/meta.json', 'utf8')) as {
      valeurs: { clair: Record<string, string> };
    };
    expect(Object.keys(planche.valeurs.clair)).toHaveLength(12);
    for (const [token, valeur] of Object.entries(planche.valeurs.clair)) {
      expect(pont, token).toContain(`${token}: ${valeur}`);
    }
  });
});

describe('genererReadme et genererLicence', () => {
  const readme = genererReadme({
    nomSite: 'NgShelf',
    titre: 'Boutons',
    description: 'Trois variantes.',
    slug: 'boutons',
    variante: 'tailwind',
    angularMin: '22.0',
    dependances: 'Aucune : seulement Angular 22',
    usage: '<ngs-bouton />',
  });

  it('remplace le slug, la version et l’usage, et explique .dark', () => {
    expect(readme).toContain('`src/app/ui/boutons/`');
    expect(readme).toContain('Angular 22.0 ou plus récent');
    expect(readme).toContain('<ngs-bouton />');
    expect(readme).toContain('`ngshelf-theme.css`');
    expect(readme).toContain('classe `dark` sur `<html>`');
    expect(readme).not.toMatch(/\{[a-z]+\}/);
  });

  it('ne demande pas ngshelf-theme.css à la variante CSS', () => {
    const css = genererReadme({
      nomSite: 'NgShelf',
      titre: 'Boutons',
      description: '.',
      slug: 'boutons',
      variante: 'css',
      angularMin: '22.0',
      dependances: 'Aucune',
      usage: 'x',
    });
    expect(css).not.toContain('ngshelf-theme.css');
    expect(css).toContain('Version du code : CSS et tokens');
  });

  it('écrit une licence MIT datée', () => {
    expect(genererLicence(2026, 'Les contributeurs de NgShelf')).toContain(
      'Copyright (c) 2026 Les contributeurs de NgShelf',
    );
  });
});
