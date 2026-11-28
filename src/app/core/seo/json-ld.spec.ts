import { SITE, SiteConfig } from '@core/config/site.config';
import {
  ficheCode,
  filAriane,
  pageAPropos,
  pageCollection,
  serialiserJsonLd,
  siteWeb,
} from './json-ld';

const AVEC_DOMAINE: SiteConfig = { ...SITE, url: 'https://exemple.test' };
const SANS_DOMAINE: SiteConfig = { ...SITE, url: null };

describe('données structurées', () => {
  it('WebSite : nom, langue, auteur et sameAs venus de la config ; url seulement avec un domaine', () => {
    const avec = siteWeb(AVEC_DOMAINE);
    expect(avec['@type']).toBe('WebSite');
    expect(avec['url']).toBe('https://exemple.test/');
    expect(avec['inLanguage']).toBe(SITE.langue);
    const auteur = avec['author'] as Record<string, unknown>;
    expect(auteur['@type']).toBe('Person');
    expect(auteur['name']).toBe(SITE.auteur.nomComplet);
    expect(auteur['sameAs']).toEqual([
      SITE.auteur.github,
      SITE.auteur.linkedin,
      SITE.auteur.instagram,
      SITE.auteur.tiktok,
    ]);
    expect(JSON.stringify(auteur)).not.toContain(SITE.auteur.email);
    expect('url' in siteWeb(SANS_DOMAINE)).toBe(false);
  });

  it('BreadcrumbList : positions à partir de 1, adresses absolues, dernier maillon sans adresse', () => {
    const fil = filAriane(
      [{ nom: 'Accueil', chemin: '/' }, { nom: 'Blocs', chemin: '/blocs' }, { nom: 'Navbar' }],
      'https://exemple.test',
    );
    expect(fil['@type']).toBe('BreadcrumbList');
    expect(fil['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://exemple.test/' },
      { '@type': 'ListItem', position: 2, name: 'Blocs', item: 'https://exemple.test/blocs' },
      { '@type': 'ListItem', position: 3, name: 'Navbar' },
    ]);
  });

  it('BreadcrumbList sans domaine : aucun item (une adresse relative serait invalide)', () => {
    const fil = filAriane([{ nom: 'Accueil', chemin: '/' }, { nom: 'Blocs' }], null);
    expect(JSON.stringify(fil)).not.toContain('"item"');
  });

  it('CollectionPage et AboutPage décrivent la page', () => {
    const page = { nom: 'Blocs', description: 'Des blocs', chemin: '/blocs' };
    expect(pageCollection(page, AVEC_DOMAINE)).toMatchObject({
      '@type': 'CollectionPage',
      name: 'Blocs',
      url: 'https://exemple.test/blocs',
    });
    expect(pageAPropos(page, AVEC_DOMAINE)['@type']).toBe('AboutPage');
  });

  it('SoftwareSourceCode : licence MIT, accessible gratuitement, dates et mots-clés de la fiche', () => {
    const code = ficheCode(
      {
        nom: 'Boutons',
        description: 'Des boutons',
        chemin: '/composants/bouton/boutons',
        motsCles: ['bouton', 'action'],
        ajouteLe: '2026-11-26',
        auteur: { nom: 'Sidy' },
        angularMin: '22.0',
      },
      AVEC_DOMAINE,
    );
    expect(code).toMatchObject({
      '@type': 'SoftwareSourceCode',
      name: 'Boutons',
      url: 'https://exemple.test/composants/bouton/boutons',
      programmingLanguage: 'TypeScript',
      runtimePlatform: 'Angular 22.0',
      license: 'https://spdx.org/licenses/MIT.html',
      isAccessibleForFree: true,
      keywords: 'bouton, action',
      dateCreated: '2026-11-26',
    });
    expect('dateModified' in code).toBe(false);
  });

  it('échappe « < » pour qu’aucun texte ne ferme le script, et reste du JSON valide', () => {
    const texte = serialiserJsonLd({ '@type': 'Thing', name: '</script><!-- x' });
    expect(texte).not.toContain('<');
    expect(JSON.parse(texte)).toEqual({ '@type': 'Thing', name: '</script><!-- x' });
  });
});
