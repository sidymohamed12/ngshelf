import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { lireRegistre } from './lire.ts';
import { construireSorties } from './sorties.ts';
import { validerRegistre } from './valider.ts';

describe('lireRegistre', () => {
  let racine: string;

  beforeEach(() => {
    racine = mkdtempSync(join(tmpdir(), 'registre-'));
  });

  afterEach(() => {
    rmSync(racine, { recursive: true, force: true });
  });

  function ecrire(chemin: string, contenu: string): void {
    mkdirSync(join(racine, chemin), { recursive: true });
    writeFileSync(join(racine, chemin, 'meta.json'), contenu);
  }

  it('lit registry/<segment>/<slug>/meta.json dans un ordre stable', () => {
    ecrire('composants/b', '{"slug":"b"}');
    ecrire('composants/a', '{"slug":"a"}');
    ecrire('blocs/c', '{"slug":"c"}');
    const { entrees, erreurs } = lireRegistre(racine);
    expect(erreurs).toEqual([]);
    expect(entrees.map((e) => e.chemin)).toEqual(['blocs/c', 'composants/a', 'composants/b']);
  });

  it('signale un JSON illisible, un meta.json absent et un dossier inconnu', () => {
    ecrire('composants/casse', '{ pas du json');
    mkdirSync(join(racine, 'composants/vide'), { recursive: true });
    mkdirSync(join(racine, 'widgets/x'), { recursive: true });
    const { entrees, erreurs } = lireRegistre(racine);
    expect(entrees).toEqual([]);
    expect(erreurs).toEqual([
      expect.stringContaining('composants/casse : meta.json illisible'),
      expect.stringContaining('composants/vide : meta.json illisible'),
      expect.stringContaining('widgets : dossier inconnu'),
    ]);
  });

  it('lit, valide et indexe le vrai registre du dépôt', () => {
    const { entrees, erreurs } = lireRegistre(resolve(import.meta.dirname, '../../registry'));
    expect(erreurs).toEqual([]);
    const validation = validerRegistre(entrees);
    expect(validation.erreurs).toEqual([]);
    expect(construireSorties(validation.metas).compteurs.total).toBe(entrees.length);
  });
});
