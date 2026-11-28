import { DOCUMENT, Service, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { SITE } from '@core/config/site.config';
import { TEXTES_SEO } from '@core/i18n/textes-seo';
import { serialiserJsonLd } from './json-ld';
import { PageSeo } from './page-seo';
import {
  CHEMIN_IMAGE_PARTAGE,
  HAUTEUR_IMAGE_PARTAGE,
  LARGEUR_IMAGE_PARTAGE,
  urlAbsolue,
  urlCanonique,
} from './url-site';

const ROBOTS = 'robots';
const NOINDEX = 'noindex, follow';
const SELECTEUR_CANONIQUE = 'link[rel="canonical"]';
const SELECTEUR_JSON_LD = 'script[type="application/ld+json"][data-ngs-seo]';
const LOCALES_OG: Readonly<Record<string, string>> = { fr: 'fr_FR' };

/** Balises `<meta>` gérées par le service, pour les retirer d'un seul geste. */
const NOMS_META = ['description', 'twitter:card', 'twitter:title', 'twitter:description'] as const;
const PROPRIETES_META = [
  'og:type',
  'og:site_name',
  'og:locale',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
] as const;
const NOMS_IMAGE = ['twitter:image', 'twitter:image:alt'] as const;

/** Indexation imposée par une page de liste filtrée (`IndexationService`, ADR 0004 et 0012). */
interface Indexation {
  readonly chemin: string;
  readonly filtree: boolean;
}

/**
 * Seul propriétaire du `<head>` pour le référencement : description, canonique, `robots`, Open Graph,
 * Twitter Card et données structurées JSON-LD. Le titre vient du routeur (`TitreSeoStrategy`), qui appelle
 * aussi `appliquer` avec le SEO déclaré dans `data` de la route (`pages-seo.ts`).
 *
 * Le rendu part toujours de l'état complet (titre, page, indexation d'une liste filtrée) : l'ordre dans
 * lequel le routeur et un composant écrivent n'a donc aucun effet, et rien ne s'accumule d'une navigation à
 * l'autre. Fonctionne au prérendu comme dans le navigateur.
 */
@Service()
export class SeoService {
  readonly #meta = inject(Meta);
  readonly #document = inject(DOCUMENT);

  #titre = '';
  #page: PageSeo | null = null;
  #indexation: Indexation | null = null;

  definirTitre(titre: string): void {
    this.#titre = titre;
    this.#rendre();
  }

  appliquer(page: PageSeo): void {
    this.#page = page;
    this.#rendre();
  }

  /** Une liste filtrée (`?c=`, `?q=`…) : canonique vers le chemin visé, `noindex` si elle a des paramètres. */
  definirIndexation(chemin: string, filtree: boolean): void {
    this.#indexation = { chemin, filtree };
    this.#rendre();
  }

  /** La liste se détruit : le canonique et le `robots` redeviennent ceux de la page courante. */
  retirerIndexation(): void {
    this.#indexation = null;
    this.#rendre();
  }

  #rendre(): void {
    const page = this.#page;
    const chemin = this.#indexation?.chemin ?? (page?.indexable === false ? null : page?.chemin);
    const noindex = this.#indexation?.filtree === true || page?.indexable === false;

    this.#poserCanonique(chemin ?? null);
    if (noindex) this.#meta.updateTag({ name: ROBOTS, content: NOINDEX });
    else this.#meta.removeTag(`name="${ROBOTS}"`);

    this.#viderMeta();
    if (page) this.#poserMeta(page, chemin ?? null);
    this.#poserJsonLd(page?.jsonLd ?? []);
  }

  #poserMeta(page: PageSeo, chemin: string | null): void {
    const adresse = chemin === null ? null : urlAbsolue(chemin);
    const image = urlAbsolue(CHEMIN_IMAGE_PARTAGE);
    const langue = LOCALES_OG[SITE.langue];

    this.#nom('description', page.description);
    this.#propriete('og:type', 'website');
    this.#propriete('og:site_name', SITE.nom);
    if (langue) this.#propriete('og:locale', langue);
    this.#propriete('og:title', this.#titre);
    this.#propriete('og:description', page.description);
    if (adresse) this.#propriete('og:url', adresse);

    this.#nom('twitter:card', image ? 'summary_large_image' : 'summary');
    this.#nom('twitter:title', this.#titre);
    this.#nom('twitter:description', page.description);
    // Une image de partage exige une adresse absolue : sans domaine, elle est omise plutôt que fausse.
    if (image) {
      this.#propriete('og:image', image);
      this.#propriete('og:image:width', String(LARGEUR_IMAGE_PARTAGE));
      this.#propriete('og:image:height', String(HAUTEUR_IMAGE_PARTAGE));
      this.#propriete('og:image:alt', TEXTES_SEO.imageAlt);
      this.#nom('twitter:image', image);
      this.#nom('twitter:image:alt', TEXTES_SEO.imageAlt);
    }
  }

  #viderMeta(): void {
    for (const nom of [...NOMS_META, ...NOMS_IMAGE]) this.#meta.removeTag(`name="${nom}"`);
    for (const propriete of PROPRIETES_META) this.#meta.removeTag(`property="${propriete}"`);
  }

  #nom(nom: string, content: string): void {
    this.#meta.updateTag({ name: nom, content });
  }

  #propriete(property: string, content: string): void {
    this.#meta.updateTag({ property, content });
  }

  #poserCanonique(chemin: string | null): void {
    const tete = this.#document.head;
    let lien = tete.querySelector(SELECTEUR_CANONIQUE);
    if (chemin === null) {
      lien?.remove();
      return;
    }
    if (!lien) {
      lien = this.#document.createElement('link');
      lien.setAttribute('rel', 'canonical');
      tete.appendChild(lien);
    }
    lien.setAttribute('href', urlCanonique(chemin));
  }

  /**
   * Un `<script type="application/ld+json">` est un bloc de données : il ne s'exécute pas, donc la CSP
   * `script-src 'self'` ne le bloque pas. Le texte est ajouté en `textContent` et sérialisé sans `<`.
   */
  #poserJsonLd(blocs: PageSeo['jsonLd']): void {
    const tete = this.#document.head;
    for (const ancien of Array.from(tete.querySelectorAll(SELECTEUR_JSON_LD))) ancien.remove();
    for (const bloc of blocs) {
      const script = this.#document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-ngs-seo', '');
      script.textContent = serialiserJsonLd(bloc);
      tete.appendChild(script);
    }
  }
}
