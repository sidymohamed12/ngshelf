import {
  filtrerReglages,
  lireMessageVersApercu,
  lireMessageVersSite,
  messageHauteur,
  messagePret,
  messageReglages,
  messageSortie,
  messageSortieFin,
  valeurDeTokenAcceptable,
  vientDeLApercu,
  vientDuSite,
} from './protocole';

describe('valeurDeTokenAcceptable', () => {
  it.each(['#0b0b0c', '10px', '1.2', 'system-ui, sans-serif', '160ms'])('accepte %s', (valeur) => {
    expect(valeurDeTokenAcceptable(valeur)).toBe(true);
  });

  it.each([
    'url(https://x.test/a.png)',
    'URL(x)',
    'red; background: blue',
    'a { b: c }',
    '@import "x"',
    'u\\72l(x)',
    '',
    '   ',
    'a'.repeat(121),
  ])('refuse %s', (valeur) => {
    expect(valeurDeTokenAcceptable(valeur)).toBe(false);
  });

  it('refuse ce qui n’est pas un texte', () => {
    expect(valeurDeTokenAcceptable(12)).toBe(false);
    expect(valeurDeTokenAcceptable(null)).toBe(false);
  });
});

describe('filtrerReglages', () => {
  it('ne garde que les 12 clés du contrat', () => {
    expect(
      filtrerReglages({
        '--ngs-color-action': '#0b6464',
        '--ngs-radius': '18px',
        '--color-canvas': '#000000',
        background: 'red',
        '--ngs-inconnu': '1',
      }),
    ).toEqual({ '--ngs-color-action': '#0b6464', '--ngs-radius': '18px' });
  });

  it('écarte une valeur dangereuse mais garde les autres clés', () => {
    expect(
      filtrerReglages({
        '--ngs-color-action': 'url(https://x.test)',
        '--ngs-density': '1.2',
      }),
    ).toEqual({ '--ngs-density': '1.2' });
  });

  it('renvoie un objet vide pour tout ce qui n’est pas un objet', () => {
    expect(filtrerReglages(null)).toEqual({});
    expect(filtrerReglages('x')).toEqual({});
    expect(filtrerReglages(['a'])).toEqual({});
  });
});

describe('lireMessageVersApercu', () => {
  it('lit un message de réglages valide, en filtrant les clés', () => {
    const lu = lireMessageVersApercu({
      v: 1,
      type: 'ngs-reglages',
      vars: { '--ngs-radius': '4px', '--x': '1' },
      mode: 'sombre',
      animations: false,
      params: { orientation: 'vertical', 'x-y': 1, hauteur: 460 },
    });
    expect(lu).toEqual(
      messageReglages({
        vars: { '--ngs-radius': '4px' },
        mode: 'sombre',
        animations: false,
        params: { orientation: 'vertical', hauteur: 460 },
      }),
    );
  });

  it('accepte un message sans params (ancien site) et le lit comme vide', () => {
    const lu = lireMessageVersApercu({
      v: 1,
      type: 'ngs-reglages',
      vars: {},
      mode: 'clair',
      animations: true,
    });
    expect(lu).toEqual(messageReglages({ vars: {}, mode: 'clair', animations: true, params: {} }));
  });

  it('refuse une version inconnue, un type inconnu et une forme invalide', () => {
    const base = { v: 1, type: 'ngs-reglages', vars: {}, mode: 'clair', animations: true };
    expect(lireMessageVersApercu({ ...base, v: 2 })).toBeNull();
    expect(lireMessageVersApercu({ ...base, type: 'ngs-tokens' })).toBeNull();
    expect(lireMessageVersApercu({ ...base, mode: 'noir' })).toBeNull();
    expect(lireMessageVersApercu({ ...base, animations: 'oui' })).toBeNull();
    expect(lireMessageVersApercu(null)).toBeNull();
    expect(lireMessageVersApercu('ngs-reglages')).toBeNull();
  });

  it('lit une sortie dont les classes sont de simples noms de classes', () => {
    expect(lireMessageVersApercu(messageSortie('hero-sortie'))).toEqual(
      messageSortie('hero-sortie'),
    );
    expect(lireMessageVersApercu(messageSortie('a b'))).toEqual(messageSortie('a b'));
  });

  it('refuse des classes qui sortent du format', () => {
    for (const classes of ['', 'a;b', 'x" onload="y', '<img>', 'a'.repeat(81)]) {
      expect(lireMessageVersApercu({ v: 1, type: 'ngs-sortie', classes })).toBeNull();
    }
    expect(lireMessageVersApercu({ v: 1, type: 'ngs-sortie', classes: 3 })).toBeNull();
  });

  it('ignore un message destiné au site', () => {
    expect(lireMessageVersApercu(messagePret())).toBeNull();
  });
});

describe('lireMessageVersSite', () => {
  it('lit pret et sortie-fin', () => {
    expect(lireMessageVersSite(messagePret())).toEqual(messagePret());
    expect(lireMessageVersSite(messageSortieFin())).toEqual(messageSortieFin());
  });

  it('lit une hauteur entière et bornée', () => {
    expect(lireMessageVersSite(messageHauteur(312.6))).toEqual(messageHauteur(313));
    for (const hauteur of [-1, Number.NaN, Infinity, 20_001, '300']) {
      expect(lireMessageVersSite({ v: 1, type: 'ngs-hauteur', hauteur })).toBeNull();
    }
  });

  it('ignore un type inconnu, une autre version et un message destiné à l’aperçu', () => {
    expect(lireMessageVersSite({ v: 1, type: 'ngs-autre' })).toBeNull();
    expect(lireMessageVersSite({ v: 2, type: 'ngs-pret' })).toBeNull();
    expect(lireMessageVersSite(messageSortie('x'))).toBeNull();
    expect(lireMessageVersSite(undefined)).toBeNull();
  });
});

describe('contrôle de provenance', () => {
  const apercu = {};
  const parent = {};
  const origines = ['https://ngshelf.example', 'http://localhost:4200'];

  it('site : source ET origine opaque requises', () => {
    expect(vientDeLApercu({ source: apercu, origin: 'null' }, apercu)).toBe(true);
    expect(vientDeLApercu({ source: {}, origin: 'null' }, apercu)).toBe(false);
    expect(vientDeLApercu({ source: apercu, origin: 'https://evil.test' }, apercu)).toBe(false);
    expect(vientDeLApercu({ source: apercu, origin: 'null' }, null)).toBe(false);
    expect(vientDeLApercu({ source: null, origin: 'null' }, null)).toBe(false);
  });

  it('aperçu : fenêtre parente ET origine du site requises', () => {
    expect(
      vientDuSite({ source: parent, origin: 'https://ngshelf.example' }, parent, origines),
    ).toBe(true);
    expect(vientDuSite({ source: parent, origin: 'http://localhost:4200' }, parent, origines)).toBe(
      true,
    );
    expect(vientDuSite({ source: {}, origin: 'https://ngshelf.example' }, parent, origines)).toBe(
      false,
    );
    expect(vientDuSite({ source: parent, origin: 'https://evil.test' }, parent, origines)).toBe(
      false,
    );
    expect(vientDuSite({ source: parent, origin: 'null' }, parent, origines)).toBe(false);
    expect(vientDuSite({ source: parent, origin: 'https://ngshelf.example' }, null, origines)).toBe(
      false,
    );
  });
});
