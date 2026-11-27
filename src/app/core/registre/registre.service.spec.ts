import { TestBed } from '@angular/core/testing';
import { REGISTRE_PROVISOIRE } from './registre.provisoire';
import { RegistreService, cheminFiche } from './registre.service';

describe('RegistreService', () => {
  const service = () => TestBed.inject(RegistreService);

  it('retrouve une ressource par les trois segments de son URL', () => {
    const r = service().trouver({
      categorie: 'composants',
      type: 'interrupteur',
      slug: 'interrupteur',
    });
    expect(r?.titre.fr).toBe('Interrupteur');
  });

  it("ne retrouve rien quand un segment ne correspond pas (type d'une autre catégorie, slug inconnu)", () => {
    expect(
      service().trouver({ categorie: 'blocs', type: 'interrupteur', slug: 'interrupteur' }),
    ).toBeUndefined();
    expect(
      service().trouver({ categorie: 'composants', type: 'interrupteur', slug: 'inconnu' }),
    ).toBeUndefined();
    expect(service().trouver({})).toBeUndefined();
  });

  it('donne un paramètre de prérendu par ressource, avec la catégorie au pluriel', () => {
    const params = service().parametresPrerendu();
    expect(params).toHaveLength(REGISTRE_PROVISOIRE.length);
    expect(params).toContainEqual({
      categorie: 'blocs',
      type: 'navbar',
      slug: 'navbar-restaurant',
    });
  });

  it('construit le chemin de fiche /<categorie>/<type>/<slug>', () => {
    const [premiere] = REGISTRE_PROVISOIRE;
    expect(cheminFiche(premiere)).toBe('/composants/interrupteur/interrupteur');
  });

  it('respecte les règles du registre : slugs uniques, au plus 3 secteurs et 8 tags, sans dépendance', () => {
    const slugs = REGISTRE_PROVISOIRE.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const r of REGISTRE_PROVISOIRE) {
      expect(r.secteurs.length).toBeLessThanOrEqual(3);
      expect(r.tags.length).toBeLessThanOrEqual(8);
      expect(r.description.fr.length).toBeLessThanOrEqual(160);
      expect(r.dependances).toEqual({ npm: [], ressources: [] });
    }
  });
});
