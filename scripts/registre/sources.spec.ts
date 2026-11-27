import type { FichiersRessource } from './sources.ts';
import { fichiersVariante, nomComposant, structureGabarit } from './sources.ts';

const TS = `import { Component } from '@angular/core';

@Component({
  selector: 'ngs-barre',
  templateUrl: './barre.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarreComponent {}
`;

const BASE: FichiersRessource = {
  'barre.component.ts': TS,
  'barre.service.ts': 'export class BarreService {}\n',
  'tailwind/barre.component.html': '<nav class="flex"></nav>\n',
  'tailwind/hote.txt': 'block font-ngs\n',
  'css/barre.component.html': '<nav class="barre"></nav>\n',
  'css/barre.component.css': '.barre { display: flex; }\n',
  'fiche.json': '{}',
};

describe('nomComposant', () => {
  it('trouve le seul composant de la racine', () => {
    expect(nomComposant(BASE)).toBe('barre');
  });

  it('refuse l’absence ou le doublon', () => {
    expect(nomComposant({})).toBeUndefined();
    expect(nomComposant({ 'a.component.ts': '', 'b.component.ts': '' })).toBeUndefined();
  });
});

describe('fichiersVariante', () => {
  it('variante CSS : styleUrl, puis host quand la ressource est animée', () => {
    const simple = fichiersVariante(BASE, 'css', false);
    expect(simple.map((f) => f.nom)).toEqual([
      'barre.service.ts',
      'barre.component.ts',
      'barre.component.html',
      'barre.component.css',
    ]);
    expect(simple[1].code).toContain("  styleUrl: './barre.component.css',\n  changeDetection");
    const animee = fichiersVariante(BASE, 'css', true);
    expect(animee[1].code).toContain(
      "styleUrl: './barre.component.css',\n  host: { '[class.ngs-sans-animation]': '!animations()' },",
    );
  });

  it('variante Tailwind : classes de l’hôte, pas de feuille sans @keyframes', () => {
    const fichiers = fichiersVariante(BASE, 'tailwind', false);
    expect(fichiers.map((f) => f.nom)).not.toContain('barre.component.css');
    expect(fichiers[1].code).toContain("host: { class: 'block font-ngs' },");
    expect(fichiers[1].code).not.toContain('styleUrl');
    expect(fichiers[2].code).toBe('<nav class="flex"></nav>');
  });

  it('variante Tailwind : une feuille @keyframes est référencée et livrée', () => {
    const avec = { ...BASE, 'tailwind/barre.component.css': '@keyframes a { }\n' };
    const fichiers = fichiersVariante(avec, 'tailwind', true);
    expect(fichiers.map((f) => f.nom)).toContain('barre.component.css');
    expect(fichiers[1].code).toContain(
      "host: { class: 'block font-ngs', '[class.ngs-sans-animation]': '!animations()' },\n  styleUrl: './barre.component.css', // @keyframes seulement",
    );
  });

  it('ne laisse pas de ligne vide quand rien ne remplace le marqueur', () => {
    const sansHote = { ...BASE, 'tailwind/hote.txt': '' };
    expect(fichiersVariante(sansHote, 'tailwind', false)[1].code).not.toContain('/*STYLE*/');
  });

  it('est vide sans composant', () => {
    expect(fichiersVariante({}, 'css', false)).toEqual([]);
  });
});

describe('structureGabarit', () => {
  it('ignore les classes, animate.enter / leave et la mise en forme', () => {
    const a =
      '<li class="a b" animate.enter="x"  animate.leave="y">\n  <span>{{ n }}</span>\n</li>';
    const b = '<li class="c"\n  [animate.enter]="sens() ? \'u\' : \'v\'"><span>{{ n }}</span></li>';
    expect(structureGabarit(a)).toBe(structureGabarit(b));
  });

  it('voit une différence de balise, d’attribut ou de liaison', () => {
    expect(structureGabarit('<a class="x">t</a>')).not.toBe(structureGabarit('<b class="x">t</b>'));
    expect(structureGabarit('<a class="x" href="/">t</a>')).not.toBe(
      structureGabarit('<a class="x">t</a>'),
    );
    expect(structureGabarit('<a (click)="un()">t</a>')).not.toBe(
      structureGabarit('<a (click)="deux()">t</a>'),
    );
  });
});
