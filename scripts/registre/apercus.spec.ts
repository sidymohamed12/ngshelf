import type { DesignContrat } from '../../src/app/shared/livraison/livraison.ts';
import { construireApercus } from './apercus.ts';

const COMPOSANT = `@Component({
  templateUrl: './barre.component.html',
  /*STYLE*/
})
export class BarreComponent {}
`;

const FICHIERS = {
  'barre.component.ts': COMPOSANT,
  'tailwind/barre.component.html': '<nav class="flex"></nav>\n',
  'tailwind/hote.txt': 'block\n',
  'css/barre.component.html': '<nav class="barre"></nav>\n',
  'css/barre.component.css': '.barre {}\n',
  'demo/demo.component.ts': 'export class DemoComponent {}\n',
  'fiche.json': '{}',
};

const DESIGN = {
  nom: 'Planche',
  clair: Object.fromEntries(
    [
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
    ].map((t) => [t, '1']),
  ),
} as unknown as DesignContrat;

describe('construireApercus', () => {
  const sorties = construireApercus([{ slug: 'barre', avecMotion: true, fichiers: FICHIERS }], {
    design: DESIGN,
    pont: '/* pont */',
    nomSite: 'NgShelf',
  });

  it('assemble les fichiers de la variante Tailwind, tels que livrés, et la scène', () => {
    expect([...sorties.keys()].sort()).toEqual([
      'barre/barre.component.html',
      'barre/barre.component.ts',
      'barre/demo/demo.component.ts',
      'ngshelf-theme.css',
      'scenes.ts',
      'tokens.css',
    ]);
    expect(sorties.get('barre/barre.component.ts')).toContain(
      "host: { class: 'block', '[class.ngs-sans-animation]': '!animations()' },",
    );
    expect(sorties.get('barre/barre.component.html')).toBe('<nav class="flex"></nav>\n');
  });

  it('ne livre jamais la variante CSS dans l’aperçu', () => {
    expect([...sorties.keys()].some((nom) => nom.endsWith('.css') && nom.includes('barre/'))).toBe(
      false,
    );
  });

  it('déclare chaque scène en chargement différé', () => {
    const scenes = sorties.get('scenes.ts') ?? '';
    expect(scenes).toContain("export const SLUGS_APERCUS = ['barre'] as const;");
    expect(scenes).toContain(
      "'barre': () => import('./barre/demo/demo.component').then((m) => m.DemoComponent),",
    );
  });

  it('déclare les paramètres réglables par ressource, et seulement ceux des ressources qui en ont', () => {
    const avec = construireApercus(
      [
        {
          slug: 'barre',
          avecMotion: false,
          fichiers: FICHIERS,
          parametres: [
            { nom: 'legendes', genre: 'interrupteur', libelle: { fr: 'Légendes' }, defaut: true },
          ],
        },
        { slug: 'autre', avecMotion: false, fichiers: FICHIERS },
      ],
      { design: DESIGN, pont: '', nomSite: 'NgShelf' },
    );
    const scenes = avec.get('scenes.ts') ?? '';
    expect(scenes).toContain('export const PARAMETRES_APERCUS');
    expect(scenes).toContain('\'barre\': [{"nom":"legendes"');
    expect(scenes).not.toContain("'autre': [{");
    expect(sorties.get('scenes.ts')).toContain('PARAMETRES_APERCUS');
  });

  it('charge le même tokens.css et le même pont que ceux livrés', () => {
    expect(sorties.get('tokens.css')).toContain('.dark {');
    expect(sorties.get('ngshelf-theme.css')).toBe('/* pont */');
  });
});
