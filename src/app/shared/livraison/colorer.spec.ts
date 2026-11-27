import { colorer } from './colorer';

function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const TS = `import { Component, input } from '@angular/core';

/** Un bouton. */
@Component({ selector: 'ngs-bouton', templateUrl: './b.html' })
export class B {
  readonly n = input<number>(3); // commentaire
}`;

const HTML = `<button class="a" [disabled]="x() && !y" (click)="go(1 < 2)">
  @if (ok()) { {{ titre() }} }
</button>
<!-- note & <b> -->`;

const CSS = `/* c */
.a { color: var(--ngs-color-text, #0b0b0c); padding: 12px; }
@media (min-width: 40rem) { .a { margin: 0 } }`;

describe('colorer', () => {
  it.each([
    ['ts', TS],
    ['html', HTML],
    ['css', CSS],
  ] as const)('%s : le texte sous les balises est le code d’origine', (langage, code) => {
    expect(texte(colorer(code, langage))).toBe(code);
  });

  it('échappe le HTML pour ne jamais injecter de balise', () => {
    const html = colorer('<script>alert(1)</script>', 'html');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;');
  });

  it('colore mots-clés, chaînes, décorateurs et commentaires TypeScript', () => {
    const html = colorer(TS, 'ts');
    expect(html).toContain('<span class="tok-k">import</span>');
    expect(html).toContain('<span class="tok-s">\'@angular/core\'</span>');
    expect(html).toContain('<span class="tok-a">@Component</span>');
    expect(html).toContain('<span class="tok-c">// commentaire</span>');
  });
});
