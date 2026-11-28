import { DOCUMENT } from '@angular/common';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TEXTES, TEXTES_CATALOGUE } from '@core/i18n/textes.fr';
import { CHARGEUR_INDEX, ChargeurIndex, chargerIndexGenere } from '@core/registre/registre.donnees';
import compteurs from '@generated/registre/compteurs.json';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { routes } from '../../../app.routes';

/** Nombre de ressources du vrai registre du dépôt (le build du registre l'écrit : il grandit avec lui). */
const TOTAL = compteurs.total;

/** La page /catalogue et ses filtres, avec le vrai registre du dépôt. */
describe('page catalogue', () => {
  let harness: RouterTestingHarness;

  async function ouvrir(url: string, chargeur?: ChargeurIndex): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        ...(chargeur ? [{ provide: CHARGEUR_INDEX, useValue: chargeur }] : []),
      ],
    });
    harness = await RouterTestingHarness.create(url);
    await stabiliser();
  }

  async function stabiliser(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
    harness.detectChanges();
  }

  const page = (): HTMLElement => document.querySelector('main') ?? document.body;
  const slugs = (): string[] =>
    [...page().querySelectorAll('li.ngs-case')].map((c) => c.getAttribute('data-slug') ?? '');
  const statut = (): string =>
    page().querySelector('[role="status"][aria-live]')?.textContent ?? '';
  const meta = (nom: string): string | null =>
    TestBed.inject(DOCUMENT).head.querySelector(`meta[name="${nom}"]`)?.getAttribute('content') ??
    null;
  const url = (): string => TestBed.inject(Router).url;

  function cocher(selecteur: string): void {
    const champ = page().querySelector<HTMLInputElement>(selecteur);
    if (!champ) throw new Error(`Introuvable : ${selecteur}`);
    champ.click();
  }

  it('affiche toutes les ressources et le titre de la page', async () => {
    await ouvrir('/catalogue');
    expect(page().querySelector('h1')?.textContent).toBe(TEXTES.pages.catalogue.h1);
    expect(slugs()).toHaveLength(TOTAL);
    expect(statut()).toBe(`${TOTAL} ressources`);
  });

  it('lit les filtres dans l’URL : type, secteur et option animée, avec leurs compteurs', async () => {
    await ouvrir('/catalogue?secteur=restaurant&animees=1');
    expect(slugs().sort()).toEqual(['hero-restaurant', 'navbar-restaurant']);
    expect(statut()).toBe('2 ressources');
    const puces = [...page().querySelectorAll('.ngs-filtre-actif')].map((p) =>
      p.textContent?.trim(),
    );
    expect(puces).toEqual(['Restaurant', TEXTES_CATALOGUE.animees]);
    expect(
      page().querySelector<HTMLInputElement>('input[name="secteur"][value="restaurant"]')?.checked,
    ).toBe(true);
  });

  it('adapte le titre quand le filtre désigne un seul type ou secteur', async () => {
    await ouvrir('/catalogue?type=hero');
    expect(page().querySelector('h1')?.textContent).toBe('Hero Angular');
    await harness.navigateByUrl('/catalogue?secteur=voyage');
    await stabiliser();
    expect(page().querySelector('h1')?.textContent).toBe('Secteur : Voyage');
  });

  it('écrit le filtre coché dans l’URL, sans entrée d’historique, et met la liste à jour', async () => {
    await ouvrir('/catalogue');
    const avant = history.length;
    cocher('input[name="secteur"][value="voyage"]');
    await stabiliser();
    expect(url()).toBe('/catalogue?secteur=voyage');
    expect(history.length).toBe(avant);
    expect(slugs()).toContain('carte-sejour');
    cocher('input[name="type"][value="carte"]');
    await stabiliser();
    expect(url()).toBe('/catalogue?type=carte&secteur=voyage');
  });

  it('change de catégorie en retirant les types qui n’en font pas partie', async () => {
    await ouvrir('/catalogue?type=hero,bouton');
    cocher('input[name="famille"][value="composant"]');
    await stabiliser();
    expect(url()).toBe('/catalogue?c=composants&type=bouton');
    expect(slugs()).toEqual(['boutons']);
  });

  it('compte chaque facette avec les autres filtres, et grise une valeur sans résultat', async () => {
    await ouvrir('/catalogue?secteur=restaurant');
    const option = (valeur: string) =>
      page()
        .querySelector<HTMLElement>(`input[name="famille"][value="${valeur}"]`)
        ?.closest('label');
    expect(option('bloc')?.querySelector('.ngs-option__compte')?.textContent).toBe('2');
    expect(option('composant')?.classList).toContain('is-vide');
    expect(option('')?.querySelector('.ngs-option__compte')?.textContent).toBe('2');
  });

  it('filtre par la recherche après une courte pause de frappe, et la met dans l’URL', async () => {
    await ouvrir('/catalogue');
    const champ = page().querySelector<HTMLInputElement>('#filtre') as HTMLInputElement;
    champ.value = 'calend';
    champ.dispatchEvent(new Event('input'));
    expect(url()).toBe('/catalogue');
    await new Promise((resolve) => setTimeout(resolve, 300));
    await stabiliser();
    expect(url()).toBe('/catalogue?q=calend');
    expect(slugs()).toEqual(['calendrier']);
  });

  it('trie de A à Z', async () => {
    await ouvrir('/catalogue?c=composants&tri=az');
    expect(slugs()).toEqual([
      'boutons',
      'calendrier',
      'carte-sejour',
      'champ-email',
      'curseur',
      'interrupteur',
      'notifications',
    ]);
    expect(page().querySelector<HTMLSelectElement>('#tri')?.value).toBe('az');
  });

  it('retire un filtre depuis sa puce, puis efface tout', async () => {
    await ouvrir('/catalogue?secteur=restaurant&animees=1');
    page().querySelector<HTMLButtonElement>('.ngs-filtre-actif')?.click();
    await stabiliser();
    expect(url()).toBe('/catalogue?animees=1');
    cocher('input[name="secteur"][value="voyage"]');
    await stabiliser();
    [...page().querySelectorAll<HTMLButtonElement>('.ngs-filtres-actifs button')]
      .find((b) => b.textContent?.includes(TEXTES_CATALOGUE.filtresEffacer))
      ?.click();
    await stabiliser();
    expect(url()).toBe('/catalogue');
    expect(slugs()).toHaveLength(TOTAL);
  });

  it('annonce l’absence de résultat et propose d’effacer les filtres', async () => {
    await ouvrir('/catalogue?q=zzzz');
    expect(slugs()).toEqual([]);
    expect(page().querySelector('.ngs-state')?.textContent).toContain(
      TEXTES_CATALOGUE.videTitre('zzzz'),
    );
    page().querySelector<HTMLButtonElement>('.ngs-state button')?.click();
    await stabiliser();
    expect(url()).toBe('/catalogue');
    expect(slugs()).toHaveLength(TOTAL);
  });

  it('ignore les paramètres inconnus au lieu d’échouer', async () => {
    await ouvrir('/catalogue?type=zzz&secteur=lune&c=chaises&tri=hasard');
    expect(slugs()).toHaveLength(TOTAL);
  });

  it('reste indexable sans filtre, passe en noindex avec un filtre', async () => {
    await ouvrir('/catalogue');
    const doc = TestBed.inject(DOCUMENT);
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      '/catalogue',
    );
    expect(meta('robots')).toBeNull();
    cocher('input[name="secteur"][value="voyage"]');
    await stabiliser();
    expect(meta('robots')).toBe('noindex, follow');
  });

  it('pointe le canonique vers la page de chemin que les filtres décrivent (ADR 0012)', async () => {
    const canonique = (): string | null | undefined =>
      TestBed.inject(DOCUMENT).head.querySelector('link[rel="canonical"]')?.getAttribute('href');
    await ouvrir('/catalogue?c=blocs');
    expect(meta('robots')).toBe('noindex, follow');
    expect(canonique()).toBe('/blocs');
    await harness.navigateByUrl('/catalogue?c=blocs&type=navbar');
    await stabiliser();
    expect(canonique()).toBe('/blocs/navbar');
    await harness.navigateByUrl('/catalogue?secteur=voyage');
    await stabiliser();
    expect(canonique()).toBe('/secteurs/voyage');
    await harness.navigateByUrl('/catalogue?secteur=voyage,restaurant');
    await stabiliser();
    expect(canonique()).toBe('/catalogue');
  });

  it('retire le canonique en quittant la page de liste', async () => {
    await ouvrir('/catalogue');
    await harness.navigateByUrl('/a-propos');
    await stabiliser();
    expect(TestBed.inject(DOCUMENT).head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('annonce le chargement, puis une erreur avec « Réessayer » quand l’index ne se charge pas', async () => {
    let echec = true;
    const chargeur: ChargeurIndex = async (categorie) => {
      if (echec) throw new Error('réseau coupé');
      return chargerIndexGenere(categorie);
    };
    await ouvrir('/catalogue', chargeur);
    expect(page().querySelector('[role="alert"]')?.textContent).toContain(TEXTES.etats.erreurTitre);
    // les facettes restent là, avec les compteurs globaux
    expect(page().querySelectorAll('.ngs-facette')).toHaveLength(4);
    echec = false;
    page().querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    await stabiliser();
    expect(slugs()).toHaveLength(TOTAL);
  });

  it('montre le squelette tant que l’index se charge', async () => {
    let finir: () => void = () => undefined;
    const attente = new Promise<void>((resolve) => (finir = resolve));
    const chargeur: ChargeurIndex = async (categorie) => {
      await attente;
      return chargerIndexGenere(categorie);
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: CHARGEUR_INDEX, useValue: chargeur },
      ],
    });
    harness = await RouterTestingHarness.create('/catalogue');
    harness.detectChanges();
    expect(page().querySelector('[role="status"] .ngs-skeleton')).not.toBeNull();
    expect(statut()).toBe(TEXTES.etats.chargement);
    finir();
    await stabiliser();
    expect(slugs()).toHaveLength(TOTAL);
  });
});

