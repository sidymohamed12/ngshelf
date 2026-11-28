/**
 * Contrôles du SEO sur les pages prérendues (fonctions pures, utilisées par `npm run verifier:dist`).
 */

const BLOCS_JSON_LD = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script\s*>/gi;

/** Blocs JSON-LD qui ne sont pas du JSON valide, ou sans `@context` / `@type`. */
export function trouverJsonLdInvalides(html: string): string[] {
  const problemes: string[] = [];
  for (const [, contenu = ''] of html.matchAll(BLOCS_JSON_LD)) {
    try {
      const donnees: unknown = JSON.parse(contenu);
      const objet = donnees as Record<string, unknown> | null;
      if (objet === null || typeof objet !== 'object' || !objet['@context'] || !objet['@type']) {
        problemes.push('JSON-LD sans @context ou @type');
      }
    } catch (erreur) {
      problemes.push(`JSON-LD invalide : ${erreur instanceof Error ? erreur.message : 'erreur'}`);
    }
  }
  return problemes;
}

/** Vrai si la page demande à ne pas être indexée (`<meta name="robots" content="noindex…">`). */
export function estNoindex(html: string): boolean {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
}
