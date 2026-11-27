import { DOCUMENT, PLATFORM_ID, Service, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface OptionsCookie {
  /** Durée de vie en secondes ; sans valeur, cookie de session. */
  readonly dureeSecondes?: number;
}

const ATTRIBUTS_FIXES = 'Path=/; SameSite=Lax';

/**
 * Seul accès aux cookies du site (jamais localStorage ni sessionStorage).
 * Compatible prérendu : côté serveur, la lecture donne null et l'écriture ne fait rien ;
 * le site est statique, il n'y a pas de requête dont lire l'en-tête cookie.
 * Préférences seulement (non HttpOnly, aucune donnée personnelle).
 */
@Service()
export class CookieService {
  readonly #document = inject(DOCUMENT);
  readonly #estNavigateur = isPlatformBrowser(inject(PLATFORM_ID));

  lire(nom: string): string | null {
    if (!this.#estNavigateur) {
      return null;
    }
    for (const morceau of this.#document.cookie.split('; ')) {
      const separateur = morceau.indexOf('=');
      if (separateur > 0 && morceau.slice(0, separateur) === nom) {
        return decodeURIComponent(morceau.slice(separateur + 1));
      }
    }
    return null;
  }

  ecrire(nom: string, valeur: string, options: OptionsCookie = {}): void {
    if (!this.#estNavigateur) {
      return;
    }
    const attributs = [`${nom}=${encodeURIComponent(valeur)}`];
    if (options.dureeSecondes !== undefined) {
      attributs.push(`Max-Age=${options.dureeSecondes}`);
    }
    attributs.push(ATTRIBUTS_FIXES);
    if (this.#document.defaultView?.location.protocol === 'https:') {
      attributs.push('Secure');
    }
    this.#document.cookie = attributs.join('; ');
  }

  supprimer(nom: string): void {
    this.ecrire(nom, '', { dureeSecondes: 0 });
  }
}