describe('page catalogue avec beaucoup de ressources', () => {
  const NOMBRE = 30;
  const beaucoup: EntreeIndex[] = Array.from({ length: NOMBRE }, (_, i) => ({
    slug: `carte-${String(i).padStart(2, '0')}`,
    categorie: 'composant',
    type: 'carte',
    titre: { fr: `Carte ${String(i).padStart(2, '0')}` },
    description: { fr: 'Description' },
    secteurs: [],
    tags: [],
    contratTokens: 1,
    animee: false,
    statut: 'publie',
    ajouteLe: '2026-01-01',
  }));

  it('montre 24 cases puis ajoute les suivantes avec « Afficher plus »', async () => {
    const chargeur: ChargeurIndex = async (categorie) =>
      categorie === 'composant' ? beaucoup : [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: CHARGEUR_INDEX, useValue: chargeur },
      ],
    });
    const harness = await RouterTestingHarness.create('/catalogue');
    await TestBed.inject(ApplicationRef).whenStable();
    harness.detectChanges();
    const racine = document.querySelector('main') as HTMLElement;
    expect(racine.querySelectorAll('li.ngs-case')).toHaveLength(24);
    expect(racine.querySelector('[role="status"][aria-live]')?.textContent).toBe(
      TEXTES_CATALOGUE.page(24, '30 ressources'),
    );
    const plus = [...racine.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes(TEXTES_CATALOGUE.plus),
    );
    plus?.click();
    harness.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    harness.detectChanges();
    expect(racine.querySelectorAll('li.ngs-case')).toHaveLength(NOMBRE);
    expect(racine.textContent).not.toContain(TEXTES_CATALOGUE.plus);
  });
});
