import { estNoindex, trouverJsonLdInvalides } from './verifier-seo.ts';

const bloc = (json: string): string =>
  `<script type="application/ld+json" data-ngs-seo="">${json}</script>`;

describe('trouverJsonLdInvalides', () => {
  it('accepte un bloc valide avec @context et @type', () => {
    expect(
      trouverJsonLdInvalides(bloc('{"@context":"https://schema.org","@type":"WebSite"}')),
    ).toEqual([]);
  });

  it('refuse un JSON cassé ou sans @type', () => {
    expect(trouverJsonLdInvalides(bloc('{"@context":'))).toHaveLength(1);
    expect(trouverJsonLdInvalides(bloc('{"@context":"https://schema.org"}'))).toHaveLength(1);
  });

  it('ignore une page sans JSON-LD', () => {
    expect(trouverJsonLdInvalides('<html><script src="a.js"></script></html>')).toEqual([]);
  });
});

describe('estNoindex', () => {
  it('lit la balise robots', () => {
    expect(estNoindex('<meta name="robots" content="noindex, follow">')).toBe(true);
    expect(estNoindex('<meta name="description" content="noindex">')).toBe(false);
  });
});
