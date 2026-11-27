import type { MetaDesign, MetaRessource } from '../../src/app/shared/models/ressource.model.ts';
import { construireLivraisons } from './livraisons.ts';

const COMPOSANT = `import { Component } from '@angular/core';

@Component({
  selector: 'ngs-barre',
  templateUrl: './barre.component.html',
  /*STYLE*/
})
export class BarreComponent {
  readonly animations = input(true);
}
`;

const FICHIERS = {
  'barre.component.ts': COMPOSANT,
  'tailwind/barre.component.html': '<nav class="flex"></nav>\n',
  'tailwind/hote.txt': 'block\n',
  'css/barre.component.html': '<nav class="barre"></nav>\n',
  'css/barre.component.css': '.barre { display: flex; }\n',
  'fiche.json': JSON.stringify({ usage: '<ngs-barre />', api: [] }),
};

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
];

function design(slug: string, titre: string, action: string): MetaDesign {
  const clair = Object.fromEntries(TOKENS.map((t) => [t, t === TOKENS[0] ? action : '1']));
  return {
    schema: 1,
    slug,
    categorie: 'design',
    titre: { fr: titre },
    description: { fr: '.' },
    secteurs: [],
    tags: [],
    contratTokens: 1,
    valeurs: { clair },
    licence: 'MIT',
    statut: 'provisoire',
    ajouteLe: '2026-11-26',
  };
}

const META = {
  schema: 1,
  slug: 'barre',
  categorie: 'bloc',
  type: 'navbar',
  titre: { fr: 'Barre' },
  description: { fr: 'Une barre.' },
  secteurs: [],
  tags: [],
  contratTokens: 1,
  motion: null,
  variantes: ['tailwind', 'css'],
  angularMin: '22.0',
  licence: 'MIT',
  auteur: { nom: 'Sidy' },
  statut: 'provisoire',
  ajouteLe: '2026-11-26',
  dependances: { npm: [], ressources: [] },
} as MetaRessource;

function livrer() {
  return construireLivraisons({
    ressources: [{ meta: META, fichiers: FICHIERS }],
    designs: [
      design('planche', 'Design Planche', '#000000'),
      design('fleuve', 'Design Fleuve', '#0b6464'),
    ],
    pont: '/* pont */',
    nomSite: 'NgShelf',
  });
}

const lire = (zip: Uint8Array | undefined): string => new TextDecoder().decode(zip);

describe('construireLivraisons', () => {
  it('produit une fiche par ressource : variante Tailwind colorée, pont et designs', () => {
    const fiche = livrer().fiches.get('barre');
    expect(fiche?.fichiers.map((f) => f.nom)).toEqual([
      'barre.component.ts',
      'barre.component.html',
    ]);
    expect(fiche?.fichiers[1]?.code).toBe('<nav class="flex"></nav>');
    expect(fiche?.fichiers[1]?.html).toContain('tok-t');
    expect(fiche?.pont).toBe('/* pont */');
    expect(fiche?.designs.map((d) => [d.slug, d.nom])).toEqual([
      ['planche', 'Planche'],
      ['fleuve', 'Fleuve'],
    ]);
  });

  it('produit le fragment de la variante CSS, avec sa feuille de style', () => {
    const fragment = livrer().fragments.get('barre');
    expect(fragment?.fichiers.map((f) => f.nom)).toEqual([
      'barre.component.ts',
      'barre.component.html',
      'barre.component.css',
    ]);
    expect(fragment?.fichiers[0]?.code).toContain("styleUrl: './barre.component.css',");
  });

  it('met tokens.css dans les deux zips et le pont seulement dans le zip Tailwind', () => {
    const { zips } = livrer();
    expect([...zips.keys()]).toEqual(['barre-tailwind.zip', 'barre-css.zip']);
    const tailwind = lire(zips.get('barre-tailwind.zip'));
    const css = lire(zips.get('barre-css.zip'));
    for (const zip of [tailwind, css]) {
      expect(zip).toContain('tokens.css');
      expect(zip).toContain('README.md');
      expect(zip).toContain('LICENSE');
      expect(zip).toContain('.dark {');
    }
    expect(tailwind).toContain('barre-tailwind/ngshelf-theme.css');
    expect(css).not.toContain('barre-css/ngshelf-theme.css');
  });

  it('livre les mêmes octets d’un appel à l’autre', () => {
    expect(livrer().zips.get('barre-css.zip')).toEqual(livrer().zips.get('barre-css.zip'));
  });

  it('prend le premier design mis en avant pour le tokens.css des zips', () => {
    const meta = { ...META, designsMisEnAvant: ['fleuve'] } as MetaRessource;
    const { zips } = construireLivraisons({
      ressources: [{ meta, fichiers: FICHIERS }],
      designs: [
        design('planche', 'Design Planche', '#000000'),
        design('fleuve', 'Design Fleuve', '#0b6464'),
      ],
      pont: '',
      nomSite: 'NgShelf',
    });
    expect(lire(zips.get('barre-css.zip'))).toContain('Design : Fleuve');
  });
});
