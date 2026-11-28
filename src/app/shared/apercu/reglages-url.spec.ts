import { ecrireRechercheApercu, lireRechercheApercu, versSurcharges } from './reglages-url';

describe('lireRechercheApercu', () => {
  it('démarre clair, animé, sans design ni réglage', () => {
    expect(lireRechercheApercu('')).toEqual({
      design: undefined,
      mode: 'clair',
      animations: true,
      reglages: {},
    });
  });

  it('lit le design, le mode, les animations et les réglages', () => {
    expect(
      lireRechercheApercu(
        '?design=fleuve&mode=sombre&animations=0&couleur=%231f4fd1&rayon=12&densite=1.2&police=serif',
      ),
    ).toEqual({
      design: 'fleuve',
      mode: 'sombre',
      animations: false,
      reglages: { couleur: '#1f4fd1', rayon: 12, densite: 1.2, police: 'serif' },
    });
  });

  it.each([
    ['design avec majuscules', '?design=Fleuve', 'design'],
    ['mode inconnu', '?mode=noir', 'mode'],
  ])('ignore une valeur invalide : %s', (_cas, recherche, champ) => {
    const lu = lireRechercheApercu(recherche);
    expect(champ === 'design' ? lu.design : lu.mode).toBe(champ === 'design' ? undefined : 'clair');
  });

  it.each([
    '?couleur=red',
    '?couleur=%23fff',
    '?couleur=url(x)',
    '?rayon=99',
    '?rayon=-1',
    '?rayon=abc',
    '?densite=9',
    '?densite=x',
    '?police=comic',
  ])('écarte le réglage invalide %s', (recherche) => {
    expect(lireRechercheApercu(recherche).reglages).toEqual({});
  });
});

describe('ecrireRechercheApercu', () => {
  it('n’écrit que ce qui diffère du départ', () => {
    const url = new URLSearchParams();
    ecrireRechercheApercu({ mode: 'clair', animations: true, reglages: {} }, url);
    expect(url.toString()).toBe('');
  });

  it('fait l’aller-retour avec la lecture', () => {
    const etat = {
      design: 'fleuve',
      mode: 'sombre' as const,
      animations: false,
      reglages: { couleur: '#1f4fd1', rayon: 6, densite: 0.85, police: 'arrondie' as const },
    };
    const url = new URLSearchParams();
    ecrireRechercheApercu(etat, url);
    expect(lireRechercheApercu(`?${url.toString()}`)).toEqual(etat);
  });
});

describe('versSurcharges', () => {
  it('traduit les réglages en tokens du contrat', () => {
    expect(versSurcharges({ couleur: '#fff', rayon: 4, densite: 1.2, police: 'serif' })).toEqual({
      '--ngs-color-action': '#fff',
      '--ngs-radius': '4px',
      '--ngs-density': '1.2',
      '--ngs-font-family': expect.stringContaining('ui-serif'),
    });
  });
});
