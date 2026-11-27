import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TEXTES, TEXTES_LISTE } from '@core/i18n/textes.fr';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { ListeRessourcesComponent } from './liste-ressources.component';

const CARTE: EntreeIndex = {
  slug: 'carte-sejour',
  categorie: 'composant',
  type: 'carte',
  titre: { fr: 'Carte de séjour' },
  description: { fr: 'Une carte cliquable.' },
  secteurs: ['voyage'],
  tags: [],
  contratTokens: 1,
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

describe('ListeRessourcesComponent', () => {
  let fixture: ComponentFixture<ListeRessourcesComponent>;

  function afficher(
    entrees: readonly EntreeIndex[] | undefined,
    extra: { chargement?: boolean; erreur?: boolean } = {},
  ) {
    fixture = TestBed.createComponent(ListeRessourcesComponent);
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

  it('liste les ressources avec leur lien de fiche, leur type, leur secteur et le badge provisoire', () => {
    const el = afficher([CARTE]);
    const lien = el.querySelector<HTMLAnchorElement>('h3 a');
    expect(lien?.getAttribute('href')).toBe('/composants/carte/carte-sejour');
    expect(lien?.textContent).toContain('Carte de séjour');
    expect(el.textContent).toContain('Voyage');
    expect(el.textContent).toContain(TEXTES_LISTE.provisoire);
  });

  it('masque le badge de catégorie quand la page est déjà celle de la catégorie', () => {
    afficher([CARTE]);
    fixture.componentRef.setInput('afficherCategorie', false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '.ngs-badge:not(.ngs-badge--secteur):not(.ngs-badge--provisoire)',
      ),
    ).toBeNull();
  });

  it("n'ajoute aucun lien pour un design, qui n'a pas encore de fiche", () => {
    const el = afficher([DESIGN]);
    expect(el.querySelector('h3 a')).toBeNull();
    expect(el.querySelector('h3')?.textContent).toContain('Design Fleuve');
  });
});
