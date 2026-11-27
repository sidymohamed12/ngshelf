import { readFileSync } from 'node:fs';

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

const DESIGNS = ['planche', 'fleuve', 'laterite'] as const;

function lire(fichier: string): string {
  return readFileSync(`src/styles/contrat/${fichier}`, 'utf8');
}

function bloc(css: string, selecteur: string): string {
  const debut = css.indexOf(`${selecteur} {`);
  return debut < 0 ? '' : css.slice(debut, css.indexOf('}', debut));
}

describe('contrat de tokens ngs', () => {
  const contrat = lire('contrat-tokens.css');
  const pont = lire('ngshelf-theme.css');

  it.each(DESIGNS)('le design %s donne une valeur aux 12 tokens en clair', (design) => {
    const clair = bloc(contrat, `.ngs-theme-${design}`);
    for (const token of TOKENS) {
      expect(clair, `${design} : ${token}`).toContain(`${token}:`);
    }
  });

  it('le pont Tailwind déclare les mêmes valeurs par défaut que le design Planche clair', () => {
    const planche = bloc(contrat, '.ngs-theme-planche');
    const defauts = bloc(pont, ':root');
    for (const token of TOKENS) {
      const valeur = new RegExp(`${token}:\\s*([^;]+);`).exec(planche)?.[1];
      expect(valeur, token).toBeDefined();
      expect(defauts, token).toContain(`${token}: ${valeur}`);
    }
  });

  it('le pont Tailwind lit chaque token de couleur, de rayon et de police', () => {
    for (const couleur of [
      'action',
      'on-action',
      'surface',
      'surface-alt',
      'text',
      'text-muted',
      'border',
      'danger',
    ]) {
      expect(pont).toContain(`--color-ngs-${couleur}: var(--ngs-color-${couleur});`);
    }
    expect(pont).toContain('--radius-ngs: var(--ngs-radius);');
    expect(pont).toContain('--font-ngs: var(--ngs-font-family);');
  });
});
