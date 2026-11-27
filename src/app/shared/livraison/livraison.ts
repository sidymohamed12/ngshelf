/**
 * Ce que le visiteur emporte (ADR 0002 décision 5, ADR 0008) : `tokens.css`, README et LICENSE.
 * Module sans dépendance d'exécution : le même fichier sert au build (scripts/registre, qui produit les
 * zips standards) et au navigateur (zip « avec mes réglages », copie du code). Les textes sont en français,
 * ce sont des fichiers livrés, pas de l'interface.
 */

export const TOKENS_CONTRAT = [
  '--ngs-color-action',
  '--ngs-color-on-action',
  '--ngs-color-surface',
  '--ngs-color-surface-alt',
  '--ngs-color-text',
  '--ngs-color-text-muted',
  '--ngs-color-border',
  '--ngs-color-danger',
  '--ngs-radius',
  '--ngs-density',
  '--ngs-font-family',
  '--ngs-duration',
] as const;

export type TokenContrat = (typeof TOKENS_CONTRAT)[number];
export type ValeursContrat = Readonly<Record<TokenContrat, string>>;
export type Surcharges = Readonly<Partial<Record<TokenContrat, string>>>;
export type ModeContrat = 'clair' | 'sombre';

/** Les 8 premiers tokens (couleurs) : seuls à changer en mode sombre. */
const NOMBRE_TOKENS_SOMBRES = 8;
const TOKEN_ACTION: TokenContrat = '--ngs-color-action';
const TOKEN_SUR_ACTION: TokenContrat = '--ngs-color-on-action';
const ENCRE = '#0b0b0c';
const BLANC = '#ffffff';
const SEUIL_LUMINANCE_SRGB = 0.04045;

/** Un design : ses valeurs en clair (complètes) et en sombre (celles qui changent). */
export interface DesignContrat {
  readonly nom: string;
  readonly clair: ValeursContrat;
  readonly sombre?: Readonly<Partial<Record<TokenContrat, string>>>;
}

function luminance(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const x = Number.parseInt(h.slice(i, i + 2), 16) / 255;
    return x <= SEUIL_LUMINANCE_SRGB ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG entre deux couleurs hexadécimales (1 à 21). */
export function contraste(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Blanc ou encre : le texte qui contraste le mieux sur une couleur d'action. */
export function texteSur(hex: string): string {
  return contraste(hex, BLANC) >= contraste(hex, ENCRE) ? BLANC : ENCRE;
}

/** Valeurs résolues : design, mode, puis réglages du visiteur (le texte sur l'action suit la couleur). */
export function valeursDuDesign(
  design: DesignContrat,
  mode: ModeContrat,
  surcharges: Surcharges = {},
): ValeursContrat {
  const base = { ...design.clair, ...(mode === 'sombre' ? design.sombre : {}) };
  const valeurs: Record<TokenContrat, string> = { ...base };
  for (const token of TOKENS_CONTRAT) {
    const reglee = surcharges[token];
    if (reglee !== undefined) valeurs[token] = reglee;
  }
  if (surcharges[TOKEN_ACTION] !== undefined && surcharges[TOKEN_SUR_ACTION] === undefined) {
    valeurs[TOKEN_SUR_ACTION] = texteSur(surcharges[TOKEN_ACTION]);
  }
  return valeurs;
}

export function estPersonnalise(surcharges: Surcharges | undefined): boolean {
  return surcharges !== undefined && Object.values(surcharges).some((v) => v !== undefined);
}

export interface ParametresTokensCss {
  readonly nomSite: string;
  readonly titreRessource: string;
  readonly design: DesignContrat;
  readonly surcharges?: Surcharges;
}

/**
 * `tokens.css` livré : `:root` (clair, 12 tokens) puis `.dark` (8 couleurs). Le code livré n'utilise jamais
 * `dark:` : il lit ces variables, et le visiteur pose `.dark` sur <html> ou sur un parent (ADR 0008).
 */
export function genererTokensCss(parametres: ParametresTokensCss): string {
  const { nomSite, titreRessource, design, surcharges } = parametres;
  const clair = valeursDuDesign(design, 'clair', surcharges);
  const sombre = valeursDuDesign(design, 'sombre', surcharges);
  const personnalise = estPersonnalise(surcharges) ? ' (réglé par vous)' : '';
  const lignes = [
    '/*',
    `  ${nomSite} — tokens pour « ${titreRessource} »`,
    `  Design : ${design.nom}${personnalise}`,
    '  Importez ce fichier une fois dans styles.css, après ngshelf-theme.css si vous êtes sous Tailwind.',
    '  Sans lui, le composant garde ses valeurs de repli (design Planche, clair).',
    '  Mode sombre : ajoutez la classe .dark sur <html> ou sur un parent.',
    '*/',
    ':root {',
    ...TOKENS_CONTRAT.map((token) => `  ${token}: ${clair[token]};`),
    '}',
    '',
    '.dark {',
    ...TOKENS_CONTRAT.slice(0, NOMBRE_TOKENS_SOMBRES).map(
      (token) => `  ${token}: ${sombre[token]};`,
    ),
    '}',
  ];
  return `${lignes.join('\n')}\n`;
}

export type VarianteLivree = 'tailwind' | 'css';

export interface ParametresReadme {
  readonly nomSite: string;
  readonly titre: string;
  readonly description: string;
  readonly slug: string;
  readonly variante: VarianteLivree;
  readonly angularMin: string;
  readonly dependances: string;
  readonly usage: string;
}

const LIBELLE_VARIANTE: Record<VarianteLivree, string> = {
  tailwind: 'Tailwind CSS v4',
  css: 'CSS et tokens',
};

function installation(variante: VarianteLivree, slug: string): string {
  const copie = `1. Copiez ce dossier dans votre application, par exemple \`src/app/ui/${slug}/\`.`;
  const imports =
    variante === 'tailwind'
      ? '2. Tailwind CSS v4 doit être installé. Dans `styles.css`, juste après `@import "tailwindcss";`, importez `ngshelf-theme.css` (une fois pour tout le catalogue) puis `tokens.css`.'
      : '2. Importez `tokens.css` une fois dans `styles.css` si vous voulez les réglages choisis (sinon, le composant garde ses valeurs de repli).';
  return [
    copie,
    imports,
    '3. Ajoutez le composant aux `imports` du composant qui l’utilise.',
    '4. Mode sombre : ajoutez la classe `dark` sur `<html>`. Pour un autre sélecteur, remplacez `.dark` par le vôtre dans `tokens.css`.',
  ].join('\n');
}

export function genererReadme(p: ParametresReadme): string {
  return [
    `# ${p.titre}`,
    '',
    p.description,
    '',
    `Ressource du catalogue ${p.nomSite}, publiée sous licence MIT. Version du code : ${LIBELLE_VARIANTE[p.variante]}.`,
    '',
    '## Prérequis',
    '',
    `- Angular ${p.angularMin} ou plus récent`,
    `- Dépendances : ${p.dependances}`,
    '',
    '## Installer',
    '',
    installation(p.variante, p.slug),
    '',
    '## Utiliser',
    '',
    '```html',
    p.usage,
    '```',
    '',
  ].join('\n');
}

export function genererLicence(annee: number, titulaire: string): string {
  return `MIT License

Copyright (c) ${annee} ${titulaire}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}
