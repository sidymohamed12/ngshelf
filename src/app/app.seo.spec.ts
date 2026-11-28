import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SITE } from '@core/config/site.config';
import { TEXTES_SEO } from '@core/i18n/textes-seo';
import { RegistreService } from '@core/registre/registre.service';
import { cheminCategorie, cheminSecteur, cheminType } from '@core/registre/chemins';
import { TitreSeoStrategy } from '@core/seo/titre-seo.strategy';
import { CATEGORIES, CATEGORIES_TYPEES } from '@shared/models/taxonomie.model';
import { routes } from './app.routes';

const LONGUEUR_DESCRIPTION_MAX = 160;

interface BalisesPage {
  readonly url: string;
  readonly titre: string;
  readonly description: string | null;
  readonly canonique: string | null;
  readonly robots: string | null;
  readonly blocsLd: readonly string[];
}

/** Tous les chemins prérendus et indexables (mêmes règles que le sitemap), tirés du vrai registre. */
async function pagesIndexables(): Promise<string[]> {
  const registre = TestBed.inject(RegistreService);
  const pages = ['/', '/catalogue', '/a-propos'];
  for (const categorie of CATEGORIES) {
    if (registre.compteurs.categories[categorie] > 0) pages.push(cheminCategorie(categorie));
  }
  for (const categorie of CATEGORIES_TYPEES) {
    for (const type of registre.typesNonVides(categorie)) pages.push(cheminType(categorie, type));
  }
  for (const secteur of registre.secteursNonVides()) pages.push(cheminSecteur(secteur));
  for (const p of await registre.parametresPrerendu()) {
    pages.push(`/${p.categorie}/${p.type}/${p.slug}`);
  }
  return pages;
}

describe('SEO des pages (titres et descriptions uniques)', () => {
  let document: Document;

  let harness: RouterTestingHarness;

  async function lire(url: string): Promise<BalisesPage> {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    const tete = document.head;
    return {
      url,
      titre: document.title,
      description: tete.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      canonique: tete.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      robots: tete.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      blocsLd: Array.from(tete.querySelectorAll('script[type="application/ld+json"]')).map(
        (b) => b.textContent ?? '',
      ),
    };
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: TitleStrategy, useExisting: TitreSeoStrategy },
      ],
    });
    document = TestBed.inject(DOCUMENT);
    document.head.innerHTML = '';
    harness = await RouterTestingHarness.create();
  });

  it('chaque page indexable a un titre et une description propres, un canonique à son chemin et du JSON-LD valide', async () => {
    const urls = await pagesIndexables();
    const lues: BalisesPage[] = [];
    for (const url of urls) lues.push(await lire(url));

    const titres = lues.map((p) => p.titre);
    const descriptions = lues.map((p) => p.description);
    expect(new Set(titres).size, 'titres uniques').toBe(lues.length);
    expect(new Set(descriptions).size, 'descriptions uniques').toBe(lues.length);
    for (const page of lues) {
      expect(page.titre, page.url).toContain(SITE.nom);
      expect(page.description, page.url).toBeTruthy();
      expect(page.description?.length ?? 0, page.url).toBeLessThanOrEqual(LONGUEUR_DESCRIPTION_MAX);
      expect(page.canonique, page.url).toBe(page.url);
      expect(page.robots, page.url).toBeNull();
      expect(page.blocsLd.length, page.url).toBeGreaterThan(0);
      for (const bloc of page.blocsLd) {
        const donnees = JSON.parse(bloc) as Record<string, unknown>;
        expect(donnees['@context'], page.url).toBe('https://schema.org');
        expect(donnees['@type'], page.url).toBeTruthy();
      }
    }
  }, 60_000);

  it('l’accueil porte WebSite, les fiches SoftwareSourceCode et un fil d’Ariane', async () => {
    const accueil = await lire('/');
    expect(accueil.blocsLd.map((b) => JSON.parse(b)['@type'])).toEqual(['WebSite']);
    const [fiche] = await TestBed.inject(RegistreService).parametresPrerendu();
    const page = await lire(`/${fiche.categorie}/${fiche.type}/${fiche.slug}`);
    expect(page.blocsLd.map((b) => JSON.parse(b)['@type'])).toEqual([
      'SoftwareSourceCode',
      'BreadcrumbList',
    ]);
  });

  it('la 404, un type inconnu et une fiche inconnue sont noindex, sans canonique ni JSON-LD', async () => {
    for (const url of [
      '/404',
      '/une/adresse/inconnue/de/plus',
      '/composants/navbar',
      '/secteurs/jardinage',
      '/composants/bouton/nexiste-pas',
    ]) {
      const page = await lire(url);
      expect(page.robots, url).toBe('noindex, follow');
      expect(page.canonique, url).toBeNull();
      expect(page.blocsLd, url).toHaveLength(0);
      expect(page.description, url).toBe(TEXTES_SEO.introuvable);
    }
  });

  it('une catégorie sans ressource est noindex et le dit dans sa description', async () => {
    const page = await lire('/templates');
    expect(page.robots).toBe('noindex, follow');
    expect(page.description).toContain('aucune ressource');
  });

  it('/catalogue?c=blocs : canonique /blocs et noindex ; la page sans paramètre reste indexable (ADR 0012)', async () => {
    const filtree = await lire('/catalogue?c=blocs');
    expect(filtree.robots).toBe('noindex, follow');
    expect(filtree.canonique).toBe('/blocs');
    const sans = await lire('/catalogue');
    expect(sans.robots).toBeNull();
    expect(sans.canonique).toBe('/catalogue');
  });
});
