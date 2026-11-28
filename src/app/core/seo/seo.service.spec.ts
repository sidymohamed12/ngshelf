import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SITE } from '@core/config/site.config';
import { PageSeo } from './page-seo';
import { SeoService } from './seo.service';

const PAGE: PageSeo = {
  description: 'Une description',
  chemin: '/blocs',
  indexable: true,
  jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'NgShelf' }],
};

describe('SeoService', () => {
  let head: HTMLHeadElement;
  let service: SeoService;
  const urlInitiale = SITE.url;

  const meta = (cle: string): string | null =>
    head.querySelector(`meta[name="${cle}"], meta[property="${cle}"]`)?.getAttribute('content') ??
    null;
  const canonique = (): string | null =>
    head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
  const blocsLd = (): Element[] =>
    Array.from(head.querySelectorAll('script[type="application/ld+json"]'));

  beforeEach(() => {
    head = TestBed.inject(DOCUMENT).head;
    head.innerHTML = '';
    service = TestBed.inject(SeoService);
  });

  afterEach(() => {
    Object.assign(SITE, { url: urlInitiale });
  });

  it('pose description, Open Graph et Twitter Card avec le titre du routeur', () => {
    service.definirTitre('Blocs Angular — NgShelf');
    service.appliquer(PAGE);
    expect(meta('description')).toBe('Une description');
    expect(meta('og:title')).toBe('Blocs Angular — NgShelf');
    expect(meta('og:description')).toBe('Une description');
    expect(meta('og:type')).toBe('website');
    expect(meta('og:site_name')).toBe(SITE.nom);
    expect(meta('og:locale')).toBe('fr_FR');
    expect(meta('twitter:title')).toBe('Blocs Angular — NgShelf');
    expect(meta('twitter:description')).toBe('Une description');
  });

  it('écrit le titre avant ou après la page sans changer le résultat', () => {
    service.appliquer(PAGE);
    service.definirTitre('Titre');
    expect(meta('og:title')).toBe('Titre');
  });

  it('sans domaine : canonique relatif, ni og:url ni image de partage, carte « summary »', () => {
    Object.assign(SITE, { url: null });
    service.definirTitre('Titre');
    service.appliquer(PAGE);
    expect(canonique()).toBe('/blocs');
    expect(meta('og:url')).toBeNull();
    expect(meta('og:image')).toBeNull();
    expect(meta('twitter:image')).toBeNull();
    expect(meta('twitter:card')).toBe('summary');
  });

  it('avec un domaine : canonique, og:url et image de partage absolus, carte « summary_large_image »', () => {
    Object.assign(SITE, { url: 'https://exemple.test' });
    service.definirTitre('Titre');
    service.appliquer(PAGE);
    expect(canonique()).toBe('https://exemple.test/blocs');
    expect(meta('og:url')).toBe('https://exemple.test/blocs');
    expect(meta('og:image')).toBe('https://exemple.test/ngshelf-og.png');
    expect(meta('og:image:width')).toBe('1200');
    expect(meta('og:image:height')).toBe('630');
    expect(meta('og:image:alt')).toBeTruthy();
    expect(meta('twitter:image')).toBe('https://exemple.test/ngshelf-og.png');
    expect(meta('twitter:card')).toBe('summary_large_image');
  });

  it('remplace les balises d’une page par celles de la suivante, sans doublon', () => {
    service.appliquer(PAGE);
    service.appliquer({ ...PAGE, description: 'Autre', chemin: '/composants' });
    expect(head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(blocsLd()).toHaveLength(1);
    expect(meta('description')).toBe('Autre');
    expect(canonique()).toBe('/composants');
  });

  it('écrit chaque bloc JSON-LD dans un script de données, échappé et valide', () => {
    service.appliquer({
      ...PAGE,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'Thing', name: '</script><b>x' },
        { '@context': 'https://schema.org', '@type': 'WebSite' },
      ],
    });
    const blocs = blocsLd();
    expect(blocs).toHaveLength(2);
    expect(blocs[0].textContent).not.toContain('<');
    expect(JSON.parse(blocs[0].textContent ?? '')['name']).toBe('</script><b>x');
  });

  it('une page non indexable est noindex, sans canonique', () => {
    service.appliquer({ ...PAGE, indexable: false });
    expect(meta('robots')).toBe('noindex, follow');
    expect(canonique()).toBeNull();
  });

  it('une liste filtrée impose son canonique et son noindex, puis la page reprend la main', () => {
    service.appliquer({ ...PAGE, chemin: '/catalogue' });
    expect(canonique()).toBe('/catalogue');
    service.definirIndexation('/blocs', true);
    expect(canonique()).toBe('/blocs');
    expect(meta('robots')).toBe('noindex, follow');
    expect(meta('og:url')).toBeNull();
    service.retirerIndexation();
    expect(canonique()).toBe('/catalogue');
    expect(meta('robots')).toBeNull();
  });

  it('l’indexation d’une liste survit à un nouvel appliquer du routeur (ordre indifférent)', () => {
    service.definirIndexation('/blocs', true);
    service.appliquer({ ...PAGE, chemin: '/catalogue' });
    expect(canonique()).toBe('/blocs');
    expect(meta('robots')).toBe('noindex, follow');
  });
});
