/**
 * Écriture d'un zip « stored » (sans compression), sans dépendance : les fichiers livrés sont du texte
 * court, la compression n'apporterait rien d'utile. Même module pour le build (zips standards) et pour le
 * navigateur (zip « avec mes réglages », chargé à la demande). La date est fournie par l'appelant : au
 * build, une date fixe rend les zips identiques d'un build à l'autre.
 */

export interface EntreeZip {
  readonly nom: string;
  readonly contenu: string;
}

const SIGNATURE_LOCALE = 0x04034b50;
const SIGNATURE_CENTRALE = 0x02014b50;
const SIGNATURE_FIN = 0x06054b50;
const VERSION = 20;
const DRAPEAU_UTF8 = 0x0800;
const ANNEE_DEBUT_DOS = 1980;
const TAILLE_ENTETE_LOCALE = 30;
const TAILLE_ENTETE_CENTRALE = 46;
const TAILLE_FIN = 22;

const TABLE_CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(octets: Uint8Array): number {
  let c = 0xffffffff;
  for (const octet of octets) c = (TABLE_CRC[(c ^ octet) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dateDos(date: Date): { readonly heure: number; readonly jour: number } {
  return {
    heure: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1),
    jour:
      ((date.getUTCFullYear() - ANNEE_DEBUT_DOS) << 9) |
      ((date.getUTCMonth() + 1) << 5) |
      date.getUTCDate(),
  };
}

interface Morceau {
  readonly nom: Uint8Array;
  readonly donnees: Uint8Array;
  readonly crc: number;
  readonly decalage: number;
}

function enteteLocale(m: Morceau, d: ReturnType<typeof dateDos>): Uint8Array {
  const vue = new DataView(new ArrayBuffer(TAILLE_ENTETE_LOCALE));
  vue.setUint32(0, SIGNATURE_LOCALE, true);
  vue.setUint16(4, VERSION, true);
  vue.setUint16(6, DRAPEAU_UTF8, true);
  vue.setUint16(10, d.heure, true);
  vue.setUint16(12, d.jour, true);
  vue.setUint32(14, m.crc, true);
  vue.setUint32(18, m.donnees.length, true);
  vue.setUint32(22, m.donnees.length, true);
  vue.setUint16(26, m.nom.length, true);
  return new Uint8Array(vue.buffer);
}

function enteteCentrale(m: Morceau, d: ReturnType<typeof dateDos>): Uint8Array {
  const vue = new DataView(new ArrayBuffer(TAILLE_ENTETE_CENTRALE));
  vue.setUint32(0, SIGNATURE_CENTRALE, true);
  vue.setUint16(4, VERSION, true);
  vue.setUint16(6, VERSION, true);
  vue.setUint16(8, DRAPEAU_UTF8, true);
  vue.setUint16(12, d.heure, true);
  vue.setUint16(14, d.jour, true);
  vue.setUint32(16, m.crc, true);
  vue.setUint32(20, m.donnees.length, true);
  vue.setUint32(24, m.donnees.length, true);
  vue.setUint16(28, m.nom.length, true);
  vue.setUint32(42, m.decalage, true);
  return new Uint8Array(vue.buffer);
}

function finArchive(nombre: number, tailleCentrale: number, decalage: number): Uint8Array {
  const vue = new DataView(new ArrayBuffer(TAILLE_FIN));
  vue.setUint32(0, SIGNATURE_FIN, true);
  vue.setUint16(8, nombre, true);
  vue.setUint16(10, nombre, true);
  vue.setUint32(12, tailleCentrale, true);
  vue.setUint32(16, decalage, true);
  return new Uint8Array(vue.buffer);
}

function concatener(parties: readonly Uint8Array[]): Uint8Array {
  const sortie = new Uint8Array(parties.reduce((total, p) => total + p.length, 0));
  let position = 0;
  for (const partie of parties) {
    sortie.set(partie, position);
    position += partie.length;
  }
  return sortie;
}

/** Archive zip des entrées, dans l'ordre donné. */
export function creerZip(entrees: readonly EntreeZip[], date: Date): Uint8Array {
  const encodeur = new TextEncoder();
  const d = dateDos(date);
  const locales: Uint8Array[] = [];
  const centrales: Uint8Array[] = [];
  let decalage = 0;
  for (const entree of entrees) {
    const donnees = encodeur.encode(entree.contenu);
    const morceau: Morceau = {
      nom: encodeur.encode(entree.nom),
      donnees,
      crc: crc32(donnees),
      decalage,
    };
    locales.push(enteteLocale(morceau, d), morceau.nom, donnees);
    centrales.push(enteteCentrale(morceau, d), morceau.nom);
    decalage += TAILLE_ENTETE_LOCALE + morceau.nom.length + donnees.length;
  }
  const central = concatener(centrales);
  return concatener([...locales, central, finArchive(entrees.length, central.length, decalage)]);
}
