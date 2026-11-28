import {
  cheminCategorie,
  cheminRessource,
  cheminSecteur,
  cheminType,
} from '@core/registre/chemins';
import type { Compteurs, EntreeIndex } from '../../src/app/shared/models/index-catalogue.model.ts';
import {
  ENTETE_SITEMAP,
  adressesDuSitemap,
  ajouterSitemapRobots,
  cheminsSitemap,
  construireSitemap,
  validerUrlSite,
  type SourceSitemap,
} from './sitemap.ts';

function entree(partiel: Partial<EntreeIndex> & Pick<EntreeIndex, 'slug'>): EntreeIndex {
  return {
    categorie: 'composant',
    type: 'carte',
    titre: { fr: partiel.slug },
    description: { fr: 'd' },
    secteurs: [],
    tags: [],
    contratTokens: 1,
    animee: false,
    tailleCase: 'normale',
    statut: 'publie',
    ajouteLe: '2026-11-26',
    ...partiel,
  };
}

const COMPTEURS: Compteurs = {
  total: 4,
  categories: { composant: 2, bloc: 1, template: 0, design: 1 },
  types: { carte: 1, champ: 1, hero: 1 },
  secteurs: { restaurant: 2 },
  options: { reglables: 4, animees: 0 },
};

const SOURCE: SourceSitemap = {
  compteurs: COMPTEURS,
  index: {
    composant: [
      entree({ slug: 'carte-sejour' }),
      entree({ slug: 'champ-email', type: 'champ' }),
      entree({ slug: 'ancien', statut: 'deprecie' }),
    ],
    bloc: [entree({ slug: 'hero-restaurant', categorie: 'bloc', type: 'hero' })],
    template: [],
    design: [entree({ slug: 'fleuve', categorie: 'design', type: null })],
  },
};

describe('cheminsSitemap', () => {
  const chemins = cheminsSitemap(SOURCE);

  it('liste les pages fixes, les catégories, types et secteurs non vides, et les fiches', () => {
    expect(chemins).toEqual([
      '/',
      '/catalogue',
      '/a-propos',
      '/composants',
      '/blocs',
      '/designs',
      '/composants/champ',
      '/composants/carte',
      '/blocs/hero',
      '/secteurs/restaurant',
      '/composants/carte/carte-sejour',
      '/composants/champ/champ-email',
      '/blocs/hero/hero-restaurant',
    ]);
  });

  it('exclut les catégories vides, les ressources dépréciées, les designs sans fiche, /apercu et les paramètres', () => {
    expect(chemins).not.toContain('/templates');
    expect(chemins.join(' ')).not.toContain('ancien');
    expect(chemins.join(' ')).not.toContain('fleuve');
    expect(chemins.join(' ')).not.toMatch(/apercu|\?|404/);
  });

  it('produit les mêmes chemins que core/registre/chemins.ts (la route réelle du site)', () => {
    expect(chemins).toContain(cheminCategorie('composant'));
    expect(chemins).toContain(cheminCategorie('design'));
    expect(chemins).toContain(cheminType('composant', 'champ'));
    expect(chemins).toContain(cheminType('bloc', 'hero'));
    expect(chemins).toContain(cheminSecteur('restaurant'));
    expect(chemins).toContain(cheminRessource('bloc', 'hero', 'hero-restaurant'));
  });
});

describe('construireSitemap', () => {
  it('écrit un XML bien formé avec des adresses absolues', () => {
    const xml = construireSitemap('https://exemple.test', ['/', '/blocs?a=1&b=2']);
    expect(xml.startsWith(ENTETE_SITEMAP)).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(adressesDuSitemap(xml)).toEqual([
      'https://exemple.test/',
      'https://exemple.test/blocs?a=1&amp;b=2',
    ]);
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
    expect(() => new DOMParser().parseFromString(xml, 'application/xml')).not.toThrow();
    expect(
      new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror'),
    ).toBeNull();
  });

  it('refuse un sitemap au-delà de la limite du protocole', () => {
    const trop = Array.from({ length: 50_001 }, (_, i) => `/p${i}`);
    expect(() => construireSitemap('https://exemple.test', trop)).toThrow(/trop grand/);
  });
});

describe('validerUrlSite', () => {
  it('accepte null (pas de domaine) et une adresse https sans barre finale', () => {
    expect(validerUrlSite(null)).toBeNull();
    expect(validerUrlSite('https://exemple.fr')).toBe('https://exemple.fr');
  });

  it('refuse http, la barre finale, un chemin ou une valeur vide', () => {
    for (const mauvaise of [
      'http://exemple.fr',
      'https://exemple.fr/',
      'https://exemple.fr/a',
      '',
    ]) {
      expect(() => validerUrlSite(mauvaise), mauvaise).toThrow(/SITE\.url/);
    }
  });
});

describe('ajouterSitemapRobots', () => {
  it('ajoute la ligne Sitemap et reste idempotent', () => {
    const une = ajouterSitemapRobots('User-agent: *\nAllow: /\n', 'https://exemple.test');
    expect(une).toBe('User-agent: *\nAllow: /\n\nSitemap: https://exemple.test/sitemap.xml\n');
    expect(ajouterSitemapRobots(une, 'https://exemple.test')).toBe(une);
  });

  it('remplace une ancienne ligne Sitemap', () => {
    const robots = ajouterSitemapRobots(
      'User-agent: *\nSitemap: https://ancien.test/sitemap.xml\n',
      'https://neuf.test',
    );
    expect(robots).not.toContain('ancien');
    expect(robots.match(/Sitemap:/g)).toHaveLength(1);
  });
});
