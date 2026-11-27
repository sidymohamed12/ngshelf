import { crc32, creerZip } from './zip';

const DATE = new Date(Date.UTC(2026, 10, 26, 12, 0, 0));
const SIGNATURE_FIN = 0x06054b50;

function lireFin(zip: Uint8Array): { nombre: number; tailleCentrale: number; decalage: number } {
  const vue = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const debut = zip.length - 22;
  expect(vue.getUint32(debut, true)).toBe(SIGNATURE_FIN);
  return {
    nombre: vue.getUint16(debut + 10, true),
    tailleCentrale: vue.getUint32(debut + 12, true),
    decalage: vue.getUint32(debut + 16, true),
  };
}

describe('crc32', () => {
  it('donne la valeur de référence de « 123456789 »', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('creerZip', () => {
  const entrees = [
    { nom: 'bouton-tailwind/bouton.component.ts', contenu: 'export class A {}\n' },
    { nom: 'bouton-tailwind/LICENSE', contenu: 'MIT — é à ç' },
  ];

  it('écrit une archive cohérente : nombre d’entrées, répertoire central, tailles', () => {
    const zip = creerZip(entrees, DATE);
    const fin = lireFin(zip);
    expect(fin.nombre).toBe(2);
    expect(fin.decalage + fin.tailleCentrale + 22).toBe(zip.length);
  });

  it('contient les noms et les contenus tels quels (UTF-8, sans compression)', () => {
    const texte = new TextDecoder().decode(creerZip(entrees, DATE));
    expect(texte).toContain('bouton-tailwind/bouton.component.ts');
    expect(texte).toContain('export class A {}');
    expect(texte).toContain('MIT — é à ç');
  });

  it('est identique d’un appel à l’autre pour la même date (zips reproductibles)', () => {
    expect(creerZip(entrees, DATE)).toEqual(creerZip(entrees, DATE));
  });

  it('change quand la date change', () => {
    const autre = creerZip(entrees, new Date(Date.UTC(2027, 0, 2, 3, 4, 6)));
    expect(autre).not.toEqual(creerZip(entrees, DATE));
  });
});
