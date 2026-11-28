import { trouverScriptsEnLigne } from './scripts-en-ligne.ts';

describe('trouverScriptsEnLigne', () => {
  it('accepte les scripts externes, y compris modulepreload et defer', () => {
    const html =
      '<script src="theme-init.js"></script><script src="main-ABC.js" type="module"></script>';
    expect(trouverScriptsEnLigne(html)).toEqual([]);
  });

  it('accepte le bloc de données ng-state, qui ne s’exécute pas', () => {
    const html = '<script id="ng-state" type="application/json">{"a":1}</script>';
    expect(trouverScriptsEnLigne(html)).toEqual([]);
  });

  it('accepte un bloc JSON-LD (données, non exécuté : la CSP script-src ne le concerne pas)', () => {
    const html =
      '<script type="application/ld+json" data-ngs-seo="">{"@context":"https://schema.org","@type":"WebSite"}</script>';
    expect(trouverScriptsEnLigne(html)).toEqual([]);
  });

  it('refuse un script exécutable en ligne', () => {
    expect(trouverScriptsEnLigne('<script>alert(1)</script>')).toEqual([
      expect.stringContaining('script en ligne'),
    ]);
    expect(trouverScriptsEnLigne('<script type="module">import("./x.js")</script>')).toHaveLength(
      1,
    );
  });

  it('refuse un attribut d’événement', () => {
    expect(trouverScriptsEnLigne('<button onclick="go()">x</button>')).toEqual([
      expect.stringContaining("attribut d'événement"),
    ]);
    expect(trouverScriptsEnLigne('<a href="/" data-online="x">x</a>')).toEqual([]);
  });

  it('ne confond pas le texte « onclick= » d’une page avec un attribut', () => {
    expect(trouverScriptsEnLigne('<p>écrire onclick= est interdit</p>')).toEqual([]);
  });
});
