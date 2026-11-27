import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TEXTES, TEXTES_LISTE } from '@core/i18n/textes.fr';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { PlancheComponent } from './planche.component';

const CARTE: EntreeIndex = {
  slug: 'carte-sejour',
  categorie: 'composant',
  type: 'carte',
  titre: { fr: 'Carte de séjour' },
  description: { fr: 'Une carte cliquable.' },
  secteurs: ['voyage'],
  tags: [],
  contratTokens: 1,
  animee: false,
  tailleCase: 'normale',
  statut: 'provisoire',
  ajouteLe: '2026-11-26',
};

const DESIGN: EntreeIndex = {
  ...CARTE,
  slug: 'fleuve',
  categorie: 'design',
  type: null,
  titre: { fr: 'Design Fleuve' },
  secteurs: [],
  statut: 'publie',
};

describe('PlancheComponent', () => {
  let fixture: ComponentFixture<PlancheComponent>;

  function afficher(
    entrees: readonly EntreeIndex[] | undefined,
    extra: { chargement?: boolean; erreur?: boolean } = {},
  ) {
    fixture = TestBed.createComponent(PlancheComponent);
    fixture.componentRef.setInput('entrees', entrees);
    fixture.componentRef.setInput('chargement', extra.chargement ?? false);
    fixture.componentRef.setInput('erreur', extra.erreur ?? false);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('annonce le chargement sans afficher de liste', () => {
    const el = afficher(undefined, { chargement: true });
    expect(el.querySelector('[role="status"]')?.textContent).toContain(TEXTES.etats.chargement);
    expect(el.querySelector('ul')).toBeNull();
  });

  it('affiche une erreur annoncée, avec un bouton qui relance le chargement', () => {
    const el = afficher(undefined, { erreur: true });
    const relance = vi.fn();
    fixture.componentInstance.reessayer.subscribe(relance);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(TEXTES.etats.erreurTitre);
    el.querySelector<HTMLButtonElement>('button')?.click();
    expect(relance).toHaveBeenCalledOnce();
  });

  it('affiche un état vide avec le texte de la page, sinon le texte générique', () => {
    expect(afficher([]).textContent).toContain(TEXTES_LISTE.videTitre);
    fixture.componentRef.setInput('titreVide', 'Pas encore de template');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pas encore de template');
  });

  it('affiche une case par ressource : lien de fiche, type, secteur, vignette décorative', () => {
    const el = afficher([CARTE]);
    const lien = el.querySelector<HTMLAnchorElement>('h3 a');
    expect(lien?.getAttribute('href')).toBe('/composants/carte/carte-sejour');
    expect(lien?.textContent).toContain('Carte de séjour');
    expect(el.querySelector('.ngs-badge')?.textContent).toContain('Carte');
    expect(el.querySelector('.ngs-badge--secteur')?.textContent).toContain('Voyage');
    expect(el.querySelector('.ngs-case__stage')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.ngs-case')?.classList).toContain('ngs-cat-composants');
  });

  it('décrit le lien de la case par la description de la ressource', () => {
    const el = afficher([CARTE]);
    const id = el.querySelector('h3 a')?.getAttribute('aria-describedby') ?? '';
    expect(el.querySelector(`#${id}`)?.textContent).toContain('Une carte cliquable.');
  });

  it('donne à la case la taille du registre et le badge « Animée »', () => {
    const el = afficher([{ ...CARTE, animee: true, tailleCase: 'large-haute' }]);
    const classes = el.querySelector('.ngs-case')?.classList;
    expect(classes).toContain('ngs-case--wide');
    expect(classes).toContain('ngs-case--tall');
    expect(el.querySelector('.ngs-badge--anime')?.textContent).toContain(TEXTES_LISTE.anime);
    expect(afficher([CARTE]).querySelector('.ngs-badge--anime')).toBeNull();
  });

  it('ne charge aucun aperçu live : pas d’iframe, de ressource embarquée ni d’image', () => {
    const el = afficher([CARTE, DESIGN]);
    expect(el.querySelector('iframe, img, object, embed')).toBeNull();
  });

  it('étire la grille à une colonne de moins quand la page a une colonne de filtres', () => {
    afficher([CARTE]);
    fixture.componentRef.setInput('avecFacettes', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ul.ngs-planche.catalogue-grille')).not.toBeNull();
  });

  it("n'ajoute aucun lien pour un design, qui n'a pas encore de fiche", () => {
    const el = afficher([DESIGN]);
    expect(el.querySelector('h3 a')).toBeNull();
    expect(el.querySelector('.ngs-case__open')).toBeNull();
    expect(el.querySelector('h3')?.textContent).toContain('Design Fleuve');
    expect(el.querySelector('.ngs-badge')?.textContent).toContain('Design');
  });
});
