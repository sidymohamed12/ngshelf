import type { LangageCode } from './sources.ts';

/**
 * Coloration syntaxique du code affiché sur la fiche (classes `.tok-*` de components.css), faite au build :
 * le visiteur reçoit du HTML déjà coloré, aucun script de coloration n'est livré. Coloriseur léger (TS,
 * gabarits Angular, CSS) repris de la maquette ; ADR 0002 prévoit Shiki, à adopter si Sidy accepte la
 * dépendance (grammaires `angular-ts` et `angular-html`).
 */

const MOTS_TS = new Set([
  'import',
  'from',
  'export',
  'class',
  'interface',
  'const',
  'let',
  'readonly',
  'protected',
  'private',
  'public',
  'return',
  'if',
  'else',
  'new',
  'function',
  'type',
  'of',
  'in',
  'void',
  'boolean',
  'number',
  'string',
  'null',
  'undefined',
  'true',
  'false',
  'this',
]);

function echapper(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function span(classe: string, texte: string): string {
  return `<span class="tok-${classe}">${texte}</span>`;
}

const JETONS_TS =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(@[A-Za-z]+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;

function colorerTs(code: string): string {
  let sortie = '';
  for (const [, commentaire, chaine, decorateur, nombre, mot, autre] of code.matchAll(JETONS_TS)) {
    if (commentaire) sortie += span('c', echapper(commentaire));
    else if (chaine) sortie += span('s', echapper(chaine));
    else if (decorateur) sortie += span('a', echapper(decorateur));
    else if (nombre) sortie += span('n', nombre);
    else if (mot) sortie += MOTS_TS.has(mot) ? span('k', mot) : echapper(mot);
    else sortie += echapper(autre ?? '');
  }
  return sortie;
}

const JETONS_HTML =
  /(<!--[\s\S]*?-->)|(<\/?)([\w-]+)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?>)|(@(?:for|if|else|switch|case|defer|empty|let)\b)|(\{\{[\s\S]*?\}\})|([^<@{]+|[\s\S])/g;

const ATTRIBUT = /([[(#*]*[\w.\-@:$]+[\])]*)(=)?("[^"]*"|'[^']*')?|([^"'\s]+|\s+)/g;

function colorerAttributs(attributs: string): string {
  let sortie = '';
  for (const [, nom, egal, valeur, autre] of attributs.matchAll(ATTRIBUT)) {
    if (autre) sortie += echapper(autre);
    else {
      if (nom) sortie += span('a', echapper(nom));
      if (egal) sortie += span('p', '=');
      if (valeur) sortie += span('s', echapper(valeur));
    }
  }
  return sortie;
}

function colorerHtml(code: string): string {
  let sortie = '';
  for (const [
    ,
    commentaire,
    ouvrant,
    balise,
    attributs,
    fermant,
    flux,
    interpolation,
    texte,
  ] of code.matchAll(JETONS_HTML)) {
    if (commentaire) sortie += span('c', echapper(commentaire));
    else if (balise) {
      sortie += span('p', echapper(ouvrant ?? '')) + span('t', balise);
      sortie += colorerAttributs(attributs ?? '') + span('p', echapper(fermant ?? ''));
    } else if (flux) sortie += span('k', flux);
    else if (interpolation) sortie += span('n', echapper(interpolation));
    else sortie += echapper(texte ?? '');
  }
  return sortie;
}

const JETONS_CSS =
  /(\/\*[\s\S]*?\*\/)|("[^"]*")|(--[\w-]+)|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b|\b\d*\.?\d+(?:px|ms|rem|em|%|deg|s)?\b)|([\w-]+)(?=\s*:)|([\s\S])/g;

function colorerCss(code: string): string {
  let sortie = '';
  for (const [, commentaire, chaine, variable, regle, nombre, propriete, autre] of code.matchAll(
    JETONS_CSS,
  )) {
    if (commentaire) sortie += span('c', echapper(commentaire));
    else if (chaine) sortie += span('s', echapper(chaine));
    else if (variable) sortie += span('t', variable);
    else if (regle) sortie += span('k', regle);
    else if (nombre) sortie += span('n', nombre);
    else if (propriete) sortie += span('a', propriete);
    else sortie += echapper(autre ?? '');
  }
  return sortie;
}

const COLORIEURS: Record<LangageCode, (code: string) => string> = {
  ts: colorerTs,
  html: colorerHtml,
  css: colorerCss,
};

/** HTML coloré d'un code source ; le texte, une fois les balises retirées, est le code d'origine. */
export function colorer(code: string, langage: LangageCode): string {
  return COLORIEURS[langage](code);
}
