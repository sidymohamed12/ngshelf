import { FicheRessource } from '@shared/models/fiche.model';
import { ContenuLivre, toutLeCode } from './livraison-fiche.service';

const FICHE = { pont: '/* pont */' } as FicheRessource;
const FICHIERS = [
  { nom: 'a.component.ts', langage: 'ts', code: 'export class A {}', html: '' },
  { nom: 'a.component.html', langage: 'html', code: '<p></p>', html: '' },
] as const;

function contenu(variante: 'tailwind' | 'css'): ContenuLivre {
  return { fiche: FICHE, variante, fichiers: FICHIERS, tokensCss: ':root {}', personnalise: false };
}

describe('toutLeCode', () => {
  it('lie les fichiers, puis tokens.css et le pont sous Tailwind', () => {
    const texte = toutLeCode(contenu('tailwind'));
    expect(texte).toBe(
      '/* a.component.ts */\nexport class A {}\n\n<!-- a.component.html -->\n<p></p>\n\n/* tokens.css */\n:root {}\n\n/* ngshelf-theme.css */\n/* pont */',
    );
  });

  it('ne met pas le pont dans la variante CSS', () => {
    expect(toutLeCode(contenu('css'))).not.toContain('ngshelf-theme.css');
  });
});
