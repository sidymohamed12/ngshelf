import { TestBed } from '@angular/core/testing';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { Categorie, TYPES_PAR_CATEGORIE } from '@shared/models/taxonomie.model';
import { cheminCategorie, cheminFiche, cheminSecteur, cheminType } from './chemins';
import { CHARGEUR_INDEX, ChargeurIndex } from './registre.donnees';
import { RegistreService, estVisible } from './registre.service';

function entree(partiel: Partial<EntreeIndex> & Pick<EntreeIndex, 'slug'>): EntreeIndex {
  return {
    categorie: 'composant',
    type: 'carte',
    titre: { fr: partiel.slug },
    description: { fr: 'Description' },
    secteurs: [],
    tags: [],
    contratTokens: 1,
    animee: false,
    tailleCase: 'normale',
    statut: 'publie',
    ajouteLe: '2026-01-01',
    ...partiel,
  };
}

const FAUX_INDEX: Record<Categorie, readonly EntreeIndex[]> = {
  composant: [
    entree({ slug: 'carte-a', secteurs: ['voyage'] }),
    entree({ slug: 'carte-b', statut: 'deprecie' }),
    entree({ slug: 'bouton-a', type: 'bouton' }),
  ],
  bloc: [entree({ slug: 'nav-a', categorie: 'bloc', type: 'navbar', secteurs: ['voyage'] })],
  template: [],
  design: [entree({ slug: 'fleuve', categorie: 'design', type: null })],
};

describe('RegistreService', () => {
  let appels: Categorie[];
  let echecs: number;

  function service(): RegistreService {
    appels = [];
    echecs = 0;
    const chargeur: ChargeurIndex = async (categorie) => {
      appels.push(categorie);
      if (echecs > 0) {
        echecs -= 1;
        throw new Error('réseau coupé');
      }
      return FAUX_INDEX[categorie];
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CHARGEUR_INDEX, useValue: chargeur }],
    });
    return TestBed.inject(RegistreService);
  }

  it("charge l'index d'une catégorie une seule fois", async () => {
    const registre = service();
    await registre.indexDe('composant');
    await registre.indexDe('composant');
    expect(appels).toEqual(['composant']);
  });

  it('ne mémorise pas un chargement qui échoue : on peut réessayer', async () => {
    const registre = service();
    echecs = 1;
    await expect(registre.indexDe('bloc')).rejects.toThrow('réseau coupé');
    await expect(registre.indexDe('bloc')).resolves.toHaveLength(1);
    expect(appels).toEqual(['bloc', 'bloc']);
  });

  it("liste les ressources d'un type sans les dépréciées", async () => {
    const slugs = (await service().duType('composant', 'carte')).map((e) => e.slug);
    expect(slugs).toEqual(['carte-a']);
  });

  it("liste les ressources d'un secteur, toutes catégories confondues", async () => {
    const slugs = (await service().duSecteur('voyage')).map((e) => e.slug);
    expect(slugs).toEqual(['carte-a', 'nav-a']);
  });

  it('retrouve une fiche par les trois segments de son URL, y compris une ressource dépréciée', async () => {
    const registre = service();
    const trouvee = await registre.trouver({
      categorie: 'composants',
      type: 'carte',
      slug: 'carte-b',
    });
    expect(trouvee?.slug).toBe('carte-b');
    expect(estVisible(trouvee as EntreeIndex)).toBe(false);
  });

  it('ne retrouve rien quand un segment ne correspond pas, ni pour un design', async () => {
    const registre = service();
    expect(
      await registre.trouver({ categorie: 'blocs', type: 'carte', slug: 'carte-a' }),
    ).toBeUndefined();
    expect(
      await registre.trouver({ categorie: 'composants', type: 'carte', slug: 'zz' }),
    ).toBeUndefined();
    expect(
      await registre.trouver({ categorie: 'designs', type: 'x', slug: 'fleuve' }),
    ).toBeUndefined();
    expect(await registre.trouver({})).toBeUndefined();
  });

  it('donne un paramètre de prérendu par fiche typée, sans les designs', async () => {
    const params = await service().parametresPrerendu();
    expect(params).toHaveLength(4);
    expect(params).toContainEqual({ categorie: 'blocs', type: 'navbar', slug: 'nav-a' });
    expect(params.some((p) => p.slug === 'fleuve')).toBe(false);
  });
});

describe('RegistreService avec les compteurs générés', () => {
  it('ne retient pour le prérendu que des types connus de leur catégorie', () => {
    TestBed.configureTestingModule({});
    const registre = TestBed.inject(RegistreService);
    for (const categorie of ['composant', 'bloc', 'template'] as const) {
      const types: readonly string[] = TYPES_PAR_CATEGORIE[categorie];
      for (const type of registre.typesNonVides(categorie)) expect(types).toContain(type);
    }
    expect(registre.compteurs.total).toBeGreaterThan(0);
  });
});

describe('chemins', () => {
  it('fabrique les URL du catalogue (ADR 0004)', () => {
    expect(cheminCategorie('composant')).toBe('/composants');
    expect(cheminType('bloc', 'navbar')).toBe('/blocs/navbar');
    expect(cheminSecteur('restaurant')).toBe('/secteurs/restaurant');
    expect(cheminFiche(entree({ slug: 'carte-a' }))).toBe('/composants/carte/carte-a');
  });

  it("n'a pas de fiche pour un design", () => {
    expect(cheminFiche(entree({ slug: 'fleuve', categorie: 'design', type: null }))).toBeNull();
  });
});
