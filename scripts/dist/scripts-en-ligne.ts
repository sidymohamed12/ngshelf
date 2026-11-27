/**
 * Garde-fou de la CSP (ADR 0009) : le site déclare `script-src 'self'`, donc aucun script exécutable en
 * ligne ni attribut d'événement (`onclick=`…) ne doit sortir du build. Fonction pure sur un HTML.
 * Les blocs de données (`type="application/json"`, comme `ng-state` d'Angular) ne s'exécutent pas.
 */

const TYPES_DONNEES = ['application/json', 'application/ld+json', 'speculationrules', 'importmap'];
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const ATTRIBUT_EVENEMENT = /<[a-z][^>]*?\son[a-z]+\s*=/gi;

function attribut(attributs: string, nom: string): string | undefined {
  const motif = new RegExp(`(?:^|\\s)${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const trouve = motif.exec(attributs);
  return trouve ? (trouve[1] ?? trouve[2] ?? trouve[3]) : undefined;
}

export function trouverScriptsEnLigne(html: string): readonly string[] {
  const problemes: string[] = [];
  for (const [balise, attributs = '', contenu = ''] of html.matchAll(SCRIPT)) {
    if (attribut(attributs, 'src') !== undefined) continue;
    const type = attribut(attributs, 'type')?.toLowerCase();
    if (type !== undefined && TYPES_DONNEES.includes(type)) continue;
    if (contenu.trim() === '') continue;
    problemes.push(`script en ligne : ${balise.slice(0, 80)}`);
  }
  for (const [balise] of html.matchAll(ATTRIBUT_EVENEMENT)) {
    problemes.push(`attribut d'événement : ${balise.slice(0, 80)}`);
  }
  return problemes;
}
