import {
  hotesCites,
  hotesInterditsDansApercus,
  hotesTemporairesHorsApercus,
  problemesEntetes,
} from './hotes-tiers.ts';

const regles = { actives: true, hotesTemporaires: ['picsum.photos', 'images.unsplash.com'] };

describe('hotes-tiers', () => {
  it('relève les hôtes cités, une fois chacun', () => {
    expect(hotesCites('a https://Picsum.photos/id/1/2/3 b https://picsum.photos/x')).toEqual([
      'picsum.photos',
    ]);
  });

  it('admet les hôtes temporaires dans les aperçus quand ils sont actifs', () => {
    const texte = 'https://picsum.photos/id/1/8/8 https://www.w3.org/2000/svg';
    expect(hotesInterditsDansApercus(texte, regles)).toEqual([]);
  });

  it('refuse un autre hôte dans les aperçus', () => {
    const texte = 'https://pbs.twimg.com/media/a.jpg https://picsum.photos/id/1/8/8';
    expect(hotesInterditsDansApercus(texte, regles)).toEqual(['pbs.twimg.com']);
  });

  it('refuse les hôtes temporaires dès que les images externes sont coupées', () => {
    const coupees = { ...regles, actives: false };
    expect(hotesInterditsDansApercus('https://picsum.photos/id/1/8/8', coupees)).toEqual([
      'picsum.photos',
    ]);
  });

  it('refuse un hôte temporaire hors des aperçus (site, zips)', () => {
    expect(hotesTemporairesHorsApercus('<img src="https://picsum.photos/x">', regles)).toEqual([
      'picsum.photos',
    ]);
    expect(hotesTemporairesHorsApercus('https://github.com/x', regles)).toEqual([]);
  });

  const entetes = (site: string, apercu: string): string =>
    [
      '/*',
      `  Content-Security-Policy: default-src 'self'; img-src ${site}; font-src 'self'`,
      '/apercu/*',
      '  ! Content-Security-Policy',
      `  Content-Security-Policy: sandbox; img-src ${apercu}; font-src 'self'`,
    ].join('\n');

  it('accepte une CSP du site sans hôte et celle des aperçus égale à la liste blanche', () => {
    const texte = entetes(
      "'self' data:",
      "'self' data: https://picsum.photos https://images.unsplash.com",
    );
    expect(problemesEntetes(texte, regles)).toEqual([]);
  });

  it('refuse un hôte tiers dans la CSP du site', () => {
    const texte = entetes(
      "'self' https://picsum.photos",
      "'self' https://picsum.photos https://images.unsplash.com",
    );
    expect(problemesEntetes(texte, regles)).toEqual([
      expect.stringContaining('/* : img-src admet picsum.photos'),
    ]);
  });

  it('refuse un hôte hors liste blanche et signale un hôte manquant', () => {
    const texte = entetes("'self'", "'self' https://picsum.photos https://pbs.twimg.com");
    const problemes = problemesEntetes(texte, regles);
    expect(problemes).toHaveLength(2);
  });

  it('refuse tout hôte dans les aperçus quand les images externes sont coupées', () => {
    const texte = entetes("'self'", "'self' https://picsum.photos");
    expect(problemesEntetes(texte, { ...regles, actives: false })).toHaveLength(1);
  });
});
